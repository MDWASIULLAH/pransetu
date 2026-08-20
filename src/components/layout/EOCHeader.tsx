import { Bell, ShieldAlert, LogOut, Volume2, VolumeX, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import type { Role } from '../../types/role';

export const EOCHeader = ({ onMenuClick }: { onMenuClick?: () => void }) => {
  const { user, login, logout } = useAuth();
  const { soundEnabled, toggleSound } = useSound();

  const handleRoleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    login(e.target.value as Role);
  };

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 bg-[#0a0e17] border-b border-[#1f2937] text-white z-50 relative sticky top-0">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-[#1f2937] rounded-md">
            <Menu size={24} />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900/50 rounded-full flex items-center justify-center border border-blue-500/30">
            <ShieldAlert className="text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200 uppercase m-0 leading-tight">
              PRANSETU S
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest m-0">Emergency Operations Centre</p>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-6 ml-8">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            <span className="text-xs text-gray-300 font-mono">SYSTEM: OPERATIONAL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
            <span className="text-xs text-gray-300 font-mono">REALTIME: CONNECTED</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-red-900/30 border border-red-500/30 rounded-full">
            <span className="text-xs text-red-400 font-semibold uppercase tracking-wider">Active: Cyclone + Flood Response</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        <button onClick={toggleSound} className="text-gray-400 hover:text-white transition-colors" title="Toggle Alerts">
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
        
        <div className="relative">
          <Bell size={20} className="text-gray-400 hover:text-white cursor-pointer" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-[9px] font-bold flex items-center justify-center rounded-full">3</span>
        </div>

        <div className="flex items-center gap-3 pl-4 border-l border-[#1f2937]">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-semibold">{user?.name}</div>
            <div className="text-[10px] text-blue-400 uppercase font-mono tracking-wider">
              {user?.role.replace(/_/g, ' ')}
            </div>
          </div>
          <div className="w-8 h-8 rounded bg-gray-800 border border-gray-700 flex items-center justify-center font-bold text-gray-300">
            {user?.name.charAt(0)}
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-[#1f2937]">
          <select 
            value={user?.role} 
            onChange={handleRoleSwitch}
            className="bg-[#111827] border border-[#374151] text-xs text-gray-300 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="SUPER_ADMIN">SUPER_ADMIN (Demo)</option>
            <option value="DISASTER_MANAGEMENT_OFFICER">DMO (Demo)</option>
            <option value="EOC_OPERATOR">OPERATOR (Demo)</option>
            <option value="RESCUE_COORDINATOR">RESCUE COORD (Demo)</option>
            <option value="OBSERVER">OBSERVER (Demo)</option>
          </select>
        </div>

        <button onClick={logout} className="text-gray-500 hover:text-red-400 transition-colors" title="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
};
