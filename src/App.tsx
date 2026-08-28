import { useState, useEffect } from 'react';
import { UnifiedLayout } from './components/layout/UnifiedLayout';
import { CommandCenter } from './components/CommandCenter';
import { MissionMap } from './components/MissionMap';
import { SOSLogs } from './components/SOSLogs';
import { IVRBroadcast } from './components/IVRBroadcast';
import { SafeVerifyDashboard } from './components/dashboard/SafeVerifyDashboard';
import { Resources } from './components/Resources';
import { Support } from './components/Support';
import { DisasterAlertsManager } from './components/alerts/DisasterAlertsManager';
import { AuditLogsModule } from './components/modules/AuditLogsModule';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { CitizenRegistry } from './components/dashboard/CitizenRegistry';
import { GlobalSirenManager } from './components/common/GlobalSirenManager';
import { EmergencyBroadcast } from './components/modules/EmergencyBroadcast';

export default function App() {
  const [currentView, setCurrentView] = useState<'app' | 'login' | 'register'>('app');
  
  const getHashNav = () => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'command';
  };
  
  const [activeNav, setActiveNav] = useState(getHashNav());

  useEffect(() => {
    const handleHashChange = () => {
      setActiveNav(getHashNav());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (nav: string) => {
    window.location.hash = nav;
    setActiveNav(nav);
  };

  if (currentView === 'login') {
    return (
      <Login
        onLoginSuccess={() => setCurrentView('app')}
        onNavigateToRegister={() => setCurrentView('register')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <Register
        onNavigateToLogin={() => setCurrentView('login')}
      />
    );
  }

  const renderActiveModule = () => {
    switch (activeNav) {
      case 'command':
        return <CommandCenter onNavigate={handleNavigate} />;
      case 'map':
        return <MissionMap />;
      case 'sos':
        return <SOSLogs />;
      case 'voice':
        return <IVRBroadcast />;
      case 'safeverify':
        return <SafeVerifyDashboard />;
      case 'registry':
        return <CitizenRegistry />;
      case 'resources':
        return <Resources />;
      case 'alerts':
        return <DisasterAlertsManager />;
      case 'audit':
        return <AuditLogsModule />;
      case 'broadcast':
        return <EmergencyBroadcast />;
      case 'support':
        return <Support />;
      default:
        return <CommandCenter onNavigate={handleNavigate} />;
    }
  };

  return (
    <UnifiedLayout
      activeNav={activeNav}
      onNavigate={handleNavigate}
      onLogout={() => setCurrentView('login')}
      onNavigateToRegister={() => setCurrentView('register')}
    >
      <GlobalSirenManager />
      {renderActiveModule()}
    </UnifiedLayout>
  );
}
