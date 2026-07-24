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
import { CalendarIcon, Users, Plus, Trash2, ListTodo, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

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
  id: string;
  nome: string;
  cargo: string;
  departamento: string;
}

export function InternalMeetingForm({ onSuccess }: InternalMeetingFormProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [pontosAgenda, setPontosAgenda] = useState<PontoAgenda[]>([]);
  
  // Estados para o novo sistema de participantes
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    nome: '',
    cargo: '',
    departamento: ''
  });
  
  const [formData, setFormData] = useState({
    participantId: "",
    title: "",
    description: "",
    meetingDate: undefined as Date | undefined,
    startTime: "",
    endTime: "",
    meetingType: "presencial",
    location: "",
    platform: "",
    meetingLink: "",
    priority: "normal",
    tipoReuniao: "ordinaria", // ordinaria ou extraordinaria
    orgao: "", // Conselho, Direcção, etc.
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
 console.log('Iniciando carregamento de usuários...');
 console.log('Usuário atual:', user);
 console.log('Access token:', accessToken ? 'Presente' : 'Ausente');
      
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
 console.log('Usuários carregados:', result.data);
 console.log('Total de usuários:', result.data?.length);
      setUsers(result.data.map((u: any) => ({
        id: u.id,
        nome: u.name,
        cargo: getRoleLabel(u.role),
        departamento: u.department || 'Não especificado'
      })));
    } catch (error: any) {
 console.error('Erro ao carregar utilizadores:', error);
      toast.error(`Erro ao carregar lista de utilizadores: ${error.message || 'Erro desconhecido'}`);
    }
  };

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

  // Funções para gerenciar participantes
  const handleAddParticipant = () => {
    if (!newParticipant.nome.trim()) {
      toast.error('Por favor, preencha o nome do participante');
      return;
    }

    const participante: Participante = {
      id: `participante-${Date.now()}`,
      nome: newParticipant.nome,
      cargo: newParticipant.cargo,
      departamento: newParticipant.departamento
    };

    setParticipantes([...participantes, participante]);
    setNewParticipant({ nome: '', cargo: '', departamento: '' });
    setShowParticipantForm(false);
    toast.success('Participante adicionado com sucesso!');
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipantes(participantes.filter(p => p.id !== id));
    toast.success('Participante removido');
  };

  const handleCancelAddParticipant = () => {
    setNewParticipant({ nome: '', cargo: '', departamento: '' });
    setShowParticipantForm(false);
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
        platform: formData.meetingType === 'online' ? formData.platform : null,
        meeting_link: formData.meetingType === 'online' ? formData.meetingLink : null,
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
        
        // Incluir participantes
        participantes: participantes.map(p => ({
          id: p.id,
          nome: p.nome,
          cargo: p.cargo,
          departamento: p.departamento,
          user_id: null // TODO: Mapear para user_id se o participante for usuário do sistema
        }))
      };

 console.log(' Enviando dados da reunião:', meetingData);

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
        throw new Error(errorData.error || errorData.details || 'Erro ao criar reunião');
      }

      const result = await response.json();
 console.log(' Resposta do backend:', result);

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
        platform: "",
        meetingLink: "",
        priority: "normal",
        tipoReuniao: "ordinaria",
        orgao: "",
      });
      setPontosAgenda([]);
      setParticipantes([]);
      setShowParticipantForm(false);

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

        {/* Sistema de Participantes - Novo Design do Figma */}
        <div className="space-y-3 border rounded-lg p-4 bg-muted/50">
          {/* Cabeçalho com contador e botão */}
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
              onClick={() => setShowParticipantForm(!showParticipantForm)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Participante
            </Button>
          </div>

          {/* Mini-formulário de adição */}
          {showParticipantForm && (
            <div className="space-y-3 p-4 border rounded-lg bg-background">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={newParticipant.nome}
                  onChange={(e) => setNewParticipant({ ...newParticipant, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="bg-[#f3f3f5]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={newParticipant.cargo}
                    onChange={(e) => setNewParticipant({ ...newParticipant, cargo: e.target.value })}
                    placeholder="Ex: Diretor Geral"
                    className="bg-[#f3f3f5]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento</Label>
                  <Select 
                    value={newParticipant.departamento}
                    onValueChange={(value) => setNewParticipant({ ...newParticipant, departamento: value })}
                  >
                    <SelectTrigger className="bg-[#f3f3f5]">
                      <SelectValue placeholder="Selecione" />
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

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCancelAddParticipant}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddParticipant}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}

          {/* Lista de participantes */}
          {participantes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum participante adicionado. Clique em "Adicionar Participante" para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {participantes.map((participante) => (
                <div
                  key={participante.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{participante.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {participante.cargo && `${participante.cargo} • `}
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
            <Label htmlFor="location">Local da Reunião</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Ex: Sala de Reuniões 1, Escritório Principal"
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <Select onValueChange={(value) => handleInputChange('platform', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Zoom">Zoom</SelectItem>
                  <SelectItem value="Microsoft Teams">Microsoft Teams</SelectItem>
                  <SelectItem value="Google Meet">Google Meet</SelectItem>
                  <SelectItem value="Skype">Skype</SelectItem>
                  <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                  <SelectItem value="Outra">Outra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingLink">Link da Reunião</Label>
              <Input
                id="meetingLink"
                type="url"
                value={formData.meetingLink}
                onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Agendando...' : 'Agendar Reunião'}
        </Button>
      </form>
    </div>
  );
}
