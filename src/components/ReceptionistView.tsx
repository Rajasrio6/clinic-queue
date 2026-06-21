import React, { useState, useEffect } from 'react';
import { UserPlus, Search, ShieldAlert, Clock, Trash2, Users, Building2, ClipboardList, Stethoscope, Loader2 } from 'lucide-react';
import type { Patient, Doctor, TriageLevel, Department } from '../types';

interface ReceptionistViewProps {
  patients: Patient[];
  doctors: Doctor[];
  addPatient: (data: {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    symptoms: string;
    triageLevel: TriageLevel;
    department: Department;
    assignedDoctorId: string;
  }) => void;
  markNoShow: (id: string) => void;
  getSortedWaitingQueue: (docId?: string) => Patient[];
}

export const ReceptionistView: React.FC<ReceptionistViewProps> = ({
  patients,
  doctors,
  addPatient,
  markNoShow,
  getSortedWaitingQueue,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [symptoms, setSymptoms] = useState('');
  const [department, setDepartment] = useState<Department>('General');
  const [assignedDoctorId, setAssignedDoctorId] = useState('unassigned');
  const [triageLevel, setTriageLevel] = useState<TriageLevel>('routine');
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  // Relative time helper
  const [timeState, setTimeState] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setTimeState(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const getRelativeTime = (isoString: string) => {
    const elapsedMs = timeState - new Date(isoString).getTime();
    const elapsedMins = Math.floor(elapsedMs / (60 * 1000));
    if (elapsedMins < 1) return 'Just now';
    if (elapsedMins === 1) return '1 min ago';
    return `${elapsedMins} mins ago`;
  };

  // Filter doctors based on selected department
  const filteredDoctors = doctors.filter(d => d.specialty === department && d.status === 'active');

  // Auto select doctor when department changes
  useEffect(() => {
    if (filteredDoctors.length > 0) {
      setAssignedDoctorId(filteredDoctors[0].id);
    } else {
      setAssignedDoctorId('unassigned');
    }
  }, [department, doctors]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !age || !assignedDoctorId || isSubmitting) return;

    setIsSubmitting(true);
    setLoadingStep('Generating Token...');

    setTimeout(() => {
      setLoadingStep('Assigning doctor...');
      
      setTimeout(() => {
        addPatient({
          name,
          age: parseInt(age),
          gender,
          symptoms,
          triageLevel,
          department,
          assignedDoctorId,
        });

        // Reset form
        setName('');
        setAge('');
        setGender('Male');
        setSymptoms('');
        setTriageLevel('routine');
        setIsSubmitting(false);
      }, 800);
    }, 800);
  };

  // Get waiting patients and apply filters
  const sortedWaiting = getSortedWaitingQueue();
  const filteredWaiting = sortedWaiting.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || p.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="reception-view">
      <style>{`
        @keyframes spinner {
          to { transform: rotate(360deg); }
        }
        .animate-spin-fast {
          animation: spinner 1s linear infinite;
        }
      `}</style>
      <div className="view-header">
        <div className="view-title-container">
          <h1>Reception & Check-In</h1>
          <p>Register new patients and manage the triage queue.</p>
        </div>
        <div className="glass-panel" style={{ display: 'flex', gap: '20px', padding: '12px 24px', alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Active Waiting Queue</span>
            <strong style={{ fontSize: '20px', color: 'var(--primary)' }}>{sortedWaiting.length} Patients</strong>
          </div>
          <div style={{ height: '30px', width: '1px', background: 'var(--border-color)' }}></div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block' }}>Total Today</span>
            <strong style={{ fontSize: '20px', color: 'var(--routine)' }}>{patients.length}</strong>
          </div>
        </div>
      </div>

      <div className="reception-grid">
        {/* Left Side: Check-in Form */}
        <div className="glass-panel dashboard-card">
          <div className="card-title-bar">
            <h2>
              <UserPlus size={20} className="logo-icon" style={{ padding: '4px', borderRadius: '6px' }} />
              Patient Registration
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="patient-name">Patient Full Name</label>
                <input
                  id="patient-name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="form-input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="patient-age">Age</label>
                <input
                  id="patient-age"
                  type="number"
                  required
                  min="0"
                  max="130"
                  placeholder="Age"
                  className="form-input"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="patient-gender">Gender</label>
                <select
                  id="patient-gender"
                  className="form-select"
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="triage-level">Triage Severity</label>
                <select
                  id="triage-level"
                  className="form-select"
                  value={triageLevel}
                  onChange={e => setTriageLevel(e.target.value as TriageLevel)}
                  style={{
                    color: triageLevel === 'emergency' ? 'var(--emergency)' : triageLevel === 'urgent' ? 'var(--urgent)' : 'var(--routine)',
                    fontWeight: 600
                  }}
                >
                  <option value="routine">Routine (Low)</option>
                  <option value="urgent">Urgent (Medium)</option>
                  <option value="emergency">Emergency (High)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <select
                  id="department"
                  className="form-select"
                  value={department}
                  onChange={e => setDepartment(e.target.value as Department)}
                >
                  <option value="General">General</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Dermatology">Dermatology</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="assigned-doctor">Assigned Doctor</label>
                <select
                  id="assigned-doctor"
                  className="form-select"
                  required
                  value={assignedDoctorId}
                  onChange={e => setAssignedDoctorId(e.target.value)}
                >
                  <option value="unassigned">Any Available / Unassigned</option>
                  {filteredDoctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="symptoms">Symptoms / Reason for Visit</label>
                <textarea
                  id="symptoms"
                  rows={3}
                  placeholder="Brief description of patient condition..."
                  className="form-textarea"
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', opacity: isSubmitting ? 0.8 : 1, cursor: isSubmitting ? 'wait' : 'pointer' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin-fast" />
                  <span>{loadingStep}</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Register & Generate Token</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Waitlist Grid */}
        <div className="glass-panel dashboard-card">
          <div className="card-title-bar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>
                <Users size={20} className="logo-icon" style={{ padding: '4px', borderRadius: '6px' }} />
                Waiting Queue ({filteredWaiting.length})
              </h2>
            </div>
            
            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  placeholder="Search name or token..."
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '40px', paddingRight: '12px', height: '42px' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
              </div>
              
              <select
                className="form-select"
                style={{ width: '160px', height: '42px', padding: '0 12px' }}
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                <option value="General">General</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Dermatology">Dermatology</option>
              </select>
            </div>
          </div>

          <div className="queue-list">
            {filteredWaiting.length > 0 ? (
              filteredWaiting.map(patient => {
                const doc = doctors.find(d => d.id === patient.assignedDoctorId);
                
                return (
                  <div 
                    key={patient.id} 
                    className={`queue-item ${patient.triageLevel === 'emergency' ? 'pulse-emergency' : ''}`}
                    style={{
                      borderLeft: `4px solid var(--${patient.triageLevel})`,
                      boxShadow: patient.triageLevel === 'emergency' ? '0 0 10px var(--emergency-glow)' : 'none',
                      backgroundColor: patient.triageLevel === 'emergency' ? 'var(--emergency-glow)' : undefined
                    }}
                  >
                    <div className="queue-item-info">
                      <div className="token-badge" style={{
                        background: `rgba(var(--${patient.triageLevel}-rgb), 0.1)`,
                        borderColor: `var(--${patient.triageLevel})`,
                        color: `var(--${patient.triageLevel})`
                      }}>
                        {patient.tokenNumber}
                      </div>
                      <div className="queue-item-details">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4>{patient.name}</h4>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            ({patient.age}y • {patient.gender})
                          </span>
                        </div>
                        <p>
                          <span>{patient.department}</span>
                          <span style={{ color: 'var(--text-muted)' }}>•</span>
                          <span>{doc?.name || 'Unassigned'}</span>
                          <span style={{ color: 'var(--text-muted)' }}>•</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Clock size={12} />
                            {getRelativeTime(patient.createdAt)}
                          </span>
                        </p>
                        {patient.symptoms && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: 'var(--text-muted)', 
                            marginTop: '4px',
                            maxWidth: '300px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {patient.symptoms}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="queue-item-actions">
                      <span className={`badge badge-${patient.triageLevel}`}>
                        {patient.triageLevel === 'emergency' && <ShieldAlert size={12} style={{ marginRight: '4px' }} />}
                        {patient.triageLevel}
                      </span>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Remove ${patient.name} from the waitlist?`)) {
                            markNoShow(patient.id);
                          }
                        }} 
                        className="btn btn-outline btn-icon"
                        title="Remove patient"
                        style={{ color: 'var(--emergency)', border: 'none', background: 'none' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
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
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Queue is Empty</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '250px', lineHeight: '1.5' }}>There are currently no patients waiting for triage or consultation.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
