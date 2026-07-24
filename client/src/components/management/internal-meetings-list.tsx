import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { Calendar, Clock, Users, Video, MapPin, Eye, CheckCircle, XCircle, Edit, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { api } from "../../services/api";
import { useAuth } from "../auth/auth-context";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { useActas } from "../../hooks/useActas";

export function InternalMeetingsList() {
  const { user } = useAuth();
  const { createActa } = useActas();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingActa, setGeneratingActa] = useState(false);

  useEffect(() => {
    loadMeetings();
  }, [user]);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ meetings: any[] }>('/internal-meetings');
      setMeetings(res.meetings || []);
    } catch (error) {
 console.error('Erro ao carregar reuniões:', error);
      toast.error('Erro ao carregar reuniões internas');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (meetingId: string, newStatus: string) => {
    try {
      await api.put(`/internal-meetings/${meetingId}`, { status: newStatus });
      toast.success('Status atualizado com sucesso!');
      loadMeetings();
    } catch (error) {
 console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (meetingId: string) => {
    try {
      await api.delete(`/internal-meetings/${meetingId}`);
      toast.success('Reunião cancelada com sucesso!');
      loadMeetings();
    } catch (error) {
 console.error('Erro ao cancelar reunião:', error);
      toast.error('Erro ao cancelar reunião');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pendente': 'bg-yellow-500',
      'confirmado': 'bg-blue-500',
      'concluido': 'bg-green-500',
      'cancelado': 'bg-red-500',
      'reagendado': 'bg-orange-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'confirmado': 'Confirmado',
      'concluido': 'Concluído',
      'cancelado': 'Cancelado',
      'reagendado': 'Reagendado'
    };
    return labels[status] || status;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'baixa': 'bg-gray-500',
      'normal': 'bg-blue-500',
      'alta': 'bg-orange-500',
      'urgente': 'bg-red-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'baixa': 'Baixa',
      'normal': 'Normal',
      'alta': 'Alta',
      'urgente': 'Urgente'
    };
    return labels[priority] || priority;
  };

  const filterMeetings = (status: string) => {
    if (status === 'todas') return meetings;
    return meetings.filter(m => m.status === status);
  };

  const handleGenerateActa = async (meeting: any) => {
    setGeneratingActa(true);
    try {
      const res = await api.get<{ actas: any[] }>('/actas');
      const acta = res.actas?.find(a => a.reuniao_interna_id === meeting.id);

      if (acta) {
        toast.success('Acta encontrada! Redirecionando...');
        setTimeout(() => {
          window.location.hash = '#/actas';
        }, 1000);
      } else {
        toast.info('Nenhuma acta encontrada para esta reunião.');
      }
    } catch (error) {
 console.error('Erro ao buscar acta:', error);
      toast.error('Erro ao buscar acta');
    } finally {
      setGeneratingActa(false);
    }
  };

  const MeetingDetails = ({ meeting }: { meeting: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{meeting.title}</DialogTitle>
          <DialogDescription>
            Detalhes da reunião interna
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-1">Status</h4>
              <Badge className={getStatusColor(meeting.status)}>
                {getStatusLabel(meeting.status)}
              </Badge>
            </div>
            <div>
              <h4 className="mb-1">Prioridade</h4>
              <Badge className={getPriorityColor(meeting.priority)}>
                {getPriorityLabel(meeting.priority)}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-1">Organizador</h4>
              <p className="text-sm">{meeting.organizer?.name}</p>
              <p className="text-xs text-muted-foreground">{meeting.organizer?.email}</p>
            </div>
            <div>
              <h4 className="mb-1">Participante</h4>
              <p className="text-sm">{meeting.participant?.name}</p>
              <p className="text-xs text-muted-foreground">{meeting.participant?.email}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Data
              </h4>
              <p className="text-sm">
                {meeting.meeting_date ? format(new Date(meeting.meeting_date), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
              </p>
            </div>
            <div>
              <h4 className="mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário
              </h4>
              <p className="text-sm">{meeting.start_time} - {meeting.end_time}</p>
            </div>
          </div>

          <div>
            <h4 className="mb-1">Tipo de Reunião</h4>
            <div className="flex items-center gap-2">
              {meeting.meeting_type === 'online' ? (
                <>
                  <Video className="h-4 w-4" />
                  <span className="text-sm">Online {meeting.platform && `- ${meeting.platform}`}</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">Presencial</span>
                </>
              )}
            </div>
          </div>

          {meeting.meeting_link && (
            <div>
              <h4 className="mb-1">Link da Reunião</h4>
              <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                {meeting.meeting_link}
              </a>
            </div>
          )}

          {meeting.location && (
            <div>
              <h4 className="mb-1">Local</h4>
              <p className="text-sm">{meeting.location}</p>
            </div>
          )}

          {meeting.description && (
            <div className="w-full">
              <h4 className="mb-1">Descrição/Agenda</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words w-full overflow-visible">
                {meeting.description}
              </p>
            </div>
          )}

          {meeting.organizer_id === user?.id && meeting.status === 'pendente' && (
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => handleStatusChange(meeting.id, 'confirmado')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex-1" variant="destructive">
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancelar Reunião</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja cancelar esta reunião? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Voltar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDelete(meeting.id)}>
                      Confirmar Cancelamento
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Botão para Ver Acta */}
          <div className="pt-4 border-t">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => handleGenerateActa(meeting)}
              disabled={generatingActa}
            >
              {generatingActa ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Procurando Acta...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Acta
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Uma acta foi criada automaticamente para esta reunião
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">A carregar reuniões...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Minhas Reuniões Internas
        </CardTitle>
        <CardDescription>
          Reuniões agendadas com outros membros da equipa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="todas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="confirmado">Confirmadas</TabsTrigger>
            <TabsTrigger value="concluido">Concluídas</TabsTrigger>
          </TabsList>

          {['todas', 'pendente', 'confirmado', 'concluido'].map(status => (
            <TabsContent key={status} value={status}>
              {filterMeetings(status).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma reunião encontrada
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Com</TableHead>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Prioridade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterMeetings(status).map((meeting) => (
                        <TableRow key={meeting.id}>
                          <TableCell>{meeting.title}</TableCell>
                          <TableCell>
                            {meeting.organizer_id === user?.id 
                              ? meeting.participant?.name 
                              : meeting.organizer?.name}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {meeting.meeting_date && format(new Date(meeting.meeting_date), "dd/MM/yyyy", { locale: ptBR })}
                              <br />
                              <span className="text-muted-foreground">{meeting.start_time}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {meeting.meeting_type === 'online' ? (
                              <Badge variant="outline" className="gap-1">
                                <Video className="h-3 w-3" />
                                Online
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="gap-1">
                                <MapPin className="h-3 w-3" />
                                Presencial
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(meeting.priority)}>
                              {getPriorityLabel(meeting.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(meeting.status)}>
                              {getStatusLabel(meeting.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <MeetingDetails meeting={meeting} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}