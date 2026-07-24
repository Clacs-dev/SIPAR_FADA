import { useState, useEffect } from "react";
import { ComunicacaoForm } from "./comunicacao-form";
import { ComunicacaoDetails } from "./comunicacao-details";
import { ComunicacoesDashboard } from "./comunicacoes-dashboard";
import { Comunicacao, ComunicacaoFilters } from "./types";
import { useAuth } from "../auth/auth-context";
import { useComunicacoes, type UtilizadorDepartamento } from "../../hooks/use-comunicacoes";
import { ShareDialog } from "../shared/share-dialog";
import { gerarRelatorioConsolidado } from "../../utils/pdf-generator";
import { toast } from "sonner@2.0.3";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { 
  MessageSquare, 
  Plus, 
  Download, 
  ArrowUpCircle, 
  Archive,
  Reply,
  FileText,
  UserPlus,
  Edit,
  Trash2,
  Loader2
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";

export function ComunicacoesMain() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedComunicacao, setSelectedComunicacao] = useState<Comunicacao | null>(null);
  const [activeTab, setActiveTab] = useState('todas');
  const [filters, setFilters] = useState<ComunicacaoFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [comunicacaoToShare, setComunicacaoToShare] = useState<string | null>(null);

  // Estados para dialogs de ação
  const [despachoDialogOpen, setDespachoDialogOpen] = useState(false);
  const [comunicacaoToDespachar, setComunicacaoToDespachar] = useState<Comunicacao | null>(null);
  const [despachoText, setDespachoText] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [comunicacaoToDelete, setComunicacaoToDelete] = useState<Comunicacao | null>(null);

  /**
   * Handler para excluir comunicação
   */
  const confirmDelete = async () => {
    if (!comunicacaoToDelete) return;
    
    const success = await deleteComunicacao(comunicacaoToDelete.id);
    
    if (success) {
      await fetchComunicacoes(filters);
      setDeleteDialogOpen(false);
      setComunicacaoToDelete(null);
    }
  };

  // Estados para Responder e Delegar
  const [responderDialogOpen, setResponderDialogOpen] = useState(false);
  const [comunicacaoToResponder, setComunicacaoToResponder] = useState<Comunicacao | null>(null);
  const [respostaText, setRespostaText] = useState('');
  const [respostaAnexo, setRespostaAnexo] = useState<File | null>(null);
  const [uploadingResposta, setUploadingResposta] = useState(false);

  /**
   * Handler para enviar resposta a uma comunicação
   */
  const handleEnviarResposta = async () => {
    if (!comunicacaoToResponder || !respostaText.trim()) {
      toast.error('Por favor, preencha o campo de resposta');
      return;
    }

    setUploadingResposta(true);

    try {
      // TODO: Se houver anexo, fazer upload primeiro
      // Por enquanto, enviar sem anexos
      const anexos: any[] = [];

      const success = await responderComunicacao(
        comunicacaoToResponder.id,
        respostaText,
        anexos
      );

      if (success) {
        setResponderDialogOpen(false);
        setRespostaText('');
        setRespostaAnexo(null);
        setComunicacaoToResponder(null);
        await fetchComunicacoes(filters);
      }
    } catch (error) {
 console.error(' Erro ao enviar resposta:', error);
      toast.error('Erro ao enviar resposta');
    } finally {
      setUploadingResposta(false);
    }
  };

  const [delegarDialogOpen, setDelegarDialogOpen] = useState(false);
  const [comunicacaoToDelegar, setComunicacaoToDelegar] = useState<Comunicacao | null>(null);
  const [delegadoParaId, setDelegadoParaId] = useState('');
  const [motivoDelegacao, setMotivoDelegacao] = useState('');
  const [delegandoComunicacao, setDelegandoComunicacao] = useState(false);

  /**
   * Handler para delegar comunicação
   */
  const handleDelegarComunicacao = async () => {
    if (!comunicacaoToDelegar || !delegadoParaId || !motivoDelegacao.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setDelegandoComunicacao(true);

    try {
      const success = await delegarComunicacao(
        comunicacaoToDelegar.id,
        delegadoParaId,
        motivoDelegacao
      );

      if (success) {
        setDelegarDialogOpen(false);
        setDelegadoParaId('');
        setMotivoDelegacao('');
        setComunicacaoToDelegar(null);
        await fetchComunicacoes(filters);
      }
    } catch (error) {
 console.error(' Erro ao delegar comunicação:', error);
      toast.error('Erro ao delegar comunicação');
    } finally {
      setDelegandoComunicacao(false);
    }
  };

  // Lista de utilizadores do departamento para delegação
  const [utilizadoresDepartamento, setUtilizadoresDepartamento] = useState<UtilizadorDepartamento[]>([]);
  const [loadingUtilizadores, setLoadingUtilizadores] = useState(false);

  // Usar hook customizado para dados reais
  const {
    comunicacoes,
    stats,
    loading,
    fetchComunicacoes,
    createComunicacao,
    updateComunicacao,
    deleteComunicacao,
    despacharComunicacao,
    arquivarComunicacao,
    compartilharComunicacao,
    responderComunicacao,
    delegarComunicacao,
    fetchUtilizadoresDepartamento,
  } = useComunicacoes();

  // Carregar comunicações ao montar componente
  useEffect(() => {
    fetchComunicacoes(filters);
  }, [filters, fetchComunicacoes]);

  // Atualizar comunicação selecionada quando a lista mudar
  useEffect(() => {
    if (selectedComunicacao) {
      const updatedComunicacao = comunicacoes.find(c => c.id === selectedComunicacao.id);
      if (updatedComunicacao) {
 console.log(' Atualizando comunicação selecionada:', updatedComunicacao.id);
 console.log(' Despachos atualizados:', updatedComunicacao.despachos);
        setSelectedComunicacao(updatedComunicacao);
      }
    }
  }, [comunicacoes]);

  // Carregar utilizadores do departamento quando o dialog de delegação é aberto
  useEffect(() => {
    if (delegarDialogOpen && utilizadoresDepartamento.length === 0) {
      setLoadingUtilizadores(true);
      fetchUtilizadoresDepartamento()
        .then((utilizadores) => {
 console.log(' Utilizadores do departamento carregados:', utilizadores.length);
          setUtilizadoresDepartamento(utilizadores);
        })
        .catch((error) => {
 console.error(' Erro ao carregar utilizadores:', error);
          toast.error('Erro ao carregar lista de utilizadores');
        })
        .finally(() => {
          setLoadingUtilizadores(false);
        });
    }
  }, [delegarDialogOpen, utilizadoresDepartamento.length, fetchUtilizadoresDepartamento]);

  const filteredComunicacoes = comunicacoes.filter(comunicacao => {
    if (!comunicacao || typeof comunicacao !== 'object') return false;
    
    if (searchTerm && !comunicacao.assunto.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !comunicacao.numero.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.status && comunicacao.status !== filters.status) return false;
    if (filters.prioridade && comunicacao.prioridade !== filters.prioridade) return false;
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

  const handleSaveComunicacao = async (comunicacaoData: Partial<Comunicacao>) => {
    if (selectedComunicacao) {
      // Atualizar comunicação existente
      const updated = await updateComunicacao(selectedComunicacao.id, comunicacaoData);
      if (updated) {
        setView('list');
        setSelectedComunicacao(null);
        await fetchComunicacoes(filters);
      }
    } else {
      // Criar nova comunicação
      const created = await createComunicacao(comunicacaoData);
      if (created) {
        setView('list');
        await fetchComunicacoes(filters);
      }
    }
  };

  const handleDespachar = async (despacho: string) => {
    if (!selectedComunicacao) return;
    
 console.log(' [MAIN] handleDespachar chamado');
 console.log(' [MAIN] Comunicação ID:', selectedComunicacao.id);
 console.log(' [MAIN] Despacho:', despacho);
    
    const success = await despacharComunicacao(selectedComunicacao.id, { texto_despacho: despacho });
 console.log(' [MAIN] Resultado do despacho:', success);
    
    if (success) {
 console.log(' [MAIN] Despacho adicionado, recarregando dados...');
      await fetchComunicacoes(filters);
      setTimeout(() => {
        const updatedComunicacao = comunicacoes.find(c => c.id === selectedComunicacao.id);
        if (updatedComunicacao) {
 console.log(' [MAIN] Comunicação atualizada com despachos:', updatedComunicacao.despachos);
          setSelectedComunicacao(updatedComunicacao);
        }
      }, 100);
    }
  };

  const handleArquivar = async () => {
    if (!selectedComunicacao) return;
    
    await arquivarComunicacao(selectedComunicacao.id);
    setView('list');
    setSelectedComunicacao(null);
  };

  const handleShare = (comunicacaoId: string) => {
    setComunicacaoToShare(comunicacaoId);
    setShareDialogOpen(true);
  };

  const handleShareSubmit = async (usuarioIds: string[], permissao: 'leitura' | 'edicao') => {
    if (!comunicacaoToShare) return false;
    // Por enquanto, apenas compartilhar (sem sistema de permissões específicas)
    await compartilharComunicacao(comunicacaoToShare, usuarioIds);
    return true;
  };

  const handleDownloadRelatorio = () => {
    gerarRelatorioConsolidado('comunicacoes', filteredComunicacoes, filters);
    toast.success('Relatório gerado com sucesso!');
  };

  // Handlers para ações diretas da lista
  const handleEditClick = (e: React.MouseEvent, comunicacao: Comunicacao) => {
    e.stopPropagation();
    setSelectedComunicacao(comunicacao);
    setView('form');
  };

  const handleDespacharClick = (e: React.MouseEvent, comunicacao: Comunicacao) => {
    e.stopPropagation();
    setComunicacaoToDespachar(comunicacao);
    setDespachoText('');
    setDespachoDialogOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, comunicacao: Comunicacao) => {
    e.stopPropagation();
    setComunicacaoToDelete(comunicacao);
    setDeleteDialogOpen(true);
  };

  const confirmDespacho = async () => {
    if (!comunicacaoToDespachar || !despachoText.trim()) return;
    
    const success = await despacharComunicacao(comunicacaoToDespachar.id, { texto_despacho: despachoText });
    
    if (success) {
      await fetchComunicacoes(filters);
      setDespachoDialogOpen(false);
      setComunicacaoToDespachar(null);
      setDespachoText('');
    }
  };

  const canDespachar = user?.role === 'admin' || 
    (user as any)?.department === 'Gestão' ||
    (user as any)?.position?.includes('Gerente');

  const canEdit = user?.role === 'admin' || user?.role === 'attendant';

  if (view === 'form') {
    return (
      <ComunicacaoForm
        comunicacao={selectedComunicacao || undefined}
        onSave={handleSaveComunicacao}
        onCancel={() => {
          setView('list');
          setSelectedComunicacao(null);
        }}
      />
    );
  }

  if (view === 'details' && selectedComunicacao) {
    return (
      <ComunicacaoDetails
        comunicacao={selectedComunicacao}
        canDespachar={canDespachar}
        canEdit={canEdit}
        onBack={() => {
          setView('list');
          setSelectedComunicacao(null);
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
            <MessageSquare className="h-6 w-6" />
            Comunicações Internas
          </h1>
          <p className="text-muted-foreground">
            Gestão de comunicações internas de saída
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadRelatorio}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
          <Button onClick={() => setView('form')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Comunicação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <ComunicacoesDashboard stats={stats} loading={loading} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="todas">
            <MessageSquare className="mr-2 h-4 w-4" />
            Todas ({comunicacoes.length})
          </TabsTrigger>
          <TabsTrigger value="saida">
            <ArrowUpCircle className="mr-2 h-4 w-4" />
            Saída ({comunicacoes.filter(c => c && c.departamento_origem === user?.departamento).length})
          </TabsTrigger>
          <TabsTrigger value="entrada">
            <Download className="mr-2 h-4 w-4" />
            Entrada ({comunicacoes.filter(c => c && c.departamento_destino === user?.departamento).length})
          </TabsTrigger>
          <TabsTrigger value="arquivo">
            <Archive className="mr-2 h-4 w-4" />
            Arquivo ({comunicacoes.filter(c => c && c.status === 'arquivado').length})
          </TabsTrigger>
        </TabsList>

        {/* Lista de Comunicações - Todas */}
        <TabsContent value="todas" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Pesquisar por assunto ou número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                </select>
                <select
                  className="px-3 py-2 border border-input rounded-md bg-background"
                  value={filters.prioridade || ''}
                  onChange={(e) => setFilters({ ...filters, prioridade: e.target.value })}
                >
                  <option value="">Todas as importâncias</option>
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
          
          {!loading && filteredComunicacoes.filter(c => c.status !== 'arquivado').length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma comunicação encontrada
              </CardContent>
            </Card>
          )}

          {!loading && filteredComunicacoes.filter(c => c.status !== 'arquivado').map((comunicacao) => (
            <Card
              key={comunicacao.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedComunicacao(comunicacao);
                setView('details');
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getPrioridadeIcon(comunicacao.prioridade)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{comunicacao.numero}</h3>
                          {comunicacao.confidencial && (
                            <Badge variant="destructive" className="text-xs">CONFIDENCIAL</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{comunicacao.assunto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <span>De: {comunicacao.departamento_origem}</span>
                      <span>•</span>
                      <span>Para: {comunicacao.departamento_destino}</span>
                      {comunicacao.destinatario_nome && (
                        <>
                          <span>•</span>
                          <span>{comunicacao.destinatario_nome}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{format(new Date(comunicacao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      {comunicacao.despachos && comunicacao.despachos.length > 0 && (
                        <>
                          <span>•</span>
                          <Badge variant="outline">{comunicacao.despachos.length} despacho(s)</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setComunicacaoToResponder(comunicacao);
                          setRespostaText('');
                          setRespostaAnexo(null);
                          setResponderDialogOpen(true);
                        }}
                        title="Responder"
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                      {canDespachar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDespacharClick(e, comunicacao)}
                          title="Despachar"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setComunicacaoToDelegar(comunicacao);
                          setDelegadoParaId('');
                          setMotivoDelegacao('');
                          setDelegarDialogOpen(true);
                        }}
                        title="Delegar"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                    {getStatusBadge(comunicacao.status)}
                    {comunicacao.prioridade === 'urgente' && (
                      <Badge variant="destructive">Urgente</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Lista de Comunicações - Saída (enviadas pelo departamento) */}
        <TabsContent value="saida" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Pesquisar por assunto ou número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                </select>
                <select
                  className="px-3 py-2 border border-input rounded-md bg-background"
                  value={filters.prioridade || ''}
                  onChange={(e) => setFilters({ ...filters, prioridade: e.target.value })}
                >
                  <option value="">Todas as importâncias</option>
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
          
          {!loading && filteredComunicacoes.filter(c => c.status !== 'arquivado' && c.departamento_origem === user?.departamento).length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma comunicação de saída encontrada
              </CardContent>
            </Card>
          )}

          {!loading && filteredComunicacoes.filter(c => c.status !== 'arquivado' && c.departamento_origem === user?.departamento).map((comunicacao) => (
            <Card
              key={comunicacao.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedComunicacao(comunicacao);
                setView('details');
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getPrioridadeIcon(comunicacao.prioridade)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{comunicacao.numero}</h3>
                          {comunicacao.confidencial && (
                            <Badge variant="destructive" className="text-xs">CONFIDENCIAL</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{comunicacao.assunto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <span>Para: {comunicacao.departamento_destino}</span>
                      {comunicacao.destinatario_nome && (
                        <>
                          <span>•</span>
                          <span>{comunicacao.destinatario_nome}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{format(new Date(comunicacao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      {comunicacao.despachos && comunicacao.despachos.length > 0 && (
                        <>
                          <span>•</span>
                          <Badge variant="outline">{comunicacao.despachos.length} despacho(s)</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleEditClick(e, comunicacao)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDespachar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDespacharClick(e, comunicacao)}
                          title="Despachar"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteClick(e, comunicacao)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    {getStatusBadge(comunicacao.status)}
                    {comunicacao.prioridade === 'urgente' && (
                      <Badge variant="destructive">Urgente</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Lista de Comunicações - Entrada (recebidas pelo departamento) */}
        <TabsContent value="entrada" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder="Pesquisar por assunto ou número..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
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
                </select>
                <select
                  className="px-3 py-2 border border-input rounded-md bg-background"
                  value={filters.prioridade || ''}
                  onChange={(e) => setFilters({ ...filters, prioridade: e.target.value })}
                >
                  <option value="">Todas as importâncias</option>
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="normal">Normal</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Lista */}
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
          
          {!loading && filteredComunicacoes.filter(c => c.status !== 'arquivado' && c.departamento_destino === user?.departamento).length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma comunicação de entrada encontrada
              </CardContent>
            </Card>
          )}

          {!loading && filteredComunicacoes.filter(c => c.status !== 'arquivado' && c.departamento_destino === user?.departamento).map((comunicacao) => (
            <Card
              key={comunicacao.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedComunicacao(comunicacao);
                setView('details');
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getPrioridadeIcon(comunicacao.prioridade)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{comunicacao.numero}</h3>
                          {comunicacao.confidencial && (
                            <Badge variant="destructive" className="text-xs">CONFIDENCIAL</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{comunicacao.assunto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <span>De: {comunicacao.departamento_origem}</span>
                      <span>•</span>
                      <span>{format(new Date(comunicacao.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                      {comunicacao.despachos && comunicacao.despachos.length > 0 && (
                        <>
                          <span>•</span>
                          <Badge variant="outline">{comunicacao.despachos.length} despacho(s)</Badge>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-1">
                      {canDespachar && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDespacharClick(e, comunicacao)}
                          title="Despachar"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {getStatusBadge(comunicacao.status)}
                    {comunicacao.prioridade === 'urgente' && (
                      <Badge variant="destructive">Urgente</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Arquivo */}
        <TabsContent value="arquivo" className="space-y-4">
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
          
          {!loading && filteredComunicacoes.filter(c => c.status === 'arquivado').length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma comunicação arquivada
              </CardContent>
            </Card>
          )}

          {!loading && filteredComunicacoes.filter(c => c.status === 'arquivado').map((comunicacao) => (
            <Card
              key={comunicacao.id}
              className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
              onClick={() => {
                setSelectedComunicacao(comunicacao);
                setView('details');
              }}
            >
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getPrioridadeIcon(comunicacao.prioridade)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{comunicacao.numero}</h3>
                          {comunicacao.confidencial && (
                            <Badge variant="destructive" className="text-xs">CONFIDENCIAL</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{comunicacao.assunto}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <span>De: {comunicacao.departamento_origem}</span>
                      <span>•</span>
                      <span>Para: {comunicacao.departamento_destino}</span>
                      <span>•</span>
                      <span>Arquivado em: {format(new Date(comunicacao.arquivado_em!), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(comunicacao.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Dialog de Compartilhamento */}
      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        onShare={handleShareSubmit}
        title="Compartilhar Comunicação"
        description="Seleccione utilizadores para compartilhar esta comunicação"
      />

      {/* Dialog de Despacho */}
      <Dialog open={despachoDialogOpen} onOpenChange={setDespachoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Despachar Comunicação</DialogTitle>
            <DialogDescription>
              Adicione um despacho para a comunicação selecionada.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={despachoText}
            onChange={(e) => setDespachoText(e.target.value)}
            placeholder="Digite o despacho aqui..."
            className="h-40"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDespachoDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmDespacho} disabled={!despachoText.trim()}>
              Despachar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Comunicação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta comunicação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Responder */}
      <Dialog open={responderDialogOpen} onOpenChange={setResponderDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Responder Comunicação</DialogTitle>
            <DialogDescription>
              {comunicacaoToResponder && `Respondendo à: ${comunicacaoToResponder.numero} - ${comunicacaoToResponder.assunto}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Resposta *</label>
              <Textarea
                value={respostaText}
                onChange={(e) => setRespostaText(e.target.value)}
                placeholder="Digite a sua resposta aqui..."
                className="h-32"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Anexo (Opcional)</label>
              <Input
                type="file"
                onChange={(e) => setRespostaAnexo(e.target.files?.[0] || null)}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              {respostaAnexo && (
                <p className="text-sm text-muted-foreground mt-2">
                  Ficheiro selecionado: {respostaAnexo.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setResponderDialogOpen(false);
                setRespostaText('');
                setRespostaAnexo(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleEnviarResposta}
              disabled={!respostaText.trim() || uploadingResposta}
            >
              {uploadingResposta && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Resposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Delegar */}
      <Dialog open={delegarDialogOpen} onOpenChange={setDelegarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delegar Comunicação</DialogTitle>
            <DialogDescription>
              {comunicacaoToDelegar && `Delegando: ${comunicacaoToDelegar.numero} - ${comunicacaoToDelegar.assunto}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Delegar Para *</label>
              <select
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={delegadoParaId}
                onChange={(e) => setDelegadoParaId(e.target.value)}
              >
                <option value="">Seleccione um utilizador...</option>
                {loadingUtilizadores && <option value="loading">A carregar...</option>}
                {utilizadoresDepartamento.map((utilizador) => (
                  <option key={utilizador.id} value={utilizador.id}>{utilizador.nome}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Apenas utilizadores do departamento {user?.departamento}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Motivo da Delegação *</label>
              <Textarea
                value={motivoDelegacao}
                onChange={(e) => setMotivoDelegacao(e.target.value)}
                placeholder="Explique o motivo da delegação..."
                className="h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDelegarDialogOpen(false);
                setDelegadoParaId('');
                setMotivoDelegacao('');
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleDelegarComunicacao}
              disabled={!delegadoParaId || !motivoDelegacao.trim() || delegandoComunicacao}
            >
              {delegandoComunicacao && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delegar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}