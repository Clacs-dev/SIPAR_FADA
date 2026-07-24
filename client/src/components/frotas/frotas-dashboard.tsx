import { 
  Car, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Fuel,
  Wrench,
  DollarSign,
  MapPin
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { FrotaStats } from "./types";

interface FrotasDashboardProps {
  stats: FrotaStats;
}

export function FrotasDashboard({ stats }: FrotasDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-PT').format(value);
  };

  const statsData = [
    {
      label: "Viaturas registadas",
      value: stats.total_viaturas,
      icon: Car,
      color: 'orange' as const,
    },
    {
      label: "Prontas para uso",
      value: stats.disponiveis,
      icon: CheckCircle,
      color: 'green' as const,
    },
    {
      label: "Em circulação",
      value: stats.em_uso,
      icon: MapPin,
      color: 'blue' as const,
    },
    {
      label: "Na oficina",
      value: stats.em_manutencao,
      icon: Wrench,
      color: 'yellow' as const,
    },
    {
      label: "Fora de serviço",
      value: stats.inativas,
      icon: XCircle,
      color: 'gray' as const,
    },
    {
      label: "KM este mês",
      value: formatNumber(stats.km_total_mensal),
      icon: TrendingUp,
      color: 'purple' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Gestão de Frotas" stats={statsData} />
    </div>
  );
}