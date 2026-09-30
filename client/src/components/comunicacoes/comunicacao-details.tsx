import { useState } from "react";
import { previewDocument } from "../ui/document-preview";
import {
  ArrowLeft,
  MessageSquare,
  Calendar,
  Building,
  User,
  FileText,
  Edit,
  Archive,
  Share2,
  Send,
  Shield,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { Comunicacao, Despacho, Delegacao } from "./types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useTrackView } from "../../hooks/use-track-view";

// Formata uma data com segurança: devolve '-' em vez de rebentar com
// "RangeError: Invalid time value" quando o valor vem vazio/malformado.
function formatSafeDate(value: any, pattern: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern, { locale: ptBR });
}

interface ComunicacaoDetailsProps {
  comunicacao: Comunicacao;
  canDespachar: boolean;
  canEdit: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDespachar: (despacho: string) => void;
  onArquivar: () => void;
  onShare: (comunicacaoId: string) => void;
}

export function ComunicacaoDetails({
  comunicacao,
  canDespachar,
  canEdit,
  onBack,
  onEdit,
  onDespachar,
  onArquivar,
  onShare,
}: ComunicacaoDetailsProps) {
  useTrackView('comunicacao', comunicacao?.id);
  const [showDespachoForm, setShowDespachoForm] = useState(false);
  const [despachoTexto, setDespachoTexto] = useState('');

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: 'Pendente', color: 'var(--tone-warn)' },
      em_analise: { label: 'Em Análise', color: 'var(--tone-info)' },
      despachado: { label: 'Despachado', color: 'var(--tone-success)' },
      arquivado: { label: 'Arquivado', color: 'var(--tone-neutral)' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className="text-white" style={{ backgroundColor: badge.color }}>{badge.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges = {
      normal: { label: 'Normal', color: 'var(--tone-info)' },
      alta: { label: 'Alta', color: 'var(--tone-warn)' },
      urgente: { label: 'Urgente', color: 'var(--tone-danger)' },
    };
    const badge = badges[prioridade as keyof typeof badges] || badges.normal;
    return <Badge className="text-white" style={{ backgroundColor: badge.color }}>{badge.label}</Badge>;
  };

  const handleSubmitDespacho = () => {
    if (despachoTexto.trim()) {
      onDespachar(despachoTexto);
      setDespachoTexto('');
      setShowDespachoForm(false);
    }
  };

  const isArquivado = comunicacao.status === 'arquivado';

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
              <MessageSquare className="h-6 w-6" />
              {comunicacao.numero}
            </h1>
            <p className="text-muted-foreground">{comunicacao.assunto}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && !isArquivado && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {!isArquivado && (
            <>
              <Button variant="outline" onClick={() => onShare(comunicacao.id)}>
                <Share2 className="mr-2 h-4 w-4" />
                Compartilhar
              </Button>
              <Button variant="outline" onClick={onArquivar}>
                <Archive className="mr-2 h-4 w-4" />
                Arquivar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Status e Badges */}
      <div className="flex gap-2 flex-wrap">
        {getStatusBadge(comunicacao.status)}
        {getPrioridadeBadge(comunicacao.prioridade)}
        {comunicacao.confidencial && (
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            CONFIDENCIAL
          </Badge>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Coluna Principal - 2/3 */}
        <div className="md:col-span-2 space-y-6">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Comunicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Departamento Origem</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4" />
                    <p className="font-medium">{comunicacao.departamento_origem}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Departamento Destino</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Building className="h-4 w-4" />
                    <p className="font-medium">{comunicacao.departamento_destino}</p>
                  </div>
                </div>
              </div>

              {comunicacao.destinatario_nome && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Destinatário</p>
                    <div className="flex items-center gap-2 mt-1">
                      <User className="h-4 w-4" />
                      <p className="font-medium">{comunicacao.destinatario_nome}</p>
                    </div>
                  </div>
                  {comunicacao.destinatario_cargo && (
                    <div>
                      <p className="text-sm text-muted-foreground">Cargo</p>
                      <p className="font-medium mt-1">{comunicacao.destinatario_cargo}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  <p className="font-medium">
                    {formatSafeDate(comunicacao.created_at, "dd 'de' MMMM 'de' yyyy 'às' HH:mm")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Criado por</p>
                <p className="font-medium mt-1">{comunicacao.created_by_name}</p>
              </div>
            </CardContent>
          </Card>

          {/* Conteúdo */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo da Comunicação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{comunicacao.conteudo}</p>
              </div>
            </CardContent>
          </Card>

          {/* Anexos */}
          {comunicacao.anexos && comunicacao.anexos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Anexos ({comunicacao.anexos.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {comunicacao.anexos.map((anexo, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{anexo.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {(anexo.tamanho / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => previewDocument({ url: anexo.url, nome: anexo.nome, tipo: anexo.tipo })}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Despachos */}
          {comunicacao.despachos && comunicacao.despachos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Despachos ({comunicacao.despachos.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comunicacao.despachos.map((despacho: Despacho) => (
                  <div
                    key={despacho.id}
                    className="p-4 border rounded-lg"
                    style={{ backgroundColor: 'var(--tone-info-soft)', borderColor: 'var(--tone-info)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--tone-info)' }}>{despacho.despachado_por_nome}</p>
                        <p className="text-sm" style={{ color: 'var(--tone-info)' }}>{despacho.despachado_por_cargo}</p>
                        {despacho.departamento && (
                          <p className="text-xs" style={{ color: 'var(--tone-info)' }}>{despacho.departamento}</p>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--tone-info)' }}>
                        {formatSafeDate(despacho.created_at, "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    <Separator className="my-3" style={{ backgroundColor: 'var(--tone-info)' }} />
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--tone-info)' }}>
                      {despacho.texto_despacho}
                    </p>
                    {despacho.assinatura_url && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--tone-info)' }}>
                        <img src={despacho.assinatura_url} alt={`Assinatura de ${despacho.despachado_por_nome}`} className="h-12 object-contain" />
                        <p className="text-xs mt-1" style={{ color: 'var(--tone-info)' }}>Assinado digitalmente por {despacho.despachado_por_nome}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Delegações */}
          {comunicacao.delegacoes && comunicacao.delegacoes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Delegações ({comunicacao.delegacoes.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {comunicacao.delegacoes.map((delegacao: Delegacao) => (
                  <div
                    key={delegacao.id}
                    className="p-4 border rounded-lg"
                    style={{ backgroundColor: 'var(--tone-accent-soft)', borderColor: 'var(--tone-accent)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--tone-accent)' }}>
                          {delegacao.delegado_por_nome} <span className="font-normal">delegou para</span> {delegacao.delegado_para_nome}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--tone-accent)' }}>{delegacao.delegado_para_cargo}</p>
                        {delegacao.departamento && (
                          <p className="text-xs" style={{ color: 'var(--tone-accent)' }}>{delegacao.departamento}</p>
                        )}
                      </div>
                      <p className="text-xs" style={{ color: 'var(--tone-accent)' }}>
                        {formatSafeDate(delegacao.created_at, "dd/MM/yyyy HH:mm")}
                      </p>
                    </div>
                    {delegacao.motivo && (
                      <>
                        <Separator className="my-3" style={{ backgroundColor: 'var(--tone-accent)' }} />
                        <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--tone-accent)' }}>{delegacao.motivo}</p>
                      </>
                    )}
                    {delegacao.assinatura_url && (
                      <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--tone-accent)' }}>
                        <img src={delegacao.assinatura_url} alt={`Assinatura de ${delegacao.delegado_por_nome}`} className="h-12 object-contain" />
                        <p className="text-xs mt-1" style={{ color: 'var(--tone-accent)' }}>Assinado digitalmente por {delegacao.delegado_por_nome}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Formulário de Despacho */}
          {canDespachar && !isArquivado && (
            <Card>
              <CardHeader>
                <CardTitle>Adicionar Despacho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showDespachoForm ? (
                  <Button onClick={() => setShowDespachoForm(true)} className="w-full">
                    <Send className="mr-2 h-4 w-4" />
                    Despachar Comunicação
                  </Button>
                ) : (
                  <>
                    <Textarea
                      placeholder="Escreva aqui o despacho..."
                      value={despachoTexto}
                      onChange={(e) => setDespachoTexto(e.target.value)}
                      rows={6}
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDespachoForm(false);
                          setDespachoTexto('');
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleSubmitDespacho} disabled={!despachoTexto.trim()}>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Despacho
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral - 1/3 */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Informações do Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Número</p>
                <p className="font-medium">{comunicacao.numero}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <Badge>Saída</Badge>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">Criado em</p>
                <p className="font-medium">
                  {formatSafeDate(comunicacao.created_at, "dd/MM/yyyy HH:mm")}
                </p>
              </div>
              {comunicacao.updated_at && comunicacao.updated_at !== comunicacao.created_at && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground">Última actualização</p>
                    <p className="font-medium">
                      {formatSafeDate(comunicacao.updated_at, "dd/MM/yyyy HH:mm")}
                    </p>
                  </div>
                </>
              )}
              {comunicacao.despachado_em && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground">Despachado em</p>
                    <p className="font-medium">
                      {formatSafeDate(comunicacao.despachado_em, "dd/MM/yyyy HH:mm")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      por {comunicacao.despachado_por_nome}
                    </p>
                  </div>
                </>
              )}
              {comunicacao.arquivado_em && (
                <>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground">Arquivado em</p>
                    <p className="font-medium">
                      {formatSafeDate(comunicacao.arquivado_em, "dd/MM/yyyy HH:mm")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      por {comunicacao.arquivado_por_nome}
                    </p>
                  </div>
                </>
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
                <span className="text-muted-foreground">Anexos</span>
                <span className="font-medium">{comunicacao.anexos?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Despachos</span>
                <span className="font-medium">{comunicacao.despachos?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
