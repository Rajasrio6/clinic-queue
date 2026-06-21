import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Volume2, 
  CheckCircle, 
  XCircle, 
  Play, 
  UserCheck, 
  Clock, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Building2,
  ClipboardList,
  Users
} from 'lucide-react';
import type { Patient, Doctor } from '../types';

interface DoctorViewProps {
  patients: Patient[];
  doctors: Doctor[];
  callPatient: (id: string, doctorId?: string) => void;
  startServing: (id: string) => void;
  completePatient: (id: string) => void;
  markNoShow: (id: string) => void;
  updateDoctorStatus: (id: string, status: 'active' | 'inactive') => void;
  getSortedWaitingQueue: (docId?: string) => Patient[];
}

export const DoctorView: React.FC<DoctorViewProps> = ({
  patients,
  doctors,
  callPatient,
  startServing,
  completePatient,
  markNoShow,
  updateDoctorStatus,
  getSortedWaitingQueue,
}) => {
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');

  // Auto-select first active doctor
  useEffect(() => {
    if (doctors.length > 0 && !selectedDoctorId) {
      setSelectedDoctorId(doctors[0].id);
    }
  }, [doctors, selectedDoctorId]);

  const activeDoctor = doctors.find(d => d.id === selectedDoctorId);

  // Find the active consulting patient for this doctor
  // (Either in 'called' or 'serving' status)
  const currentPatient = patients.find(
    p => p.assignedDoctorId === selectedDoctorId && (p.status === 'called' || p.status === 'serving')
  );

  // Get waiting patients for this doctor
  const docWaitingQueue = getSortedWaitingQueue(selectedDoctorId);

  // Consultation duration timer
  const [consultTime, setConsultTime] = useState(0);
  useEffect(() => {
    let timer: any;
    if (currentPatient && currentPatient.status === 'serving' && currentPatient.calledAt) {
      const calculateDuration = () => {
        const start = currentPatient.calledAt ? new Date(currentPatient.calledAt).getTime() : Date.now();
        const diffSecs = Math.floor((Date.now() - start) / 1000);
        setConsultTime(diffSecs > 0 ? diffSecs : 0);
      };
      
      calculateDuration();
      timer = setInterval(calculateDuration, 1000);
    } else {
      setConsultTime(0);
    }

    return () => clearInterval(timer);
  }, [currentPatient]);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallNext = () => {
    if (docWaitingQueue.length > 0) {
      callPatient(docWaitingQueue[0].id, selectedDoctorId);
    }
  };

  const handleCallAgain = () => {
    if (currentPatient) {
      callPatient(currentPatient.id, selectedDoctorId);
    }
  };

  return (
    <div className="doctor-view">
      <div className="view-header">
        <div className="view-title-container">
          <h1>Doctor Consultation Terminal</h1>
          <p>Manage consultations and call patients to rooms.</p>
        </div>

        {/* Doctor Selector */}
        <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label htmlFor="doctor-select" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Logged in as:</label>
          <select
            id="doctor-select"
            className="form-select"
            style={{ minWidth: '200px', height: '38px', padding: '0 12px' }}
            value={selectedDoctorId}
            onChange={e => setSelectedDoctorId(e.target.value)}
          >
            {doctors.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.specialty})
              </option>
            ))}
          </select>
        </div>
      </div>

      {activeDoctor && (
        <div className="doctor-view-layout">
          {/* Left Column: Doctor Stats / Room Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel dashboard-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                <div className="logo-icon" style={{ padding: '12px', borderRadius: '16px' }}>
                  <Stethoscope size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700 }}>{activeDoctor.name}</h3>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{activeDoctor.specialty} • {activeDoctor.roomNumber}</span>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Doctor Availability status */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Room Availability</span>
                  <button 
                    onClick={() => updateDoctorStatus(activeDoctor.id, activeDoctor.status === 'active' ? 'inactive' : 'active')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: activeDoctor.status === 'active' ? 'var(--routine)' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    {activeDoctor.status === 'active' ? (
                      <ToggleRight size={40} />
                    ) : (
                      <ToggleLeft size={40} />
                    )}
                  </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Waiting in Room Queue</span>
                  <strong style={{ color: docWaitingQueue.length > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {docWaitingQueue.length} patients
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Consulted Today</span>
                  <strong>
                    {patients.filter(p => p.assignedDoctorId === activeDoctor.id && p.status === 'completed').length} patients
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick action card if no active patient */}
            {!currentPatient && (
              <div className="glass-panel dashboard-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '16px', borderRadius: '50%' }}>
                  <UserCheck size={32} />
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No Active Consultation</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                    Call the next patient from your waiting list to start consultation.
                  </p>
                </div>
                <button
                  disabled={docWaitingQueue.length === 0}
                  onClick={handleCallNext}
                  className="btn btn-primary"
                  style={{ width: '100%', opacity: docWaitingQueue.length === 0 ? 0.5 : 1, cursor: docWaitingQueue.length === 0 ? 'not-allowed' : 'pointer' }}
                >
                  <Play size={16} />
                  <span>Call Next Patient</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Current Patient Panel + Waitlist */}
          <div className="doctor-queue-section">
            {/* Consultation Panel */}
            {currentPatient && (
              <div className="glass-panel dashboard-card current-patient-card">
                <div className="card-title-bar">
                  <h2 style={{ color: 'var(--text-primary)' }}>
                    <Stethoscope size={20} style={{ color: 'var(--primary)' }} />
                    Active Consultation
                  </h2>
                  <div className="badge badge-called" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    <span>Status: {currentPatient.status}</span>
                  </div>
                </div>

                <div className="current-patient-layout">
                  <div className="current-patient-main">
                    <div className="current-token-large">
                      {currentPatient.tokenNumber}
                    </div>
                    <div className="current-details">
                      <h3>{currentPatient.name}</h3>
                      <p>{currentPatient.age} years old • {currentPatient.gender}</p>
                      <span className={`badge badge-${currentPatient.triageLevel}`}>
                        {currentPatient.triageLevel} Priority
                      </span>
                    </div>
                  </div>

                  {currentPatient.status === 'serving' && (
                    <div className="glass-panel" style={{ padding: '12px 20px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.01)' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Consulting Time</span>
                      <strong style={{ fontSize: '24px', fontVariantNumeric: 'tabular-nums', color: 'var(--primary)' }}>
                        {formatDuration(consultTime)}
                      </strong>
                    </div>
                  )}
                </div>

                {currentPatient.symptoms && (
                  <div className="current-symptoms">
                    <strong>Chief Complaints:</strong>
                    <p style={{ marginTop: '4px', color: 'var(--text-primary)' }}>{currentPatient.symptoms}</p>
                  </div>
                )}

                {/* Patient Management Controls */}
                <div className="doctor-actions-grid">
                  {currentPatient.status === 'called' ? (
                    <>
                      <button onClick={handleCallAgain} className="btn btn-outline" style={{ display: 'flex', gap: '8px' }}>
                        <Volume2 size={16} />
                        <span>Recall</span>
                      </button>
                      <button 
                        onClick={() => startServing(currentPatient.id)} 
                        className="btn btn-primary"
                        style={{ display: 'flex', gap: '8px' }}
                      >
                        <Play size={16} />
                        <span>Start Session</span>
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => completePatient(currentPatient.id)} 
                      className="btn btn-success"
                      style={{ display: 'flex', gap: '8px' }}
                    >
                      <CheckCircle size={16} />
                      <span>Complete Session</span>
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      if (window.confirm(`Mark patient ${currentPatient.name} as No-Show?`)) {
                        markNoShow(currentPatient.id);
                      }
                    }} 
                    className="btn btn-danger"
                    style={{ display: 'flex', gap: '8px' }}
                  >
                    <XCircle size={16} />
                    <span>Absent / No Show</span>
                  </button>
                </div>
              </div>
            )}

            {/* Doctor's Waitlist */}
            <div className="glass-panel dashboard-card">
              <div className="card-title-bar">
                <h2>Waiting List ({docWaitingQueue.length})</h2>
                {docWaitingQueue.length > 0 && (
                  <button 
                    onClick={handleCallNext} 
                    className="btn btn-outline" 
                    style={{ fontSize: '13px', padding: '6px 12px' }}
                  >
                    <span>Call Next</span>
                  </button>
                )}
              </div>

              <div className="queue-list">
                {docWaitingQueue.length > 0 ? (
                  docWaitingQueue.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="queue-item"
                      style={{ 
                        borderLeft: `4px solid var(--${patient.triageLevel})`,
                        backgroundColor: patient.triageLevel === 'emergency' ? 'var(--emergency-glow)' : undefined
                      }}
                    >
                      <div className="queue-item-info">
                        <div className="token-badge">{patient.tokenNumber}</div>
                        <div className="queue-item-details">
                          <h4>{patient.name}</h4>
                          <p>
                            <span>{patient.age}y • {patient.gender}</span>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Clock size={12} />
                              Wait: {Math.max(1, Math.floor((Date.now() - new Date(patient.createdAt).getTime()) / (60 * 1000)))}m
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="queue-item-actions">
                        <span className={`badge badge-${patient.triageLevel}`}>{patient.triageLevel}</span>
                        <button
                          onClick={() => callPatient(patient.id, selectedDoctorId)}
                          className="btn btn-primary btn-icon"
                          title="Call patient"
                          style={{ padding: '6px' }}
                        >
                          <Volume2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
                    <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'var(--primary-glow)', borderRadius: '50%', animation: 'pulse-ring 3s infinite' }}></div>
                      <ClipboardList size={48} style={{ color: 'var(--primary)', zIndex: 1 }} />
                      <div style={{ position: 'absolute', top: '-10px', right: '-10px', background: 'var(--bg-card)', padding: '6px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <Building2 size={20} style={{ color: 'var(--secondary)' }} />
                      </div>
                      <div style={{ position: 'absolute', bottom: '-5px', left: '-15px', background: 'var(--bg-card)', padding: '6px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <Users size={24} style={{ color: 'var(--routine)' }} />
                      </div>
                      <div style={{ position: 'absolute', bottom: '10px', right: '-20px', background: 'var(--bg-card)', padding: '6px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                        <Stethoscope size={20} style={{ color: 'var(--emergency)' }} />
                      </div>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>No Assigned Patients</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '250px', lineHeight: '1.5' }}>You currently have no patients waiting in your queue.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
