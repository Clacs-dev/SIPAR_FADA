import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "../ui/select";
import {
  Users,
  FileText,
  TrendingUp,
  Building2,
  Download,
  Filter,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import {
  DEPARTMENTS,
  getDepartmentById,
  getDepartmentsByCategory,
  getGroupedDepartmentOptions,
  DEPARTMENT_CATEGORIES,
  DepartmentCategory
} from "../admin/departments";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
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

interface DepartmentStats {
  total_users: number;
  active_users: number;
  facturas_count: number;
  oficios_count: number;
  actas_count: number;
  meetings_count: number;
  total_facturas_value: number;
}

interface UserByDepartment {
  department: string;
  count: number;
  percentage: number;
}

const COLORS = [
  '#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export function DepartmentDashboard() {
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [usersByDepartment, setUsersByDepartment] = useState<UserByDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedDepartment, selectedCategory]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular dados - em produção, buscar do backend
      const mockStats: DepartmentStats = {
        total_users: 45,
        active_users: 38,
        facturas_count: 127,
        oficios_count: 89,
        actas_count: 34,
        meetings_count: 56,
        total_facturas_value: 15678450.00
      };

      const mockUsersByDept: UserByDepartment[] = [
        { department: 'financeiro', count: 8, percentage: 17.8 },
        { department: 'recursos_humanos', count: 6, percentage: 13.3 },
        { department: 'juridico', count: 5, percentage: 11.1 },
        { department: 'gabinete_pca', count: 4, percentage: 8.9 },
        { department: 'tecnologia_informacao', count: 7, percentage: 15.6 },
        { department: 'administracao', count: 5, percentage: 11.1 },
        { department: 'compras', count: 4, percentage: 8.9 },
        { department: 'planeamento', count: 6, percentage: 13.3 }
      ];

      setStats(mockStats);
      setUsersByDepartment(mockUsersByDept);
    } catch (error) {
 console.error('Erro ao carregar dados:', error);
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
    // Implementar exportação
    alert('Relatório será exportado em breve!');
  };

  // Preparar dados para gráficos
  const userDistributionData = usersByDepartment.map(item => ({
    name: getDepartmentById(item.department)?.name || item.department,
    users: item.count,
    percentage: item.percentage
  }));

  const categoryDistribution = Object.keys(DEPARTMENT_CATEGORIES).map((category) => {
    const depts = getDepartmentsByCategory(category as DepartmentCategory);
    const usersInCategory = usersByDepartment
      .filter(u => depts.some(d => d.id === u.department))
      .reduce((sum, u) => sum + u.count, 0);
    
    return {
      name: DEPARTMENT_CATEGORIES[category as DepartmentCategory].label,
      value: usersInCategory
    };
  });

  const filteredDepartments = selectedCategory === 'all' 
    ? DEPARTMENTS 
    : getDepartmentsByCategory(selectedCategory as DepartmentCategory);

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
                  {getGroupedDepartmentOptions().map((group) => (
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
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Utilizadores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active_users} activos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Facturas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.facturas_count}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.total_facturas_value)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gestão de Ofícios</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.oficios_count}</div>
              <p className="text-xs text-muted-foreground">
                Documentos oficiais
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Livro de Actas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.actas_count}</div>
              <p className="text-xs text-muted-foreground">
                {stats.meetings_count} reuniões
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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
            {/* Gráfico de Barras - Utilizadores por Departamento */}
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
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userDistributionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#8B5CF6" name="Utilizadores" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Distribuição por Categoria */}
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
                  ? `Todos os ${DEPARTMENTS.length} departamentos`
                  : `Departamentos da categoria: ${DEPARTMENT_CATEGORIES[selectedCategory as DepartmentCategory]?.label}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredDepartments.map((dept) => {
                  const deptStats = usersByDepartment.find(u => u.department === dept.id);
                  const categoryInfo = DEPARTMENT_CATEGORIES[dept.category];
                  const Icon = dept.icon;
                  
                  return (
                    <Card key={dept.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          {Icon && (
                            <div className="p-2 rounded-lg bg-muted">
                              <Icon className="h-5 w-5" />
                            </div>
                          )}
                          <Badge className={categoryInfo.color}>
                            {categoryInfo.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-base mt-2">{dept.name}</CardTitle>
                        {dept.description && (
                          <CardDescription className="text-xs">
                            {dept.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{deptStats?.count || 0} utilizadores</span>
                          </div>
                          {deptStats && (
                            <Badge variant="outline">
                              {deptStats.percentage.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
                Volume de documentos gerados por cada departamento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {usersByDepartment.slice(0, 8).map((item) => {
                  const dept = getDepartmentById(item.department);
                  const Icon = dept?.icon;
                  return (
                    <div key={item.department} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {Icon && (
                          <div className="p-2 rounded-lg bg-muted">
                            <Icon className="h-6 w-6" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{dept?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.count} utilizadores
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-sm font-medium">Facturas</p>
                            <p className="text-2xl font-bold text-green-600">
                              {Math.floor(Math.random() * 50)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Ofícios</p>
                            <p className="text-2xl font-bold text-blue-600">
                              {Math.floor(Math.random() * 30)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Actas</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {Math.floor(Math.random() * 15)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}