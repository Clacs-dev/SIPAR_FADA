import { useState } from "react";
import { 
  Receipt, 
  Calendar, 
  User, 
  Building2, 
  Paperclip,
  History,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Download,
  Edit,
  DollarSign,
  AlertTriangle,
  Upload,
  Building
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Factura } from "./types";

interface FacturaDetailsProps {
  factura: Factura;
  canValidate?: boolean;
  canApprove: boolean;
  canPay: boolean;
  userRole: string;
  onBack: () => void;
  onEdit: () => void;
  onValidate?: (comentario: string) => void;
  onApprove: (comentario: string) => void;
  onReject: (motivo: string) => void;
  onPay: (metodo: string, referencia: string, comprovativo?: File) => void;
  onSubmitToBanco?: (banco: string, referencia: string) => void;
}

export function FacturaDetails({
  factura,
  canValidate,
  canApprove,
  canPay,
  userRole,
  onBack,
  onEdit,
  onValidate,
  onApprove,
  onReject,
  onPay,
  onSubmitToBanco
}: FacturaDetailsProps) {
  const [showValidateForm, setShowValidateForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [showSubmitBancoForm, setShowSubmitBancoForm] = useState(false);
  const [comentario, setComentario] = useState('');
  const [motivo, setMotivo] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [referenciaPagamento, setReferenciaPagamento] = useState('');
  const [comprovativo, setComprovativo] = useState<File | null>(null);
  const [bancoDestino, setBancoDestino] = useState('');
  const [referenciaSubmissao, setReferenciaSubmissao] = useState('');

  const getStatusBadge = (status: string) => {
    const badges = {
      registada: { label: 'Registada', color: 'bg-blue-500' },
      rascunho: { label: 'Rascunho', color: 'bg-gray-500' },
      pendente: { label: 'Pendente', color: 'bg-blue-500' },
      validado: { label: 'Validado', color: 'bg-purple-500' },
      em_validacao: { label: 'Em Validação', color: 'bg-purple-500' },
      aprovada: { label: 'Aprovada', color: 'bg-green-500' },
      aprovado: { label: 'Aprovado', color: 'bg-green-500' },
      rejeitada: { label: 'Rejeitada', color: 'bg-red-500' },
      rejeitado: { label: 'Rejeitado', color: 'bg-red-500' },
      submetido_ao_banco: { label: 'Submetido ao Banco', color: 'bg-indigo-500' },
      paga: { label: 'Paga', color: 'bg-green-700' },
      pago: { label: 'Pago', color: 'bg-green-700' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const itensFactura = Array.isArray(factura.itens) ? factura.itens : [];

  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: factura.moeda || 'AOA',
      minimumFractionDigits: 2,
    }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  };

  const isVencida = new Date(factura.data_vencimento) < new Date() && 
    factura.status !== 'paga';

  const handleValidate = () => {
    if (comentario.trim() && onValidate) {
      onValidate(comentario);
      setComentario('');
      setShowValidateForm(false);
    }
  };

  const handleApprove = () => {
    if (comentario.trim()) {
      onApprove(comentario);
      setComentario('');
      setShowApproveForm(false);
    }
  };

  const handleReject = () => {
    if (motivo.trim()) {
      onReject(motivo);
      setMotivo('');
      setShowRejectForm(false);
    }
  };

  const handlePay = () => {
    if (metodoPagamento && referenciaPagamento) {
      onPay(metodoPagamento, referenciaPagamento, comprovativo);
      setMetodoPagamento('');
      setReferenciaPagamento('');
      setComprovativo(null);
      setShowPayForm(false);
    }
  };

  const handleSubmitToBanco = () => {
    if (bancoDestino && referenciaSubmissao && onSubmitToBanco) {
      onSubmitToBanco(bancoDestino, referenciaSubmissao);
      setBancoDestino('');
      setReferenciaSubmissao('');
      setShowSubmitBancoForm(false);
    }
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
              <Receipt className="h-6 w-6" />
              {factura.numero}
            </h1>
            <p className="text-muted-foreground">{factura.descricao}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {/* DEBUG INFO */}
 {console.log('DEBUG Factura Details:', { 
            canValidate, 
            canApprove, 
            canPay, 
            status: factura.status,
            userRole 
          })}
          
          {/* Botão Validar (Compras) - sempre visível se tiver permissão */}
          {canValidate && (
            <Button 
              className="bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={() => setShowValidateForm(true)}
              disabled={factura.status !== 'pendente'}
              title={factura.status !== 'pendente' ? `Status atual: ${factura.status}. Necessário: pendente` : 'Validar factura'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Validar
            </Button>
          )}
          
          {/* Botão Aprovar (Admin/Gabinetes) - sempre visível se tiver permissão */}
          {canApprove && (
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              onClick={() => setShowApproveForm(true)}
              disabled={factura.status !== 'validado'}
              title={factura.status !== 'validado' ? `Status atual: ${factura.status}. Necessário: validado` : 'Aprovar factura'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovar
            </Button>
          )}
          
          {/* Botão Pagar (Financeiro) - sempre visível se tiver permissão */}
          {canPay && (factura.status === 'aprovado' || factura.status === 'submetido_ao_banco') && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              onClick={() => setShowPayForm(true)}
              disabled={factura.status !== 'aprovado' && factura.status !== 'submetido_ao_banco'}
              title={
                factura.status !== 'aprovado' && factura.status !== 'submetido_ao_banco' 
                  ? `Status atual: ${factura.status}. Necessário: aprovado ou submetido_ao_banco` 
                  : 'Marcar como pago'
              }
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Marcar como Pago
            </Button>
          )}
          
          {/* Botão Submeter ao Banco (Financeiro) */}
          {canPay && (
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 text-white" 
              onClick={() => setShowSubmitBancoForm(true)}
              disabled={factura.status !== 'aprovado'}
              title={factura.status !== 'aprovado' ? `Status atual: ${factura.status}. Necessário: aprovado` : 'Submeter ao banco'}
            >
              <Building className="mr-2 h-4 w-4" />
              Submeter ao Banco
            </Button>
          )}

          {factura.status === 'registada' && userRole === 'gestor' && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-2">
        {getStatusBadge(factura.status)}
        <Badge variant="outline">{factura.moeda}</Badge>
        {isVencida && (
          <Badge className="bg-red-500 text-white">
            ⚠️ Vencida
          </Badge>
        )}
        {factura.integracao_status === 'confirmado' && (
          <Badge className="bg-blue-500 text-white">
            ✓ Integrado Primavera
          </Badge>
        )}
      </div>

      {/* Alerta de Vencimento */}
      {isVencida && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                Atenção: Factura vencida desde{' '}
                {new Date(factura.data_vencimento).toLocaleDateString('pt-PT')}
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
              <CardTitle>Informações da Factura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Número Interno</p>
                  <p className="font-medium">{factura.numero}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nº Factura Fornecedor</p>
                  <p className="font-medium">{factura.numero_fornecedor}</p>
                </div>
              </div>

              {factura.numero_submissao && (
                <div>
                  <p className="text-sm text-muted-foreground">Nº de Submissão do Registo</p>
                  <p className="font-medium text-blue-600">{factura.numero_submissao}</p>
                </div>
              )}

              {factura.tipo && (
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Factura</p>
                  <p className="font-medium capitalize">
                    {factura.tipo === 'mercadoria' && '📦 Mercadoria'}
                    {factura.tipo === 'servico' && '🔧 Serviço'}
                    {factura.tipo === 'ambos' && '📦🔧 Ambos'}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Fornecedor</p>
                <p className="font-medium">{factura.fornecedor?.nome || 'Fornecedor não especificado'}</p>
                {factura.fornecedor && (
                  <p className="text-sm text-muted-foreground">
                    NIF: {factura.fornecedor.nif} • {factura.fornecedor.email}
                  </p>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">
                    {new Date(factura.data_emissao).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                  <p className="font-medium">
                    {new Date(factura.data_vencimento).toLocaleDateString('pt-PT')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Recebimento</p>
                  <p className="font-medium">
                    {new Date(factura.data_recebimento).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>

              {factura.condicoes_pagamento && (
                <div>
                  <p className="text-sm text-muted-foreground">Condições de Pagamento</p>
                  <p className="font-medium">{factura.condicoes_pagamento}</p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-2">Descrição</p>
                <p>{factura.descricao}</p>
              </div>

              {factura.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Observações</p>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-sm">{factura.observacoes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Itens da Factura */}
          <Card>
            <CardHeader>
              <CardTitle>Itens da Factura ({itensFactura.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {itensFactura.map((item, index) => (
                  <div key={item.id || index} className="p-3 border border-border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{item.descricao}</p>
                        <p className="text-sm text-muted-foreground">
                          Qtd: {item.quantidade} × {formatCurrency(item.preco_unitario)} 
                          {item.iva > 0 && ` (IVA ${item.iva}%)`}
                        </p>
                      </div>
                      <p className="font-bold">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}

                {/* Totais */}
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span className="font-medium">{formatCurrency(factura.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>IVA Total:</span>
                    <span className="font-medium">{formatCurrency(factura.iva_total)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-border pt-2">
                    <span>Total:</span>
                    <span className="text-primary">{formatCurrency(factura.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anexos */}
          {factura.anexos && factura.anexos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Anexos ({factura.anexos?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!factura.anexos || factura.anexos.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum documento em anexo</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {factura.anexos.filter(anexo => anexo !== null && anexo !== undefined).map((anexo, index) => {
                      const url = anexo?.url || anexo?.signedUrl;
                      const hasUrl = !!url;
                      
                      return (
                        <div
                          key={anexo.id || index}
                          className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{anexo?.nome || anexo?.fileName || 'Documento'}</p>
                              <p className="text-xs text-muted-foreground">
                                {anexo?.tamanho ? `${(anexo.tamanho / 1024).toFixed(2)} KB` : 
                                 anexo?.fileSize ? `${(anexo.fileSize / 1024).toFixed(2)} KB` : 
                                 'Tamanho desconhecido'}
                                {anexo?.tipo && ` • ${anexo.tipo}`}
                              </p>
                              {!hasUrl && (
                                <p className="text-xs text-red-500 mt-1">⚠️ URL não disponível</p>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            disabled={!hasUrl}
                            onClick={() => {
 console.log('Anexo completo:', anexo);
 console.log('URL do anexo:', url);
                              
                              if (url) {
                                window.open(url, '_blank');
                              } else {
                                alert('URL do documento não disponível. Por favor, verifique o console para mais detalhes.');
                              }
                            }}
                            title={hasUrl ? 'Visualizar/Baixar documento' : 'URL do documento não disponível'}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Histórico de Ações ({factura.historico?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!factura.historico || factura.historico.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma ação registada
                </p>
              ) : (
                factura.historico.filter(h => h && h.acao).map((h) => (
                  <div key={h.id} className="border-l-2 border-primary pl-4 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{h.autor_nome || 'Usuário'}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(h.created_at).toLocaleString('pt-PT')}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{h.acao}</p>
                    {h.comentario && (
                      <p className="text-sm text-muted-foreground mt-1">{h.comentario}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - 1/3 */}
        <div className="space-y-6">
          {/* Ações */}
          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Validar */}
              {canValidate && factura.status === 'pendente' && !showValidateForm && (
                <Button className="w-full" onClick={() => setShowValidateForm(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Validar Factura
                </Button>
              )}

              {showValidateForm && (
                <div className="space-y-3 p-3 border border-border rounded-lg">
                  <Textarea
                    placeholder="Comentário de validação..."
                    rows={3}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowValidateForm(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleValidate}>
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}

              {/* Aprovar */}
              {canApprove && factura.status === 'validado' && !showApproveForm && (
                <Button className="w-full" onClick={() => setShowApproveForm(true)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Aprovar Factura
                </Button>
              )}

              {showApproveForm && (
                <div className="space-y-3 p-3 border border-border rounded-lg">
                  <Textarea
                    placeholder="Comentário de aprovação..."
                    rows={3}
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowApproveForm(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleApprove}>
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}

              {/* Rejeitar */}
              {canApprove && factura.status === 'validado' && !showRejectForm && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Rejeitar Factura
                </Button>
              )}

              {showRejectForm && (
                <div className="space-y-3 p-3 border border-red-200 bg-red-50 rounded-lg">
                  <Textarea
                    placeholder="Motivo da rejeição..."
                    rows={3}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowRejectForm(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleReject}>
                      Rejeitar
                    </Button>
                  </div>
                </div>
              )}

              {/* Pagar */}
              {canPay && (factura.status === 'aprovado' || factura.status === 'submetido_ao_banco') && !showPayForm && (
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => setShowPayForm(true)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registar Pagamento
                </Button>
              )}

              {showPayForm && (
                <div className="space-y-3 p-3 border border-green-200 bg-green-50 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Método de Pagamento</label>
                    <select
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      value={metodoPagamento}
                      onChange={(e) => setMetodoPagamento(e.target.value)}
                    >
                      <option value="">Selecione...</option>
                      <option value="transferencia">Transferência Bancária</option>
                      <option value="cheque">Cheque</option>
                      <option value="dinheiro">Dinheiro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Referência</label>
                    <Input
                      placeholder="Nº referência/comprovativo"
                      value={referenciaPagamento}
                      onChange={(e) => setReferenciaPagamento(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comprovativo</label>
                    <Input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setComprovativo(e.target.files?.[0] || null)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowPayForm(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" className="bg-green-600" onClick={handlePay}>
                      Confirmar Pagamento
                    </Button>
                  </div>
                </div>
              )}

              {/* Submeter ao Banco */}
              {canPay && factura.status === 'aprovado' && !showSubmitBancoForm && (
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => setShowSubmitBancoForm(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Submeter ao Banco
                </Button>
              )}

              {showSubmitBancoForm && (
                <div className="space-y-3 p-3 border border-indigo-200 bg-indigo-50 rounded-lg">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Banco Destino</label>
                    <Input
                      placeholder="Nome do Banco"
                      value={bancoDestino}
                      onChange={(e) => setBancoDestino(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Referência</label>
                    <Input
                      placeholder="Nº referência"
                      value={referenciaSubmissao}
                      onChange={(e) => setReferenciaSubmissao(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowSubmitBancoForm(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" className="bg-indigo-600" onClick={handleSubmitToBanco}>
                      Submeter
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações de Validação */}
          {factura.validado_at && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Validado por</p>
                  <p className="font-medium">{factura.validado_por_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(factura.validado_at).toLocaleString('pt-PT')}
                  </p>
                </div>
                {factura.validacao_comentario && (
                  <div>
                    <p className="text-sm text-muted-foreground">Comentário</p>
                    <p className="text-sm">{factura.validacao_comentario}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações de Aprovação */}
          {factura.aprovado_at && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aprovação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovado por</p>
                  <p className="font-medium">{factura.aprovado_por_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(factura.aprovado_at).toLocaleString('pt-PT')}
                  </p>
                </div>
                {factura.aprovacao_comentario && (
                  <div>
                    <p className="text-sm text-muted-foreground">Comentário</p>
                    <p className="text-sm">{factura.aprovacao_comentario}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações de Rejeição */}
          {factura.rejeitado_at && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-sm text-red-700">Rejeição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Rejeitado por</p>
                  <p className="font-medium">{factura.rejeitado_por_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(factura.rejeitado_at).toLocaleString('pt-PT')}
                  </p>
                </div>
                {factura.rejeicao_motivo && (
                  <div>
                    <p className="text-sm text-muted-foreground">Motivo</p>
                    <p className="text-sm text-red-600">{factura.rejeicao_motivo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações de Submissão ao Banco */}
          {factura.submetido_banco_at && (
            <Card className="border-indigo-200">
              <CardHeader>
                <CardTitle className="text-sm text-indigo-700">Submissão ao Banco</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Submetido por</p>
                  <p className="font-medium">{factura.submetido_banco_por_nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data</p>
                  <p className="font-medium">
                    {new Date(factura.submetido_banco_at).toLocaleString('pt-PT')}
                  </p>
                </div>
                {factura.banco_destino && (
                  <div>
                    <p className="text-sm text-muted-foreground">Banco</p>
                    <p className="font-medium">{factura.banco_destino}</p>
                  </div>
                )}
                {factura.referencia_submissao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Referência</p>
                    <p className="font-medium">{factura.referencia_submissao}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações de Pagamento */}
          {factura.pago_at && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-sm text-green-700">Pagamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Pagamento</p>
                  <p className="font-medium">
                    {new Date(factura.pago_at).toLocaleString('pt-PT')}
                  </p>
                </div>
                {factura.metodo_pagamento && (
                  <div>
                    <p className="text-sm text-muted-foreground">Método</p>
                    <p className="font-medium">{factura.metodo_pagamento}</p>
                  </div>
                )}
                {factura.referencia_pagamento && (
                  <div>
                    <p className="text-sm text-muted-foreground">Referência</p>
                    {factura.comprovativo_url ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-1"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = factura.comprovativo_url!;
                          link.download = `comprovativo_${factura.numero}.pdf`;
                          link.target = '_blank';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Baixar Comprovativo
                      </Button>
                    ) : (
                      <p className="font-medium">{factura.referencia_pagamento}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Criação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Criação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Criado por</p>
                <p className="font-medium">{factura.created_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {new Date(factura.created_at).toLocaleString('pt-PT')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
