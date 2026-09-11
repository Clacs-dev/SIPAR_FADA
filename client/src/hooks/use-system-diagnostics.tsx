import { useCallback, useEffect, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export type HealthStatus = 'healthy' | 'warning' | 'degraded' | 'critical' | 'offline';

export interface HealthComponent {
  name: string;
  status: HealthStatus;
  detail: string;
}

export interface SystemHealth {
  overallPercent: number;
  components: HealthComponent[];
}

export interface SystemDiagnostics {
  database: {
    counts: Record<string, number>;
    dbFileSizeBytes: number | null;
    migrations: string[];
  };
  storage: {
    totalFiles: number;
    totalSizeBytes: number;
    byModule: Record<string, { count: number; sizeBytes: number }>;
    integrity: { missingOnDisk: number; orphanOnDisk: number };
  };
  email: { configured: boolean; provider: string; host: string | null; user: string | null; from: string; sent: number; failed: number; asyncQueue: boolean };
  push: { configured: boolean; publicKey: string; activeSubscriptions: number; inactiveSubscriptions: number };
  notifications: { total: number; unread: number };
  rbac: { unusedRoles: string[]; orphanPermissions: string[] };
}

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
  eta: string | null;
}

export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/system/health`, { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Erro ao carregar saude do sistema');
      const data = await response.json();
      setHealth({ overallPercent: data.overallPercent, components: data.components });
    } catch (error: any) {
      console.error('Erro ao carregar saude do sistema:', error);
      setHealth(null);
      setError(error?.message || 'Erro ao carregar saude do sistema');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { health, loading, error, reload: load };
}

export function useSystemDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/system/diagnostics`, { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Erro ao carregar diagnostico do sistema');
      const data = await response.json();
      delete data.success;
      setDiagnostics(data);
    } catch (error: any) {
      console.error('Erro ao carregar diagnostico do sistema:', error);
      setDiagnostics(null);
      setError(error?.message || 'Erro ao carregar diagnostico do sistema');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { diagnostics, loading, error, reload: load };
}

export function useSystemLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (params: { level?: string; search?: string } = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (params.level) query.set('level', params.level);
      if (params.search) query.set('search', params.search);
      const response = await fetch(`${API_BASE_URL}/system/logs?${query.toString()}`, { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Erro ao carregar logs');
      const data = await response.json();
      setLogs(data.logs || []);
    } catch (error: any) {
      console.error('Erro ao carregar logs tecnicos:', error);
      setLogs([]);
      setError(error?.message || 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { logs, loading, error, reload: load };
}

export function useMaintenanceMode() {
  const [maintenance, setMaintenance] = useState<MaintenanceMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/system/maintenance-mode`, { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Erro ao carregar modo de manutencao');
      const data = await response.json();
      setMaintenance(data.maintenance);
    } catch (error: any) {
      console.error('Erro ao carregar modo de manutencao:', error);
      setError(error?.message || 'Erro ao carregar modo de manutencao');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (payload: MaintenanceMode) => {
    const response = await fetch(`${API_BASE_URL}/system/maintenance-mode`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao alterar modo de manutencao');
    }
    await load();
  };

  return { maintenance, loading, error, toggle, reload: load };
}

export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: string;
}

export function useBackups() {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/system/backups`, { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Erro ao carregar copias de seguranca');
      const data = await response.json();
      setBackups(data.backups || []);
    } catch (error: any) {
      console.error('Erro ao carregar copias de seguranca:', error);
      setError(error?.message || 'Erro ao carregar copias de seguranca');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createBackup = async () => {
    setCreating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/system/backups`, { method: 'POST', headers: getAuthHeaders() });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao criar copia de seguranca');
      }
      await load();
    } finally {
      setCreating(false);
    }
  };

  const downloadUrl = (filename: string) => `${API_BASE_URL}/system/backups/${encodeURIComponent(filename)}/download`;

  return { backups, loading, error, creating, createBackup, downloadUrl, reload: load };
}
