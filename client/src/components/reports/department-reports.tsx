/**
 * RELATÓRIOS DEPARTAMENTAIS
 *
 * Estatísticas reais por departamento (utilizadores, facturas, compras,
 * actas, comunicações, reuniões), obtidas de GET /departments/stats.
 */

import { useState, useEffect } from "react";
import { previewDocument } from "../ui/document-preview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Download,
  FileText,
  TrendingUp,
  Filter,
  BarChart3,
  FileSpreadsheet,
  Loader2
} from "lucide-react";
import { getDepartmentIcon } from "../admin/departments";
import { DepartmentFilter } from "../common/department-filter";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { toast } from "sonner@2.0.3";

interface DepartmentStatRow {
  department_id: string;
  department_slug: string;
  department_nome: string;
  categoria: string;
  total_users: number;
  active_users: number;
  facturas_count: number;
  facturas_value: number;
  procurements_count: number;
  actas_count: number;
  comunicacoes_count: number;
  meetings_count: number;
  pending_count: number;
}

export function DepartmentReports() {
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [reportType, setReportType] = useState('summary');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DepartmentStatRow[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/departments/stats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erro ao carregar estatísticas departamentais');
      const result = await response.json();
      setRows(result.stats || []);
    } catch (error) {
 console.error('Erro ao carregar relatórios departamentais:', error);
      toast.error('Erro ao carregar relatórios departamentais');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const exportToCSV = (data: DepartmentStatRow[]) => {
    const headers = [
      'Departamento', 'Utilizadores Totais', 'Utilizadores Activos',
      'Facturas', 'Valor Facturas (AOA)', 'Pedidos de Compra', 'Actas',
      'Comunicações', 'Reuniões', 'Pendências'
    ];

    const csvRows = data.map((row) => [
      row.department_nome, row.total_users, row.active_users,
      row.facturas_count, row.facturas_value, row.procurements_count,
      row.actas_count, row.comunicacoes_count, row.meetings_count, row.pending_count,
    ]);

    const csvContent = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    previewDocument({ blob, nome: `relatorio_departamental_${Date.now()}.csv`, tipo: 'text/csv' });
  };

  const filteredReports = selectedDepartment === 'all'
    ? rows
    : rows.filter((r) => r.department_slug === selectedDepartment);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            Indicadores reais de actividade por departamento
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <DepartmentFilter
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                showCategoryBadge={false}
                placeholder="Selecione o departamento"
              />
            </div>
          </div>

          {/* Botão de Exportação */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => exportToCSV(filteredReports)}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Exportar CSV
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
          {filteredReports.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum departamento com dados para os filtros seleccionados
            </p>
          )}
          {filteredReports.map((report) => {
            const Icon = getDepartmentIcon(report.department_slug);
            return (
              <Card key={report.department_id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{report.department_nome}</CardTitle>
                      <CardDescription>Dados actuais do sistema</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Utilizadores</p>
                      <p className="text-2xl font-bold">{report.active_users}</p>
                      <p className="text-xs text-muted-foreground">
                        de {report.total_users} total
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Facturas</p>
                      <p className="text-2xl font-bold">{report.facturas_count}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(report.facturas_value)}
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Actas / Comunicações</p>
                      <p className="text-2xl font-bold">{report.actas_count}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.comunicacoes_count} comunicações
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground mb-2">Pendências</p>
                      <p className="text-2xl font-bold" style={{ color: 'var(--tone-warn)' }}>
                        {report.pending_count}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        entre facturas, compras e actas
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Reuniões:</span>
                        <span className="font-medium">{report.meetings_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Taxa de Actividade:</span>
                        <span className="font-medium">
                          {report.total_users > 0 ? ((report.active_users / report.total_users) * 100).toFixed(0) : 0}%
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
              <CardDescription>Métricas completas por departamento</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredReports.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum departamento com dados para os filtros seleccionados
                </p>
              )}
              <div className="space-y-6">
                {filteredReports.map((report) => (
                  <div key={report.department_id} className="pb-6 border-b last:border-0">
                    <h3 className="text-lg font-semibold mb-4">{report.department_nome}</h3>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Utilizadores</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total:</span>
                            <span>{report.total_users}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Activos:</span>
                            <span>{report.active_users}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxa:</span>
                            <span>{report.total_users > 0 ? ((report.active_users / report.total_users) * 100).toFixed(0) : 0}%</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Documentos</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Facturas:</span>
                            <span>{report.facturas_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pedidos de Compra:</span>
                            <span>{report.procurements_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Actas:</span>
                            <span>{report.actas_count}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Actividade</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Comunicações:</span>
                            <span>{report.comunicacoes_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Pendências:</span>
                            <span style={{ color: 'var(--tone-warn)' }}>{report.pending_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reuniões:</span>
                            <span>{report.meetings_count}</span>
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
              <CardDescription>Comparação entre departamentos</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredReports.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum departamento com dados para os filtros seleccionados
                </p>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Volume de Facturas</h3>
                    <div className="space-y-2">
                      {[...filteredReports]
                        .sort((a, b) => b.facturas_count - a.facturas_count)
                        .map((report) => {
                          const maxFacturas = Math.max(...filteredReports.map((r) => r.facturas_count), 1);
                          const percentage = (report.facturas_count / maxFacturas) * 100;
                          return (
                            <div key={report.department_id} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{report.department_nome}</span>
                                <span className="font-medium">{report.facturas_count}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${percentage}%` }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Valor Total de Facturas</h3>
                    <div className="space-y-2">
                      {[...filteredReports]
                        .sort((a, b) => b.facturas_value - a.facturas_value)
                        .map((report) => {
                          const maxValue = Math.max(...filteredReports.map((r) => r.facturas_value), 1);
                          const percentage = (report.facturas_value / maxValue) * 100;
                          return (
                            <div key={report.department_id} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{report.department_nome}</span>
                                <span className="font-medium">{formatCurrency(report.facturas_value)}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="rounded-full h-2 transition-all" style={{ width: `${percentage}%`, backgroundColor: 'var(--tone-success)' }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Pendências</h3>
                    <div className="space-y-2">
                      {[...filteredReports]
                        .sort((a, b) => b.pending_count - a.pending_count)
                        .map((report) => {
                          const maxPending = Math.max(...filteredReports.map((r) => r.pending_count), 1);
                          const percentage = (report.pending_count / maxPending) * 100;
                          return (
                            <div key={report.department_id} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{report.department_nome}</span>
                                <span className="font-medium">{report.pending_count}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div className="rounded-full h-2 transition-all" style={{ width: `${percentage}%`, backgroundColor: 'var(--tone-warn)' }} />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
