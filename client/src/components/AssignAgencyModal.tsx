import React, { useEffect, useState } from 'react';
import { X, Users, MapPin, Search, CheckCircle2, ShieldAlert, Building2 } from 'lucide-react';
import { Incident, Agency } from '../types';
import { agencyApi } from '../services/api';
import { StatusBadge } from './StatusBadge';

interface AssignAgencyModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onAssign: (incidentId: string, agencyIds: string[]) => Promise<void>;
}

export const AssignAgencyModal: React.FC<AssignAgencyModalProps> = ({
  incident,
  isOpen,
  onClose,
  onAssign
}) => {
  const [nearbyAgencies, setNearbyAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState(25); // default 25 km
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && incident?.location?.coordinates) {
      fetchGeospatialAgencies();
    }
  }, [isOpen, incident, radiusKm]);

  const fetchGeospatialAgencies = async () => {
    if (!incident?.location?.coordinates) return;
    try {
      setLoading(true);
      const [lng, lat] = incident.location.coordinates;
      const suggestedTypes = incident.aiAnalysis?.suggestedResources?.join(',') || '';
      
      const agencies = await agencyApi.getNearby({
        lng,
        lat,
        radius: radiusKm * 1000, // convert km to meters
        type: suggestedTypes,
        status: 'Available'
      });

      setNearbyAgencies(agencies);
    } catch (err) {
      console.error('Failed geospatial MongoDB query:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !incident) return null;

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleConfirmAssignment = async () => {
    if (selectedIds.length === 0) return;
    try {
      setSubmitting(true);
      await onAssign(incident._id, selectedIds);
      setSelectedIds([]);
      onClose();
    } catch (err) {
      console.error('Failed to assign agencies:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-gray-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-dark-800/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                Geospatial Agency Dispatch & Assignment
              </h2>
              <p className="text-xs text-gray-400 font-mono">
                MongoDB 2dsphere Geospatial Indexing &bull; $near Radius Query
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Controls & Filter Banner */}
        <div className="p-6 border-b border-gray-800/80 bg-dark-950 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="text-xs font-mono text-gray-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Target: <strong className="text-white">{incident.aiAnalysis?.incidentType || 'Disaster Area'}</strong>
            </div>

            {/* Radius selector */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-gray-400">Search Radius:</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="bg-dark-800 border border-gray-700 text-gray-200 rounded-lg px-2.5 py-1 focus:outline-none focus:border-red-500"
              >
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={100}>100 km</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-purple-300 font-mono bg-purple-950/40 p-2.5 rounded-xl border border-purple-900/40">
            <Search className="w-4 h-4 text-purple-400" />
            Querying MongoDB 2dsphere index for Available agencies matching: [{incident.aiAnalysis?.suggestedResources?.join(', ') || 'All Types'}]
          </div>
        </div>

        {/* Agency List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="text-center py-12 space-y-2">
              <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-mono text-gray-400">Running MongoDB $near geospatial query...</p>
            </div>
          ) : nearbyAgencies.length === 0 ? (
            <div className="text-center py-12 space-y-2 bg-dark-950/50 rounded-2xl border border-dashed border-gray-800">
              <Building2 className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-gray-300">No matching Available agencies found within {radiusKm} km.</p>
              <p className="text-xs text-gray-500 font-mono">Try increasing search radius or checking agency status directory.</p>
            </div>
          ) : (
            nearbyAgencies.map((agency) => {
              const isSelected = selectedIds.includes(agency._id);
              return (
                <div
                  key={agency._id}
                  onClick={() => toggleSelect(agency._id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-red-950/30 border-red-500/80 shadow-lg shadow-red-900/20'
                      : 'bg-dark-800/60 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-100 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-400" />
                        {agency.name}
                      </span>
                      <StatusBadge type="agencyStatus" value={agency.status} size="sm" />
                    </div>
                    <p className="text-xs text-gray-400 font-mono">
                      Type: <strong className="text-emerald-300">{agency.type}</strong> &bull; Reg: {agency.registrationId}
                    </p>
                    <p className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                      <span>Personnel: {agency.capacity?.personnel || 0}</span> &bull; 
                      <span>Vehicles: {agency.capacity?.vehicles || 0}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                      isSelected ? 'bg-red-600 border-red-500 text-white' : 'border-gray-700 bg-dark-900'
                    }`}>
                      {isSelected && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-dark-950 flex items-center justify-between gap-4">
          <span className="text-xs font-mono text-gray-400">
            {selectedIds.length} Agency Unit(s) Selected
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmAssignment}
              disabled={submitting || selectedIds.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              <Users className="w-4 h-4" />
              {submitting ? 'Dispatching Units...' : 'Confirm & Dispatch Selected Units'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
