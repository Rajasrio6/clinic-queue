import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { HomeView } from './components/HomeView';
import { ReceptionistView } from './components/ReceptionistView';
import { DoctorView } from './components/DoctorView';
import { PublicDisplayView } from './components/PublicDisplayView';
import { AnalyticsView } from './components/AnalyticsView';
import { useQueue } from './hooks/useQueue';
import { LayoutDashboard } from 'lucide-react';
import './App.css';

function App() {
  const [currentView, setView] = useState<string>('home');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const {
    patients,
    doctors,
    activeCall,
    addPatient,
    callPatient,
    startServing,
    completePatient,
    markNoShow,
    clearCallAlert,
    updateDoctorStatus,
    getSortedWaitingQueue,
  } = useQueue();

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('clinic_theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('clinic_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView doctors={doctors} />;
      case 'reception':
        return (
          <ReceptionistView
            patients={patients}
            doctors={doctors}
            addPatient={addPatient}
            markNoShow={markNoShow}
            getSortedWaitingQueue={getSortedWaitingQueue}
          />
        );
      case 'doctor':
        return (
          <DoctorView
            patients={patients}
            doctors={doctors}
            callPatient={callPatient}
            startServing={startServing}
            completePatient={completePatient}
            markNoShow={markNoShow}
            updateDoctorStatus={updateDoctorStatus}
            getSortedWaitingQueue={getSortedWaitingQueue}
          />
        );
      case 'public-tv':
        return (
          <PublicDisplayView
            patients={patients}
            doctors={doctors}
            activeCall={activeCall}
            clearCallAlert={clearCallAlert}
            onExit={() => setView('reception')}
          />
        );
      case 'analytics':
        return (
          <AnalyticsView
            patients={patients}
            doctors={doctors}
          />
        );
      default:
        return (
          <ReceptionistView
            patients={patients}
            doctors={doctors}
            addPatient={addPatient}
            markNoShow={markNoShow}
            getSortedWaitingQueue={getSortedWaitingQueue}
          />
        );
    }
  };

  const isTvMode = currentView === 'public-tv';

  return (
    <div className="app-container">
      {/* Hide sidebar on TV Mode for immersive display experience */}
      {!isTvMode && (
        <Sidebar
          currentView={currentView}
          setView={setView}
          patients={patients}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {/* Floating Control Button when in Public TV view to return to dashboard */}
      {isTvMode && (
        <button
          onClick={() => setView('reception')}
          className="btn btn-outline"
          title="Return to Dashboard"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            opacity: 0.15,
            transition: 'opacity 0.3s ease',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--glass-shadow)',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '0.15')}
        >
          <LayoutDashboard size={20} style={{ color: 'var(--primary)' }} />
        </button>
      )}

      <main className="main-content" style={{ padding: isTvMode ? '0' : undefined }}>
        <div style={{ padding: isTvMode ? '24px' : undefined }}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}

export default App;
