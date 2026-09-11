import { 
  Receipt, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  DollarSign,
  Calendar,
  TrendingDown,
  FileText,
  Building2,
  CreditCard,
  Banknote,
  CircleDollarSign
} from "lucide-react";
import { ModuleStatsRow } from "../dashboard/module-stats-row";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FacturaStats } from "./types";

interface FacturasDashboardProps {
  stats: FacturaStats;
  moeda?: string;
}

export function FacturasDashboard({ stats, moeda = 'AOA' }: FacturasDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: moeda,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const percentagePago = stats.total_valor > 0 
    ? ((stats.total_pago / stats.total_valor) * 100).toFixed(1) 
    : '0';

  const statsData = [
    {
      label: "Aguardam validação",
      value: stats.registadas,
      icon: FileText,
      color: 'blue' as const,
    },
    {
      label: "Em análise",
      value: stats.em_validacao,
      icon: TrendingUp,
      color: 'purple' as const,
    },
    {
      label: "Prontas para pagar",
      value: stats.aprovadas,
      icon: CheckCircle,
      color: 'green' as const,
    },
    {
      label: "Pagas",
      value: stats.pagas,
      icon: CircleDollarSign,
      color: 'cyan' as const,
    },
    {
      label: "Rejeitadas",
      value: stats.rejeitadas,
      icon: XCircle,
      color: 'red' as const,
    },
    {
      label: "Vencidas",
      value: stats.vencidas,
      icon: AlertCircle,
      color: 'orange' as const,
    },
  ];

  return (
    <div className="space-y-6">
      <ModuleStatsRow title="Dashboard Financeiro" stats={statsData} />

      {/* Cards Financeiros Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Facturas</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_facturas}</div>
            <p className="text-xs text-muted-foreground">
              Facturas registadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.total_valor)}</div>
            <p className="text-xs text-muted-foreground">
              Montante total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4" style={{ color: 'var(--tone-success)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--tone-success)' }}>
              {formatCurrency(stats.total_pago)}
            </div>
            <p className="text-xs text-muted-foreground">
              {percentagePago}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4" style={{ color: 'var(--tone-warn)' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'var(--tone-warn)' }}>
              {formatCurrency(stats.total_pendente)}
            </div>
            <p className="text-xs text-muted-foreground">
              A pagar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <div className="grid gap-4 md:grid-cols-2">
        {stats.vencidas > 0 && (
          <Card style={{ borderColor: 'var(--tone-danger)', backgroundColor: 'var(--tone-danger-soft)' }}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--tone-danger)' }}>
                <AlertCircle className="h-4 w-4" />
                Facturas Vencidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm" style={{ color: 'var(--tone-danger)' }}>
                <span className="text-2xl font-bold">{stats.vencidas}</span> factura(s)
                com data de vencimento ultrapassada. Processe os pagamentos urgentemente.
              </p>
            </CardContent>
          </Card>
        )}

        {stats.a_vencer_30dias > 0 && (
          <Card style={{ borderColor: 'var(--tone-warn)', backgroundColor: 'var(--tone-warn-soft)' }}>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2" style={{ color: 'var(--tone-warn)' }}>
                <Calendar className="h-4 w-4" />
                A Vencer (30 dias)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm" style={{ color: 'var(--tone-warn)' }}>
                <span className="text-2xl font-bold">{stats.a_vencer_30dias}</span> factura(s)
                vencem nos próximos 30 dias. Planifique os pagamentos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Fornecedores */}
      {stats.por_fornecedor && stats.por_fornecedor.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Top Fornecedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.por_fornecedor.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.fornecedor_nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.total} factura(s)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(item.valor)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}