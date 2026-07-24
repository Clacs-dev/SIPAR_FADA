import { 
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Target,
  Loader2
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";

interface PlaneamentoDashboardProps {
  stats?: {
    total_projetos: number;
    em_andamento: number;
    concluidos: number;
    atrasados: number;
    orcamento_total: number;
  };
  loading?: boolean;
}

export function PlaneamentoDashboard({ stats, loading }: PlaneamentoDashboardProps) {
  if (loading || !stats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando dados...</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const statsData = [
    {
      label: "Total de Projetos",
      value: stats.total_projetos,
      icon: Target,
      color: 'gray' as const,
    },
    {
      label: "Em Andamento",
      value: stats.em_andamento,
      icon: Clock,
      color: 'blue' as const,
    },
    {
      label: "Concluídos",
      value: stats.concluidos,
      icon: CheckCircle,
      color: 'green' as const,
    },
    {
      label: "Atrasados",
      value: stats.atrasados,
      icon: AlertCircle,
      color: 'red' as const,
    },
    {
      label: "Orçamento Total",
      value: formatCurrency(stats.orcamento_total),
      icon: TrendingUp,
      color: 'purple' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Planeamento Estratégico" stats={statsData} />
    </div>
  );
}
