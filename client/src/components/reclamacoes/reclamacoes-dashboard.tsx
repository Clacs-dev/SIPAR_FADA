import { 
  AlertTriangle,
  Clock,
  CheckCircle,
  Package,
  XCircle,
  Users,
  Loader2
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";

interface ReclamacoesDashboardProps {
  stats?: {
    total: number;
    pendentes: number;
    em_analise: number;
    resolvidas: number;
    rejeitadas: number;
  };
  loading?: boolean;
}

export function ReclamacoesDashboard({ stats, loading }: ReclamacoesDashboardProps) {
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
      label: "Total de Reclamações",
      value: stats.total,
      icon: AlertTriangle,
      color: 'red' as const,
    },
    {
      label: "Pendentes",
      value: stats.pendentes,
      icon: Clock,
      color: 'yellow' as const,
    },
    {
      label: "Em Análise",
      value: stats.em_analise,
      icon: Package,
      color: 'blue' as const,
    },
    {
      label: "Resolvidas",
      value: stats.resolvidas,
      icon: CheckCircle,
      color: 'green' as const,
    },
    {
      label: "Rejeitadas",
      value: stats.rejeitadas,
      icon: XCircle,
      color: 'gray' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Gestão de Reclamações" stats={statsData} />
    </div>
  );
}
