export type TriageLevel = 'routine' | 'urgent' | 'emergency';

export type PatientStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'no-show';

export type Department = 'General' | 'Pediatrics' | 'Cardiology' | 'Orthopedics' | 'Dermatology';

export interface Patient {
  id: string;
  tokenNumber: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  symptoms: string;
  triageLevel: TriageLevel;
  department: Department;
  assignedDoctorId: string;
  status: PatientStatus;
  createdAt: string;
  calledAt?: string;
  completedAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: Department;
  roomNumber: string;
  status: 'active' | 'inactive';
}

export interface ActiveCall {
  patientId: string;
  tokenNumber: string;
  roomNumber: string;
  doctorName: string;
  timestamp: number;
}
