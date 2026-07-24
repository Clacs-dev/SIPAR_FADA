import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { toast } from "sonner@2.0.3";
import { 
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  Download,
  UserCheck,
  ListTodo,
  MessageSquare,
  Plus,
  Trash2,
  FileEdit,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { Acta, DecisaoTomada, TarefaAtribuida, PontoAgenda } from "./acta-types";
import { transformarActaParaJSON } from "../../utils/transform-acta-to-json";

interface ActaDetailsProps {
  acta: Acta;
  onBack: () => void;
  onUpdate: () => void;
}

export function ActaDetails({ acta, onBack, onUpdate }: ActaDetailsProps) {
  const { user, accessToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados editáveis
  const [resumo, setResumo] = useState(acta.resumo || '');
  const [discussoes, setDiscussoes] = useState(acta.discussoes || '');
  const [proximosPassos, setProximosPassos] = useState(acta.proximos_passos || '')
  const [observacoes, setObservacoes] = useState(acta.observacoes || '');
  const [decisoes, setDecisoes] = useState<DecisaoTomada[]>(
    Array.isArray(acta.decisoes) ? acta.decisoes : []
  );
  const [tarefas, setTarefas] = useState<TarefaAtribuida[]>(
    Array.isArray(acta.tarefas) ? acta.tarefas : []
  );
  const [participantesPresentes, setParticipantesPresentes] = useState<string[]>(
    Array.isArray(acta.participantes_presentes) ? acta.participantes_presentes : []
  );

  // 🔥 Transformar acta para estrutura JSON profissional
  const actaTransformada = useMemo(() => transformarActaParaJSON(acta), [acta]);

  const isOrganizador = user?.id === acta.organizador_id;
  const canEdit = isOrganizador && (acta.status === 'pendente' || acta.status === 'em_curso');

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: 'Pendente', color: 'bg-yellow-500' },
      em_curso: { label: 'Em Curso', color: 'bg-blue-500' },
      finalizada: { label: 'Finalizada', color: 'bg-green-500' },
      aprovada: { label: 'Aprovada', color: 'bg-green-700' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${API_BASE_URL}/actas/${acta.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            resumo,
            discussoes,
            proximos_passos: proximosPassos,
            observacoes,
            decisoes,
            tarefas,
            participantes_presentes: participantesPresentes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao salvar acta');
      }

      toast.success('Acta actualizada com sucesso!');
      setEditing(false);
      onUpdate();
    } catch (error) {
 console.error('Erro ao salvar acta:', error);
      toast.error('Erro ao salvar acta');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalizarActa = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${API_BASE_URL}/actas/${acta.id}/finalizar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao finalizar acta');
      }

      toast.success('Acta finalizada com sucesso!');
      onUpdate();
      onBack();
    } catch (error) {
 console.error('Erro ao finalizar acta:', error);
      toast.error('Erro ao finalizar acta');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      toast.info('A gerar PDF...');
      
      const response = await fetch(
        `${API_BASE_URL}/actas/${acta.id}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      // Obter o blob do PDF
      const blob = await response.blob();
      
      // Obter o nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'acta.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Criar URL temporário e fazer download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
 console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar PDF');
    }
  };

  const togglePresenca = (userId: string) => {
    if (participantesPresentes.includes(userId)) {
      setParticipantesPresentes(participantesPresentes.filter(id => id !== userId));
    } else {
      setParticipantesPresentes([...participantesPresentes, userId]);
    }
  };

  const getParticipanteId = (participante: any, index: number) => {
    return String(
      participante.id ||
      participante.user_id ||
      participante.usuario_id ||
      participante.email ||
      participante.nome ||
      `participante-${index}`
    );
  };

  const addDecisao = () => {
    const novaDecisao: DecisaoTomada = {
      id: `decisao-${Date.now()}`,
      descricao: '',
      status: 'pendente',
    };
    setDecisoes([...decisoes, novaDecisao]);
  };

  const updateDecisao = (id: string, field: keyof DecisaoTomada, value: any) => {
    setDecisoes(decisoes.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const removeDecisao = (id: string) => {
    setDecisoes(decisoes.filter(d => d.id !== id));
  };

  const addTarefa = () => {
    const novaTarefa: TarefaAtribuida = {
      id: `tarefa-${Date.now()}`,
      descricao: '',
      responsavel: '',
      status: 'pendente',
      prioridade: 'normal',
    };
    setTarefas([...tarefas, novaTarefa]);
  };

  const updateTarefa = (id: string, field: keyof TarefaAtribuida, value: any) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const removeTarefa = (id: string) => {
    setTarefas(tarefas.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              {actaTransformada.cabecalho?.titulo || acta.numero}
            </h1>
            <p className="text-muted-foreground">{acta.titulo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {editing && (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                Guardar
              </Button>
            </>
          )}
          {canEdit && acta.status !== 'finalizada' && !editing && (
            <Button onClick={handleFinalizarActa} disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar Acta
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-2">
        {getStatusBadge(acta.status)}
        {acta.rascunho && (
          <Badge variant="outline">Rascunho</Badge>
        )}
        <Badge variant="outline">{acta.tipo === 'online' ? 'Online' : 'Presencial'}</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Coluna Principal - 2/3 */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 🏢 CABEÇALHO OFICIAL */}
          {actaTransformada.cabecalho && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Cabeçalho da Acta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-center mb-3">
                    {actaTransformada.cabecalho.titulo}
                  </h3>
                  <p className="text-sm leading-relaxed text-justify">
                    {actaTransformada.cabecalho.texto_abertura}
                  </p>
                </div>
                {actaTransformada.cabecalho.quorum && (
                  <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                    <p className="text-sm font-medium text-green-900">
                      {actaTransformada.cabecalho.quorum}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 📋 AGENDA OFICIAL */}
          {actaTransformada.agenda && actaTransformada.agenda.pontos?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5" />
                  Agenda da Reunião
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium">{actaTransformada.agenda.descricao}</p>
                <div className="space-y-2">
                  {actaTransformada.agenda.pontos.map((ponto: any, index: number) => (
                    <div key={`ponto-${index}-${ponto.titulo}`} className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">{ponto.titulo}</p>
                        {ponto.observacao && (
                          <p className="text-sm text-blue-700 mt-1">{ponto.observacao}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 💬 DISCUSSÕES PROFISSIONAIS COM TEMPLATES */}
          {actaTransformada.discussoes && actaTransformada.discussoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Discussões ({actaTransformada.discussoes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {actaTransformada.discussoes.map((discussao: any, index: number) => (
                  <div key={`discussao-${index}-${discussao.numero}`} className="border border-border rounded-lg overflow-hidden">
                    <div className="bg-purple-50 border-b border-purple-200 p-3">
                      <p className="font-semibold text-purple-900">
                        {discussao.numero}: {discussao.titulo}
                      </p>
                    </div>
                    <div className="p-4">
                      <p className="text-sm leading-relaxed text-justify">
                        {discussao.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* ⚖️ DELIBERAÇÕES PROFISSIONAIS COM TEMPLATES */}
          {actaTransformada.deliberacoes && actaTransformada.deliberacoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Deliberações ({actaTransformada.deliberacoes.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {actaTransformada.deliberacoes.map((deliberacao: any, index: number) => (
                  <div key={`deliberacao-${index}-${deliberacao.numero}`} className="border border-green-200 rounded-lg overflow-hidden">
                    <div className="bg-green-50 border-b border-green-200 p-3">
                      <p className="font-semibold text-green-900">
                        {deliberacao.numero}: {deliberacao.titulo}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50/30">
                      <p className="text-sm font-medium leading-relaxed text-justify text-green-900">
                        {deliberacao.texto}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 💡 RECOMENDAÇÕES */}
          {actaTransformada.recomendacoes && actaTransformada.recomendacoes.lista?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileEdit className="h-5 w-5" />
                  Recomendações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <ul className="space-y-2">
                    {actaTransformada.recomendacoes.lista.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-yellow-600 font-bold">{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {actaTransformada.recomendacoes.nota && (
                  <p className="text-xs text-muted-foreground italic">
                    {actaTransformada.recomendacoes.nota}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* 🔚 ENCERRAMENTO OFICIAL */}
          {actaTransformada.encerramento && (
            <Card>
              <CardHeader>
                <CardTitle>Encerramento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-justify">
                  {actaTransformada.encerramento.texto}
                </p>
              </CardContent>
            </Card>
          )}

          {/* ✍️ ASSINATURAS DIGITAIS */}
          {actaTransformada.assinaturas && (
            <Card>
              <CardHeader>
                <CardTitle>Assinaturas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {actaTransformada.assinaturas.presidente && (
                    <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50">
                      <p className="text-xs text-muted-foreground mb-2">O Presidente</p>
                      <div className="border-t-2 border-blue-600 pt-2 mt-8">
                        <p className="font-semibold">{actaTransformada.assinaturas.presidente.nome}</p>
                        <p className="text-sm text-muted-foreground">{actaTransformada.assinaturas.presidente.cargo}</p>
                      </div>
                    </div>
                  )}
                  {actaTransformada.assinaturas.secretario && (
                    <div className="p-4 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                      <p className="text-xs text-muted-foreground mb-2">O Secretário</p>
                      <div className="border-t-2 border-green-600 pt-2 mt-8">
                        <p className="font-semibold">{actaTransformada.assinaturas.secretario.nome}</p>
                        <p className="text-sm text-muted-foreground">{actaTransformada.assinaturas.secretario.cargo}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator className="my-6" />

          {/* Informações da Reunião */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Reunião</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(acta.data_reuniao), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horário</p>
                  <p className="flex items-center gap-2 font-medium">
                    <Clock className="h-4 w-4" />
                    {acta.hora_inicio} - {acta.hora_fim}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Organizador</p>
                <p className="font-medium">{acta.organizador_nome}</p>
              </div>

              {acta.tipo === 'online' && acta.link_reuniao && (
                <div>
                  <p className="text-sm text-muted-foreground">Link da Reunião</p>
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    <a 
                      href={acta.link_reuniao} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {acta.link_reuniao}
                    </a>
                  </div>
                </div>
              )}

              {acta.local && (
                <div>
                  <p className="text-sm text-muted-foreground">Local</p>
                  <p className="flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4" />
                    {acta.local}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Participantes e Presenças */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participantes ({acta.participantes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {acta.participantes.map((participante, index) => {
                  const participanteId = getParticipanteId(participante, index);
                  const isPresente = participantesPresentes.includes(participanteId);

                  return (
                  <div 
                    key={participanteId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        isPresente
                          ? 'bg-green-500' 
                          : 'bg-gray-300'
                      }`} />
                      <div>
                        <p className="font-medium">{participante.nome}</p>
                        <p className="text-sm text-muted-foreground">{participante.email}</p>
                      </div>
                    </div>
                    {editing && (
                      <Button
                        size="sm"
                        variant={isPresente ? "default" : "outline"}
                        onClick={() => togglePresenca(participanteId)}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        {isPresente ? 'Presente' : 'Ausente'}
                      </Button>
                    )}
                    {!editing && (
                      <Badge variant={isPresente ? "default" : "outline"}>
                        {isPresente ? 'Presente' : 'Ausente'}
                      </Badge>
                    )}
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - 1/3 */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Criado por</p>
                <p className="font-medium">{acta.created_by_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Data de criação</p>
                <p className="font-medium">
                  {format(new Date(acta.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              </div>
              {acta.updated_at && (
                <div>
                  <p className="text-muted-foreground">Última actualização</p>
                  <p className="font-medium">
                    {format(new Date(acta.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
              {acta.finalizada_em && (
                <div>
                  <p className="text-muted-foreground">Finalizada em</p>
                  <p className="font-medium">
                    {format(new Date(acta.finalizada_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estatísticas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pontos de Agenda</span>
                <span className="font-medium">{acta.pontos_agenda?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Participantes</span>
                <span className="font-medium">{acta.participantes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Presentes</span>
                <span className="font-medium text-green-600">
                  {participantesPresentes.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Decisões</span>
                <span className="font-medium">{decisoes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarefas</span>
                <span className="font-medium">{tarefas.length}</span>
              </div>
              {actaTransformada.discussoes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discussões</span>
                  <span className="font-medium text-purple-600">{actaTransformada.discussoes.length}</span>
                </div>
              )}
              {actaTransformada.deliberacoes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deliberações</span>
                  <span className="font-medium text-green-600">{actaTransformada.deliberacoes.length}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
