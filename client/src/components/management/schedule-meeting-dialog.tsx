import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { format } from "date-fns@4.1.0";
import { ptBR } from "date-fns@4.1.0/locale";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { Alert, AlertDescription } from "../ui/alert";
import { useAvailableMeetingPlatforms } from "../../hooks/use-available-meeting-platforms";
import { useMeetingRooms, checkRoomAvailability, type RoomConflict, ROOM_CONFLICT_TYPE_LABEL } from "../../hooks/use-meeting-rooms";

// Duracao->minutos usada so para calcular a hora de fim ao verificar
// disponibilidade da sala (este formulario nao pede hora de fim explicita,
// so um rotulo de duracao) - tem de bater com EXTERNAL_DURATION_MINUTES em
// server/src/routes/meeting-rooms.routes.ts.
const DURATION_MINUTES: Record<string, number> = { '30min': 30, '1h': 60, '1h30': 90, '2h': 120 };

function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h || 0) * 60 + (m || 0) + minutes;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

interface ScheduleMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audience: any;
  type?: 'presentation' | 'audience';
  onSuccess?: () => void;
  onScheduleComplete?: () => void;
}

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  audience,
  type = 'audience',
  onSuccess,
  onScheduleComplete
}: ScheduleMeetingDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date>();
  const { platforms: availablePlatforms, loading: loadingPlatforms } = useAvailableMeetingPlatforms();
  const { rooms } = useMeetingRooms();
  const [roomConflict, setRoomConflict] = useState<RoomConflict[] | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);
  const [meetingData, setMeetingData] = useState({
    meetingType: '',
    platform: '',
    time: '',
    duration: '',
    roomId: '',
    location: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setMeetingData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (!meetingData.roomId || !date || !meetingData.time || !meetingData.duration) {
      setRoomConflict(null);
      return;
    }

    let cancelled = false;
    setCheckingRoom(true);
    const horaFim = addMinutesToTime(meetingData.time, DURATION_MINUTES[meetingData.duration] ?? 240);
    checkRoomAvailability({
      roomId: meetingData.roomId,
      data: format(date, 'yyyy-MM-dd'),
      horaInicio: meetingData.time,
      horaFim,
      excludeMeetingId: audience?.id,
    })
      .then((result) => {
        if (!cancelled) setRoomConflict(result.disponivel ? null : result.conflitos);
      })
      .catch(() => {
        if (!cancelled) setRoomConflict(null);
      })
      .finally(() => {
        if (!cancelled) setCheckingRoom(false);
      });

    return () => { cancelled = true; };
  }, [meetingData.roomId, meetingData.time, meetingData.duration, date, audience?.id]);

  const handleSchedule = async () => {
    if (!date || !meetingData.meetingType || !meetingData.time || !meetingData.duration) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    if (meetingData.meetingType === 'online' && !meetingData.platform) {
      toast.error("Por favor, selecione a plataforma de reunião");
      return;
    }

    if (meetingData.meetingType === 'presencial' && !meetingData.roomId && !meetingData.location) {
      toast.error("Por favor, selecione uma sala ou indique o local externo da reunião");
      return;
    }

    if (meetingData.meetingType === 'presencial' && meetingData.roomId && roomConflict && roomConflict.length > 0) {
      toast.error("A sala escolhida já está reservada nesse horário. Escolha outro horário ou sala.");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const scheduleData = {
        status: 'agendado',
        userEmail: audience.email,
        meetingType: meetingData.meetingType,
        platform: meetingData.meetingType === 'online' ? meetingData.platform : undefined,
        roomId: meetingData.meetingType === 'presencial' ? (meetingData.roomId || null) : undefined,
        location: meetingData.meetingType === 'presencial'
          ? (meetingData.roomId
              ? (() => {
                  const room = rooms.find((r) => r.id === meetingData.roomId);
                  return room ? `${room.nome}${room.localizacao ? ` - ${room.localizacao}` : ''}` : meetingData.location;
                })()
              : meetingData.location)
          : undefined,
        preferredDate: format(date, "yyyy-MM-dd"),
        time: meetingData.time,
        duration: meetingData.duration,
        notes: meetingData.notes,
        scheduledAt: new Date().toISOString(),
        scheduledBy: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).name : 'Secretaria'
      };

      const endpoint = type === 'presentation' ? 'presentations' : 'audiences';
      const response = await fetch(
        `${API_BASE_URL}/${endpoint}/${audience.id}/status`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scheduleData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Erro ao agendar reunião');
      }

      toast.success("Reunião agendada com sucesso! O requerente foi notificado.");
      onOpenChange(false);
      
      if (onScheduleComplete) onScheduleComplete();
      if (onSuccess) onSuccess();
      
      // Reset form
      setMeetingData({
        meetingType: '',
        platform: '',
        time: '',
        duration: '',
        roomId: '',
        location: '',
        notes: ''
      });
      setRoomConflict(null);
      setDate(undefined);

    } catch (error) {
 console.error('Schedule error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao agendar reunião');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Reunião</DialogTitle>
          <DialogDescription>
            Defina os detalhes da reunião para aprovação do pedido de audiência
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informações do Pedido */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm">
              <strong>Empresa:</strong> {audience.company}
            </p>
            <p className="text-sm">
              <strong>Requerente:</strong> {audience.contact}
            </p>
            <p className="text-sm">
              <strong>Motivo:</strong> {audience.reason}
            </p>
          </div>

          {/* Tipo de Atendimento */}
          <div className="space-y-3">
            <Label>Tipo de Atendimento *</Label>
            <RadioGroup 
              value={meetingData.meetingType} 
              onValueChange={(value) => handleInputChange('meetingType', value)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online-schedule" />
                <Label htmlFor="online-schedule">Online</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="presencial" id="presencial-schedule" />
                <Label htmlFor="presencial-schedule">Presencial</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Plataforma (se online) */}
          {meetingData.meetingType === 'online' && (
            !loadingPlatforms && availablePlatforms.length === 0 ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma plataforma de reunião está configurada nesta instalação. Peça a um administrador
                  do sistema para configurar em <strong>Configurações → Integrações</strong> antes de agendar
                  uma reunião online.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma de Reunião *</Label>
                <Select
                  value={meetingData.platform}
                  onValueChange={(value) => handleInputChange('platform', value)}
                  disabled={loadingPlatforms}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlatforms.map((platform) => (
                      <SelectItem key={platform.key} value={platform.key}>{platform.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          )}

          {/* Sala (se presencial) - selecionar em vez de escrever, para o sistema saber
              que a sala fica ocupada nesse dia/hora e cruzar com reunioes internas */}
          {meetingData.meetingType === 'presencial' && (
            <div className="space-y-2">
              <Label htmlFor="roomId">Sala de Reunião *</Label>
              <Select
                value={meetingData.roomId || "nenhuma"}
                onValueChange={(value) => handleInputChange('roomId', value === "nenhuma" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma sala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Nenhuma / Local externo</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.nome} {room.capacidade ? `(até ${room.capacidade} pessoas)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {meetingData.roomId && checkingRoom && (
                <p className="text-xs text-muted-foreground">A verificar disponibilidade...</p>
              )}
              {meetingData.roomId && !checkingRoom && roomConflict && roomConflict.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    Sala já reservada nesse horário por "{roomConflict[0].titulo}" ({roomConflict[0].hora_inicio}-{roomConflict[0].hora_fim}
                    {roomConflict[0].tipo ? `, ${ROOM_CONFLICT_TYPE_LABEL[roomConflict[0].tipo]}` : ''}).
                    Escolha outro horário ou sala.
                  </span>
                </div>
              )}

              {!meetingData.roomId && (
                <>
                  <Label htmlFor="location" className="pt-2 block">Local externo *</Label>
                  <Input
                    id="location"
                    value={meetingData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Ex: Sede do cliente, Edifício Principal"
                    required
                  />
                </>
              )}
            </div>
          )}

          {/* Data, Hora e Duração */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Data da Reunião *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Input
                id="time"
                type="time"
                value={meetingData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração *</Label>
              <Select onValueChange={(value) => handleInputChange('duration', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Duração" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30min">30 minutos</SelectItem>
                  <SelectItem value="1h">1 hora</SelectItem>
                  <SelectItem value="1h30">1h 30min</SelectItem>
                  <SelectItem value="2h">2 horas</SelectItem>
                  <SelectItem value="mais">Mais de 2 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notas adicionais */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionais (Opcional)</Label>
            <Input
              id="notes"
              value={meetingData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Informações adicionais para o requerente..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSchedule} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                A agendar...
              </>
            ) : (
              "Agendar e Aprovar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
