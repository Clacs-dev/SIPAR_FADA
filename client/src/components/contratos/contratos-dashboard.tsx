import { 
  FileCheck,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  TrendingUp,
  Loader2
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";

interface ContratosDashboardProps {
  stats?: {
    total: number;
    ativos: number;
    a_vencer: number;
    vencidos: number;
    renovacoes_mes: number;
  };
  loading?: boolean;
}

export function ContratosDashboard({ stats, loading }: ContratosDashboardProps) {
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

  const statsData = [
    {
      label: "Total de Contratos",
      value: stats.total,
      icon: FileCheck,
      color: 'yellow' as const,
    },
    {
      label: "Contratos Ativos",
      value: stats.ativos,
      icon: CheckCircle,
      color: 'green' as const,
    },
    {
      label: "A vencer (30 dias)",
      value: stats.a_vencer,
      icon: Clock,
      color: 'orange' as const,
    },
    {
      label: "Vencidos",
      value: stats.vencidos,
      icon: AlertTriangle,
      color: 'red' as const,
    },
    {
      label: "Renovações este mês",
      value: stats.renovacoes_mes,
      icon: Calendar,
      color: 'blue' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Gestão de Contratos" stats={statsData} />
    </div>
  );
}
