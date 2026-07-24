import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./components/auth/auth-context";
import { LoginForm } from "./components/auth/login-form";
import { Sidebar } from "./components/layout/sidebar";
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
import { Oficios } from "./components/management/oficios";
import { Comunicacoes } from "./components/management/comunicacoes";
import { Reclamacoes } from "./components/management/reclamacoes";
import { ReclamacoesPublicPage } from "./components/reclamacoes/reclamacoes-public-page";
import { Contratos } from "./components/management/contratos";
import { Pedidos } from "./components/management/pedidos";
import { Compras } from "./components/management/compras";
import { Planejamento } from "./components/management/planejamento";
import { Facturas } from "./components/management/facturas";
import { StorageAdmin } from "./components/admin/storage-admin";
import { GmailConfig } from "./components/admin/gmail-config";
import { MinhasFacturas } from "./components/external/minhas-facturas";
import { DepartmentDashboard } from "./components/dashboard/department-dashboard";
import { DepartmentReports } from "./components/reports/department-reports";
import { FrotasMain } from "./components/frotas/frotas-main";
import ActaDemoPage from "./pages/acta-demo";
import { Toaster } from "./components/ui/sonner";
import { hasPermission } from "./components/auth/permissions";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

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
              <SendGridStatusBanner onConfigure={() => setActiveTab("sendgrid-config")} />
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
        return <Agenda />;

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
                onClick={() => setActiveTab("sendgrid-config")}
              >
                <h3>📧 Configurar Gmail SMTP</h3>
                <p className="text-muted-foreground text-sm">
                  Configure o envio automático de emails via Gmail
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
              <div
                className="p-6 border border-border rounded-lg cursor-pointer hover:bg-accent"
                onClick={async () => {
                  if (confirm('⚠️ ATENÇÃO! Isto irá deletar e recriar TODOS os utilizadores de demonstração com os novos departamentos. Continuar?')) {
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
                        alert(`✅ Sucesso! ${data.message}\n\nPor favor, faça logout e login novamente.`);
                      } else {
                        alert(`❌ Erro: ${data.error}`);
                      }
                    } catch (error) {
                      alert(`❌ Erro ao resetar utilizadores: ${error.message}`);
                    }
                  }
                }}
              >
                <h3>🔄 Resetar Utilizadores Demo</h3>
                <p className="text-muted-foreground text-sm">
                  Recriar utilizadores com novos departamentos (27 roles)
                </p>
              </div>
              <div className="p-6 border border-border rounded-lg">
                <h3>Integrações</h3>
                <p className="text-muted-foreground text-sm">
                  Gerencie conexões com plataformas de reunião
                </p>
              </div>
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

      case "department-dashboard":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <DepartmentDashboard />;

      case "department-reports":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <DepartmentReports />;

      case "messages":
        return <MessagingCenter />;

      case "internal-meetings":
        if (!hasPermission(user.role, "MANAGE_INTERNAL_MEETINGS")) {
          return <div>Acesso negado</div>;
        }
        return <InternalMeetings />;

      case "actas":
        if (!hasPermission(user.role, "MANAGE_INTERNAL_MEETINGS")) {
          return <div>Acesso negado</div>;
        }
        return <Actas />;

      case "acta-demo":
        // Página de demonstração acessível a todos os utilizadores autenticados
        return <ActaDemoPage />;

      case "oficios":
        return <Oficios />;

      case "comunicacoes":
        return <Comunicacoes />;

      case "reclamacoes":
        return <Reclamacoes />;

      case "submeter-reclamacao":
        // Página pública para usuários externos submeterem reclamações
        return <ReclamacoesPublicPage />;

      case "contratos":
        return <Contratos />;

      case "pedidos":
        return <Pedidos />;

      case "compras":
        return <Compras />;

      case "cotacoes":
        // Portal de Cotações - acessível para usuários externos
        return <Compras mode="cotacoes" />;

      case "planejamento":
        return <Planejamento />;

      case "facturas":
        if (!hasPermission(user.role, "VIEW_FACTURAS")) {
          return <div>Acesso negado</div>;
        }
        return <Facturas />;

      case "minhas-facturas":
        // Rota específica para utilizadores externos
        return <MinhasFacturas />;

      case "frotas":
        // Dashboard de Gestão de Frotas
        return <FrotasMain />;

      case "storage-admin":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <StorageAdmin />;

      case "sendgrid-config":
        if (!hasPermission(user.role, "MANAGE_SETTINGS")) {
          return <div>Acesso negado</div>;
        }
        return <GmailConfig />;

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
      <main className="flex-1 overflow-auto">
        <div className="p-6">{renderContent()}</div>
      </main>
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}