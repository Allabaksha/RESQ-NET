/**
 * Movement Service for RESQ-NET
 * ------------------------------------------------
 * Simulates the live movement of a dispatched agency unit from its current
 * location to the incident location while its responseStatus is "En Route".
 *
 * Honest framing: locations remain SELF-REPORTED by agencies. This service
 * only visualizes the unit's estimated path while traveling (straight-line
 * interpolation between the last reported position and the incident), which
 * is the standard "ETA / en-route tracking" pattern in dispatch software.
 * The final position is persisted back to the agency document on arrival.
 *
 * Socket events emitted:
 *   movement:started      { agencyId, name, incidentId, from, to, tripSeconds, etaSeconds, startedAt }
 *   agency:positionUpdate { agencyId, name, coordinates, progress, remainingKm, etaSeconds }
 *   movement:ended        { agencyId, coordinates, arrivedAt, tripSeconds, interrupted? }
 */

const TICK_MS = 1500; // broadcast interval

// agencyId -> active movement state
const activeMovements = new Map();

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Haversine distance in kilometers
function distanceKm(from, to) {
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;
  const dLat = toRad(toLat - fromLat);
  const dLng = toRad(toLng - fromLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Start interpolating an agency unit from its current position to the incident.
 * @param {object} opts
 * @param {object} opts.io            Socket.IO server instance
 * @param {string} opts.agencyId
 * @param {string} opts.agencyName
 * @param {[number, number]} opts.from   [lng, lat]
 * @param {[number, number]} opts.to     [lng, lat]
 * @param {string} opts.incidentId
 * @param {Function} [opts.onArrive]     async (finalCoords, { arrivedAt, tripSeconds }) => {}
 */
function startMovement({ io, agencyId, agencyName, from, to, incidentId, onArrive }) {
  stopMovement(agencyId, io);

  const dist = distanceKm(from, to);
  // Demo pacing: more steps for longer trips, clamped between 6 and 24 ticks
  const steps = Math.max(6, Math.min(24, Math.round(dist * 1.2)));
  const tripSeconds = steps * (TICK_MS / 1000);
  const startedAt = Date.now();

  io.emit('movement:started', {
    agencyId,
    name: agencyName,
    incidentId,
    from,
    to,
    tripSeconds,
    etaSeconds: tripSeconds,
    startedAt
  });

  let step = 0;
  let currentCoords = from;

  const timer = setInterval(() => {
    step += 1;
    const t = step / steps;
    const lng = from[0] + (to[0] - from[0]) * t;
    const lat = from[1] + (to[1] - from[1]) * t;
    currentCoords = [lng, lat];
    const remaining = 1 - t;

    io.emit('agency:positionUpdate', {
      agencyId,
      name: agencyName,
      coordinates: currentCoords,
      progress: t,
      remainingKm: +(dist * remaining).toFixed(2),
      etaSeconds: Math.max(0, Math.round(tripSeconds * remaining))
    });

    if (step >= steps) {
      clearInterval(timer);
      activeMovements.delete(agencyId);
      io.emit('movement:ended', {
        agencyId,
        coordinates: currentCoords,
        arrivedAt: Date.now(),
        tripSeconds
      });
      if (typeof onArrive === 'function') {
        onArrive(currentCoords, { arrivedAt: Date.now(), tripSeconds }).catch((err) =>
          console.error('[MovementService] onArrive error:', err.message)
        );
      }
    }
  }, TICK_MS);

  activeMovements.set(agencyId, { timer, currentCoords, incidentId });
}

/**
 * Stop a movement early (e.g. unit reports On Scene / Completed).
 * Emits movement:ended so clients remove the route line.
 */
function stopMovement(agencyId, io) {
  const active = activeMovements.get(agencyId);
  if (!active) return false;

  clearInterval(active.timer);
  activeMovements.delete(agencyId);

  if (io) {
    io.emit('movement:ended', {
      agencyId,
      coordinates: active.currentCoords,
      arrivedAt: Date.now(),
      tripSeconds: 0,
      interrupted: true
    });
  }
  return active.currentCoords || null;
}

/** Stop every movement targeting a given incident (e.g. incident closed). */
function stopMovementsForIncident(incidentId, io) {
  let stopped = 0;
  for (const [agencyId, state] of activeMovements.entries()) {
    if (state.incidentId && state.incidentId.toString() === incidentId.toString()) {
      stopMovement(agencyId, io);
      stopped += 1;
    }
  }
  return stopped;
}

function isMoving(agencyId) {
  return activeMovements.has(agencyId);
}

module.exports = {
  startMovement,
  stopMovement,
  stopMovementsForIncident,
  isMoving
};
