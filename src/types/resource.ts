export type ResourceStatus = 'AVAILABLE' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'UNAVAILABLE';
export type ResourceType = 'RESCUE_TEAM' | 'AMBULANCE' | 'BOAT' | 'MEDICAL_TEAM';

export interface RescueResource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  capacity?: number;
  members?: number;
  medicalCapability?: 'Basic' | 'Advanced';
  lat: number;
  lng: number;
  assignedIncidentId?: string;
  etaMinutes?: number;
}

export interface Shelter {
  id: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  capacity: number;
  occupied: number;
  facilities: string[];
  medicalCapability: boolean;
  status: 'OPERATIONAL' | 'FULL' | 'CLOSED';
}
