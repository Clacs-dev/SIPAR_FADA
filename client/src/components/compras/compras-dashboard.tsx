import { 
  ShoppingCart,
  Clock,
  CheckCircle,
  Package,
  TrendingUp,
  DollarSign,
  Loader2
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";

interface ComprasDashboardProps {
  stats?: {
    total: number;
    em_processo: number;
    aprovadas: number;
    concluidas: number;
    valor_total: number;
  };
  loading?: boolean;
}

export function ComprasDashboard({ stats, loading }: ComprasDashboardProps) {
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
      label: "Total de Compras",
      value: stats.total,
      icon: ShoppingCart,
      color: 'green' as const,
    },
    {
      label: "Em Processo",
      value: stats.em_processo,
      icon: Clock,
      color: 'yellow' as const,
    },
    {
      label: "Aprovadas",
      value: stats.aprovadas,
      icon: CheckCircle,
      color: 'blue' as const,
    },
    {
      label: "Concluídas",
      value: stats.concluidas,
      icon: Package,
      color: 'purple' as const,
    },
    {
      label: "Valor Total",
      value: formatCurrency(stats.valor_total),
      icon: DollarSign,
      color: 'cyan' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Compras & Fornecedores" stats={statsData} />
    </div>
  );
}
