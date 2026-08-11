import axios from 'axios';
import { Agency, Incident, DashboardSummary, User } from '../types';

// Fall back to '/api' (Vite dev proxy); set VITE_API_BASE to your deployed
// backend URL (e.g. https://your-app.onrender.com/api) when deploying.
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for attaching JWT Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resqnet_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    return res.data;
  },
  register: async (userData: { name: string; email: string; password: string; role: string; phone?: string; agencyId?: string }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', userData);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  }
};

export const agencyApi = {
  getAll: async (filters?: { type?: string; status?: string; verified?: boolean }) => {
    const res = await api.get<Agency[]>('/agencies', { params: filters });
    return res.data;
  },
  getNearby: async (params: { lng: number; lat: number; radius?: number; type?: string; status?: string }) => {
    const res = await api.get<Agency[]>('/agencies/nearby', { params });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<Agency>(`/agencies/${id}`);
    return res.data;
  },
  create: async (agencyData: Partial<Agency>) => {
    const res = await api.post<Agency>('/agencies', agencyData);
    return res.data;
  },
  updateStatus: async (id: string, status: 'Available' | 'Busy' | 'Unavailable') => {
    const res = await api.patch<Agency>(`/agencies/${id}/status`, { status });
    return res.data;
  },
  updateLocation: async (id: string, coordinates: [number, number]) => {
    const res = await api.patch<Agency>(`/agencies/${id}/location`, { coordinates });
    return res.data;
  },
  verify: async (id: string, verified: boolean) => {
    const res = await api.patch<Agency>(`/agencies/${id}/verify`, { verified });
    return res.data;
  }
};

export const incidentApi = {
  getAll: async (filters?: { status?: string; severity?: string; priority?: string }) => {
    const res = await api.get<Incident[]>('/incidents', { params: filters });
    return res.data;
  },
  getById: async (id: string) => {
    const res = await api.get<Incident>(`/incidents/${id}`);
    return res.data;
  },
  create: async (incidentData: { description: string; location: { coordinates: [number, number] }; address?: string; priority?: string }) => {
    const res = await api.post<Incident>('/incidents', incidentData);
    return res.data;
  },
  triggerAiAnalyze: async (id: string) => {
    const res = await api.post<Incident>(`/incidents/${id}/analyze`);
    return res.data;
  },
  reviewAiAnalysis: async (id: string, reviewData: { incidentType?: string; severity?: string; estimatedVictims?: string; suggestedResources?: string[] }) => {
    const res = await api.patch<Incident>(`/incidents/${id}/review`, reviewData);
    return res.data;
  },
  assignAgencies: async (id: string, agencyIds: string[]) => {
    const res = await api.patch<Incident>(`/incidents/${id}/assign`, { agencyIds });
    return res.data;
  },
  respondDispatch: async (id: string, agencyId: string, responseStatus: string) => {
    const res = await api.patch<Incident>(`/incidents/${id}/respond`, { agencyId, responseStatus });
    return res.data;
  },
  updateStatus: async (id: string, status: string, note?: string) => {
    const res = await api.patch<Incident>(`/incidents/${id}/status`, { status, note });
    return res.data;
  }
};

export const dashboardApi = {
  getSummary: async () => {
    const res = await api.get<DashboardSummary>('/dashboard/summary');
    return res.data;
  },
  getMapData: async () => {
    const res = await api.get<{ incidents: Incident[]; agencies: Agency[] }>('/dashboard/map');
    return res.data;
  }
};

export default api;
