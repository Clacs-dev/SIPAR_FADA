import { useState } from "react";
import { 
  FileSignature, 
  Calendar, 
  User, 
  Building2, 
  Paperclip,
  MessageSquare,
  Send,
  Archive,
  Edit,
  Download,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  Share2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Oficio, Despacho } from "./types";
import { gerarPDFOficio } from "../../utils/pdf-generator";

interface OficioDetailsProps {
  oficio: Oficio;
  canDespachar: boolean;
  canEdit: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDespachar: (despacho: string) => void;
  onArquivar: () => void;
  onShare?: (oficioId: string) => void;
}

export function OficioDetails({
  oficio,
  canDespachar,
  canEdit,
  onBack,
  onEdit,
  onDespachar,
  onArquivar,
  onShare
}: OficioDetailsProps) {
  const [novoDespacho, setNovoDespacho] = useState('');
  const [showDespachoForm, setShowDespachoForm] = useState(false);

  // Garantir que anexos e despachos sejam arrays
  const anexos = oficio.anexos || [];
  const despachos = oficio.despachos || [];

  // Log para debug
 console.log(' Ofício atual:', oficio.id);
 console.log(' Despachos no ofício:', despachos);
 console.log(' Total de despachos:', despachos.length);

  const handleDownloadPDF = () => {
    gerarPDFOficio(oficio);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: 'Pendente', color: 'bg-yellow-500' },
      em_analise: { label: 'Em Análise', color: 'bg-blue-500' },
      despachado: { label: 'Despachado', color: 'bg-green-500' },
      arquivado: { label: 'Arquivado', color: 'bg-gray-600' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges = {
      baixa: { label: 'Baixa', color: 'bg-gray-400' },
      normal: { label: 'Normal', color: 'bg-blue-400' },
      alta: { label: 'Alta', color: 'bg-orange-500' },
      urgente: { label: 'Urgente', color: 'bg-red-500' },
    };
    const badge = badges[prioridade as keyof typeof badges] || badges.normal;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const handleSubmitDespacho = () => {
 console.log(' [UI] handleSubmitDespacho chamado');
 console.log(' [UI] Texto do despacho:', novoDespacho);
 console.log(' [UI] Texto válido?', novoDespacho.trim().length > 0);
    
    if (novoDespacho.trim()) {
 console.log(' [UI] Chamando onDespachar...');
      onDespachar(novoDespacho);
      setNovoDespacho('');
      setShowDespachoForm(false);
 console.log(' [UI] Formulário fechado e limpo');
    } else {
 console.warn(' [UI] Despacho vazio, não enviando');
    }
  };

  const isPrazoVencido = oficio.prazo_resposta && 
    new Date(oficio.prazo_resposta) < new Date() &&
    oficio.status !== 'despachado' &&
    oficio.status !== 'arquivado';

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
              <FileSignature className="h-6 w-6" />
              {oficio.numero}
            </h1>
            <p className="text-muted-foreground">{oficio.assunto}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && oficio.status === 'rascunho' && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
          {canDespachar && oficio.status !== 'arquivado' && (
            <Button variant="outline" onClick={onArquivar}>
              <Archive className="mr-2 h-4 w-4" />
              Arquivar
            </Button>
          )}
          {onShare && (
            <Button variant="outline" onClick={() => onShare(oficio.id)}>
              <Share2 className="mr-2 h-4 w-4" />
              Compartilhar
            </Button>
          )}
        </div>
      </div>

      {/* Status e Prioridade */}
      <div className="flex gap-2">
        {getStatusBadge(oficio.status)}
        {getPrioridadeBadge(oficio.prioridade)}
        <Badge variant="outline">
          {oficio.tipo === 'entrada' ? '⬇️ Entrada' : '⬆️ Saída'}
        </Badge>
        {isPrazoVencido && (
          <Badge className="bg-red-500 text-white">
            ⚠️ Prazo Vencido
          </Badge>
        )}
      </div>

      {/* Alerta de Prazo */}
      {isPrazoVencido && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">
                Atenção: O prazo de resposta expirou em{' '}
                {new Date(oficio.prazo_resposta!).toLocaleDateString('pt-PT')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Coluna Principal - 2/3 */}
        <div className="md:col-span-2 space-y-6">
          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Ofício</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Número</p>
                  <p className="font-medium">{oficio.numero}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {oficio.tipo === 'entrada' ? 'Entrada (Recebido)' : 'Saída (Enviado)'}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {oficio.tipo === 'entrada' && oficio.remetente && (
                  <div>
                    <p className="text-sm text-muted-foreground">Remetente</p>
                    <p className="font-medium">{oficio.remetente}</p>
                  </div>
                )}
                {oficio.tipo === 'saida' && oficio.destinatario && (
                  <div>
                    <p className="text-sm text-muted-foreground">Destinatário</p>
                    <p className="font-medium">{oficio.destinatario}</p>
                  </div>
                )}
                {oficio.prazo_resposta && (
                  <div>
                    <p className="text-sm text-muted-foreground">Prazo de Resposta</p>
                    <p className="font-medium">
                      {new Date(oficio.prazo_resposta).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                )}
              </div>

              {/* Informações da Empresa (se for entrada) */}
              {oficio.tipo === 'entrada' && (oficio.nome_empresa_solicitante || oficio.nif_empresa || oficio.email_remetente) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {oficio.nome_empresa_solicitante && (
                    <div>
                      <p className="text-sm text-muted-foreground">Empresa Solicitante</p>
                      <p className="font-medium">{oficio.nome_empresa_solicitante}</p>
                    </div>
                  )}
                  {oficio.nif_empresa && (
                    <div>
                      <p className="text-sm text-muted-foreground">NIF da Empresa</p>
                      <p className="font-medium">{oficio.nif_empresa}</p>
                    </div>
                  )}
                  {oficio.email_remetente && (
                    <div>
                      <p className="text-sm text-muted-foreground">📧 Email do Remetente</p>
                      <p className="font-medium">{oficio.email_remetente}</p>
                      {oficio.status !== 'despachado' && oficio.status !== 'arquivado' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Receberá notificação quando o ofício for despachado
                        </p>
                      )}
                      {oficio.status === 'despachado' && (
                        <p className="text-xs text-green-600 mt-1">
                          📧 Email enviado em {new Date(oficio.despachado_at!).toLocaleString('pt-PT')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(oficio.departamento_origem || oficio.departamento_destino) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {oficio.departamento_origem && (
                    <div>
                      <p className="text-sm text-muted-foreground">Departamento Origem</p>
                      <p className="font-medium">{oficio.departamento_origem}</p>
                    </div>
                  )}
                  {oficio.departamento_destino && (
                    <div>
                      <p className="text-sm text-muted-foreground">Departamento Destino</p>
                      <p className="font-medium">{oficio.departamento_destino}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Assunto</p>
                <p className="font-medium">{oficio.assunto}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Conteúdo</p>
                <div className="p-4 bg-accent rounded-lg">
                  <p className="whitespace-pre-wrap">{oficio.conteudo}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anexos */}
          {anexos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Anexos ({anexos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {anexos.map((anexo, index) => (
                    <div
                      key={anexo.id || `anexo-${index}`}
                      className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent"
                    >
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{anexo.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {(anexo.tamanho / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (anexo.url) {
                            // Criar link temporário para download
                            const link = document.createElement('a');
                            link.href = anexo.url;
                            link.download = anexo.nome;
                            link.target = '_blank';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico de Despachos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Histórico de Despachos ({despachos.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {despachos.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum despacho registado
                </p>
              ) : (
                despachos.map((despacho, index) => (
                  <div key={despacho.id || `despacho-${index}`} className="border-l-2 border-primary pl-4 pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{despacho.autor_nome}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(despacho.created_at).toLocaleString('pt-PT')}
                      </span>
                    </div>
                    <p className="text-sm">{despacho.descricao}</p>
                  </div>
                ))
              )}

              {/* Formulário de Novo Despacho */}
              {canDespachar && oficio.status !== 'arquivado' && (
                <div className="pt-4 border-t border-border">
                  {!showDespachoForm ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
 console.log(' Abrindo formulário de despacho (botão "Adicionar Despacho")');
                        setShowDespachoForm(true);
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Adicionar Despacho
                    </Button>
                  ) : (
                    <div className="space-y-3 bg-muted/30 p-4 rounded-lg border-2 border-primary">
                      <div className="font-medium text-sm">📝 Digite o despacho:</div>
                      <Textarea
                        placeholder="Digite o despacho..."
                        rows={4}
                        value={novoDespacho}
                        onChange={(e) => setNovoDespacho(e.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
 console.log(' Cancelando despacho');
                            setShowDespachoForm(false);
                            setNovoDespacho('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSubmitDespacho}
                          disabled={!novoDespacho.trim()}
                          className="flex-1"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Enviar Despacho
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de Ação: Despachar e Arquivar */}
              {oficio.status !== 'arquivado' && (
                <div className="pt-4 border-t border-border space-y-2">
                  {/* Formulário quando ativado pelo botão verde */}
                  {showDespachoForm && (oficio.status === 'pendente' || oficio.status === 'em_analise') && (
                    <div className="space-y-3 bg-green-50 p-4 rounded-lg border-2 border-green-500">
                      <div className="font-medium text-sm text-green-800">📝 Despachar Ofício:</div>
                      <Textarea
                        placeholder="Digite o despacho para finalizar este ofício..."
                        rows={4}
                        value={novoDespacho}
                        onChange={(e) => setNovoDespacho(e.target.value)}
                        autoFocus
                        className="bg-white"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
 console.log(' Cancelando despacho');
                            setShowDespachoForm(false);
                            setNovoDespacho('');
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSubmitDespacho}
                          disabled={!novoDespacho.trim()}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirmar Despacho
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {/* Botão Despachar - Visível para status pendente ou em_analise */}
                  {(oficio.status === 'pendente' || oficio.status === 'em_analise') && !showDespachoForm && (
                    <Button
                      variant="default"
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => {
 console.log(' Botão DESPACHAR clicado - abrindo formulário');
                        setShowDespachoForm(true);
                      }}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Despachar Ofício
                    </Button>
                  )}
                  
                  {/* Botão Arquivar - Visível para status despachado */}
                  {oficio.status === 'despachado' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={onArquivar}
                    >
                      <Archive className="mr-2 h-4 w-4" />
                      Arquivar Ofício
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - 1/3 */}
        <div className="space-y-6">
          {/* Informações Adicionais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Adicionais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Criado por
                </p>
                <p className="font-medium">{oficio.created_by_name}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data de Criação
                </p>
                <p className="font-medium">
                  {new Date(oficio.created_at).toLocaleString('pt-PT')}
                </p>
              </div>

              {oficio.registado_at && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Data de Registo
                  </p>
                  <p className="font-medium">
                    {new Date(oficio.registado_at).toLocaleString('pt-PT')}
                  </p>
                </div>
              )}

              {oficio.despachado_at && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Data de Despacho
                  </p>
                  <p className="font-medium">
                    {new Date(oficio.despachado_at).toLocaleString('pt-PT')}
                  </p>
                </div>
              )}

              {oficio.arquivado_at && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Archive className="h-4 w-4" />
                    Data de Arquivo
                  </p>
                  <p className="font-medium">
                    {new Date(oficio.arquivado_at).toLocaleString('pt-PT')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Processos Associados */}
          {(oficio.processo_associado_id || oficio.solicitacao_associada_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Associações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {oficio.processo_associado_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Processo</p>
                    <p className="font-medium">{oficio.processo_associado_id}</p>
                  </div>
                )}
                {oficio.solicitacao_associada_id && (
                  <div>
                    <p className="text-sm text-muted-foreground">Solicitação</p>
                    <p className="font-medium">{oficio.solicitacao_associada_id}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}