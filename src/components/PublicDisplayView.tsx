import React, { useState, useEffect, useRef } from 'react';
import { Tv, Volume2, VolumeX, Bell, AlertTriangle, ArrowLeft, Building2, ClipboardList, Users, Stethoscope } from 'lucide-react';
import type { Patient, Doctor, ActiveCall } from '../types';

interface PublicDisplayViewProps {
  patients: Patient[];
  doctors: Doctor[];
  activeCall: ActiveCall | null;
  clearCallAlert: () => void;
  onExit: () => void;
}

export const PublicDisplayView: React.FC<PublicDisplayViewProps> = ({
  patients,
  doctors,
  activeCall,
  clearCallAlert,
  onExit,
}) => {
  const [time, setTime] = useState(new Date());
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  
  const lastAnnouncedTimestamp = useRef<number>(0);

  // Keep clock running
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if browser requires user interaction for sound
  useEffect(() => {
    const checkInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener('click', checkInteraction);
    };
    document.addEventListener('click', checkInteraction);
    return () => document.removeEventListener('click', checkInteraction);
  }, []);

  // Web Audio API Synthesized Chime
  const playSynthesizedChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      
      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      gain1.gain.setValueAtTime(0.25, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);
      
      // Note 2: C5 (523.25 Hz) starting shortly after
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, ctx.currentTime + 0.25);
      gain2.gain.setValueAtTime(0.25, ctx.currentTime + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
      osc2.start(ctx.currentTime + 0.25);
      osc2.stop(ctx.currentTime + 0.7);
    } catch (e) {
      console.error('Audio chime generator error:', e);
    }
  };

  // Text-To-Speech function
  const speakAnnouncement = (token: string, room: string, doctor: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    
    // Clear ongoing speech
    window.speechSynthesis.cancel();

    const text = `Token number ${token.split('').join(' ')}, please proceed to ${room} for ${doctor}.`;
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a good English voice if available
    const voices = window.speechSynthesis.getVoices();
    const enVoice = voices.find(voice => voice.lang.includes('en-'));
    if (enVoice) {
      utterance.voice = enVoice;
    }
    
    utterance.rate = 0.85; // slightly slower for clarity
    utterance.pitch = 1.0;
    
    // Speak twice
    window.speechSynthesis.speak(utterance);
    
    // Trigger second announcement after a brief delay
    const repeatUtterance = new SpeechSynthesisUtterance(text);
    if (enVoice) repeatUtterance.voice = enVoice;
    repeatUtterance.rate = 0.85;
    setTimeout(() => {
      window.speechSynthesis.speak(repeatUtterance);
    }, 4500);
  };

  // Detect and process active token calls
  useEffect(() => {
    if (activeCall && activeCall.timestamp > lastAnnouncedTimestamp.current) {
      lastAnnouncedTimestamp.current = activeCall.timestamp;
      
      // Show screen alert overlay
      setShowAlert(true);
      
      // Play chime immediately
      if (userInteracted) {
        playSynthesizedChime();
        
        // Speak after a small delay (allowing chime to finish)
        setTimeout(() => {
          speakAnnouncement(activeCall.tokenNumber, activeCall.roomNumber, activeCall.doctorName);
        }, 800);
      }

      // Auto-dismiss call alert overlay after 8 seconds
      const timeout = setTimeout(() => {
        setShowAlert(false);
        clearCallAlert();
      }, 9000);

      return () => clearTimeout(timeout);
    }
  }, [activeCall, userInteracted, voiceEnabled]);

  // Derived patient lists for display
  const servingPatients = patients.filter(p => p.status === 'serving' || p.status === 'called');
  
  // Show up to 5 serving patients
  const displayServing = servingPatients.slice(0, 6);

  // Get waiting patients list for TV display (Obfuscating names for privacy, e.g., "John Doe" -> "John D.")
  const displayWaitlist = patients
    .filter(p => p.status === 'waiting')
    .sort((a, b) => {
      const weight = { emergency: 3, urgent: 2, routine: 1 };
      if (weight[a.triageLevel] !== weight[b.triageLevel]) {
        return weight[b.triageLevel] - weight[a.triageLevel];
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    })
    .slice(0, 6);

  const obfuscateName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return parts[0];
    const lastName = parts[parts.length - 1];
    return `${parts[0]} ${lastName.charAt(0)}.`;
  };

  const formatClock = (d: Date) => {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="tv-board-container">
      {/* Clock & Header */}
      <div className="tv-header">
        <div className="tv-logo">
          <button 
            onClick={onExit}
            className="btn btn-outline"
            style={{ 
              padding: '8px 16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '14px', 
              marginRight: '16px',
              cursor: 'pointer',
              background: 'rgba(255, 255, 255, 0.05)',
              borderColor: 'var(--border-color)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Exit TV Mode</span>
          </button>
          <div className="tv-logo-icon">
            <Tv size={28} />
          </div>
          <div className="tv-logo-text">
            <h2>OUTPATIENT CLINIC</h2>
            <p>Token Queue Board</p>
          </div>
        </div>

        {/* Audio control alerts for the lobby user */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {!userInteracted && (
            <div className="badge badge-urgent" style={{ animation: 'pulse-ring 2s infinite', display: 'flex', gap: '6px', cursor: 'pointer' }} onClick={() => setUserInteracted(true)}>
              <AlertTriangle size={14} />
              <span>Tap to Enable Audio Alerts</span>
            </div>
          )}

          <button 
            onClick={() => setVoiceEnabled(!voiceEnabled)} 
            className="btn btn-outline"
            style={{ padding: '8px 12px', display: 'flex', gap: '8px', fontSize: '13px', background: 'rgba(255, 255, 255, 0.02)', borderColor: 'var(--border-color)' }}
          >
            {voiceEnabled ? (
              <>
                <Volume2 size={16} style={{ color: 'var(--routine)' }} />
                <span style={{ color: 'var(--text-primary)' }}>Voice: ON</span>
              </>
            ) : (
              <>
                <VolumeX size={16} style={{ color: 'var(--emergency)' }} />
                <span style={{ color: 'var(--text-muted)' }}>Voice: OFF</span>
              </>
            )}
          </button>

          <div className="tv-clock">
            <div className="tv-time">{formatClock(time)}</div>
            <div className="tv-date">{formatDate(time)}</div>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="tv-layout-grid">
        {/* Left Side: Now Serving */}
        <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="tv-panel-title">
            <Bell size={20} style={{ color: 'var(--primary)' }} />
            Now Serving
          </div>

          {displayServing.length > 0 ? (
            <div className="serving-grid">
              {displayServing.map(p => {
                const doc = doctors.find(d => d.id === p.assignedDoctorId);
                const isJustCalled = p.status === 'called';
                
                return (
                  <div 
                    key={p.id} 
                    className={`glass-panel serving-card ${isJustCalled ? 'flash-active-call' : ''}`}
                    style={{
                      borderBottom: `4px solid ${isJustCalled ? 'var(--primary)' : 'var(--border-color)'}`
                    }}
                  >
                    <div className="serving-token">{p.tokenNumber}</div>
                    <div className="serving-room">{doc?.roomNumber || 'Triage Room'}</div>
                    <div className="serving-doctor">{doc?.name || 'Assigned Doctor'}</div>
                    {isJustCalled && (
                      <span className="badge badge-called" style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '10px' }}>
                        Calling
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
              <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'var(--primary-glow)', borderRadius: '50%', animation: 'pulse-ring 4s infinite' }}></div>
                <Building2 size={56} style={{ color: 'var(--primary)', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: '0', right: '-10px', background: 'var(--bg-card)', padding: '8px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                  <Stethoscope size={24} style={{ color: 'var(--secondary)' }} />
                </div>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>All Rooms Vacant</h3>
              <p style={{ fontSize: '16px', color: 'var(--text-muted)', maxWidth: '300px', lineHeight: '1.5' }}>There are currently no active consultations in progress.</p>
            </div>
          )}
        </div>

        {/* Right Side: Next Up (Waiting List) */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="tv-panel-title" style={{ borderLeftColor: 'var(--routine)' }}>
            Next Up / Waitlist
          </div>

          <div className="tv-waitlist">
            {displayWaitlist.length > 0 ? (
              displayWaitlist.map(p => (
                <div key={p.id} className="tv-waitlist-item">
                  <div className="tv-wait-token">{p.tokenNumber}</div>
                  <div className="tv-wait-name">{obfuscateName(p.name)}</div>
                  <div className="tv-wait-dept">{p.department}</div>
                </div>
              ))
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', textAlign: 'center' }}>
                <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'var(--routine-glow)', borderRadius: '50%', opacity: 0.5 }}></div>
                  <ClipboardList size={40} style={{ color: 'var(--routine)', zIndex: 1 }} />
                  <div style={{ position: 'absolute', bottom: '-5px', left: '-10px', background: 'var(--bg-card)', padding: '6px', borderRadius: '50%', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                    <Users size={20} style={{ color: 'var(--primary)' }} />
                  </div>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Queue is Empty</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '200px', lineHeight: '1.5' }}>No patients are currently waiting.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Call Popup Overlay */}
      {showAlert && activeCall && (
        <div className="call-overlay">
          <div className="call-overlay-content">
            <div className="call-overlay-alert">
              <Bell size={24} className="pulse-emergency" />
              <span>Now Calling</span>
            </div>
            <div className="call-overlay-token">{activeCall.tokenNumber}</div>
            <div className="call-overlay-text">Please proceed to</div>
            <div className="call-overlay-dest">{activeCall.roomNumber}</div>
            <div className="call-overlay-doctor">Consultation with {activeCall.doctorName}</div>
            <button 
              onClick={() => {
                setShowAlert(false);
                clearCallAlert();
              }}
              className="btn btn-outline"
              style={{ marginTop: '32px', fontSize: '13px', padding: '8px 16px' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Scrolling News Ticker */}
      <div className="tv-footer-ticker">
        <span className="ticker-label">Announcements</span>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="marquee-content" style={{ color: 'var(--text-secondary)', fontSize: '15px', fontWeight: 500 }}>
            • Welcome to CareFlow Outpatient Clinic • Please have your Token Number and Health Card ready • Wear a mask if you have respiratory symptoms • Thank you for your patience • Average consultation wait time is currently 15 minutes •
          </div>
        </div>
      </div>
    </div>
  );
};
