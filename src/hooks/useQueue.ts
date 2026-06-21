import { useState, useEffect, useCallback } from 'react';
import type { Patient, Doctor, ActiveCall, TriageLevel, Department } from '../types';
import { INITIAL_DOCTORS, generateMockPatients } from '../utils/mockData';

const PATIENTS_KEY = 'clinic_queue_patients';
const DOCTORS_KEY = 'clinic_queue_doctors';
const ACTIVE_CALL_KEY = 'clinic_queue_active_call';

export const useQueue = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  // Helper to save data to localStorage and dispatch custom event for local tab updates
  const savePatients = (updatedPatients: Patient[]) => {
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(updatedPatients));
    setPatients(updatedPatients);
    // Trigger storage event manually for the same tab
    window.dispatchEvent(new Event('storage-local'));
  };

  const saveDoctors = (updatedDoctors: Doctor[]) => {
    localStorage.setItem(DOCTORS_KEY, JSON.stringify(updatedDoctors));
    setDoctors(updatedDoctors);
    window.dispatchEvent(new Event('storage-local'));
  };

  const saveActiveCall = (call: ActiveCall | null) => {
    if (call) {
      localStorage.setItem(ACTIVE_CALL_KEY, JSON.stringify(call));
    } else {
      localStorage.removeItem(ACTIVE_CALL_KEY);
    }
    setActiveCall(call);
    window.dispatchEvent(new Event('storage-local'));
  };

  // Initial load
  useEffect(() => {
    const storedPatients = localStorage.getItem(PATIENTS_KEY);
    const storedDoctors = localStorage.getItem(DOCTORS_KEY);
    const storedActiveCall = localStorage.getItem(ACTIVE_CALL_KEY);

    if (storedPatients) {
      const parsed = JSON.parse(storedPatients) as Patient[];
      if (parsed.some(p => p.id === 'p-1' || p.id === 'p-2')) {
        localStorage.removeItem(PATIENTS_KEY);
        setPatients([]);
      } else {
        setPatients(parsed);
      }
    } else {
      setPatients([]);
    }

    if (storedDoctors) {
      setDoctors(JSON.parse(storedDoctors));
    } else {
      localStorage.setItem(DOCTORS_KEY, JSON.stringify(INITIAL_DOCTORS));
      setDoctors(INITIAL_DOCTORS);
    }

    if (storedActiveCall) {
      setActiveCall(JSON.parse(storedActiveCall));
    }
  }, []);

  // Listen to cross-tab updates (via local storage) and same-tab updates (via custom event)
  const syncState = useCallback(() => {
    const storedPatients = localStorage.getItem(PATIENTS_KEY);
    const storedDoctors = localStorage.getItem(DOCTORS_KEY);
    const storedActiveCall = localStorage.getItem(ACTIVE_CALL_KEY);

    if (storedPatients) setPatients(JSON.parse(storedPatients));
    if (storedDoctors) setDoctors(JSON.parse(storedDoctors));
    setActiveCall(storedActiveCall ? JSON.parse(storedActiveCall) : null);
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === PATIENTS_KEY ||
        e.key === DOCTORS_KEY ||
        e.key === ACTIVE_CALL_KEY
      ) {
        syncState();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('storage-local', syncState);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('storage-local', syncState);
    };
  }, [syncState]);

  // Operations
  const addPatient = useCallback((patientData: {
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    symptoms: string;
    triageLevel: TriageLevel;
    department: Department;
    assignedDoctorId: string;
  }) => {
    // Generate token number (A101 format)
    const tokenNum = patients.length > 0 
      ? Math.max(...patients.map(p => {
          const num = parseInt(p.tokenNumber.substring(1));
          return isNaN(num) ? 100 : num;
        })) + 1
      : 101;
    
    const newPatient: Patient = {
      ...patientData,
      id: `p-${Date.now()}`,
      tokenNumber: `A${tokenNum}`,
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    const updated = [...patients, newPatient];
    savePatients(updated);
    return newPatient;
  }, [patients]);

  const callPatient = useCallback((patientId: string, callerDoctorId?: string) => {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    const doctorIdToUse = callerDoctorId || patient.assignedDoctorId;
    const doctor = doctors.find(d => d.id === doctorIdToUse);
    const roomNumber = doctor ? doctor.roomNumber : 'Triage Room';
    const doctorName = doctor ? doctor.name : 'Staff';

    // Set active call
    const call: ActiveCall = {
      patientId: patient.id,
      tokenNumber: patient.tokenNumber,
      roomNumber,
      doctorName,
      timestamp: Date.now()
    };

    const updated = patients.map(p => {
      if (p.id === patientId) {
        return { 
          ...p, 
          status: 'called' as const, 
          calledAt: new Date().toISOString(),
          assignedDoctorId: doctorIdToUse 
        };
      }
      return p;
    });

    savePatients(updated);
    saveActiveCall(call);
  }, [patients, doctors]);

  const startServing = useCallback((patientId: string) => {
    const updated = patients.map(p => {
      if (p.id === patientId) {
        return { ...p, status: 'serving' as const };
      }
      return p;
    });
    savePatients(updated);
  }, [patients]);

  const completePatient = useCallback((patientId: string) => {
    const updated = patients.map(p => {
      if (p.id === patientId) {
        return { ...p, status: 'completed' as const, completedAt: new Date().toISOString() };
      }
      return p;
    });
    savePatients(updated);

    // If the active call was for this patient, clear it
    if (activeCall?.patientId === patientId) {
      saveActiveCall(null);
    }
  }, [patients, activeCall]);

  const markNoShow = useCallback((patientId: string) => {
    const updated = patients.map(p => {
      if (p.id === patientId) {
        return { ...p, status: 'no-show' as const };
      }
      return p;
    });
    savePatients(updated);

    if (activeCall?.patientId === patientId) {
      saveActiveCall(null);
    }
  }, [patients, activeCall]);

  const clearCallAlert = useCallback(() => {
    saveActiveCall(null);
  }, []);

  const resetQueue = useCallback(() => {
    savePatients([]);
    saveActiveCall(null);
  }, []);

  const loadMockData = useCallback(() => {
    const mock = generateMockPatients();
    savePatients(mock);
    saveActiveCall(null);
  }, []);

  const updateDoctorStatus = useCallback((doctorId: string, status: 'active' | 'inactive') => {
    const updated = doctors.map(d => {
      if (d.id === doctorId) {
        return { ...d, status };
      }
      return d;
    });
    saveDoctors(updated);
  }, [doctors]);

  // Derived States
  const getSortedWaitingQueue = useCallback((docId?: string) => {
    return patients
      .filter(p => {
        const matchesStatus = p.status === 'waiting';
        let matchesDoc = true;
        if (docId) {
          const doc = doctors.find(d => d.id === docId);
          matchesDoc = p.assignedDoctorId === docId || (p.assignedDoctorId === 'unassigned' && doc?.specialty === p.department);
        }
        return matchesStatus && matchesDoc;
      })
      .sort((a, b) => {
        // Triage Level weights
        const triageWeight = { emergency: 3, urgent: 2, routine: 1 };
        const weightA = triageWeight[a.triageLevel];
        const weightB = triageWeight[b.triageLevel];

        if (weightA !== weightB) {
          return weightB - weightA; // Higher weight first
        }
        // If same weight, sort by arrival time
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [patients]);

  return {
    patients,
    doctors,
    activeCall,
    addPatient,
    callPatient,
    startServing,
    completePatient,
    markNoShow,
    clearCallAlert,
    resetQueue,
    loadMockData,
    updateDoctorStatus,
    getSortedWaitingQueue,
  };
};
