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
  sos_id: string; // e.g. OD-7A92F31
  protocol_version: string;
  device_id: string;
  source: SOSSource;
  latitude: number;
  longitude: number;
  accuracy_m: number;
  location_timestamp: string;
  created_at: string;
  people_count: number;
  medical_required: boolean;
  severity: SOSSeverity;
  message?: string;
  hop_count: number;
  ttl: number;
  delivery_state: DeliveryState;
  incident_id?: string; // Associated spatial/operational cluster
  priority_score?: number; // Computed priority 0-100
  relay_trail?: string[]; // Timestamped delivery path or just devices
  acknowledged_by?: string; // user id
  
  // Sensitive/optional
  user_id?: string;
  phone_reference?: string;
  user_name?: string;
  user_phone?: string;
  user_email?: string;
}
