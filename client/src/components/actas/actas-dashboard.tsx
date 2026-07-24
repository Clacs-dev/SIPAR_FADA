import { 
  FileText, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  TrendingUp,
  Archive,
  Package
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ActaStats } from "./types";

interface ActasDashboardProps {
  stats: ActaStats;
}

export function ActasDashboard({ stats }: ActasDashboardProps) {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-PT').format(value);
  };

  const statsData = [
    {
      label: "Actas registadas",
      value: stats.total_actas,
      icon: FileText,
      color: 'cyan' as const,
    },
    {
      label: "Em elaboração",
      value: stats.rascunhos,
      icon: Clock,
      color: 'blue' as const,
    },
    {
      label: "Aguardam revisão",
      value: stats.pendentes_aprovacao,
      icon: AlertTriangle,
      color: 'yellow' as const,
    },
    {
      label: "Finalizadas",
      value: stats.aprovadas,
      icon: CheckCircle,
      color: 'green' as const,
    },
    {
      label: "Reuniões este mês",
      value: stats.reunioes_mes,
      icon: Calendar,
      color: 'purple' as const,
    },
    {
      label: "Participantes médio",
      value: stats.participantes_medio,
      icon: Users,
      color: 'orange' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Gestão de Actas" stats={statsData} />

      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reuniões (Mês)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reunioes_mes}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Part. Médio</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.participantes_medio}</div>
            <p className="text-xs text-muted-foreground">
              Participantes por reunião
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quórum Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.quorum_medio}%</div>
            <p className="text-xs text-muted-foreground">
              Taxa de presença
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Decisões e Tarefas */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Decisões e Tarefas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span className="text-sm">Total</span>
              </div>
              <span className="text-sm font-bold">{stats.decisoes_total}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-sm">Pendentes</span>
              </div>
              <span className="text-sm font-bold">{stats.decisoes_pendentes}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-purple-500" />
                <span className="text-sm">Em Andamento</span>
              </div>
              <span className="text-sm font-bold">{stats.decisoes_em_andamento}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-sm">Concluídas</span>
              </div>
              <span className="text-sm font-bold">{stats.decisoes_concluidas}</span>
            </div>
            {stats.decisoes_atrasadas > 0 && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-600 font-medium">Atrasadas</span>
                </div>
                <span className="text-sm font-bold text-red-600">{stats.decisoes_atrasadas}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reuniões por Tipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.por_tipo.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-4 w-4" />
                  </div>
                  <span className="text-sm capitalize">{item.tipo.replace('_', ' ')}</span>
                </div>
                <span className="text-sm font-bold">{item.quantidade}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Tarefas Urgentes */}
      {stats.tarefas_urgentes && stats.tarefas_urgentes.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Tarefas Urgentes ({stats.tarefas_urgentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.tarefas_urgentes.slice(0, 5).map((tarefa) => (
                <div key={tarefa.id} className="p-3 bg-white border border-red-200 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm font-medium">{tarefa.descricao}</p>
                    <Badge className="bg-red-500 text-white">Urgente</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {tarefa.responsavel_nome && (
                      <span>👤 {tarefa.responsavel_nome}</span>
                    )}
                    {tarefa.prazo && (
                      <span>📅 {new Date(tarefa.prazo).toLocaleDateString('pt-PT')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximas Reuniões */}
      {stats.proximas_reunioes && stats.proximas_reunioes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Próximas Reuniões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.proximas_reunioes.map((reuniao, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{reuniao.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(reuniao.data).toLocaleDateString('pt-PT')} • {reuniao.participantes} participantes
                    </p>
                  </div>
                  <Badge variant="outline">Agendada</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}