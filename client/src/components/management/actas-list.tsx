import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner@2.0.3";
import {
  FileText,
  Calendar,
  Users,
  Eye,
  Download,
  CheckCircle,
  Clock,
  Filter,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { hasPermission } from "../auth/permissions";
import { Acta } from "./acta-types";
import { ActaDetails } from "./acta-details";
import { ActaCreateForm } from "./acta-create-form";
import { gerarPDFActa } from "../../utils/pdf-generator";
import { useClientPagination } from "../../hooks/use-client-pagination";
import { PaginationBar } from "../common/pagination-bar";

interface ActasListProps {
  // Quando definido, a lista abre directamente os detalhes desta acta (usado
  // para chegar aqui a partir do botao "Ver Acta" na Agenda/Reunioes Internas)
  // em vez de mostrar a lista.
  initialActaId?: string | null;
  onInitialActaConsumed?: () => void;
}

export function ActasList({ initialActaId, onInitialActaConsumed }: ActasListProps = {}) {
  const { user, accessToken } = useAuth();
  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const podeCriarActa = Boolean(
    user && (hasPermission(user.role, 'CREATE_ACTAS') || hasPermission(user.role, 'DRAFT_ACTAS'))
  );

  useEffect(() => {
    loadActas();
  }, [user]);

  useEffect(() => {
    if (!initialActaId) return;
    const acta = actas.find((a) => a.id === initialActaId);
    if (acta) {
      setSelectedActa(acta);
      setShowDetails(true);
      onInitialActaConsumed?.();
    }
  }, [initialActaId, actas, onInitialActaConsumed]);

  const loadActas = async (): Promise<Acta[]> => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/actas?all=true`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar actas');
      }

      const data = await response.json();
      const lista: Acta[] = data.actas || [];
      setActas(lista);
      return lista;
    } catch (error) {
 console.error('Erro ao carregar actas:', error);
      toast.error('Erro ao carregar actas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: 'Pendente', color: 'var(--tone-warn)' },
      em_curso: { label: 'Em Curso', color: 'var(--tone-info)' },
      finalizada: { label: 'Finalizada', color: 'var(--tone-success)' },
      aprovada: { label: 'Aprovada', color: 'var(--tone-success)' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className="text-white" style={{ backgroundColor: badge.color }}>{badge.label}</Badge>;
  };

  const filterActas = (status: string) => {
    if (status === 'todas') return actas;
    return actas.filter(a => a.status === status);
  };

  // Paginação de apresentação (50 por página) por separador - uma chamada
  // do hook por estado (fixo), nunca dentro do .map() de baixo, para
  // respeitar as regras dos hooks do React.
  const todasActasPag = useClientPagination(filterActas('todas'));
  const pendenteActasPag = useClientPagination(filterActas('pendente'));
  const emCursoActasPag = useClientPagination(filterActas('em_curso'));
  const finalizadaActasPag = useClientPagination(filterActas('finalizada'));
  const aprovadaActasPag = useClientPagination(filterActas('aprovada'));
  const actasPagByStatus: Record<string, ReturnType<typeof useClientPagination<Acta>>> = {
    todas: todasActasPag,
    pendente: pendenteActasPag,
    em_curso: emCursoActasPag,
    finalizada: finalizadaActasPag,
    aprovada: aprovadaActasPag,
  };

  const handleViewDetails = (acta: Acta) => {
    setSelectedActa(acta);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedActa(null);
    loadActas(); // Recarregar lista
  };

  const handleActaCreated = async (actaId?: string) => {
    setShowCreateForm(false);
    const lista = await loadActas();
    const acta = actaId ? lista.find((a) => a.id === actaId) : undefined;
    if (acta) {
      setSelectedActa(acta);
      setShowDetails(true);
    }
  };

  const handleDownloadPDF = async (acta: Acta) => {
    try {
      toast.info('A gerar PDF...');
      gerarPDFActa(acta);
    } catch (error) {
 console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar PDF');
    }
  };

  if (showCreateForm) {
    return (
      <ActaCreateForm
        onCancel={() => setShowCreateForm(false)}
        onCreated={handleActaCreated}
      />
    );
  }

  if (showDetails && selectedActa) {
    return (
      <ActaDetails
        acta={selectedActa}
        onBack={handleCloseDetails}
        onUpdate={loadActas}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">A carregar actas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Actas de Reuniões
            </CardTitle>
            <CardDescription>
              Geradas automaticamente a partir de reuniões agendadas, ou criadas manualmente
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {podeCriarActa && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Acta
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="todas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todas">
              Todas ({actas.length})
            </TabsTrigger>
            <TabsTrigger value="pendente">
              Pendentes ({pendenteActasPag.pagination.total})
            </TabsTrigger>
            <TabsTrigger value="em_curso">
              Em Curso ({emCursoActasPag.pagination.total})
            </TabsTrigger>
            <TabsTrigger value="finalizada">
              Finalizadas ({finalizadaActasPag.pagination.total})
            </TabsTrigger>
            <TabsTrigger value="aprovada">
              Aprovadas ({aprovadaActasPag.pagination.total})
            </TabsTrigger>
          </TabsList>

          {['todas', 'pendente', 'em_curso', 'finalizada', 'aprovada'].map(status => (
            <TabsContent key={status} value={status}>
              {filterActas(status).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma acta encontrada</p>
                  <p className="text-sm mt-2">
                    As actas são criadas automaticamente ao agendar reuniões
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Organizador</TableHead>
                        <TableHead>Data Reunião</TableHead>
                        <TableHead>Participantes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {actasPagByStatus[status].pageItems.map((acta) => (
                        <TableRow key={acta.id}>
                          <TableCell className="font-mono text-sm">
                            {acta.numero}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{acta.titulo}</p>
                              <p className="text-xs text-muted-foreground">
                                {acta.pontos_agenda?.length || 0} pontos de agenda
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{acta.organizador_nome}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(acta.data_reuniao), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {acta.hora_inicio} - {acta.hora_fim}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {acta.participantes?.length || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(acta.status)}
                            {acta.rascunho && (
                              <Badge variant="outline" className="ml-2">
                                Rascunho
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewDetails(acta)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadPDF(acta)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <PaginationBar pagination={actasPagByStatus[status].pagination} onPageChange={actasPagByStatus[status].setPage} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}