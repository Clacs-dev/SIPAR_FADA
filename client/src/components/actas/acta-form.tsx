import { useState, useEffect } from 'react';
import { 
  FileText, 
  Save, 
  X, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Users, 
  Calendar, 
  MapPin, 
  Clock, 
  Building, 
  User,
  Loader2,
  ListTodo,
  MessageSquare,
  Scale,
  Vote
} from 'lucide-react';
import { useActas } from '../../hooks/useActas';
import type { Acta, Participante } from '../../types/acta';
import { DEPARTMENTS } from '../admin/departments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

// Interface para pontos de agenda
interface PontoAgenda {
  id: string;
  titulo: string;
  descricao: string;
  tempo_estimado: number;
  discussao?: string;        // Discussão detalhada do ponto
  intervencoes?: Array<{     // Intervenções dos participantes
    participante_nome: string;
    participante_cargo: string;
    texto: string;
  }>;
  decisao?: string;          // Decisão tomada
  tipo_votacao?: 'unanimidade' | 'maioria' | 'sem_votacao';
  resultado_votacao?: string;
  votos_favor?: number;
  votos_contra?: number;
  abstencoes?: number;
}

interface ActaFormProps {
  acta?: Acta | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ActaForm({ acta, onSuccess, onCancel }: ActaFormProps) {
  const { createActa, updateActa } = useActas();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Campos do formulário
  const [assunto, setAssunto] = useState('');
  const [dataReuniao, setDataReuniao] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [local, setLocal] = useState('');
  const [tipoReuniao, setTipoReuniao] = useState<'ordinaria' | 'extraordinaria'>('ordinaria');
  const [departamento, setDepartamento] = useState('');
  const [pauta, setPauta] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [decisoes, setDecisoes] = useState('');
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  // Novos campos sincronizados
  const [modalidade, setModalidade] = useState<'presencial' | 'online'>('presencial');
  const [prioridade, setPrioridade] = useState<'baixa' | 'normal' | 'alta' | 'urgente'>('normal');
  const [orgao, setOrgao] = useState('');
  const [pontosAgenda, setPontosAgenda] = useState<PontoAgenda[]>([]);

  // ✨ NOVOS CAMPOS COMPLETOS PARA ESTRUTURA FORMAL DA ACTA
  const [entidade, setEntidade] = useState('');
  const [enderecoCompleto, setEnderecoCompleto] = useState('');
  const [cidade, setCidade] = useState('Luanda');
  const [numeroReuniao, setNumeroReuniao] = useState('');
  const [presidente, setPresidente] = useState('');
  const [cargoPresidente, setCargoPresidente] = useState('');
  const [secretario, setSecretario] = useState('');
  const [cargoSecretario, setCargoSecretario] = useState('');
  const [textoAbertura, setTextoAbertura] = useState('');
  const [quorum, setQuorum] = useState('Verificada a existência de quórum legal, o Senhor(a) Presidente declarou aberta a sessão.');
  const [recomendacoes, setRecomendacoes] = useState<string[]>([]);
  const [textoEncerramento, setTextoEncerramento] = useState('');
  const [novaRecomendacao, setNovaRecomendacao] = useState('');
  const [showAddRecomendacao, setShowAddRecomendacao] = useState(false);

  // Formulário de novo participante
  const [showAddParticipante, setShowAddParticipante] = useState(false);
  const [novoParticipante, setNovoParticipante] = useState<Participante>({
    nome: '',
    cargo: '',
    departamento: '',
    presente: true,
  });

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (acta) {
      setAssunto(acta.assunto);
      setDataReuniao(acta.data_reuniao.split('T')[0]);
      setHoraInicio(acta.hora_inicio || '');
      setHoraFim(acta.hora_fim || '');
      setLocal(acta.local || '');
      setTipoReuniao(acta.tipo_reuniao);
      setDepartamento(acta.departamento || '');
      setPauta(acta.pauta || '');
      setConteudo(acta.conteudo || '');
      setDecisoes(acta.decisoes || '');
      setParticipantes(acta.participantes || []);
      
      // Novos campos
      setModalidade((acta as any).modalidade || 'presencial');
      setPrioridade((acta as any).prioridade || 'normal');
      setOrgao((acta as any).orgao || '');
      setPontosAgenda((acta as any).pontos_agenda || []);
      
      // ✨ NOVOS CAMPOS COMPLETOS PARA ESTRUTURA FORMAL DA ACTA
      setEntidade((acta as any).entidade || '');
      setEnderecoCompleto((acta as any).endereco_completo || '');
      setCidade((acta as any).cidade || 'Luanda');
      setNumeroReuniao((acta as any).numero_reuniao || '');
      setPresidente((acta as any).presidente || '');
      setCargoPresidente((acta as any).cargo_presidente || '');
      setSecretario((acta as any).secretario || '');
      setCargoSecretario((acta as any).cargo_secretario || '');
      setTextoAbertura((acta as any).texto_abertura || '');
      setQuorum((acta as any).quorum || 'Verificada a existência de quórum legal, o Senhor(a) Presidente declarou aberta a sessão.');
      setRecomendacoes((acta as any).recomendacoes || []);
      setTextoEncerramento((acta as any).texto_encerramento || '');
    } else {
      // Definir data de hoje como padrão
      setDataReuniao(new Date().toISOString().split('T')[0]);
    }
  }, [acta]);

  // Funções para pontos de agenda
  const addPontoAgenda = () => {
    const novoPonto: PontoAgenda = {
      id: `ponto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
    ));
  };

  const handleAddParticipante = () => {
    if (!novoParticipante.nome.trim()) {
      alert('Nome do participante é obrigatório');
      return;
    }

    setParticipantes([...participantes, novoParticipante]);
    setNovoParticipante({
      nome: '',
      cargo: '',
      departamento: '',
      presente: true,
    });
    setShowAddParticipante(false);
  };

  const handleRemoveParticipante = (index: number) => {
    setParticipantes(participantes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validações
      if (!assunto.trim()) {
        throw new Error('Assunto é obrigatório');
      }
      if (!dataReuniao) {
        throw new Error('Data da reunião é obrigatória');
      }
      if (!tipoReuniao) {
        throw new Error('Tipo de reunião é obrigatório');
      }

      const actaData = {
        assunto,
        data_reuniao: dataReuniao,
        hora_inicio: horaInicio || null,
        hora_fim: horaFim || null,
        local: local || null,
        tipo_reuniao: tipoReuniao,
        departamento: departamento || null,
        pauta: pauta || null,
        conteudo: conteudo || null,
        decisoes: decisoes || null,
        participantes,
        modalidade,
        prioridade,
        orgao,
        pontos_agenda: pontosAgenda,
        
        // ✨ NOVOS CAMPOS COMPLETOS PARA ESTRUTURA FORMAL DA ACTA
        entidade,
        endereco_completo: enderecoCompleto,
        cidade,
        numero_reuniao: numeroReuniao,
        presidente,
        cargo_presidente: cargoPresidente,
        secretario,
        cargo_secretario: cargoSecretario,
        texto_abertura: textoAbertura,
        quorum,
        recomendacoes,
        texto_encerramento: textoEncerramento,
      };

      if (acta) {
        // Atualizar
        const result = await updateActa(acta.id, actaData);
        if (result) {
          onSuccess();
        }
      } else {
        // Criar
        const result = await createActa(actaData);
        if (result) {
          onSuccess();
        }
      }
    } catch (err) {
 console.error(' Erro ao salvar acta:', err);
      setError(err instanceof Error ? err.message : 'Erro ao salvar acta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {acta ? 'Editar Acta' : 'Nova Acta'}
          </CardTitle>
          <CardDescription>
            {acta ? `Editando acta ${acta.numero}` : 'Preencha os dados para criar uma nova acta'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Erro ao salvar acta</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Informações Básicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assunto */}
              <div className="md:col-span-2">
                <Label htmlFor="assunto">
                  Assunto da Reunião <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="assunto"
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  placeholder="Ex: Reunião Ordinária do Conselho de Administração"
                  required
                />
              </div>

              {/* Tipo de Reunião */}
              <div>
                <Label htmlFor="tipo_reuniao">
                  Tipo de Reunião <span className="text-destructive">*</span>
                </Label>
                <Select value={tipoReuniao} onValueChange={(value: any) => setTipoReuniao(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinaria">Ordinária</SelectItem>
                    <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Departamento */}
              <div>
                <Label htmlFor="departamento">Departamento</Label>
                <Select value={departamento} onValueChange={setDepartamento}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Data, Hora e Local */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data, Hora e Local
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Data */}
              <div>
                <Label htmlFor="data_reuniao">
                  Data da Reunião <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="data_reuniao"
                  type="date"
                  value={dataReuniao}
                  onChange={(e) => setDataReuniao(e.target.value)}
                  required
                />
              </div>

              {/* Hora Início */}
              <div>
                <Label htmlFor="hora_inicio">Hora de Início</Label>
                <Input
                  id="hora_inicio"
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </div>

              {/* Hora Fim */}
              <div>
                <Label htmlFor="hora_fim">Hora de Término</Label>
                <Input
                  id="hora_fim"
                  type="time"
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                />
              </div>

              {/* Local */}
              <div className="md:col-span-3">
                <Label htmlFor="local">Local da Reunião</Label>
                <Input
                  id="local"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                  placeholder="Ex: Sala de Reuniões do 3º Andar"
                />
              </div>
            </div>
          </div>

          {/* Participantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participantes ({participantes.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddParticipante(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Participante
              </Button>
            </div>

            {/* Formulário de Novo Participante */}
            {showAddParticipante && (
              <Card className="bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="md:col-span-2">
                      <Label htmlFor="participante_nome">Nome *</Label>
                      <Input
                        id="participante_nome"
                        value={novoParticipante.nome}
                        onChange={(e) =>
                          setNovoParticipante({ ...novoParticipante, nome: e.target.value })
                        }
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="participante_cargo">Cargo</Label>
                      <Input
                        id="participante_cargo"
                        value={novoParticipante.cargo}
                        onChange={(e) =>
                          setNovoParticipante({ ...novoParticipante, cargo: e.target.value })
                        }
                        placeholder="Ex: Diretor Geral"
                      />
                    </div>
                    <div>
                      <Label htmlFor="participante_departamento">Departamento</Label>
                      <Select
                        value={novoParticipante.departamento}
                        onValueChange={(value) =>
                          setNovoParticipante({ ...novoParticipante, departamento: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddParticipante(false);
                        setNovoParticipante({
                          nome: '',
                          cargo: '',
                          departamento: '',
                          presente: true,
                        });
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button type="button" size="sm" onClick={handleAddParticipante}>
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lista de Participantes */}
            {participantes.length > 0 ? (
              <div className="space-y-2">
                {participantes.map((participante, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{participante.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {participante.cargo}
                        {participante.cargo && participante.departamento && ' • '}
                        {participante.departamento &&
                          DEPARTMENTS.find((d) => d.id === participante.departamento)?.name}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParticipante(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum participante adicionado</p>
              </div>
            )}
          </div>

          {/* Pontos de Agenda */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Pontos de Agenda
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Modalidade */}
              <div>
                <Label htmlFor="modalidade">
                  Modalidade <span className="text-destructive">*</span>
                </Label>
                <Select value={modalidade} onValueChange={(value: any) => setModalidade(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presencial">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Importância */}
              <div>
                <Label htmlFor="prioridade">
                  Importância <span className="text-destructive">*</span>
                </Label>
                <Select value={prioridade} onValueChange={(value: any) => setPrioridade(value)}>
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

              {/* Órgão */}
              <div>
                <Label htmlFor="orgao">Órgão</Label>
                <Input
                  id="orgao"
                  value={orgao}
                  onChange={(e) => setOrgao(e.target.value)}
                  placeholder="Ex: Conselho de Administração"
                />
              </div>
            </div>

            {/* Lista de Pontos de Agenda */}
            <div className="mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPontoAgenda}
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Ponto de Agenda
              </Button>
            </div>

            {pontosAgenda.length > 0 ? (
              <div className="space-y-3 mt-4">
                {pontosAgenda.map((ponto, index) => (
                  <div key={ponto.id} className="space-y-2 p-3 border rounded-lg bg-background">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ponto {index + 1}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removePontoAgenda(ponto.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {/* Título */}
                    <Input
                      placeholder="Título do ponto *"
                      value={ponto.titulo}
                      onChange={(e) => updatePontoAgenda(ponto.id, 'titulo', e.target.value)}
                    />
                    
                    {/* Descrição */}
                    <Textarea
                      placeholder="Descrição (opcional)"
                      value={ponto.descricao}
                      onChange={(e) => updatePontoAgenda(ponto.id, 'descricao', e.target.value)}
                      rows={2}
                    />
                    
                    {/* Tempo estimado */}
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

                    {/* DISCUSSÃO */}
                    <div className="mt-3 pt-3 border-t">
                      <Label htmlFor={`discussao-${ponto.id}`} className="text-xs font-semibold flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        Discussão
                      </Label>
                      <Textarea
                        id={`discussao-${ponto.id}`}
                        placeholder="Descreva as discussões realizadas neste ponto..."
                        value={ponto.discussao || ''}
                        onChange={(e) => updatePontoAgenda(ponto.id, 'discussao', e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    {/* INTERVENÇÕES */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Intervenções dos Participantes
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const novasIntervencoes = [...(ponto.intervencoes || []), {
                              participante_nome: '',
                              participante_cargo: '',
                              texto: ''
                            }];
                            updatePontoAgenda(ponto.id, 'intervencoes', novasIntervencoes);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                      
                      {ponto.intervencoes && ponto.intervencoes.length > 0 ? (
                        <div className="space-y-2">
                          {ponto.intervencoes.map((intervencao, intIndex) => (
                            <div key={intIndex} className="p-2 border rounded bg-muted/30 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Intervenção {intIndex + 1}</span>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const novasIntervencoes = ponto.intervencoes?.filter((_, i) => i !== intIndex) || [];
                                    updatePontoAgenda(ponto.id, 'intervencoes', novasIntervencoes);
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <Input
                                placeholder="Nome do participante"
                                value={intervencao.participante_nome}
                                onChange={(e) => {
                                  const novasIntervencoes = [...(ponto.intervencoes || [])];
                                  novasIntervencoes[intIndex].participante_nome = e.target.value;
                                  updatePontoAgenda(ponto.id, 'intervencoes', novasIntervencoes);
                                }}
                                className="text-xs"
                              />
                              <Input
                                placeholder="Cargo do participante"
                                value={intervencao.participante_cargo}
                                onChange={(e) => {
                                  const novasIntervencoes = [...(ponto.intervencoes || [])];
                                  novasIntervencoes[intIndex].participante_cargo = e.target.value;
                                  updatePontoAgenda(ponto.id, 'intervencoes', novasIntervencoes);
                                }}
                                className="text-xs"
                              />
                              <Textarea
                                placeholder="Texto da intervenção"
                                value={intervencao.texto}
                                onChange={(e) => {
                                  const novasIntervencoes = [...(ponto.intervencoes || [])];
                                  novasIntervencoes[intIndex].texto = e.target.value;
                                  updatePontoAgenda(ponto.id, 'intervencoes', novasIntervencoes);
                                }}
                                rows={2}
                                className="text-xs"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Nenhuma intervenção registada</p>
                      )}
                    </div>

                    {/* DELIBERAÇÃO */}
                    <div className="mt-3 pt-3 border-t">
                      <Label htmlFor={`decisao-${ponto.id}`} className="text-xs font-semibold flex items-center gap-1">
                        <Scale className="h-3 w-3" />
                        Deliberação / Decisão
                      </Label>
                      <Textarea
                        id={`decisao-${ponto.id}`}
                        placeholder="Descreva a decisão tomada neste ponto..."
                        value={ponto.decisao || ''}
                        onChange={(e) => updatePontoAgenda(ponto.id, 'decisao', e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>

                    {/* VOTAÇÃO */}
                    <div className="mt-3">
                      <Label className="text-xs font-semibold flex items-center gap-1">
                        <Vote className="h-3 w-3" />
                        Votação
                      </Label>
                      <Select 
                        value={ponto.tipo_votacao || 'sem_votacao'} 
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

                      {/* Campos de votação por maioria */}
                      {ponto.tipo_votacao === 'maioria' && (
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <Label htmlFor={`votos-favor-${ponto.id}`} className="text-xs">
                              Votos a favor
                            </Label>
                            <Input
                              id={`votos-favor-${ponto.id}`}
                              type="number"
                              min="0"
                              value={ponto.votos_favor || 0}
                              onChange={(e) => updatePontoAgenda(ponto.id, 'votos_favor', parseInt(e.target.value) || 0)}
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`votos-contra-${ponto.id}`} className="text-xs">
                              Votos contra
                            </Label>
                            <Input
                              id={`votos-contra-${ponto.id}`}
                              type="number"
                              min="0"
                              value={ponto.votos_contra || 0}
                              onChange={(e) => updatePontoAgenda(ponto.id, 'votos_contra', parseInt(e.target.value) || 0)}
                              className="text-xs"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`abstencoes-${ponto.id}`} className="text-xs">
                              Abstenções
                            </Label>
                            <Input
                              id={`abstencoes-${ponto.id}`}
                              type="number"
                              min="0"
                              value={ponto.abstencoes || 0}
                              onChange={(e) => updatePontoAgenda(ponto.id, 'abstencoes', parseInt(e.target.value) || 0)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4 border-2 border-dashed rounded-lg">
                <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum ponto de agenda adicionado</p>
              </div>
            )}
          </div>

          {/* ✨ NOVOS CAMPOS COMPLETOS PARA ESTRUTURA FORMAL DA ACTA */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Estrutura Formal da Acta
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Entidade */}
              <div className="md:col-span-2">
                <Label htmlFor="entidade">
                  Entidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="entidade"
                  value={entidade}
                  onChange={(e) => setEntidade(e.target.value)}
                  placeholder="Ex: Empresa XYZ"
                  required
                />
              </div>

              {/* Endereço Completo */}
              <div className="md:col-span-2">
                <Label htmlFor="endereco_completo">
                  Endereço Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="endereco_completo"
                  value={enderecoCompleto}
                  onChange={(e) => setEnderecoCompleto(e.target.value)}
                  placeholder="Ex: Rua 123, Bairro ABC"
                  required
                />
              </div>

              {/* Cidade */}
              <div>
                <Label htmlFor="cidade">
                  Cidade <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Luanda"
                  required
                />
              </div>

              {/* Número da Reunião */}
              <div>
                <Label htmlFor="numero_reuniao">
                  Número da Reunião <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="numero_reuniao"
                  value={numeroReuniao}
                  onChange={(e) => setNumeroReuniao(e.target.value)}
                  placeholder="Ex: 001"
                  required
                />
              </div>

              {/* Presidente */}
              <div>
                <Label htmlFor="presidente">
                  Presidente <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="presidente"
                  value={presidente}
                  onChange={(e) => setPresidente(e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                />
              </div>

              {/* Cargo do Presidente */}
              <div>
                <Label htmlFor="cargo_presidente">
                  Cargo do Presidente <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cargo_presidente"
                  value={cargoPresidente}
                  onChange={(e) => setCargoPresidente(e.target.value)}
                  placeholder="Ex: Diretor Geral"
                  required
                />
              </div>

              {/* Secretário */}
              <div>
                <Label htmlFor="secretario">
                  Secretário <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="secretario"
                  value={secretario}
                  onChange={(e) => setSecretario(e.target.value)}
                  placeholder="Ex: Maria Santos"
                  required
                />
              </div>

              {/* Cargo do Secretário */}
              <div>
                <Label htmlFor="cargo_secretario">
                  Cargo do Secretário <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cargo_secretario"
                  value={cargoSecretario}
                  onChange={(e) => setCargoSecretario(e.target.value)}
                  placeholder="Ex: Secretário Geral"
                  required
                />
              </div>

              {/* Texto de Abertura */}
              <div className="md:col-span-2">
                <Label htmlFor="texto_abertura">
                  Texto de Abertura <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="texto_abertura"
                  value={textoAbertura}
                  onChange={(e) => setTextoAbertura(e.target.value)}
                  placeholder="Ex: 'Em nome da empresa XYZ, o Senhor(a) Presidente declarou aberta a sessão.'"
                  rows={4}
                  required
                />
              </div>

              {/* Quorum */}
              <div className="md:col-span-2">
                <Label htmlFor="quorum">
                  Quorum <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="quorum"
                  value={quorum}
                  onChange={(e) => setQuorum(e.target.value)}
                  placeholder="Ex: 'Verificada a existência de quórum legal, o Senhor(a) Presidente declarou aberta a sessão.'"
                  rows={4}
                  required
                />
              </div>

              {/* Recomendações */}
              <div className="md:col-span-2">
                <Label htmlFor="recomendacoes">
                  Recomendações <span className="text-destructive">*</span>
                </Label>
                <div className="space-y-2">
                  {recomendacoes.map((recomendacao, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <p className="font-medium">{recomendacao}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setRecomendacoes(recomendacoes.filter((_, i) => i !== index))}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddRecomendacao(true)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Recomendação
                    </Button>
                    {showAddRecomendacao && (
                      <Card className="bg-muted/30">
                        <CardContent className="p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                              <Label htmlFor="nova_recomendacao">Recomendação *</Label>
                              <Input
                                id="nova_recomendacao"
                                value={novaRecomendacao}
                                onChange={(e) => setNovaRecomendacao(e.target.value)}
                                placeholder="Ex: 'Recomenda-se a implementação de um novo sistema de gestão.'"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowAddRecomendacao(false);
                                setNovaRecomendacao('');
                              }}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancelar
                            </Button>
                            <Button type="button" size="sm" onClick={() => {
                              setRecomendacoes([...recomendacoes, novaRecomendacao]);
                              setNovaRecomendacao('');
                              setShowAddRecomendacao(false);
                            }}>
                              <Plus className="mr-2 h-4 w-4" />
                              Adicionar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>

              {/* Texto de Encerramento */}
              <div className="md:col-span-2">
                <Label htmlFor="texto_encerramento">
                  Texto de Encerramento <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="texto_encerramento"
                  value={textoEncerramento}
                  onChange={(e) => setTextoEncerramento(e.target.value)}
                  placeholder="Ex: 'O Senhor(a) Presidente declarou encerrada a sessão.'"
                  rows={4}
                  required
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              <X className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {acta ? 'Actualizar Acta' : 'Criar Acta'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}