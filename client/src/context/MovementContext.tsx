import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useSocket } from './SocketContext';

/**
 * Live state of a dispatched unit traveling to an incident scene.
 * Coordinates are [lng, lat] (GeoJSON order).
 */
export interface MovementUnit {
  agencyId: string;
  name: string;
  incidentId: string;
  from: [number, number];
  to: [number, number];
  current: [number, number];
  startedAt: number;
  tripSeconds: number;
  etaSeconds: number;
  remainingKm: number;
  progress: number; // 0..1
  arrived: boolean;
  arrivedAt?: number;
}

interface MovementContextType {
  /** Active (or recently arrived) unit movements keyed by agencyId */
  units: Record<string, MovementUnit>;
}

const MovementContext = createContext<MovementContextType>({ units: {} });

// How long an "arrived" entry stays visible after the movement ends
const ARRIVED_RETENTION_MS = 45000;

export const MovementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const [units, setUnits] = useState<Record<string, MovementUnit>>({});
  const cleanupTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!socket) return;

    const onMovementStarted = (m: {
      agencyId: string;
      name?: string;
      incidentId: string;
      from: [number, number];
      to: [number, number];
      tripSeconds: number;
      etaSeconds: number;
      startedAt: number;
    }) => {
      setUnits(prev => ({
        ...prev,
        [m.agencyId]: {
          agencyId: m.agencyId,
          name: m.name || 'Rescue Unit',
          incidentId: m.incidentId,
          from: m.from,
          to: m.to,
          current: m.from,
          startedAt: m.startedAt || Date.now(),
          tripSeconds: m.tripSeconds || 0,
          etaSeconds: m.etaSeconds || m.tripSeconds || 0,
          remainingKm: 0,
          progress: 0,
          arrived: false
        }
      }));
    };

    const onPositionUpdate = (p: {
      agencyId: string;
      coordinates: [number, number];
      progress: number;
      remainingKm: number;
      etaSeconds: number;
    }) => {
      setUnits(prev => {
        const u = prev[p.agencyId];
        if (!u) return prev;
        return {
          ...prev,
          [p.agencyId]: {
            ...u,
            current: p.coordinates,
            progress: p.progress,
            remainingKm: p.remainingKm,
            etaSeconds: p.etaSeconds
          }
        };
      });
    };

    const onMovementEnded = (e: { agencyId: string; coordinates: [number, number]; arrivedAt: number }) => {
      setUnits(prev => {
        const u = prev[e.agencyId];
        if (!u) return prev;
        return {
          ...prev,
          [e.agencyId]: {
            ...u,
            arrived: true,
            arrivedAt: e.arrivedAt || Date.now(),
            current: e.coordinates || u.current,
            etaSeconds: 0,
            remainingKm: 0,
            progress: 1
          }
        };
      });

      // Keep the arrival info visible briefly, then drop the entry
      if (cleanupTimers.current[e.agencyId]) window.clearTimeout(cleanupTimers.current[e.agencyId]);
      cleanupTimers.current[e.agencyId] = window.setTimeout(() => {
        setUnits(prev => {
          const next = { ...prev };
          delete next[e.agencyId];
          return next;
        });
      }, ARRIVED_RETENTION_MS);
    };

    socket.on('movement:started', onMovementStarted);
    socket.on('agency:positionUpdate', onPositionUpdate);
    socket.on('movement:ended', onMovementEnded);

    return () => {
      socket.off('movement:started', onMovementStarted);
      socket.off('agency:positionUpdate', onPositionUpdate);
      socket.off('movement:ended', onMovementEnded);
      Object.values(cleanupTimers.current).forEach(t => window.clearTimeout(t));
      cleanupTimers.current = {};
    };
  }, [socket]);

  return (
    <MovementContext.Provider value={{ units }}>
      {children}
    </MovementContext.Provider>
  );
};

export const useMovements = () => useContext(MovementContext);
