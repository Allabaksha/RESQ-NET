import React, { useEffect, useState } from 'react';
import { agencyApi } from '../services/api';
import { Agency } from '../types';
import { AgencyCard } from '../components/AgencyCard';
import { Building2, Plus, Search, Filter, ShieldCheck, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AgenciesPage: React.FC = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Register Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newAgency, setNewAgency] = useState({
    name: '',
    type: 'NDRF',
    registrationId: '',
    phone: '',
    email: '',
    officerInCharge: '',
    personnel: 20,
    vehicles: 4,
    lng: 72.8777,
    lat: 19.0760
  });

  const { user } = useAuth();

  const fetchAgencies = async () => {
    try {
      setLoading(true);
      const data = await agencyApi.getAll();
      setAgencies(data);
    } catch (err) {
      console.error('Failed to load agencies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgencies();
  }, []);

  const handleUpdateStatus = async (agency: Agency, status: 'Available' | 'Busy' | 'Unavailable') => {
    try {
      await agencyApi.updateStatus(agency._id, status);
      fetchAgencies();
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleVerify = async (agency: Agency) => {
    try {
      await agencyApi.verify(agency._id, true);
      fetchAgencies();
    } catch (err) {
      console.error('Verify failed:', err);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await agencyApi.create({
        name: newAgency.name,
        type: newAgency.type as any,
        registrationId: newAgency.registrationId,
        contact: {
          phone: newAgency.phone,
          email: newAgency.email,
          officerInCharge: newAgency.officerInCharge
        },
        baseLocation: { type: "Point", coordinates: [Number(newAgency.lng), Number(newAgency.lat)] },
        currentLocation: { type: "Point", coordinates: [Number(newAgency.lng), Number(newAgency.lat)] },
        capacity: { personnel: Number(newAgency.personnel), vehicles: Number(newAgency.vehicles) }
      });
      setModalOpen(false);
      fetchAgencies();
    } catch (err) {
      console.error('Agency registration failed:', err);
    }
  };

  const filteredAgencies = agencies.filter(ag => {
    const matchesSearch = ag.name.toLowerCase().includes(search.toLowerCase()) || 
                          ag.registrationId.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'All' || ag.type === typeFilter;
    const matchesStatus = statusFilter === 'All' || ag.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-100 flex items-center gap-2 font-sans">
            <Building2 className="w-6 h-6 text-emerald-400" />
            Rescue Agencies Registry & Operational Status
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Registered relief task forces, verification status, live availability, and capacity
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/30 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Register Agency Unit
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agency by name or reg ID..."
            className="w-full pl-9 pr-4 py-2 bg-dark-800 border border-gray-700 rounded-xl text-xs text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-400">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-dark-800 border border-gray-700 text-gray-200 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="All">All Agency Types</option>
              <option value="NDRF">NDRF</option>
              <option value="SDRF">SDRF</option>
              <option value="Fire & Rescue">Fire & Rescue</option>
              <option value="Ambulance">Ambulance</option>
              <option value="Police">Police</option>
              <option value="Civil Defence">Civil Defence</option>
              <option value="NGO">NGO</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-800 border border-gray-700 text-gray-200 rounded-xl px-3 py-1.5 focus:outline-none"
            >
              <option value="All">All Operational Statuses</option>
              <option value="Available">Available</option>
              <option value="Busy">Busy</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>

          <button
            onClick={fetchAgencies}
            className="p-2 bg-dark-800 border border-gray-700 text-gray-300 rounded-xl hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs font-mono text-gray-400">Loading agency registry...</p>
          </div>
        ) : filteredAgencies.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-dark-900/60 rounded-3xl border border-dashed border-gray-800">
            <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-300">No registered agencies found matching filter.</p>
          </div>
        ) : (
          filteredAgencies.map(ag => (
            <AgencyCard
              key={ag._id}
              agency={ag}
              onUpdateStatus={handleUpdateStatus}
              onVerify={handleVerify}
            />
          ))
        )}
      </div>

      {/* Register Agency Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-900 border border-gray-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                Register Rescue Agency Unit
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-mono mb-1">Agency Official Name</label>
                <input
                  type="text"
                  required
                  value={newAgency.name}
                  onChange={e => setNewAgency({ ...newAgency, name: e.target.value })}
                  placeholder="e.g. 8th Battalion NDRF"
                  className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-mono mb-1">Agency Type</label>
                  <select
                    value={newAgency.type}
                    onChange={e => setNewAgency({ ...newAgency, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-gray-100 font-mono"
                  >
                    <option value="NDRF">NDRF</option>
                    <option value="SDRF">SDRF</option>
                    <option value="Fire & Rescue">Fire & Rescue</option>
                    <option value="Ambulance">Ambulance</option>
                    <option value="Police">Police</option>
                    <option value="Civil Defence">Civil Defence</option>
                    <option value="NGO">NGO</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-mono mb-1">Registration ID</label>
                  <input
                    type="text"
                    required
                    value={newAgency.registrationId}
                    onChange={e => setNewAgency({ ...newAgency, registrationId: e.target.value })}
                    placeholder="e.g. GOV-NDRF-801"
                    className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-mono mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newAgency.phone}
                    onChange={e => setNewAgency({ ...newAgency, phone: e.target.value })}
                    placeholder="+91-..."
                    className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-mono mb-1">Officer In Charge</label>
                  <input
                    type="text"
                    value={newAgency.officerInCharge}
                    onChange={e => setNewAgency({ ...newAgency, officerInCharge: e.target.value })}
                    placeholder="Commandant Name"
                    className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-mono mb-1">Longitude (Base)</label>
                  <input
                    type="number"
                    step="any"
                    value={newAgency.lng}
                    onChange={e => setNewAgency({ ...newAgency, lng: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-gray-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 font-mono mb-1">Latitude (Base)</label>
                  <input
                    type="number"
                    step="any"
                    value={newAgency.lat}
                    onChange={e => setNewAgency({ ...newAgency, lat: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-gray-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-gray-700 rounded-xl text-gray-300 hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold shadow"
                >
                  Register Agency
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
