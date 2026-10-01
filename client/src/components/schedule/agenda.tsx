import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Calendar as CalendarIcon, Clock, MapPin, Video, Users, UserPlus, FileText } from "lucide-react";
import { format, isSameDay } from "date-fns@4.1.0";
import { ptBR } from "date-fns@4.1.0/locale";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL } from '@/services/api';
import { useAuth } from "../auth/auth-context";
import { hasPermission } from "../auth/permissions";
import { AgendarReuniaoExternaDialog } from "./agendar-reuniao-externa-dialog";
import { useActas } from "../../hooks/useActas";

interface AgendaProps {
  // Navega para o Livro de Actas (menu principal) já com esta acta aberta,
  // em vez de mostrar a acta num dialog dentro da própria Agenda.
  onNavigateToActa?: (actaId: string) => void;
}

export function Agenda({ onNavigateToActa }: AgendaProps = {}) {
  const { user, accessToken } = useAuth();
  const { actas } = useActas();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [presentations, setPresentations] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [internalMeetings, setInternalMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agendarExternaOpen, setAgendarExternaOpen] = useState(false);

  const podeAgendarExterna = user ? hasPermission(user.role, 'MANAGE_SCHEDULE') : false;

  useEffect(() => {
    fetchScheduledMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchScheduledMeetings = async () => {
    setLoading(true);
    try {
      const token = accessToken || localStorage.getItem('access_token');
      if (!token) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const headers = { 'Authorization': `Bearer ${token}` };

      const [presentationsResponse, audiencesResponse, internalMeetingsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/presentations?all=true`, { headers }),
        fetch(`${API_BASE_URL}/audiences?all=true`, { headers }),
        fetch(`${API_BASE_URL}/internal-meetings`, { headers }),
      ]);

      if (presentationsResponse.ok) {
        const data = await presentationsResponse.json();
        setPresentations(data.data || []);
      } else {
 console.error('Presentations fetch failed:', presentationsResponse.status);
      }

      if (audiencesResponse.ok) {
        const data = await audiencesResponse.json();
        setAudiences(data.data || []);
      } else {
 console.error('Audiences fetch failed:', audiencesResponse.status);
      }

      if (internalMeetingsResponse.ok) {
        const data = await internalMeetingsResponse.json();
        setInternalMeetings(data.meetings || []);
      } else {
 console.error('Internal meetings fetch failed:', internalMeetingsResponse.status);
      }

    } catch (error) {
 console.error('Error fetching scheduled meetings:', error);
      toast.error('Erro ao carregar reuniões agendadas');
    } finally {
      setLoading(false);
    }
  };

  // Uma solicitação (carta de apresentação/audiência) pertence à agenda pessoal
  // do utilizador quando foi ele quem a submeteu OU quando a secretaria a
  // agendou especificamente para ele.
  const pertenceAoUtilizador = (item: any) => {
    if (!user) return false;
    return item.created_by_id === user.id || item.assigned_to_id === user.id;
  };

  // Converter os dados da API Express para o formato unificado de reuniões da agenda
  const getAllMeetings = () => {
    const allMeetings: any[] = [];

    presentations
      .filter((p: any) => p.status === 'agendado' && pertenceAoUtilizador(p))
      .forEach((pres: any) => {
        if (pres.preferredDate) {
          allMeetings.push({
            id: `pres-${pres.id}`,
            type_source: 'presentation',
            company: pres.company || pres.assigned_to_name || 'N/A',
            contact: pres.contactName || pres.contact || 'N/A',
            email: pres.contactEmail || pres.email || 'N/A',
            phone: pres.contactPhone || pres.phone || 'N/A',
            type: pres.meetingType || 'presencial',
            platform: pres.platform || '',
            date: new Date(pres.preferredDate),
            time: pres.time || '00:00',
            duration: pres.duration || '1h',
            status: 'confirmado',
            meetingLink: pres.meetingLink || '',
            location: pres.location || 'A definir',
            agenda: pres.purpose || pres.reason || 'Carta de apresentação',
            scheduledBy: pres.scheduledBy || 'Sistema',
            assignedToName: pres.assigned_to_name || null,
          });
        }
      });

    audiences
      .filter((a: any) => a.status === 'agendado' && pertenceAoUtilizador(a))
      .forEach((aud: any) => {
        if (aud.preferredDate) {
          allMeetings.push({
            id: `aud-${aud.id}`,
            type_source: 'audience',
            company: aud.organization || aud.assigned_to_name || 'N/A',
            contact: aud.requestorName || aud.contact || 'N/A',
            email: aud.requestorEmail || aud.email || 'N/A',
            phone: aud.requestorPhone || aud.phone || 'N/A',
            type: aud.meetingType || 'presencial',
            platform: aud.platform || '',
            date: new Date(aud.preferredDate),
            time: aud.time || '00:00',
            duration: aud.duration || '1h',
            status: 'confirmado',
            meetingLink: aud.meetingLink || '',
            location: aud.location || 'A definir',
            agenda: aud.purpose || aud.reason || 'Pedido de audiência',
            scheduledBy: aud.scheduledBy || 'Sistema',
            assignedToName: aud.assigned_to_name || null,
          });
        }
      });

    // Reuniões internas: o backend já devolve apenas as reuniões em que o
    // utilizador é organizador ou participante.
    internalMeetings.forEach((m: any) => {
      if (m.meeting_date) {
        allMeetings.push({
          id: `int-${m.id}`,
          rawId: m.id,
          type_source: 'internal_meeting',
          company: m.orgao || 'Reunião Interna',
          contact: m.organizer?.name || 'N/A',
          email: m.organizer?.email || 'N/A',
          phone: '',
          type: m.meeting_type === 'online' ? 'online' : 'presencial',
          platform: m.platform || '',
          date: new Date(m.meeting_date),
          time: m.start_time || '00:00',
          duration: m.end_time ? `${m.start_time} - ${m.end_time}` : '1h',
          status: m.status || 'confirmado',
          meetingLink: m.meeting_link || '',
          location: m.location || 'A definir',
          agenda: m.title || 'Reunião Interna',
          scheduledBy: m.organizer?.name || 'Sistema',
          descricao: m.description,
          pontosAgenda: m.pontos_agenda || [],
          participantes: m.participantes || [],
          tipoReuniao: m.tipo_reuniao,
        });
      }
    });

    // Ordenar por data e hora
    return allMeetings.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });
  };

  const meetings = getAllMeetings();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmado': return 'bg-tone-success-soft text-tone-success';
      case 'pendente': return 'bg-tone-warn-soft text-tone-warn';
      case 'cancelado': return 'bg-tone-danger-soft text-tone-danger';
      case 'realizado': return 'bg-tone-info-soft text-tone-info';
      default: return 'bg-tone-neutral-soft text-tone-neutral';
    }
  };

  const getTypeSourceLabel = (typeSource: string) => {
    switch (typeSource) {
      case 'internal_meeting': return 'Reunião Interna';
      case 'presentation': return 'Carta de Apresentação';
      case 'audience': return 'Audiência';
      default: return 'Reunião';
    }
  };

  const getMeetingsForDate = (date: Date) => {
    return meetings.filter(meeting => isSameDay(meeting.date, date));
  };

  const selectedDateMeetings = getMeetingsForDate(selectedDate);

  const getDatesWithMeetings = () => {
    return meetings.map(meeting => meeting.date);
  };

  const MeetingDetails = ({ meeting }: { meeting: any }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Ver Detalhes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{meeting.agenda}</DialogTitle>
          <DialogDescription>
            {getTypeSourceLabel(meeting.type_source)} · {format(meeting.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {meeting.type_source === 'internal_meeting' ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4>Organizador</h4>
                  <p>{meeting.contact}</p>
                  <p className="text-sm text-muted-foreground">{meeting.email}</p>
                </div>
                <div className="space-y-2">
                  <h4>Tipo de Reunião</h4>
                  <p className="capitalize">{meeting.tipoReuniao || 'Ordinária'}</p>
                </div>
              </div>
              {meeting.descricao && (
                <div className="space-y-2">
                  <h4>Descrição</h4>
                  <p className="text-sm text-muted-foreground">{meeting.descricao}</p>
                </div>
              )}
              {meeting.participantes?.length > 0 && (
                <div className="space-y-2">
                  <h4>Participantes</h4>
                  <ul className="text-sm text-muted-foreground list-disc list-inside">
                    {meeting.participantes.map((p: any, i: number) => (
                      <li key={p.id || i}>{p.nome || p.name}{p.cargo ? ` — ${p.cargo}` : ''}</li>
                    ))}
                  </ul>
                </div>
              )}
              {meeting.pontosAgenda?.length > 0 && (
                <div className="space-y-2">
                  <h4>Pontos da Agenda</h4>
                  <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
                    {meeting.pontosAgenda.map((ponto: any, i: number) => (
                      <li key={i}>
                        {typeof ponto === 'string' ? ponto : (
                          <>
                            {ponto?.titulo || 'Ponto de agenda'}
                            {ponto?.tempo_estimado ? ` (${ponto.tempo_estimado} min)` : ''}
                            {ponto?.descricao ? ` — ${ponto.descricao}` : ''}
                          </>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {(() => {
                const actaVinculada = actas.find((a) => a.reuniao_interna_id === meeting.rawId);
                return (
                  <div className="space-y-2">
                    <h4>Acta da Reunião</h4>
                    {actaVinculada ? (
                      // Navega para o Livro de Actas (menu principal) com esta
                      // acta já aberta, em vez de abrir outro dialog por cima.
                      <Button size="sm" variant="outline" className="gap-2" onClick={() => onNavigateToActa?.(actaVinculada.id)}>
                        <FileText className="h-4 w-4" />
                        Ver Acta
                      </Button>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhuma acta registada para esta reunião.</p>
                    )}
                  </div>
                );
              })()}
            </>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4>Empresa/Organização</h4>
                  <p>{meeting.company}</p>
                </div>
                <div className="space-y-2">
                  <h4>Contacto</h4>
                  <p>{meeting.contact}</p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4>E-mail</h4>
                  <p>{meeting.email}</p>
                </div>
                <div className="space-y-2">
                  <h4>Telefone</h4>
                  <p>{meeting.phone}</p>
                </div>
              </div>
              {meeting.assignedToName && (
                <div className="space-y-2">
                  <h4>Agendado para</h4>
                  <p>{meeting.assignedToName}</p>
                </div>
              )}
            </>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4>Data/Hora</h4>
              <p>{format(meeting.date, "dd/MM/yyyy", { locale: ptBR })} às {meeting.time}</p>
            </div>
            <div className="space-y-2">
              <h4>Duração</h4>
              <p>{meeting.duration}</p>
            </div>
            <div className="space-y-2">
              <h4>Status</h4>
              <Badge className={getStatusColor(meeting.status)}>
                {meeting.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4>Local</h4>
            <div className="flex items-center gap-2">
              {meeting.type === 'online' ? (
                <>
                  <Video className="h-4 w-4" />
                  <span>Online - {meeting.platform}</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4" />
                  <span>Presencial - {meeting.location}</span>
                </>
              )}
            </div>
          </div>

          {meeting.meetingLink && (
            <div className="space-y-2">
              <h4>Link da Reunião</h4>
              <a
                href={meeting.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: 'var(--ring)' }}
              >
                {meeting.meetingLink}
              </a>
            </div>
          )}

          {meeting.type_source !== 'internal_meeting' && (
            <div className="space-y-2">
              <h4>Assunto</h4>
              <p className="text-sm text-muted-foreground">{meeting.agenda}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1>Minha Agenda</h1>
          <p className="text-muted-foreground">
            Reuniões internas e solicitações agendadas para si
          </p>
        </div>
        {podeAgendarExterna && (
          <Button onClick={() => setAgendarExternaOpen(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Agendar Reunião Externa
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Calendário</CardTitle>
            <CardDescription>
              Selecione uma data para ver as reuniões agendadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              modifiers={{
                meeting: getDatesWithMeetings()
              }}
              modifiersStyles={{
                meeting: {
                  backgroundColor: 'var(--color-primary)',
                  color: 'white',
                  borderRadius: '50%'
                }
              }}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Reuniões para {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </CardTitle>
              <CardDescription>
                {selectedDateMeetings.length} reunião(ões) agendada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">A carregar...</p>
                </div>
              ) : selectedDateMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma reunião agendada para esta data</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateMeetings.map((meeting) => (
                    <div key={meeting.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3>{meeting.agenda}</h3>
                            <Badge variant="outline">{getTypeSourceLabel(meeting.type_source)}</Badge>
                            <Badge className={getStatusColor(meeting.status)}>
                              {meeting.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {meeting.time} ({meeting.duration})
                            </div>
                            <div className="flex items-center gap-1">
                              {meeting.type === 'online' ? (
                                <>
                                  <Video className="h-4 w-4" />
                                  {meeting.platform}
                                </>
                              ) : (
                                <>
                                  <MapPin className="h-4 w-4" />
                                  {meeting.location}
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {meeting.contact}
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground">
                            {meeting.company}
                          </p>
                        </div>

                        <MeetingDetails meeting={meeting} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Reuniões</CardTitle>
              <CardDescription>
                Resumo das suas próximas reuniões agendadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {meetings
                  .filter(meeting => meeting.date >= new Date(new Date().setHours(0, 0, 0, 0)))
                  .slice(0, 5)
                  .map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{meeting.agenda}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(meeting.date, "dd/MM", { locale: ptBR })} às {meeting.time} · {getTypeSourceLabel(meeting.type_source)}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                {meetings.filter(meeting => meeting.date >= new Date(new Date().setHours(0, 0, 0, 0))).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Sem reuniões futuras agendadas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {podeAgendarExterna && (
        <AgendarReuniaoExternaDialog
          open={agendarExternaOpen}
          onOpenChange={setAgendarExternaOpen}
          onSuccess={fetchScheduledMeetings}
        />
      )}
    </div>
  );
}
