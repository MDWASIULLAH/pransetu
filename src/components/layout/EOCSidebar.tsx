import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, Map, RadioReceiver, ShieldAlert, Crosshair, 
  CheckCircle, Users, Home, PhoneCall, BrainCircuit, Activity, 
  Settings, FileText, Database, Shield, MonitorPlay
} from 'lucide-react';
import { clsx } from 'clsx';
import type { Role } from '../../types/role';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const navItems: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'EOC_OPERATOR', 'RESCUE_COORDINATOR', 'OBSERVER'] },
  { id: 'map', label: 'Live Map', icon: Map, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'EOC_OPERATOR', 'RESCUE_COORDINATOR', 'OBSERVER'] },
  { id: 'sos', label: 'SOS Management', icon: RadioReceiver, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'EOC_OPERATOR'] },
  { id: 'incidents', label: 'Incidents', icon: ShieldAlert, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'EOC_OPERATOR', 'RESCUE_COORDINATOR', 'OBSERVER'] },
  { id: 'priority', label: 'Rescue Priority', icon: Crosshair, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER'] },
  { id: 'safeverify', label: 'SafeVerify', icon: CheckCircle, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'EOC_OPERATOR', 'RESCUE_COORDINATOR'] },
  { id: 'teams', label: 'Rescue Teams', icon: Users, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'RESCUE_COORDINATOR'] },
  { id: 'shelters', label: 'Shelters', icon: Home, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'RESCUE_COORDINATOR', 'OBSERVER'] },
  { id: 'ivr', label: 'Voice / IVR', icon: PhoneCall, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER'] },
  { id: 'ai', label: 'Domino-AI', icon: BrainCircuit, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER'] },
  { id: 'relay', label: 'Relay Network', icon: Activity, roles: ['SUPER_ADMIN'] },
  { id: 'users', label: 'Users', icon: Users, roles: ['SUPER_ADMIN'] },
  { id: 'roles', label: 'Roles & Perms', icon: Shield, roles: ['SUPER_ADMIN'] },
  { id: 'audit', label: 'Audit Logs', icon: Database, roles: ['SUPER_ADMIN'] },
  { id: 'reports', label: 'Reports', icon: FileText, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'OBSERVER'] },
  { id: 'settings', label: 'System Settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  // Simulators & Demos (Visible to all for SIH)
  { id: 'demo', label: 'SIH Simulators', icon: MonitorPlay, roles: ['SUPER_ADMIN', 'DISASTER_MANAGEMENT_OFFICER', 'EOC_OPERATOR', 'RESCUE_COORDINATOR', 'OBSERVER'] },
];

interface EOCSidebarProps {
  activeModule: string;
  setActiveModule: (id: string) => void;
  isOpen: boolean;
}

export const EOCSidebar = ({ activeModule, setActiveModule, isOpen }: EOCSidebarProps) => {
  const { user } = useAuth();
  
  if (!user) return null;

  const allowedItems = navItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className={clsx(
      "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-surface-container border-r border-outline-variant/30 transition-transform duration-300 ease-in-out transform flex flex-col h-[calc(100vh-4rem)] top-16",
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    )}>
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Modules
        </div>
        <nav className="space-y-1 px-2">
          {allowedItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => setActiveModule(item.id)}
                className={clsx(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-blue-900/40 text-on-surface border border-outline-variant/30" 
                    : "text-on-surface-variant hover:bg-[#1f2937] hover:text-gray-200"
                )}
              >
                <Icon size={18} className={isActive ? "text-on-surface" : "text-gray-500"} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="p-4 border-t border-outline-variant/30">
        <div className="bg-surface-container rounded border border-outline-variant/30 p-3">
          <div className="text-xs text-gray-500 mb-1">Session Target</div>
          <div className="text-sm font-sans text-on-surface-variant">Gov. API Adapter</div>
          <div className="flex items-center gap-2 mt-2">
            
            <span className="text-[10px] text-on-surface-variant uppercase">Authenticated</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
