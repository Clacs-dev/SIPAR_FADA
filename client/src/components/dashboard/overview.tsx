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
  FileSignature,
  Car,
  Briefcase,
  Video,
  TrendingUp,
  Clock,
  AlertTriangle,
  ShoppingCart,
  ClipboardList,
  Package,
  MessageCircle,
  FileCheck,
  Wrench,
  ArrowRight
} from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { toast } from "sonner@2.0.3";
import { apiClient } from "../../utils/api-client";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  trend?: string;
  onClick?: () => void;
  color?: string;
}

function StatsCard({ title, value, description, icon: Icon, trend, onClick, color = "blue" }: StatsCardProps) {
  const colorClasses = {
    blue: "hover:border-blue-200 hover:bg-blue-50/50",
    green: "hover:border-green-200 hover:bg-green-50/50",
    purple: "hover:border-purple-200 hover:bg-purple-50/50",
    orange: "hover:border-orange-200 hover:bg-orange-50/50",
    cyan: "hover:border-cyan-200 hover:bg-cyan-50/50",
    pink: "hover:border-pink-200 hover:bg-pink-50/50",
    yellow: "hover:border-yellow-200 hover:bg-yellow-50/50",
    red: "hover:border-red-200 hover:bg-red-50/50",
  };

  return (
    <Card 
      className={`transition-all ${onClick ? `cursor-pointer ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}` : ''}`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <Badge variant="secondary" className="mt-2">
            {trend}
          </Badge>
        )}
        {onClick && (
          <div className="flex items-center gap-1 text-xs text-primary mt-2">
            Ver detalhes
            <ArrowRight className="h-3 w-3" />
          </div>
        )}
      </CardContent>
    </Card>
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
    oficios: { total: 0, saida: 0, entrada: 0, pendentes: 0, arquivados: 0, comDespacho: 0 },
    comunicacoes: { total: 0, pendentes: 0, enviadas: 0, comDespacho: 0, urgentes: 0 },
    actas: { total: 0, ordinarias: 0, extraordinarias: 0, recentes: 0 },
    reunioes: { total: 0, proximas: 0, emAndamento: 0, concluidas: 0, online: 0 },
    frotas: { totalVeiculos: 0, disponiveis: 0, emUso: 0, manutencao: 0, pedidosPendentes: 0, pedidosAprovados: 0 }
  });

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
 console.log(' Ofícios:', modulesData.stats.oficios);
 console.log(' Comunicações:', modulesData.stats.comunicacoes);
 console.log(' Actas:', modulesData.stats.actas);
 console.log(' Reuniões:', modulesData.stats.reunioes);
 console.log(' Frotas:', modulesData.stats.frotas);
 console.log(' Facturas:', modulesData.stats.facturas);
            
            const newModulesStats = {
              oficios: modulesData.stats.oficios || { total: 0, saida: 0, entrada: 0, pendentes: 0, arquivados: 0, comDespacho: 0 },
              comunicacoes: modulesData.stats.comunicacoes || { total: 0, pendentes: 0, enviadas: 0, comDespacho: 0, urgentes: 0 },
              actas: modulesData.stats.actas || { total: 0, ordinarias: 0, extraordinarias: 0, recentes: 0 },
              reunioes: modulesData.stats.reunioes || { total: 0, proximas: 0, emAndamento: 0, concluidas: 0, online: 0 },
              frotas: modulesData.stats.frotas || { totalVeiculos: 0, disponiveis: 0, emUso: 0, manutencao: 0, pedidosPendentes: 0, pedidosAprovados: 0 }
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

      // Fetch users (for admin only)
      let allUsers: any[] = [];
      if (user?.role === 'admin') {
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
        if (user?.role === 'user') {
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
        if (user?.role === 'admin') {
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
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'aceite_admin': return 'bg-blue-100 text-blue-800';
      case 'delegado': return 'bg-purple-100 text-purple-800';
      case 'agendado': return 'bg-green-100 text-green-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'revisada': return 'bg-blue-100 text-blue-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
          {user?.role === 'user' 
            ? 'Visão geral das suas solicitações'
            : 'Visão geral do sistema de gestão'
          }
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatsCard
          title={user?.role === 'user' ? 'Minhas Apresentações' : 'Total de Apresentações'}
          value={stats.totalPresentations.toString()}
          description={`${stats.pendingPresentations} pendentes de análise`}
          icon={FileText}
        />
        <StatsCard
          title={user?.role === 'user' ? 'Minhas Audiências' : 'Total de Audiências'}
          value={stats.totalAudiences.toString()}
          description={`${stats.pendingAudiences} aguardando confirmação`}
          icon={Users}
        />
        <StatsCard
          title="Apresentações Agendadas"
          value={stats.scheduledPresentations.toString()}
          description="Cartas com reunião marcada"
          icon={CheckCircle}
        />
        <StatsCard
          title="Audiências Agendadas"
          value={stats.scheduledAudiences.toString()}
          description="Pedidos com reunião marcada"
          icon={Calendar}
        />
        <StatsCard
          title="Total de Reuniões"
          value={stats.scheduledMeetings.toString()}
          description="Soma de todos os agendamentos"
          icon={Calendar}
        />
        <StatsCard
          title="Taxa de Aprovação"
          value={`${stats.approvalRate}%`}
          description={user?.role === 'user' ? 'Das suas solicitações' : 'Solicitações aprovadas'}
          icon={CheckCircle}
        />
      </div>

      {/* ======================= MÓDULOS DO SISTEMA ======================= */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Módulos do Sistema</h2>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {/* Ofícios */}
          <ModuleCard
            title="Ofícios"
            value={modulesStats.oficios.total}
            icon={FileSignature}
            color="blue"
            onClick={() => onTabChange?.('oficios')}
          />
          
          {/* Comunicações Internas */}
          <ModuleCard
            title="Comunicações"
            value={modulesStats.comunicacoes.total}
            icon={MessageSquare}
            color="purple"
            onClick={() => onTabChange?.('comunicacoes')}
          />
          
          {/* Actas */}
          <ModuleCard
            title="Actas"
            value={modulesStats.actas.total}
            icon={FileText}
            color="cyan"
            onClick={() => onTabChange?.('actas')}
          />
          
          {/* Reuniões Internas */}
          <ModuleCard
            title="Reuniões"
            value={modulesStats.reunioes.proximas}
            icon={Video}
            color="green"
            onClick={() => onTabChange?.('internal-meetings')}
          />
          
          {/* Frotas */}
          <ModuleCard
            title="Frotas"
            value={modulesStats.frotas.totalVeiculos}
            icon={Car}
            color="orange"
            onClick={() => onTabChange?.('frotas')}
          />
          
          {/* Facturas */}
          <ModuleCard
            title="Facturas"
            value={facturasStats.total}
            icon={Briefcase}
            color="pink"
            onClick={() => onTabChange?.('facturas')}
          />
          
          {/* Contratos */}
          <ModuleCard
            title="Contratos"
            value="0"
            icon={FileCheck}
            color="yellow"
            onClick={() => onTabChange?.('contratos')}
          />

          {/* Pedidos e Helpdesk */}
          <ModuleCard
            title="Helpdesk"
            value="0"
            icon={ClipboardList}
            color="blue"
            onClick={() => onTabChange?.('pedidos')}
          />

          {/* Compras e Fornecedores */}
          <ModuleCard
            title="Compras"
            value="0"
            icon={ShoppingCart}
            color="green"
            onClick={() => onTabChange?.('compras')}
          />

          {/* Planeamento */}
          <ModuleCard
            title="Planeamento"
            value="0"
            icon={TrendingUp}
            color="gray"
            onClick={() => onTabChange?.('planejamento')}
          />

          {/* Reclamações */}
          <ModuleCard
            title="Reclamações"
            value="0"
            icon={AlertTriangle}
            color="red"
            onClick={() => onTabChange?.('reclamacoes')}
          />

          {/* Pedidos de Viatura */}
          <ModuleCard
            title="Viaturas"
            value={modulesStats.frotas.pedidosPendentes}
            icon={Clock}
            color="yellow"
            onClick={() => onTabChange?.('frotas')}
          />
        </div>
      </div>

      {/* Alerta de Atendentes Pendentes (apenas para admin) */}
      {user?.role === 'admin' && stats.pendingAttendants > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-orange-900">
                    {stats.pendingAttendants} {stats.pendingAttendants === 1 ? 'Atendente Aguardando' : 'Atendentes Aguardando'} Aprovação
                  </CardTitle>
                  <CardDescription className="text-orange-700">
                    {stats.pendingAttendants === 1 ? 'Um novo atendente se registrou' : 'Novos atendentes se registraram'} e precisa{stats.pendingAttendants === 1 ? '' : 'm'} de aprovação para acessar o sistema
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => window.location.href = '#/admin/users'}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Revisar Agora
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAttendants.slice(0, 3).map((attendant) => (
                <div key={attendant.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100">
                      <Users className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{attendant.name}</p>
                      <p className="text-xs text-muted-foreground">{attendant.email}</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800">Pendente</Badge>
                </div>
              ))}
              {stats.pendingAttendants > 3 && (
                <p className="text-sm text-orange-700 text-center pt-2">
                  + {stats.pendingAttendants - 3} {stats.pendingAttendants - 3 === 1 ? 'outro atendente' : 'outros atendentes'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🛒 Alerta de Faturas Pendentes (Departamento de Compras) */}
      {user?.role === 'compras' && facturasStats.pendentes > 0 && (
        <Card className="border-cyan-200 bg-cyan-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-100">
                  <FileText className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <CardTitle className="text-cyan-900">
                    🛒 {facturasStats.pendentes} {facturasStats.pendentes === 1 ? 'Fatura Pendente' : 'Faturas Pendentes'} de Fornecedores
                  </CardTitle>
                  <CardDescription className="text-cyan-700">
                    {facturasStats.pendentes === 1 ? 'Um fornecedor cadastrou' : 'Fornecedores cadastraram'} {facturasStats.pendentes === 1 ? 'uma nova fatura' : 'novas faturas'} que precisam de revisão
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => {
                  const facturasTab = document.querySelector('[data-tab="facturas"]') as HTMLElement;
                  if (facturasTab) facturasTab.click();
                }}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
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
                  <div key={factura.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-cyan-200">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-100">
                        <FileText className="h-4 w-4 text-cyan-600" />
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
                    <Badge className="bg-yellow-100 text-yellow-800">
                      {factura.status === 'pendente' ? 'Nova' : 'Em Validação'}
                    </Badge>
                  </div>
                ))}
              {facturasStats.pendentes > 3 && (
                <p className="text-sm text-cyan-700 text-center pt-2">
                  + {facturasStats.pendentes - 3} {facturasStats.pendentes - 3 === 1 ? 'outra fatura' : 'outras faturas'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === 'user' ? 'Minhas Solicitações Recentes' : 'Solicitações Recentes'}
            </CardTitle>
            <CardDescription>
              {user?.role === 'user' ? 'Suas últimas submissões' : 'Últimas submissões no sistema'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {user?.role === 'user' 
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
              {user?.role === 'user' ? 'Minhas Próximas Reuniões' : 'Próximas Audiências'}
            </CardTitle>
            <CardDescription>
              {user?.role === 'user' ? 'Suas reuniões confirmadas' : 'Reuniões confirmadas'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.filter(r => r.status === 'agendado').length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {user?.role === 'user'
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
                        <Badge className="bg-green-100 text-green-800">Confirmado</Badge>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}