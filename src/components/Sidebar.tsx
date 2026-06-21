import React from 'react';
import { 
  Activity, 
  Home,
  UserPlus, 
  Stethoscope, 
  Tv, 
  BarChart3, 
  Sun, 
  Moon, 
  Database, 
  Trash2 
} from 'lucide-react';
import type { Patient } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  patients: Patient[];
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setView,
  patients,
  theme,
  toggleTheme,
}) => {
  const waitingCount = patients.filter(p => p.status === 'waiting').length;
  const servingCount = patients.filter(p => p.status === 'serving' || p.status === 'called').length;

  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'reception', label: 'Reception', icon: <UserPlus size={20} /> },
    { id: 'doctor', label: 'Doctor Terminal', icon: <Stethoscope size={20} /> },
    { id: 'public-tv', label: 'Public Display', icon: <Tv size={20} /> },
    { id: 'analytics', label: 'Analytics & Reports', icon: <BarChart3 size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Activity size={24} />
        </div>
        <div className="logo-text">CareFlow Queue</div>
      </div>

      <nav style={{ flex: 1 }}>
        <ul className="sidebar-menu">
          {menuItems.map(item => (
            <li key={item.id}>
              <button
                onClick={() => setView(item.id)}
                className={`menu-item ${currentView === item.id ? 'active' : ''}`}
                style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.id === 'reception' && waitingCount > 0 && (
                  <span className="badge badge-waiting" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                    {waitingCount}
                  </span>
                )}
                {item.id === 'doctor' && servingCount > 0 && (
                  <span className="badge badge-called" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                    {servingCount}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Appearance</span>
          <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </aside>
  );
};
