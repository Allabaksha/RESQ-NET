import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { agencyApi, incidentApi } from '../services/api';
import { Agency, Incident } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { MapView } from '../components/MapView';
import { Building2, Signal, MapPin, CheckCircle, XCircle, Navigation, ShieldAlert, Clock, RefreshCw } from 'lucide-react';

export const AgencyPortalPage: React.FC = () => {
  const { user } = useAuth();
  const [agency, setAgency] = useState<Agency | null>(null);
  const [assignedIncidents, setAssignedIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState<[number, number]>([72.8777, 19.0760]);
  const [status, setStatus] = useState<'Available' | 'Busy' | 'Unavailable'>('Available');

  const fetchAgencyData = async () => {
    try {
      setLoading(true);
      let agencyId = typeof user?.agency === 'object' ? (user.agency as any)?._id : user?.agency;
      
      // Fallback: load first agency if user agency is missing
      if (!agencyId) {
        const all = await agencyApi.getAll();
        if (all.length > 0) {
          agencyId = all[0]._id;
        }
      }

      if (agencyId) {
        const data = await agencyApi.getById(agencyId);
        setAgency(data);
        setStatus(data.status);
        if (data.currentLocation?.coordinates) {
          setCoords(data.currentLocation.coordinates);
        }

        // Fetch dispatches
        const allIncidents = await incidentApi.getAll();
        const assigned = allIncidents.filter(inc => 
          inc.assignedAgencies?.some(a => (typeof a.agency === 'object' ? a.agency._id : a.agency) === agencyId)
        );
        setAssignedIncidents(assigned);
      }
    } catch (err) {
      console.error('Failed to load agency portal data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencyData();
  }, [user]);

  const handleStatusChange = async (newStatus: 'Available' | 'Busy' | 'Unavailable') => {
    if (!agency) return;
    try {
      await agencyApi.updateStatus(agency._id, newStatus);
      setStatus(newStatus);
      setAgency({ ...agency, status: newStatus });
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleLocationUpdate = async (newCoords: [number, number]) => {
    if (!agency) return;
    try {
      await agencyApi.updateLocation(agency._id, newCoords);
      setCoords(newCoords);
      setAgency({
        ...agency,
        currentLocation: { type: "Point", coordinates: newCoords }
      });
    } catch (err) {
      console.error('Location update failed:', err);
    }
  };

  const handleDispatchResponse = async (incidentId: string, responseStatus: string) => {
    if (!agency) return;
    try {
      await incidentApi.respondDispatch(incidentId, agency._id, responseStatus);
      fetchAgencyData();
    } catch (err) {
      console.error('Failed to send dispatch response:', err);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center font-mono text-gray-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading Agency Operational Portal...
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="py-20 text-center bg-dark-900 rounded-3xl border border-gray-800 p-8 max-w-md mx-auto">
        <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-gray-200">Agency Profile Not Linked</h2>
        <p className="text-xs text-gray-400 font-mono mt-1">
          Your account is not linked to a verified agency. Please register or select an agency unit.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-emerald-900/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-white flex items-center gap-2">
              <Signal className="w-6 h-6 text-emerald-400 animate-pulse" />
              {agency.name}
            </h1>
            <StatusBadge type="agencyStatus" value={agency.status} size="sm" />
          </div>
          <p className="text-xs text-gray-400 font-mono">
            Type: <strong className="text-emerald-300">{agency.type}</strong> &bull; Registration: {agency.registrationId} &bull; Base Coordinates: [{agency.baseLocation.coordinates.join(', ')}]
          </p>
        </div>

        {/* Live Status Toggle */}
        <div className="bg-dark-900/90 p-2 rounded-2xl border border-gray-800 flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400 pl-2">Self-Report Live Status:</span>
          {(['Available', 'Busy', 'Unavailable'] as const).map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all font-semibold ${
                status === s
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-dark-800 text-gray-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Live Location Updater */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 rounded-3xl border border-gray-800 space-y-3">
            <h2 className="text-sm font-mono font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Self-Reported Live Location
            </h2>
            <p className="text-xs text-gray-400 font-mono">
              Click on the map below to update your live GPS coordinates in MongoDB for geospatial dispatches.
            </p>

            <div className="h-64 rounded-2xl overflow-hidden border border-gray-800">
              <MapView
                agencies={[agency]}
                pickMode={true}
                onSelectLocation={(newCoords) => handleLocationUpdate(newCoords)}
              />
            </div>

            <div className="pt-2 text-xs font-mono text-emerald-400 flex items-center justify-between">
              <span>Current Coordinates: [{coords[0].toFixed(4)}, {coords[1].toFixed(4)}]</span>
              <span className="text-gray-500">Updated: Just now</span>
            </div>
          </div>
        </div>

        {/* Right Column: Assigned Dispatches */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Active Incident Dispatches ({assignedIncidents.length})
            </h2>
            <button
              onClick={fetchAgencyData}
              className="p-1.5 rounded-lg bg-dark-800 border border-gray-700 text-gray-300 hover:text-white transition-colors text-xs flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>

          <div className="space-y-4">
            {assignedIncidents.length === 0 ? (
              <div className="p-12 text-center bg-dark-900/60 rounded-3xl border border-dashed border-gray-800">
                <ShieldAlert className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-300">No pending or active dispatches.</p>
                <p className="text-xs text-gray-500 font-mono mt-1">Your agency is standby ready for nearest emergency dispatches.</p>
              </div>
            ) : (
              assignedIncidents.map(inc => {
                const assignment = inc.assignedAgencies.find(a => (typeof a.agency === 'object' ? a.agency._id : a.agency) === agency._id);
                const responseStatus = assignment?.responseStatus || 'Pending';

                return (
                  <div key={inc._id} className="glass-panel p-5 rounded-2xl border border-gray-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-red-400">{inc.aiAnalysis?.incidentType || 'Emergency Dispatch'}</h3>
                        <p className="text-xs text-gray-400 font-mono">{inc.address}</p>
                      </div>
                      <StatusBadge type="responseStatus" value={responseStatus} size="sm" />
                    </div>

                    <p className="text-xs text-gray-300 bg-dark-900 p-3 rounded-xl border border-gray-800">
                      "{inc.description}"
                    </p>

                    <div className="pt-2 border-t border-gray-800 flex items-center justify-between gap-2 flex-wrap text-xs">
                      <span className="text-[11px] font-mono text-gray-400">
                        Assigned At: {assignment?.assignedAt ? new Date(assignment.assignedAt).toLocaleTimeString() : 'Recently'}
                      </span>

                      <div className="flex items-center gap-2 flex-wrap">
                        {responseStatus === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleDispatchResponse(inc._id, 'Accepted')}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Accept Dispatch
                            </button>
                            <button
                              onClick={() => handleDispatchResponse(inc._id, 'Rejected')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </>
                        )}

                        {responseStatus === 'Accepted' && (
                          <button
                            onClick={() => handleDispatchResponse(inc._id, 'En Route')}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                          >
                            <Navigation className="w-3.5 h-3.5" />
                            Mark En Route
                          </button>
                        )}

                        {responseStatus === 'En Route' && (
                          <button
                            onClick={() => handleDispatchResponse(inc._id, 'On Scene')}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                            Mark On Scene
                          </button>
                        )}

                        {responseStatus === 'On Scene' && (
                          <button
                            onClick={() => handleDispatchResponse(inc._id, 'Completed')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Mark Mission Completed
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
