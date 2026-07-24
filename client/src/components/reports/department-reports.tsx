/**
 * RELATÓRIOS DEPARTAMENTAIS
 * 
 * Sistema de geração e exportação de relatórios por departamento
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Download,
  FileText,
  TrendingUp,
  Calendar,
  Filter,
  BarChart3,
  FileSpreadsheet
} from "lucide-react";
import {
  getDepartmentById,
  getDepartmentName,
  getGroupedDepartmentOptions,
  DEPARTMENTS
} from "../admin/departments";
import { DepartmentFilter, CategoryFilter } from "../common/department-filter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface DepartmentReport {
  department_id: string;
  department_name: string;
  period: string;
  metrics: {
    total_users: number;
    active_users: number;
    facturas_count: number;
    facturas_value: number;
    oficios_count: number;
    actas_count: number;
    meetings_count: number;
    avg_approval_time: number; // em horas
    pending_approvals: number;
  };
  trend: {
    users: number; // % de mudança
    facturas: number;
    oficios: number;
  };
}

export function DepartmentReports() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportType, setReportType] = useState('summary');
  const [loading, setLoading] = useState(false);

  // Dados mockados - em produção, buscar do backend
  const mockReports: DepartmentReport[] = [
    {
      department_id: 'financeiro',
      department_name: 'Financeiro',
      period: '2026-01',
      metrics: {
        total_users: 8,
        active_users: 8,
        facturas_count: 127,
        facturas_value: 15678450.00,
        oficios_count: 45,
        actas_count: 12,
        meetings_count: 8,
        avg_approval_time: 24.5,
        pending_approvals: 5
      },
      trend: {
        users: 0,
        facturas: 12.5,
        oficios: 8.3
      }
    },
    {
      department_id: 'recursos_humanos',
      department_name: 'Recursos Humanos',
      period: '2026-01',
      metrics: {
        total_users: 6,
        active_users: 6,
        facturas_count: 23,
        facturas_value: 2340000.00,
        oficios_count: 89,
        actas_count: 8,
        meetings_count: 12,
        avg_approval_time: 18.2,
        pending_approvals: 3
      },
      trend: {
        users: 0,
        facturas: 5.2,
        oficios: 15.7
      }
    },
    {
      department_id: 'juridico',
      department_name: 'Jurídico',
      period: '2026-01',
      metrics: {
        total_users: 5,
        active_users: 5,
        facturas_count: 12,
        facturas_value: 890000.00,
        oficios_count: 156,
        actas_count: 6,
        meetings_count: 10,
        avg_approval_time: 36.8,
        pending_approvals: 8
      },
      trend: {
        users: 0,
        facturas: -3.1,
        oficios: 22.4
      }
    }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const exportToCSV = (data: DepartmentReport[]) => {
    const headers = [
      'Departamento',
      'Utilizadores Totais',
      'Utilizadores Activos',
      'Facturas',
      'Valor Facturas (AOA)',
      'Ofícios',
      'Actas',
      'Reuniões',
      'Tempo Médio Aprovação (h)',
      'Aprovações Pendentes'
    ];

    const rows = data.map(report => [
      report.department_name,
      report.metrics.total_users,
      report.metrics.active_users,
      report.metrics.facturas_count,
      report.metrics.facturas_value,
      report.metrics.oficios_count,
      report.metrics.actas_count,
      report.metrics.meetings_count,
      report.metrics.avg_approval_time.toFixed(1),
      report.metrics.pending_approvals
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_departamental_${selectedPeriod}_${Date.now()}.csv`;
    link.click();
  };

  const exportToExcel = () => {
    alert('Exportação para Excel será implementada em breve!');
  };

  const exportToPDF = () => {
    alert('Exportação para PDF será implementada em breve!');
  };

  const getTrendBadge = (value: number) => {
    if (value > 0) {
      return (
        <Badge className="bg-green-500 text-white">
          ↑ {value.toFixed(1)}%
        </Badge>
      );
    } else if (value < 0) {
      return (
        <Badge className="bg-red-500 text-white">
          ↓ {Math.abs(value).toFixed(1)}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        → 0%
      </Badge>
    );
  };

  const filteredReports = selectedDepartment === 'all' 
    ? mockReports 
    : mockReports.filter(r => r.department_id === selectedDepartment);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <FileText className="h-6 w-6" />
            Relatórios Departamentais
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise de desempenho e KPIs por departamento
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Período
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <DepartmentFilter
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                showCategoryBadge={false}
                placeholder="Selecione o departamento"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mês</SelectItem>
                  <SelectItem value="quarter">Último Trimestre</SelectItem>
                  <SelectItem value="year">Último Ano</SelectItem>
                  <SelectItem value="custom">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Sumário Executivo</SelectItem>
                  <SelectItem value="detailed">Detalhado</SelectItem>
                  <SelectItem value="comparative">Comparativo</SelectItem>
                  <SelectItem value="trends">Tendências</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões de Exportação */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => exportToCSV(filteredReports)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button
              variant="outline"
              onClick={exportToExcel}
            >
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
            <Button
              variant="outline"
              onClick={exportToPDF}
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Relatórios */}
      <Tabs value={reportType} onValueChange={setReportType}>
        <TabsList>
          <TabsTrigger value="summary">
            <BarChart3 className="mr-2 h-4 w-4" />
            Sumário
          </TabsTrigger>
          <TabsTrigger value="detailed">
            <FileText className="mr-2 h-4 w-4" />
            Detalhado
          </TabsTrigger>
          <TabsTrigger value="comparative">
            <TrendingUp className="mr-2 h-4 w-4" />
            Comparativo
          </TabsTrigger>
        </TabsList>

        {/* Sumário Executivo */}
        <TabsContent value="summary" className="space-y-4">
          {filteredReports.map((report) => {
            const dept = getDepartmentById(report.department_id);
            const Icon = dept?.icon;
            return (
              <Card key={report.department_id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {Icon && (
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-6 w-6" />
                        </div>
                      )}
                      <div>
                        <CardTitle>{report.department_name}</CardTitle>
                        <CardDescription>
                          Relatório do período: {selectedPeriod === 'month' ? 'Janeiro 2026' : selectedPeriod}
                        </CardDescription>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    {/* Utilizadores */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Utilizadores</p>
                        {getTrendBadge(report.trend.users)}
                      </div>
                      <p className="text-2xl font-bold">{report.metrics.active_users}</p>
                      <p className="text-xs text-muted-foreground">
                        de {report.metrics.total_users} total
                      </p>
                    </div>

                    {/* Facturas */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Facturas</p>
                        {getTrendBadge(report.trend.facturas)}
                      </div>
                      <p className="text-2xl font-bold">{report.metrics.facturas_count}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(report.metrics.facturas_value)}
                      </p>
                    </div>

                    {/* Ofícios */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Ofícios</p>
                        {getTrendBadge(report.trend.oficios)}
                      </div>
                      <p className="text-2xl font-bold">{report.metrics.oficios_count}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.metrics.actas_count} actas
                      </p>
                    </div>

                    {/* Aprovações */}
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">Aprovações</p>
                      </div>
                      <p className="text-2xl font-bold text-orange-600">
                        {report.metrics.pending_approvals}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ~{report.metrics.avg_approval_time.toFixed(1)}h médio
                      </p>
                    </div>
                  </div>

                  {/* Métricas Adicionais */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Reuniões:</span>
                        <span className="font-medium">{report.metrics.meetings_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de Actividade:</span>
                        <span className="font-medium">
                          {((report.metrics.active_users / report.metrics.total_users) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Relatório Detalhado */}
        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada</CardTitle>
              <CardDescription>
                Métricas completas e análise profunda por departamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredReports.map((report) => (
                  <div key={report.department_id} className="pb-6 border-b last:border-0">
                    <h3 className="text-lg font-semibold mb-4">{report.department_name}</h3>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Recursos Humanos */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recursos Humanos</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total:</span>
                            <span>{report.metrics.total_users}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Activos:</span>
                            <span>{report.metrics.active_users}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxa:</span>
                            <span>{((report.metrics.active_users / report.metrics.total_users) * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Documentos */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Documentos</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Facturas:</span>
                            <span>{report.metrics.facturas_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Ofícios:</span>
                            <span>{report.metrics.oficios_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Actas:</span>
                            <span>{report.metrics.actas_count}</span>
                          </div>
                        </div>
                      </div>

                      {/* Performance */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Performance</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Aprovação:</span>
                            <span>{report.metrics.avg_approval_time.toFixed(1)}h</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pendentes:</span>
                            <span className="text-orange-600">{report.metrics.pending_approvals}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reuniões:</span>
                            <span>{report.metrics.meetings_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Análise Comparativa */}
        <TabsContent value="comparative" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise Comparativa</CardTitle>
              <CardDescription>
                Comparação de performance entre departamentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Comparação de Facturas */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Volume de Facturas</h3>
                  <div className="space-y-2">
                    {filteredReports
                      .sort((a, b) => b.metrics.facturas_count - a.metrics.facturas_count)
                      .map((report) => {
                        const maxFacturas = Math.max(...filteredReports.map(r => r.metrics.facturas_count));
                        const percentage = (report.metrics.facturas_count / maxFacturas) * 100;
                        
                        return (
                          <div key={report.department_id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{report.department_name}</span>
                              <span className="font-medium">{report.metrics.facturas_count}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary rounded-full h-2 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Comparação de Valor */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Valor Total de Facturas</h3>
                  <div className="space-y-2">
                    {filteredReports
                      .sort((a, b) => b.metrics.facturas_value - a.metrics.facturas_value)
                      .map((report) => {
                        const maxValue = Math.max(...filteredReports.map(r => r.metrics.facturas_value));
                        const percentage = (report.metrics.facturas_value / maxValue) * 100;
                        
                        return (
                          <div key={report.department_id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{report.department_name}</span>
                              <span className="font-medium">{formatCurrency(report.metrics.facturas_value)}</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-green-500 rounded-full h-2 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Tempo de Aprovação */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Tempo Médio de Aprovação (horas)</h3>
                  <div className="space-y-2">
                    {filteredReports
                      .sort((a, b) => a.metrics.avg_approval_time - b.metrics.avg_approval_time)
                      .map((report) => {
                        const maxTime = Math.max(...filteredReports.map(r => r.metrics.avg_approval_time));
                        const percentage = (report.metrics.avg_approval_time / maxTime) * 100;
                        
                        return (
                          <div key={report.department_id} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span>{report.department_name}</span>
                              <span className="font-medium">{report.metrics.avg_approval_time.toFixed(1)}h</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-orange-500 rounded-full h-2 transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}