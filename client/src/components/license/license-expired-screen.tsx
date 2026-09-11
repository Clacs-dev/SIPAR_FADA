import { ShieldOff, LogOut, KeyRound } from 'lucide-react';
import { useLicense } from '@/hooks/use-license';
import { useAuth } from '@/components/auth/auth-context';
import { Button } from '@/components/ui/button';

const STATUS_MESSAGES: Record<string, string> = {
  PENDING: 'A licenca deste sistema foi carregada mas ainda nao foi ativada.',
  EXPIRED: 'A licenca deste sistema expirou.',
  SUSPENDED: 'A licenca deste sistema esta suspensa.',
  REVOKED: 'A licenca deste sistema foi revogada.',
  INVALID: 'A licenca deste sistema e invalida para esta instalacao.',
};

interface LicenseExpiredScreenProps {
  onGoToLicense: () => void;
}

/**
 * Ecra de bloqueio mostrado quando a licenca esta num estado restrito. O
 * backend ja permite leitura/exportacao (GET) mesmo neste estado — este
 * ecra bloqueia apenas a NAVEGACAO no frontend para os modulos de negocio,
 * sempre deixando disponivel o acesso a Gestao de Licenca (admin_sistema) e
 * o logout.
 */
export function LicenseExpiredScreen({ onGoToLicense }: LicenseExpiredScreenProps) {
  const { data, status } = useLicense();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin_sistema';

  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--tone-danger-soft)' }}
      >
        <ShieldOff className="h-8 w-8" style={{ color: 'var(--tone-danger)' }} />
      </div>

      <h1 className="font-serif" style={{ fontSize: '22px', fontWeight: 600, color: 'var(--foreground)' }}>
        Acesso restrito
      </h1>

      <p style={{ fontSize: '14px', color: 'var(--muted-foreground)', maxWidth: 480 }}>
        {STATUS_MESSAGES[status] || 'A licenca deste sistema esta num estado que restringe o acesso.'}
        {data?.license && ` Cliente: ${data.license.customerName}.`}
      </p>

      <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', maxWidth: 480 }}>
        {isAdmin
          ? 'Carregue uma licenca valida em "Gestao de Licenca" para restaurar o acesso completo.'
          : 'Contacte o administrador do sistema para restaurar o acesso completo.'}
      </p>

      <div className="flex gap-3 pt-2">
        {isAdmin && (
          <Button onClick={onGoToLicense} className="gap-2">
            <KeyRound className="h-4 w-4" />
            Gestao de Licenca
          </Button>
        )}
        <Button variant="outline" onClick={() => logout()} className="gap-2">
          <LogOut className="h-4 w-4" />
          Terminar sessao
        </Button>
      </div>
    </div>
  );
}
