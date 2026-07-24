import { 
  FileSignature, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Archive,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  FileText,
  Package
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";
import { OficioStats } from "./types";

interface OficiosDashboardProps {
  stats: OficioStats | null;
  loading?: boolean;
}

export function OficiosDashboard({ stats, loading }: OficiosDashboardProps) {
  // Se está carregando ou stats é null, mostrar skeleton
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
      label: "Ofícios registados",
      value: stats.total,
      icon: FileSignature,
      color: 'purple' as const,
    },
    {
      label: "Aguardam despacho",
      value: stats.pendentes,
      icon: Clock,
      color: 'blue' as const,
    },
    {
      label: "Em processo",
      value: stats.emProcesso || 0,
      icon: Package,
      color: 'gray' as const,
    },
    {
      label: "Ofícios recebidos",
      value: stats.entrada,
      icon: ArrowDownCircle,
      color: 'green' as const,
    },
    {
      label: "Ofícios enviados",
      value: stats.saida,
      icon: ArrowUpCircle,
      color: 'orange' as const,
    },
    {
      label: "Prazo vencido",
      value: 0,
      icon: AlertCircle,
      color: 'red' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Gestão de Ofícios" stats={statsData} />
    </div>
  );
}