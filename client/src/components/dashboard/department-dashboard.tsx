import { useState, useEffect } from "react";
import { previewDocument } from "../ui/document-preview";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "../ui/select";
import {
  Users,
  FileText,
  Building2,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity,
  Loader2
} from "lucide-react";
import {
  getDepartmentsByCategory,
  getGroupedDepartmentOptions,
  getDepartmentIcon,
  DEPARTMENT_CATEGORIES,
  DepartmentCategory
} from "../admin/departments";
import { useDepartments } from "../../hooks/use-departments";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { toast } from "sonner@2.0.3";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

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

const COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export function DepartmentDashboard() {
  const { departments } = useDepartments();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [rows, setRows] = useState<DepartmentStatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/departments/stats`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error('Erro ao carregar estatísticas departamentais');
      const result = await response.json();
      setRows(result.stats || []);
    } catch (error) {
 console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar estatísticas departamentais');
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

  const handleExportReport = () => {
    const headers = ['Departamento', 'Utilizadores', 'Activos', 'Facturas', 'Valor Facturas', 'Compras', 'Actas', 'Comunicações', 'Reuniões', 'Pendentes'];
    const csvRows = rows.map((r) => [
      r.department_nome, r.total_users, r.active_users, r.facturas_count, r.facturas_value,
      r.procurements_count, r.actas_count, r.comunicacoes_count, r.meetings_count, r.pending_count,
    ]);
    const csv = [headers.join(','), ...csvRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    previewDocument({ blob, nome: `dashboard_departamental_${Date.now()}.csv`, tipo: 'text/csv' });
  };

  const filteredRows = rows.filter((r) => {
    if (selectedCategory !== 'all' && r.categoria !== selectedCategory) return false;
    if (selectedDepartment !== 'all' && r.department_slug !== selectedDepartment) return false;
    return true;
  });

  const totals = filteredRows.reduce((acc, r) => ({
    total_users: acc.total_users + r.total_users,
    active_users: acc.active_users + r.active_users,
    facturas_count: acc.facturas_count + r.facturas_count,
    facturas_value: acc.facturas_value + r.facturas_value,
    actas_count: acc.actas_count + r.actas_count,
    meetings_count: acc.meetings_count + r.meetings_count,
  }), { total_users: 0, active_users: 0, facturas_count: 0, facturas_value: 0, actas_count: 0, meetings_count: 0 });

  const userDistributionData = filteredRows.map((r) => ({
    name: r.department_nome,
    users: r.total_users,
  }));

  const categoryDistribution = Object.keys(DEPARTMENT_CATEGORIES).map((category) => {
    const usersInCategory = filteredRows
      .filter((r) => r.categoria === category)
      .reduce((sum, r) => sum + r.total_users, 0);
    return {
      name: DEPARTMENT_CATEGORIES[category as DepartmentCategory].label,
      value: usersInCategory,
    };
  }).filter((c) => c.value > 0);

  const filteredDepartmentDefs = selectedCategory === 'all'
    ? departments
    : getDepartmentsByCategory(departments, selectedCategory as DepartmentCategory);

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
            <Building2 className="h-6 w-6" />
            Dashboard Departamental
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão analítica por departamentos e gabinetes
          </p>
        </div>
        <Button onClick={handleExportReport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {Object.entries(DEPARTMENT_CATEGORIES).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Departamento</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os departamentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Departamentos</SelectItem>
                  {getGroupedDepartmentOptions(departments).map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel>{group.label}</SelectLabel>
                      {group.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Utilizadores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.total_users}</div>
            <p className="text-xs text-muted-foreground">
              {totals.active_users} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Facturas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.facturas_count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(totals.facturas_value)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livro de Actas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.actas_count}</div>
            <p className="text-xs text-muted-foreground">
              {totals.meetings_count} reuniões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRows.length}</div>
            <p className="text-xs text-muted-foreground">
              com dados no sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="mr-2 h-4 w-4" />
            Utilizadores
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Building2 className="mr-2 h-4 w-4" />
            Departamentos
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        {/* Tab: Utilizadores */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Utilizadores por Departamento
                </CardTitle>
                <CardDescription>
                  Distribuição de utilizadores nos departamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userDistributionData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Sem dados para os filtros seleccionados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userDistributionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#8B5CF6" name="Utilizadores" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Distribuição por Categoria
                </CardTitle>
                <CardDescription>
                  Utilizadores agrupados por tipo de departamento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categoryDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-12">Sem dados para os filtros seleccionados</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Departamentos */}
        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Departamentos</CardTitle>
              <CardDescription>
                {selectedCategory === 'all'
                  ? `Todos os ${filteredDepartmentDefs.length} departamentos`
                  : `Departamentos da categoria: ${DEPARTMENT_CATEGORIES[selectedCategory as DepartmentCategory]?.label}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRows.map((row) => {
                  const categoryInfo = DEPARTMENT_CATEGORIES[row.categoria as DepartmentCategory];
                  const Icon = getDepartmentIcon(row.department_slug);

                  return (
                    <Card key={row.department_id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="p-2 rounded-lg bg-muted">
                            <Icon className="h-5 w-5" />
                          </div>
                          {categoryInfo && (
                            <Badge className={categoryInfo.color}>
                              {categoryInfo.label}
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-base mt-2">{row.department_nome}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{row.total_users} utilizadores</span>
                          </div>
                          <Badge variant="outline">
                            {row.active_users} activos
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {filteredRows.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-full text-center py-8">
                    Nenhum departamento com dados para os filtros seleccionados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade Documental por Departamento</CardTitle>
              <CardDescription>
                Volume real de documentos criados por cada departamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRows.map((row) => {
                  const Icon = getDepartmentIcon(row.department_slug);
                  return (
                    <div key={row.department_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-medium">{row.department_nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {row.total_users} utilizadores
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-sm font-medium">Facturas</p>
                            <p className="text-2xl font-bold text-green-600">
                              {row.facturas_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Compras</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {row.procurements_count}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Actas</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {row.actas_count}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredRows.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum departamento com dados para os filtros seleccionados
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
