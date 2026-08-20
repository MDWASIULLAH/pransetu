export interface IncidentCluster {
  id: string; // e.g. INC-018
  district: string;
  lat: number;
  lng: number;
  radiusKm: number;
  sosCount: number;
  affectedPeople: number;
  criticalCount: number;
  medicalCount: number;
  latestActivity: string; // ISO string
  priorityScore: number; // 0 - 100
  priorityFactors: {
    medicalUrgency: number;
    peopleAffected: number;
    trapped: number;
    hazardSeverity: number;
    sosAge: number;
    accessibility: number;
  };
  status: 'ACTIVE' | 'RESCUE_DISPATCHED' | 'RESOLVED';
}

export type SafeVerifyState = 'SAFE' | 'ASSISTANCE' | 'TRAPPED' | 'MEDICAL' | 'UNACCOUNTED';

export interface SafeVerifyRecord {
  id: string;
  citizenPhone: string;
  campaignId: string;
  state: SafeVerifyState;
  timestamp: string;
  callId: string;
  district: string;
}
