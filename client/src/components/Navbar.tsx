import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, Map, Radio, Building2, User as UserIcon, LogOut, PlusCircle, Signal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

interface NavbarProps {
  onOpenReportModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenReportModal }) => {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-40 bg-dark-900/90 backdrop-blur-md border-b border-gray-800 text-gray-100 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Live Signal */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-gray-400">
                  RESQ-NET
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-red-950/80 border border-red-800/60 text-red-400">
                  SIH260086
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {connected ? 'REAL-TIME NETWORK ACTIVE' : 'CONNECTING...'}
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-1 bg-dark-800/80 p-1.5 rounded-xl border border-gray-800">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive('/') ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <Map className="w-4 h-4" />
            Live Map & Command Center
          </Link>

          <Link
            to="/incidents"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive('/incidents') ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <Radio className="w-4 h-4" />
            Incidents
          </Link>

          <Link
            to="/agencies"
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isActive('/agencies') ? 'bg-red-600 text-white shadow-md shadow-red-600/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Agencies Directory
          </Link>

          {user?.role === 'agency' && (
            <Link
              to="/agency-portal"
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive('/agency-portal') ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' : 'text-emerald-400 hover:bg-emerald-950/40'
              }`}
            >
              <Signal className="w-4 h-4" />
              Agency Portal
            </Link>
          )}
        </div>

        {/* Action Buttons & Profile */}
        <div className="flex items-center gap-3">
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-600/25 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Report Incident</span>
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-gray-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-gray-200">{user.name}</div>
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-gray-800 text-gray-300 border border-gray-700">
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                title="Log out"
                className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-100 rounded-xl transition-colors"
              >
                Register
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
};
