import React from 'react';
import { Incident, AssignedAgency } from '../types';
import { StatusBadge } from './StatusBadge';
import { ShieldAlert, MapPin, Sparkles, UserCheck, Users, Clock, CheckCircle, Truck, Navigation, XCircle, Hourglass } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMovements } from '../context/MovementContext';

interface IncidentCardProps {
  incident: Incident;
  onSelect?: (incident: Incident) => void;
  onAnalyzeAi?: (incident: Incident) => void;
  onReviewAi?: (incident: Incident) => void;
  onAssignAgencies?: (incident: Incident) => void;
}

// "12m 40s" style duration formatting
const formatDuration = (seconds: number) => {
  if (!isFinite(seconds) || seconds < 0) return '—';
  const total = Math.round(seconds);
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return m > 0 ? `${m}m ${String(sec).padStart(2, '0')}s` : `${sec}s`;
};

const ts = (v?: string) => (v ? new Date(v).getTime() : undefined);

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onSelect,
  onAnalyzeAi,
  onReviewAi,
  onAssignAgencies
}) => {
  const { user } = useAuth();
  const { units } = useMovements();
  const isOfficerOrAdmin = user?.role === 'officer' || user?.role === 'admin';

  const assigned = incident.assignedAgencies || [];
  const arrivedCount = assigned.filter(a =>
    a.responseStatus === 'On Scene' ||
    a.responseStatus === 'Completed' ||
    a.arrivedAt
  ).length;
  const resolved = incident.status === 'Resolved' || incident.status === 'Closed';

  const renderAssignmentRow = (asg: AssignedAgency) => {
    const agencyId = typeof asg.agency === 'object' ? (asg.agency as any)?._id : asg.agency;
    const agency = typeof asg.agency === 'object' ? (asg.agency as any) : undefined;
    const live = agencyId ? units[agencyId] : undefined;

    const status = asg.responseStatus;
    const enRouteAt = ts(asg.enRouteAt) ?? ts(asg.assignedAt) ?? 0;
    const arrivedAt = ts(asg.arrivedAt) ?? (live?.arrived ? live.arrivedAt : undefined);
    const completedAt = ts(asg.completedAt);
    const responseTime = arrivedAt && enRouteAt ? (arrivedAt - enRouteAt) / 1000 : undefined;

    let detailIcon = <Hourglass className="w-3 h-3 text-gray-500" />;
    let detailText = 'Awaiting agency response';
    let detailClass = 'text-gray-500';

    if (status === 'Rejected') {
      detailIcon = <XCircle className="w-3 h-3 text-red-400" />;
      detailText = 'Dispatch declined by agency';
      detailClass = 'text-red-400';
    } else if (status === 'Completed') {
      detailIcon = <CheckCircle className="w-3 h-3 text-emerald-400" />;
      const total = completedAt && enRouteAt ? (completedAt - enRouteAt) / 1000 : responseTime;
      detailText = `Mission completed${total ? ` · total ${formatDuration(total)}` : ''}`;
      detailClass = 'text-emerald-400';
    } else if (status === 'On Scene' || arrivedAt) {
      detailIcon = <CheckCircle className="w-3 h-3 text-emerald-400" />;
      detailText = `Arrived on scene${responseTime ? ` · took ${formatDuration(responseTime)}` : ''}`;
      detailClass = 'text-emerald-400';
    } else if (status === 'En Route' && live && !live.arrived) {
      detailIcon = <Navigation className="w-3 h-3 text-blue-400 animate-pulse" />;
      detailText = `En Route · ETA ${formatDuration(live.etaSeconds)} · ${live.remainingKm.toFixed(1)} km away`;
      detailClass = 'text-blue-300';
    } else if (status === 'En Route') {
      detailIcon = <Navigation className="w-3 h-3 text-blue-400" />;
      detailText = 'En Route to scene — position updating…';
      detailClass = 'text-blue-300';
    } else if (status === 'Accepted') {
      detailIcon = <CheckCircle className="w-3 h-3 text-amber-400" />;
      detailText = 'Dispatch accepted — awaiting departure';
      detailClass = 'text-amber-300';
    }

    // Live coordinates while traveling, else last reported position
    const liveCoords = live?.current
      ? live.current
      : agency?.currentLocation?.coordinates;

    return (
      <div key={agencyId || asg._id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-gray-200 truncate">
              {agency?.name || `Unit ${String(agencyId).slice(-4)}`}
            </span>
            <StatusBadge type="responseStatus" value={status} size="sm" />
          </div>
          <p className={`text-[11px] font-mono flex items-center gap-1 mt-0.5 ${detailClass}`}>
            {detailIcon}
            <span className="truncate">{detailText}</span>
          </p>
          {liveCoords && (
            <p className="text-[10px] font-mono text-gray-500 mt-0.5">
              📍 [{liveCoords[0].toFixed(4)}, {liveCoords[1].toFixed(4)}]
            </p>
          )}
        </div>
        {agency?.type && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700 font-mono whitespace-nowrap">
            {agency.type}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-all shadow-lg flex flex-col justify-between gap-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                {incident.aiAnalysis?.incidentType || 'Disaster Alert'}
              </span>
              <StatusBadge type="severity" value={incident.aiAnalysis?.severity || incident.priority} size="sm" />
            </div>
            <p className="text-xs text-gray-400 font-mono flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              {incident.address || 'Reported Location'}
            </p>
          </div>
          <StatusBadge type="incidentStatus" value={incident.status} size="sm" />
        </div>

        {/* Resolved banner */}
        {resolved && (
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-700/50 rounded-xl px-3 py-2 text-[11px] font-semibold text-emerald-300">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono">PROBLEM SOLVED — this incident has been resolved.</span>
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-gray-300 leading-relaxed line-clamp-3 bg-dark-900/60 p-3 rounded-xl border border-gray-800/80">
          "{incident.description}"
        </p>

        {/* AI Analysis Pill Box */}
        {incident.aiAnalysis && (
          <div className="bg-gradient-to-r from-purple-950/40 via-dark-900 to-indigo-950/40 p-3 rounded-xl border border-purple-900/40 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-purple-300 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                AI ASSISTIVE ANALYSIS
              </span>
              {incident.aiAnalysis.reviewedByOfficer ? (
                <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                  <CheckCircle className="w-3 h-3" />
                  Officer Approved
                </span>
              ) : (
                <span className="text-[10px] text-amber-400 font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                  Pending Review
                </span>
              )}
            </div>

            <div className="text-xs text-gray-300 font-sans">
              <p className="text-[11px] text-purple-200">
                <strong className="text-gray-400 font-mono">Impact:</strong> {incident.aiAnalysis.estimatedVictims}
              </p>
              {incident.aiAnalysis.suggestedResources && incident.aiAnalysis.suggestedResources.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] text-gray-400 font-mono">Suggested:</span>
                  {incident.aiAnalysis.suggestedResources.map((res, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-purple-900/50 text-purple-200 border border-purple-800/60 font-mono">
                      {res}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dispatched Units & Arrival Tracking */}
        {assigned.length > 0 && (
          <div className="bg-dark-900/60 p-3 rounded-xl border border-gray-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                DISPATCHED UNITS & ARRIVAL TRACKING
              </span>
              <span className={`text-[10px] ${arrivedCount === assigned.length ? 'text-emerald-400' : 'text-gray-400'}`}>
                {arrivedCount}/{assigned.length} arrived
              </span>
            </div>
            {assigned.map(renderAssignmentRow)}
          </div>
        )}
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
        <div className="flex items-center gap-3 text-gray-400 font-mono text-[11px]">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            {assigned.length} Units Assigned
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            {incident.createdAt ? new Date(incident.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOfficerOrAdmin && (
            <>
              {onReviewAi && incident.aiAnalysis && !incident.aiAnalysis.reviewedByOfficer && (
                <button
                  onClick={() => onReviewAi(incident)}
                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Review AI
                </button>
              )}

              {onAssignAgencies && (
                <button
                  onClick={() => onAssignAgencies(incident)}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow"
                >
                  <Users className="w-3.5 h-3.5" />
                  Assign Units
                </button>
              )}
            </>
          )}

          {onSelect && (
            <button
              onClick={() => onSelect(incident)}
              className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 rounded-lg text-xs font-medium transition-colors"
            >
              Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
