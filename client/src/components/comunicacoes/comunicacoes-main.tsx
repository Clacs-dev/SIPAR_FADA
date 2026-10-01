import { useState, useEffect } from "react";
import { ComunicacaoForm } from "./comunicacao-form";
import { ComunicacaoDetails } from "./comunicacao-details";
import { ComunicacoesDashboard } from "./comunicacoes-dashboard";
import { Comunicacao, ComunicacaoFilters } from "./types";
import { useAuth } from "../auth/auth-context";
import { useComunicacoes, type UtilizadorDepartamento } from "../../hooks/use-comunicacoes";
import { useClientPagination } from "../../hooks/use-client-pagination";
import { PaginationBar } from "../common/pagination-bar";
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
  Loader2,
  Search,
  Circle
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

// Formata uma data com segurança: devolve '-' em vez de rebentar com
// "RangeError: Invalid time value" quando o valor vem vazio/malformado.
function formatSafeDate(value: any, pattern: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern, { locale: ptBR });
}

export function ComunicacoesMain() {
  const { user } = useAuth();
  const [view, setView] = useState<'list' | 'form' | 'details'>('list');
  const [selectedComunicacao, setSelectedComunicacao] = useState<Comunicacao | null>(null);
  const [activeTab, setActiveTab] = useState('todas');
  const [filters, setFilters] = useState<ComunicacaoFilters>({});
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
  const [delegarSearch, setDelegarSearch] = useState('');
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
        setDelegarSearch('');
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

  const delegadoSelecionado = utilizadoresDepartamento.find((u) => u.id === delegadoParaId) || null;
  const delegarMatches = (() => {
    const term = delegarSearch.trim().toLowerCase();
    if (!term) return [];
    return utilizadoresDepartamento
      .filter((u) =>
        u.nome.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.cargo || '').toLowerCase().includes(term)
      )
      .slice(0, 8);
  })();

  const filteredComunicacoes = comunicacoes.filter(comunicacao => {
    if (!comunicacao || typeof comunicacao !== 'object') return false;

    if (filters.status && comunicacao.status !== filters.status) return false;
    if (filters.prioridade && comunicacao.prioridade !== filters.prioridade) return false;
    return true;
  });

  const todasComunicacoes = filteredComunicacoes.filter(c => c.status !== 'arquivado');
  const saidaComunicacoes = filteredComunicacoes.filter(c => c.status !== 'arquivado' && c.departamento_origem === user?.departamento);
  const entradaComunicacoes = filteredComunicacoes.filter(c => c.status !== 'arquivado' && c.departamento_destino === user?.departamento);
  const arquivoComunicacoes = filteredComunicacoes.filter(c => c.status === 'arquivado');

  const todasPag = useClientPagination(todasComunicacoes);
  const saidaPag = useClientPagination(saidaComunicacoes);
  const entradaPag = useClientPagination(entradaComunicacoes);
  const arquivoPag = useClientPagination(arquivoComunicacoes);

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: 'Pendente', color: 'var(--tone-warn)' },
      em_analise: { label: 'Em Análise', color: 'var(--tone-info)' },
      despachado: { label: 'Despachado', color: 'var(--tone-success)' },
      arquivado: { label: 'Arquivado', color: 'var(--tone-neutral)' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className="text-white" style={{ backgroundColor: badge.color }}>{badge.label}</Badge>;
  };

  const getPrioridadeIcon = (prioridade: string) => {
    const cores: Record<string, string> = {
      urgente: 'var(--tone-danger)',
      alta: 'var(--tone-warn)',
      normal: 'var(--tone-info)',
    };
    const cor = cores[prioridade] || 'var(--tone-neutral)';
    return <Circle className="h-6 w-6" style={{ color: cor, fill: cor }} aria-label={`Prioridade ${prioridade}`} />;
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
    
    
    const success = await despacharComunicacao(selectedComunicacao.id, { texto_despacho: despacho });
    
    if (success) {
      await fetchComunicacoes(filters);
      setTimeout(() => {
        const updatedComunicacao = comunicacoes.find(c => c.id === selectedComunicacao.id);
        if (updatedComunicacao) {
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
            Saída ({saidaComunicacoes.length})
          </TabsTrigger>
          <TabsTrigger value="entrada">
            <Download className="mr-2 h-4 w-4" />
            Entrada ({entradaComunicacoes.length})
          </TabsTrigger>
          <TabsTrigger value="arquivo">
            <Archive className="mr-2 h-4 w-4" />
            Arquivo ({arquivoComunicacoes.length})
          </TabsTrigger>
        </TabsList>

        {/* Lista de Comunicações - Todas */}
        <TabsContent value="todas" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
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
          
          {!loading && todasComunicacoes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma comunicação encontrada
              </CardContent>
            </Card>
          )}

          {!loading && todasPag.pageItems.map((comunicacao) => (
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
                      <span>{formatSafeDate(comunicacao.created_at, "dd/MM/yyyy HH:mm")}</span>
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
          <PaginationBar pagination={todasPag.pagination} onPageChange={todasPag.setPage} />
        </TabsContent>

        {/* Lista de Comunicações - Saída (enviadas pelo departamento) */}
        <TabsContent value="saida" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
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
          
          {!loading && saidaComunicacoes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma comunicação de saída encontrada
              </CardContent>
            </Card>
          )}

          {!loading && saidaPag.pageItems.map((comunicacao) => (
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
                      <span>{formatSafeDate(comunicacao.created_at, "dd/MM/yyyy HH:mm")}</span>
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
          <PaginationBar pagination={saidaPag.pagination} onPageChange={saidaPag.setPage} />
        </TabsContent>

        {/* Lista de Comunicações - Entrada (recebidas pelo departamento) */}
        <TabsContent value="entrada" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-4">
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
          
          {!loading && entradaComunicacoes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma comunicação de entrada encontrada
              </CardContent>
            </Card>
          )}

          {!loading && entradaPag.pageItems.map((comunicacao) => (
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
                      <span>{formatSafeDate(comunicacao.created_at, "dd/MM/yyyy HH:mm")}</span>
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
          <PaginationBar pagination={entradaPag.pagination} onPageChange={entradaPag.setPage} />
        </TabsContent>

        {/* Arquivo */}
        <TabsContent value="arquivo" className="space-y-4">
          {loading && <p className="text-center text-muted-foreground">A carregar...</p>}

          {!loading && arquivoComunicacoes.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhuma comunicação arquivada
              </CardContent>
            </Card>
          )}

          {!loading && arquivoPag.pageItems.map((comunicacao) => (
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
                      <span>Arquivado em: {formatSafeDate(comunicacao.arquivado_em, "dd/MM/yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(comunicacao.status)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <PaginationBar pagination={arquivoPag.pagination} onPageChange={arquivoPag.setPage} />
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
              {loadingUtilizadores ? (
                <p className="text-sm text-muted-foreground p-3 border rounded-md">A carregar utilizadores...</p>
              ) : delegadoSelecionado ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{delegadoSelecionado.nome}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {delegadoSelecionado.email} · {delegadoSelecionado.cargo}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDelegadoParaId('');
                      setDelegarSearch('');
                    }}
                  >
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Pesquisar por nome, e-mail ou cargo..."
                    value={delegarSearch}
                    onChange={(e) => setDelegarSearch(e.target.value)}
                    className="pl-10"
                    autoComplete="off"
                  />
                  {delegarSearch.trim().length > 0 && (
                    <div className="mt-2 border rounded-md max-h-56 overflow-y-auto bg-background">
                      {delegarMatches.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhum utilizador encontrado
                        </p>
                      ) : (
                        delegarMatches.map((utilizador) => (
                          <button
                            type="button"
                            key={utilizador.id}
                            onClick={() => {
                              setDelegadoParaId(utilizador.id);
                              setDelegarSearch('');
                            }}
                            className="w-full flex items-center gap-2 p-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{utilizador.nome}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {utilizador.email} · {utilizador.cargo}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
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
                setDelegarSearch('');
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