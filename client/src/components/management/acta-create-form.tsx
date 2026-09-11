import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner@2.0.3";
import {
  ArrowLeft, FileText, Users, Search, ListTodo, Plus, Trash2, X,
  MessageSquare, Scale, Vote, Building2, CheckCircle2
} from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL } from '@/services/api';
import type { Intervencao } from "./acta-types";

interface ActaCreateFormProps {
  onCancel: () => void;
  onCreated: (actaId: string) => void;
}

interface SystemUser {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  document?: string;
}

interface Participante {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  presente: boolean;
  externo?: boolean;
}

interface PontoAgendaDraft {
  id: string;
  titulo: string;
  descricao: string;
  discussao: string;
  intervencoes: Intervencao[];
  decisao: string;
  tipo_votacao: 'unanimidade' | 'maioria' | 'sem_votacao';
  resultado_votacao: string;
  votos_favor: number;
  votos_contra: number;
  abstencoes: number;
}

const novoPontoAgenda = (): PontoAgendaDraft => ({
  id: `ponto-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  titulo: '',
  descricao: '',
  discussao: '',
  intervencoes: [],
  decisao: '',
  tipo_votacao: 'sem_votacao',
  resultado_votacao: '',
  votos_favor: 0,
  votos_contra: 0,
  abstencoes: 0,
});

/**
 * Criacao manual de uma acta - tudo num so formulario (nao precisa de vir de
 * uma reuniao agendada nem de ser editada depois em varios passos): dados da
 * reuniao, estrutura formal do documento, participantes, e por cada ponto de
 * agenda a discussao, intervencoes, deliberacao e votacao.
 */
export function ActaCreateForm({ onCancel, onCreated }: ActaCreateFormProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [newGuest, setNewGuest] = useState({ nome: '', email: '', organizacao: '' });
  const [pontosAgenda, setPontosAgenda] = useState<PontoAgendaDraft[]>([]);
  const [recomendacoes, setRecomendacoes] = useState<string[]>([]);
  const [novaRecomendacao, setNovaRecomendacao] = useState('');

  const [formData, setFormData] = useState({
    titulo: '',
    tipoReuniao: 'ordinaria',
    orgao: '',
    dataReuniao: new Date().toISOString().split('T')[0],
    horaInicio: '',
    horaFim: '',
    tipo: 'presencial',
    local: '',
    resumo: '',
  });

  const [estruturaFormal, setEstruturaFormal] = useState({
    entidade: '',
    endereco_completo: '',
    cidade: 'Luanda',
    numero_reuniao: '',
    presidente: '',
    cargo_presidente: '',
    secretario: '',
    cargo_secretario: '',
  });

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users`, {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        });
        if (!response.ok) return;
        const result = await response.json();
        setUsers((result.data || []).map((u: any) => ({
          id: u.id,
          nome: u.name,
          email: u.email,
          cargo: u.position || u.role,
          departamento: u.department || 'Não especificado',
          document: u.document,
        })));
      } catch (error) {
 console.error('Erro ao carregar utilizadores:', error);
      }
    };
    loadUsers();
  }, [accessToken]);

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

  const handleAddParticipant = (u: SystemUser) => {
    setParticipantes((prev) => [...prev, { id: u.id, nome: u.nome, email: u.email, cargo: u.cargo, departamento: u.departamento, presente: true }]);
    setParticipantSearch('');
  };

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
      presente: true,
      externo: true,
    }]);
    setNewGuest({ nome: '', email: '', organizacao: '' });
    setShowGuestForm(false);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipantes(participantes.filter((p) => p.id !== id));
  };

  const toggleParticipantePresente = (id: string) => {
    setParticipantes((prev) => prev.map((p) => (p.id === id ? { ...p, presente: !p.presente } : p)));
  };

  const addPontoAgenda = () => setPontosAgenda((prev) => [...prev, novoPontoAgenda()]);
  const removePontoAgenda = (id: string) => setPontosAgenda((prev) => prev.filter((p) => p.id !== id));
  const updatePontoAgenda = (id: string, field: keyof PontoAgendaDraft, value: any) => {
    setPontosAgenda((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };
  const addIntervencao = (pontoId: string) => {
    const ponto = pontosAgenda.find((p) => p.id === pontoId);
    if (!ponto) return;
    updatePontoAgenda(pontoId, 'intervencoes', [...ponto.intervencoes, { participante_nome: '', participante_cargo: '', texto: '' }]);
  };
  const updateIntervencao = (pontoId: string, index: number, field: keyof Intervencao, value: string) => {
    const ponto = pontosAgenda.find((p) => p.id === pontoId);
    if (!ponto) return;
    const novas = [...ponto.intervencoes];
    novas[index] = { ...novas[index], [field]: value };
    updatePontoAgenda(pontoId, 'intervencoes', novas);
  };
  const removeIntervencao = (pontoId: string, index: number) => {
    const ponto = pontosAgenda.find((p) => p.id === pontoId);
    if (!ponto) return;
    updatePontoAgenda(pontoId, 'intervencoes', ponto.intervencoes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim() || !formData.dataReuniao || !formData.horaInicio || !formData.horaFim) {
      toast.error('Preencha o título, a data e os horários da reunião');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/actas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assunto: formData.titulo,
          data_reuniao: formData.dataReuniao,
          hora_inicio: formData.horaInicio,
          hora_fim: formData.horaFim,
          local: formData.tipo === 'presencial' ? formData.local : null,
          modalidade: formData.tipo,
          tipo_reuniao: formData.tipoReuniao,
          orgao: formData.orgao,
          resumo: formData.resumo,
          status: 'rascunho',
          ...estruturaFormal,
          recomendacoes,
          participantes: participantes.map((p) => ({
            id: p.id,
            user_id: p.externo ? null : p.id,
            nome: p.nome,
            email: p.email,
            cargo: p.cargo,
            departamento: p.departamento,
            presente: p.presente,
            externo: p.externo || false,
          })),
          participantes_presentes: participantes.filter((p) => p.presente).map((p) => p.id),
          pontos_agenda: pontosAgenda.map((p) => ({
            titulo: p.titulo,
            descricao: p.descricao,
            discussao: p.discussao,
            intervencoes: p.intervencoes,
            decisao: p.decisao,
            tipo_votacao: p.tipo_votacao,
            resultado_votacao: p.resultado_votacao,
            votos_favor: p.votos_favor,
            votos_contra: p.votos_contra,
            abstencoes: p.abstencoes,
          })),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || result.error || 'Erro ao criar a acta');
      }

      toast.success('Acta criada com sucesso!');
      onCreated(result.acta?.id || result.data?.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao criar a acta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Nova Acta
          </h1>
          <p className="text-muted-foreground">
            Registe manualmente uma acta completa - não precisa de vir de uma reunião agendada no sistema.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Reunião</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título / Assunto *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Reunião Ordinária do Conselho de Administração"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Reunião</Label>
                <Select value={formData.tipoReuniao} onValueChange={(value) => setFormData({ ...formData, tipoReuniao: value })}>
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
                <Label htmlFor="orgao">Órgão</Label>
                <Input
                  id="orgao"
                  value={formData.orgao}
                  onChange={(e) => setFormData({ ...formData, orgao: e.target.value })}
                  placeholder="Ex: Conselho de Administração"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dataReuniao">Data da Reunião *</Label>
                <Input
                  id="dataReuniao"
                  type="date"
                  value={formData.dataReuniao}
                  onChange={(e) => setFormData({ ...formData, dataReuniao: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaInicio">Hora de Início *</Label>
                <Input
                  id="horaInicio"
                  type="time"
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horaFim">Hora de Término *</Label>
                <Input
                  id="horaFim"
                  type="time"
                  value={formData.horaFim}
                  onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Modalidade</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.tipo === 'presencial' && (
                <div className="space-y-2">
                  <Label htmlFor="local">Local</Label>
                  <Input
                    id="local"
                    value={formData.local}
                    onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                    placeholder="Ex: Sala de Reuniões, 2º Piso"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resumo">Resumo (opcional)</Label>
              <Textarea
                id="resumo"
                value={formData.resumo}
                onChange={(e) => setFormData({ ...formData, resumo: e.target.value })}
                placeholder="Breve resumo da reunião..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Estrutura Formal do Documento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Estrutura Formal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="entidade">Entidade</Label>
                <Input
                  id="entidade"
                  value={estruturaFormal.entidade}
                  onChange={(e) => setEstruturaFormal({ ...estruturaFormal, entidade: e.target.value })}
                  placeholder="Ex: FADA - Fundo de Apoio ao Desenvolvimento Agrário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero_reuniao">Número da Reunião</Label>
                <Input
                  id="numero_reuniao"
                  value={estruturaFormal.numero_reuniao}
                  onChange={(e) => setEstruturaFormal({ ...estruturaFormal, numero_reuniao: e.target.value })}
                  placeholder="Ex: 1"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="endereco_completo">Endereço</Label>
                <Input
                  id="endereco_completo"
                  value={estruturaFormal.endereco_completo}
                  onChange={(e) => setEstruturaFormal({ ...estruturaFormal, endereco_completo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={estruturaFormal.cidade}
                  onChange={(e) => setEstruturaFormal({ ...estruturaFormal, cidade: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="presidente">Presidente</Label>
                <Input
                  id="presidente"
                  value={estruturaFormal.presidente}
                  onChange={(e) => setEstruturaFormal({ ...estruturaFormal, presidente: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo_presidente">Cargo do Presidente</Label>
                <Input
                  id="cargo_presidente"
                  value={estruturaFormal.cargo_presidente}
                  onChange={(e) => setEstruturaFormal({ ...estruturaFormal, cargo_presidente: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secretario">Secretário</Label>
                <Input
                  id="secretario"
                  value={estruturaFormal.secretario}
                  onChange={(e) => setEstruturaFormal({ ...estruturaFormal, secretario: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo_secretario">Cargo do Secretário</Label>
                <Input
                  id="cargo_secretario"
                  value={estruturaFormal.cargo_secretario}
                  onChange={(e) => setEstruturaFormal({ ...estruturaFormal, cargo_secretario: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Participantes */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <Label className="text-base font-semibold">Participantes ({participantes.length})</Label>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowGuestForm(!showGuestForm)}>
                <Plus className="h-4 w-4 mr-1" />
                Convidar Externo
              </Button>
            </div>

            {showGuestForm && (
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">
                  Para alguém que não faz parte da plataforma (sem conta no sistema).
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
                className="pl-10"
                autoComplete="off"
              />
              {participantSearch.trim().length > 0 && (
                <div className="mt-2 border rounded-md bg-background max-h-56 overflow-y-auto">
                  {participantMatches.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum utilizador encontrado</p>
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
            {participantes.length > 0 && (
              <div className="space-y-2">
                {participantes.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleParticipantePresente(p.id)}
                        title={p.presente ? 'Marcar como ausente' : 'Marcar como presente'}
                        className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center ${p.presente ? 'bg-tone-success-soft border-tone-success/50 text-tone-success' : 'border-muted-foreground/40 text-muted-foreground'}`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                      <div className="min-w-0">
                        <p className="font-medium text-sm flex items-center gap-2 truncate">
                          {p.nome}
                          {p.externo && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide bg-tone-gold-soft text-tone-gold px-1.5 py-0.5 rounded shrink-0">
                              Externo
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{p.email} · {p.cargo}</p>
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveParticipant(p.id)}>
                      <X className="h-4 w-4 text-tone-danger" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pontos de Agenda: discussao, intervencoes, deliberacao e votacao */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-base">
                <ListTodo className="h-4 w-4" />
                Pontos de Agenda
              </Label>
              <Button type="button" size="sm" variant="outline" onClick={addPontoAgenda}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar Ponto
              </Button>
            </div>
            {pontosAgenda.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ponto adicionado.
              </p>
            ) : (
              <div className="space-y-3">
                {pontosAgenda.map((ponto, index) => (
                  <div key={ponto.id} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ponto {index + 1}</span>
                      <Button type="button" size="sm" variant="ghost" onClick={() => removePontoAgenda(ponto.id)}>
                        <Trash2 className="h-4 w-4 text-tone-danger" />
                      </Button>
                    </div>
                    <Input
                      placeholder="Título do ponto"
                      value={ponto.titulo}
                      onChange={(e) => updatePontoAgenda(ponto.id, 'titulo', e.target.value)}
                    />
                    <Textarea
                      placeholder="Descrição (opcional)"
                      value={ponto.descricao}
                      onChange={(e) => updatePontoAgenda(ponto.id, 'descricao', e.target.value)}
                      rows={2}
                    />

                    <div className="pt-2 border-t">
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Discussão
                      </Label>
                      <Textarea
                        placeholder="Descreva as discussões realizadas neste ponto..."
                        value={ponto.discussao}
                        onChange={(e) => updatePontoAgenda(ponto.id, 'discussao', e.target.value)}
                        rows={2}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Intervenções
                        </Label>
                        <Button type="button" size="sm" variant="outline" onClick={() => addIntervencao(ponto.id)}>
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      {ponto.intervencoes.map((interv, intIndex) => (
                        <div key={intIndex} className="p-2 border rounded bg-muted/30 space-y-2 mb-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">Intervenção {intIndex + 1}</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeIntervencao(ponto.id, intIndex)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <Input
                            placeholder="Nome do participante"
                            value={interv.participante_nome}
                            onChange={(e) => updateIntervencao(ponto.id, intIndex, 'participante_nome', e.target.value)}
                            className="text-xs"
                          />
                          <Input
                            placeholder="Cargo do participante"
                            value={interv.participante_cargo}
                            onChange={(e) => updateIntervencao(ponto.id, intIndex, 'participante_cargo', e.target.value)}
                            className="text-xs"
                          />
                          <Textarea
                            placeholder="Texto da intervenção"
                            value={interv.texto}
                            onChange={(e) => updateIntervencao(ponto.id, intIndex, 'texto', e.target.value)}
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t">
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        Deliberação / Decisão
                      </Label>
                      <Textarea
                        placeholder="Descreva a decisão tomada neste ponto..."
                        value={ponto.decisao}
                        onChange={(e) => updatePontoAgenda(ponto.id, 'decisao', e.target.value)}
                        rows={2}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <Vote className="h-3 w-3" />
                        Votação
                      </Label>
                      <Select
                        value={ponto.tipo_votacao}
                        onValueChange={(value: any) => updatePontoAgenda(ponto.id, 'tipo_votacao', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sem_votacao">Sem votação</SelectItem>
                          <SelectItem value="unanimidade">Unanimidade</SelectItem>
                          <SelectItem value="maioria">Maioria</SelectItem>
                        </SelectContent>
                      </Select>
                      {ponto.tipo_votacao === 'maioria' && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <Label className="text-xs">Votos a favor</Label>
                            <Input
                              type="number"
                              min="0"
                              value={ponto.votos_favor}
                              onChange={(e) => updatePontoAgenda(ponto.id, 'votos_favor', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Votos contra</Label>
                            <Input
                              type="number"
                              min="0"
                              value={ponto.votos_contra}
                              onChange={(e) => updatePontoAgenda(ponto.id, 'votos_contra', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Abstenções</Label>
                            <Input
                              type="number"
                              min="0"
                              value={ponto.abstencoes}
                              onChange={(e) => updatePontoAgenda(ponto.id, 'abstencoes', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      )}
                      {ponto.tipo_votacao === 'unanimidade' && (
                        <Input
                          className="mt-2"
                          placeholder="Resultado (ex: Aprovado por unanimidade)"
                          value={ponto.resultado_votacao}
                          onChange={(e) => updatePontoAgenda(ponto.id, 'resultado_votacao', e.target.value)}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recomendações */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Label className="text-base font-semibold">Recomendações</Label>
            {recomendacoes.length > 0 && (
              <div className="space-y-2">
                {recomendacoes.map((rec, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                    <p className="text-sm">{rec}</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setRecomendacoes(recomendacoes.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="Nova recomendação..."
                value={novaRecomendacao}
                onChange={(e) => setNovaRecomendacao(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!novaRecomendacao.trim()) return;
                  setRecomendacoes([...recomendacoes, novaRecomendacao.trim()]);
                  setNovaRecomendacao('');
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'A criar...' : 'Criar Acta'}
          </Button>
        </div>
      </form>
    </div>
  );
}
