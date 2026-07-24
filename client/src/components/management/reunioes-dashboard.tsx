import { 
  Video,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  Loader2
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";

interface ReunioesDashboardProps {
  stats?: {
    total: number;
    proximas: number;
    emAndamento: number;
    concluidas: number;
    online: number;
  };
  loading?: boolean;
}

export function ReunioesDashboard({ stats, loading }: ReunioesDashboardProps) {
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
      label: "Total de Reuniões",
      value: stats.total,
      icon: Video,
      color: 'green' as const,
    },
    {
      label: "Próximas",
      value: stats.proximas,
      icon: Calendar,
      color: 'blue' as const,
    },
    {
      label: "Em Andamento",
      value: stats.emAndamento,
      icon: Clock,
      color: 'orange' as const,
    },
    {
      label: "Concluídas",
      value: stats.concluidas,
      icon: CheckCircle,
      color: 'purple' as const,
    },
    {
      label: "Online",
      value: stats.online,
      icon: Users,
      color: 'cyan' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Reuniões Internas" stats={statsData} />
    </div>
  );
}
