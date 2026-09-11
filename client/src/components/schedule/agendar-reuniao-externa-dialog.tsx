import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns@4.1.0";
import { ptBR } from "date-fns@4.1.0/locale";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL } from '@/services/api';
import { useAuth } from "../auth/auth-context";

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AgendarReuniaoExternaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

/**
 * Permite à secretaria (ou outro perfil com permissão de gestão da agenda)
 * agendar directamente uma reunião externa (visita/audiência) já atribuída
 * a um utilizador da plataforma, informando local, dia e demais detalhes -
 * sem depender de uma solicitação prévia submetida pelo próprio requerente.
 */
export function AgendarReuniaoExternaDialog({ open, onOpenChange, onSuccess }: AgendarReuniaoExternaDialogProps) {
  const { user, accessToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [date, setDate] = useState<Date>();
  const [form, setForm] = useState({
    assignedToId: '',
    organization: '',
    requestorName: '',
    requestorEmail: '',
    requestorPhone: '',
    purpose: '',
    meetingType: '',
    platform: '',
    location: '',
    time: '',
    duration: '',
    notes: '',
  });

  useEffect(() => {
    if (open) loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users?excludeId=${user?.id}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('Erro ao carregar utilizadores');
      const result = await response.json();
      setUsers(result.data || []);
    } catch (error) {
 console.error('Erro ao carregar utilizadores:', error);
      toast.error('Erro ao carregar a lista de utilizadores da plataforma');
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      assignedToId: '', organization: '', requestorName: '', requestorEmail: '', requestorPhone: '',
      purpose: '', meetingType: '', platform: '', location: '', time: '', duration: '', notes: '',
    });
    setDate(undefined);
  };

  const handleSubmit = async () => {
    if (!form.assignedToId || !form.organization || !form.requestorName || !date || !form.meetingType || !form.time || !form.duration) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }
    if (form.meetingType === 'online' && !form.platform) {
      toast.error('Por favor, selecione a plataforma da reunião');
      return;
    }
    if (form.meetingType === 'presencial' && !form.location) {
      toast.error('Por favor, informe o local da reunião');
      return;
    }

    const assignedUser = users.find((u) => u.id === form.assignedToId);

    setIsSubmitting(true);
    try {
      const preferredDate = format(date, 'yyyy-MM-dd');
      const response = await fetch(`${API_BASE_URL}/audiences`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'agendado',
          requestorName: form.requestorName,
          requestorEmail: form.requestorEmail || undefined,
          requestorPhone: form.requestorPhone || undefined,
          organization: form.organization,
          purpose: form.purpose || 'Reunião externa agendada pela secretaria',
          desiredDate: preferredDate,
          preferredDate,
          time: form.time,
          duration: form.duration,
          meetingType: form.meetingType,
          platform: form.meetingType === 'online' ? form.platform : undefined,
          location: form.meetingType === 'presencial' ? form.location : undefined,
          notes: form.notes || undefined,
          assigned_to_id: form.assignedToId,
          assigned_to_name: assignedUser?.name || null,
          scheduledAt: new Date().toISOString(),
          scheduledBy: user?.name || 'Secretaria',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || error.error || 'Erro ao agendar reunião externa');
      }

      toast.success(`Reunião externa agendada para ${assignedUser?.name || 'o utilizador seleccionado'}.`);
      onOpenChange(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
 console.error('Erro ao agendar reunião externa:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao agendar reunião externa');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agendar Reunião Externa</DialogTitle>
          <DialogDescription>
            Agende uma reunião com um visitante externo para um utilizador da plataforma,
            informando o local, o dia e os demais detalhes. O utilizador será notificado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Utilizador da Plataforma *</Label>
            <Select value={form.assignedToId} onValueChange={(value) => handleChange('assignedToId', value)}>
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Selecione quem irá receber a reunião" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name} — {u.role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="organization">Empresa/Organização *</Label>
              <Input id="organization" value={form.organization} onChange={(e) => handleChange('organization', e.target.value)} placeholder="Ex: Agência de Viagem Lda" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestorName">Nome do Visitante *</Label>
              <Input id="requestorName" value={form.requestorName} onChange={(e) => handleChange('requestorName', e.target.value)} placeholder="Nome do contacto externo" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requestorEmail">E-mail do Visitante</Label>
              <Input id="requestorEmail" type="email" value={form.requestorEmail} onChange={(e) => handleChange('requestorEmail', e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestorPhone">Telefone do Visitante</Label>
              <Input id="requestorPhone" value={form.requestorPhone} onChange={(e) => handleChange('requestorPhone', e.target.value)} placeholder="+244 9xx xxx xxx" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Motivo da Reunião</Label>
            <Textarea id="purpose" value={form.purpose} onChange={(e) => handleChange('purpose', e.target.value)} placeholder="Assunto a tratar na reunião" rows={2} />
          </div>

          <div className="space-y-3">
            <Label>Tipo de Reunião *</Label>
            <RadioGroup value={form.meetingType} onValueChange={(value) => handleChange('meetingType', value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="presencial" id="presencial-externa" />
                <Label htmlFor="presencial-externa">Presencial</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online-externa" />
                <Label htmlFor="online-externa">Online</Label>
              </div>
            </RadioGroup>
          </div>

          {form.meetingType === 'online' && (
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma de Reunião *</Label>
              <Select value={form.platform} onValueChange={(value) => handleChange('platform', value)}>
                <SelectTrigger id="platform">
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="googlemeet">Google Meet</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="skype">Skype</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp Video</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {form.meetingType === 'presencial' && (
            <div className="space-y-2">
              <Label htmlFor="location">Local da Reunião *</Label>
              <Input id="location" value={form.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Ex: Sala de Reuniões 3, Edifício Principal" />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Data da Reunião *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))} />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Input id="time" type="time" value={form.time} onChange={(e) => handleChange('time', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração *</Label>
              <Select value={form.duration} onValueChange={(value) => handleChange('duration', value)}>
                <SelectTrigger id="duration">
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

          <div className="space-y-2">
            <Label htmlFor="notes">Notas Adicionais</Label>
            <Textarea id="notes" value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Informações adicionais..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />A agendar...</>) : 'Agendar Reunião'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
