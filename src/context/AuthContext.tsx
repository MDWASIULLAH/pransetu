import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Role, Permission } from '../types/role';

interface AuthContextType {
  user: User | null;
  login: (role: Role) => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const rolePermissions: Record<Role, Permission[]> = {
  SUPER_ADMIN: [
    'sos.view', 'sos.acknowledge', 'sos.escalate', 'sos.exact_location',
    'incident.view', 'incident.manage', 'incident.priority.change',
    'rescue.view', 'rescue.assign', 'rescue.dispatch',
    'campaign.view', 'campaign.create', 'alert.publish',
    'users.manage', 'system.config', 'audit.view'
  ],
  DISASTER_MANAGEMENT_OFFICER: [
    'sos.view', 'sos.acknowledge', 'sos.escalate',
    'incident.view', 'incident.manage', 'incident.priority.change',
    'rescue.view', 'rescue.assign', 'rescue.dispatch', // DMO can approve rescue
    'campaign.view', 'campaign.create', 'alert.publish'
  ],
  EOC_OPERATOR: [
    'sos.view', 'sos.acknowledge', 'sos.escalate', 'sos.exact_location',
    'incident.view'
  ],
  RESCUE_COORDINATOR: [
    'sos.view', 'sos.exact_location',
    'incident.view',
    'rescue.view', 'rescue.assign', 'rescue.dispatch'
  ],
  OBSERVER: [
    'sos.view', 'sos.mask_phone', 'incident.view', 'rescue.view'
  ]
};

const demoUsers: Record<Role, User> = {
  SUPER_ADMIN: { id: 'u1', name: 'Arif Rahman', email: 'superadmin@pransetus.gov.in', role: 'SUPER_ADMIN', permissions: rolePermissions['SUPER_ADMIN'] },
  DISASTER_MANAGEMENT_OFFICER: { id: 'u2', name: 'Dr. S. Mohanty', email: 'dmo@pransetus.gov.in', role: 'DISASTER_MANAGEMENT_OFFICER', permissions: rolePermissions['DISASTER_MANAGEMENT_OFFICER'] },
  EOC_OPERATOR: { id: 'u3', name: 'Operator 4', email: 'operator@pransetus.gov.in', role: 'EOC_OPERATOR', permissions: rolePermissions['EOC_OPERATOR'] },
  RESCUE_COORDINATOR: { id: 'u4', name: 'Cmdr. R. Singh', email: 'rescue@pransetus.gov.in', role: 'RESCUE_COORDINATOR', permissions: rolePermissions['RESCUE_COORDINATOR'] },
  OBSERVER: { id: 'u5', name: 'Gov Observer', email: 'observer@pransetus.gov.in', role: 'OBSERVER', permissions: rolePermissions['OBSERVER'] }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(demoUsers.DISASTER_MANAGEMENT_OFFICER); // Default DMO

  const login = (role: Role) => {
    setUser(demoUsers[role]);
  };

  const logout = () => {
    setUser(null);
  };

  const hasPermission = (permission: Permission) => {
    return user?.permissions.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: demoUsers.DISASTER_MANAGEMENT_OFFICER,
      login: () => {},
      logout: () => {},
      hasPermission: () => true
    };
  }
  return context;
};
