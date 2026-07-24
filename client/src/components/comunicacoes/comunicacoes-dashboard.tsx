import { 
  MessageSquare,
  Clock,
  Send,
  AlertCircle,
  Loader2,
  Package,
  FileText
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";

interface ComunicacoesStats {
  total: number;
  pendentes: number;
  enviadas: number;
  comDespacho: number;
  urgentes: number;
}

interface ComunicacoesDashboardProps {
  stats: ComunicacoesStats | null;
  loading?: boolean;
}

export function ComunicacoesDashboard({ stats, loading }: ComunicacoesDashboardProps) {
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
      label: "Total de Comunicações",
      value: stats.total,
      icon: MessageSquare,
      color: 'purple' as const,
    },
    {
      label: "Pendentes",
      value: stats.pendentes,
      icon: Clock,
      color: 'blue' as const,
    },
    {
      label: "Pendentes",
      value: stats.pendentes,
      icon: Package,
      color: 'gray' as const,
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
      <ModuleStatsRow title="Comunicações Internas" stats={statsData} />
    </div>
  );
}
