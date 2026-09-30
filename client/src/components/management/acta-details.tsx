import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
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
  Building2,
  Vote,
  Scale,
  X,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { Acta, DecisaoTomada, TarefaAtribuida, PontoAgenda } from "./acta-types";
import { transformarActaParaJSON } from "../../utils/transform-acta-to-json";
import { gerarPDFActa } from "../../utils/pdf-generator";
import { hasPermission } from "../auth/permissions";

interface ActaDetailsProps {
  acta: Acta;
  onBack: () => void;
  onUpdate: () => void;
}

interface AssinaturaActaBoxProps {
  label: string;
  papel: 'presidente' | 'secretario';
  color: 'blue' | 'green';
  acta: Acta;
  podeAssinar: boolean;
  onSigned: () => void;
}

function AssinaturaActaBox({ label, papel, color, acta, podeAssinar, onSigned }: AssinaturaActaBoxProps) {
  const { accessToken } = useAuth();
  const [signing, setSigning] = useState(false);
  const assinaturasReais = Array.isArray((acta as any).assinaturas_reais) ? (acta as any).assinaturas_reais : [];
  const assinatura = assinaturasReais.find((a: any) => a.papel === papel);

  const handleAssinar = async () => {
    setSigning(true);
    try {
      const response = await fetch(`${API_BASE_URL}/actas/${acta.id}/assinar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ papel }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Erro ao assinar a acta');
      toast.success('Acta assinada com sucesso!');
      onSigned();
    } catch (error) {
 console.error('Erro ao assinar acta:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao assinar a acta');
    } finally {
      setSigning(false);
    }
  };

  const toneVar = color === 'blue' ? '--tone-info' : '--tone-success';

  return (
    <div className="p-4 border-2 border-dashed rounded-lg" style={{ borderColor: `var(${toneVar})`, backgroundColor: `var(${toneVar}-soft)` }}>
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      {assinatura ? (
        <div className="pt-1">
          <img src={assinatura.assinatura_url} alt={`Assinatura de ${assinatura.nome}`} className="h-12 object-contain mb-1" />
          <p className="font-semibold">{assinatura.nome}</p>
          <p className="text-xs text-muted-foreground">
            Assinado em {format(new Date(assinatura.assinado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        </div>
      ) : podeAssinar ? (
        <div className="pt-2">
          <Button size="sm" onClick={handleAssinar} disabled={signing}>
            {signing ? 'A assinar...' : `Assinar como ${label.replace('O ', '')}`}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">
            Usa a assinatura carregada em "Meu Perfil".
          </p>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic pt-6">Aguarda assinatura</p>
      )}
    </div>
  );
}

export function ActaDetails({ acta, onBack, onUpdate }: ActaDetailsProps) {
  const { user, accessToken } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados editáveis
  const [resumo, setResumo] = useState(acta.resumo || '');
  const [discussoes, setDiscussoes] = useState(acta.discussoes || '');
  // Lista de recomendações (nao um texto unico) - e assim que o gerador do
  // documento oficial (transform-acta-to-json.ts) espera este campo.
  const [recomendacoes, setRecomendacoes] = useState<string[]>(Array.isArray(acta.recomendacoes) ? acta.recomendacoes : []);
  const [novaRecomendacao, setNovaRecomendacao] = useState('');

  // Estrutura formal do documento (entidade, presidente, secretario, etc.) -
  // sem isto o cabecalho/encerramento oficiais da acta ficam com placeholders
  // tipo "[entidade]", "[presidente]" em vez do texto real.
  const [estruturaFormal, setEstruturaFormal] = useState({
    entidade: acta.entidade || '',
    endereco_completo: acta.endereco_completo || '',
    cidade: acta.cidade || 'Luanda',
    numero_reuniao: acta.numero_reuniao || '',
    presidente: acta.presidente || '',
    cargo_presidente: acta.cargo_presidente || '',
    secretario: acta.secretario || '',
    cargo_secretario: acta.cargo_secretario || '',
  });
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
  const [pontosAgenda, setPontosAgenda] = useState<PontoAgenda[]>(
    Array.isArray(acta.pontos_agenda) ? acta.pontos_agenda : []
  );

  // 🔥 Transformar acta para estrutura JSON profissional
  const actaTransformada = useMemo(() => transformarActaParaJSON(acta), [acta]);

  const isOrganizador = user?.id === acta.organizador_id;
  // Alem do organizador, quem redige/gere actas (secretaria, administrativo,
  // gestao de topo) tambem tem de poder preencher deliberacoes, votacoes,
  // discussoes e recomendacoes - nem sempre e o organizador da reuniao que
  // faz esse trabalho.
  const podeRedigirActa = Boolean(
    user && (hasPermission(user.role, 'DRAFT_ACTAS') || hasPermission(user.role, 'MANAGE_ACTAS'))
  );
  const canEdit = (isOrganizador || podeRedigirActa) && (acta.status === 'rascunho' || acta.status === 'pendente' || acta.status === 'em_curso');

  const assinaturasReais = Array.isArray((acta as any).assinaturas_reais) ? (acta as any).assinaturas_reais : [];
  const papeisAssinados = new Set(assinaturasReais.map((a: any) => a.papel));
  const ambasAssinaturasFeitas = papeisAssinados.has('presidente') && papeisAssinados.has('secretario');

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: 'Pendente', color: 'var(--tone-warn)' },
      em_curso: { label: 'Em Curso', color: 'var(--tone-info)' },
      finalizada: { label: 'Finalizada', color: 'var(--tone-success)' },
      aprovada: { label: 'Aprovada', color: 'var(--tone-success)' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className="text-white" style={{ backgroundColor: badge.color }}>{badge.label}</Badge>;
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
            recomendacoes,
            proximos_passos: proximosPassos,
            observacoes,
            decisoes,
            tarefas,
            participantes_presentes: participantesPresentes,
            pontos_agenda: pontosAgenda,
            ...estruturaFormal,
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

  const [approving, setApproving] = useState(false);
  const handleAprovarActa = async () => {
    try {
      setApproving(true);

      const response = await fetch(
        `${API_BASE_URL}/actas/${acta.id}/aprovar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.message || 'Erro ao aprovar acta');
      }

      toast.success('Acta aprovada! Foi enviada por e-mail aos participantes.');
      onUpdate();
    } catch (error) {
 console.error('Erro ao aprovar acta:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao aprovar acta');
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Gera o PDF directamente a partir dos dados da acta (inclui sempre as
      // assinaturas reais quando existirem) - o endpoint "/actas/:id/pdf" no
      // backend e apenas um stub e nunca devolveu um PDF real.
      gerarPDFActa(acta);
    } catch (error) {
 console.error('Erro ao baixar PDF:', error);
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

  const addPontoAgenda = () => {
    const novoPonto: PontoAgenda = {
      id: `ponto-${Date.now()}`,
      ordem: pontosAgenda.length + 1,
      titulo: '',
      tipo_votacao: 'sem_votacao',
    };
    setPontosAgenda([...pontosAgenda, novoPonto]);
  };

  const updatePontoAgenda = (id: string, field: keyof PontoAgenda, value: any) => {
    setPontosAgenda(pontosAgenda.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const removePontoAgenda = (id: string) => {
    setPontosAgenda(pontosAgenda.filter(p => p.id !== id));
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
          {canEdit && !editing && (
            <Button onClick={handleFinalizarActa} disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalizar Acta
            </Button>
          )}
          {isOrganizador && acta.status === 'finalizada' && (
            <Button
              onClick={handleAprovarActa}
              disabled={approving || !ambasAssinaturasFeitas}
              title={!ambasAssinaturasFeitas ? 'Aguarda a assinatura do Presidente e do Secretário' : undefined}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {approving ? 'A aprovar...' : 'Aprovar Acta'}
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Eye className="mr-2 h-4 w-4" />
            Ver PDF
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
                  <div className="border p-3 rounded-lg" style={{ backgroundColor: 'var(--tone-success-soft)', borderColor: 'var(--tone-success)' }}>
                    <p className="text-sm font-medium" style={{ color: 'var(--tone-success)' }}>
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
                    <div key={`ponto-${index}-${ponto.titulo}`} className="flex gap-3 p-3 border rounded-lg" style={{ backgroundColor: 'var(--tone-info-soft)', borderColor: 'var(--tone-info)' }}>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: 'var(--tone-info)' }}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: 'var(--tone-info)' }}>{ponto.titulo}</p>
                        {ponto.observacao && (
                          <p className="text-sm mt-1" style={{ color: 'var(--tone-info)' }}>{ponto.observacao}</p>
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
                    <div className="border-b p-3" style={{ backgroundColor: 'var(--tone-accent-soft)', borderColor: 'var(--tone-accent)' }}>
                      <p className="font-semibold" style={{ color: 'var(--tone-accent)' }}>
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
                  <div key={`deliberacao-${index}-${deliberacao.numero}`} className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--tone-success)' }}>
                    <div className="border-b p-3" style={{ backgroundColor: 'var(--tone-success-soft)', borderColor: 'var(--tone-success)' }}>
                      <p className="font-semibold" style={{ color: 'var(--tone-success)' }}>
                        {deliberacao.numero}: {deliberacao.titulo}
                      </p>
                    </div>
                    <div className="p-4" style={{ backgroundColor: 'var(--tone-success-soft)' }}>
                      <p className="text-sm font-medium leading-relaxed text-justify" style={{ color: 'var(--tone-success)' }}>
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
                <div className="border rounded-lg p-4" style={{ backgroundColor: 'var(--tone-gold-soft)', borderColor: 'var(--tone-gold)' }}>
                  <ul className="space-y-2">
                    {actaTransformada.recomendacoes.lista.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="font-bold" style={{ color: 'var(--tone-gold)' }}>{idx + 1}.</span>
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

          {/* ✍️ ASSINATURAS DIGITAIS - mesmo modelo usado na Ordem de Pagamento:
              usa a assinatura carregada em "Meu Perfil" pelo Presidente/Secretário. */}
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AssinaturaActaBox
                  label="O Presidente"
                  papel="presidente"
                  color="blue"
                  acta={acta}
                  podeAssinar={user?.role === 'gabinete_pca'}
                  onSigned={onUpdate}
                />
                <AssinaturaActaBox
                  label="O Secretário"
                  papel="secretario"
                  color="green"
                  acta={acta}
                  podeAssinar={user?.role === 'secretaria'}
                  onSigned={onUpdate}
                />
              </div>
              {acta.status === 'finalizada' && !ambasAssinaturasFeitas && (
                <p className="text-xs text-muted-foreground mt-3">
                  Depois de assinada pelo Presidente e pelo Secretário, a acta pode ser aprovada e será enviada por e-mail a todos os participantes.
                </p>
              )}
            </CardContent>
          </Card>

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
                      className="hover:underline"
                      style={{ color: 'var(--ring)' }}
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

          {/* Discussões e Recomendações gerais da reuniao */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Discussões e Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="discussoes">Discussões</Label>
                {editing ? (
                  <Textarea
                    id="discussoes"
                    placeholder="Resuma os pontos discutidos na reunião..."
                    value={discussoes}
                    onChange={(e) => setDiscussoes(e.target.value)}
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {discussoes || 'Nenhuma discussão registada'}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Recomendações</Label>
                {recomendacoes.length === 0 && !editing && (
                  <p className="text-sm text-muted-foreground">Nenhuma recomendação registada</p>
                )}
                {recomendacoes.length > 0 && (
                  <div className="space-y-2">
                    {recomendacoes.map((rec, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                        <p className="text-sm">{rec}</p>
                        {editing && (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setRecomendacoes(recomendacoes.filter((_, i) => i !== idx))}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {editing && (
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
                )}
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
              {editing ? (
                <>
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
                </>
              ) : (
                <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                  <p><span className="text-foreground font-medium">Entidade:</span> {estruturaFormal.entidade || '-'}</p>
                  <p><span className="text-foreground font-medium">Nº Reunião:</span> {estruturaFormal.numero_reuniao || '-'}</p>
                  <p><span className="text-foreground font-medium">Presidente:</span> {estruturaFormal.presidente || '-'} {estruturaFormal.cargo_presidente && `(${estruturaFormal.cargo_presidente})`}</p>
                  <p><span className="text-foreground font-medium">Secretário:</span> {estruturaFormal.secretario || '-'} {estruturaFormal.cargo_secretario && `(${estruturaFormal.cargo_secretario})`}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pontos de Agenda e Votações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  Pontos de Agenda e Votações ({pontosAgenda.length})
                </CardTitle>
                {editing && (
                  <Button size="sm" variant="outline" onClick={addPontoAgenda}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Ponto
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {pontosAgenda.length === 0 && !editing && (
                <p className="text-sm text-muted-foreground italic">Nenhum ponto de agenda registado</p>
              )}
              {pontosAgenda.map((ponto, index) => (
                <div key={ponto.id} className="border rounded-lg p-4 space-y-3">
                  {editing ? (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <Input
                          placeholder={`Ponto ${index + 1}: título`}
                          value={ponto.titulo}
                          onChange={(e) => updatePontoAgenda(ponto.id, 'titulo', e.target.value)}
                          className="font-medium"
                        />
                        <Button size="sm" variant="ghost" onClick={() => removePontoAgenda(ponto.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Descrição do ponto..."
                        value={ponto.descricao || ''}
                        onChange={(e) => updatePontoAgenda(ponto.id, 'descricao', e.target.value)}
                        rows={2}
                      />
                      <div>
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Discussão
                        </Label>
                        <Textarea
                          placeholder="Descreva as discussões realizadas neste ponto..."
                          value={ponto.discussao || ''}
                          onChange={(e) => updatePontoAgenda(ponto.id, 'discussao', e.target.value)}
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs font-semibold flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Intervenções dos Participantes
                          </Label>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const novas = [...(ponto.intervencoes || []), { participante_nome: '', participante_cargo: '', texto: '' }];
                              updatePontoAgenda(ponto.id, 'intervencoes', novas);
                            }}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Adicionar
                          </Button>
                        </div>
                        {(ponto.intervencoes || []).map((interv, intIndex) => (
                          <div key={intIndex} className="p-2 border rounded bg-muted/30 space-y-2 mb-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">Intervenção {intIndex + 1}</span>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  const novas = (ponto.intervencoes || []).filter((_, i) => i !== intIndex);
                                  updatePontoAgenda(ponto.id, 'intervencoes', novas);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            <Input
                              placeholder="Nome do participante"
                              value={interv.participante_nome}
                              onChange={(e) => {
                                const novas = [...(ponto.intervencoes || [])];
                                novas[intIndex] = { ...novas[intIndex], participante_nome: e.target.value };
                                updatePontoAgenda(ponto.id, 'intervencoes', novas);
                              }}
                              className="text-xs"
                            />
                            <Input
                              placeholder="Cargo do participante"
                              value={interv.participante_cargo}
                              onChange={(e) => {
                                const novas = [...(ponto.intervencoes || [])];
                                novas[intIndex] = { ...novas[intIndex], participante_cargo: e.target.value };
                                updatePontoAgenda(ponto.id, 'intervencoes', novas);
                              }}
                              className="text-xs"
                            />
                            <Textarea
                              placeholder="Texto da intervenção"
                              value={interv.texto}
                              onChange={(e) => {
                                const novas = [...(ponto.intervencoes || [])];
                                novas[intIndex] = { ...novas[intIndex], texto: e.target.value };
                                updatePontoAgenda(ponto.id, 'intervencoes', novas);
                              }}
                              rows={2}
                              className="text-xs"
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <Scale className="h-3 w-3" />
                          Deliberação / Decisão
                        </Label>
                        <Textarea
                          placeholder="Descreva a decisão tomada neste ponto..."
                          value={ponto.decisao || ''}
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
                        {ponto.tipo_votacao === 'maioria' && (
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div>
                              <Label className="text-xs">Votos a favor</Label>
                              <Input
                                type="number"
                                min="0"
                                value={ponto.votos_favor || 0}
                                onChange={(e) => updatePontoAgenda(ponto.id, 'votos_favor', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Votos contra</Label>
                              <Input
                                type="number"
                                min="0"
                                value={ponto.votos_contra || 0}
                                onChange={(e) => updatePontoAgenda(ponto.id, 'votos_contra', parseInt(e.target.value) || 0)}
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Abstenções</Label>
                              <Input
                                type="number"
                                min="0"
                                value={ponto.abstencoes || 0}
                                onChange={(e) => updatePontoAgenda(ponto.id, 'abstencoes', parseInt(e.target.value) || 0)}
                              />
                            </div>
                          </div>
                        )}
                        {ponto.tipo_votacao === 'unanimidade' && (
                          <Input
                            className="mt-2"
                            placeholder="Resultado (ex: Aprovado por unanimidade)"
                            value={ponto.resultado_votacao || ''}
                            onChange={(e) => updatePontoAgenda(ponto.id, 'resultado_votacao', e.target.value)}
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">{index + 1}. {ponto.titulo || 'Sem título'}</p>
                      {ponto.descricao && <p className="text-sm text-muted-foreground">{ponto.descricao}</p>}
                      {ponto.discussao && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ponto.discussao}</p>
                      )}
                      {(ponto.intervencoes || []).length > 0 && (
                        <div className="space-y-1">
                          {(ponto.intervencoes || []).map((interv, i) => (
                            <div key={i} className="bg-muted/30 p-2 rounded text-sm">
                              <p className="font-medium">{interv.participante_nome} ({interv.participante_cargo})</p>
                              <p className="text-muted-foreground mt-1">{interv.texto}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {ponto.decisao && (
                        <p className="text-sm font-medium p-2 rounded" style={{ color: 'var(--tone-success)', backgroundColor: 'var(--tone-success-soft)' }}>{ponto.decisao}</p>
                      )}
                      {ponto.tipo_votacao && ponto.tipo_votacao !== 'sem_votacao' && (
                        <div className="border p-3 rounded space-y-2" style={{ backgroundColor: 'var(--tone-accent-soft)', borderColor: 'var(--tone-accent)' }}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-white" style={{ backgroundColor: 'var(--tone-accent)' }}>
                              {ponto.tipo_votacao === 'unanimidade' ? 'Unanimidade' : 'Maioria'}
                            </Badge>
                            {ponto.resultado_votacao && (
                              <span className="text-sm font-medium" style={{ color: 'var(--tone-accent)' }}>{ponto.resultado_votacao}</span>
                            )}
                          </div>
                          {ponto.tipo_votacao === 'maioria' && (
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div className="bg-white p-2 rounded text-center">
                                <p className="text-xs text-muted-foreground">A Favor</p>
                                <p className="font-bold" style={{ color: 'var(--tone-success)' }}>{ponto.votos_favor || 0}</p>
                              </div>
                              <div className="bg-white p-2 rounded text-center">
                                <p className="text-xs text-muted-foreground">Contra</p>
                                <p className="font-bold" style={{ color: 'var(--tone-danger)' }}>{ponto.votos_contra || 0}</p>
                              </div>
                              <div className="bg-white p-2 rounded text-center">
                                <p className="text-xs text-muted-foreground">Abstenções</p>
                                <p className="font-bold" style={{ color: 'var(--tone-neutral)' }}>{ponto.abstencoes || 0}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Decisões Gerais (não ligadas a um ponto de agenda especifico) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Decisões ({decisoes.length})
                </CardTitle>
                {editing && (
                  <Button size="sm" variant="outline" onClick={addDecisao}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Decisão
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {decisoes.length === 0 && !editing && (
                <p className="text-sm text-muted-foreground italic">Nenhuma decisão registada</p>
              )}
              {decisoes.map((decisao) => (
                <div key={decisao.id} className="border rounded-lg p-3 space-y-2">
                  {editing ? (
                    <>
                      <div className="flex items-start gap-2">
                        <Textarea
                          placeholder="Descrição da decisão"
                          value={decisao.descricao}
                          onChange={(e) => updateDecisao(decisao.id, 'descricao', e.target.value)}
                          rows={2}
                          className="flex-1"
                        />
                        <Button size="sm" variant="ghost" onClick={() => removeDecisao(decisao.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Responsável"
                          value={decisao.responsavel || ''}
                          onChange={(e) => updateDecisao(decisao.id, 'responsavel', e.target.value)}
                        />
                        <Input
                          type="date"
                          value={decisao.prazo || ''}
                          onChange={(e) => updateDecisao(decisao.id, 'prazo', e.target.value)}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm">{decisao.descricao}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {decisao.responsavel && <span>Responsável: {decisao.responsavel}</span>}
                        {decisao.prazo && (
                          <span>Prazo: {format(new Date(decisao.prazo), "dd/MM/yyyy", { locale: ptBR })}</span>
                        )}
                        <Badge variant="outline">{decisao.status || 'pendente'}</Badge>
                      </div>
                    </>
                  )}
                </div>
              ))}
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
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isPresente ? 'var(--tone-success)' : 'var(--tone-neutral)' }}
                      />
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
                <span className="font-medium" style={{ color: 'var(--tone-success)' }}>
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
                  <span className="font-medium" style={{ color: 'var(--tone-accent)' }}>{actaTransformada.discussoes.length}</span>
                </div>
              )}
              {actaTransformada.deliberacoes && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deliberações</span>
                  <span className="font-medium" style={{ color: 'var(--tone-success)' }}>{actaTransformada.deliberacoes.length}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
