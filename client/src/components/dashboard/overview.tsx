import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ModuleCard } from "./module-card";
import {
  FileText,
  Users,
  Calendar,
  CheckCircle,
  Loader2,
  UserCheck,
  AlertCircle,
  MessageSquare,
  Briefcase,
  Video,
  ShoppingCart,
  Package,
  MessageCircle,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { toast } from "sonner@2.0.3";
import { apiClient } from "../../utils/api-client";
import { getMenuItems, getExtendedProfile, filterMenuItemsByLicense } from "../auth/permissions";
import { useLicense } from "../../hooks/use-license";

type Tone = 'accent' | 'gold' | 'success' | 'warn' | 'danger' | 'info' | 'neutral';

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: string;
  onClick?: () => void;
  tone?: Tone;
  hero?: boolean;
}

function StatsCard({ title, value, description, icon: Icon, trend, onClick, tone = 'accent', hero = false }: StatsCardProps) {
  if (hero) {
    return (
      <div
        className={`rounded-lg p-[18px] ${onClick ? 'cursor-pointer' : ''}`}
        style={{
          background: 'linear-gradient(135deg, var(--primary), #233252)',
          boxShadow: '0 1px 2px rgba(16, 29, 51, .04), 0 6px 20px rgba(16, 29, 51, .05)'
        }}
        onClick={onClick}
      >
        <div
          className="w-[34px] h-[34px] rounded-md flex items-center justify-center mb-3.5"
          style={{ backgroundColor: 'rgba(184,134,43,.18)' }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: 'var(--tone-gold)' }} />
        </div>
        <p className="font-serif" style={{ fontSize: '26px', fontWeight: 600, lineHeight: 1, color: '#ffffff' }}>
          {value}
        </p>
        <p className="mt-1.5" style={{ fontSize: '12.5px', color: '#a9b6c8' }}>{description}</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-card border border-border rounded-lg p-[18px] ${onClick ? 'cursor-pointer hover:border-[#c9d3d2] transition-colors' : ''}`}
      style={{ boxShadow: '0 1px 2px rgba(16, 29, 51, .04), 0 6px 20px rgba(16, 29, 51, .05)' }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div
          className="w-[34px] h-[34px] rounded-md flex items-center justify-center"
          style={{ backgroundColor: `var(--tone-${tone}-soft)` }}
        >
          <Icon className="w-[18px] h-[18px]" style={{ color: `var(--tone-${tone})` }} />
        </div>
        {trend && (
          <Badge variant="secondary">{trend}</Badge>
        )}
      </div>
      <p className="font-serif" style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)' }}>{value}</p>
      <p className="mt-1" style={{ fontSize: '12.5px', color: 'var(--muted-foreground)' }}>{title}</p>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{description}</p>
      {onClick && (
        <div className="flex items-center gap-1 text-xs mt-2" style={{ color: 'var(--ring)' }}>
          Ver detalhes
          <ArrowRight className="h-3 w-3" />
        </div>
      )}
    </div>
  );
}

export function DashboardOverview({ onTabChange }: { onTabChange?: (tab: string) => void }) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPresentations: 0,
    pendingPresentations: 0,
    totalAudiences: 0,
    pendingAudiences: 0,
    scheduledMeetings: 0,
    scheduledPresentations: 0,
    scheduledAudiences: 0,
    approvalRate: 0,
    pendingAttendants: 0
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [pendingAttendants, setPendingAttendants] = useState<any[]>([]);
  const [facturas, setFacturas] = useState<any[]>([]);
  const [facturasStats, setFacturasStats] = useState({
    total: 0,
    pendentes: 0,
    aprovadas: 0,
    rejeitadas: 0
  });

  // Novos estados para módulos adicionais
  const [modulesStats, setModulesStats] = useState({
    comunicacoes: { total: 0, pendentes: 0, enviadas: 0, comDespacho: 0, urgentes: 0 },
    actas: { total: 0, ordinarias: 0, extraordinarias: 0, recentes: 0 },
    reunioes: { total: 0, proximas: 0, emAndamento: 0, concluidas: 0, online: 0 }
  });
  const [comprasStats, setComprasStats] = useState({ total_pedidos: 0, aguardando_cotacoes: 0, em_analise: 0 });

  // Perfil determina o que faz sentido mostrar neste dashboard - o mesmo
  // criterio usado para montar o menu lateral (getMenuItems), para que o
  // dashboard nunca mostre atalhos para modulos a que o utilizador nao tem
  // acesso (ex: Financeiro/Compras nao trabalham com Apresentacoes/Audiencias,
  // e um utilizador comum nao gere Compras).
  const { data: licenseData } = useLicense();
  const menuItems = user
    ? filterMenuItemsByLicense(getMenuItems(user.role, user.department, user.position), licenseData?.license?.modules)
    : [];
  const hasMenuItem = (id: string) => menuItems.some((item) => item.id === id && item.show);
  const profile = user ? getExtendedProfile(user.role, user.department, user.position) : 'user';
  const mostraApresentacoesAudiencias = hasMenuItem('history') || hasMenuItem('presentations') || hasMenuItem('my-requests');
  const isAdminSistema = user?.role === 'admin_sistema';

  useEffect(() => {
    if (user && accessToken) {
      loadDashboardData();
    }
  }, [user, accessToken]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (!token) {
 console.log(' No access token available, skipping data load');
        setLoading(false);
        return;
      }

 console.log(' Carregando dados da dashboard...');
 console.log(' Token disponível:', token.substring(0, 20) + '...');

      // 🆕 Buscar estatísticas dos módulos adicionais PRIMEIRO
 console.log(' Buscando estatísticas dos módulos...');
      try {
        const url = `${API_BASE_URL}/dashboard/stats`;
 console.log(' URL:', url);
        
        const modulesStatsRes = await fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
 console.log(' Status da resposta:', modulesStatsRes.status);
 console.log(' Headers da resposta:', Object.fromEntries(modulesStatsRes.headers.entries()));
        
        if (modulesStatsRes.ok) {
          const modulesData = await modulesStatsRes.json();
 console.log(' ===== DADOS RECEBIDOS DO BACKEND =====');
 console.log(' Dados completos:', JSON.stringify(modulesData, null, 2));
 console.log(' ========================================');
          
          if (modulesData.success && modulesData.stats) {
 console.log(' Atualizando estatísticas dos módulos...');
 console.log(' Comunicações:', modulesData.stats.comunicacoes);
 console.log(' Actas:', modulesData.stats.actas);
 console.log(' Reuniões:', modulesData.stats.reunioes);
 console.log(' Facturas:', modulesData.stats.facturas);

            const newModulesStats = {
              comunicacoes: modulesData.stats.comunicacoes || { total: 0, pendentes: 0, enviadas: 0, comDespacho: 0, urgentes: 0 },
              actas: modulesData.stats.actas || { total: 0, ordinarias: 0, extraordinarias: 0, recentes: 0 },
              reunioes: modulesData.stats.reunioes || { total: 0, proximas: 0, emAndamento: 0, concluidas: 0, online: 0 }
            };
            
 console.log(' Novo estado de modulesStats:', JSON.stringify(newModulesStats, null, 2));
            setModulesStats(newModulesStats);
 console.log(' Estado atualizado com sucesso!');
            
            // Atualizar facturas stats do novo endpoint
            if (modulesData.stats.facturas) {
 console.log(' Atualizando estatísticas de facturas:', modulesData.stats.facturas);
              const newFacturasStats = {
                total: modulesData.stats.facturas.total || 0,
                pendentes: (modulesData.stats.facturas.pendentes || 0) + (modulesData.stats.facturas.emValidacao || 0),
                aprovadas: (modulesData.stats.facturas.aprovadas || 0) + (modulesData.stats.facturas.pagas || 0),
                rejeitadas: modulesData.stats.facturas.rejeitadas || 0
              };
 console.log(' Novo estado de facturasStats:', newFacturasStats);
              setFacturasStats(newFacturasStats);
            }
          } else {
 console.warn(' Resposta sem dados de estatísticas:', modulesData);
          }
        } else {
 console.error(' Erro ao buscar estatísticas, status:', modulesStatsRes.status);
          const errorText = await modulesStatsRes.text();
 console.error(' Resposta de erro:', errorText);
        }
      } catch (error) {
 console.error(' Erro ao buscar estatísticas dos módulos:', error);
 console.error(' Stack trace:', error.stack);
      }

      // Fetch presentations
      const presentationsRes = await fetch(
        `${API_BASE_URL}/presentations`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // Fetch audiences
      const audiencesRes = await fetch(
        `${API_BASE_URL}/audiences`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // Fetch facturas (para departamento de Compras e Financeiro)
      if (user?.role === 'compras' || user?.role === 'financeiro' || 
          user?.role === 'gabinete_pca' || user?.role === 'gabinete_pce' || 
          user?.role === 'gabinete_administrador' || user?.role === 'externo') {
        try {
          const facturasRes = await fetch(
            `${API_BASE_URL}/facturas/list`,
            {
              headers: { 'Authorization': `Bearer ${token}` }
            }
          );
          
          if (facturasRes.ok) {
            const facturasData = await facturasRes.json();
            let allFacturas = facturasData.facturas || [];
            
            // Filtrar facturas por utilizador externo
            if (user?.role === 'externo') {
              allFacturas = allFacturas.filter((f: any) => f.fornecedorId === user.id);
            }
            
            setFacturas(allFacturas);
 console.log(' Facturas carregadas:', allFacturas.length);
          }
        } catch (error) {
 console.error('Error fetching facturas:', error);
        }
      }

      // Estatisticas reais de Compras/Procurement (o card do dashboard mostrava
      // sempre "0", fixo, nunca ligado a nenhum dado real).
      if (hasMenuItem('compras')) {
        try {
          const comprasRes = await fetch(`${API_BASE_URL}/procurement/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (comprasRes.ok) {
            const comprasData = await comprasRes.json();
            if (comprasData.stats) {
              setComprasStats({
                total_pedidos: comprasData.stats.total_pedidos || 0,
                aguardando_cotacoes: comprasData.stats.aguardando_cotacoes || 0,
                em_analise: comprasData.stats.em_analise || 0,
              });
            }
          }
        } catch (error) {
 console.error('Error fetching compras stats:', error);
        }
      }

      // Fetch users (for admin only)
      let allUsers: any[] = [];
      if (isAdminSistema) {
        try {
          allUsers = await apiClient.getAllUsers(token);
        } catch (error) {
 console.error('Error fetching users:', error);
        }
      }

      if (presentationsRes.ok && audiencesRes.ok) {
        const presentationsData = await presentationsRes.json();
        const audiencesData = await audiencesRes.json();

        let presentations = presentationsData.data || [];
        let audiences = audiencesData.data || [];

        // FILTRAR DADOS PARA USUÁRIOS NORMAIS
        // Usuários normais só veem seus próprios dados
        if (user?.role === 'externo') {
          presentations = presentations.filter((p: any) => p.userId === user.id);
          audiences = audiences.filter((a: any) => a.userId === user.id);
          
 console.log(`Filtered data for user ${user.id}:`, {
            presentations: presentations.length,
            audiences: audiences.length
          });
        }

        // Calculate stats
        const pendingPres = presentations.filter((p: any) => p.status === 'pendente').length;
        const pendingAud = audiences.filter((a: any) => a.status === 'pendente').length;
        const scheduledPres = presentations.filter((p: any) => p.status === 'agendado').length;
        const scheduledAud = audiences.filter((a: any) => a.status === 'agendado').length;
        const scheduled = scheduledPres + scheduledAud;
        const total = presentations.length + audiences.length;
        const approved = [...presentations, ...audiences].filter((r: any) => 
          r.status === 'aprovado' || r.status === 'aceite_admin' || r.status === 'agendado'
        ).length;
        const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

        // Get pending attendants (admin only)
        let pendingAttendantsList: any[] = [];
        if (isAdminSistema) {
          pendingAttendantsList = allUsers.filter(u => u.role === 'attendant' && u.status === 'pending');
          setPendingAttendants(pendingAttendantsList);
        }

        setStats({
          totalPresentations: presentations.length,
          pendingPresentations: pendingPres,
          totalAudiences: audiences.length,
          pendingAudiences: pendingAud,
          scheduledMeetings: scheduled,
          scheduledPresentations: scheduledPres,
          scheduledAudiences: scheduledAud,
          approvalRate,
          pendingAttendants: pendingAttendantsList.length
        });

        // Get recent requests
        const allRequests = [
          ...presentations.map((p: any) => ({ ...p, type: 'Carta de Apresentação' })),
          ...audiences.map((a: any) => ({ ...a, type: 'Pedido de Audiência' }))
        ];

        const recent = allRequests
          .sort((a, b) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime())
          .slice(0, 5);

        setRecentRequests(recent);
        
 console.log(' Dashboard carregada com sucesso!');
      } else {
 console.error('Failed to fetch dashboard data');
      }
    } catch (error) {
 console.error('Error loading dashboard data:', error);
      toast.error('Erro ao carregar dados da dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-[var(--status-pendente)] text-[var(--status-pendente-foreground)]';
      case 'aceite_admin': return 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]';
      case 'delegado': return 'bg-[var(--status-delegado)] text-[var(--status-delegado-foreground)]';
      case 'agendado': return 'bg-[var(--status-agendado)] text-[var(--status-agendado-foreground)]';
      case 'aprovado': return 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]';
      case 'revisada': return 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]';
      case 'rejeitado': return 'bg-[var(--status-rejeitado)] text-[var(--status-rejeitado-foreground)]';
      default: return 'bg-[var(--tone-neutral-soft)] text-[var(--tone-neutral)]';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'aceite_admin': 'Aceite Admin',
      'delegado': 'Delegado',
      'agendado': 'Agendado',
      'aprovado': 'Aprovado',
      'rejeitado': 'Rejeitado',
      'revisada': 'Revisada'
    };
    return labels[status] || status;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return '-';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          {user?.role === 'externo' 
            ? 'Visão geral das suas solicitações'
            : 'Visão geral do sistema de gestão'
          }
        </p>
      </div>

      {mostraApresentacoesAudiencias ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            title="Taxa de Aprovação"
            value={`${stats.approvalRate}%`}
            description={user?.role === 'externo' ? 'Das suas solicitações' : 'Solicitações aprovadas'}
            icon={CheckCircle}
            hero
          />
          <StatsCard
            title={user?.role === 'externo' ? 'Minhas Apresentações' : 'Total de Apresentações'}
            value={stats.totalPresentations.toString()}
            description={`${stats.pendingPresentations} pendentes de análise`}
            icon={FileText}
            tone="accent"
          />
          <StatsCard
            title={user?.role === 'externo' ? 'Minhas Audiências' : 'Total de Audiências'}
            value={stats.totalAudiences.toString()}
            description={`${stats.pendingAudiences} aguardando confirmação`}
            icon={Users}
            tone="info"
          />
          <StatsCard
            title="Apresentações Agendadas"
            value={stats.scheduledPresentations.toString()}
            description="Cartas com reunião marcada"
            icon={CheckCircle}
            tone="success"
          />
          <StatsCard
            title="Audiências Agendadas"
            value={stats.scheduledAudiences.toString()}
            description="Pedidos com reunião marcada"
            icon={Calendar}
            tone="success"
          />
          <StatsCard
            title="Total de Reuniões"
            value={stats.scheduledMeetings.toString()}
            description="Soma de todos os agendamentos"
            icon={Calendar}
            tone="gold"
          />
        </div>
      ) : (
        // Perfis sem Apresentacoes/Audiencias (Financeiro, Administrador do
        // Sistema, etc.) veem em vez disso os indicadores dos modulos que
        // realmente usam no dia-a-dia.
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hasMenuItem('facturas') && (
            <StatsCard
              title="Facturas"
              value={facturasStats.total.toString()}
              description={`${facturasStats.pendentes} pendentes de aprovação`}
              icon={Briefcase}
              tone="danger"
              onClick={() => onTabChange?.('facturas')}
            />
          )}
          {hasMenuItem('compras') && (
            <StatsCard
              title="Pedidos de Compra"
              value={comprasStats.total_pedidos.toString()}
              description={`${comprasStats.aguardando_cotacoes} aguardando cotações`}
              icon={ShoppingCart}
              tone="accent"
              onClick={() => onTabChange?.('compras')}
            />
          )}
          {hasMenuItem('comunicacoes') && (
            <StatsCard
              title="Comunicações"
              value={modulesStats.comunicacoes.total.toString()}
              description={`${modulesStats.comunicacoes.pendentes} pendentes`}
              icon={MessageSquare}
              tone="gold"
              onClick={() => onTabChange?.('comunicacoes')}
            />
          )}
          {hasMenuItem('schedule') && (
            <StatsCard
              title="Reuniões"
              value={modulesStats.reunioes.proximas.toString()}
              description="Próximas reuniões agendadas"
              icon={Calendar}
              tone="success"
              onClick={() => onTabChange?.('schedule')}
            />
          )}
          {isAdminSistema && (
            <StatsCard
              title="Utilizadores"
              value={pendingAttendants.length > 0 ? `${stats.pendingAttendants} pendentes` : 'Geridos'}
              description="Contas do sistema"
              icon={Users}
              tone="info"
              onClick={() => onTabChange?.('users')}
            />
          )}
        </div>
      )}

      {/* ======================= MÓDULOS DO SISTEMA ======================= */}
      {(hasMenuItem('comunicacoes') || hasMenuItem('actas') || hasMenuItem('internal-meetings') || hasMenuItem('facturas') || hasMenuItem('compras')) && (
        <div>
          <h2 className="mb-4 font-serif" style={{ fontSize: '16px', fontWeight: 600, color: 'var(--foreground)' }}>Módulos do Sistema</h2>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {hasMenuItem('comunicacoes') && (
              <ModuleCard
                title="Comunicações"
                value={modulesStats.comunicacoes.total}
                icon={MessageSquare}
                tone="gold"
                onClick={() => onTabChange?.('comunicacoes')}
              />
            )}

            {hasMenuItem('actas') && (
              <ModuleCard
                title="Actas"
                value={modulesStats.actas.total}
                icon={FileText}
                tone="info"
                onClick={() => onTabChange?.('actas')}
              />
            )}

            {hasMenuItem('internal-meetings') && (
              <ModuleCard
                title="Reuniões"
                value={modulesStats.reunioes.proximas}
                icon={Video}
                tone="success"
                onClick={() => onTabChange?.('internal-meetings')}
              />
            )}

            {hasMenuItem('facturas') && (
              <ModuleCard
                title="Facturas"
                value={facturasStats.total}
                icon={Briefcase}
                tone="danger"
                onClick={() => onTabChange?.('facturas')}
              />
            )}

            {hasMenuItem('compras') && (
              <ModuleCard
                title="Compras"
                value={comprasStats.total_pedidos}
                icon={ShoppingCart}
                tone="accent"
                onClick={() => onTabChange?.('compras')}
              />
            )}
          </div>
        </div>
      )}

      {/* Alerta de Atendentes Pendentes (apenas para admin) */}
      {isAdminSistema && stats.pendingAttendants > 0 && (
        <Card style={{ borderColor: 'var(--tone-warn)', backgroundColor: 'var(--tone-warn-soft)' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: 'var(--tone-warn-soft)' }}>
                  <AlertCircle className="h-6 w-6" style={{ color: 'var(--tone-warn)' }} />
                </div>
                <div>
                  <CardTitle style={{ color: 'var(--tone-warn)' }}>
                    {stats.pendingAttendants} {stats.pendingAttendants === 1 ? 'Atendente Aguardando' : 'Atendentes Aguardando'} Aprovação
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--tone-warn)' }}>
                    {stats.pendingAttendants === 1 ? 'Um novo atendente se registrou' : 'Novos atendentes se registraram'} e precisa{stats.pendingAttendants === 1 ? '' : 'm'} de aprovação para acessar o sistema
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '#/admin/users'}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: 'var(--tone-warn)' }}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Revisar Agora
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAttendants.slice(0, 3).map((attendant) => (
                <div key={attendant.id} className="flex items-center justify-between p-3 bg-white rounded-lg border" style={{ borderColor: 'var(--tone-warn)' }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--tone-warn-soft)' }}>
                      <Users className="h-4 w-4" style={{ color: 'var(--tone-warn)' }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{attendant.name}</p>
                      <p className="text-xs text-muted-foreground">{attendant.email}</p>
                    </div>
                  </div>
                  <Badge style={{ backgroundColor: 'var(--tone-warn-soft)', color: 'var(--tone-warn)' }}>Pendente</Badge>
                </div>
              ))}
              {stats.pendingAttendants > 3 && (
                <p className="text-sm text-center pt-2" style={{ color: 'var(--tone-warn)' }}>
                  + {stats.pendingAttendants - 3} {stats.pendingAttendants - 3 === 1 ? 'outro atendente' : 'outros atendentes'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🛒 Alerta de Faturas Pendentes (Departamento de Compras) */}
      {user?.role === 'compras' && facturasStats.pendentes > 0 && (
        <Card style={{ borderColor: 'var(--tone-info)', backgroundColor: 'var(--tone-info-soft)' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full" style={{ backgroundColor: 'var(--tone-info-soft)' }}>
                  <FileText className="h-6 w-6" style={{ color: 'var(--tone-info)' }} />
                </div>
                <div>
                  <CardTitle style={{ color: 'var(--tone-info)' }}>
                    {facturasStats.pendentes} {facturasStats.pendentes === 1 ? 'Fatura Pendente' : 'Faturas Pendentes'} de Fornecedores
                  </CardTitle>
                  <CardDescription style={{ color: 'var(--tone-info)' }}>
                    {facturasStats.pendentes === 1 ? 'Um fornecedor cadastrou' : 'Fornecedores cadastraram'} {facturasStats.pendentes === 1 ? 'uma nova fatura' : 'novas faturas'} que precisam de revisão
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => {
                  const facturasTab = document.querySelector('[data-tab="facturas"]') as HTMLElement;
                  if (facturasTab) facturasTab.click();
                }}
                className="text-white hover:opacity-90"
                style={{ backgroundColor: 'var(--tone-info)' }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Faturas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {facturas
                .filter(f => f.status === 'pendente' || f.status === 'validacao_financeira')
                .slice(0, 3)
                .map((factura) => (
                  <div key={factura.id} className="flex items-center justify-between p-3 bg-white rounded-lg border" style={{ borderColor: 'var(--tone-info)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{ backgroundColor: 'var(--tone-info-soft)' }}>
                        <FileText className="h-4 w-4" style={{ color: 'var(--tone-info)' }} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{factura.numeroFactura || `Fatura #${factura.id.slice(0, 8)}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {factura.fornecedorNome || 'Fornecedor'} • {new Intl.NumberFormat('pt-AO', {
                            style: 'currency',
                            currency: 'AOA'
                          }).format(factura.valorTotal || 0)}
                        </p>
                      </div>
                    </div>
                    <Badge style={{ backgroundColor: 'var(--tone-gold-soft)', color: 'var(--tone-gold)' }}>
                      {factura.status === 'pendente' ? 'Nova' : 'Em Validação'}
                    </Badge>
                  </div>
                ))}
              {facturasStats.pendentes > 3 && (
                <p className="text-sm text-center pt-2" style={{ color: 'var(--tone-info)' }}>
                  + {facturasStats.pendentes - 3} {facturasStats.pendentes - 3 === 1 ? 'outra fatura' : 'outras faturas'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {mostraApresentacoesAudiencias && (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === 'externo' ? 'Minhas Solicitações Recentes' : 'Solicitações Recentes'}
            </CardTitle>
            <CardDescription>
              {user?.role === 'externo' ? 'Suas últimas submissões' : 'Últimas submissões no sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {user?.role === 'externo' 
                  ? 'Você ainda não fez nenhuma solicitação'
                  : 'Nenhuma solicitação encontrada'
                }
              </p>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{request.company || request.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">
                        {request.type} • {request.contact || request.requesterName || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge className={getStatusColor(request.status)}>
                        {getStatusLabel(request.status)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(request.createdAt || request.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === 'externo' ? 'Minhas Próximas Reuniões' : 'Próximas Audiências'}
            </CardTitle>
            <CardDescription>
              {user?.role === 'externo' ? 'Suas reuniões confirmadas' : 'Reuniões confirmadas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.filter(r => r.status === 'agendado').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {user?.role === 'externo'
                  ? 'Você não tem reuniões agendadas'
                  : 'Nenhuma reunião agendada'
                }
              </p>
            ) : (
              <div className="space-y-4">
                {recentRequests
                  .filter(r => r.status === 'agendado')
                  .slice(0, 3)
                  .map((request) => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{request.company || request.name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">
                          {request.meetingType === 'online' ? 'Online' : 'Presencial'} • 
                          {request.platform || request.location || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatDate(request.preferredDate)} - {request.time || 'N/A'}
                        </p>
                        <Badge style={{ backgroundColor: 'var(--tone-success-soft)', color: 'var(--tone-success)' }}>Confirmado</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}