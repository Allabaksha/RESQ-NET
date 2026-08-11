import React from 'react';
import { Severity, IncidentStatus, AgencyStatus, ResponseStatus } from '../types';

interface StatusBadgeProps {
  type: 'severity' | 'incidentStatus' | 'agencyStatus' | 'responseStatus';
  value: Severity | IncidentStatus | AgencyStatus | ResponseStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type, value, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm'
  }[size];

  let colorClasses = 'bg-gray-800 text-gray-300 border-gray-700';

  if (type === 'severity') {
    switch (value) {
      case 'Critical':
        colorClasses = 'bg-red-950/80 text-red-400 border-red-700/80 animate-pulse font-bold shadow-sm shadow-red-900/50';
        break;
      case 'High':
        colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-700/80 font-semibold';
        break;
      case 'Moderate':
        colorClasses = 'bg-blue-950/80 text-blue-400 border-blue-700/80';
        break;
      case 'Low':
        colorClasses = 'bg-slate-900 text-slate-400 border-slate-700';
        break;
    }
  } else if (type === 'incidentStatus') {
    switch (value) {
      case 'Reported':
        colorClasses = 'bg-purple-950/80 text-purple-300 border-purple-800';
        break;
      case 'Under Review':
        colorClasses = 'bg-amber-950/80 text-amber-300 border-amber-800';
        break;
      case 'Assigned':
        colorClasses = 'bg-blue-950/80 text-blue-300 border-blue-800';
        break;
      case 'In Progress':
        colorClasses = 'bg-orange-950/80 text-orange-300 border-orange-800 animate-pulse';
        break;
      case 'Resolved':
        colorClasses = 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
        break;
      case 'Closed':
        colorClasses = 'bg-gray-900 text-gray-400 border-gray-800';
        break;
    }
  } else if (type === 'agencyStatus') {
    switch (value) {
      case 'Available':
        colorClasses = 'bg-emerald-950/90 text-emerald-300 border-emerald-700 font-medium';
        break;
      case 'Busy':
        colorClasses = 'bg-amber-950/90 text-amber-300 border-amber-700 font-medium';
        break;
      case 'Unavailable':
        colorClasses = 'bg-rose-950/90 text-rose-400 border-rose-800';
        break;
    }
  } else if (type === 'responseStatus') {
    switch (value) {
      case 'Accepted':
      case 'Completed':
      case 'On Scene':
        colorClasses = 'bg-emerald-950 text-emerald-300 border-emerald-800';
        break;
      case 'En Route':
        colorClasses = 'bg-blue-950 text-blue-300 border-blue-800 animate-pulse';
        break;
      case 'Pending':
        colorClasses = 'bg-amber-950 text-amber-300 border-amber-800';
        break;
      case 'Rejected':
        colorClasses = 'bg-red-950 text-red-400 border-red-800';
        break;
    }
  }

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border font-mono tracking-tight uppercase ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80"></span>
      {value}
    </span>
  );
};
