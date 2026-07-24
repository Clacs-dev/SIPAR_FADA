import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Calendar as CalendarIcon, Clock, MapPin, Video, Users, Phone } from "lucide-react";
import { format, isSameDay } from "date-fns@4.1.0";
import { ptBR } from "date-fns@4.1.0/locale";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export function Agenda() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [presentations, setPresentations] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScheduledMeetings();
  }, []);

  const fetchScheduledMeetings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

 console.log('Fetching all scheduled meetings from system...');

      // Fetch presentations
      const presentationsResponse = await fetch(
        `${API_BASE_URL}/presentations`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // Fetch audiences
      const audiencesResponse = await fetch(
        `${API_BASE_URL}/audiences`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (presentationsResponse.ok) {
        const data = await presentationsResponse.json();
        // Filtrar apenas as agendadas
        const scheduled = data.data?.filter((p: any) => p.status === 'agendado') || [];
 console.log('Presentations agendadas:', scheduled.length);
        setPresentations(scheduled);
      } else {
 console.error('Presentations fetch failed:', presentationsResponse.status);
      }

      if (audiencesResponse.ok) {
        const data = await audiencesResponse.json();
        // Filtrar apenas as agendadas
        const scheduled = data.data?.filter((a: any) => a.status === 'agendado') || [];
 console.log('Audiences agendadas:', scheduled.length);
        setAudiences(scheduled);
      } else {
 console.error('Audiences fetch failed:', audiencesResponse.status);
      }

    } catch (error) {
 console.error('Error fetching scheduled meetings:', error);
      toast.error('Erro ao carregar reuniões agendadas');
    } finally {
      setLoading(false);
    }
  };

  // Converter os dados da API Express para o formato de reuniões
  const getAllMeetings = () => {
    const allMeetings: any[] = [];

    // Adicionar apresentações agendadas
    presentations.forEach((pres: any) => {
      if (pres.preferredDate) {
        allMeetings.push({
          id: `pres-${pres.id}`,
          type_source: 'presentation',
          company: pres.company || 'N/A',
          contact: pres.contact || pres.contactPerson || 'N/A',
          position: pres.position || 'N/A',
          email: pres.email || 'N/A',
          phone: pres.phone || 'N/A',
          type: pres.meetingType || 'presencial',
          platform: pres.platform || '',
          date: new Date(pres.preferredDate),
          time: pres.time || '00:00',
          duration: pres.duration || '1h',
          status: 'confirmado',
          meetingLink: pres.meetingLink || '',
          location: pres.location || 'A definir',
          agenda: pres.reason || pres.message || 'Carta de apresentação',
          scheduledBy: pres.scheduledBy || 'Sistema'
        });
      }
    });

    // Adicionar audiências agendadas
    audiences.forEach((aud: any) => {
      if (aud.preferredDate) {
        allMeetings.push({
          id: `aud-${aud.id}`,
          type_source: 'audience',
          company: aud.company || 'N/A',
          contact: aud.contact || aud.contactPerson || 'N/A',
          position: aud.position || 'N/A',
          email: aud.email || 'N/A',
          phone: aud.phone || 'N/A',
          type: aud.meetingType || 'presencial',
          platform: aud.platform || '',
          date: new Date(aud.preferredDate),
          time: aud.time || '00:00',
          duration: aud.duration || '1h',
          status: 'confirmado',
          meetingLink: aud.meetingLink || '',
          location: aud.location || 'A definir',
          agenda: aud.reason || aud.subject || 'Pedido de audiência',
          scheduledBy: aud.scheduledBy || 'Sistema'
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
      case 'confirmado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'cancelado': return 'bg-red-100 text-red-800';
      case 'realizado': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Reunião</DialogTitle>
          <DialogDescription>
            {meeting.company} - {format(meeting.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h4>Empresa</h4>
              <p>{meeting.company}</p>
            </div>
            <div className="space-y-2">
              <h4>Contato</h4>
              <p>{meeting.contact}</p>
              <p className="text-sm text-muted-foreground">{meeting.position}</p>
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
            <h4>Tipo de Reunião</h4>
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
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {meeting.meetingLink}
              </a>
            </div>
          )}

          <div className="space-y-2">
            <h4>Agenda</h4>
            <p className="text-sm text-muted-foreground">{meeting.agenda}</p>
          </div>

          <div className="flex gap-2">
            <Button size="sm">
              <Phone className="h-4 w-4 mr-2" />
              Ligar
            </Button>
            <Button size="sm" variant="outline">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Reagendar
            </Button>
            <Button size="sm" variant="outline">
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Agenda de Reuniões</h1>
        <p className="text-muted-foreground">Visualize e gerencie todas as audiências agendadas</p>
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
              {selectedDateMeetings.length === 0 ? (
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
                          <div className="flex items-center gap-2">
                            <h3>{meeting.company}</h3>
                            <Badge className={getStatusColor(meeting.status)}>
                              {meeting.status}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                                  Presencial
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {meeting.contact}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {meeting.agenda}
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
                Resumo das próximas audiências confirmadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {meetings
                  .filter(meeting => meeting.date >= new Date() && meeting.status === 'confirmado')
                  .slice(0, 3)
                  .map((meeting) => (
                    <div key={meeting.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">{meeting.company}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(meeting.date, "dd/MM", { locale: ptBR })} às {meeting.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(meeting.status)}>
                          {meeting.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}