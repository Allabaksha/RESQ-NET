import React, { useEffect, useState } from 'react';
import { incidentApi } from '../services/api';
import { Incident } from '../types';
import { IncidentCard } from '../components/IncidentCard';
import { TimelineView } from '../components/TimelineView';
import { AIReviewModal } from '../components/AIReviewModal';
import { AssignAgencyModal } from '../components/AssignAgencyModal';
import { IncidentReportModal } from '../components/IncidentReportModal';
import { ShieldAlert, PlusCircle, Search, Filter, RefreshCw, X, Radio } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const IncidentsPage: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [severityFilter, setSeverityFilter] = useState('All');

  // Selected for drawer / timeline
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Modals
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [aiModalIncident, setAiModalIncident] = useState<Incident | null>(null);
  const [assignModalIncident, setAssignModalIncident] = useState<Incident | null>(null);

  const { user } = useAuth();

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await incidentApi.getAll();
      setIncidents(data);
    } catch (err) {
      console.error('Failed to load incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleReportSubmit = async (data: any) => {
    await incidentApi.create(data);
    fetchIncidents();
  };

  const handleAiReviewConfirm = async (incidentId: string, reviewData: any) => {
    await incidentApi.reviewAiAnalysis(incidentId, reviewData);
    fetchIncidents();
  };

  const handleAssignConfirm = async (incidentId: string, agencyIds: string[]) => {
    await incidentApi.assignAgencies(incidentId, agencyIds);
    fetchIncidents();
  };

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.description.toLowerCase().includes(search.toLowerCase()) || 
                          (inc.address && inc.address.toLowerCase().includes(search.toLowerCase())) ||
                          (inc.aiAnalysis?.incidentType && inc.aiAnalysis.incidentType.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'All' || inc.status === statusFilter;
    const matchesSeverity = severityFilter === 'All' || (inc.aiAnalysis?.severity || inc.priority) === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2 font-sans">
            <Radio className="w-6 h-6 text-red-500" />
            Disaster Incident Control Portal
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Real-time incident reporting, AI assistance, officer review, and agency dispatches
          </p>
        </div>

        <button
          onClick={() => setReportModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/30 flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Report New Incident
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keyword, address, or type..."
            className="w-full pl-9 pr-4 py-2 bg-dark-800 border border-gray-700 rounded-xl text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-red-500"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-800 border border-gray-700 text-gray-200 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Under Review">Under Review</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-dark-800 border border-gray-700 text-gray-200 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Moderate">Moderate</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <button
            onClick={fetchIncidents}
            className="p-2 bg-dark-800 border border-gray-700 text-gray-300 rounded-xl hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-mono text-gray-400">Fetching incidents from database...</p>
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-dark-900/60 rounded-3xl border border-dashed border-gray-800">
            <ShieldAlert className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-300">No incidents found matching criteria.</p>
          </div>
        ) : (
          filteredIncidents.map(inc => (
            <IncidentCard
              key={inc._id}
              incident={inc}
              onSelect={(incident) => setSelectedIncident(incident)}
              onReviewAi={(incident) => setAiModalIncident(incident)}
              onAssignAgencies={(incident) => setAssignModalIncident(incident)}
            />
          ))
        )}
      </div>

      {/* Incident Detail Drawer Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-0 bg-black/70 backdrop-blur-sm">
          <div className="bg-dark-900 border-l border-gray-800 w-full max-w-xl h-full overflow-y-auto p-6 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-500" />
                  Incident Details & Audit History
                </h2>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold text-red-400">
                  {selectedIncident.aiAnalysis?.incidentType || 'Incident Alert'}
                </h3>
                <p className="text-xs text-gray-300 bg-dark-800 p-3 rounded-xl border border-gray-800">
                  "{selectedIncident.description}"
                </p>
              </div>

              <TimelineView timeline={selectedIncident.timeline} />
            </div>

            <div className="pt-4 border-t border-gray-800 flex items-center justify-end">
              <button
                onClick={() => setSelectedIncident(null)}
                className="px-4 py-2 bg-gray-800 text-xs font-mono text-gray-300 rounded-xl"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

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
