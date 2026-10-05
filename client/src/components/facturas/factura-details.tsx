import { useEffect, useState } from "react";
import {
  Receipt,
  Calendar,
  User,
  Building2,
  Paperclip,
  History,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
  ArrowLeft,
  Download,
  Edit,
  DollarSign,
  AlertTriangle,
  Upload,
  Building,
  FileSignature,
  PenTool,
  Eye,
  Check,
  Package,
  Wrench,
  ShoppingCart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Factura, HistoricoFactura } from "./types";
import { useAuth } from "../auth/auth-context";
import { urlPublica } from '@/services/api';
import { API_BASE_URL } from '@/services/api';
import { gerarPDFOrdemPagamento, gerarPDFFactura, urlParaDataUrl, visualizarOrdemCompra } from "../../utils/pdf-generator";
import { previewDocument, previewPdf } from "../ui/document-preview";
import { toast } from "sonner@2.0.3";

interface FacturaDetailsProps {
  factura: Factura;
  canValidate?: boolean;
  canApprove: boolean;
  canPay: boolean;
  userRole: string;
  onBack: () => void;
  onEdit: () => void;
  /** Documento próprio ainda sem acção (ex: DSG Técnico) - ver facturas-main.tsx. */
  podeEditar?: boolean;
  podeEliminar?: boolean;
  onAnular?: () => void;
  onEliminar?: () => void;
  onValidate?: (comentario: string) => void;
  onApprove: (comentario: string) => void;
  onReject: (motivo: string) => void;
  onPay: (metodo: string, referencia: string, comprovativo?: File) => void;
  onSubmitToBanco?: (banco: string, referencia: string) => void;
  onGerarOrdemPagamento?: (numeroDespacho: string, contaDebito: string) => void;
  onAssinarOrdemPagamento?: (papel: 'presidente' | 'administrador') => void;
}

// Cargos que assinam a Ordem de Pagamento e o role de sistema correspondente
const PAPEIS_ASSINATURA: { papel: 'presidente' | 'administrador'; label: string; role: string }[] = [
  { papel: 'presidente', label: 'Presidente', role: 'gabinete_pca' },
  { papel: 'administrador', label: 'Administrador', role: 'gabinete_administrador' },
];

export function FacturaDetails({
  factura,
  canValidate,
  canApprove,
  canPay,
  userRole,
  onBack,
  onEdit,
  podeEditar = false,
  podeEliminar = false,
  onAnular,
  onEliminar,
  onValidate,
  onApprove,
  onReject,
  onPay,
  onSubmitToBanco,
  onGerarOrdemPagamento,
  onAssinarOrdemPagamento
}: FacturaDetailsProps) {
  const { user, accessToken, refreshUser } = useAuth();
  const [showValidateForm, setShowValidateForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [showSubmitBancoForm, setShowSubmitBancoForm] = useState(false);
  const [showOrdemPagamentoForm, setShowOrdemPagamentoForm] = useState(false);
  const [numeroDespacho, setNumeroDespacho] = useState('');
  const [contaDebito, setContaDebito] = useState(() => localStorage.getItem('fada_conta_debito_default') || '');
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [gerandoPdfOp, setGerandoPdfOp] = useState(false);
  const [comentario, setComentario] = useState('');
  const [motivo, setMotivo] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [referenciaPagamento, setReferenciaPagamento] = useState('');
  const [comprovativo, setComprovativo] = useState<File | null>(null);
  const [bancoDestino, setBancoDestino] = useState('');
  const [referenciaSubmissao, setReferenciaSubmissao] = useState('');

  const podeGerirOrdemPagamento = canApprove || canPay;
  const assinaturas = factura.ordem_pagamento?.assinaturas || [];
  // Regras: Aprovar-DSG e Autorizar assinam a Autorizacao de Despesas com a
  // assinatura de quem decide (sem assinatura nao se aprova); so se submete ao
  // banco com a Ordem de Pagamento assinada pelo Presidente E pelo
  // Administrador; so se marca como pago depois de submetida ao banco.
  const temAssinatura = !!user?.signatureImage;
  const AVISO_SEM_ASSINATURA = 'Carregue a sua assinatura em Meu Perfil: a Autorização de Despesas é assinada automaticamente ao aprovar/autorizar.';
  const assinaturasEmFaltaOP = PAPEIS_ASSINATURA.filter((p) => !assinaturas.some((a) => a.papel === p.papel)).map((p) => p.label);
  const opAssinadaPorAmbos = !!factura.numero_ordem_pagamento && assinaturasEmFaltaOP.length === 0;
  const motivoBancoInactivo = factura.status !== 'aprovado'
    ? 'Disponível depois da Autorização de Despesas'
    : !factura.numero_ordem_pagamento
      ? 'Gere primeiro a Ordem de Pagamento'
      : assinaturasEmFaltaOP.length
        ? `Falta a assinatura da Ordem de Pagamento: ${assinaturasEmFaltaOP.join(' e ')}`
        : 'Submeter ao banco';
  const meuPapel = PAPEIS_ASSINATURA.find((p) => p.role === userRole);
  const jaAssineiComoMeuPapel = meuPapel ? assinaturas.some((a) => a.papel === meuPapel.papel) : false;

  const handleGerarOrdemPagamento = () => {
    if (!numeroDespacho.trim() || !contaDebito.trim()) return;
    localStorage.setItem('fada_conta_debito_default', contaDebito.trim());
    onGerarOrdemPagamento?.(numeroDespacho.trim(), contaDebito.trim());
    setShowOrdemPagamentoForm(false);
  };

  const handleUploadESignAssinatura = async (file: File) => {
    if (!accessToken || !meuPapel) return;
    setUploadingSignature(true);
    try {
      // Upload e associacao ao perfil num unico pedido multipart - ver nota em
      // meu-perfil-dialog.tsx sobre porque isto deixou de ser dois fetch() separados.
      const form = new FormData();
      form.append('file', file);
      const response = await fetch(`${API_BASE_URL}/auth/me/signature`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: form,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Erro ao carregar a assinatura');

      await refreshUser();
      toast.success('Assinatura carregada. Pode agora assinar a Ordem de Pagamento.');
    } catch (err) {
 console.error('Erro ao carregar assinatura:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar assinatura');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleBaixarOrdemPagamento = async () => {
    setGerandoPdfOp(true);
    try {
      const assinaturasComImagem = await Promise.all(
        assinaturas.map(async (assinatura) => {
          if (!assinatura.assinatura_url) return assinatura;
          try {
            const dataUrl = await urlParaDataUrl(assinatura.assinatura_url);
            return { ...assinatura, assinatura_url: dataUrl };
          } catch {
            return { ...assinatura, assinatura_url: undefined };
          }
        })
      );

      const doc = gerarPDFOrdemPagamento({
        numero: factura.numero_ordem_pagamento || 'OP/N.º —',
        tipo: 'fornecedor',
        contaDebito: factura.ordem_pagamento?.conta_debito,
        numeroDespacho: factura.ordem_pagamento?.numero_despacho,
        numeroFacturas: factura.numero,
        descricao: factura.descricao,
        valor: valorFinalExibicao || factura.total || factura.valor || 0,
        moeda: factura.moeda,
        fornecedor: fornecedorNomeExibicao || factura.banco_titular || 'Fornecedor',
        bancoNome: factura.banco_nome,
        bancoIban: factura.banco_iban,
        bancoCidade: factura.ordem_pagamento?.banco_destino_cidade || factura.banco_cidade,
        bancoPais: factura.ordem_pagamento?.banco_destino_pais || factura.banco_pais,
        data: factura.ordem_pagamento?.gerada_em,
        assinaturas: assinaturasComImagem,
      });
      previewPdf(doc, `Ordem_Pagamento_${(factura.numero_ordem_pagamento || factura.numero).replace(/[\/\s]/g, '-')}.pdf`);
    } catch (err) {
 console.error('Erro ao gerar PDF da Ordem de Pagamento:', err);
      toast.error('Erro ao gerar o PDF da Ordem de Pagamento');
    } finally {
      setGerandoPdfOp(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      registada: { label: 'Registada', color: 'var(--tone-info)' },
      rascunho: { label: 'Rascunho', color: 'var(--tone-neutral)' },
      pendente: { label: 'Pendente', color: 'var(--tone-info)' },
      validado: { label: 'Aprovado-DSG', color: 'var(--tone-info)' },
      em_validacao: { label: 'Em Aprovação-DSG', color: 'var(--tone-info)' },
      aprovada: { label: 'Aprovada', color: 'var(--tone-success)' },
      aprovado: { label: 'Autorização de Despesas', color: 'var(--tone-success)' },
      rejeitada: { label: 'Rejeitada', color: 'var(--tone-danger)' },
      rejeitado: { label: 'Rejeitado', color: 'var(--tone-danger)' },
      submetido_ao_banco: { label: 'Submetido ao Banco', color: 'var(--tone-gold)' },
      paga: { label: 'Paga', color: 'var(--tone-success)' },
      pago: { label: 'Pago', color: 'var(--tone-success)' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className="text-white" style={{ backgroundColor: badge.color }}>{badge.label}</Badge>;
  };

  const itensFactura = Array.isArray(factura.itens) ? factura.itens : [];

  // Historico de accoes: vem do registo do servidor (DocumentHistory, o mesmo
  // para qualquer separador de Gestao de Pagamento). Para facturas antigas sem
  // registo, reconstroi-se a linha temporal a partir das datas da propria factura.
  const [historicoServidor, setHistoricoServidor] = useState<HistoricoFactura[] | null>(null);
  useEffect(() => {
    let cancelado = false;
    setHistoricoServidor(null);
    if (!accessToken) return;
    fetch(`${API_BASE_URL}/facturas/${factura.id}/historico`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelado || !data) return;
        const rotulos: Record<string, string> = {
          pendente: 'Registada', validado: 'Aprovado-DSG', aprovado: 'Aprovada', rejeitado: 'Rejeitada',
          submetido_ao_banco: 'Submetida ao banco', pago: 'Paga', cancelado: 'Cancelada',
        };
        setHistoricoServidor((data.history || []).map((h: any) => ({
          id: h.id,
          factura_id: factura.id,
          acao: h.action === 'created'
            ? 'Factura registada'
            : h.action === 'updated'
              ? 'Dados actualizados'
              : rotulos[h.statusTo] || `Estado alterado para ${h.statusTo}`,
          status_anterior: h.statusFrom || undefined,
          status_novo: h.statusTo || undefined,
          autor_id: h.userId,
          autor_nome: h.userName,
          comentario: h.comment || undefined,
          created_at: h.createdAt,
        })));
      })
      .catch(() => { /* mantem-se a linha temporal reconstruida */ });
    return () => { cancelado = true; };
  }, [factura.id, factura.status, accessToken]);

  const historicoReconstruido = (): HistoricoFactura[] => {
    const eventos: Array<[string | undefined, string, string | undefined, string | undefined]> = [
      [factura.created_at, 'Factura registada', factura.created_by_name, undefined],
      [factura.validado_at, 'Aprovado-DSG', factura.validado_por_nome, factura.validacao_comentario],
      [factura.aprovado_at, 'Aprovada', factura.aprovado_por_nome, factura.aprovacao_comentario],
      [factura.rejeitado_at, 'Rejeitada', factura.rejeitado_por_nome, factura.rejeicao_motivo],
      [factura.ordem_pagamento?.gerada_em, 'Ordem de Pagamento gerada', factura.ordem_pagamento?.gerada_por_nome, factura.numero_ordem_pagamento],
      ...(factura.ordem_pagamento?.assinaturas || []).map((a) => [a.assinado_em, 'Ordem de Pagamento assinada', a.nome, a.papel] as [string, string, string, string]),
      [factura.submetido_banco_at, 'Submetida ao banco', factura.submetido_banco_por_nome, factura.referencia_submissao],
      [factura.pago_at, 'Paga', undefined, factura.referencia_pagamento],
    ];
    return eventos
      .filter(([data]) => !!data)
      .map(([data, acao, autor, comentario], index) => ({
        id: `reconstruido-${index}`,
        factura_id: factura.id,
        acao,
        autor_id: '',
        autor_nome: autor || 'Sistema',
        comentario,
        created_at: data!,
      }));
  };

  // Registos do servidor + eventos que so existem nos dados da factura (ex:
  // assinaturas da Ordem de Pagamento), sem repetir accoes ja registadas.
  const historicoExibido: HistoricoFactura[] = (() => {
    const servidor = historicoServidor || [];
    const legado = Array.isArray(factura.historico) ? factura.historico : [];
    const base = [...servidor, ...legado];
    const acoesBase = new Set(base.map((h) => h.acao));
    const complementares = historicoReconstruido().filter((h) => !acoesBase.has(h.acao));
    return [...base, ...complementares]
      .filter((h) => h && h.acao)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  })();

  const formatCurrency = (value: number = 0) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: factura.moeda || 'AOA',
      minimumFractionDigits: 2,
    }).format(Number.isFinite(Number(value)) ? Number(value) : 0);
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-PT');
  };

  // Valor final a pagar: bruto menos IVA cativo (retido na totalidade) e/ou
  // retenção na fonte de serviços (6,5%) - nunca soma, só subtrai. Facturas
  // antigas (antes desta feature) não têm retencao_total/valor_final
  // gravados - o fallback assume retenção zero (comportamento anterior).
  const retencaoTotalExibicao = factura.retencao_total ?? 0;
  const valorFinalExibicao = factura.valor_final
    ?? ((factura.subtotal ?? factura.total ?? factura.valor ?? 0) - (factura.iva_total ?? 0) - retencaoTotalExibicao);

  const dataVencimentoValida = factura.data_vencimento ? new Date(factura.data_vencimento) : null;
  const isVencida = !!dataVencimentoValida && !Number.isNaN(dataVencimentoValida.getTime())
    && dataVencimentoValida < new Date() && factura.status !== 'paga';

  // O backend guarda o fornecedor como texto simples (fornecedor_nome/fornecedor); o tipo
  // Fornecedor (objeto) so existe quando alguem explicitamente estrutura os dados assim.
  const fornecedorNomeExibicao =
    (typeof factura.fornecedor === 'object' && factura.fornecedor
      ? (factura.fornecedor as any).nome
      : factura.fornecedor) || (factura as any).fornecedor_nome || 'Fornecedor não especificado';
  const fornecedorNifExibicao =
    (typeof factura.fornecedor === 'object' && factura.fornecedor ? (factura.fornecedor as any).nif : null)
    || (factura as any).fornecedor_nif || factura.nif;
  const fornecedorEmailExibicao =
    (typeof factura.fornecedor === 'object' && factura.fornecedor ? (factura.fornecedor as any).email : null)
    || (factura as any).fornecedor_email;
  const fornecedorTelefoneExibicao =
    (typeof factura.fornecedor === 'object' && factura.fornecedor ? (factura.fornecedor as any).telefone : null)
    || (factura as any).fornecedor_telefone;
  const fornecedorMoradaExibicao =
    (typeof factura.fornecedor === 'object' && factura.fornecedor ? (factura.fornecedor as any).morada : null)
    || (factura as any).fornecedor_morada;
  const origemAnexoLabel: Record<string, string> = {
    cotacao: 'Cotação',
    pedido: 'Pedido de compra',
    ordem_compra: 'Autorização de Despesas',
  };

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
          
          {/* Botão Aprovar-DSG (Compras) - sempre visível se tiver permissão */}
          {canValidate && (
            <Button
              className="text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--tone-accent)' }}
              onClick={() => setShowValidateForm(true)}
              disabled={factura.status !== 'pendente' || !temAssinatura}
              title={factura.status !== 'pendente' ? 'Só para facturas «Pendente»' : !temAssinatura ? AVISO_SEM_ASSINATURA : 'Aprovar-DSG factura (assina a Autorização de Despesas)'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Aprovar-DSG
            </Button>
          )}
          
          {/* Botão Aprovar (Admin/Gabinetes) - sempre visível se tiver permissão */}
          {canApprove && (
            <Button 
              className="text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--tone-success)' }}
              onClick={() => setShowApproveForm(true)}
              disabled={factura.status !== 'validado' || !temAssinatura}
              title={factura.status !== 'validado' ? 'Disponível depois do Aprovar-DSG (a factura tem de estar «Aprovado-DSG»)' : !temAssinatura ? AVISO_SEM_ASSINATURA : 'Autorizar despesas (assina a Autorização de Despesas)'}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Autorizar Despesas
            </Button>
          )}
          
          {/* Botão Pagar (Financeiro) - sempre visível se tiver permissão */}
          {canPay && (factura.status === 'aprovado' || factura.status === 'submetido_ao_banco') && (
            <Button 
              className="text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--tone-success)' }}
              onClick={() => setShowPayForm(true)}
              disabled={factura.status !== 'submetido_ao_banco'}
              title={factura.status !== 'submetido_ao_banco' ? 'Disponível depois de submeter ao banco' : 'Marcar como pago'}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Marcar como Pago
            </Button>
          )}
          
          {/* Botão Submeter ao Banco (Financeiro) */}
          {canPay && (
            <Button 
              className="text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--tone-gold)' }}
              onClick={() => setShowSubmitBancoForm(true)}
              disabled={factura.status !== 'aprovado' || !opAssinadaPorAmbos}
              title={motivoBancoInactivo}
            >
              <Building className="mr-2 h-4 w-4" />
              Submeter ao Banco
            </Button>
          )}

          {podeEditar && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {podeEditar && onAnular && (
            <Button
              variant="outline"
              onClick={() => { if (window.confirm('Anular esta factura? Fica registada como anulada e deixa de seguir para validação.')) onAnular(); }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Anular
            </Button>
          )}
          {podeEliminar && onEliminar && (
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => { if (window.confirm('Eliminar esta factura? Vai para a Lixeira.')) onEliminar(); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          )}
          {/* Autorização de Despesas: a do Procurement de origem, ou - factura normal -
              "Autorização de Despesas" emitida quando a factura e validada. */}
          {(factura.purchase_order_id || ['validado', 'aprovado', 'submetido_ao_banco', 'pago'].includes(factura.status)) && (
            <Button
              variant="outline"
              onClick={() => visualizarOrdemCompra(
                factura.purchase_order_id ? { ordemId: factura.purchase_order_id } : { facturaId: factura.id }
              ).catch((err) => toast.error(err?.message || 'Erro ao abrir o documento'))}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Ver Autorização de Despesas
            </Button>
          )}
          <Button variant="outline" onClick={() => gerarPDFFactura(factura)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver PDF
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-2">
        {getStatusBadge(factura.status)}
        <Badge variant="outline">{factura.moeda}</Badge>
        {isVencida && (
          <Badge className="text-white" style={{ backgroundColor: 'var(--tone-danger)' }}>
            <AlertTriangle className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />Vencida
          </Badge>
        )}
        {factura.integracao_status === 'confirmado' && (
          <Badge className="text-white" style={{ backgroundColor: 'var(--tone-info)' }}>
            <Check className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />Integrado Primavera
          </Badge>
        )}
      </div>

      {/* Alerta de Vencimento */}
      {/* Processo completo da factura: todos os passos, onde a factura esta,
          quem executa cada passo (permissao da matriz de Roles e Permissoes) e
          se este utilizador o pode fazer - explica porque um botao esta inactivo. */}
      {(() => {
        const etapas = [
          { estados: ['rascunho', 'registada', 'pendente'], titulo: 'Pendente', accao: 'Aprovar-DSG (aprovar a factura pendente)', permissao: 'Aprovar factura pendente (Aprovar-DSG)', pode: !!canValidate },
          { estados: ['validado'], titulo: 'Aprovado-DSG', accao: 'Autorizar a despesa (ou rejeitar)', permissao: 'Autorizar despesa', pode: canApprove },
          { estados: ['aprovado'], titulo: 'Autorização de Despesas', accao: 'Gerar a Ordem de Pagamento, recolher as assinaturas do Presidente e do Administrador e submeter ao banco', permissao: 'Pagamento', pode: canPay },
          { estados: ['submetido_ao_banco'], titulo: 'Submetido ao Banco', accao: 'Marcar como pago (com comprovativo)', permissao: 'Pagamento', pode: canPay },
          { estados: ['pago'], titulo: 'Pago', accao: '', permissao: '', pode: false },
        ];
        if (['rejeitado', 'cancelado', 'arquivado'].includes(factura.status)) {
          const rotulo = factura.status === 'rejeitado' ? 'rejeitada' : factura.status === 'cancelado' ? 'anulada' : 'arquivada';
          return (
            <Card style={{ borderColor: 'var(--tone-danger)' }}>
              <CardContent className="py-3 text-sm flex items-center gap-2">
                <Info className="h-4 w-4 shrink-0" style={{ color: 'var(--tone-danger)' }} />
                <span>Esta factura foi <strong>{rotulo}</strong> e saiu do processo de pagamento.</span>
              </CardContent>
            </Card>
          );
        }
        const actual = etapas.findIndex((e) => e.estados.includes(factura.status));
        if (actual < 0) return null;
        const etapa = etapas[actual];
        return (
          <Card>
            <CardContent className="py-4 space-y-3">
              <p className="text-sm font-semibold">Processo da factura</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {etapas.map((e, i) => {
                  const feito = i < actual;
                  const corrente = i === actual;
                  return (
                    <div key={e.titulo} className="flex items-center gap-1.5">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full border"
                        style={{
                          backgroundColor: corrente ? 'var(--tone-info)' : feito ? 'var(--tone-success-soft)' : 'transparent',
                          color: corrente ? '#fff' : feito ? 'var(--tone-success)' : 'var(--muted-foreground)',
                          borderColor: corrente ? 'var(--tone-info)' : feito ? 'var(--tone-success)' : 'var(--border)',
                          fontWeight: corrente ? 600 : 400,
                        }}
                      >
                        {feito ? '✓ ' : ''}{i + 1}. {e.titulo}
                      </span>
                      {i < etapas.length - 1 && <span className="text-muted-foreground text-xs">›</span>}
                    </div>
                  );
                })}
              </div>
              {etapa.accao ? (
                <>
                {etapa.pode && (factura.status === 'pendente' || factura.status === 'validado') && !temAssinatura && (
                  <p className="text-sm" style={{ color: 'var(--tone-warn)' }}>{AVISO_SEM_ASSINATURA}</p>
                )}
                {factura.status === 'aprovado' && factura.numero_ordem_pagamento && (
                  <p className="text-sm">
                    Ordem de Pagamento:{' '}
                    {assinaturasEmFaltaOP.length
                      ? <span style={{ color: 'var(--tone-warn)' }}>falta a assinatura de {assinaturasEmFaltaOP.join(' e ')} — só depois pode ser submetida ao banco.</span>
                      : <span style={{ color: 'var(--tone-success)' }}>assinada pelo Presidente e pelo Administrador.</span>}
                  </p>
                )}
                <div className="text-sm flex items-start gap-2">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" style={{ color: etapa.pode ? 'var(--tone-success)' : 'var(--tone-info)' }} />
                  <span>
                    <strong>Passo seguinte:</strong> {etapa.accao}.{' '}
                    {etapa.pode
                      ? 'O seu perfil pode executar este passo.'
                      : <>Só quem tem a permissão <strong>«{etapa.permissao}»</strong> (Roles e Permissões → Gestão de Pagamento — acções no fluxo da factura) o pode fazer; os botões dos passos seguintes ficam inactivos até lá.</>}
                  </span>
                </div>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--tone-success)' }}>Processo concluído: a factura está paga.</p>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {isVencida && (
        <Card style={{ borderColor: 'var(--tone-danger)', backgroundColor: 'var(--tone-danger-soft)' }}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2" style={{ color: 'var(--tone-danger)' }}>
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
                  <p className="font-medium">{factura.numero_fornecedor || '-'}</p>
                </div>
              </div>

              {factura.numero_submissao && (
                <div>
                  <p className="text-sm text-muted-foreground">Nº de Submissão do Registo</p>
                  <p className="font-medium" style={{ color: 'var(--tone-info)' }}>{factura.numero_submissao}</p>
                </div>
              )}

              {factura.tipo && (
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Factura</p>
                  <p className="font-medium capitalize">
                    {factura.tipo === 'mercadoria' && <><Package className="inline h-4 w-4 mr-1 align-text-bottom" />Mercadoria</>}
                    {factura.tipo === 'servico' && <><Wrench className="inline h-4 w-4 mr-1 align-text-bottom" />Serviço</>}
                    {factura.tipo === 'ambos' && <><Package className="inline h-4 w-4 mr-1 align-text-bottom" /><Wrench className="inline h-4 w-4 mr-1 align-text-bottom" />Ambos</>}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Fornecedor</p>
                <p className="font-medium">{fornecedorNomeExibicao}</p>
                {(fornecedorNifExibicao || fornecedorEmailExibicao) && (
                  <p className="text-sm text-muted-foreground">
                    {fornecedorNifExibicao && `NIF: ${fornecedorNifExibicao}`}
                    {fornecedorNifExibicao && fornecedorEmailExibicao && ' • '}
                    {fornecedorEmailExibicao}
                  </p>
                )}
                {(fornecedorTelefoneExibicao || fornecedorMoradaExibicao) && (
                  <p className="text-sm text-muted-foreground">
                    {fornecedorTelefoneExibicao && `Tel: ${fornecedorTelefoneExibicao}`}
                    {fornecedorTelefoneExibicao && fornecedorMoradaExibicao && ' • '}
                    {fornecedorMoradaExibicao}
                  </p>
                )}
              </div>

              {(factura.numero_ordem || (factura as any).pedido_numero) && (
                <div className="grid gap-4 md:grid-cols-2">
                  {(factura as any).pedido_numero && (
                    <div>
                      <p className="text-sm text-muted-foreground">Pedido de Compra de origem</p>
                      <p className="font-medium" style={{ color: 'var(--tone-info)' }}>{(factura as any).pedido_numero}</p>
                    </div>
                  )}
                  {factura.numero_ordem && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {factura.origem === 'procurement' ? 'Autorização de Despesas (Procurement)' : 'Ver Autorização de Despesas'}
                      </p>
                      <p className="font-medium" style={{ color: 'var(--tone-info)' }}>{factura.numero_ordem}</p>
                    </div>
                  )}
                </div>
              )}

              {((factura as any).departamento_solicitante || (factura as any).categoria || (factura as any).local_entrega) && (
                <div className="grid gap-4 md:grid-cols-3">
                  {(factura as any).departamento_solicitante && (
                    <div>
                      <p className="text-sm text-muted-foreground">Departamento Solicitante</p>
                      <p className="font-medium">{(factura as any).departamento_solicitante}</p>
                    </div>
                  )}
                  {(factura as any).categoria && (
                    <div>
                      <p className="text-sm text-muted-foreground">Categoria</p>
                      <p className="font-medium">{(factura as any).categoria}</p>
                    </div>
                  )}
                  {(factura as any).local_entrega && (
                    <div>
                      <p className="text-sm text-muted-foreground">Local de Entrega</p>
                      <p className="font-medium">{(factura as any).local_entrega}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Data de Emissão</p>
                  <p className="font-medium">{formatDate(factura.data_emissao)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                  <p className="font-medium">{formatDate(factura.data_vencimento)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Recebimento</p>
                  <p className="font-medium">{formatDate(factura.data_recebimento)}</p>
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
                          {(item.valor_retencao || 0) > 0 && ` (Retenção ${formatCurrency(item.valor_retencao || 0)})`}
                        </p>
                      </div>
                      <p className="font-bold">{formatCurrency(item.total)}</p>
                    </div>
                  </div>
                ))}

                {/* Totais */}
                <div className="border-t border-border pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Valor Bruto:</span>
                    <span className="font-medium">{formatCurrency(factura.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Valor IVA (Cativo):</span>
                    <span className="font-medium text-amber-600">-{formatCurrency(factura.iva_total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Valor Retenção na Fonte:</span>
                    <span className="font-medium text-amber-600">-{formatCurrency(retencaoTotalExibicao)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t border-border pt-2">
                    <span>Valor Final a Pagar:</span>
                    <span className="text-primary">{formatCurrency(valorFinalExibicao)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados Bancários para Pagamento */}
          {(factura.banco_iban || factura.banco_nib || factura.banco_swift) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Dados Bancários para Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                {factura.banco_titular && (
                  <div>
                    <p className="text-sm text-muted-foreground">Titular da Conta</p>
                    <p className="font-medium">{factura.banco_titular}</p>
                  </div>
                )}
                {factura.banco_nome && (
                  <div>
                    <p className="text-sm text-muted-foreground">Banco</p>
                    <p className="font-medium">{factura.banco_nome}</p>
                  </div>
                )}
                {factura.banco_iban && (
                  <div>
                    <p className="text-sm text-muted-foreground">IBAN</p>
                    <p className="font-medium font-mono">{factura.banco_iban}</p>
                  </div>
                )}
                {factura.banco_nib && (
                  <div>
                    <p className="text-sm text-muted-foreground">NIB</p>
                    <p className="font-medium font-mono">{factura.banco_nib}</p>
                  </div>
                )}
                {factura.banco_swift && (
                  <div>
                    <p className="text-sm text-muted-foreground">Código SWIFT/BIC</p>
                    <p className="font-medium font-mono">{factura.banco_swift}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Anexos - sempre visivel, em qualquer estado da factura */}
          {(
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
                      const url = urlPublica(anexo?.url || anexo?.signedUrl);
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
                                {(anexo as any)?.origem && ` • ${origemAnexoLabel[(anexo as any).origem] || (anexo as any).origem}`}
                              </p>
                              {!hasUrl && (
                                <p className="text-xs mt-1" style={{ color: 'var(--tone-danger)' }}><AlertTriangle className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />Ficheiro não foi carregado no sistema (só o nome foi registado)</p>
                              )}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            disabled={!hasUrl}
                            onClick={() => {
                              if (url) previewDocument({ url, nome: anexo?.nome, tipo: anexo?.tipo });
                            }}
                            title={hasUrl ? 'Pré-visualizar documento' : 'URL do documento não disponível'}
                          >
                            <Eye className="h-4 w-4" />
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
                Histórico de Ações ({historicoExibido.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {historicoExibido.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma ação registada
                </p>
              ) : (
                historicoExibido.map((h) => (
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
              {/* Aprovar-DSG */}
              {canValidate && factura.status === 'pendente' && !showValidateForm && (
                <>
                  <Button className="w-full" onClick={() => setShowValidateForm(true)} disabled={!temAssinatura} title={!temAssinatura ? AVISO_SEM_ASSINATURA : undefined}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Aprovar-DSG Factura
                  </Button>
                  {!temAssinatura && <p className="text-xs" style={{ color: 'var(--tone-warn)' }}>{AVISO_SEM_ASSINATURA}</p>}
                </>
              )}

              {showValidateForm && (
                <div className="space-y-3 p-3 border border-border rounded-lg">
                  <Textarea
                    placeholder="Comentário de aprovação (DSG)..."
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

              {/* Autorizar Despesas */}
              {canApprove && factura.status === 'validado' && !showApproveForm && !temAssinatura && (
                <p className="text-xs" style={{ color: 'var(--tone-warn)' }}>{AVISO_SEM_ASSINATURA}</p>
              )}
              {canApprove && factura.status === 'validado' && !showApproveForm && (
                <Button className="w-full" onClick={() => setShowApproveForm(true)} disabled={!temAssinatura} title={!temAssinatura ? AVISO_SEM_ASSINATURA : undefined}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Autorizar Despesas
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
                <div className="space-y-3 p-3 border rounded-lg" style={{ borderColor: 'var(--tone-danger)', backgroundColor: 'var(--tone-danger-soft)' }}>
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

              {canPay && (factura.status === 'aprovado' || factura.status === 'submetido_ao_banco') && !factura.numero_ordem_pagamento && (
                <p className="text-xs rounded-lg p-2" style={{ color: 'var(--tone-warn)', backgroundColor: 'var(--tone-warn-soft)', border: '1px solid var(--tone-warn)' }}>
                  Gere a Ordem de Pagamento (abaixo) antes de submeter ao banco ou registar o pagamento.
                </p>
              )}

              {/* Pagar: so depois de submetida ao banco - "aprovado" tem de passar
                  primeiro por "Submeter ao Banco", nunca ir directo a pago. */}
              {canPay && factura.status === 'submetido_ao_banco' && factura.numero_ordem_pagamento && !showPayForm && (
                <Button className="w-full text-white hover:opacity-90" style={{ backgroundColor: 'var(--tone-success)' }} onClick={() => setShowPayForm(true)}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Registar Pagamento
                </Button>
              )}

              {showPayForm && (
                <div className="space-y-3 p-3 border rounded-lg" style={{ borderColor: 'var(--tone-success)', backgroundColor: 'var(--tone-success-soft)' }}>
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
                    <Button size="sm" className="text-white hover:opacity-90" style={{ backgroundColor: 'var(--tone-success)' }} onClick={handlePay}>
                      Confirmar Pagamento
                    </Button>
                  </div>
                </div>
              )}

              {/* Submeter ao Banco */}
              {canPay && factura.status === 'aprovado' && factura.numero_ordem_pagamento && !showSubmitBancoForm && !opAssinadaPorAmbos && (
                <p className="text-xs rounded-lg p-2" style={{ color: 'var(--tone-warn)', backgroundColor: 'var(--tone-warn-soft)', border: '1px solid var(--tone-warn)' }}>
                  {motivoBancoInactivo}. A Ordem de Pagamento tem de estar assinada pelo Presidente e pelo Administrador antes de ir ao banco.
                </p>
              )}
              {canPay && factura.status === 'aprovado' && factura.numero_ordem_pagamento && !showSubmitBancoForm && (
                <Button className="w-full text-white hover:opacity-90" style={{ backgroundColor: 'var(--tone-gold)' }} onClick={() => setShowSubmitBancoForm(true)} disabled={!opAssinadaPorAmbos} title={motivoBancoInactivo}>
                  <Upload className="mr-2 h-4 w-4" />
                  Submeter ao Banco
                </Button>
              )}

              {showSubmitBancoForm && (
                <div className="space-y-3 p-3 border rounded-lg" style={{ borderColor: 'var(--tone-gold)', backgroundColor: 'var(--tone-gold-soft)' }}>
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
                    <Button size="sm" className="text-white hover:opacity-90" style={{ backgroundColor: 'var(--tone-gold)' }} onClick={handleSubmitToBanco}>
                      Submeter
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ordem de Pagamento */}
          {podeGerirOrdemPagamento && (factura.status === 'aprovado' || factura.status === 'submetido_ao_banco' || factura.status === 'pago' || factura.numero_ordem_pagamento) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-4 w-4" />
                  Ordem de Pagamento Fornecedor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!factura.numero_ordem_pagamento && !showOrdemPagamentoForm && (
                  <Button className="w-full" variant="outline" onClick={() => setShowOrdemPagamentoForm(true)}>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Gerar Ordem de Pagamento Fornecedor
                  </Button>
                )}

                {showOrdemPagamentoForm && (
                  <div className="space-y-3 p-3 border border-border rounded-lg">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">N.º de Despacho</label>
                      <Input
                        placeholder="Ex: 080/2026"
                        value={numeroDespacho}
                        onChange={(e) => setNumeroDespacho(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Conta a Debitar (FADA)</label>
                      <Input
                        placeholder="Nº da conta domiciliada no banco"
                        value={contaDebito}
                        onChange={(e) => setContaDebito(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setShowOrdemPagamentoForm(false)}>
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleGerarOrdemPagamento} disabled={!numeroDespacho.trim() || !contaDebito.trim()}>
                        Gerar
                      </Button>
                    </div>
                  </div>
                )}

                {factura.numero_ordem_pagamento && (
                  <>
                    <div>
                      <p className="text-sm text-muted-foreground">N.º da Ordem</p>
                      <p className="font-medium">{factura.numero_ordem_pagamento}</p>
                    </div>

                    {factura.ordem_pagamento?.numero_despacho && factura.ordem_pagamento?.conta_debito ? (
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">N.º de Despacho</p>
                          <p className="font-medium">{factura.ordem_pagamento.numero_despacho}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conta a Debitar</p>
                          <p className="font-medium">{factura.ordem_pagamento.conta_debito}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 border rounded-lg" style={{ borderColor: 'var(--tone-warn)', backgroundColor: 'var(--tone-warn-soft)' }}>
                        <p className="text-xs" style={{ color: 'var(--tone-warn)' }}>
                          Gerada automaticamente ao aprovar. Complete o despacho e a conta a debitar antes de submeter ao banco.
                        </p>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">N.º de Despacho</label>
                          <Input
                            placeholder="Ex: 080/2026"
                            value={numeroDespacho}
                            onChange={(e) => setNumeroDespacho(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Conta a Debitar (FADA)</label>
                          <Input
                            placeholder="Nº da conta domiciliada no banco"
                            value={contaDebito}
                            onChange={(e) => setContaDebito(e.target.value)}
                          />
                        </div>
                        <Button size="sm" onClick={handleGerarOrdemPagamento} disabled={!numeroDespacho.trim() || !contaDebito.trim()}>
                          Guardar dados
                        </Button>
                      </div>
                    )}

                    <div className="space-y-2">
                      {PAPEIS_ASSINATURA.map(({ papel, label, role }) => {
                        const assinatura = assinaturas.find((a) => a.papel === papel);
                        const souEsteAssinante = userRole === role;
                        return (
                          <div key={papel} className="flex items-center justify-between text-sm p-2 border border-border rounded-lg">
                            <div>
                              <p className="font-medium">{label}</p>
                              {assinatura ? (
                                <p className="text-xs" style={{ color: 'var(--tone-success)' }}><Check className="inline h-3.5 w-3.5 mr-1 align-text-bottom" />Assinado por {assinatura.nome}</p>
                              ) : (
                                <p className="text-xs text-muted-foreground">Assinatura pendente</p>
                              )}
                            </div>
                            {!assinatura && souEsteAssinante && (
                              user?.signatureImage ? (
                                <Button size="sm" variant="outline" onClick={() => onAssinarOrdemPagamento?.(papel)}>
                                  <PenTool className="mr-1 h-3 w-3" />
                                  Assinar
                                </Button>
                              ) : (
                                <label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={uploadingSignature}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleUploadESignAssinatura(file);
                                    }}
                                  />
                                  <Button size="sm" variant="outline" disabled={uploadingSignature} asChild>
                                    <span>
                                      <Upload className="mr-1 h-3 w-3" />
                                      {uploadingSignature ? 'A carregar...' : 'Carregar assinatura'}
                                    </span>
                                  </Button>
                                </label>
                              )
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <Button className="w-full" variant="outline" onClick={handleBaixarOrdemPagamento} disabled={gerandoPdfOp}>
                      <Eye className="mr-2 h-4 w-4" />
                      {gerandoPdfOp ? 'A gerar...' : 'Ver Ordem de Pagamento Fornecedor'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações de Aprovação-DSG */}
          {factura.validado_at && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Aprovação-DSG</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Aprovado-DSG por</p>
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
            <Card style={{ borderColor: 'var(--tone-danger)' }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: 'var(--tone-danger)' }}>Rejeição</CardTitle>
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
                    <p className="text-sm" style={{ color: 'var(--tone-danger)' }}>{factura.rejeicao_motivo}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Informações de Submissão ao Banco */}
          {factura.submetido_banco_at && (
            <Card style={{ borderColor: 'var(--tone-gold)' }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: 'var(--tone-gold)' }}>Submissão ao Banco</CardTitle>
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
            <Card style={{ borderColor: 'var(--tone-success)' }}>
              <CardHeader>
                <CardTitle className="text-sm" style={{ color: 'var(--tone-success)' }}>Pagamento</CardTitle>
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
                        onClick={() => previewDocument({ url: factura.comprovativo_url!, nome: `comprovativo_${factura.numero}` })}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Comprovativo
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
