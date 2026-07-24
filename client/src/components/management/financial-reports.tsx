import { TrendingUp, DollarSign, TrendingDown, Download, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export function FinancialReports() {
  const currentMonth = {
    revenue: 750000,
    expenses: 420000,
    balance: 330000,
  };

  const lastMonth = {
    revenue: 680000,
    expenses: 450000,
    balance: 230000,
  };

  const calculateGrowth = (current: number, previous: number) => {
    const growth = ((current - previous) / previous) * 100;
    return growth.toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Relatórios Financeiros
          </h1>
          <p className="text-muted-foreground">
            Análises e indicadores financeiros
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Período */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">Período: Janeiro 2026</p>
              <p className="text-sm text-muted-foreground">
                Comparação com Dezembro 2025
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicadores Principais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {currentMonth.revenue.toLocaleString("pt-PT")} AOA
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mês anterior: {lastMonth.revenue.toLocaleString("pt-PT")} AOA
            </p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">
                +{calculateGrowth(currentMonth.revenue, lastMonth.revenue)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {currentMonth.expenses.toLocaleString("pt-PT")} AOA
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mês anterior: {lastMonth.expenses.toLocaleString("pt-PT")} AOA
            </p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">
                {calculateGrowth(currentMonth.expenses, lastMonth.expenses)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              +{currentMonth.balance.toLocaleString("pt-PT")} AOA
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mês anterior: +{lastMonth.balance.toLocaleString("pt-PT")} AOA
            </p>
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">
                +{calculateGrowth(currentMonth.balance, lastMonth.balance)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Detalhada - Janeiro 2026</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Receitas por Categoria */}
            <div>
              <h3 className="font-medium mb-3">Receitas por Categoria</h3>
              <div className="space-y-2">
                {[
                  { category: "Serviços de Consultoria", amount: 450000, percentage: 60 },
                  { category: "Licenciamentos", amount: 180000, percentage: 24 },
                  { category: "Outros Serviços", amount: 120000, percentage: 16 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{item.category}</span>
                        <span className="text-sm font-medium">
                          {item.amount.toLocaleString("pt-PT")} AOA
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Despesas por Categoria */}
            <div>
              <h3 className="font-medium mb-3">Despesas por Categoria</h3>
              <div className="space-y-2">
                {[
                  { category: "Recursos Humanos", amount: 250000, percentage: 60 },
                  { category: "Operacionais", amount: 100000, percentage: 24 },
                  { category: "Manutenção", amount: 70000, percentage: 16 },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{item.category}</span>
                        <span className="text-sm font-medium">
                          {item.amount.toLocaleString("pt-PT")} AOA
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium mb-2">Observações</h3>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ Crescimento de receitas em relação ao mês anterior (+10,3%)</li>
                <li>✓ Redução de despesas operacionais (-6,7%)</li>
                <li>✓ Melhoria significativa no saldo mensal (+43,5%)</li>
                <li>✓ Projeção positiva para o próximo trimestre</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
