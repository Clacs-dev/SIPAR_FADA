import { 
  ClipboardList,
  Clock,
  CheckCircle,
  Package,
  AlertCircle,
  Users,
  Loader2
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";

interface HelpdeskDashboardProps {
  stats?: {
    total: number;
    abertos: number;
    em_andamento: number;
    resolvidos: number;
    urgentes: number;
  };
  loading?: boolean;
}

export function HelpdeskDashboard({ stats, loading }: HelpdeskDashboardProps) {
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
      label: "Total de Pedidos",
      value: stats.total,
      icon: ClipboardList,
      color: 'blue' as const,
    },
    {
      label: "Abertos",
      value: stats.abertos,
      icon: Clock,
      color: 'yellow' as const,
    },
    {
      label: "Em Andamento",
      value: stats.em_andamento,
      icon: Package,
      color: 'purple' as const,
    },
    {
      label: "Resolvidos",
      value: stats.resolvidos,
      icon: CheckCircle,
      color: 'green' as const,
    },
    {
      label: "Urgentes",
      value: stats.urgentes,
      icon: AlertCircle,
      color: 'red' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Pedidos & Helpdesk" stats={statsData} />
    </div>
  );
}
