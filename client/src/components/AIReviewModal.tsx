import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, UserCheck, ShieldAlert } from 'lucide-react';
import { Incident } from '../types';

interface AIReviewModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (incidentId: string, data: { incidentType: string; severity: string; estimatedVictims: string; suggestedResources: string[] }) => Promise<void>;
}

const AGENCY_TYPES = [
  "Fire & Rescue",
  "Ambulance",
  "Police",
  "NDRF",
  "SDRF",
  "Civil Defence",
  "NGO"
];

export const AIReviewModal: React.FC<AIReviewModalProps> = ({ incident, isOpen, onClose, onConfirm }) => {
  const [incidentType, setIncidentType] = useState('');
  const [severity, setSeverity] = useState('High');
  const [estimatedVictims, setEstimatedVictims] = useState('');
  const [suggestedResources, setSuggestedResources] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (incident?.aiAnalysis) {
      setIncidentType(incident.aiAnalysis.incidentType || 'Disaster Incident');
      setSeverity(incident.aiAnalysis.severity || 'High');
      setEstimatedVictims(incident.aiAnalysis.estimatedVictims || 'Casualties suspected');
      setSuggestedResources(incident.aiAnalysis.suggestedResources || []);
    }
  }, [incident]);

  if (!isOpen || !incident) return null;

  const toggleResource = (res: string) => {
    if (suggestedResources.includes(res)) {
      setSuggestedResources(suggestedResources.filter(r => r !== res));
    } else {
      setSuggestedResources([...suggestedResources, res]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await onConfirm(incident._id, {
        incidentType,
        severity,
        estimatedVictims,
        suggestedResources
      });
      onClose();
    } catch (err) {
      console.error('Failed to review AI analysis:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-dark-900 border border-purple-800/60 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gradient-to-r from-purple-950/60 via-dark-800 to-indigo-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-600/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-100 flex items-center gap-2">
                Officer AI Review & Human Approval
              </h2>
              <p className="text-xs text-purple-300 font-mono">SIH Human-in-the-Loop Protocol (AI Suggests &bull; Officer Decides)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          <div className="bg-dark-800/80 p-3 rounded-xl border border-gray-800 text-xs text-gray-300">
            <strong className="text-purple-400 font-mono">Original Citizen Report:</strong>
            <p className="italic mt-1 text-gray-400">"{incident.description}"</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 font-mono mb-1">
                Incident Classification
              </label>
              <input
                type="text"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-xs text-gray-100 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 font-mono mb-1">
                Confirmed Severity Level
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-xs text-gray-100 focus:outline-none focus:border-purple-500 font-mono"
              >
                <option value="Low">Low</option>
                <option value="Moderate">Moderate</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 font-mono mb-1">
              Estimated Victims / Impact Assessment
            </label>
            <input
              type="text"
              value={estimatedVictims}
              onChange={(e) => setEstimatedVictims(e.target.value)}
              placeholder="e.g. 10-15 trapped civilians, medical triage required"
              className="w-full px-3.5 py-2 bg-dark-800 border border-gray-700 rounded-xl text-xs text-gray-100 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-300 font-mono">
              Required Rescue Resource Types (Select matching agency capabilities)
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {AGENCY_TYPES.map((res) => {
                const selected = suggestedResources.includes(res);
                return (
                  <button
                    key={res}
                    type="button"
                    onClick={() => toggleResource(res)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border ${
                      selected
                        ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                        : 'bg-dark-800 text-gray-400 border-gray-700 hover:text-gray-200'
                    }`}
                  >
                    {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    {res}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-700 text-xs text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" />
              {submitting ? 'Confirming...' : 'Approve AI Assessment'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
