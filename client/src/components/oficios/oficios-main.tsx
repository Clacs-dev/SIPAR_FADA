import { useState, useEffect } from "react";
import { 
  FileSignature, 
  Plus, 
  Search, 
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
  Archive,
  LayoutGrid,
  List,
  Download,
  Share2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { OficiosDashboard } from "./oficios-dashboard";
import { OficioForm } from "./oficio-form";
import { OficioDetails } from "./oficio-details";
import { Oficio, OficioFilters } from "./types";
import { useAuth } from "../auth/auth-context";
import { useOficios } from "../../hooks/use-oficios";
import { ShareDialog } from "../shared/share-dialog";
import { gerarRelatorioConsolidado } from "../../utils/pdf-generator";
import { toast } from "sonner@2.0.3";

export function OficiosMain() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedOficio, setSelectedOficio] = useState<Oficio | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState<OficioFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [oficioToShare, setOficioToShare] = useState<string | null>(null);

  // Usar hook customizado para dados reais
  const {
    oficios,
    stats,
    loading,
    fetchOficios,
    createOficio,
    updateOficio,
    deleteOficio,
    despacharOficio,
    arquivarOficio,
    compartilharOficio,
  } = useOficios();

  // Carregar ofícios ao montar componente
  useEffect(() => {
    fetchOficios(filters);
  }, [filters, fetchOficios]);

  // Atualizar ofício selecionado quando a lista mudar
  useEffect(() => {
    if (selectedOficio) {
      const updatedOficio = oficios.find(o => o.id === selectedOficio.id);
      if (updatedOficio) {
 console.log(' Atualizando ofício selecionado:', updatedOficio.id);
 console.log(' Despachos atualizados:', updatedOficio.despachos);
        setSelectedOficio(updatedOficio);
      }
    }
  }, [oficios]); // Quando oficios mudar, atualizar o selectedOficio

  const filteredOficios = oficios.filter(oficio => {
    // Verificar se o ofício é válido
    if (!oficio || typeof oficio !== 'object') return false;
    
    if (searchTerm && !oficio.assunto.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !oficio.numero.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.tipo && oficio.tipo !== filters.tipo) return false;
    if (filters.status && oficio.status !== filters.status) return false;
    if (filters.prioridade && oficio.prioridade !== filters.prioridade) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: 'Pendente', color: 'bg-yellow-500' },
      em_analise: { label: 'Em Análise', color: 'bg-blue-500' },
      despachado: { label: 'Despachado', color: 'bg-green-500' },
      arquivado: { label: 'Arquivado', color: 'bg-gray-600' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const getPrioridadeIcon = (prioridade: string) => {
    switch (prioridade) {
      case 'urgente':
        return '🔴';
      case 'alta':
        return '🟠';
      case 'normal':
        return '🔵';
      default:
        return '⚪';
    }
  };

  const handleSaveOficio = async (oficioData: Partial<Oficio>) => {
    if (selectedOficio) {
      // Atualizar ofício existente
      const updated = await updateOficio(selectedOficio.id, oficioData);
      if (updated) {
        setView('list');
        setSelectedOficio(null);
        // Recarregar lista para garantir dados atualizados
        await fetchOficios(filters);
      }
    } else {
      // Criar novo ofício
      const created = await createOficio(oficioData);
      if (created) {
        setView('list');
        // Recarregar lista para garantir que o novo ofício apareça
        await fetchOficios(filters);
      }
    }
  };

  const handleDespachar = async (despacho: string) => {
    if (!selectedOficio) return;
    
 console.log(' [MAIN] handleDespachar chamado');
 console.log(' [MAIN] Ofício ID:', selectedOficio.id);
 console.log(' [MAIN] Despacho:', despacho);
    
    const success = await despacharOficio(selectedOficio.id, despacho);
 console.log(' [MAIN] Resultado do despacho:', success);
    
    if (success) {
 console.log(' [MAIN] Despacho adicionado, recarregando dados...');
      // Recarregar lista completa e esperar
      await fetchOficios(filters);
      // Dar um pequeno delay para garantir que o estado foi atualizado
      setTimeout(() => {
        const updatedOficio = oficios.find(o => o.id === selectedOficio.id);
        if (updatedOficio) {
 console.log(' [MAIN] Ofício atualizado com despachos:', updatedOficio.despachos);
          setSelectedOficio(updatedOficio);
        } else {
 console.warn(' [MAIN] Ofício não encontrado após atualização');
        }
      }, 100);
    } else {
 console.error(' [MAIN] Falha ao adicionar despacho');
    }
  };

  const handleArquivar = async () => {
    if (!selectedOficio) return;
    
    const success = await arquivarOficio(selectedOficio.id);
    if (success) {
      setView('list');
      setSelectedOficio(null);
    }
  };

  const handleShare = (oficioId: string) => {
    setOficioToShare(oficioId);
    setShareDialogOpen(true);
  };

  const handleShareSubmit = async (usuarioIds: string[], permissao: 'leitura' | 'edicao') => {
    if (!oficioToShare) return false;
    return await compartilharOficio(oficioToShare, usuarioIds, permissao);
  };

  const handleDownloadRelatorio = () => {
    gerarRelatorioConsolidado('oficios', filteredOficios, filters);
    toast.success('Relatório gerado com sucesso!');
  };

  const canDespachar = user?.role === 'admin' || 
    (user as any)?.department === 'Gestão' ||
    (user as any)?.position?.includes('Gerente');

  const canEdit = user?.role === 'admin' || user?.role === 'attendant';

  if (view === 'form') {
    return (
      <OficioForm
        oficio={selectedOficio || undefined}
        onSave={handleSaveOficio}
        onCancel={() => {
          setView('list');
          setSelectedOficio(null);
        }}
      />
    );
  }

  if (view === 'details' && selectedOficio) {
    return (
      <OficioDetails
        oficio={selectedOficio}
        canDespachar={canDespachar}
        canEdit={canEdit}
        onBack={() => {
          setView('list');
          setSelectedOficio(null);
        }}
        onEdit={() => setView('form')}
        onDespachar={handleDespachar}
        onArquivar={handleArquivar}
        onShare={handleShare}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <FileSignature className="h-6 w-6" />
            Gestão de Ofícios
          </h1>
          <p className="text-muted-foreground">
            Gestão de correspondência oficial
          </p>
        </div>
        <Button onClick={() => setView('form')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Ofício
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">
            <LayoutGrid className="mr-2 h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="todos">
            <List className="mr-2 h-4 w-4" />
            Todos ({oficios.filter(o => o && typeof o === 'object').length})
          </TabsTrigger>
          <TabsTrigger value="recebidos">
            <ArrowDownCircle className="mr-2 h-4 w-4" />
            Recebidos ({oficios.filter(o => o && o.tipo === 'entrada').length})
          </TabsTrigger>
          <TabsTrigger value="enviados">
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Enviados ({oficios.filter(o => o && o.tipo === 'saida').length})
          </TabsTrigger>
          <TabsTrigger value="arquivo">
            <Archive className="mr-2 h-4 w-4" />
            Arquivo ({oficios.filter(o => o && o.status === 'arquivado').length})
          </TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <OficiosDashboard stats={stats} loading={loading} />
        </TabsContent>

        {/* Lista de Ofícios */}
        <TabsContent value="todos" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Pesquisar por assunto ou número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <select
                  className="px-3 py-2 border border-input rounded-md bg-background"
                  value={filters.status || ''}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                >
                  <option value="">Todos os estados</option>
                  <option value="pendente">Pendente</option>
                  <option value="em_analise">Em Análise</option>
                  <option value="despachado">Despachado</option>
                  <option value="arquivado">Arquivado</option>
                </select>
                <select
                  className="px-3 py-2 border border-input rounded-md bg-background"
                  value={filters.prioridade || ''}
                  onChange={(e) => setFilters({ ...filters, prioridade: e.target.value })}
                >
                  <option value="">Todas as prioridades</option>
                  <option value="baixa">Baixa</option>
                  <option value="normal">Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
                <Button onClick={handleDownloadRelatorio} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Relatório PDF
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          <div className="grid gap-4">
            {filteredOficios.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum ofício encontrado
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredOficios.map((oficio) => (
                <Card
                  key={oficio.id}
                  className="hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedOficio(oficio);
                    setView('details');
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">{getPrioridadeIcon(oficio.prioridade)}</span>
                          <Badge variant="outline">{oficio.numero}</Badge>
                          {getStatusBadge(oficio.status)}
                          <Badge variant="outline">
                            {oficio.tipo === 'entrada' ? '⬇️ Entrada' : '⬆️ Saída'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{oficio.assunto}</CardTitle>
                        <div className="mt-2 space-y-1">
                          {oficio.tipo === 'entrada' && oficio.remetente && (
                            <p className="text-sm text-muted-foreground">
                              De: {oficio.remetente}
                            </p>
                          )}
                          {oficio.tipo === 'saida' && oficio.destinatario && (
                            <p className="text-sm text-muted-foreground">
                              Para: {oficio.destinatario}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {new Date(oficio.created_at).toLocaleDateString('pt-PT')} • {oficio.created_by_name}
                          </p>
                          {oficio.prazo_resposta && (
                            <p className="text-sm text-muted-foreground">
                              Prazo: {new Date(oficio.prazo_resposta).toLocaleDateString('pt-PT')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Recebidos */}
        <TabsContent value="recebidos" className="space-y-4">
          <div className="grid gap-4">
            {oficios.filter(o => o && o.tipo === 'entrada').map((oficio) => (
              <Card
                key={oficio.id}
                className="hover:bg-accent cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedOficio(oficio);
                  setView('details');
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{oficio.numero}</Badge>
                        {getStatusBadge(oficio.status)}
                      </div>
                      <CardTitle className="text-lg">{oficio.assunto}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        De: {oficio.remetente}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Enviados */}
        <TabsContent value="enviados" className="space-y-4">
          <div className="grid gap-4">
            {oficios.filter(o => o && o.tipo === 'saida').map((oficio) => (
              <Card
                key={oficio.id}
                className="hover:bg-accent cursor-pointer transition-colors"
                onClick={() => {
                  setSelectedOficio(oficio);
                  setView('details');
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{oficio.numero}</Badge>
                        {getStatusBadge(oficio.status)}
                      </div>
                      <CardTitle className="text-lg">{oficio.assunto}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-2">
                        Para: {oficio.destinatario}
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Arquivo */}
        <TabsContent value="arquivo" className="space-y-4">
          <div className="grid gap-4">
            {oficios.filter(o => o && o.status === 'arquivado').length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Nenhum ofício arquivado
                  </p>
                </CardContent>
              </Card>
            ) : (
              oficios.filter(o => o && o.status === 'arquivado').map((oficio) => (
                <Card
                  key={oficio.id}
                  className="hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedOficio(oficio);
                    setView('details');
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{oficio.numero}</Badge>
                          {getStatusBadge(oficio.status)}
                        </div>
                        <CardTitle className="text-lg">{oficio.assunto}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Share Dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        onSubmit={handleShareSubmit}
      />
    </div>
  );
}