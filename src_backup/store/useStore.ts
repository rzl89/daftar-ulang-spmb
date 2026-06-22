import { create } from 'zustand';
import type { RegistrationFormData } from '@/types';

export type RegistrationStatus = 'MENUNGGU_VERIFIKASI' | 'DITERIMA' | 'DITOLAK';

export interface RegistrationRecord extends RegistrationFormData {
  registrationId: string;
  status: RegistrationStatus;
  createdAt: string;
}

interface RegistrationState {
  // Actions
  addRegistration: (data: RegistrationFormData) => Promise<RegistrationRecord>;
}

export const useStore = create<RegistrationState>((set) => ({
  addRegistration: async (data: RegistrationFormData) => {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mendaftar, silakan coba lagi.');
    }

    return result as RegistrationRecord;
  }
}));
