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
  onNavigateToRegister,
  children
}) => {
  const { user } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop sidebar toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [simDrawerOpen, setSimDrawerOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [alertSeverity, setAlertSeverity] = useState<'RED_CRITICAL' | 'ORANGE_WARNING' | 'YELLOW_WATCH'>('RED_CRITICAL');
  const [alertMessage, setAlertMessage] = useState('Cyclone Alert: Coastal storm surge warning. Immediate shelter movement advised.');

  const {
    activeAlert,
    clearStateAlert,
    raiseStateAlert,
    toastMessage,
    injectNewSignal,
    recordDTMF,
    updateShelterOccupancy,
    autoSimulate,
    setAutoSimulate,
    metrics
  } = useEOC();

  const { soundEnabled, toggleSound } = useSound();

  // Scroll to Top Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRaiseAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertModalOpen(false);
    raiseStateAlert(alertSeverity, alertMessage);
  };

  const navItems = [
    { id: 'command', label: 'Command Center', icon: 'dashboard', fillIcon: true },
    { id: 'map', label: 'Mission Map', icon: 'map' },
    { id: 'sos', label: 'SOS Logs', icon: 'list_alt' },
    { id: 'voice', label: 'Voice Campaigns', icon: 'settings_voice' },
    { id: 'resources', label: 'Resources', icon: 'inventory_2' },
    { id: 'support', label: 'Support', icon: 'contact_support' }
  ];

  return (
    <div className="min-h-screen bg-background text-on-background antialiased flex flex-col selection:bg-tertiary selection:text-on-tertiary overflow-x-hidden font-body-sm text-body-sm">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-[120] bg-surface-container-high border border-primary text-on-surface px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce max-w-sm sm:max-w-md">
          <span className="material-symbols-outlined text-primary text-[22px] shrink-0">check_circle</span>
          <span className="font-data-value text-data-value text-primary text-xs sm:text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Statewide Emergency Flashing Alert Bar */}
      {activeAlert && (
        <div className="bg-error-container text-on-error-container px-3 sm:px-4 py-2 flex items-center justify-between z-[110] sticky top-0 border-b-2 border-error shadow-xl animate-pulse">
          <div className="flex items-center gap-2 sm:gap-3 max-w-[85%]">
            <span className="material-symbols-outlined text-error text-[22px] shrink-0">cell_tower</span>
            <div className="truncate">
              <span className="font-data-label font-bold uppercase tracking-wider bg-error text-surface px-1.5 py-0.5 rounded text-[10px] mr-1.5">
                {activeAlert.severity.replace('_', ' ')}
              </span>
              <span className="font-headline-sm text-xs sm:text-sm font-bold">{activeAlert.message}</span>
              <span className="text-[11px] opacity-80 ml-2 hidden sm:inline font-data-value">({activeAlert.timestamp})</span>
            </div>
          </div>
          <button 
            onClick={clearStateAlert}
            className="text-on-error-container hover:text-white px-2 py-1 rounded text-xs font-bold border border-error-container/50 hover:bg-error/30 cursor-pointer shrink-0"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* State Alert Broadcast Modal */}
      {alertModalOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-error-container p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[26px]">warning</span>
                <h3 className="font-headline-sm text-headline-sm font-bold">STATE EMERGENCY BROADCAST</h3>
              </div>
              <button 
                onClick={() => setAlertModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRaiseAlert} className="mt-4 space-y-4">
              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Alert Severity Level
                </label>
                <select 
                  value={alertSeverity} 
                  onChange={(e) => setAlertSeverity(e.target.value as any)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-data-value text-data-value focus:outline-none focus:border-error"
                >
                  <option value="RED_CRITICAL">RED ALERT - Immediate Evacuation & Life Threat</option>
                  <option value="ORANGE_WARNING">ORANGE ALERT - High Wind & Flood Warning</option>
                  <option value="YELLOW_WATCH">YELLOW WATCH - Preparedness Advisory</option>
                </select>
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Broadcast Message
                </label>
                <textarea 
                  rows={3} 
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-error"
                  placeholder="Enter state alert bulletin..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setAlertModalOpen(false)}
                  className="px-4 py-2 bg-surface-bright border border-outline-variant text-on-surface rounded font-data-label text-data-label hover:bg-surface-container-highest cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-error-container text-on-error-container rounded font-headline-sm text-headline-sm hover:bg-secondary-container transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">cell_tower</span>
                  Broadcast Siren & IVR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Simulation Control Panel (SIH Demo Helper) */}
      <div className="fixed bottom-16 md:bottom-6 right-4 z-50">
        {simDrawerOpen ? (
          <div className="bg-surface-container-high border-2 border-primary/60 p-4 rounded-xl shadow-2xl backdrop-blur-md w-72 space-y-3 animate-in fade-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
              <span className="font-data-label text-primary font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
                SIH SIMULATOR
              </span>
              <button 
                onClick={() => setSimDrawerOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer text-xs"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => injectNewSignal()}
                className="w-full bg-surface-bright hover:bg-surface-container-highest border border-error-container text-on-surface text-xs font-bold py-2 px-3 rounded flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-error text-[16px]">emergency</span>
                Simulate Inbound SOS
              </button>

              <button 
                onClick={() => recordDTMF(Math.random() > 0.3 ? '1' : '2')}
                className="w-full bg-surface-bright hover:bg-surface-container-highest border border-tertiary text-on-surface text-xs font-bold py-2 px-3 rounded flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-tertiary text-[16px]">call</span>
                Simulate IVR Response
              </button>

              <button 
                onClick={() => updateShelterOccupancy('SH-01', 45)}
                className="w-full bg-surface-bright hover:bg-surface-container-highest border border-primary text-on-surface text-xs font-bold py-2 px-3 rounded flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-primary text-[16px]">home_work</span>
                Simulate Shelter Inflow (+45)
              </button>

              <button 
                onClick={() => setAutoSimulate((prev) => !prev)}
                className={`w-full text-xs font-bold py-2 px-3 rounded flex items-center justify-between cursor-pointer border transition-colors ${
                  autoSimulate 
                    ? 'bg-status-green/20 border-status-green text-status-green' 
                    : 'bg-surface-bright border-outline-variant text-on-surface-variant'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${autoSimulate ? 'bg-status-green animate-ping' : 'bg-outline'}`}></span>
                  Live Auto-Telemetry
                </span>
                <span className="font-data-value text-[10px] uppercase">{autoSimulate ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setSimDrawerOpen(true)}
            className="bg-primary-container text-primary border border-primary/40 p-2.5 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-2 cursor-pointer font-data-label text-xs"
            title="Open SIH Live Simulator Controls"
          >
            <span className="material-symbols-outlined text-[20px] animate-spin" style={{ animationDuration: '6s' }}>precision_manufacturing</span>
            <span className="hidden sm:inline font-bold pr-1">SIM TOOLKIT</span>
          </button>
        )}
      </div>

      {/* Floating Mobile Scroll-To-Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-16 md:bottom-6 left-4 z-40 bg-surface-container-high border border-outline-variant hover:bg-surface-bright text-primary p-2.5 rounded-full shadow-2xl transition-all cursor-pointer hover:scale-110 flex items-center justify-center"
          title="Scroll to Top"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_upward</span>
        </button>
      )}

      {/* TopNavBar (Responsive for Desktop and Mobile Viewports) */}
      <nav className="bg-surface-container-high fixed top-0 left-0 w-full z-40 flex items-center justify-between px-2 sm:px-4 md:px-margin-desktop h-16 border-b border-outline-variant">
        <div className="flex items-center gap-1 sm:gap-2 md:gap-stack-lg min-w-0 flex-1">
          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-on-surface hover:text-primary p-1.5 rounded-lg cursor-pointer shrink-0"
            aria-label="Open mobile menu"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          {/* Desktop Sidebar Toggle Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-bright p-2 rounded-lg transition-colors cursor-pointer shrink-0"
            title={sidebarOpen ? "Close Sidebar (Full Width View)" : "Open Sidebar"}
          >
            <span className="material-symbols-outlined text-[22px]">
              {sidebarOpen ? 'menu_open' : 'menu'}
            </span>
          </button>

          {/* Brand Logo (Responsive single-line typography with shrink safety) */}
          <div 
            className="font-headline-sm sm:font-headline-lg text-sm sm:text-base md:text-headline-lg font-bold text-primary tracking-tight cursor-pointer flex items-center gap-1.5 shrink min-w-0" 
            onClick={() => onNavigate('command')}
          >
            <span className="material-symbols-outlined text-secondary text-[20px] sm:text-[24px] shrink-0">shield</span>
            <span className="whitespace-nowrap font-bold truncate">
              PRANSETU S<span className="hidden sm:inline font-normal opacity-90"> Web EOC</span>
            </span>
          </div>

          {/* Navigation Links (Desktop) */}
          <ul className="hidden md:flex items-center gap-stack-md ml-stack-lg">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <li key={item.id}>
                  <button 
                    onClick={() => onNavigate(item.id)}
                    className={`font-headline-sm text-headline-sm transition-transform flex items-center h-full pt-1 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'text-primary border-b-2 border-primary pb-1 scale-[0.98]'
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors duration-200 px-2 py-1 rounded'
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Trailing Actions (Right-aligned with strict gap spacing) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 ml-2">
          {/* Sound Toggle */}
          <button 
            onClick={toggleSound}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full transition-colors cursor-pointer shrink-0 ${
              soundEnabled ? 'text-status-green hover:bg-surface-bright' : 'text-on-surface-variant hover:bg-surface-bright opacity-60'
            }`}
            title={soundEnabled ? 'Tactical Audio Siren: Enabled' : 'Tactical Audio: Muted'}
          >
            <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          {/* Raise Alert Trigger (Top Bar Quick Action) */}
          <button 
            onClick={() => setAlertModalOpen(true)}
            className="h-8 sm:h-9 bg-error-container text-on-error-container px-2 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-secondary-container transition-colors cursor-pointer shrink-0"
            title="Broadcast State Alert"
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span className="hidden sm:inline">RAISE ALERT</span>
          </button>

          {/* User Profile Popover (Always accessible on Mobile & Desktop) */}
          <div className="relative shrink-0">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-8 sm:h-9 flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 rounded-lg bg-surface-container-highest/50 border border-outline-variant/60 hover:bg-surface-bright transition-colors cursor-pointer"
              title="User Account & Role Menu"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0">
                <span className="material-symbols-outlined text-primary text-[15px] sm:text-[17px]">person</span>
              </div>
              <div className="hidden lg:flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-on-surface whitespace-nowrap truncate max-w-[120px]">
                  {user?.name || 'Dr. S. Mohanty'}
                </span>
                <span className="text-[10px] text-primary uppercase font-mono font-bold whitespace-nowrap truncate max-w-[120px] mt-0.5">
                  {user?.role === 'DISASTER_MANAGEMENT_OFFICER'
                    ? 'DMO • Officer'
                    : user?.role === 'SUPER_ADMIN'
                    ? 'Super Admin'
                    : user?.role === 'RESCUE_COORDINATOR'
                    ? 'Rescue Lead'
                    : user?.role.replace(/_/g, ' ') || 'EOC Operator'}
                </span>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                {userMenuOpen ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-64 bg-surface-container-high border border-outline-variant rounded-xl shadow-2xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="pb-3 border-b border-outline-variant">
                  <p className="font-bold text-xs text-on-surface">{user?.name || 'Dr. S. Mohanty'}</p>
                  <p className="text-[11px] text-on-surface-variant font-mono">{user?.email || 'dmo@pransetus.gov.in'}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                    {user?.role.replace(/_/g, ' ') || 'DISASTER MANAGEMENT OFFICER'}
                  </span>
                </div>

                <div className="py-2 space-y-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigate('command');
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-bright text-xs text-on-surface flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">dashboard</span>
                    Command Center
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onNavigateToRegister?.();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-surface-bright text-xs text-on-surface flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                    Operator Registration
                  </button>
                </div>

                <div className="pt-2 border-t border-outline-variant">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout?.();
                    }}
                    className="w-full text-left px-2 py-1.5 rounded bg-error-container/20 hover:bg-error-container/40 text-error text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Sign Out / Lock Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Slide-Over Sidebar Drawer (With Full Scroll Support & User Card) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative bg-surface w-72 max-w-[85vw] h-full flex flex-col p-4 z-10 border-r border-outline-variant shadow-2xl pt-4 overflow-y-auto">
            {/* Mobile Drawer Header with Close Button */}
            <div className="mb-4 px-1 flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[22px]">security</span>
                </div>
                <div>
                  <div className="font-headline-sm text-headline-sm font-bold text-on-surface text-sm">PRANSETU S</div>
                  <div className="font-data-label text-data-label text-on-surface-variant uppercase text-[10px]">EOC State Command</div>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg cursor-pointer hover:bg-surface-container-highest"
                title="Close Navigation Drawer"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Mobile Logged In User Profile Card */}
            <div className="mb-4 p-3 bg-surface-container border border-outline-variant rounded-xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0">
                <span className="material-symbols-outlined text-primary text-[22px]">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-on-surface truncate">{user?.name || 'Dr. S. Mohanty'}</p>
                <p className="text-[10px] text-primary font-mono font-bold truncate uppercase">{user?.role?.replace(/_/g, ' ') || 'DMO'}</p>
                <p className="text-[10px] text-on-surface-variant font-mono truncate">{user?.email || 'dmo@pransetus.gov.in'}</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = activeNav === item.id;
                return (
                  <button 
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer text-sm ${
                      isActive 
                        ? 'bg-primary-container text-on-primary-container font-bold' 
                        : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Bottom Actions inside Drawer */}
            <div className="mt-auto pt-4 border-t border-outline-variant space-y-2">
              <button 
                onClick={() => {
                  setAlertModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-error-container text-on-error-container py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <span className="material-symbols-outlined text-[16px]">warning</span>
                RAISE STATE ALERT
              </button>

              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLogout?.();
                }}
                className="w-full bg-surface-container-highest hover:bg-surface-bright text-on-surface py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-outline-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-error">logout</span>
                Sign Out / Switch Operator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SideNavBar (Desktop Collapsible) */}
      <aside 
        className={`hidden md:flex bg-surface dark:bg-surface docked h-screen fixed left-0 top-0 w-64 z-30 flex-col pt-20 pb-4 px-4 border-r border-outline-variant transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header with Close Sidebar Button */}
        <div className="mb-stack-lg px-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">security</span>
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm font-bold text-on-surface">PRANSETU S</div>
              <div className="font-data-label text-data-label text-on-surface-variant uppercase text-[11px]">State Level Command</div>
            </div>
          </div>

          {/* Close Sidebar Icon Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors cursor-pointer"
            title="Collapse Sidebar"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 flex flex-col gap-unit overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button 
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-2 font-body-sm text-body-sm rounded-lg text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-bold opacity-90'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer / CTA */}
        <div className="mt-auto flex flex-col gap-stack-sm pt-stack-sm border-t border-outline-variant">
          <button 
            onClick={() => setAlertModalOpen(true)}
            className="w-full bg-error-container text-on-error-container hover:bg-secondary-container font-headline-sm text-headline-sm py-2 rounded transition-colors flex items-center justify-center gap-2 mb-2 cursor-pointer"
          >
            <span className="material-symbols-outlined">warning</span>
            RAISE ALERT
          </button>
          <div className="px-2 text-xs font-data-label text-on-surface-variant/80">
            <div>TEAMS: {metrics.teamsDeployedCount}/{metrics.teamsTotalCount} ACTIVE</div>
            <div>OCCUPANCY: {metrics.sheltersOccupancyPercent}%</div>
          </div>
        </div>
      </aside>

      {/* Main App Content Viewport (Auto-expands to full width when sidebar is closed) */}
      <div 
        className={`flex-1 pt-16 pb-16 md:pb-0 min-h-screen transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        {/* Quick Reopen Button (Floating on the left edge when sidebar is closed) */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="hidden md:flex fixed left-0 top-24 z-30 bg-surface-container-high hover:bg-surface-bright text-on-surface border border-l-0 border-outline-variant py-2.5 px-1.5 rounded-r-lg shadow-xl transition-all cursor-pointer items-center justify-center group"
            title="Open Sidebar Navigation"
          >
            <span className="material-symbols-outlined text-[22px] text-primary group-hover:scale-110 transition-transform">
              chevron_right
            </span>
          </button>
        )}

        {children}
      </div>

      {/* Bottom Navigation Bar (Mobile Thumb Reach) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-surface-container-high border-t border-outline-variant z-40 flex justify-around items-center h-14 px-1">
        {navItems.map((item) => {
          const isActive = activeNav === item.id;
          return (
            <button 
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 cursor-pointer transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[10px] font-medium truncate max-w-[55px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
