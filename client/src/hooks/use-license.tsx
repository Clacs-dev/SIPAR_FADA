import { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from 'react';
import { licenseApi, LicenseStatusResponse, LicenseStatus } from '@/services/license-api';
import { useAuth } from '@/components/auth/auth-context';

interface LicenseContextType {
  data: LicenseStatusResponse | null;
  loading: boolean;
  status: LicenseStatus;
  isRestricted: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

const RESTRICTED_STATUSES: LicenseStatus[] = ['PENDING', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'INVALID'];
const POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export function LicenseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<LicenseStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await licenseApi.getStatus();
      setData(response);
    } catch (error) {
      console.error('Erro ao carregar estado da licenca:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await licenseApi.refresh();
      setData(response);
    } catch (error) {
      console.error('Erro ao revalidar a licenca:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setData(null);
      return;
    }
    load();

    pollRef.current = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, load]);

  const status = data?.status || 'UNLICENSED';

  return (
    <LicenseContext.Provider
      value={{
        data,
        loading,
        status,
        isRestricted: RESTRICTED_STATUSES.includes(status),
        reload: load,
        refresh,
      }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

export function useLicense() {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense deve ser usado dentro de um LicenseProvider');
  }
  return context;
}
