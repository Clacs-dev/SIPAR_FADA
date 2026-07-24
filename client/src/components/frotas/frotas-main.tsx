import { useState } from "react";
import { 
  Car, 
  Plus, 
  Search,
  LayoutGrid,
  List,
  MapPin,
  Wrench,
  FileText,
  ClipboardList,
  Filter,
  CheckCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { FrotasDashboard } from "./frotas-dashboard";
import { ViaturaFormWrapper } from "./viatura-form-wrapper";
import { ViaturaDetails } from "./viatura-details";
import { UtilizacaoForm, UtilizacaoFormData } from "./utilizacao-form";
import { ManutencaoForm, ManutencaoFormData } from "./manutencao-form";
import { PedidosViaturaWrapper } from "./pedidos-viatura-wrapper";
import { Viatura, Utilizacao, Manutencao, FrotaStats, FrotaFilters, Motorista } from "./types";
import { useAuth } from "../auth/auth-context";
import { useUtilizacoes } from "../../hooks/use-utilizacoes";
import { useManutencoes } from "../../hooks/use-manutencoes";
import { useViaturas } from "../../hooks/use-viaturas";
import { toast } from "sonner@2.0.3";

export function FrotasMain() {
  const { user, accessToken } = useAuth();
  const [view, setView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedViatura, setSelectedViatura] = useState<Viatura | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<FrotaFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showUtilizacaoForm, setShowUtilizacaoForm] = useState(false);
  const [selectedViaturaForUtilizacao, setSelectedViaturaForUtilizacao] = useState<Viatura | null>(null);
  const [showManutencaoForm, setShowManutencaoForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Hooks - BUSCAR VIATURAS DO BACKEND
  const { 
    viaturas, 
    isLoading: isLoadingViaturas,
    error: viaturasError,
    refetch: refetchViaturas,
    ativarViatura
  } = useViaturas(accessToken);

  const { 
    utilizacoes, 
    isLoading: isLoadingUtilizacoes,
    createUtilizacao,
    updateUtilizacao,
    refetch: refetchUtilizacoes
  } = useUtilizacoes(accessToken);

  const { 
    manutencoes, 
    isLoading: isLoadingManutencoes,
    createManutencao,
    updateManutencao,
    refetch: refetchManutencoes
  } = useManutencoes(accessToken);

  // Dados de exemplo - Motoristas
  const motoristas: Motorista[] = [
    {
      id: '1',
      nome: 'Carlos Silva',
      carta_conducao: 'LD123456',
      validade_carta: '2027-12-31',
      telefone: '+244 923 456 789',
      departamento: 'Operações',
    },
    {
      id: '2',
      nome: 'Pedro Santos',
      carta_conducao: 'LD234567',
      validade_carta: '2026-08-15',
      telefone: '+244 923 567 890',
      departamento: 'Administração',
    },
    {
      id: '3',
      nome: 'João Mendes',
      carta_conducao: 'LD345678',
      validade_carta: '2028-03-20',
      telefone: '+244 923 678 901',
      departamento: 'Operações',
    },
  ];

  // Dados de exemplo - Estatísticas
  const stats: FrotaStats = {
    total_viaturas: 12,
    disponiveis: 7,
    em_uso: 3,
    em_manutencao: 1,
    inativas: 1,
    km_total_mensal: 8540,
    utilizacoes_mes: 45,
    manutencoes_mes: 3,
    custo_total_mes: 850000,
    custo_combustivel_mes: 650000,
    custo_manutencao_mes: 200000,
    alertas_seguro: 2,
    alertas_inspecao: 1,
    alertas_revisao: 3,
    utilizacao_por_tipo: [
      { tipo: 'SUV', quantidade: 5, km_percorridos: 4200 },
      { tipo: 'Ligeiro', quantidade: 4, km_percorridos: 2800 },
      { tipo: 'Carrinha', quantidade: 3, km_percorridos: 1540 },
    ],
    top_viaturas_utilizadas: [
      { matricula: 'LD-12-AB-34', modelo: 'Toyota Land Cruiser', utilizacoes: 12, km_percorridos: 1850 },
      { matricula: 'LD-34-CD-56', modelo: 'Nissan Patrol', utilizacoes: 10, km_percorridos: 1620 },
      { matricula: 'LD-56-EF-78', modelo: 'Toyota Hilux', utilizacoes: 8, km_percorridos: 1340 },
    ],
  };

  // Handlers para Utilizações
  const handleCreateUtilizacao = async (data: UtilizacaoFormData) => {
    if (!accessToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      await createUtilizacao(data, accessToken);
      toast.success("Utilização registada com sucesso");
      setShowUtilizacaoForm(false);
      refetchUtilizacoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registar utilização");
    }
  };

  const handleUpdateUtilizacao = async (id: string, data: Partial<UtilizacaoFormData>) => {
    if (!accessToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      await updateUtilizacao(id, data, accessToken);
      toast.success("Utilização atualizada com sucesso");
      refetchUtilizacoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar utilização");
    }
  };

  // Handlers para Manutenções
  const handleCreateManutencao = async (data: ManutencaoFormData) => {
    if (!accessToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      await createManutencao(data, accessToken);
      toast.success("Manutenção registada com sucesso");
      setShowManutencaoForm(false);
      refetchManutencoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao registar manutenção");
    }
  };

  const handleUpdateManutencao = async (id: string, data: Partial<ManutencaoFormData>) => {
    if (!accessToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      await updateManutencao(id, data, accessToken);
      toast.success("Manutenção atualizada com sucesso");
      refetchManutencoes();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar manutenção");
    }
  };

  // Filtrar viaturas
  const filteredViaturas = viaturas.filter(viatura => {
    if (searchTerm && !viatura.matricula.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !viatura.modelo.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !viatura.marca.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.status && viatura.status !== filters.status) {
      return false;
    }
    if (filters.tipo && viatura.tipo !== filters.tipo) {
      return false;
    }
    if (filters.departamento && viatura.departamento !== filters.departamento) {
      return false;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      rascunho: { label: 'Rascunho', variant: 'outline' },
      disponivel: { label: 'Disponível', variant: 'default' },
      em_uso: { label: 'Em Uso', variant: 'secondary' },
      em_manutencao: { label: 'Em Manutenção', variant: 'destructive' },
      inativa: { label: 'Inativa', variant: 'outline' },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  // Handler para ativar viatura
  const handleAtivarViatura = async (e: React.MouseEvent, viaturaId: string) => {
    e.stopPropagation(); // Evitar abrir detalhes da viatura
    
    if (!accessToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      await ativarViatura(viaturaId, accessToken);
      toast.success("Viatura ativada com sucesso!");
      refetchViaturas();
    } catch (error: any) {
 console.error("Erro ao ativar viatura:", error);
      toast.error(error.message || "Erro ao ativar viatura");
    }
  };

  // Renderizar lista de viaturas
  const renderViaturasContent = () => {
    if (view === 'form') {
      return (
        <ViaturaFormWrapper
          onBack={() => setView('list')}
          onSuccess={() => {
            setView('list');
            refetchViaturas(); // Recarregar lista de viaturas
            toast.success('Viatura criada com sucesso');
          }}
        />
      );
    }

    if (view === 'details' && selectedViatura) {
      return (
        <ViaturaDetails
          viatura={selectedViatura}
          utilizacoes={utilizacoes.filter(u => u.viatura_id === selectedViatura.id)}
          manutencoes={manutencoes.filter(m => m.viatura_id === selectedViatura.id)}
          motoristas={motoristas}
          canEdit={true}
          onBack={() => {
            setView('list');
            setSelectedViatura(null);
          }}
          onEdit={() => {
            // TODO: Implementar edição
            toast.info('Edição em desenvolvimento');
          }}
          onNovaUtilizacao={(data) => handleCreateUtilizacao(data)}
          onNovaManutencao={(data) => handleCreateManutencao(data)}
        />
      );
    }

    return (
      <div className="space-y-4">
        {/* Barra de ferramentas */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar viaturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-accent' : ''}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-accent' : ''}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button onClick={() => setView('form')}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Viatura
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? undefined : value })}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="disponivel">Disponível</SelectItem>
              <SelectItem value="em_uso">Em Uso</SelectItem>
              <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
              <SelectItem value="inativa">Inativa</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.tipo || 'all'} onValueChange={(value) => setFilters({ ...filters, tipo: value === 'all' ? undefined : value })}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="SUV">SUV</SelectItem>
              <SelectItem value="Ligeiro">Ligeiro</SelectItem>
              <SelectItem value="Carrinha">Carrinha</SelectItem>
              <SelectItem value="Comercial">Comercial</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.departamento || 'all'} onValueChange={(value) => setFilters({ ...filters, departamento: value === 'all' ? undefined : value })}>
            <SelectTrigger>
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              <SelectItem value="Administração">Administração</SelectItem>
              <SelectItem value="Operações">Operações</SelectItem>
              <SelectItem value="Segurança">Segurança</SelectItem>
              <SelectItem value="Manutenção">Manutenção</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista de viaturas */}
        <div className={viewMode === 'grid' ? 'grid gap-4 md:grid-cols-2 lg:grid-cols-3' : 'grid gap-4'}>
          {isLoadingViaturas ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                <p className="text-muted-foreground">
                  A carregar viaturas...
                </p>
              </CardContent>
            </Card>
          ) : viaturasError ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 mx-auto text-red-500 mb-4" />
                <p className="text-red-500 font-medium mb-2">
                  Erro ao carregar viaturas
                </p>
                <p className="text-sm text-muted-foreground">
                  {viaturasError}
                </p>
                <Button onClick={() => refetchViaturas()} className="mt-4" variant="outline">
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          ) : filteredViaturas.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {viaturas.length === 0 
                    ? 'Nenhuma viatura cadastrada. Clique em "Nova Viatura" para adicionar.' 
                    : 'Nenhuma viatura encontrada com os filtros aplicados.'}
                </p>
                {viaturas.length > 0 && (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setFilters({});
                    }} 
                    className="mt-4" 
                    variant="outline"
                  >
                    Limpar Filtros
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredViaturas.map((viatura) => (
              <Card 
                key={viatura.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedViatura(viatura);
                  setView('details');
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{viatura.matricula}</Badge>
                        {getStatusBadge(viatura.status)}
                      </div>
                      <CardTitle className="text-lg">
                        {viatura.marca} {viatura.modelo}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {viatura.ano} • {viatura.cor}
                      </p>
                    </div>
                    {viatura.status === 'rascunho' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => handleAtivarViatura(e, viatura.id)}
                        className="ml-2"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Ativar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <p className="font-medium">{viatura.tipo}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">KM:</span>
                      <p className="font-medium">{(viatura.km_atual ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Departamento:</span>
                      <p className="font-medium">{viatura.departamento}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Localização:</span>
                      <p className="font-medium text-xs">{viatura.localizacao_atual}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestão de Frota</h1>
        <p className="text-muted-foreground">
          Gestão completa de viaturas, utilizações e manutenções
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="pedidos" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Pedidos de Viatura
          </TabsTrigger>
          <TabsTrigger value="viaturas" className="gap-2">
            <Car className="h-4 w-4" />
            Viaturas
          </TabsTrigger>
          <TabsTrigger value="utilizacoes" className="gap-2">
            <MapPin className="h-4 w-4" />
            Utilizações
          </TabsTrigger>
          <TabsTrigger value="manutencoes" className="gap-2">
            <Wrench className="h-4 w-4" />
            Manutenções
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard" className="space-y-4">
          <FrotasDashboard stats={stats} />
        </TabsContent>

        {/* Pedidos de Viatura */}
        <TabsContent value="pedidos" className="space-y-4">
          <PedidosViaturaWrapper viaturas={viaturas} motoristas={motoristas} />
        </TabsContent>

        {/* Viaturas */}
        <TabsContent value="viaturas" className="space-y-4">
          {renderViaturasContent()}
        </TabsContent>

        {/* Utilizações */}
        <TabsContent value="utilizacoes" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Utilizações</h2>
              <p className="text-muted-foreground">
                Registo de utilizações de viaturas
              </p>
            </div>
            <Button 
              onClick={() => {
                // Selecionar primeira viatura disponível
                const primeiraDisponivel = viaturas.find(v => v.status === 'disponivel');
                if (primeiraDisponivel) {
                  setSelectedViaturaForUtilizacao(primeiraDisponivel);
                  setShowUtilizacaoForm(true);
                } else {
                  toast.error('Nenhuma viatura disponível no momento');
                }
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Utilização
            </Button>
          </div>

          {/* Dialog de Nova Utilização */}
          <UtilizacaoForm
            open={showUtilizacaoForm}
            onOpenChange={setShowUtilizacaoForm}
            viatura={selectedViaturaForUtilizacao}
            motoristas={motoristas}
            onSubmit={handleCreateUtilizacao}
          />

          <div className="grid gap-4">
            {utilizacoes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma utilização registada
                  </p>
                </CardContent>
              </Card>
            ) : (
              utilizacoes.map((utilizacao) => (
                <Card key={utilizacao.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{utilizacao.viatura_matricula}</Badge>
                          <Badge variant={utilizacao.status === 'em_curso' ? 'default' : 'outline'}>
                            {utilizacao.status === 'em_curso' ? 'Em Curso' : 'Concluída'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{utilizacao.destino}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {utilizacao.finalidade}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Condutor:</span>
                        <span className="font-medium">{utilizacao.condutor_nome}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Data Saída:</span>
                        <span className="font-medium">
                          {new Date(utilizacao.data_saida).toLocaleDateString('pt-PT')} {utilizacao.hora_saida}
                        </span>
                      </div>
                      {utilizacao.data_retorno && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Data Retorno:</span>
                          <span className="font-medium">
                            {new Date(utilizacao.data_retorno).toLocaleDateString('pt-PT')} {utilizacao.hora_retorno}
                          </span>
                        </div>
                      )}
                      {utilizacao.km_final && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Distância:</span>
                          <span className="font-medium">
                            {utilizacao.km_final - utilizacao.km_inicial} km
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Manutenções */}
        <TabsContent value="manutencoes" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Manutenções</h2>
              <p className="text-muted-foreground">
                Registo de manutenções de viaturas
              </p>
            </div>
            <Button onClick={() => setShowManutencaoForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Manutenção
            </Button>
          </div>

          {showManutencaoForm && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Nova Manutenção</CardTitle>
              </CardHeader>
              <CardContent>
                <ManutencaoForm
                  viaturas={viaturas}
                  onSubmit={handleCreateManutencao}
                  onCancel={() => setShowManutencaoForm(false)}
                />
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {manutencoes.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhuma manutenção registada
                  </p>
                </CardContent>
              </Card>
            ) : (
              manutencoes.map((manutencao) => (
                <Card key={manutencao.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{manutencao.viatura_matricula}</Badge>
                          <Badge variant={manutencao.tipo === 'urgente' ? 'destructive' : 'outline'}>
                            {manutencao.tipo}
                          </Badge>
                          <Badge variant={manutencao.status === 'concluida' ? 'default' : 'outline'}>
                            {manutencao.status}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{manutencao.descricao}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-medium">
                          {new Date(manutencao.data_manutencao).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                      {manutencao.oficina && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Oficina:</span>
                          <span className="font-medium">{manutencao.oficina}</span>
                        </div>
                      )}
                      {manutencao.custo && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Custo:</span>
                          <span className="font-medium">
                            {manutencao.custo.toLocaleString('pt-AO')} AOA
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
