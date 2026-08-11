import React, { useState } from 'react';
import { X, ShieldAlert, MapPin, Sparkles, Send } from 'lucide-react';
import { MapView } from './MapView';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { description: string; location: { coordinates: [number, number] }; address?: string; priority?: string }) => Promise<void>;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [coordinates, setCoordinates] = useState<[number, number]>([72.8777, 19.0760]); // Default Mumbai [lng, lat]
  const [submitting, setSubmitting] = useState(false);
  const [mapPickMode, setMapPickMode] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    try {
      setSubmitting(true);
      await onSubmit({
        description,
        address: address || 'Reported Location',
        priority,
        location: { coordinates }
      });
      setDescription('');
      setAddress('');
      onClose();
    } catch (err) {
      console.error('Failed to submit incident:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-gray-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-dark-800/50 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-100">Report Emergency Incident</h2>
              <p className="text-xs text-gray-400 font-mono">Disaster Management Command Center &bull; AI Assisted</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          
          {/* Location Map Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5 font-mono">
                <MapPin className="w-4 h-4 text-red-500" />
                Select Exact Incident Location (Click map pin)
              </label>
              <span className="text-[11px] text-red-400 font-mono">
                Lng: {coordinates[0].toFixed(4)}, Lat: {coordinates[1].toFixed(4)}
              </span>
            </div>

            <div className="h-64 rounded-2xl overflow-hidden border border-gray-800">
              <MapView
                pickMode={mapPickMode}
                onSelectLocation={(coords) => setCoordinates(coords)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 font-mono mb-1.5">
                Address / Nearby Landmark
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Kurla Station Road, Mumbai"
                className="w-full px-4 py-2.5 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 font-mono mb-1.5">
                Initial Severity / Priority
              </label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full px-4 py-2.5 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500 transition-colors font-mono"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-300 font-mono">
              Incident Description & Details <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the situation in detail (e.g. Building collapse with trapped residents, rising flood waters over 4 feet, chemical fire with toxic smoke...)"
              className="w-full px-4 py-3 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500 transition-colors placeholder:text-gray-600"
            />
            <p className="text-[11px] text-purple-300 font-mono flex items-center gap-1.5 pt-1">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              AI Pipeline (Ollama) will automatically parse description to suggest resource types and victim count.
            </p>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-700 text-xs font-medium text-gray-300 hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-red-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting & Running AI...' : 'Submit Incident Report'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
