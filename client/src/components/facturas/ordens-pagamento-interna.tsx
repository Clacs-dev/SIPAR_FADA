/**
 * Ordens de Pagamento Interna - mesmo documento final (PDF) e mesmo fluxo de
 * assinaturas (Presidente + Administrador) da Ordem de Pagamento Fornecedor,
 * mas preenchida manualmente pelo utilizador em vez de gerada automaticamente
 * a partir de uma factura aprovada (ver internal-payment-orders.routes.ts).
 */

import { useEffect, useState } from "react";
import { previewPdf } from "../ui/document-preview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { MoneyInput } from "../ui/money-input";
import { formatarIban, validarIban } from "../../utils/bank-format";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Plus, FileSignature, Download, PenTool, Upload, Trash2, Pencil, DollarSign, Check } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { gerarPDFOrdemPagamento, urlParaDataUrl } from "../../utils/pdf-generator";
import type { OrdemPagamentoInterna } from "./types";

// Mesmos papeis/roles da Ordem de Pagamento Fornecedor (ver PAPEIS_ASSINATURA
// em factura-details.tsx) - mantidos aqui em duplicado para nao acoplar este
// ficheiro novo a factura-details.tsx.
const PAPEIS_ASSINATURA: { papel: 'presidente' | 'administrador'; label: string; role: string }[] = [
  { papel: 'presidente', label: 'Presidente', role: 'gabinete_pca' },
  { papel: 'administrador', label: 'Administrador', role: 'gabinete_administrador' },
];

const PODE_GERIR = ['gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director', 'gestao', 'financeiro', 'admin_sistema'];

function formatCurrency(valor: number, moeda = 'AOA') {
  return `${(valor || 0).toLocaleString('pt-AO')} ${moeda}`;
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; tone: string }> = {
    rascunho: { label: 'Rascunho', tone: 'var(--tone-neutral)' },
    assinado: { label: 'Assinado', tone: 'var(--tone-info)' },
    submetido_ao_banco: { label: 'Submetido ao Banco', tone: 'var(--tone-gold)' },
    pago: { label: 'Pago', tone: 'var(--tone-success)' },
  };
  const item = map[status] || map.rascunho;
  return <Badge className="text-white" style={{ backgroundColor: item.tone }}>{item.label}</Badge>;
}

interface FormState {
  descricao: string;
  valor: string;
  moeda: string;
  destinatario: string;
  numero_despacho: string;
  conta_debito: string;
  banco_nome: string;
  banco_iban: string;
  banco_numero_conta: string;
  banco_cidade: string;
  banco_pais: string;
}

const FORM_INICIAL: FormState = {
  descricao: '', valor: '', moeda: 'AOA', destinatario: '',
  numero_despacho: '', conta_debito: '', banco_nome: '', banco_iban: '', banco_numero_conta: '', banco_cidade: '', banco_pais: '',
};

interface OrdensPagamentoInternaProps {
  userRole: string;
}

export function OrdensPagamentoInterna({ userRole }: OrdensPagamentoInternaProps) {
  const { user, accessToken, refreshUser } = useAuth();
  const [ordens, setOrdens] = useState<OrdemPagamentoInterna[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState<OrdemPagamentoInterna | null>(null);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [selecionada, setSelecionada] = useState<OrdemPagamentoInterna | null>(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);

  const podeGerir = PODE_GERIR.includes(userRole);
  const podePagar = userRole === 'financeiro' || userRole === 'admin_sistema';

  const carregar = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/internal-payment-orders`, { headers: getAuthHeaders(false) });
      if (!response.ok) throw new Error('Erro ao carregar Ordens de Pagamento Interna');
      const data = await response.json();
      setOrdens(data.ordens || []);
    } catch (error) {
 console.error('Erro ao carregar Ordens de Pagamento Interna:', error);
      toast.error('Erro ao carregar Ordens de Pagamento Interna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirNova = () => {
    setEditando(null);
    setForm(FORM_INICIAL);
    setFormOpen(true);
  };

  const abrirEdicao = (ordem: OrdemPagamentoInterna) => {
    setEditando(ordem);
    setForm({
      descricao: ordem.descricao,
      valor: String(ordem.valor),
      moeda: ordem.moeda,
      destinatario: ordem.destinatario,
      numero_despacho: ordem.numero_despacho || '',
      conta_debito: ordem.conta_debito || '',
      banco_nome: ordem.banco_nome || '',
      banco_iban: ordem.banco_iban || '',
      banco_numero_conta: ordem.banco_numero_conta || '',
      banco_cidade: ordem.banco_cidade || '',
      banco_pais: ordem.banco_pais || '',
    });
    setFormOpen(true);
  };

  const handleSubmitForm = async () => {
    if (!form.descricao.trim() || !form.destinatario.trim() || !form.valor) {
      toast.error('Descrição, destinatário e valor são obrigatórios');
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        descricao: form.descricao.trim(),
        valor: parseFloat(form.valor),
        moeda: form.moeda || 'AOA',
        destinatario: form.destinatario.trim(),
        numero_despacho: form.numero_despacho.trim() || undefined,
        conta_debito: form.conta_debito.trim() || undefined,
        banco_nome: form.banco_nome.trim() || undefined,
        banco_iban: form.banco_iban.trim() || undefined,
        banco_numero_conta: form.banco_numero_conta.trim() || undefined,
        banco_cidade: form.banco_cidade.trim() || undefined,
        banco_pais: form.banco_pais.trim() || undefined,
      };
      const url = editando
        ? `${API_BASE_URL}/internal-payment-orders/${editando.id}`
        : `${API_BASE_URL}/internal-payment-orders`;
      const response = await fetch(url, {
        method: editando ? 'PUT' : 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao guardar Ordem de Pagamento Interna');
      }
      toast.success(editando ? 'Ordem de Pagamento Interna atualizada' : 'Ordem de Pagamento Interna criada');
      setFormOpen(false);
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao guardar Ordem de Pagamento Interna');
    } finally {
      setSalvando(false);
    }
  };

  const handleEliminar = async (ordem: OrdemPagamentoInterna) => {
    if (!confirm(`Eliminar a Ordem de Pagamento Interna ${ordem.numero}?`)) return;
    try {
      const response = await fetch(`${API_BASE_URL}/internal-payment-orders/${ordem.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao eliminar');
      }
      toast.success('Ordem de Pagamento Interna eliminada');
      setSelecionada(null);
      await carregar();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao eliminar');
    }
  };

  const handleUploadESignAssinatura = async (file: File) => {
    if (!accessToken) return;
    setUploadingSignature(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/auth/me/signature`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.message || 'Erro ao carregar assinatura');
      await refreshUser();
      toast.success('Assinatura carregada. Pode agora assinar.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar assinatura');
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleAssinar = async (papel: 'presidente' | 'administrador') => {
    if (!selecionada) return;
    try {
      const response = await fetch(`${API_BASE_URL}/internal-payment-orders/${selecionada.id}/assinar`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ papel }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao assinar');
      }
      const data = await response.json();
      setSelecionada(data.ordem);
      setOrdens((prev) => prev.map((o) => (o.id === data.ordem.id ? data.ordem : o)));
      toast.success('Assinatura registada com sucesso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao assinar');
    }
  };

  const handleSubmeterBanco = async () => {
    if (!selecionada) return;
    try {
      const response = await fetch(`${API_BASE_URL}/internal-payment-orders/${selecionada.id}/submeter-banco`, {
        method: 'POST',
        headers: getAuthHeaders(false),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao submeter ao banco');
      }
      const data = await response.json();
      setSelecionada(data.ordem);
      setOrdens((prev) => prev.map((o) => (o.id === data.ordem.id ? data.ordem : o)));
      toast.success('Ordem de Pagamento Interna submetida ao banco');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao submeter ao banco');
    }
  };

  // Anexa os dossies/documentos que justificam a despesa (facturas, recibos,
  // despachos, etc.) - disponível em qualquer estado até a ordem ser paga.
  const handleAnexarDossie = async (files: FileList) => {
    if (!selecionada || !accessToken) return;
    setUploadingAnexo(true);
    try {
      const anexosCarregados: { nome: string; url: string; tamanho: number; tipo: string; uploaded_at: string }[] = [];
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(`${API_BASE_URL}/storage/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.message || err.error || `Erro ao carregar ${file.name}`);
        }
        const data = await response.json();
        anexosCarregados.push({
          nome: file.name,
          url: data.file?.url,
          tamanho: file.size,
          tipo: file.type,
          uploaded_at: new Date().toISOString(),
        });
      }

      const response = await fetch(`${API_BASE_URL}/internal-payment-orders/${selecionada.id}/anexos`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ anexos: anexosCarregados }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao anexar documentos');
      }
      const data = await response.json();
      setSelecionada(data.ordem);
      setOrdens((prev) => prev.map((o) => (o.id === data.ordem.id ? data.ordem : o)));
      toast.success('Documento(s) anexado(s) com sucesso');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao anexar documentos');
    } finally {
      setUploadingAnexo(false);
    }
  };

  const handleMarcarPaga = async () => {
    if (!selecionada) return;
    try {
      const response = await fetch(`${API_BASE_URL}/internal-payment-orders/${selecionada.id}/pagar`, {
        method: 'POST',
        headers: getAuthHeaders(false),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Erro ao marcar como paga');
      }
      const data = await response.json();
      setSelecionada(data.ordem);
      setOrdens((prev) => prev.map((o) => (o.id === data.ordem.id ? data.ordem : o)));
      toast.success('Ordem de Pagamento Interna marcada como paga');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao marcar como paga');
    }
  };

  const handleBaixarPdf = async () => {
    if (!selecionada) return;
    setGerandoPdf(true);
    try {
      const assinaturasComImagem = await Promise.all(
        selecionada.assinaturas.map(async (assinatura) => {
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
        numero: selecionada.numero,
        tipo: 'interna',
        contaDebito: selecionada.conta_debito,
        numeroDespacho: selecionada.numero_despacho,
        descricao: selecionada.descricao,
        valor: selecionada.valor,
        moeda: selecionada.moeda,
        fornecedor: selecionada.destinatario,
        bancoNome: selecionada.banco_nome,
        bancoIban: selecionada.banco_iban,
        bancoNumeroConta: selecionada.banco_numero_conta,
        bancoCidade: selecionada.banco_cidade,
        bancoPais: selecionada.banco_pais,
        data: selecionada.created_at,
        assinaturas: assinaturasComImagem,
      });
      previewPdf(doc, `Ordem_Pagamento_Interna_${selecionada.numero.replace(/[\/\s]/g, '-')}.pdf`);
    } catch (error) {
 console.error('Erro ao gerar PDF da Ordem de Pagamento Interna:', error);
      toast.error('Erro ao gerar o PDF');
    } finally {
      setGerandoPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Ordens de pagamento criadas manualmente (sem factura associada) - mesmo fluxo de assinaturas da Ordem de Pagamento Fornecedor.
        </p>
        {podeGerir && (
          <Button size="sm" onClick={abrirNova}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Ordem Interna
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {loading ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">A carregar...</CardContent></Card>
        ) : ordens.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileSignature className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma Ordem de Pagamento Interna criada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          ordens.map((ordem) => (
            <Card
              key={ordem.id}
              className="hover:bg-accent cursor-pointer transition-colors"
              onClick={() => setSelecionada(ordem)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="text-white" style={{ backgroundColor: 'var(--tone-info)' }}>{ordem.numero}</Badge>
                      {getStatusBadge(ordem.status)}
                      <Badge variant={ordem.assinaturas.length === 2 ? 'default' : 'outline'}>
                        {ordem.assinaturas.length}/2 assinaturas
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{ordem.descricao}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">A favor de {ordem.destinatario}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{formatCurrency(ordem.valor, ordem.moeda)}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>

      {/* Dialog: Nova / Editar */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Ordem de Pagamento Interna' : 'Nova Ordem de Pagamento Interna'}</DialogTitle>
            <DialogDescription>Preencha manualmente todos os campos do documento.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Descrição / Motivo do Pagamento *</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Ex: Reembolso de despesas de deslocação"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>A favor de (destinatário) *</Label>
              <Input
                value={form.destinatario}
                onChange={(e) => setForm({ ...form, destinatario: e.target.value })}
                placeholder="Ex: Nome do colaborador ou departamento"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <MoneyInput
                  value={Number(form.valor) || 0}
                  onValueChange={(valor) => setForm({ ...form, valor: String(valor) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Moeda</Label>
                <Input value={form.moeda} onChange={(e) => setForm({ ...form, moeda: e.target.value })} placeholder="AOA" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>N.º de Despacho</Label>
                <Input
                  value={form.numero_despacho}
                  onChange={(e) => setForm({ ...form, numero_despacho: e.target.value })}
                  placeholder="Ex: 080/2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Conta a Debitar (FADA)</Label>
                <Input
                  value={form.conta_debito}
                  onChange={(e) => setForm({ ...form, conta_debito: e.target.value })}
                  placeholder="Nº da conta domiciliada no banco"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Banco do Destinatário</Label>
                <Input value={form.banco_nome} onChange={(e) => setForm({ ...form, banco_nome: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>IBAN</Label>
                <Input
                  value={form.banco_iban}
                  maxLength={31}
                  aria-invalid={!!validarIban(form.banco_iban)}
                  onChange={(e) => setForm({ ...form, banco_iban: formatarIban(e.target.value) })}
                />
                {validarIban(form.banco_iban) && (
                  <p className="text-xs text-destructive">{validarIban(form.banco_iban)}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Número de Conta</Label>
                <Input
                  value={form.banco_numero_conta}
                  maxLength={40}
                  onChange={(e) => setForm({ ...form, banco_numero_conta: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Cidade</Label>
                <Input value={form.banco_cidade} onChange={(e) => setForm({ ...form, banco_cidade: e.target.value })} placeholder="Luanda" />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Input value={form.banco_pais} onChange={(e) => setForm({ ...form, banco_pais: e.target.value })} placeholder="Angola" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={salvando}>Cancelar</Button>
              <Button onClick={handleSubmitForm} disabled={salvando}>
                {salvando ? 'A guardar...' : editando ? 'Guardar Alterações' : 'Criar Ordem'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Detalhes / Assinar */}
      <Dialog open={!!selecionada} onOpenChange={(open) => !open && setSelecionada(null)}>
        {selecionada && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSignature className="h-5 w-5" />
                {selecionada.numero}
              </DialogTitle>
              <DialogDescription>{selecionada.descricao}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusBadge(selecionada.status)}
                <Badge variant="outline">{formatCurrency(selecionada.valor, selecionada.moeda)}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">A favor de</p>
                  <p className="font-medium">{selecionada.destinatario}</p>
                </div>
                {selecionada.numero_despacho && (
                  <div>
                    <p className="text-muted-foreground">N.º de Despacho</p>
                    <p className="font-medium">{selecionada.numero_despacho}</p>
                  </div>
                )}
                {selecionada.conta_debito && (
                  <div>
                    <p className="text-muted-foreground">Conta a Debitar</p>
                    <p className="font-medium">{selecionada.conta_debito}</p>
                  </div>
                )}
                {selecionada.banco_nome && (
                  <div>
                    <p className="text-muted-foreground">Banco</p>
                    <p className="font-medium">{selecionada.banco_nome} {selecionada.banco_iban ? `- ${selecionada.banco_iban}` : ''}</p>
                    {selecionada.banco_numero_conta && <p className="text-xs text-muted-foreground">Conta n.º {selecionada.banco_numero_conta}</p>}
                  </div>
                )}
              </div>

              {selecionada.status === 'rascunho' && podeGerir && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { abrirEdicao(selecionada); setSelecionada(null); }}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" className="text-tone-danger" onClick={() => handleEliminar(selecionada)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Eliminar
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {PAPEIS_ASSINATURA.map(({ papel, label, role }) => {
                  const assinatura = selecionada.assinaturas.find((a) => a.papel === papel);
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
                          <Button size="sm" variant="outline" onClick={() => handleAssinar(papel)}>
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

              {/* Dossiês / documentos que justificam a despesa */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Dossiês / Documentos Justificativos</Label>
                  {selecionada.status !== 'pago' && (
                    <label>
                      <input
                        type="file"
                        multiple
                        accept="application/pdf,image/*"
                        className="hidden"
                        disabled={uploadingAnexo}
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) handleAnexarDossie(e.target.files);
                          e.target.value = '';
                        }}
                      />
                      <Button size="sm" variant="outline" disabled={uploadingAnexo} asChild>
                        <span>
                          <Upload className="mr-1 h-3 w-3" />
                          {uploadingAnexo ? 'A carregar...' : 'Anexar dossiê'}
                        </span>
                      </Button>
                    </label>
                  )}
                </div>
                {selecionada.anexos && selecionada.anexos.length > 0 ? (
                  <div className="space-y-1">
                    {selecionada.anexos.map((anexo, index) => (
                      <a
                        key={anexo.id || index}
                        href={anexo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-sm p-2 border border-border rounded-lg hover:bg-accent"
                      >
                        <span className="truncate">{anexo.nome}</span>
                        <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nenhum documento anexado ainda.</p>
                )}
              </div>

              {selecionada.status === 'assinado' && podePagar && (
                <Button className="w-full" onClick={handleSubmeterBanco}>
                  <FileSignature className="mr-2 h-4 w-4" />
                  Submeter ao Banco
                </Button>
              )}

              {selecionada.status === 'submetido_ao_banco' && podePagar && (
                <Button className="w-full" onClick={handleMarcarPaga}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Marcar como Paga
                </Button>
              )}

              <Button className="w-full" variant="outline" onClick={handleBaixarPdf} disabled={gerandoPdf}>
                <Download className="mr-2 h-4 w-4" />
                {gerandoPdf ? 'A gerar...' : 'Ver PDF'}
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
