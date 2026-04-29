import { create } from 'zustand';

export interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  telephone: string;
  createdAt: string;
  procedures: ToothProcedure[];
  payments: Payment[];
  appointments: Appointment[];
  images: PatientImage[];
  labExpenses: LabExpense[];
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes?: string;
  patient?: Patient;
  createdAt: string;
}

export interface Procedure {
  id: string;
  name: string;
  category: string;
  price: number;
  labCost: number;
  currency: string;
}

export interface ToothProcedure {
  id: string;
  patientId: string;
  toothNumber: string;
  toothType: string;
  customToothName?: string;
  procedureId: string;
  paid: boolean;
  completed: boolean;
  notes?: string;
  procedure: Procedure;
  createdAt: string;
}

export interface Payment {
  id: string;
  patientId: string;
  amount: number;
  date: string;
  method: string;
  note?: string;
  createdAt: string;
}

export interface DiscountSetting {
  id: string;
  percentage: number;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface PatientImage {
  id: string;
  patientId: string;
  imagePath: string;
  imageType: string;
  createdAt: string;
}

export interface LabExpense {
  id: string;
  patientId: string;
  description: string;
  amount: number;
  date: string;
  patient?: Patient;
  createdAt: string;
}

interface AppState {
  // Data
  patients: Patient[];
  appointments: Appointment[];
  procedures: Procedure[];
  discounts: DiscountSetting[];
  
  // UI State
  activeTab: 'schedule' | 'clinic' | 'summary' | 'settings';
  selectedPatientId: string | null;
  isLoading: boolean;
  
  // Actions
  setActiveTab: (tab: 'schedule' | 'clinic' | 'summary' | 'settings') => void;
  setSelectedPatientId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Data Actions
  setPatients: (patients: Patient[]) => void;
  setAppointments: (appointments: Appointment[]) => void;
  setProcedures: (procedures: Procedure[]) => void;
  setDiscounts: (discounts: DiscountSetting[]) => void;
  
  addPatient: (patient: Patient) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (appointment: Appointment) => void;
  removeAppointment: (id: string) => void;
  
  // Fetch helpers
  fetchPatients: () => Promise<void>;
  fetchAppointments: () => Promise<void>;
  fetchProcedures: () => Promise<void>;
  fetchDiscounts: () => Promise<void>;
  seedProcedures: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  patients: [],
  appointments: [],
  procedures: [],
  discounts: [],
  activeTab: 'schedule',
  selectedPatientId: null,
  isLoading: false,
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedPatientId: (id) => set({ selectedPatientId: id }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  setPatients: (patients) => set({ patients }),
  setAppointments: (appointments) => set({ appointments }),
  setProcedures: (procedures) => set({ procedures }),
  setDiscounts: (discounts) => set({ discounts }),
  
  addPatient: (patient) => set((state) => ({ patients: [patient, ...state.patients] })),
  addAppointment: (appointment) => set((state) => ({ appointments: [appointment, ...state.appointments] })),
  updateAppointment: (appointment) => set((state) => ({
    appointments: state.appointments.map((a) => a.id === appointment.id ? appointment : a),
  })),
  removeAppointment: (id) => set((state) => ({
    appointments: state.appointments.filter((a) => a.id !== id),
  })),
  
  fetchPatients: async () => {
    try {
      const res = await fetch('/api/patients');
      const data = await res.json();
      set({ patients: data });
    } catch (error) {
      console.error('Fetch patients error:', error);
    }
  },
  
  fetchAppointments: async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      set({ appointments: data });
    } catch (error) {
      console.error('Fetch appointments error:', error);
    }
  },
  
  fetchProcedures: async () => {
    try {
      const res = await fetch('/api/procedures');
      const data = await res.json();
      if (data.length === 0) {
        await get().seedProcedures();
        const res2 = await fetch('/api/procedures');
        const data2 = await res2.json();
        set({ procedures: data2 });
      } else {
        set({ procedures: data });
      }
    } catch (error) {
      console.error('Fetch procedures error:', error);
    }
  },
  
  fetchDiscounts: async () => {
    try {
      const res = await fetch('/api/discounts');
      const data = await res.json();
      set({ discounts: data });
    } catch (error) {
      console.error('Fetch discounts error:', error);
    }
  },
  
  seedProcedures: async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
    } catch (error) {
      console.error('Seed procedures error:', error);
    }
  },
}));
