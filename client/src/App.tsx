import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { MovementProvider } from './context/MovementContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { AgenciesPage } from './pages/AgenciesPage';
import { AgencyPortalPage } from './pages/AgencyPortalPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { IncidentReportModal } from './components/IncidentReportModal';
import { incidentApi } from './services/api';

const AppRoutes: React.FC = () => {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { user } = useAuth();

  const handleGlobalReportSubmit = async (data: any) => {
    await incidentApi.create(data);
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-gray-100 font-sans selection:bg-red-500 selection:text-white">
      <Navbar onOpenReportModal={() => setReportModalOpen(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/incidents" element={<IncidentsPage />} />
          <Route path="/agencies" element={<AgenciesPage />} />
          <Route path="/agency-portal" element={<AgencyPortalPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Incident Report Modal */}
      <IncidentReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSubmit={handleGlobalReportSubmit}
      />

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-dark-950 py-6 text-center text-xs font-mono text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 RESQ-NET &bull; SIH260086 Ministry of Home Affairs &bull; Disaster Management Software</p>
          <p className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            MongoDB 2dsphere Geospatial Indexing &bull; Node &bull; React &bull; Leaflet &bull; Socket.IO
          </p>
        </div>
      </footer>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <MovementProvider>
        <Router>
          <AppRoutes />
        </Router>
        </MovementProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
