import api from './api';

export type LicenseStatus =
  | 'UNLICENSED'
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'REVOKED'
  | 'INVALID';

export interface LicenseInfo {
  licenseId: string;
  customerName: string;
  licenseType: string;
  startsAt: string;
  expiresAt: string | null;
  maxUsers: number | null;
  maxAdmins: number | null;
  modules: string[];
  features: Record<string, boolean>;
  offlineGraceDays: number;
  activatedAt: string | null;
}

export interface LicenseStatusResponse {
  success: boolean;
  status: LicenseStatus;
  reason: string | null;
  effectiveNow: string;
  daysRemaining: number | null;
  license: LicenseInfo | null;
  fingerprint?: string;
}

export interface LicenseHistoryEntry {
  id: string;
  action: string;
  severity: string;
  resourceId: string | null;
  userEmail: string | null;
  success: boolean | null;
  metadata: Record<string, any>;
  createdAt: string;
}

export const licenseApi = {
  getStatus: () => api.get<LicenseStatusResponse>('/license/status'),

  refresh: () => api.post<LicenseStatusResponse>('/license/refresh'),

  getFingerprint: () => api.get<{ success: boolean; fingerprint: string }>('/license/fingerprint'),

  getHistory: () => api.get<{ success: boolean; history: LicenseHistoryEntry[] }>('/license/history'),

  activate: (licenseFile: File | null, certificateFile: File | null) => {
    const formData = new FormData();
    if (licenseFile) formData.append('license', licenseFile);
    if (certificateFile) formData.append('certificate', certificateFile);
    return api.upload<LicenseStatusResponse & { fingerprint: string }>('/license/activate', formData);
  },
};
