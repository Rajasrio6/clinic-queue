import React from 'react';
import { 
  Building2, 
  PhoneCall, 
  Mail, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  UserCheck 
} from 'lucide-react';
import type { Doctor } from '../types';

interface HomeViewProps {
  doctors: Doctor[];
}

export const HomeView: React.FC<HomeViewProps> = ({ doctors }) => {
  // Specialist contact database mapping to INITIAL_DOCTORS
  const contactDetails: Record<string, { phone: string; email: string }> = {
    'doc-1': { phone: '+1 (555) 019-1001', email: 's.jenkins@careflowclinic.com' },
    'doc-2': { phone: '+1 (555) 019-1002', email: 'a.patel@careflowclinic.com' },
    'doc-3': { phone: '+1 (555) 019-1003', email: 'e.rostova@careflowclinic.com' },
    'doc-4': { phone: '+1 (555) 019-1004', email: 'm.vance@careflowclinic.com' },
    'doc-5': { phone: '+1 (555) 019-1005', email: 'p.nair@careflowclinic.com' },
  };

  return (
    <div className="home-view" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Title */}
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div className="view-title-container">
          <h1>Welcome to CareFlow Outpatient Clinic</h1>
          <p>Modern, patient-centered healthcare operations.</p>
        </div>
      </div>

      {/* Emergency Hotline Banner */}
      <div 
        className="glass-panel pulse-emergency" 
        style={{ 
          padding: '24px', 
          marginBottom: '32px', 
          background: 'rgba(224, 98, 103, 0.15)', 
          border: '2px solid var(--emergency)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          boxShadow: '0 0 20px var(--emergency-glow)'
        }}
      >
        <div style={{ background: 'var(--emergency)', color: 'white', padding: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={32} />
        </div>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--emergency)', margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
            24/7 CLINIC EMERGENCY HOTLINE
          </h2>
          <p style={{ fontSize: '15px', fontWeight: 500, margin: 0, color: 'var(--text-primary)' }}>
            For life-threatening emergencies, call <strong style={{ fontSize: '18px', color: 'var(--emergency)' }}>1-800-555-9111</strong> or visit our Emergency Department immediately.
          </p>
        </div>
      </div>

      {/* Grid: About Hospital & Operating Hours */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr', gap: '32px', marginBottom: '32px' }}>
        {/* About Section */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={20} style={{ color: 'var(--primary)' }} />
            About Our Facility
          </h2>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            CareFlow Outpatient Clinic has been a trusted cornerstone of community health for over two decades. We specialize in providing rapid, high-quality outpatient services across five distinct medical disciplines.
          </p>
          <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            Our integrated smart-queuing technology ensures minimal wait times, allowing patients to register, triage, and proceed to their doctor consultation smoothly and transparently.
          </p>
        </div>

        {/* Operating hours & Location */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ color: 'var(--primary)', paddingTop: '4px' }}>
              <Clock size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Operating Hours</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                <strong>Monday – Friday:</strong> 8:00 AM – 8:00 PM
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                <strong>Saturday – Sunday:</strong> 9:00 AM – 5:00 PM
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <div style={{ color: 'var(--secondary)', paddingTop: '4px' }}>
              <MapPin size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>Clinic Location</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
                Suite 400, 742 Evergreen Terrace
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                Springfield, Medical Center Area
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Specialists Directory */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UserCheck size={20} style={{ color: 'var(--routine)' }} />
          Our Medical Specialists
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {doctors.map(doc => {
            const contacts = contactDetails[doc.id] || { phone: '+1 (555) 019-0000', email: 'clinic@careflowclinic.com' };
            
            return (
              <div 
                key={doc.id} 
                className="glass-panel" 
                style={{ 
                  padding: '20px', 
                  background: 'var(--bg-secondary)', 
                  borderColor: 'var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{doc.name}</h3>
                    <span className={`badge ${doc.status === 'active' ? 'badge-routine' : 'badge-waiting'}`} style={{ fontSize: '9px', padding: '2px 8px' }}>
                      {doc.status === 'active' ? 'In Room' : 'Away'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '2px 0 0 0', fontWeight: 500 }}>
                    {doc.specialty} Specialist • {doc.roomNumber}
                  </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <PhoneCall size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{contacts.phone}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Mail size={14} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={contacts.email}>
                      {contacts.email}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
