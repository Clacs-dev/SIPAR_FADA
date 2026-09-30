import { useState, useEffect } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { AuthProvider, useAuth } from "./components/auth/auth-context";
import { ErrorBoundary } from "./components/auth/error-boundary";
import { LicenseProvider, useLicense } from "./hooks/use-license";
import { LicenseBanner } from "./components/license/license-banner";
import { LicenseExpiredScreen } from "./components/license/license-expired-screen";
import { LicenseManagement } from "./components/admin/license-management";
import { LoginForm } from "./components/auth/login-form";
import { Sidebar } from "./components/layout/sidebar";
import { TopBar } from "./components/layout/topbar";
import { DashboardOverview } from "./components/dashboard/overview";
import { SendGridStatusBanner } from "./components/dashboard/sendgrid-status-banner";
import { PresentationForm } from "./components/forms/presentation-form";
import { AudienceForm } from "./components/forms/audience-form";
import { UserRequests } from "./components/management/user-requests";
import { RequestsList } from "./components/management/requests-list";
import { SecretarySchedule } from "./components/management/secretary-schedule";
import { Agenda } from "./components/schedule/agenda";
import { UserManagement } from "./components/management/user-management";
import { NotificationCenter } from "./components/notifications/notification-center";
import { PushNotificationManager } from "./components/notifications/push-notification-manager";
import { EmailManagement } from "./components/admin/email-management";
import { AuditDashboard } from "./components/admin/audit-dashboard";
import { DatabaseManagement } from "./components/admin/database-management";
import { MessagingCenter } from "./components/messaging/messaging-center";
import { InternalMeetings } from "./components/management/internal-meetings";
import { Actas } from "./components/management/actas";
import { Comunicacoes } from "./components/management/comunicacoes";
import { Compras } from "./components/management/compras";
import { Facturas } from "./components/management/facturas";
import { MapaImpostos } from "./components/shared/mapa-impostos";
import { MeetingRoomsAdmin } from "./components/meeting-rooms/meeting-rooms-admin";
import { IntegrationsConfig } from "./components/admin/integrations-config";
import { DepartmentsAdmin } from "./components/admin/departments-admin";
import { AreasAdmin } from "./components/admin/areas-admin";
import { RolesPermissionsAdmin } from "./components/admin/roles-permissions-admin";
import { SystemDiagnostics } from "./components/admin/system-diagnostics";
import { TrashScreen } from "./components/admin/trash";
import { MinhasFacturas } from "./components/external/minhas-facturas";
import { DepartmentDashboard } from "./components/dashboard/department-dashboard";
import { DepartmentReports } from "./components/reports/department-reports";
import ActaDemoPage from "./pages/acta-demo";
import { Toaster } from "./components/ui/sonner";
import { DocumentPreviewHost } from "./components/ui/document-preview";
import { toast } from "sonner@2.0.3";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import { hasPermission } from "./components/auth/permissions";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { isRestricted } = useLicense();
  // Id da factura a abrir directamente nos detalhes quando se navega para o
  // separador "facturas" a partir de uma linha do Mapa de Impostos (sidebar).
  const [facturaAlvoId, setFacturaAlvoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  // Id de uma acta a abrir directamente ao navegar para "Livro de Actas" (a
  // partir do botao "Ver Acta" na Agenda ou nas Reunioes Internas).
  const [pendingActaId, setPendingActaId] = useState<string | null>(null);
  const openActa = (actaId: string) => {
    setPendingActaId(actaId);
    setActiveTab("actas");
  };

  // =====================================================
  // VERIFICAÇÃO DE RELOAD PENDENTE APÓS LOGIN FORNECEDOR
  // =====================================================
  const needsReload = localStorage.getItem('fornecedor_needs_reload');
  if (needsReload === 'true') {
 console.log(' Reload pendente detectado - aguardando reload da página...');
    localStorage.removeItem('fornecedor_needs_reload');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">A sincronizar autenticação...</p>
        </div>
      </div>
    );
  }

  // Mostrar loading enquanto está verificando autenticação
  if (isLoading) {
 console.log('⏳ AuthContext ainda está carregando...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground text-lg">A carregar sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
 console.log(' Nenhum utilizador autenticado, mostrando LoginForm');
    return <LoginForm />;
  }
  
 console.log(' Utilizador autenticado:', user.name, '- Role:', user.role);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <>
            {hasPermission(user.role, "MANAGE_SETTINGS") && (
              <SendGridStatusBanner onConfigure={() => setActiveTab("integrations-config")} />
            )}
            <DashboardOverview onTabChange={setActiveTab} />
          </>
        );

      // Formulários para usuários
      case "presentations":
        if (!hasPermission(user.role, "CREATE_PRESENTATION")) {
          return <div>Acesso negado</div>;
        }
        return <PresentationForm />;

      case "audiences":
        if (!hasPermission(user.role, "CREATE_AUDIENCE")) {
          return <div>Acesso negado</div>;
        }
        return <AudienceForm />;

      // Solicitações do usuário
      case "my-requests":
        if (!hasPermission(user.role, "VIEW_OWN_HISTORY")) {
          return <div>Acesso negado</div>;
        }
        return <UserRequests />;

      // Gerenciamento para admin e atendente
      case "history":
        if (
          !hasPermission(user.role, "VIEW_ALL_PRESENTATIONS")
        ) {
          return <div>Acesso negado</div>;
        }
        // Atendentes veem a tela de agendamento, Admins veem todas as solicitações
        if (user.role === "attendant") {
          return <SecretarySchedule />;
        }
        return <RequestsList />;

      case "schedule":
        if (!hasPermission(user.role, "VIEW_SCHEDULE")) {
          return <div>Acesso negado</div>;
        }
        return <Agenda onNavigateToActa={openActa} />;

      // Gerenciamento de usuários (apenas admin)
      case "users":
        if (!hasPermission(user.role, "MANAGE_USERS")) {
          return <div>Acesso negado</div>;
        }
        return <UserManagement />;

      case "settings":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return (
          <div className="space-y-6">
            <div>
              <h1>Configurações</h1>
              <p className="text-muted-foreground">
                Configure as preferências do sistema
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div
                className="p-6 border border-border rounded-lg cursor-pointer hover:bg-accent"
                onClick={() => setActiveTab("integrations-config")}
              >
                <h3 className="flex items-center gap-2"><Mail className="h-4 w-4" />E-mail e plataformas de reunião</h3>
                <p className="text-muted-foreground text-sm">
                  Configure o envio de e-mails (Gmail/SMTP) e as integrações de reunião
                </p>
              </div>
              <div
                className="p-6 border border-border rounded-lg cursor-pointer hover:bg-accent"
                onClick={() => setActiveTab("notifications")}
              >
                <h3>Notificações</h3>
                <p className="text-muted-foreground text-sm">
                  Ver histórico de e-mails enviados pelo sistema
                </p>
              </div>
              <ResetDemoUsersCard />
              <div className="p-6 border border-border rounded-lg">
                <h3>Segurança</h3>
                <p className="text-muted-foreground text-sm">
                  Configurações de segurança e acesso
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <h3>Relatórios</h3>
                <p className="text-muted-foreground text-sm">
                  Configure relatórios automáticos
                </p>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return <NotificationCenter />;

      case "push-notifications":
        return <PushNotificationManager />;

      case "email-management":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <EmailManagement />;

      case "audit-dashboard":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <AuditDashboard />;

      case "database-management":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <DatabaseManagement />;

      case "departments-admin":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <DepartmentsAdmin />;

      case "areas-admin":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <AreasAdmin />;

      case "roles-permissions-admin":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <RolesPermissionsAdmin />;

      case "system-diagnostics":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <SystemDiagnostics />;

      case "trash":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <TrashScreen />;

      case "license-management":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <LicenseManagement />;

      case "department-dashboard":
        if (!hasPermission(user.role, "VIEW_DEPARTMENT_REPORTS")) {
          return <div>Acesso negado</div>;
        }
        return <DepartmentDashboard />;

      case "department-reports":
        if (!hasPermission(user.role, "VIEW_DEPARTMENT_REPORTS")) {
          return <div>Acesso negado</div>;
        }
        return <DepartmentReports />;

      case "messages":
        return <MessagingCenter />;

      case "internal-meetings":
        if (!hasPermission(user.role, "MANAGE_INTERNAL_MEETINGS")) {
          return <div>Acesso negado</div>;
        }
        return <InternalMeetings onNavigateToActa={openActa} />;

      case "meeting-rooms":
        if (!hasPermission(user.role, "MANAGE_MEETING_ROOMS")) {
          return <div>Acesso negado</div>;
        }
        return <MeetingRoomsAdmin />;

      case "actas":
        if (!hasPermission(user.role, "MANAGE_INTERNAL_MEETINGS")) {
          return <div>Acesso negado</div>;
        }
        return <Actas initialActaId={pendingActaId} onInitialActaConsumed={() => setPendingActaId(null)} />;

      case "acta-demo":
        // Página de demonstração acessível a todos os utilizadores autenticados
        return <ActaDemoPage />;

      case "comunicacoes":
        return <Comunicacoes />;

      case "compras":
        return <Compras />;

      case "cotacoes":
        // Portal de Cotações - acessível para usuários externos
        return <Compras mode="cotacoes" />;

      case "facturas":
        if (!hasPermission(user.role, "VIEW_FACTURAS")) {
          return <div>Acesso negado</div>;
        }
        return (
          <Facturas
            initialFacturaId={facturaAlvoId}
            onInitialFacturaHandled={() => setFacturaAlvoId(null)}
          />
        );

      case "mapa-impostos":
        // Clicar numa linha leva directamente aos detalhes dessa factura
        // (com o seu estado real: pendente, validado, aprovado, etc.).
        return (
          <MapaImpostos
            onOpenFactura={(facturaId) => {
              setFacturaAlvoId(facturaId);
              setActiveTab("facturas");
            }}
          />
        );

      case "minhas-facturas":
        // Rota específica para utilizadores externos
        return <MinhasFacturas />;

      case "integrations-config":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <IntegrationsConfig />;

      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onTabChange={setActiveTab} />
        <LicenseBanner />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {isRestricted && activeTab !== "license-management" ? (
              <LicenseExpiredScreen onGoToLicense={() => setActiveTab("license-management")} />
            ) : (
              // Isola erros de renderização de um ecrã ao ecrã atual - sem isto,
              // qualquer excecao nao tratada (ex.: campo undefined vindo da API)
              // desmontava a aplicacao inteira e deixava uma tela branca, so
              // recuperavel com F5.
              <ErrorBoundary key={activeTab}>
                {renderContent()}
              </ErrorBoundary>
            )}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

function ResetDemoUsersCard() {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    setResetting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/reset-demo-users`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(false),
            'Content-Type': 'application/json'
          }
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(`${data.message} Por favor, faça logout e login novamente.`);
      } else {
        toast.error(data.error || 'Erro ao resetar utilizadores');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao resetar utilizadores');
    } finally {
      setResetting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <div className="p-6 border border-border rounded-lg cursor-pointer hover:bg-accent">
          <h3 className="flex items-center gap-2"><RefreshCw className="h-4 w-4" />Resetar Utilizadores Demo</h3>
          <p className="text-muted-foreground text-sm">
            Recriar utilizadores com novos departamentos (27 roles)
          </p>
        </div>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resetar utilizadores de demonstração</AlertDialogTitle>
          <AlertDialogDescription>
            Isto irá eliminar e recriar TODOS os utilizadores de demonstração com os novos departamentos. Continuar?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            disabled={resetting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {resetting ? 'A resetar...' : 'Resetar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LicenseProvider>
          <AppContent />
          <DocumentPreviewHost />
        </LicenseProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}