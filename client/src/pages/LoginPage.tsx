import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, LogIn, Key, Mail, Sparkles, UserCheck, Building2, Shield, User } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-gray-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/30 mx-auto">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">RESQ-NET</h1>
          <p className="text-xs text-gray-400 font-mono">Disaster Management Command & Dispatch System</p>
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="bg-dark-800/80 p-3 rounded-2xl border border-gray-800 space-y-2">
          <span className="text-[11px] font-mono text-purple-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Quick Demo Login Presets:
          </span>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
            <button
              onClick={() => quickFill('officer@resq.net', 'password123')}
              className="px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-purple-950/60 border border-purple-800/50 text-purple-200 text-left flex items-center gap-1.5 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-purple-400" />
              Officer
            </button>
            <button
              onClick={() => quickFill('admin@resq.net', 'password123')}
              className="px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-red-950/60 border border-red-800/50 text-red-200 text-left flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-red-400" />
              Admin
            </button>
            <button
              onClick={() => quickFill('agency@resq.net', 'password123')}
              className="px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-emerald-950/60 border border-emerald-800/50 text-emerald-200 text-left flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Agency
            </button>
            <button
              onClick={() => quickFill('citizen@resq.net', 'password123')}
              className="px-2.5 py-1.5 rounded-lg bg-dark-900 hover:bg-blue-950/60 border border-blue-800/50 text-blue-200 text-left flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-blue-400" />
              Citizen
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 font-mono text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 font-mono mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@resq.net"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 font-mono mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating...' : 'Sign In to RESQ-NET'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 font-mono">
          Don't have an account?{' '}
          <Link to="/register" className="text-red-400 hover:underline">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
};
