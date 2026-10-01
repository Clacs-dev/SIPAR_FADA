import { useState, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { AcceptRequestDialog } from "./accept-request-dialog";
import { DelegateDialog } from "./delegate-dialog";
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog";
import { DocumentViewer } from "../forms/document-viewer";
import { Eye, Check, X, UserCheck, FileText, Calendar as CalendarIcon, Ban } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { PaginationBar } from "../common/pagination-bar";
import { useClientPagination } from "../../hooks/use-client-pagination";
import { format, isToday, isYesterday, isWithinInterval, subDays, startOfMonth, endOfMonth } from "date-fns@4.1.0";
import { ptBR } from "date-fns@4.1.0/locale";

export function RequestsList() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [presentations, setPresentations] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [delegateDialogOpen, setDelegateDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'presentation' | 'audience'>('audience');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
 console.error('No access token found in localStorage');
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

 console.log('Fetching presentations and audiences...');

      // Fetch presentations
      const presentationsResponse = await fetch(
        `${API_BASE_URL}/presentations?all=true`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // Fetch audiences
      const audiencesResponse = await fetch(
        `${API_BASE_URL}/audiences?all=true`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (presentationsResponse.ok) {
        const data = await presentationsResponse.json();
 console.log('Presentations fetched:', data.data?.length || 0, 'items');
        setPresentations(data.data || []);
      } else {
 console.error('Presentations fetch failed:', presentationsResponse.status);
        const error = await presentationsResponse.text();
 console.error('Error details:', error);
        if (presentationsResponse.status === 401) {
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          return;
        }
      }

      if (audiencesResponse.ok) {
        const data = await audiencesResponse.json();
 console.log('Audiences fetched:', data.data?.length || 0, 'items');
        setAudiences(data.data || []);
      } else {
 console.error('Audiences fetch failed:', audiencesResponse.status);
        const error = await audiencesResponse.text();
 console.error('Error details:', error);
        if (audiencesResponse.status === 401) {
          toast.error('Sessão expirada. Por favor, faça login novamente.');
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          return;
        }
      }

    } catch (error) {
 console.error('Error fetching data:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'bg-[var(--status-pendente)] text-[var(--status-pendente-foreground)]';
      case 'aceite_admin': return 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]';
      case 'aprovado': return 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]';
      case 'delegado': return 'bg-[var(--status-delegado)] text-[var(--status-delegado-foreground)]';
      case 'agendado': return 'bg-[var(--status-agendado)] text-[var(--status-agendado-foreground)]';
      case 'confirmado': return 'bg-[var(--status-agendado)] text-[var(--status-agendado-foreground)]';
      case 'revisada': return 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]';
      case 'realizado': return 'bg-[var(--tone-success)] text-white';
      case 'nao_compareceu': return 'bg-[var(--tone-warn)] text-white';
      case 'rejeitado': return 'bg-[var(--status-rejeitado)] text-[var(--status-rejeitado-foreground)]';
      case 'cancelado': return 'bg-[var(--status-rejeitado)] text-[var(--status-rejeitado-foreground)]';
      default: return 'bg-[var(--tone-neutral-soft)] text-[var(--tone-neutral)]';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'aceite_admin': 'Aceite-Admin',
      'delegado': 'Delegado',
      'agendado': 'Agendado',
      'aprovado': 'Aprovado',
      'revisada': 'Revisada',
      'realizado': 'Reunião Realizada',
      'nao_compareceu': 'Não Compareceu',
      'rejeitado': 'Rejeitado',
      'confirmado': 'Confirmado',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  const getPurposeLabel = (purpose: string) => {
    const labels: Record<string, string> = {
      'parceria': 'Proposta de Parceria',
      'fornecimento': 'Fornecimento de Produtos/Serviços',
      'investimento': 'Busca de Investimento',
      'colaboracao': 'Colaboração Institucional',
      'apresentacao': 'Apresentação Institucional',
      'outros': 'Outros'
    };
    return labels[purpose] || purpose || 'Não informada';
  };

  const getAreaLabel = (area: string) => {
    const labels: Record<string, string> = {
      'tecnologia': 'Tecnologia',
      'consultoria': 'Consultoria',
      'marketing': 'Marketing',
      'financeiro': 'Financeiro',
      'saude': 'Saúde',
      'educacao': 'Educação',
      'outros': 'Outros'
    };
    return labels[area] || area || 'Não informada';
  };

  const handlePresentationStatusChange = async (id: string, newStatus: string, userEmail: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Sessão expirada");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/presentations/${id}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus, userEmail })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao atualizar status');
      }

      toast.success(`Carta ${newStatus === 'aprovado' ? 'aprovada' : 'rejeitada'} com sucesso!`);
      fetchData();

    } catch (error) {
 console.error('Error updating status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  // Data/hora da reuniao agendada por schedule-meeting-dialog.tsx (preferredDate +
  // time, mesclados no JSON flexivel e devolvidos directamente no recurso -
  // ver recordToResource em module-routes-helper.ts). Sem data definida nao
  // ha como saber se ja "chegou a hora", por isso trata-se como ja alcancada
  // (fail-open) em vez de esconder para sempre os botoes de resultado.
  const getScheduledDateTime = (item: any): Date | null => {
    if (!item.preferredDate) return null;
    const time = item.time || '00:00';
    const parsed = new Date(`${item.preferredDate}T${time}:00`);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const isMeetingTimeReached = (item: any): boolean => {
    const dt = getScheduledDateTime(item);
    return dt ? dt.getTime() <= Date.now() : true;
  };

  // Confirma se a reuniao agendada (carta de apresentacao ou audiencia)
  // aconteceu ou nao - sem isto o pedido ficava para sempre em "Agendado",
  // mesmo depois da data da reuniao ja ter passado.
  const handleMeetingOutcome = async (
    id: string,
    type: 'presentation' | 'audience',
    outcome: 'realizado' | 'nao_compareceu'
  ) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Sessão expirada");
        return;
      }

      const endpoint = type === 'presentation' ? 'presentations' : 'audiences';
      const response = await fetch(
        `${API_BASE_URL}/${endpoint}/${id}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: outcome })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao actualizar o estado da reunião');
      }

      toast.success(outcome === 'realizado' ? 'Reunião marcada como realizada' : 'Reunião marcada como não realizada');
      fetchData();
    } catch (error) {
 console.error('Error updating meeting outcome:', error);
      toast.error('Erro ao actualizar o estado da reunião');
    }
  };

  // Cancelar uma reuniao agendada antes de a data/hora chegar - so faz sentido
  // enquanto ainda nao houve reuniao para confirmar (ver isMeetingTimeReached).
  const handleCancelMeeting = async (id: string, type: 'presentation' | 'audience') => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Sessão expirada");
        return;
      }

      const endpoint = type === 'presentation' ? 'presentations' : 'audiences';
      const response = await fetch(
        `${API_BASE_URL}/${endpoint}/${id}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'cancelado' })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao cancelar a reunião');
      }

      toast.success('Reunião cancelada');
      fetchData();
    } catch (error) {
 console.error('Error cancelling meeting:', error);
      toast.error('Erro ao cancelar a reunião');
    }
  };

  const handleAudienceReject = async (id: string, userEmail: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Sessão expirada");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/audiences/${id}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'rejeitado', userEmail })
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao rejeitar pedido');
      }

      toast.success('Pedido de audiência rejeitado');
      fetchData();

    } catch (error) {
 console.error('Error rejecting audience:', error);
      toast.error('Erro ao rejeitar pedido');
    }
  };



  const PresentationActions = ({ item }: { item: any }) => (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Carta de Apresentação</DialogTitle>
            <DialogDescription>
              Informações completas da carta submetida
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4>Empresa</h4>
                <p>{item.company}</p>
              </div>
              <div>
                <h4>Contato</h4>
                <p>{item.contact} - {item.position}</p>
              </div>
              <div>
                <h4>E-mail</h4>
                <p>{item.email}</p>
              </div>
              <div>
                <h4>Telefone</h4>
                <p>{item.phone || 'Não informado'}</p>
              </div>
              <div>
                <h4>Área de Atuação</h4>
                <p>{getAreaLabel(item.area)}</p>
              </div>
              <div>
                <h4>Finalidade</h4>
                <p>{getPurposeLabel(item.purpose)}</p>
              </div>
              <div>
                <h4>Data de Submissão</h4>
                <p>{item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}</p>
              </div>
              <div>
                <h4>Status</h4>
                <Badge variant="none" className={getStatusColor(item.status)}>
                  {getStatusLabel(item.status)}
                </Badge>
              </div>
            </div>
            <div>
              <h4>Conteúdo da Carta</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.content}</p>
            </div>
            {item.documentPath && (
              <DocumentViewer
                filePath={item.documentPath}
                fileName={item.documentName}
              />
            )}
            {(item.status === 'agendado' && getScheduledDateTime(item)) && (
              <div className="border-t pt-4 mt-4">
                <h4 className="mb-3">Informações do Agendamento</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4>Data e Hora</h4>
                    <p>{format(getScheduledDateTime(item)!, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                  </div>
                  {item.meetingType && (
                    <div>
                      <h4>Tipo de Reunião</h4>
                      <p>{item.meetingType === 'online' ? 'Online' : item.meetingType === 'presencial' ? 'Presencial' : 'Híbrido'}</p>
                    </div>
                  )}
                  {item.meetingType === 'online' && item.platform && (
                    <div>
                      <h4>Plataforma</h4>
                      <p>{item.platform}</p>
                    </div>
                  )}
                  {item.meetingType === 'online' && item.meetingLink && (
                    <div>
                      <h4>Link da Reunião</h4>
                      <p className="text-sm break-all">
                        <a href={item.meetingLink} target="_blank" rel="noopener noreferrer" className="hover:underline" style={{ color: 'var(--ring)' }}>
                          {item.meetingLink}
                        </a>
                      </p>
                    </div>
                  )}
                  {(item.meetingType === 'presencial' || item.meetingType === 'hibrido') && item.location && (
                    <div>
                      <h4>Local</h4>
                      <p>{item.location}</p>
                    </div>
                  )}
                  {item.duration && (
                    <div>
                      <h4>Duração</h4>
                      <p>{item.duration} minutos</p>
                    </div>
                  )}
                  {item.notes && (
                    <div className="md:col-span-2">
                      <h4>Observações</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {(item.status === 'pendente' || item.status === 'delegado') && (
        <>
          {item.status === 'pendente' && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedRequest(item);
                setSelectedType('presentation');
                setAcceptDialogOpen(true);
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Aceitar
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedRequest(item);
              setSelectedType('presentation');
              setScheduleDialogOpen(true);
            }}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Agendar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedRequest(item);
              setSelectedType('presentation');
              setDelegateDialogOpen(true);
            }}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            {item.status === 'delegado' ? 'Redelegar' : 'Delegar'}
          </Button>
          {item.status === 'pendente' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handlePresentationStatusChange(item.id, 'rejeitado', item.email)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
      {item.status === 'agendado' && (
        isMeetingTimeReached(item) ? (
          <>
            <Button
              size="sm"
              className="text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--tone-success)' }}
              onClick={() => handleMeetingOutcome(item.id, 'presentation', 'realizado')}
            >
              <Check className="h-4 w-4 mr-1" />
              Aconteceu
            </Button>
            <Button
              size="sm"
              variant="outline"
              style={{ color: 'var(--tone-warn)', borderColor: 'var(--tone-warn)' }}
              onClick={() => handleMeetingOutcome(item.id, 'presentation', 'nao_compareceu')}
            >
              <X className="h-4 w-4 mr-1" />
              Não Aconteceu
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRequest(item);
                setSelectedType('presentation');
                setScheduleDialogOpen(true);
              }}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Adiar
            </Button>
            <Button
              size="sm"
              variant="outline"
              style={{ color: 'var(--tone-warn)', borderColor: 'var(--tone-warn)' }}
              onClick={() => handleCancelMeeting(item.id, 'presentation')}
            >
              <Ban className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </>
        )
      )}
      {item.status === 'delegado' && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" style={{ color: 'var(--status-delegado-foreground)', borderColor: 'var(--status-delegado-foreground)' }}>
            Delegado para {item.delegatedToName}
          </Badge>
          {item.delegado_assinatura_url && (
            <img
              src={item.delegado_assinatura_url}
              alt={`Assinatura de ${item.delegado_por_nome || ''}`}
              title={`Assinado digitalmente por ${item.delegado_por_nome || ''}`}
              className="h-6 object-contain"
            />
          )}
        </div>
      )}
      {item.status === 'aceite_admin' && (
        <Badge variant="outline" style={{ color: 'var(--status-aceite-foreground)', borderColor: 'var(--status-aceite-foreground)' }}>
          Aguardando Secretaria
        </Badge>
      )}
    </div>
  );

  const AudienceActions = ({ item }: { item: any }) => (
    <div className="flex gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido de Audiência</DialogTitle>
            <DialogDescription>
              Informações completas do pedido submetido
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4>Empresa</h4>
                <p>{item.company}</p>
              </div>
              <div>
                <h4>Requerente</h4>
                <p>{item.contact} - {item.position}</p>
              </div>
              <div>
                <h4>E-mail</h4>
                <p>{item.email}</p>
              </div>
              <div>
                <h4>Telefone</h4>
                <p>{item.phone}</p>
              </div>
              <div>
                <h4>Motivo</h4>
                <p>{item.reason}</p>
              </div>
              <div>
                <h4>Data de Submissão</h4>
                <p>{item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
              </div>
            </div>
            <div>
              <h4>Descrição Detalhada</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.description}</p>
            </div>
            {item.documentPath && (
              <DocumentViewer
                filePath={item.documentPath}
                fileName={item.documentName}
              />
            )}
            {item.status === 'agendado' && (
              <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--tone-success-soft)', borderColor: 'var(--tone-success)' }}>
                <h4>Detalhes do Agendamento</h4>
                <div className="grid gap-2 md:grid-cols-2 mt-2 text-sm">
                  <div>
                    <strong>Tipo:</strong> {item.meetingType === 'online' ? 'Online' : 'Presencial'}
                  </div>
                  {item.meetingType === 'online' && item.platform && (
                    <div>
                      <strong>Plataforma:</strong> {item.platform}
                    </div>
                  )}
                  {item.meetingType === 'presencial' && item.location && (
                    <div>
                      <strong>Local:</strong> {item.location}
                    </div>
                  )}
                  <div>
                    <strong>Data e Hora:</strong> {getScheduledDateTime(item) ? format(getScheduledDateTime(item)!, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                  </div>
                  <div>
                    <strong>Horário:</strong> {item.time || 'N/A'}
                  </div>
                  <div>
                    <strong>Duração:</strong> {item.duration || 'N/A'}
                  </div>
                  {item.meetingLink && (
                    <div className="md:col-span-2">
                      <strong>Link:</strong>{' '}
                      <a href={item.meetingLink} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                        {item.meetingLink}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div>
              <h4>Status</h4>
              <Badge className={getStatusColor(item.status)}>
                {getStatusLabel(item.status)}
              </Badge>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {(item.status === 'pendente' || item.status === 'delegado') && (
        <>
          {item.status === 'pendente' && (
            <Button
              size="sm"
              onClick={() => {
                setSelectedRequest(item);
                setSelectedType('audience');
                setAcceptDialogOpen(true);
              }}
            >
              <Check className="h-4 w-4 mr-1" />
              Aceitar
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedRequest(item);
              setSelectedType('audience');
              setScheduleDialogOpen(true);
            }}
          >
            <CalendarIcon className="h-4 w-4 mr-1" />
            Agendar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedRequest(item);
              setSelectedType('audience');
              setDelegateDialogOpen(true);
            }}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            {item.status === 'delegado' ? 'Redelegar' : 'Delegar'}
          </Button>
          {item.status === 'pendente' && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleAudienceReject(item.id, item.email)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </>
      )}
      {item.status === 'agendado' && (
        isMeetingTimeReached(item) ? (
          <>
            <Button
              size="sm"
              className="text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--tone-success)' }}
              onClick={() => handleMeetingOutcome(item.id, 'audience', 'realizado')}
            >
              <Check className="h-4 w-4 mr-1" />
              Aconteceu
            </Button>
            <Button
              size="sm"
              variant="outline"
              style={{ color: 'var(--tone-warn)', borderColor: 'var(--tone-warn)' }}
              onClick={() => handleMeetingOutcome(item.id, 'audience', 'nao_compareceu')}
            >
              <X className="h-4 w-4 mr-1" />
              Não Aconteceu
            </Button>
          </>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRequest(item);
                setSelectedType('audience');
                setScheduleDialogOpen(true);
              }}
            >
              <CalendarIcon className="h-4 w-4 mr-1" />
              Adiar
            </Button>
            <Button
              size="sm"
              variant="outline"
              style={{ color: 'var(--tone-warn)', borderColor: 'var(--tone-warn)' }}
              onClick={() => handleCancelMeeting(item.id, 'audience')}
            >
              <Ban className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </>
        )
      )}
      {item.status === 'delegado' && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" style={{ color: 'var(--status-delegado-foreground)', borderColor: 'var(--status-delegado-foreground)' }}>
            Delegado para {item.delegatedToName}
          </Badge>
          {item.delegado_assinatura_url && (
            <img
              src={item.delegado_assinatura_url}
              alt={`Assinatura de ${item.delegado_por_nome || ''}`}
              title={`Assinado digitalmente por ${item.delegado_por_nome || ''}`}
              className="h-6 object-contain"
            />
          )}
        </div>
      )}
      {item.status === 'aceite_admin' && (
        <Badge variant="outline" style={{ color: 'var(--status-aceite-foreground)', borderColor: 'var(--status-aceite-foreground)' }}>
          Aguardando Secretaria
        </Badge>
      )}
    </div>
  );

  const matchesDateFilter = (dateString: string) => {
    if (dateFilter === 'all') return true;
    if (!dateString) return false;

    const itemDate = new Date(dateString);
    const now = new Date();

    switch (dateFilter) {
      case 'today':
        return isToday(itemDate);
      case 'yesterday':
        return isYesterday(itemDate);
      case 'last7days':
        return isWithinInterval(itemDate, {
          start: subDays(now, 7),
          end: now
        });
      case 'last30days':
        return isWithinInterval(itemDate, {
          start: subDays(now, 30),
          end: now
        });
      case 'thisMonth':
        return isWithinInterval(itemDate, {
          start: startOfMonth(now),
          end: endOfMonth(now)
        });
      default:
        return true;
    }
  };

  const filteredPresentations = presentations.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesDate = matchesDateFilter(item.createdAt);
    return matchesStatus && matchesDate;
  });

  const filteredAudiences = audiences.filter(item => {
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesDate = matchesDateFilter(item.createdAt);
    return matchesStatus && matchesDate;
  });

  const presentationsRecebido = filteredPresentations.filter(p => p.status === 'pendente');
  const presentationsAceites = filteredPresentations.filter(p => p.status === 'aprovado' || p.status === 'aceite_admin' || p.status === 'delegado');
  const presentationsAgendados = filteredPresentations.filter(p => p.status === 'agendado');
  const audiencesRecebido = filteredAudiences.filter(a => a.status === 'pendente');
  const audiencesAceites = filteredAudiences.filter(a => a.status === 'aprovado' || a.status === 'aceite_admin' || a.status === 'delegado');
  const audiencesAgendados = filteredAudiences.filter(a => a.status === 'agendado');

  const presentationsRecebidoPag = useClientPagination(presentationsRecebido);
  const presentationsAceitesPag = useClientPagination(presentationsAceites);
  const presentationsAgendadosPag = useClientPagination(presentationsAgendados);
  const audiencesRecebidoPag = useClientPagination(audiencesRecebido);
  const audiencesAceitesPag = useClientPagination(audiencesAceites);
  const audiencesAgendadosPag = useClientPagination(audiencesAgendados);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--ring)', fontSize: '13px', fontWeight: 600 }}>
          Solicitações
        </div>
        <h1 className="font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)' }}>Gerenciar Solicitações</h1>
        <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)' }}>Acompanhe e gerencie cartas de apresentação e pedidos de audiência</p>
      </div>

      <div className="flex gap-3 justify-end">
        <div className="w-[200px]">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-11" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '11px' }}>
              <SelectValue placeholder="Filtrar por data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as datas</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="last7days">Últimos 7 dias</SelectItem>
              <SelectItem value="last30days">Últimos 30 dias</SelectItem>
              <SelectItem value="thisMonth">Este mês</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="presentations">
        <TabsList className="grid grid-cols-2 max-w-[70%] mx-auto">
          <TabsTrigger value="presentations">
            <FileText className="h-4 w-4 mr-2" />
            Cartas de Apresentação ({filteredPresentations.length})
          </TabsTrigger>
          <TabsTrigger value="audiences">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Audiências ({filteredAudiences.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="presentations" className="space-y-4">
          <Tabs defaultValue="recebido">
            <TabsList className="grid grid-cols-3 max-w-[70%] mx-auto">
              <TabsTrigger value="recebido">
                Recebido ({presentationsRecebido.length})
              </TabsTrigger>
              <TabsTrigger value="aceites">
                Aceites ({presentationsAceites.length})
              </TabsTrigger>
              <TabsTrigger value="agendados">
                Agendado ({presentationsAgendados.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recebido">
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <p className="text-center text-muted-foreground">A carregar...</p>
                  ) : presentationsRecebido.length === 0 ? (
                    <p className="text-center text-muted-foreground">Nenhuma carta recebida</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Ramo de Actuação</TableHead>
                          <TableHead>Assunto</TableHead>
                          <TableHead>Requerente</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {presentationsRecebidoPag.pageItems
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.company}</TableCell>
                              <TableCell>{getAreaLabel(item.area)}</TableCell>
                              <TableCell>{getPurposeLabel(item.purpose)}</TableCell>
                              <TableCell>
                                <div>
                                  <p>{item.contact}</p>
                                  <p className="text-xs text-muted-foreground">{item.position}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(item.status)}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <PresentationActions item={item} />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                  <PaginationBar pagination={presentationsRecebidoPag.pagination} onPageChange={presentationsRecebidoPag.setPage} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="aceites">
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <p className="text-center text-muted-foreground">A carregar...</p>
                  ) : presentationsAceites.length === 0 ? (
                    <p className="text-center text-muted-foreground">Nenhuma carta aceite</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Ramo de Actuação</TableHead>
                          <TableHead>Assunto</TableHead>
                          <TableHead>Requerente</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {presentationsAceitesPag.pageItems
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.company}</TableCell>
                              <TableCell>{getAreaLabel(item.area)}</TableCell>
                              <TableCell>{getPurposeLabel(item.purpose)}</TableCell>
                              <TableCell>
                                <div>
                                  <p>{item.contact}</p>
                                  <p className="text-xs text-muted-foreground">{item.position}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(item.status)}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <PresentationActions item={item} />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                  <PaginationBar pagination={presentationsAceitesPag.pagination} onPageChange={presentationsAceitesPag.setPage} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agendados">
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <p className="text-center text-muted-foreground">A carregar...</p>
                  ) : presentationsAgendados.length === 0 ? (
                    <p className="text-center text-muted-foreground">Nenhuma carta agendada</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Ramo de Actuação</TableHead>
                          <TableHead>Assunto</TableHead>
                          <TableHead>Requerente</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {presentationsAgendadosPag.pageItems
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.company}</TableCell>
                              <TableCell>{getAreaLabel(item.area)}</TableCell>
                              <TableCell>{getPurposeLabel(item.purpose)}</TableCell>
                              <TableCell>
                                <div>
                                  <p>{item.contact}</p>
                                  <p className="text-xs text-muted-foreground">{item.position}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(item.status)}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <PresentationActions item={item} />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                  <PaginationBar pagination={presentationsAgendadosPag.pagination} onPageChange={presentationsAgendadosPag.setPage} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="audiences" className="space-y-4">
          <Tabs defaultValue="recebido">
            <TabsList className="grid grid-cols-3 max-w-[70%] mx-auto">
              <TabsTrigger value="recebido">
                Recebido ({audiencesRecebido.length})
              </TabsTrigger>
              <TabsTrigger value="aceites">
                Aceites ({audiencesAceites.length})
              </TabsTrigger>
              <TabsTrigger value="agendados">
                Agendado ({audiencesAgendados.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recebido">
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <p className="text-center text-muted-foreground">A carregar...</p>
                  ) : audiencesRecebido.length === 0 ? (
                    <p className="text-center text-muted-foreground">Nenhum pedido recebido</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Assunto</TableHead>
                          <TableHead>Requerente</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {audiencesRecebidoPag.pageItems
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.company}</TableCell>
                              <TableCell>{item.reason}</TableCell>
                              <TableCell>
                                <div>
                                  <p>{item.contact}</p>
                                  <p className="text-xs text-muted-foreground">{item.position}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(item.status)}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <AudienceActions item={item} />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                  <PaginationBar pagination={audiencesRecebidoPag.pagination} onPageChange={audiencesRecebidoPag.setPage} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="aceites">
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <p className="text-center text-muted-foreground">A carregar...</p>
                  ) : audiencesAceites.length === 0 ? (
                    <p className="text-center text-muted-foreground">Nenhum pedido aceite</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Assunto</TableHead>
                          <TableHead>Requerente</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {audiencesAceitesPag.pageItems
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.company}</TableCell>
                              <TableCell>{item.reason}</TableCell>
                              <TableCell>
                                <div>
                                  <p>{item.contact}</p>
                                  <p className="text-xs text-muted-foreground">{item.position}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(item.status)}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <AudienceActions item={item} />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                  <PaginationBar pagination={audiencesAceitesPag.pagination} onPageChange={audiencesAceitesPag.setPage} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="agendados">
              <Card>
                <CardContent className="pt-6">
                  {loading ? (
                    <p className="text-center text-muted-foreground">A carregar...</p>
                  ) : audiencesAgendados.length === 0 ? (
                    <p className="text-center text-muted-foreground">Nenhum pedido agendado</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Assunto</TableHead>
                          <TableHead>Requerente</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {audiencesAgendadosPag.pageItems
                          .map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.company}</TableCell>
                              <TableCell>{item.reason}</TableCell>
                              <TableCell>
                                <div>
                                  <p>{item.contact}</p>
                                  <p className="text-xs text-muted-foreground">{item.position}</p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusColor(item.status)}>
                                  {getStatusLabel(item.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <AudienceActions item={item} />
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  )}
                  <PaginationBar pagination={audiencesAgendadosPag.pagination} onPageChange={audiencesAgendadosPag.setPage} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      {selectedRequest && (
        <>
          <AcceptRequestDialog
            open={acceptDialogOpen}
            onOpenChange={setAcceptDialogOpen}
            request={selectedRequest}
            type={selectedType}
            onSuccess={fetchData}
          />
          <DelegateDialog
            open={delegateDialogOpen}
            onOpenChange={setDelegateDialogOpen}
            request={selectedRequest}
            type={selectedType}
            onSuccess={fetchData}
          />
          <ScheduleMeetingDialog
            open={scheduleDialogOpen}
            onOpenChange={setScheduleDialogOpen}
            audience={selectedRequest}
            type={selectedType}
            onSuccess={fetchData}
          />
        </>
      )}
    </div>
  );
}