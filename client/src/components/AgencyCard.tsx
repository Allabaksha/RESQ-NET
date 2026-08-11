import React from 'react';
import { Agency } from '../types';
import { StatusBadge } from './StatusBadge';
import { Building2, ShieldCheck, Phone, Mail, UserCheck, MapPin, Users, Truck, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AgencyCardProps {
  agency: Agency;
  onUpdateStatus?: (agency: Agency, status: 'Available' | 'Busy' | 'Unavailable') => void;
  onVerify?: (agency: Agency) => void;
}

export const AgencyCard: React.FC<AgencyCardProps> = ({ agency, onUpdateStatus, onVerify }) => {
  const { user } = useAuth();
  const isOwnerOrAdmin = user?.role === 'admin' || user?.agency === agency._id || (typeof user?.agency === 'object' && (user.agency as any)._id === agency._id);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-gray-800 hover:border-gray-700 transition-all shadow-lg flex flex-col justify-between gap-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-400" />
                {agency.name}
              </span>
              {agency.verified && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  VERIFIED
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono">
              Reg ID: {agency.registrationId} &bull; <strong className="text-emerald-300">{agency.type}</strong>
            </p>
          </div>
          <StatusBadge type="agencyStatus" value={agency.status} size="sm" />
        </div>

        {/* Contact & Capacity Info */}
        <div className="bg-dark-900/60 p-3 rounded-xl border border-gray-800/80 space-y-2 text-xs text-gray-300">
          {agency.contact?.officerInCharge && (
            <p className="flex items-center gap-2 text-gray-300 font-medium">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              In-Charge: {agency.contact.officerInCharge}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-gray-400 pt-1">
            {agency.contact?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                {agency.contact.phone}
              </span>
            )}
            {agency.contact?.email && (
              <span className="flex items-center gap-1.5 truncate">
                <Mail className="w-3.5 h-3.5 text-amber-400" />
                {agency.contact.email}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 pt-2 border-t border-gray-800/60 text-xs font-mono text-gray-300">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              {agency.capacity?.personnel || 0} Personnel
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              {agency.capacity?.vehicles || 0} Vehicles
            </span>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-2 border-t border-gray-800/80 flex items-center justify-between gap-2 flex-wrap text-xs">
        <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
          <MapPin className="w-3 h-3 text-emerald-500" />
          [{agency.currentLocation?.coordinates[0].toFixed(3)}, {agency.currentLocation?.coordinates[1].toFixed(3)}]
        </span>

        {isOwnerOrAdmin && onUpdateStatus && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-400 font-mono mr-1">Status:</span>
            {(['Available', 'Busy', 'Unavailable'] as const).map((st) => (
              <button
                key={st}
                onClick={() => onUpdateStatus(agency, st)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  agency.status === st
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {user?.role === 'admin' && !agency.verified && onVerify && (
          <button
            onClick={() => onVerify(agency)}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors shadow"
          >
            Verify Agency
          </button>
        )}
      </div>
    </div>
  );
};
