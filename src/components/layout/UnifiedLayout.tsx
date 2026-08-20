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
  const [currentTime, setCurrentTime] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'EN' | 'OR' | 'HI'>('EN');

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

  // Scroll to Top Listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'command', label: 'Command Center', icon: 'dashboard', badge: `${metrics.criticalCount} Crit` },
    { id: 'map', label: 'Mission Map', icon: 'map', badge: 'GIS' },
    { id: 'sos', label: 'SOS Canonical Logs', icon: 'list_alt', badge: `${signals.length}` },
    { id: 'voice', label: 'Voice Campaigns', icon: 'record_voice_over', badge: 'IVR' },
    { id: 'resources', label: 'Shelters & Logistics', icon: 'inventory_2', badge: `${shelters.length}` },
    { id: 'support', label: 'Field Incident Support', icon: 'support_agent', badge: 'Live' }
  ];

  const handleRaiseAlert = (e: React.FormEvent) => {
    e.preventDefault();
    raiseStateAlert(alertSeverity, alertMessage);
    setAlertModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col font-body-sm relative hud-grid-background">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] bg-surface-container-high border-2 border-primary/60 text-on-surface px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-5">
          <span className="material-symbols-outlined text-primary text-[22px]">info</span>
          <span className="font-bold text-xs font-mono">{toastMessage}</span>
        </div>
      )}

      {/* Critical State Emergency Alert Banner */}
      {activeAlert && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-error text-on-error px-4 py-2.5 flex items-center justify-between shadow-2xl border-b-2 border-error-container animate-pulse">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[20px]">warning</span>
            <span>[{activeAlert.severity.replace('_', ' ')} BROADCAST]</span>
            <span className="normal-case font-body-sm text-xs font-semibold hidden sm:inline ml-2">
              {activeAlert.message}
            </span>
          </div>
          <button 
            onClick={clearStateAlert}
            className="text-on-error hover:text-white px-2 py-1 rounded text-xs font-bold border border-white/40 hover:bg-white/20 cursor-pointer shrink-0"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* State Alert Broadcast Modal */}
      {alertModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface-container border border-error-container p-6 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
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
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-on-surface font-data-value text-data-value focus:outline-none focus:border-error"
                >
                  <option value="RED_CRITICAL">RED ALERT - Immediate Evacuation &amp; Life Threat</option>
                  <option value="ORANGE_WARNING">ORANGE ALERT - High Wind &amp; Flood Warning</option>
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
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-error"
                  placeholder="Enter state alert bulletin..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setAlertModalOpen(false)}
                  className="px-4 py-2 bg-surface-bright border border-outline-variant text-on-surface rounded-lg font-data-label text-data-label hover:bg-surface-container-highest cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-error text-on-error rounded-lg font-headline-sm text-headline-sm hover:bg-red-700 transition-colors flex items-center gap-2 cursor-pointer font-bold"
                >
                  <span className="material-symbols-outlined text-[18px]">cell_tower</span>
                  Broadcast Siren &amp; IVR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Simulation Control Panel (SIH Demo Helper) */}
      <div className="fixed bottom-16 md:bottom-6 right-4 z-50">
        {simDrawerOpen ? (
          <div className="bg-surface-container-high border-2 border-primary/60 p-4 rounded-2xl shadow-2xl backdrop-blur-md w-72 space-y-3 animate-in fade-in slide-in-from-bottom-5">
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
                className="w-full bg-surface-bright hover:bg-surface-container-highest border border-error/50 text-on-surface text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <span className="material-symbols-outlined text-error text-[16px]">emergency</span>
                Simulate Inbound SOS
              </button>

              <button 
                onClick={() => recordDTMF('1')}
                className="w-full bg-surface-bright hover:bg-surface-container-highest border border-outline-variant text-on-surface text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-status-green text-[16px]">check_circle</span>
                  IVR Key 1 (Safe)
                </span>
                <span className="text-[10px] font-mono text-status-green">+1</span>
              </button>

              <button 
                onClick={() => updateShelterOccupancy('SH-PURI-01', 15)}
                className="w-full bg-surface-bright hover:bg-surface-container-highest border border-outline-variant text-on-surface text-xs font-bold py-1.5 px-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[16px]">home_work</span>
                  Shelter +15 Occupants
                </span>
                <span className="text-[10px] font-mono text-primary">Inundation</span>
              </button>

              <div className="pt-2 border-t border-outline-variant flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-mono">Continuous Telemetry</span>
                <button 
                  onClick={() => setAutoSimulate(!autoSimulate)}
                  className={`px-2 py-1 rounded text-[10px] font-bold font-mono ${
                    autoSimulate ? 'bg-status-green text-on-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  {autoSimulate ? 'RUNNING' : 'PAUSED'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSimDrawerOpen(true)}
            className="bg-surface-container-high/95 hover:bg-surface-bright text-primary border border-primary/40 px-3.5 py-2.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 font-mono text-xs font-bold cursor-pointer transition-all hover:scale-105"
            title="Open SIH Simulation Engine"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">precision_manufacturing</span>
            <span>SIMULATOR</span>
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse"></span>
          </button>
        )}
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-16 md:bottom-6 left-4 z-40 bg-surface-container-high border border-outline-variant hover:bg-surface-bright text-primary p-2.5 rounded-full shadow-2xl transition-all cursor-pointer hover:scale-110 flex items-center justify-center"
          title="Scroll to Top"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_upward</span>
        </button>
      )}

      {/* TopNavBar (Authoritative Government State EOC Header) */}
      <nav className="bg-surface-container-high/95 fixed top-0 left-0 w-full z-[1000] flex items-center justify-between px-3 sm:px-4 md:px-6 h-16 border-b border-outline-variant backdrop-blur-md shadow-lg">
        {/* Left Section: Mobile Menu, Sidebar Toggle, and Brand Title */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
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
            className="hidden md:flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-bright p-2 rounded-lg transition-colors cursor-pointer shrink-0 border border-outline-variant/60"
            title={sidebarOpen ? "Close Sidebar (Full Width View)" : "Open Sidebar"}
          >
            <span className="material-symbols-outlined text-[22px]">
              {sidebarOpen ? 'menu_open' : 'menu'}
            </span>
          </button>

          {/* Brand Logo & Government Title */}
          <div 
            className="font-headline-sm sm:font-headline-lg text-sm sm:text-base md:text-lg font-bold text-primary tracking-tight cursor-pointer flex items-center gap-2 shrink-0" 
            onClick={() => onNavigate('command')}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center text-primary shrink-0 shadow-xs">
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]">shield</span>
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="whitespace-nowrap font-bold text-on-surface text-xs sm:text-sm md:text-base">
                PRANSETU S <span className="hidden sm:inline text-[9px] font-mono font-bold text-primary-fixed bg-primary-container px-1.5 py-0.2 rounded ml-1 border border-primary/30 tracking-wider uppercase">WEB EOC</span>
              </span>
              <span className="hidden sm:inline text-[9px] font-mono text-on-surface-variant tracking-wider uppercase mt-0.5">
                Odisha State Emergency Operations Centre
              </span>
            </div>
          </div>

          {/* Live Tactical Sat-Com Uplink Badge */}
          <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-outline-variant/60 ml-2">
            <span className="w-2 h-2 rounded-full bg-status-green animate-pulse"></span>
            <span className="font-mono text-[10px] text-status-green font-bold uppercase tracking-wider">
              INSAT-3DR SYNCED
            </span>
          </div>
        </div>

        {/* Center: Live Real-Time Clock & Language Switcher */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Live Operational Clock */}
          <div className="bg-surface-container px-3 py-1 rounded-lg border border-outline-variant font-mono text-xs text-on-surface flex items-center gap-1.5 shadow-xs">
            <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
            <span className="font-bold text-primary">{currentTime || '00:00:00'}</span>
            <span className="text-[10px] text-on-surface-variant font-mono">IST</span>
          </div>

          {/* Multilingual Selector (English, Odia, Hindi) */}
          <div className="flex items-center bg-surface-container border border-outline-variant rounded-lg p-0.5 text-xs font-mono">
            {(['EN', 'OR', 'HI'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2 py-0.5 rounded transition-colors cursor-pointer text-[11px] font-bold ${
                  selectedLanguage === lang
                    ? 'bg-primary text-on-primary shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {lang === 'EN' ? 'English' : lang === 'OR' ? 'ଓଡ଼ିଆ' : 'हिन्दी'}
              </button>
            ))}
          </div>
        </div>

        {/* Right Section: Trailing Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {/* Sound Siren Toggle */}
          <button 
            onClick={toggleSound}
            className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg border transition-all cursor-pointer shrink-0 ${
              soundEnabled 
                ? 'bg-green-500/15 border-green-500/40 text-status-green hover:bg-green-500/25 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-bright opacity-60'
            }`}
            title={soundEnabled ? 'Tactical Siren Audio: ACTIVE' : 'Tactical Siren Audio: MUTED'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {soundEnabled ? 'volume_up' : 'volume_off'}
            </span>
          </button>

          {/* Raise Alert Trigger (Top Bar Quick Action) */}
          <button 
            onClick={() => setAlertModalOpen(true)}
            className="h-8 sm:h-9 bg-error text-on-error hover:bg-red-700 px-2.5 sm:px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-error/50 shadow-xs"
            title="Broadcast State Emergency Alert"
          >
            <span className="material-symbols-outlined text-[16px]">warning</span>
            <span className="hidden sm:inline">RAISE ALERT</span>
          </button>

          {/* User Profile Popover */}
          <div className="relative shrink-0">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-8 sm:h-9 flex items-center gap-1.5 sm:gap-2 px-2 rounded-lg bg-surface-container border border-outline-variant hover:bg-surface-bright transition-colors cursor-pointer"
              title="User Account & Role Menu"
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center overflow-hidden shrink-0">
                <span className="material-symbols-outlined text-primary text-[15px] sm:text-[17px]">person</span>
              </div>
              <div className="hidden lg:flex flex-col text-left leading-none">
                <span className="text-xs font-bold text-on-surface whitespace-nowrap truncate max-w-[120px]">
                  {user?.name || 'Dr. S. Mohanty'}
                </span>
                <span className="text-[9px] text-primary uppercase font-mono font-bold whitespace-nowrap truncate max-w-[120px] mt-0.5">
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
              <>
                {/* Transparent click-outside overlay */}
                <div
                  className="fixed inset-0 z-[1001]"
                  onClick={() => setUserMenuOpen(false)}
                />
                <div className="absolute right-0 top-12 w-64 bg-surface-container-high border border-outline-variant rounded-2xl shadow-2xl p-3 z-[1002] animate-in fade-in slide-in-from-top-2">
                  <div className="pb-3 border-b border-outline-variant">
                    <p className="font-bold text-xs text-on-surface">{user?.name || 'Dr. S. Mohanty'}</p>
                    <p className="text-[11px] text-on-surface-variant font-mono">{user?.email || 'dmo@pransetus.gov.in'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary border border-primary/30 font-mono">
                      {user?.role.replace(/_/g, ' ') || 'DISASTER MANAGEMENT OFFICER'}
                    </span>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigate('command');
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-bright text-xs text-on-surface flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">dashboard</span>
                      Command Center
                    </button>
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onNavigateToRegister?.();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-surface-bright text-xs text-on-surface flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">how_to_reg</span>
                      Operator Registration
                    </button>
                  </div>

                  <div className="pt-2 border-t border-outline-variant">
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout?.();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-lg bg-error/15 hover:bg-error/25 text-error text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors border border-error/30"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Sign Out / Lock Session
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main App Body with Collapsible Sidebar and Central Content */}
      <div className="flex-1 flex pt-16 min-h-screen">
        {/* Desktop Collapsible Left Navigation Sidebar */}
        <aside
          className={`hidden md:flex flex-col bg-surface-container border-r border-outline-variant transition-all duration-300 z-30 shrink-0 sticky top-16 h-[calc(100vh-4rem)] ${
            sidebarOpen ? 'w-64' : 'w-16'
          }`}
        >
          {/* Module Navigation List */}
          <div className="p-2 space-y-1.5 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary-container text-primary font-bold shadow-xs border border-primary/30'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </div>
                  {sidebarOpen && (
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Info */}
          {sidebarOpen && (
            <div className="p-3 border-t border-outline-variant bg-surface-container-low text-[10px] font-mono text-on-surface-variant space-y-1">
              <div className="flex justify-between items-center">
                <span>SEOC SECTOR:</span>
                <span className="text-status-green font-bold">ALPHA-01 (ACTIVE)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>MESH PROTOCOL:</span>
                <span className="text-primary font-bold">v2.4-CANONICAL</span>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Slide-Over Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[9995] md:hidden">
            <div 
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-surface-container h-full p-4 flex flex-col justify-between shadow-2xl border-r border-outline-variant animate-in slide-in-from-left">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-outline-variant mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[20px]">shield</span>
                    </div>
                    <span className="font-bold text-sm text-primary">PRANSETU S EOC</span>
                  </div>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {navItems.map((item) => {
                    const isActive = activeNav === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onNavigate(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-primary-container text-primary font-bold border border-primary/30'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-bright'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold bg-surface-container-highest px-2 py-0.5 rounded">
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant space-y-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout?.();
                  }}
                  className="w-full py-2 bg-error/15 text-error rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Sign Out Session
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Central Viewport Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
          {children}

          {/* Official Government Prototype EOC Footer */}
          <footer className="mt-auto border-t border-outline-variant/60 bg-surface-container/80 p-4 text-center text-xs font-mono text-on-surface-variant/80">
            <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
              <span>
                PRANSETU S • Government of Odisha Disaster Management Authority (OSDMA) / NDMA Web EOC
              </span>
              <span className="text-[11px] text-primary">
                Store-and-Forward Mesh Protocol v2.4 • TLS 1.3 End-to-End Encrypted
              </span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
