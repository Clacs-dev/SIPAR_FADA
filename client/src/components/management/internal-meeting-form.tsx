import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner@2.0.3";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CalendarIcon, Users, Plus, Trash2, ListTodo, X, Search, Link2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { useMeetingRooms, checkRoomAvailability, type RoomConflict } from "../../hooks/use-meeting-rooms";
import { useAvailableMeetingPlatforms } from "../../hooks/use-available-meeting-platforms";
import { Alert, AlertDescription } from "../ui/alert";
import { AlertTriangle } from "lucide-react";

interface InternalMeetingFormProps {
  onSuccess?: () => void;
}

interface PontoAgenda {
  id: string;
  titulo: string;
  descricao: string;
  tempo_estimado: number;
}

interface Participante {
  id: string; // id real do utilizador no sistema, ou "guest_..." para externos
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  externo?: boolean; // nao tem conta na plataforma - convidado so por e-mail
}

interface SystemUser {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  document?: string;
}

export function InternalMeetingForm({ onSuccess }: InternalMeetingFormProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [pontosAgenda, setPontosAgenda] = useState<PontoAgenda[]>([]);

  // Participantes: normalmente utilizadores reais do sistema (pesquisa), mas
  // tambem e possivel convidar alguem externo que nao tem conta na plataforma
  // (recebe apenas um convite por e-mail, sem notificacoes internas).
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [newGuest, setNewGuest] = useState({ nome: '', email: '', organizacao: '' });

  const [formData, setFormData] = useState({
    participantId: "",
    title: "",
    description: "",
    meetingDate: undefined as Date | undefined,
    startTime: "",
    endTime: "",
    meetingType: "presencial",
    location: "",
    roomId: "",
    platform: "",
    priority: "normal",
    tipoReuniao: "ordinaria", // ordinaria ou extraordinaria
    orgao: "", // Conselho, Direcção, etc.
  });

  const { rooms } = useMeetingRooms();
  const { platforms: availablePlatforms, loading: loadingPlatforms } = useAvailableMeetingPlatforms();
  const [roomConflict, setRoomConflict] = useState<RoomConflict[] | null>(null);
  const [checkingRoom, setCheckingRoom] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (!formData.roomId || !formData.meetingDate || !formData.startTime || !formData.endTime) {
      setRoomConflict(null);
      return;
    }

    let cancelled = false;
    setCheckingRoom(true);
    checkRoomAvailability({
      roomId: formData.roomId,
      data: format(formData.meetingDate, 'yyyy-MM-dd'),
      horaInicio: formData.startTime,
      horaFim: formData.endTime,
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
  }, [formData.roomId, formData.meetingDate, formData.startTime, formData.endTime]);

  const loadUsers = async () => {
    try {
      if (!accessToken) {
        toast.error('Token de autenticação não encontrado');
        return;
      }

      // Removido filtro de roles para listar TODOS os usuários ativos
      const response = await fetch(
        `${API_BASE_URL}/users?excludeId=${user?.id}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao carregar usuários');
      }

      const result = await response.json();
      setUsers(result.data.map((u: any) => ({
        id: u.id,
        nome: u.name,
        email: u.email,
        cargo: u.position || getRoleLabel(u.role),
        departamento: u.department || 'Não especificado',
        document: u.document,
      })));
    } catch (error: any) {
 console.error('Erro ao carregar utilizadores:', error);
      toast.error(`Erro ao carregar lista de utilizadores: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const participantMatches = (() => {
    const term = participantSearch.trim().toLowerCase();
    if (!term) return [];
    const addedIds = new Set(participantes.map((p) => p.id));
    return users
      .filter((u) => !addedIds.has(u.id))
      .filter((u) =>
        u.nome.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.document || '').toLowerCase().includes(term)
      )
      .slice(0, 8);
  })();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addPontoAgenda = () => {
    const novoPonto: PontoAgenda = {
      id: `ponto-${Date.now()}`,
      titulo: '',
      descricao: '',
      tempo_estimado: 15,
    };
    setPontosAgenda([...pontosAgenda, novoPonto]);
  };

  const removePontoAgenda = (id: string) => {
    setPontosAgenda(pontosAgenda.filter(p => p.id !== id));
  };

  const updatePontoAgenda = (id: string, field: keyof PontoAgenda, value: any) => {
    setPontosAgenda(pontosAgenda.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  };

  // Participantes vem sempre do directorio real de utilizadores do sistema
  const handleAddParticipant = (u: SystemUser) => {
    setParticipantes((prev) => [...prev, { id: u.id, nome: u.nome, email: u.email, cargo: u.cargo, departamento: u.departamento }]);
    setParticipantSearch('');
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipantes(participantes.filter(p => p.id !== id));
  };

  // Convidado externo: nao tem conta na plataforma, entra so com nome/e-mail
  // e recebe o convite da reuniao por e-mail (sem notificacoes internas, ja
  // que nunca vai fazer login).
  const handleAddGuest = () => {
    if (!newGuest.nome.trim() || !newGuest.email.trim()) {
      toast.error('Indique o nome e o e-mail do participante externo');
      return;
    }
    setParticipantes((prev) => [...prev, {
      id: `guest_${Date.now()}`,
      nome: newGuest.nome.trim(),
      email: newGuest.email.trim(),
      cargo: newGuest.organizacao.trim() || 'Externo',
      departamento: 'Externo',
      externo: true,
    }]);
    setNewGuest({ nome: '', email: '', organizacao: '' });
    setShowGuestForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.meetingDate || !formData.startTime || !formData.endTime) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (participantes.length === 0) {
      toast.error('Por favor, adicione pelo menos um participante');
      return;
    }

    if (formData.meetingType === 'online' && !formData.platform) {
      toast.error('Por favor, selecione a plataforma de reunião');
      return;
    }

    if (formData.roomId && roomConflict && roomConflict.length > 0) {
      toast.error('A sala escolhida já está reservada nesse horário. Escolha outro horário ou sala.');
      return;
    }

    setLoading(true);

    try {
      // Preparar dados para envio ao backend
      const meetingData = {
        title: formData.title,
        description: formData.description,
        meeting_date: format(formData.meetingDate, 'yyyy-MM-dd'),
        start_time: formData.startTime,
        end_time: formData.endTime,
        meeting_type: formData.meetingType,
        location: formData.meetingType === 'presencial' ? formData.location : null,
        room_id: formData.meetingType === 'presencial' && formData.roomId ? formData.roomId : null,
        platform: formData.meetingType === 'online' ? formData.platform : null,
        // O link nunca e digitado manualmente - o backend gera-o automaticamente
        // (MeetingLinkService) para reunioes online.
        priority: formData.priority,
        tipo_reuniao: formData.tipoReuniao,
        orgao: formData.orgao,
        status: 'pendente',

        // Incluir pontos de agenda
        pontos_agenda: pontosAgenda.map(p => ({
          titulo: p.titulo,
          descricao: p.descricao,
          tempo_estimado: p.tempo_estimado
        })),

        // Incluir participantes - sempre utilizadores reais, por isso user_id
        // vai sempre preenchido (necessario para as notificacoes/email automaticos)
        participantes: participantes.map(p => ({
          id: p.id,
          user_id: p.id,
          nome: p.nome,
          email: p.email,
          cargo: p.cargo,
          departamento: p.departamento,
        }))
      };

      // Enviar para backend
      const response = await fetch(
        `${API_BASE_URL}/internal-meetings`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(meetingData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || errorData.error || errorData.details || 'Erro ao criar reunião');
      }

      const result = await response.json();

      toast.success(result.message || 'Reunião interna agendada com sucesso!');
      
      // Reset form
      setFormData({
        participantId: "",
        title: "",
        description: "",
        meetingDate: undefined,
        startTime: "",
        endTime: "",
        meetingType: "presencial",
        location: "",
        roomId: "",
        platform: "",
        priority: "normal",
        tipoReuniao: "ordinaria",
        orgao: "",
      });
      setRoomConflict(null);
      setPontosAgenda([]);
      setParticipantes([]);
      setParticipantSearch('');
      setShowGuestForm(false);
      setNewGuest({ nome: '', email: '', organizacao: '' });

      if (onSuccess) onSuccess();
    } catch (error: any) {
 console.error(' Erro ao agendar reunião:', error);
      toast.error('Erro ao agendar reunião: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      attendant: 'Atendente',
      user: 'Requerente'
    };
    return labels[role] || role;
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Informações Básicas */}
        <div className="space-y-2">
          <Label htmlFor="title">Título da Reunião *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Ex: Reunião de Alinhamento"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="tipoReuniao">Tipo de Reunião *</Label>
            <Select 
              onValueChange={(value) => handleInputChange('tipoReuniao', value)} 
              defaultValue="ordinaria"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ordinaria">Ordinária</SelectItem>
                <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgao">Órgão *</Label>
            <Select 
              onValueChange={(value) => handleInputChange('orgao', value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o órgão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conselho_administracao">Conselho de Administração</SelectItem>
                <SelectItem value="direcao">Direcção</SelectItem>
                <SelectItem value="gabinete_pca">Gabinete do PCA</SelectItem>
                <SelectItem value="gabinete_pce">Gabinete do PCE</SelectItem>
                <SelectItem value="gabinete_administrador">Gabinete do Administrador</SelectItem>
                <SelectItem value="gabinete_director">Gabinete do Director</SelectItem>
                <SelectItem value="gestao">Gestão</SelectItem>
                <SelectItem value="compras">Compras</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="recursos_humanos">Recursos Humanos</SelectItem>
                <SelectItem value="ti">Tecnologias de Informação</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="juridico">Jurídico</SelectItem>
                <SelectItem value="operacoes">Operações</SelectItem>
                <SelectItem value="logistica">Logística</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Participantes - sempre pesquisados no directorio real de utilizadores */}
        <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <Label className="text-base font-semibold">
                Participantes ({participantes.length})
              </Label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGuestForm(!showGuestForm)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Convidar Externo
            </Button>
          </div>

          {showGuestForm && (
            <div className="space-y-3 p-3 border rounded-lg bg-background">
              <p className="text-xs text-muted-foreground">
                Para alguém que não faz parte da plataforma. Recebe o convite por e-mail, mas não terá acesso ao sistema.
              </p>
              <Input
                placeholder="Nome completo *"
                value={newGuest.nome}
                onChange={(e) => setNewGuest({ ...newGuest, nome: e.target.value })}
              />
              <Input
                type="email"
                placeholder="E-mail *"
                value={newGuest.email}
                onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
              />
              <Input
                placeholder="Organização/Cargo (opcional)"
                value={newGuest.organizacao}
                onChange={(e) => setNewGuest({ ...newGuest, organizacao: e.target.value })}
              />
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowGuestForm(false)}>
                  Cancelar
                </Button>
                <Button type="button" size="sm" onClick={handleAddGuest}>
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Pesquise por nome, email ou número de documento..."
              value={participantSearch}
              onChange={(e) => setParticipantSearch(e.target.value)}
              className="pl-10 bg-background"
              autoComplete="off"
            />
            {participantSearch.trim().length > 0 && (
              <div className="mt-2 border rounded-md bg-background max-h-56 overflow-y-auto">
                {participantMatches.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum utilizador encontrado
                  </p>
                ) : (
                  participantMatches.map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => handleAddParticipant(u)}
                      className="w-full flex items-center gap-2 p-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                    >
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {u.email} · {u.cargo} · {u.departamento}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Lista de participantes */}
          {participantes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum participante adicionado. Pesquise acima para adicionar.
            </p>
          ) : (
            <div className="space-y-2">
              {participantes.map((participante) => (
                <div
                  key={participante.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm flex items-center gap-2">
                      {participante.nome}
                      {participante.externo && (
                        <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Externo
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participante.email} · {participante.cargo && `${participante.cargo} • `}
                      {participante.departamento || 'Sem departamento'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveParticipant(participante.id)}
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pontos de Agenda */}
        <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2 text-base">
              <ListTodo className="h-4 w-4" />
              Pontos de Agenda
            </Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addPontoAgenda}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Ponto
            </Button>
          </div>

          {pontosAgenda.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum ponto adicionado. Clique em "Adicionar Ponto" para começar.
            </p>
          ) : (
            <div className="space-y-3">
              {pontosAgenda.map((ponto, index) => (
                <div key={ponto.id} className="space-y-2 p-3 border rounded-lg bg-background">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ponto {index + 1}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removePontoAgenda(ponto.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                  <Input
                    placeholder="Título do ponto *"
                    value={ponto.titulo}
                    onChange={(e) => updatePontoAgenda(ponto.id, 'titulo', e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Descrição (opcional)"
                    value={ponto.descricao}
                    onChange={(e) => updatePontoAgenda(ponto.id, 'descricao', e.target.value)}
                    rows={2}
                  />
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`tempo-${ponto.id}`} className="text-xs">
                      Tempo estimado (min):
                    </Label>
                    <Input
                      id={`tempo-${ponto.id}`}
                      type="number"
                      min="5"
                      max="240"
                      value={ponto.tempo_estimado}
                      onChange={(e) => updatePontoAgenda(ponto.id, 'tempo_estimado', parseInt(e.target.value) || 15)}
                      className="w-20"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Observações Adicionais</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Outras informações relevantes sobre a reunião..."
            rows={3}
          />
        </div>

        {/* Data e Hora */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Data da Reunião *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.meetingDate ? format(formData.meetingDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.meetingDate}
                  onSelect={(date) => handleInputChange('meetingDate', date)}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Importância</Label>
            <Select onValueChange={(value) => handleInputChange('priority', value)} defaultValue="normal">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startTime">Hora de Início *</Label>
            <Input
              id="startTime"
              type="time"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">Hora de Término *</Label>
            <Input
              id="endTime"
              type="time"
              value={formData.endTime}
              onChange={(e) => handleInputChange('endTime', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Local/Online */}
        <div className="space-y-2">
          <Label htmlFor="meetingType">Modalidade *</Label>
          <Select onValueChange={(value) => handleInputChange('meetingType', value)} defaultValue="presencial">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="presencial">Presencial</SelectItem>
              <SelectItem value="online">Online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.meetingType === 'presencial' ? (
          <div className="space-y-2">
            <Label htmlFor="roomId">Sala de Reunião</Label>
            <Select
              value={formData.roomId || "nenhuma"}
              onValueChange={(value) => handleInputChange('roomId', value === "nenhuma" ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma sala (opcional)" />
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

            {formData.roomId && checkingRoom && (
              <p className="text-xs text-muted-foreground">A verificar disponibilidade...</p>
            )}
            {formData.roomId && !checkingRoom && roomConflict && roomConflict.length > 0 && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Sala já reservada nesse horário por "{roomConflict[0].titulo}" ({roomConflict[0].hora_inicio}-{roomConflict[0].hora_fim}).
                  Escolha outro horário ou sala.
                </span>
              </div>
            )}

            <Label htmlFor="location" className="pt-2 block">Local da Reunião (opcional se escolheu uma sala)</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Ex: Escritório Principal, 2º Piso"
            />
          </div>
        ) : (
          <>
            {!loadingPlatforms && availablePlatforms.length === 0 ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Nenhuma plataforma de reunião está configurada nesta instalação. Peça a um administrador
                  do sistema para configurar em <strong>Configurações → Integrações</strong> antes de agendar
                  uma reunião online.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="platform">Plataforma</Label>
                  <Select
                    value={formData.platform}
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

                <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 border rounded-lg p-3">
                  <Link2 className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    O link da reunião é gerado automaticamente pelo sistema assim que a reunião for agendada,
                    e enviado a todos os participantes por email e por notificação interna.
                  </span>
                </div>
              </>
            )}
          </>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Agendando...' : 'Agendar Reunião'}
        </Button>
      </form>
    </div>
  );
}
