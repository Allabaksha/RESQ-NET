import React, { useEffect, useState } from 'react';
import { MapView } from '../components/MapView';
import { IncidentCard } from '../components/IncidentCard';
import { StatusBadge } from '../components/StatusBadge';
import { IncidentReportModal } from '../components/IncidentReportModal';
import { AIReviewModal } from '../components/AIReviewModal';
import { AssignAgencyModal } from '../components/AssignAgencyModal';
import { dashboardApi, incidentApi } from '../services/api';
import { Incident, Agency, DashboardSummary } from '../types';
import { useSocket } from '../context/SocketContext';
import { ShieldAlert, Building2, Radio, Activity, Sparkles, Filter, RefreshCw, AlertTriangle, Users } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [mapIncidents, setMapIncidents] = useState<Incident[]>([]);
  const [mapAgencies, setMapAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>('All');
  
  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [aiModalIncident, setAiModalIncident] = useState<Incident | null>(null);
  const [assignModalIncident, setAssignModalIncident] = useState<Incident | null>(null);

  const { socket } = useSocket();

  const loadData = async () => {
    try {
      setLoading(true);
      const [sumRes, mapRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getMapData()
      ]);
      setSummary(sumRes);
      setMapIncidents(mapRes.incidents);
      setMapAgencies(mapRes.agencies);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to Socket.IO real-time updates
  useEffect(() => {
    if (!socket) return;

    socket.on('incident:new', (newInc: Incident) => {
      setMapIncidents(prev => [newInc, ...prev]);
      dashboardApi.getSummary().then(setSummary);
    });

    socket.on('incident:statusUpdate', (updatedInc: Incident) => {
      setMapIncidents(prev => prev.map(i => i._id === updatedInc._id ? updatedInc : i));
      dashboardApi.getSummary().then(setSummary);
    });

    socket.on('agency:statusUpdate', (updatedAgency: Agency) => {
      setMapAgencies(prev => prev.map(a => a._id === updatedAgency._id ? updatedAgency : a));
      dashboardApi.getSummary().then(setSummary);
    });

    return () => {
      socket.off('incident:new');
      socket.off('incident:statusUpdate');
      socket.off('agency:statusUpdate');
    };
  }, [socket]);

  const handleReportSubmit = async (data: any) => {
    await incidentApi.create(data);
    loadData();
  };

  const handleAiReviewConfirm = async (incidentId: string, reviewData: any) => {
    await incidentApi.reviewAiAnalysis(incidentId, reviewData);
    loadData();
  };

  const handleAssignConfirm = async (incidentId: string, agencyIds: string[]) => {
    await incidentApi.assignAgencies(incidentId, agencyIds);
    loadData();
  };

  const filteredIncidents = mapIncidents.filter(inc => {
    if (filterSeverity === 'All') return true;
    return (inc.aiAnalysis?.severity || inc.priority) === filterSeverity;
  });

  return (
    <div className="space-y-6">
      
      {/* Hero Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="glass-panel p-4 rounded-2xl border border-red-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-400">ACTIVE INCIDENTS</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {summary?.activeIncidents ?? 0}
            </span>
            <span className="text-xs text-red-400 font-mono">Total {summary?.totalIncidents ?? 0}</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-emerald-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-400">AVAILABLE AGENCIES</span>
            <Building2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono">
              {summary?.availableAgencies ?? 0}
            </span>
            <span className="text-xs text-gray-400 font-mono">/ {summary?.totalAgencies ?? 0} Registered</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-amber-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-400">DISPATCHED UNITS</span>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400 font-mono">
              {summary?.busyAgencies ?? 0}
            </span>
            <span className="text-xs text-amber-300 font-mono">Active On Scene</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-purple-900/40 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-gray-400">CRITICAL ALERTS</span>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-purple-400 font-mono">
              {summary?.incidentsBySeverity?.Critical ?? 0}
            </span>
            <span className="text-xs text-purple-300 font-mono">High Triage</span>
          </div>
        </div>

      </div>

      {/* Main Command Center Grid: Left = Map View (65%), Right = Feed (35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Map Panel */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              Live Geospatial Command Map (MongoDB 2dsphere)
            </h2>
            <button
              onClick={loadData}
              className="p-1.5 rounded-lg bg-dark-800 border border-gray-700 text-gray-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          <div className="h-[600px] w-full">
            <MapView
              incidents={filteredIncidents}
              agencies={mapAgencies}
            />
          </div>
        </div>

        {/* Incidents Feed Panel */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-mono font-bold text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Active Incident Feed
            </h2>
            
            {/* Filter Pill */}
            <div className="flex items-center gap-1 bg-dark-800 p-1 rounded-lg border border-gray-800 text-[11px] font-mono">
              {['All', 'Critical', 'High'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2 py-0.5 rounded ${
                    filterSeverity === sev ? 'bg-red-600 text-white font-bold' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
            {filteredIncidents.length === 0 ? (
              <div className="p-8 text-center bg-dark-900/60 rounded-2xl border border-dashed border-gray-800">
                <ShieldAlert className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-mono">No active incidents matching filter.</p>
              </div>
            ) : (
              filteredIncidents.map(inc => (
                <IncidentCard
                  key={inc._id}
                  incident={inc}
                  onReviewAi={(incident) => setAiModalIncident(incident)}
                  onAssignAgencies={(incident) => setAssignModalIncident(incident)}
                />
              ))
            )}
          </div>

        </div>

      </div>

      {/* Modals */}
      <IncidentReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleReportSubmit}
      />

      <AIReviewModal
        incident={aiModalIncident}
        isOpen={!!aiModalIncident}
        onClose={() => setAiModalIncident(null)}
        onConfirm={handleAiReviewConfirm}
      />

      <AssignAgencyModal
        incident={assignModalIncident}
        isOpen={!!assignModalIncident}
        onClose={() => setAssignModalIncident(null)}
        onAssign={handleAssignConfirm}
      />

    </div>
  );
};
