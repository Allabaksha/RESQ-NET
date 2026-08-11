import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, UserPlus, User, Mail, Key, Phone, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'citizen' | 'agency' | 'officer'>('citizen');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await register({ name, email, password, role, phone });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-dark-900 border border-gray-800 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-amber-500 flex items-center justify-center shadow-lg shadow-red-500/30 mx-auto">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Create RESQ-NET Account</h1>
          <p className="text-xs text-gray-400 font-mono">Join the Emergency Response & Coordination Network</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-800 rounded-xl text-xs text-red-300 font-mono text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-300 font-mono mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Commander R. K. Sharma"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-mono mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@agency.gov.in"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-mono mb-1">Select Role</label>
            <select
              value={role}
              onChange={(e: any) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500 font-mono"
            >
              <option value="citizen">Citizen Reporter</option>
              <option value="officer">Disaster Control Officer</option>
              <option value="agency">Rescue Agency Representative</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 font-mono mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91-9876543210"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-mono mb-1">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-gray-700 rounded-xl text-sm text-gray-100 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="text-center text-xs text-gray-400 font-mono">
          Already registered?{' '}
          <Link to="/login" className="text-red-400 hover:underline">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
};
