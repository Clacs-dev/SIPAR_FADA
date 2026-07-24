import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import {
  FileText,
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  X,
  Send,
  Archive,
  Edit,
  AlertCircle,
  FileEdit,
  ArrowLeft
} from 'lucide-react';
import { useActas } from '../../hooks/useActas';
import type { Acta } from '../../types/acta';
import { DEPARTMENTS } from '../admin/departments';

interface ActaDetailsProps {
  acta: Acta;
  onEdit: () => void;
  onBack: () => void;
}

export function ActaDetails({ acta, onEdit, onBack }: ActaDetailsProps) {
  const { enviarRevisao, aprovarActa, rejeitarActa, arquivarActa } = useActas();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para formulários
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [comentarioAprovacao, setComentarioAprovacao] = useState('');

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'bg-gray-500';
      case 'em_revisao':
        return 'bg-blue-500';
      case 'aprovada':
        return 'bg-green-500';
      case 'arquivada':
        return 'bg-slate-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <FileEdit className="h-4 w-4" />;
      case 'em_revisao':
        return <Clock className="h-4 w-4" />;
      case 'aprovada':
        return <CheckCircle className="h-4 w-4" />;
      case 'arquivada':
        return <Archive className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Função para obter label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho';
      case 'em_revisao':
        return 'Em Revisão';
      case 'aprovada':
        return 'Aprovada';
      case 'arquivada':
        return 'Arquivada';
      default:
        return status;
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handlers de ações
  const handleEnviarRevisao = async () => {
    if (!confirm('Deseja enviar esta acta para revisão?')) return;

    setLoading(true);
    setError(null);
    try {
      await enviarRevisao(acta.id);
    } catch (err) {
      setError('Erro ao enviar para revisão');
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async () => {
    setLoading(true);
    setError(null);
    try {
      await aprovarActa(acta.id, comentarioAprovacao || undefined);
      setShowApproveForm(false);
      setComentarioAprovacao('');
    } catch (err) {
      setError('Erro ao aprovar acta');
    } finally {
      setLoading(false);
    }
  };

  const handleRejeitar = async () => {
    if (!motivoRejeicao.trim()) {
      alert('Motivo da rejeição é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await rejeitarActa(acta.id, motivoRejeicao);
      setShowRejectForm(false);
      setMotivoRejeicao('');
    } catch (err) {
      setError('Erro ao rejeitar acta');
    } finally {
      setLoading(false);
    }
  };

  const handleArquivar = async () => {
    if (!confirm('Deseja arquivar esta acta? Esta ação não pode ser desfeita.')) return;

    setLoading(true);
    setError(null);
    try {
      await arquivarActa(acta.id);
    } catch (err) {
      setError('Erro ao arquivar acta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Botão Voltar */}
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar à Lista
      </Button>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {acta.numero}
                </CardTitle>
                <Badge variant="secondary" className={`${getStatusColor(acta.status)} text-white`}>
                  <span className="mr-1">{getStatusIcon(acta.status)}</span>
                  {getStatusLabel(acta.status)}
                </Badge>
                <Badge variant="outline">
                  {acta.tipo_reuniao === 'ordinaria' ? 'Ordinária' : 'Extraordinária'}
                </Badge>
              </div>
              <CardDescription className="text-base">{acta.assunto}</CardDescription>
            </div>

            {acta.status !== 'arquivada' && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* 🏢 Informações da Entidade */}
          {(acta.entidade || acta.endereco_completo || acta.cidade || acta.numero_reuniao) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações da Entidade
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {acta.entidade && (
                  <div>
                    <span className="text-muted-foreground">Entidade:</span>
                    <p className="font-medium">{acta.entidade}</p>
                  </div>
                )}
                {acta.endereco_completo && (
                  <div>
                    <span className="text-muted-foreground">Endereço:</span>
                    <p className="font-medium">{acta.endereco_completo}</p>
                  </div>
                )}
                {acta.cidade && (
                  <div>
                    <span className="text-muted-foreground">Cidade:</span>
                    <p className="font-medium">{acta.cidade}</p>
                  </div>
                )}
                {acta.numero_reuniao && (
                  <div>
                    <span className="text-muted-foreground">Nº da Reunião:</span>
                    <p className="font-medium">{acta.numero_reuniao}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 👥 Responsáveis pela Reunião */}
          {(acta.presidente || acta.secretario) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Responsáveis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {acta.presidente && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-xs text-muted-foreground">Presidente</span>
                    <p className="font-medium text-blue-900">{acta.presidente}</p>
                    {acta.cargo_presidente && (
                      <p className="text-sm text-blue-700">{acta.cargo_presidente}</p>
                    )}
                  </div>
                )}
                {acta.secretario && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-xs text-muted-foreground">Secretário(a)</span>
                    <p className="font-medium text-green-900">{acta.secretario}</p>
                    {acta.cargo_secretario && (
                      <p className="text-sm text-green-700">{acta.cargo_secretario}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informações da Reunião */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Informações da Reunião
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Data:</span>
                <p className="font-medium">{formatDate(acta.data_reuniao)}</p>
              </div>

              {(acta.hora_inicio || acta.hora_fim) && (
                <div>
                  <span className="text-muted-foreground">Horário:</span>
                  <p className="font-medium">
                    {acta.hora_inicio || '--:--'} às {acta.hora_fim || '--:--'}
                  </p>
                </div>
              )}

              {acta.local && (
                <div>
                  <span className="text-muted-foreground">Local:</span>
                  <p className="font-medium">{acta.local}</p>
                </div>
              )}

              {acta.departamento && (
                <div>
                  <span className="text-muted-foreground">Departamento:</span>
                  <p className="font-medium">
                    {DEPARTMENTS.find((d) => d.id === acta.departamento)?.name ||
                      acta.departamento}
                  </p>
                </div>
              )}

              {acta.orgao && (
                <div>
                  <span className="text-muted-foreground">Órgão:</span>
                  <p className="font-medium">{acta.orgao}</p>
                </div>
              )}
            </div>
          </div>

          {/* 📝 Texto de Abertura */}
          {acta.texto_abertura && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Texto de Abertura</h3>
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap text-sm">
                {acta.texto_abertura}
              </div>
            </div>
          )}

          {/* ✅ Quórum */}
          {acta.quorum && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Quórum</h3>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg whitespace-pre-wrap text-sm">
                {acta.quorum}
              </div>
            </div>
          )}

          {/* 📋 Pontos de Agenda Completos */}
          {acta.pontos_agenda && acta.pontos_agenda.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <FileEdit className="h-4 w-4" />
                Pontos de Agenda ({acta.pontos_agenda.length})
              </h3>
              <div className="space-y-4">
                {acta.pontos_agenda.map((ponto: any, index: number) => (
                  <div
                    key={ponto.id || index}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    {/* Cabeçalho do Ponto */}
                    <div className="bg-blue-50 border-b border-blue-200 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-blue-900">
                            Ponto {index + 1}: {ponto.titulo}
                          </p>
                          {ponto.descricao && (
                            <p className="text-sm text-blue-700 mt-1">{ponto.descricao}</p>
                          )}
                        </div>
                        {ponto.tempo_estimado && (
                          <Badge variant="outline" className="ml-2">
                            <Clock className="h-3 w-3 mr-1" />
                            {ponto.tempo_estimado} min
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo do Ponto */}
                    <div className="p-4 space-y-3">
                      {/* Discussão */}
                      {ponto.discussao && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Discussão
                          </h4>
                          <p className="text-sm whitespace-pre-wrap">{ponto.discussao}</p>
                        </div>
                      )}

                      {/* Intervenções */}
                      {ponto.intervencoes && ponto.intervencoes.length > 0 && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Intervenções
                          </h4>
                          <div className="space-y-2">
                            {ponto.intervencoes.map((interv: any, idx: number) => (
                              <div key={idx} className="bg-muted/30 p-2 rounded text-sm">
                                <p className="font-medium">
                                  {interv.participante_nome} ({interv.participante_cargo})
                                </p>
                                <p className="text-muted-foreground mt-1">{interv.texto}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Decisão */}
                      {ponto.decisao && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Decisão
                          </h4>
                          <p className="text-sm font-medium text-green-900 bg-green-50 p-2 rounded">
                            {ponto.decisao}
                          </p>
                        </div>
                      )}

                      {/* Votação */}
                      {ponto.tipo_votacao && ponto.tipo_votacao !== 'sem_votacao' && (
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                            Votação
                          </h4>
                          <div className="bg-purple-50 border border-purple-200 p-3 rounded space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="bg-purple-600 text-white">
                                {ponto.tipo_votacao === 'unanimidade' ? 'Unanimidade' : 'Maioria'}
                              </Badge>
                              {ponto.resultado_votacao && (
                                <span className="text-sm font-medium text-purple-900">
                                  {ponto.resultado_votacao}
                                </span>
                              )}
                            </div>
                            {ponto.tipo_votacao === 'maioria' && (
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="bg-white p-2 rounded text-center">
                                  <p className="text-xs text-muted-foreground">A Favor</p>
                                  <p className="font-bold text-green-600">{ponto.votos_favor || 0}</p>
                                </div>
                                <div className="bg-white p-2 rounded text-center">
                                  <p className="text-xs text-muted-foreground">Contra</p>
                                  <p className="font-bold text-red-600">{ponto.votos_contra || 0}</p>
                                </div>
                                <div className="bg-white p-2 rounded text-center">
                                  <p className="text-xs text-muted-foreground">Abstenções</p>
                                  <p className="font-bold text-gray-600">{ponto.abstencoes || 0}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 💡 Recomendações */}
          {acta.recomendacoes && acta.recomendacoes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Recomendações
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ul className="space-y-2">
                  {acta.recomendacoes.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-yellow-600 font-bold">{idx + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 🔚 Texto de Encerramento */}
          {acta.texto_encerramento && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Texto de Encerramento</h3>
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap text-sm">
                {acta.texto_encerramento}
              </div>
            </div>
          )}

          {/* Participantes */}
          {acta.participantes && acta.participantes.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participantes ({acta.participantes.length})
              </h3>
              <div className="space-y-2">
                {acta.participantes.map((participante) => (
                  <div
                    key={participante.id || participante.user_id || participante.nome}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{participante.nome}</p>
                      {(participante.cargo || participante.departamento) && (
                        <p className="text-sm text-muted-foreground">
                          {participante.cargo}
                          {participante.cargo && participante.departamento && ' • '}
                          {participante.departamento &&
                            DEPARTMENTS.find((d) => d.id === participante.departamento)?.name}
                        </p>
                      )}
                    </div>
                    <Badge variant={participante.presente ? 'default' : 'secondary'}>
                      {participante.presente ? 'Presente' : 'Ausente'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pauta */}
          {acta.pauta && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Pauta da Reunião</h3>
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                {acta.pauta}
              </div>
            </div>
          )}

          {/* Conteúdo */}
          {acta.conteudo && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Conteúdo da Acta</h3>
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                {acta.conteudo}
              </div>
            </div>
          )}

          {/* Decisões */}
          {acta.decisoes && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Decisões Tomadas</h3>
              <div className="bg-muted/30 p-4 rounded-lg whitespace-pre-wrap">
                {acta.decisoes}
              </div>
            </div>
          )}

          {/* Motivo de Rejeição (se houver) */}
          {acta.motivo_rejeicao && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Motivo da Rejeição
              </h3>
              <div className="bg-destructive/10 border border-destructive p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{acta.motivo_rejeicao}</p>
                {acta.rejeitado_by_name && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Rejeitado por {acta.rejeitado_by_name} em {formatDateTime(acta.rejeitado_at!)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Comentário de Aprovação (se houver) */}
          {acta.comentario_aprovacao && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Comentário da Aprovação
              </h3>
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="whitespace-pre-wrap">{acta.comentario_aprovacao}</p>
                {acta.aprovado_by_name && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Aprovado por {acta.aprovado_by_name} em {formatDateTime(acta.aprovado_at!)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Metadados */}
          <div className="pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
            <p>Criado por {acta.created_by_name} em {formatDateTime(acta.created_at)}</p>
            {acta.updated_at !== acta.created_at && (
              <p>Última actualização em {formatDateTime(acta.updated_at)}</p>
            )}
          </div>

          {/* Formulário de Aprovação */}
          {showApproveForm && (
            <div className="space-y-3 bg-green-50 p-4 rounded-lg border-2 border-green-500">
              <h4 className="font-medium text-green-800">Aprovar Acta</h4>
              <div className="space-y-2">
                <Label htmlFor="comentario_aprovacao">Comentário (opcional)</Label>
                <Textarea
                  id="comentario_aprovacao"
                  value={comentarioAprovacao}
                  onChange={(e) => setComentarioAprovacao(e.target.value)}
                  placeholder="Adicione um comentário à aprovação..."
                  rows={3}
                  className="bg-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApproveForm(false);
                    setComentarioAprovacao('');
                  }}
                  disabled={loading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleAprovar}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Aprovando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Confirmar Aprovação
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Formulário de Rejeição */}
          {showRejectForm && (
            <div className="space-y-3 bg-destructive/10 p-4 rounded-lg border-2 border-destructive">
              <h4 className="font-medium text-destructive">Rejeitar Acta</h4>
              <div className="space-y-2">
                <Label htmlFor="motivo_rejeicao">
                  Motivo da Rejeição <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="motivo_rejeicao"
                  value={motivoRejeicao}
                  onChange={(e) => setMotivoRejeicao(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                  rows={3}
                  className="bg-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectForm(false);
                    setMotivoRejeicao('');
                  }}
                  disabled={loading}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button
                  onClick={handleRejeitar}
                  disabled={loading}
                  variant="destructive"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Rejeitando...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Confirmar Rejeição
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          {acta.status !== 'arquivada' && !showApproveForm && !showRejectForm && (
            <div className="pt-4 border-t border-border space-y-2">
              {/* Enviar para Revisão */}
              {acta.status === 'rascunho' && (
                <Button
                  variant="default"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleEnviarRevisao}
                  disabled={loading}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para Revisão
                </Button>
              )}

              {/* Aprovar / Rejeitar */}
              {acta.status === 'em_revisao' && (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setShowRejectForm(true)}
                    disabled={loading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Rejeitar
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowApproveForm(true)}
                    disabled={loading}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar
                  </Button>
                </div>
              )}

              {/* Arquivar */}
              {acta.status === 'aprovada' && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleArquivar}
                  disabled={loading}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Arquivar Acta
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}