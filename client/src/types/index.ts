export type Role = 'citizen' | 'agency' | 'officer' | 'admin';

export type AgencyType = 
  | 'Fire & Rescue' 
  | 'Ambulance' 
  | 'Police' 
  | 'NDRF' 
  | 'SDRF' 
  | 'Civil Defence' 
  | 'NGO' 
  | 'Other';

export type AgencyStatus = 'Available' | 'Busy' | 'Unavailable';

export type Severity = 'Low' | 'Moderate' | 'High' | 'Critical';

export type IncidentStatus = 
  | 'Reported' 
  | 'Under Review' 
  | 'Assigned' 
  | 'In Progress' 
  | 'Resolved' 
  | 'Closed';

export type ResponseStatus = 
  | 'Pending' 
  | 'Accepted' 
  | 'Rejected' 
  | 'En Route' 
  | 'On Scene' 
  | 'Completed';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: Role;
  agency?: Agency | string;
  phone?: string;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface Agency {
  _id: string;
  name: string;
  type: AgencyType;
  registrationId: string;
  contact?: {
    phone?: string;
    email?: string;
    officerInCharge?: string;
  };
  baseLocation: GeoPoint;
  currentLocation: GeoPoint;
  status: AgencyStatus;
  capacity?: {
    personnel?: number;
    vehicles?: number;
  };
  verified: boolean;
  lastUpdated?: string;
}

export interface AiAnalysis {
  incidentType: string;
  severity: Severity;
  estimatedVictims: string;
  suggestedResources: string[];
  reviewedByOfficer: boolean;
}

export interface AssignedAgency {
  _id?: string;
  agency: Agency | string;
  assignedAt?: string;
  enRouteAt?: string;
  arrivedAt?: string;
  completedAt?: string;
  responseStatus: ResponseStatus;
}

export interface TimelineEvent {
  _id?: string;
  event: string;
  timestamp: string;
  by?: User | string | null;
}

export interface Incident {
  _id: string;
  reportedBy?: User | string;
  description: string;
  location: GeoPoint;
  address?: string;
  aiAnalysis?: AiAnalysis;
  status: IncidentStatus;
  priority: Severity;
  assignedAgencies: AssignedAgency[];
  timeline: TimelineEvent[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardSummary {
  totalIncidents: number;
  activeIncidents: number;
  totalAgencies: number;
  availableAgencies: number;
  busyAgencies: number;
  incidentsByStatus: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
}
