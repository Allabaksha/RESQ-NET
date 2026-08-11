import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Incident, Agency } from '../types';
import { ShieldAlert, Building2, MapPin, Phone, Users, Truck, Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useMovements, MovementUnit } from '../context/MovementContext';

interface MapViewProps {
  incidents?: Incident[];
  agencies?: Agency[];
  selectedIncident?: Incident | null;
  selectedAgency?: Agency | null;
  onSelectIncident?: (incident: Incident) => void;
  onSelectAgency?: (agency: Agency) => void;
  onSelectLocation?: (coords: [number, number]) => void; // [lng, lat]
  pickMode?: boolean;
  searchCenter?: [number, number] | null; // [lat, lng]
  searchRadiusMeters?: number;
}

const toLatLng = (c: [number, number]): [number, number] => [c[1], c[0]];

// "12:30" style countdown/elapsed formatting
const formatClock = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const truncateName = (name: string, max = 26) =>
  name.length > max ? name.slice(0, max - 1) + '…' : name;

// Custom HTML Icons for Leaflet
const createIncidentIcon = (severity?: string) => {
  let colorClass = 'bg-amber-500 text-dark-900';
  if (severity === 'Critical') colorClass = 'bg-red-600 text-white marker-pulse-critical';
  else if (severity === 'High') colorClass = 'bg-amber-500 text-dark-900';
  else if (severity === 'Moderate') colorClass = 'bg-blue-500 text-white';

  const html = `
    <div className="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center shadow-lg border-2 border-white/20 font-bold text-xs">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const createAgencyIcon = (status?: string) => {
  let colorClass = 'bg-emerald-500 text-dark-900 marker-pulse-agency';
  if (status === 'Busy') colorClass = 'bg-amber-500 text-dark-900';
  else if (status === 'Unavailable') colorClass = 'bg-gray-600 text-white';

  const html = `
    <div className="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center shadow-lg border-2 border-white/20 font-bold text-xs">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12h12"/><path d="M6 7h12"/><path d="M6 17h12"/></svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

// Distinct pulsing orange "vehicle en route" marker with unit name + live ETA
const createMovingUnitIcon = (name: string, etaSeconds: number, remainingKm: number) => {
  const html = `
    <div class="flex flex-col items-center">
      <div class="relative">
        <div class="w-9 h-9 rounded-lg bg-orange-500 text-dark-900 marker-pulse-moving flex items-center justify-center shadow-xl border-2 border-white/40">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18h-5"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
        </div>
        <div class="absolute -inset-1 rounded-xl border-2 border-orange-400/70 animate-ping"></div>
      </div>
      <span class="mt-0.5 px-1.5 py-0.5 rounded-md bg-dark-900/95 border border-orange-500/50 text-[9px] font-bold text-orange-300 whitespace-nowrap shadow-lg tracking-wide">${truncateName(name)}</span>
      <span class="mt-0.5 px-1.5 py-0.5 rounded-md bg-dark-900/95 border border-emerald-500/50 text-[9px] font-bold text-emerald-300 whitespace-nowrap shadow-lg font-mono">ETA ${formatClock(etaSeconds)} · ${remainingKm.toFixed(1)} km</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [38, 74],
    iconAnchor: [19, 70],
    popupAnchor: [0, -64]
  });
};

const LocationPickerMarker: React.FC<{ onPick: (coords: [number, number]) => void }> = ({ onPick }) => {
  const [position, setPosition] = useState<[number, number] | null>(null);

  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onPick([e.latlng.lng, e.latlng.lat]); // pass [lng, lat]
    }
  });

  return position ? (
    <Marker 
      position={position} 
      icon={L.divIcon({
        html: `<div class="w-8 h-8 rounded-full bg-red-500 text-white border-2 border-white flex items-center justify-center shadow-xl animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
        className: 'custom-picker-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      })}
    >
      <Popup>
        <div className="p-1 font-sans text-xs">
          <p className="font-bold text-red-400">Selected Location</p>
          <p className="font-mono text-gray-300">Lat: {position[0].toFixed(5)}, Lng: {position[1].toFixed(5)}</p>
        </div>
      </Popup>
    </Marker>
  ) : null;
};

// Smoothly animates a dispatched unit between the server's position ticks
// (the server broadcasts a new position every ~1.5s; we lerp in between).
const MovingUnitMarker: React.FC<{ unit: MovementUnit }> = ({ unit }) => {
  const [pos, setPos] = useState<[number, number]>(unit.current || unit.from);
  const posRef = useRef<[number, number]>(unit.current || unit.from);
  const targetRef = useRef<[number, number]>(unit.current || unit.from);

  useEffect(() => {
    targetRef.current = unit.current || unit.from;
  }, [unit.current, unit.from]);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const cur = posRef.current;
      const tgt = targetRef.current;
      const dx = tgt[0] - cur[0];
      const dy = tgt[1] - cur[1];
      if (Math.abs(dx) > 1e-8 || Math.abs(dy) > 1e-8) {
        const next: [number, number] = [cur[0] + dx * 0.12, cur[1] + dy * 0.12];
        posRef.current = next;
        setPos(next);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <Marker position={toLatLng(pos)} icon={createMovingUnitIcon(unit.name, unit.etaSeconds, unit.remainingKm)}>
      <Popup>
        <div className="p-1 font-sans text-xs space-y-1">
          <p className="font-bold text-orange-400 flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5" />
            {unit.name}
          </p>
          <p className="text-[11px] text-gray-300 font-semibold">🚨 En Route to incident scene</p>
          <p className="text-[11px] font-mono text-emerald-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            ETA {formatClock(unit.etaSeconds)} · {unit.remainingKm.toFixed(1)} km away
          </p>
          <p className="text-[10px] font-mono text-gray-400">
            Live: [{pos[0].toFixed(5)}, {pos[1].toFixed(5)}]
          </p>
        </div>
      </Popup>
    </Marker>
  );
};

export const MapView: React.FC<MapViewProps> = ({
  incidents = [],
  agencies = [],
  selectedIncident,
  selectedAgency,
  onSelectIncident,
  onSelectAgency,
  onSelectLocation,
  pickMode = false,
  searchCenter,
  searchRadiusMeters
}) => {
  // Default map center: India (Mumbai default [19.0760, 72.8777])
  const defaultCenter: [number, number] = [19.0760, 72.8777];

  // Live en-route movements come from the shared MovementContext
  const { units } = useMovements();
  const movingUnits = Object.values(units).filter(u => !u.arrived);

  return (
    <div className="relative w-full h-full min-h-[450px] rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
      {pickMode && (
        <div className="absolute top-4 left-4 z-[500] bg-dark-900/90 backdrop-blur-md px-4 py-2 rounded-xl border border-red-500/50 shadow-xl flex items-center gap-2 text-xs font-semibold text-red-400">
          <MapPin className="w-4 h-4 animate-bounce" />
          Click anywhere on the map to pin incident location
        </div>
      )}

      {/* En-route units overlay badge */}
      {movingUnits.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[500] bg-dark-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-orange-500/50 shadow-xl flex items-center gap-2 text-[11px] font-bold font-mono text-orange-300">
          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          {movingUnits.length} UNIT{movingUnits.length > 1 ? 'S' : ''} EN ROUTE
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* OpenStreetMap Dark Carto Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Location Picker when in pickMode */}
        {pickMode && onSelectLocation && (
          <LocationPickerMarker onPick={onSelectLocation} />
        )}

        {/* Search radius circle for geospatial query demo */}
        {searchCenter && searchRadiusMeters && (
          <Circle
            center={searchCenter}
            radius={searchRadiusMeters}
            pathOptions={{
              color: '#ef4444',
              fillColor: '#ef4444',
              fillOpacity: 0.12,
              dashArray: '6, 6'
            }}
          />
        )}

        {/* Incident Markers */}
        {incidents.map((incident) => {
          if (!incident.location || !incident.location.coordinates) return null;
          const [lng, lat] = incident.location.coordinates;
          return (
            <Marker
              key={incident._id}
              position={[lat, lng]}
              icon={createIncidentIcon(incident.aiAnalysis?.severity || incident.priority)}
              eventHandlers={{
                click: () => onSelectIncident && onSelectIncident(incident)
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 font-sans max-w-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-700 pb-1.5">
                    <span className="font-bold text-sm text-red-400 flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4" />
                      {incident.aiAnalysis?.incidentType || 'Disaster Incident'}
                    </span>
                    <StatusBadge type="severity" value={incident.aiAnalysis?.severity || incident.priority} size="sm" />
                  </div>

                  <p className="text-xs text-gray-300 line-clamp-2">
                    {incident.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-gray-400 font-mono">
                    <span>Status: {incident.status}</span>
                    <span>{incident.assignedAgencies?.length || 0} Agencies</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Agency Markers */}
        {agencies.map((agency) => {
          // Skip agencies currently en route — rendered as live moving units below
          const live = units[agency._id];
          if (live && !live.arrived) return null;
          if (!agency.currentLocation || !agency.currentLocation.coordinates) return null;
          const [lng, lat] = agency.currentLocation.coordinates;
          return (
            <Marker
              key={agency._id}
              position={[lat, lng]}
              icon={createAgencyIcon(agency.status)}
              eventHandlers={{
                click: () => onSelectAgency && onSelectAgency(agency)
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 font-sans max-w-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-700 pb-1.5">
                    <span className="font-bold text-sm text-emerald-400 flex items-center gap-1.5">
                      <Building2 className="w-4 h-4" />
                      {agency.name}
                    </span>
                    <StatusBadge type="agencyStatus" value={agency.status} size="sm" />
                  </div>

                  <div className="text-xs space-y-1 text-gray-300">
                    <p className="font-semibold text-gray-200">{agency.type}</p>
                    {agency.contact?.phone && (
                      <p className="flex items-center gap-1 text-[11px] text-gray-400 font-mono">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {agency.contact.phone}
                      </p>
                    )}
                    <div className="flex items-center gap-3 pt-1 text-[11px] font-mono text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-blue-400" />
                        {agency.capacity?.personnel || 0} Personnel
                      </span>
                      <span className="flex items-center gap-1">
                        <Truck className="w-3 h-3 text-amber-400" />
                        {agency.capacity?.vehicles || 0} Vehicles
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* En-route route lines: station → incident */}
        {movingUnits.map(unit => (
          <Polyline
            key={`route-${unit.agencyId}`}
            positions={[toLatLng(unit.from), toLatLng(unit.to)]}
            pathOptions={{
              color: '#f97316',
              weight: 3,
              opacity: 0.75,
              dashArray: '8, 8'
            }}
          />
        ))}

        {/* En-route animated unit markers */}
        {movingUnits.map(unit => (
          <MovingUnitMarker key={`moving-${unit.agencyId}`} unit={unit} />
        ))}
      </MapContainer>
    </div>
  );
};
