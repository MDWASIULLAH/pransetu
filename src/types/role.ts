export type Role = 
  | 'SUPER_ADMIN'
  | 'DISASTER_MANAGEMENT_OFFICER'
  | 'EOC_OPERATOR'
  | 'RESCUE_COORDINATOR'
  | 'OBSERVER';

export type Permission = 
  // SOS
  | 'sos.view'
  | 'sos.acknowledge'
  | 'sos.escalate'
  | 'sos.exact_location'
  | 'sos.mask_phone'
  // Incidents
  | 'incident.view'
  | 'incident.manage'
  | 'incident.priority.change'
  // Rescue
  | 'rescue.view'
  | 'rescue.assign'
  | 'rescue.dispatch'
  // IVR & Voice
  | 'campaign.view'
  | 'campaign.create'
  // Alerts
  | 'alert.publish'
  // Admin
  | 'users.manage'
  | 'system.config'
  | 'audit.view';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}
