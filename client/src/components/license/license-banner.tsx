import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useLicense } from '@/hooks/use-license';

/**
 * Aviso de licenca mostrado no topo do shell principal. So aparece nos
 * estados que ainda nao bloqueiam o sistema (UNLICENSED/EXPIRING) — o
 * bloqueio efectivo (PENDING/EXPIRED/SUSPENDED/REVOKED/INVALID) e tratado
 * por <LicenseExpiredScreen/>, nao por este banner.
 */
export function LicenseBanner() {
  const { data, status } = useLicense();

  if (status === 'UNLICENSED') {
    return (
      <div
        className="flex items-center gap-2 px-4 py-2 text-sm"
        style={{ backgroundColor: 'var(--tone-info-soft)', color: 'var(--tone-info)' }}
      >
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>Este sistema ainda nao tem uma licenca ativada. Contacte o administrador do sistema.</span>
      </div>
    );
  }

  if (status === 'EXPIRING' && data?.license) {
    const days = data.daysRemaining ?? 0;
    const overdue = days < 0;
    const severe = days <= 3;

    return (
      <div
        className="flex items-center gap-2 px-4 py-2 text-sm"
        style={{
          backgroundColor: severe ? 'var(--tone-danger-soft)' : 'var(--tone-warn-soft)',
          color: severe ? 'var(--tone-danger)' : 'var(--tone-warn)',
        }}
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>
          {overdue
            ? `A licenca expirou ha ${Math.abs(days)} dia(s) e esta em periodo de tolerancia. Renove o quanto antes.`
            : `A licenca expira em ${days} dia(s). Contacte o administrador para renovar.`}
        </span>
      </div>
    );
  }

  return null;
}
