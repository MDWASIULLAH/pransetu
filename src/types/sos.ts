export type SOSSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type DeliveryState = 
  | 'CREATED'
  | 'STORED'
  | 'RELAYING'
  | 'RELAYED'
  | 'GATEWAY_RECEIVED'
  | 'SERVER_DELIVERED'
  | 'CLOSED';

export type SOSSource = 'ANDROID' | 'IVR' | 'EXTERNAL';

export interface SOSRecord {
  id: string; // e.g. OD-7A92F31
  deviceId: string;
  source: SOSSource;
  lat: number;
  lng: number;
  accuracyM: number;
  locationTimestamp: string;
  createdAt: string;
  peopleCount: number;
  medicalRequired: boolean;
  severity: SOSSeverity;
  hopCount: number;
  ttl: number;
  deliveryState: DeliveryState;
  incidentId?: string; // Associated spatial/operational cluster
  relayTrail?: string[]; // Timestamped delivery path or just devices
  acknowledgedBy?: string; // user id
  notes?: string;
  citizenPhone?: string; // Could be masked based on role
}
