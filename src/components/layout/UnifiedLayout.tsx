import React, { useState, useEffect } from 'react';
import { useEOC } from '../../context/EOCContext';
import { useSound } from '../../context/SoundContext';
import { useAuth } from '../../context/AuthContext';

interface UnifiedLayoutProps {
  activeNav: string;
  onNavigate: (nav: string) => void;
  onLogout?: () => void;
  onNavigateToRegister?: () => void;
  children: React.ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  activeNav,
  onNavigate,
  onLogout,
  children
}) => {
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<'RED_CRITICAL' | 'ORANGE_WARNING' | 'YELLOW_WATCH'>('RED_CRITICAL');
  const [alertMessage, setAlertMessage] = useState('Cyclone Alert: Coastal storm surge warning. Immediate shelter movement advised.');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // Default to dark mode if nothing saved
    return true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const {
    raiseStateAlert,
    broadcastSystemAlert,
    toastMessage,
    metrics,
    signals,
    shelters
  } = useEOC();

  const { soundEnabled, toggleSound } = useSound();

  // Real-time ticking operational clock (IST)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-IN', { hour12: false }));
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { id: 'command', label: 'Command Center', icon: 'dashboard', badge: `${metrics.criticalCount} Crit` },
    { id: 'map', label: 'Mission Map', icon: 'map', badge: 'GIS' },
    { id: 'sos', label: 'SOS Canonical Logs', icon: 'list_alt', badge: `${signals.length}` },
    { id: 'voice', label: 'Voice Campaigns', icon: 'record_voice_over', badge: 'IVR' },
    { id: 'safeverify', label: 'SafeVerify Audit', icon: 'verified_user', badge: 'New' },
    { id: 'registry', label: 'Citizen Registry', icon: 'group', badge: 'Auth' },
    { id: 'resources', label: 'Shelters & Logistics', icon: 'inventory_2', badge: `${shelters.length}` },
    { id: 'broadcast', label: 'Emergency Broadcast', icon: 'warning', badge: 'CRIT' },
    { id: 'alerts', label: 'Disaster Alerts', icon: 'campaign', badge: 'Alerts' },
    { id: 'audit', label: 'Security & Audit Logs', icon: 'security', badge: 'Audit' },
    { id: 'support', label: 'Field Incident Support', icon: 'support_agent', badge: 'Live' }
  ];

  const handleRaiseAlert = (e: React.FormEvent) => {
    e.preventDefault();
    raiseStateAlert(alertSeverity, alertMessage);
    broadcastSystemAlert(alertSeverity, alertMessage);
    setAlertModalOpen(false);
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-on-background flex flex-col font-body-sm relative">
      
      {/* Toast Notification Banner - Muted, Enterprise Style */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] bg-surface border border-outline-variant text-on-surface px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
          <span className="material-symbols-outlined text-primary text-[20px]">info</span>
          <span className="font-medium text-body-sm">{toastMessage}</span>
        </div>
      )}

      {/* State Alert Broadcast Modal */}
      {alertModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant p-6 rounded-lg w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[24px]">warning</span>
                <h3 className="font-sans font-semibold">Broadcast Emergency Alert</h3>
              </div>
              <button 
                onClick={() => setAlertModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRaiseAlert} className="mt-5 space-y-5">
              <div>
                <label className="text-on-surface-variant block mb-1.5">Severity Level</label>
                <select 
                  value={alertSeverity} 
                  onChange={(e) => setAlertSeverity(e.target.value as any)}
                  className="w-full bg-surface-container-high border border-outline-variant rounded p-2.5 text-on-surface text-body-sm focus:outline-none focus:border-outline"
                >
                  <option value="RED_CRITICAL">Red — immediate evacuation</option>
                  <option value="ORANGE_WARNING">Orange — high wind warning</option>
                  <option value="YELLOW_WATCH">Yellow — preparedness</option>
                </select>
              </div>

              <div>
                <label className="text-on-surface-variant block mb-1.5">Message</label>
                <textarea 
                  rows={3} 
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant rounded p-2.5 text-on-surface text-body-sm focus:outline-none focus:border-outline"
                  placeholder="Enter bulletin..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setAlertModalOpen(false)}
                  className="px-4 py-2 bg-surface-container-high border border-outline-variant text-on-surface rounded text-body-sm hover:bg-surface-container-highest transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-error text-on-error rounded text-body-sm font-medium hover:bg-error/90 transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                  Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Top NavBar (Minimalist, Flat, Data-Dense) */}
      <nav className="bg-surface fixed top-0 left-0 w-full z-[1000] flex items-center justify-between px-4 h-14 border-b border-outline-variant">
        
        {/* Left: Brand & Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">
              {sidebarOpen ? 'menu_open' : 'menu'}
            </span>
          </button>
          
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-[22px] sm:text-[24px]">menu</span>
          </button>

          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => onNavigate('command')}
          >
            <img src="/pransetu_logo.png" alt="PRANSETU Logo" className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-on-surface text-base sm:text-lg tracking-tight bg-gradient-to-r from-primary via-blue-400 to-teal-400 bg-clip-text text-transparent">PRANSETU</span>
              <span className="text-[9px] text-on-surface-variant font-mono tracking-widest hidden sm:inline">STATE EOC COMMAND</span>
            </div>
          </div>
        </div>

        {/* Center: System Telemetry */}
        <div className="hidden lg:flex flex-1 items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary"></div>
            <span>System Nominal</span>
          </div>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-xs">
            <span className="material-symbols-outlined text-[14px]">satellite_alt</span>
            <span>Uplink Active</span>
          </div>
          <div className="tabular-nums text-on-surface-variant text-[12px]">
            {currentTime || '00:00:00'} IST
          </div>
        </div>

        {/* Right Section: Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href="https://github.com/nirmalya-ghosh/PRANSETU-sih-26"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container-high border border-outline-variant hover:border-primary/40 hover:bg-surface-container-highest text-on-surface text-xs font-semibold transition-all shadow-sm"
            title="Official GitHub Repository: nirmalya-ghosh/PRANSETU-sih-26"
          >
            <svg className="w-4 h-4 fill-current text-on-surface" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
              {isDarkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          <button 
            onClick={toggleSound}
            className={`text-on-surface-variant hover:text-on-surface transition-colors ${soundEnabled ? 'text-primary' : ''}`}
            title={soundEnabled ? 'Audio Enabled' : 'Audio Muted'}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          <button 
            onClick={() => setAlertModalOpen(true)}
            className="h-6 sm:h-7 px-2 sm:px-3 bg-error/10 text-on-error-container hover:bg-error/20 border border-error/20 rounded text-[10px] sm:text-xs font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[12px] sm:hidden">warning</span>
            <span className="hidden sm:inline">Raise alert</span>
            <span className="sm:hidden">ALERT</span>
          </button>

          <div className="w-px h-5 bg-outline-variant mx-0.5 sm:mx-1 hidden sm:block"></div>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center overflow-hidden">
                <span className="material-symbols-outlined text-[14px] sm:text-[16px]">person</span>
              </div>
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-[1001]" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-10 w-56 bg-surface border border-outline-variant rounded shadow-lg p-2 z-[1002]">
                  <div className="px-2 pb-2 mb-2 border-b border-outline-variant">
                    <p className="font-medium text-body-sm text-on-surface">{user?.name || 'Operator'}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{user?.role || 'Admin'}</p>
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout?.();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-container-high text-body-sm text-on-surface transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Body */}
      <div className="flex-1 flex pt-14 h-full overflow-hidden">
        
        {/* Sidebar — collapses to icons; hidden below md, where the drawer takes over */}
        <aside
          className={`hidden md:flex flex-col bg-background border-r border-outline-variant transition-all duration-200 z-30 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] ${
            sidebarOpen ? 'w-60' : 'w-14'
          }`}
        >
          <div className="py-4 space-y-1 flex-1 overflow-y-auto px-2">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-body-sm transition-colors ${
                    isActive
                      ? 'bg-surface-container-high text-on-surface font-medium'
                      : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[18px] opacity-80">{item.icon}</span>
                    {sidebarOpen && <span>{item.label}</span>}
                  </div>
                  {sidebarOpen && isActive && (
                    <span className="text-xs text-on-surface-variant">{item.badge}</span>
                  )}
                </button>
              );
            })}
          </div>

          {sidebarOpen && (
            <div className="p-3 border-t border-outline-variant">
              <a
                href="https://github.com/nirmalya-ghosh/PRANSETU-sih-26"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-2.5 bg-surface-container border border-outline-variant hover:bg-surface-container-high hover:border-primary/40 text-on-surface rounded text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 fill-current text-on-surface" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <span>GitHub Repository</span>
              </a>
            </div>
          )}
        </aside>

        {/* Mobile Slide-Over Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[9995] md:hidden">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-background h-full p-4 flex flex-col justify-between shadow-lg border-r border-outline-variant animate-in slide-in-from-left">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-4">
                  <div className="flex items-center gap-2">
                    <img src="/pransetu_logo.png" alt="PRANSETU Logo" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-sm text-on-surface">PRANSETU EOC</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = activeNav === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-md text-body-sm transition-colors ${
                          isActive
                            ? 'bg-surface-container-high text-on-surface font-medium'
                            : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px] opacity-80">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {isActive && <span className="text-xs text-on-surface-variant">{item.badge}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant space-y-2">
                <a
                  href="https://github.com/nirmalya-ghosh/PRANSETU-sih-26"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4 fill-current text-on-surface" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                  <span>GitHub Repository</span>
                </a>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout?.();
                  }}
                  className="w-full py-2.5 bg-surface border border-outline-variant hover:bg-surface-container-high text-on-surface rounded text-body-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Central Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-background overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
