import { useState, useEffect } from "react";
import { formatarIban, formatarNib, validarIban, validarNib } from "../../utils/bank-format";
import { Receipt, Upload, X, Save, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MoneyInput } from "../ui/money-input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Factura, ItemFactura, Fornecedor, FacturaTipo } from "./types";
import { FileUpload } from "../ui/file-upload";
import { useFileUpload } from "../../hooks/use-file-upload";
import { TAXAS_IVA_PRODUTOS, TAXA_RETENCAO_SERVICOS, LIMIAR_RETENCAO_SERVICOS, calcularFiscal, somarFiscal } from "../../utils/fiscal";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL } from "@/services/api";
import { NifLookupField, DadosAgtDoNif } from "../shared/nif-lookup-field";
import {
  ModoRegisto, RespostaExtraccao, BotaoLeituraPdf, ZonaPdf, PainelRevisaoExtraccao, useEstadoExtraccao, extrairFicheiro,
} from "./extraccao-pdf";
import type { DadosNif } from "../../utils/nif-lookup";

interface DadosBancariosFornecedor {
  banco_nome?: string | null;
  banco_iban?: string | null;
  banco_nib?: string | null;
  banco_swift?: string | null;
  banco_titular?: string | null;
  banco_cidade?: string | null;
  banco_pais?: string | null;
}

interface FacturaFormProps {
  factura?: Factura;
  fornecedores: Fornecedor[];
  onSave: (factura: Partial<Factura>) => void;
  onCancel: () => void;
}

export function FacturaForm({ factura, fornecedores, onSave, onCancel }: FacturaFormProps) {
  const { accessToken } = useAuth();
  const [dadosBancariosFornecedor, setDadosBancariosFornecedor] = useState<DadosBancariosFornecedor | null>(null);
  const [loadingDadosBancarios, setLoadingDadosBancarios] = useState(false);
  // Adicionar conta bancária ao fornecedor seleccionado, sem sair deste
  // formulário, quando ele ainda não tem nenhuma guardada.
  const [addContaBancariaOpen, setAddContaBancariaOpen] = useState(false);
  const [savingContaBancaria, setSavingContaBancaria] = useState(false);
  const [novaContaBancaria, setNovaContaBancaria] = useState({
    banco_nome: '', banco_titular: '', banco_iban: '', banco_nib: '', banco_swift: '', banco_cidade: '', banco_pais: 'Angola',
  });
  // Fornecedor ainda não cadastrado na plataforma: em vez de escolher da
  // lista, digita-se o NIF (consulta a AGT para preencher o nome) e o nome
  // fica livre para editar - a factura grava-se na mesma, sem exigir um
  // registo de Fornecedor.
  const [fornecedorNaoListado, setFornecedorNaoListado] = useState(false);
  const [nifAdHoc, setNifAdHoc] = useState('');
  const [nomeAdHoc, setNomeAdHoc] = useState('');
  const [dadosAgtAdHoc, setDadosAgtAdHoc] = useState<DadosNif | null>(null);
  // Leitura automatica do PDF (so na Nova Factura): aberta pelo icone de IA no cartao do fornecedor.
  const [leituraPdfAberta, setLeituraPdfAberta] = useState(false);
  const { estado: estadoExtraccao, setEstado: setEstadoExtraccao } = useEstadoExtraccao();
  const [extraccao, setExtraccao] = useState<{ resposta: RespostaExtraccao; indice: number; ficheiro: File; pdfUrl: string } | null>(null);
  const [aTentarIa, setATentarIa] = useState(false);
  // O que a extraccao preencheu - para a Auditoria saber o que o utilizador corrigiu.
  const [preenchidoPelaExtraccao, setPreenchidoPelaExtraccao] = useState<Record<string, string> | null>(null);
  const [bancoExtraido, setBancoExtraido] = useState<RespostaExtraccao['documentos'][number]['banco'] | null>(null);
  const [formData, setFormData] = useState({
    fornecedor_id: factura?.fornecedor_id || '',
    numero_fornecedor: factura?.numero_fornecedor || '',
    tipo: factura?.tipo || '' as FacturaTipo | '',
    // Factura definitiva (VFA) ou proforma (VFAP) - igual ao portal externo.
    tipo_documento: (factura?.tipo_documento || 'factura') as 'factura' | 'factura_proforma' | 'outro',
    data_emissao: factura?.data_emissao || '',
    data_vencimento: factura?.data_vencimento || '',
    data_recebimento: factura?.data_recebimento || new Date().toISOString().split('T')[0],
    descricao: factura?.descricao || '',
    observacoes: factura?.observacoes || '',
    condicoes_pagamento: factura?.condicoes_pagamento || '',
    moeda: factura?.moeda || 'AOA',
  });

  const [itens, setItens] = useState<ItemFactura[]>(
    factura?.itens || [
      {
        id: '1',
        descricao: '',
        quantidade: 1,
        preco_unitario: 0,
        tipo_operacao: 'produto',
        iva: 14,
        aplica_retencao: false,
        valor_retencao: 0,
        total: 0,
      }
    ]
  );

  // Ao seleccionar o fornecedor, mostra os dados bancários já guardados dele
  // (da conta de utilizador ligada, se tiver login no portal, ou dos
  // guardados directamente no registo de Fornecedor) - para quem regista a
  // factura internamente (Compras/Financeiro) ver/confirmar para onde vai o
  // pagamento, sem ter de digitar nada.
  const recarregarDadosBancarios = async (): Promise<DadosBancariosFornecedor | null> => {
    if (!formData.fornecedor_id || !accessToken) return null;
    setLoadingDadosBancarios(true);
    try {
      const res = await fetch(`${API_BASE_URL}/procurement/fornecedores/${formData.fornecedor_id}/dados-bancarios`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = res.ok ? await res.json() : null;
      const dados = data?.dados_bancarios || null;
      setDadosBancariosFornecedor(dados);
      return dados;
    } catch {
      setDadosBancariosFornecedor(null);
      return null;
    } finally {
      setLoadingDadosBancarios(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
    setDadosBancariosFornecedor(null);
    setAddContaBancariaOpen(false);
    if (!formData.fornecedor_id || !accessToken) return;
    setLoadingDadosBancarios(true);
    fetch(`${API_BASE_URL}/procurement/fornecedores/${formData.fornecedor_id}/dados-bancarios`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelado) setDadosBancariosFornecedor(data?.dados_bancarios || null); })
      .catch(() => { if (!cancelado) setDadosBancariosFornecedor(null); })
      .finally(() => { if (!cancelado) setLoadingDadosBancarios(false); });
    return () => { cancelado = true; };
  }, [formData.fornecedor_id, accessToken]);

  const {
    files,
    uploading,
    uploadFiles,
    removeFile,
    formatFileSize,
    setInitialFiles,
  } = useFileUpload('make-8b82752b-facturas');

  // Ao editar, os anexos ja gravados entram na lista - sem isto a lista
  // comecava vazia e gravar a edicao enviava "anexos: []", apagando os
  // documentos da factura.
  const anexosOriginais = (factura?.anexos || []) as any[];
  useEffect(() => {
    if (!factura?.id) return;
    setInitialFiles(anexosOriginais
      .filter((a) => a && (a.url || a.id))
      .map((a, i) => ({
        id: a.id || `anexo-${i}`,
        name: a.nome || a.name || 'Documento',
        size: a.tamanho ?? a.size ?? 0,
        url: a.url || '',
        tipo: a.tipo || a.type || '',
      })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factura?.id]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof ItemFactura, value: any) => {
    const newItens = [...itens];
    newItens[index] = {
      ...newItens[index],
      [field]: value,
    };

    // Recalcular total do item - IVA (0/2/5/7/14%) e retenção na fonte
    // (6,5%, activada por "aplica_retencao") são independentes, podem
    // aplicar-se os dois ao mesmo item (ver utils/fiscal.ts).
    if (field === 'quantidade' || field === 'preco_unitario' || field === 'iva' || field === 'aplica_retencao') {
      const item = newItens[index];
      const subtotal = item.quantidade * item.preco_unitario;
      const fiscal = calcularFiscal(subtotal, item.iva, item.aplica_retencao);
      item.iva = fiscal.taxa_iva;
      item.valor_retencao = fiscal.valor_retencao;
      item.total = fiscal.valor_final;
    }

    setItens(newItens);
  };

  const addItem = () => {
    setItens([
      ...itens,
      {
        id: Date.now().toString(),
        descricao: '',
        quantidade: 1,
        preco_unitario: 0,
        tipo_operacao: 'produto',
        iva: 14,
        aplica_retencao: false,
        valor_retencao: 0,
        total: 0,
      }
    ]);
  };

  const removeItem = (index: number) => {
    if (itens.length > 1) {
      setItens(itens.filter((_, i) => i !== index));
    }
  };

  const calculateTotals = () => {
    const linhas = itens.map((item) => {
      const subtotal = item.quantidade * item.preco_unitario;
      return calcularFiscal(subtotal, item.iva, item.aplica_retencao);
    });
    const somatorio = somarFiscal(linhas);

    return {
      subtotal: somatorio.valor_bruto,
      iva_total: somatorio.valor_iva,
      retencao_total: somatorio.valor_retencao,
      // "total" mantém o significado já existente (valor da factura: bruto + IVA,
      // o que consta do documento). "valor_final" é o que se paga efectivamente
      // (bruto menos IVA cativo e/ou retenção - já calculado por item em
      // calcularFiscal/somarFiscal, não recalculado aqui para não desalinhar).
      total: somatorio.valor_bruto + somatorio.valor_iva,
      valor_final: somatorio.valor_final,
    };
  };

  // Guarda uma conta bancária no próprio registo do Fornecedor (não na
  // factura) - fica disponível para esta e para futuras facturas do mesmo
  // fornecedor, tal como o PUT /procurement/fornecedores/:id já suporta.
  const handleSalvarContaBancaria = async () => {
    if (!formData.fornecedor_id || !accessToken) return;
    if (!novaContaBancaria.banco_iban.trim() && !novaContaBancaria.banco_nib.trim()) {
      toast.error('Indique o IBAN ou o NIB da conta.');
      return;
    }
    const erroConta = validarIban(novaContaBancaria.banco_iban) || validarNib(novaContaBancaria.banco_nib);
    if (erroConta) {
      toast.error(erroConta);
      return;
    }
    setSavingContaBancaria(true);
    try {
      // Rota propria das coordenadas bancarias: so altera esses campos e
      // permite a quem regista facturas em nome do fornecedor (ex: DSG
      // Tecnico) preenche-las quando o fornecedor ainda nao tem nenhuma.
      const response = await fetch(`${API_BASE_URL}/procurement/fornecedores/${formData.fornecedor_id}/dados-bancarios`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(novaContaBancaria),
      });
      if (!response.ok) {
        const corpo = await response.json().catch(() => ({}));
        throw new Error(corpo.message || 'Erro ao guardar a conta bancária');
      }
      await recarregarDadosBancarios();
      setAddContaBancariaOpen(false);
      setNovaContaBancaria({ banco_nome: '', banco_titular: '', banco_iban: '', banco_nib: '', banco_swift: '', banco_cidade: '', banco_pais: 'Angola' });
      toast.success('Conta bancária guardada.');
    } catch (err) {
 console.error('Erro ao guardar conta bancária do fornecedor:', err);
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar a conta bancária do fornecedor.');
    } finally {
      setSavingContaBancaria(false);
    }
  };

  const handleSave = () => {
    // Fornecedor da lista já cadastrada, ou um "ad-hoc" (nome + NIF digitados
    // à mão, ainda sem registo de Fornecedor na plataforma).
    const fornecedorSelecionado = fornecedorNaoListado
      ? (nomeAdHoc.trim() ? { nome: nomeAdHoc.trim(), nif: nifAdHoc.trim() } : null)
      : fornecedores.find((f) => f.id === formData.fornecedor_id);
    if (!fornecedorSelecionado) {
      toast.error(fornecedorNaoListado ? 'Indique o nome do fornecedor.' : 'Selecione um fornecedor antes de gravar a factura.');
      return;
    }
    // Sem dados bancários não há para onde emitir o pagamento - bloqueia
    // aqui em vez de deixar a Ordem de Pagamento ficar incompleta mais tarde.
    if (!fornecedorNaoListado && !dadosBancariosFornecedor) {
      toast.error('Este fornecedor ainda não tem dados bancários guardados. Adicione-os antes de gravar a factura.');
      return;
    }
    if (itens.some((item) => !item.descricao || item.quantidade <= 0 || item.preco_unitario <= 0)) {
      toast.error('Preencha correctamente todos os itens da factura.');
      return;
    }
    if (!formData.tipo) {
      toast.error('Seleccione o tipo da factura (Mercadoria, Serviço ou Ambos).');
      return;
    }

    const totals = calculateTotals();

 console.log('=== DEBUG FACTURA SAVE ===');
 console.log(' Estado atual dos ficheiros:', files);
 console.log(' Número de ficheiros:', files.length);
 console.log(' Upload em curso?', uploading);
    
    // Criar array de anexos corretamente
    const anexos = files.length > 0
      ? files.map(f => {
          const original = anexosOriginais.find((a) => a?.id === f.id);
          if (original) return original; // anexo ja existente: mantem-se como estava
 console.log(' Processando ficheiro:', { id: f.id, nome: f.name, url: f.url, tamanho: f.size });
          return {
            id: f.id,
            nome: f.name,
            url: f.url,
            tamanho: f.size,
            tipo: f.tipo,
            uploaded_at: new Date().toISOString(),
          };
        })
      : [];
    
 console.log(' Array final de anexos a enviar:', anexos);
 console.log('=== FIM DEBUG ===');
    
    onSave({
      ...formData,
      // Reafirma o tipo (ja validado como nao-vazio acima) - o spread de
      // "formData" sozinho manteria o tipo largo "" | FacturaTipo do estado.
      tipo: formData.tipo as FacturaTipo,
      // "fornecedor"/"valor" sao os campos que o servidor exige para criar a
      // factura (ver server/src/services/validation.service.ts) - sem eles a
      // gravacao falhava sempre com "Campo obrigatorio ausente".
      fornecedor: fornecedorSelecionado.nome,
      fornecedor_nome: fornecedorSelecionado.nome,
      // Fornecedor ad-hoc (não cadastrado): fica sem fornecedor_id (não há
      // registo de Fornecedor), mas o NIF digitado/confirmado na AGT fica
      // guardado na factura.
      fornecedor_id: fornecedorNaoListado ? undefined : formData.fornecedor_id,
      nif: fornecedorSelecionado.nif || undefined,
      // Dados devolvidos pela AGT para o fornecedor ad-hoc (tipo, estado,
      // inadimplente, regime de IVA, residencia) - ficam registados na factura.
      ...(fornecedorNaoListado && dadosAgtAdHoc && dadosAgtAdHoc.nif === nifAdHoc ? { fornecedor_agt: dadosAgtAdHoc } : {}),
      valor: totals.total,
      itens,
      subtotal: totals.subtotal,
      iva_total: totals.iva_total,
      retencao_total: totals.retencao_total,
      total: totals.total,
      valor_final: totals.valor_final,
      anexos: anexos,
      status: 'pendente', // Status correto do sistema
      // Registo automatico: modo usado e o que o utilizador corrigiu (Auditoria).
      ...(!factura ? { modo_registo: modoRegisto } : {}),
      ...(extraccao && preenchidoPelaExtraccao ? {
        extraccao: {
          motor: extraccao.resposta.motor,
          ficheiro: extraccao.resposta.anexo?.nome,
          documento: extraccao.resposta.documentos[extraccao.indice]?.campos.numero_fornecedor,
          campos_corrigidos: Object.keys(preenchidoPelaExtraccao).filter((k) => preenchidoPelaExtraccao[k] !== valorParaComparar(k)),
        },
      } : {}),
      // Fornecedor fora da lista: as coordenadas bancarias lidas do documento vao na factura.
      ...(fornecedorNaoListado && bancoExtraido ? {
        banco_nome: bancoExtraido.banco_nome || undefined,
        banco_titular: bancoExtraido.banco_titular || undefined,
        banco_iban: bancoExtraido.banco_iban || undefined,
        banco_nib: bancoExtraido.banco_nib || undefined,
        banco_swift: bancoExtraido.banco_swift || undefined,
      } : {}),
    } as Partial<Factura>);
  };

  // ------------------------------------------------ registo automatico (PDF)

  const valorParaComparar = (campo: string): string => {
    if (campo === 'itens') return JSON.stringify(itens.map((i) => [i.descricao, i.quantidade, i.preco_unitario, i.iva]));
    if (campo === 'fornecedor') return fornecedorNaoListado ? `${nifAdHoc}|${nomeAdHoc}` : formData.fornecedor_id;
    return String((formData as any)[campo] ?? '');
  };

  /** Preenche o formulario com um dos documentos extraidos (nada e gravado). */
  const aplicarDocumento = (resposta: RespostaExtraccao, indice: number) => {
    const doc = resposta.documentos[indice];
    if (!doc) return;
    const c = doc.campos;
    // Fornecedor: o cadastrado com o mesmo NIF, senao "fora da lista" com NIF + nome (da AGT, se encontrado).
    const cadastrado = resposta.fornecedor && fornecedores.find((f) => f.id === resposta.fornecedor!.id)
      || fornecedores.find((f) => c.fornecedor_nif && (f.nif || '').replace(/\s/g, '') === c.fornecedor_nif);
    const novoForm = {
      ...formData,
      fornecedor_id: cadastrado ? cadastrado.id : '',
      numero_fornecedor: c.numero_fornecedor || formData.numero_fornecedor,
      tipo: (c.tipo || formData.tipo) as FacturaTipo | '',
      tipo_documento: c.tipo_documento === 'factura_proforma' ? 'factura_proforma' as const : 'factura' as const,
      data_emissao: c.data_emissao || formData.data_emissao,
      data_vencimento: c.data_vencimento || c.data_emissao || formData.data_vencimento,
      moeda: c.moeda || formData.moeda,
      condicoes_pagamento: c.condicoes_pagamento || formData.condicoes_pagamento,
      descricao: c.descricao || formData.descricao,
    };
    setFormData(novoForm);
    let nifNovo = nifAdHoc, nomeNovo = nomeAdHoc;
    if (cadastrado) {
      setFornecedorNaoListado(false);
    } else {
      setFornecedorNaoListado(true);
      nifNovo = c.fornecedor_nif;
      nomeNovo = (resposta.agt?.encontrado && resposta.agt.dados?.nome) || c.fornecedor_nome;
      setNifAdHoc(nifNovo);
      setNomeAdHoc(nomeNovo);
      setDadosAgtAdHoc(resposta.agt?.encontrado ? resposta.agt.dados : null);
    }
    const servico = c.tipo === 'servico';
    const novosItens: ItemFactura[] = doc.itens.length
      ? doc.itens.map((i, n) => {
          const fiscal = calcularFiscal(i.quantidade * i.preco_unitario, i.iva, false);
          return {
            id: `${Date.now()}-${n}`,
            descricao: i.descricao,
            quantidade: i.quantidade,
            preco_unitario: i.preco_unitario,
            tipo_operacao: servico ? 'servico' : 'produto',
            iva: fiscal.taxa_iva,
            aplica_retencao: false,
            valor_retencao: fiscal.valor_retencao,
            total: fiscal.valor_final,
          } as ItemFactura;
        })
      : itens;
    setItens(novosItens);
    setBancoExtraido(doc.banco);
    // Fornecedor cadastrado sem conta: propoe a conta lida do documento (o utilizador confirma em "Guardar conta").
    if (cadastrado && (doc.banco.banco_iban || doc.banco.banco_nib)) {
      setNovaContaBancaria((atual) => ({
        ...atual,
        banco_nome: doc.banco.banco_nome || atual.banco_nome,
        banco_titular: doc.banco.banco_titular || atual.banco_titular,
        banco_iban: doc.banco.banco_iban ? formatarIban(doc.banco.banco_iban) : atual.banco_iban,
        banco_nib: doc.banco.banco_nib ? formatarNib(doc.banco.banco_nib) : atual.banco_nib,
        banco_swift: doc.banco.banco_swift || atual.banco_swift,
      }));
    }
    setPreenchidoPelaExtraccao({
      numero_fornecedor: novoForm.numero_fornecedor, tipo: String(novoForm.tipo), tipo_documento: novoForm.tipo_documento,
      data_emissao: novoForm.data_emissao, data_vencimento: novoForm.data_vencimento, moeda: novoForm.moeda,
      condicoes_pagamento: novoForm.condicoes_pagamento, descricao: novoForm.descricao,
      itens: JSON.stringify(novosItens.map((i) => [i.descricao, i.quantidade, i.preco_unitario, i.iva])),
      fornecedor: cadastrado ? cadastrado.id : `${nifNovo}|${nomeNovo}`,
    });
  };

  const aoExtrair = (resposta: RespostaExtraccao, ficheiro: File) => {
    // O PDF fica anexado (substitui o de uma leitura anterior).
    const anteriorId = extraccao?.resposta.anexo?.id;
    setInitialFiles([
      ...files.filter((f) => f.id !== anteriorId),
      { id: resposta.anexo.id, name: resposta.anexo.nome, size: resposta.anexo.tamanho, url: resposta.anexo.url, tipo: resposta.anexo.tipo },
    ]);
    if (extraccao?.pdfUrl) URL.revokeObjectURL(extraccao.pdfUrl);
    const indice = resposta.principal >= 0 ? resposta.principal : 0;
    setExtraccao({ resposta, indice, ficheiro, pdfUrl: URL.createObjectURL(ficheiro) });
    setEstadoExtraccao(resposta.estado);
    if (resposta.documentos.length) {
      aplicarDocumento(resposta, indice);
      toast.success('Dados lidos do documento. Reveja antes de registar.');
    } else {
      toast.warning('Não foi possível ler os dados - preencha manualmente. O PDF ficou anexado.');
    }
  };

  const tentarComIa = async () => {
    if (!extraccao) return;
    setATentarIa(true);
    try {
      aoExtrair(await extrairFicheiro(accessToken, extraccao.ficheiro, 'ia'), extraccao.ficheiro);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'A leitura com IA falhou.');
    } finally {
      setATentarIa(false);
    }
  };

  // Modo usado (Auditoria): PDF lido, fornecedor pesquisado na AGT pelo NIF, ou manual.
  const modoRegisto: ModoRegisto = extraccao ? 'automatico' : fornecedorNaoListado ? 'agt' : 'manual';

  useEffect(() => () => { if (extraccao?.pdfUrl) URL.revokeObjectURL(extraccao.pdfUrl); }, [extraccao?.pdfUrl]);

  /** Destaque nos campos lidos com pouca certeza (ou obrigatorios em falta) apos a extraccao. */
  const destaque = (campo: string, vazio = false): string => {
    if (!extraccao || !extraccao.resposta.documentos.length) return '';
    const conf = extraccao.resposta.documentos[extraccao.indice]?.confianca?.[campo];
    return vazio || conf === 'baixa' || conf === 'media' ? 'ring-2 ring-amber-400 ring-offset-1' : '';
  };

  const handleUpload = async (fileList: FileList) => {
    try {
      await uploadFiles(fileList);
    } catch (err) {
 console.error('Erro ao fazer upload:', err);
    }
  };

  const handleRemove = async (fileId: string) => {
    // Anexo ja gravado na factura: sai so da lista (o ficheiro nao e apagado
    // do servidor - se a edicao for cancelada, a factura continua com ele).
    if (anexosOriginais.some((a) => a?.id === fileId)) {
      setInitialFiles(files.filter((f) => f.id !== fileId));
      return;
    }
    try {
      await removeFile(fileId);
    } catch (err) {
 console.error('Erro ao remover ficheiro:', err);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: formData.moeda,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            {factura ? 'Editar Factura' : 'Nova Factura'}
          </h1>
          <p className="text-muted-foreground">
            {factura ? `Factura ${factura.numero}` : 'Registar nova factura de fornecedor'}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>

      {/* Com um PDF lido: o documento ao lado do formulario, para comparar. */}
      <div className={extraccao ? 'grid gap-6 xl:grid-cols-2 items-start' : ''}>
        {extraccao && (
          <div className="xl:sticky xl:top-4 rounded-lg border overflow-hidden bg-white h-[70vh] xl:h-[calc(100vh-2rem)]">
            {extraccao.ficheiro.type === 'application/pdf' ? (
              <iframe src={extraccao.pdfUrl} title="Documento lido" className="w-full h-full border-0" />
            ) : (
              <img src={extraccao.pdfUrl} alt="Documento lido" className="w-full h-full object-contain" />
            )}
          </div>
        )}
        <div className="space-y-6 min-w-0">

      {/* Informações do Fornecedor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Informações do Fornecedor</CardTitle>
          {!factura && (
            <BotaoLeituraPdf aberto={leituraPdfAberta} onClick={() => setLeituraPdfAberta((v) => !v)} estado={estadoExtraccao} />
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {!factura && leituraPdfAberta && (
            extraccao ? (
              <div className="space-y-2">
                <PainelRevisaoExtraccao
                  resposta={extraccao.resposta}
                  indice={extraccao.indice}
                  onEscolherDocumento={(i) => { setExtraccao({ ...extraccao, indice: i }); aplicarDocumento(extraccao.resposta, i); }}
                  onTentarComIa={extraccao.resposta.motor !== 'ia' && extraccao.resposta.estado?.ia ? tentarComIa : undefined}
                  aTentarIa={aTentarIa}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setExtraccao(null)}>
                  Ler outro documento
                </Button>
              </div>
            ) : (
              <ZonaPdf onExtraido={aoExtrair} estado={estadoExtraccao} />
            )
          )}
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => {
              setFornecedorNaoListado((v) => !v);
              handleChange('fornecedor_id', '');
              setNifAdHoc('');
              setNomeAdHoc('');
            }}
          >
            {fornecedorNaoListado ? '← Escolher da lista de fornecedores cadastrados' : 'O fornecedor não está na lista? Registar pelo NIF →'}
          </button>

          <div className="grid gap-4 md:grid-cols-2">
            {fornecedorNaoListado ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="nif_adhoc">NIF do Fornecedor *</Label>
                  <NifLookupField
                    id="nif_adhoc"
                    value={nifAdHoc}
                    onChange={setNifAdHoc}
                    onEncontrado={(dados) => {
                      setNifAdHoc(dados.nif);
                      setNomeAdHoc(dados.nome);
                      setDadosAgtAdHoc(dados);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nome_adhoc">Nome do Fornecedor *</Label>
                  <Input
                    id="nome_adhoc"
                    placeholder="Preenchido automaticamente, ou digite manualmente"
                    value={nomeAdHoc}
                    onChange={(e) => setNomeAdHoc(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="fornecedor_id">Fornecedor *</Label>
                <select
                  id="fornecedor_id"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={formData.fornecedor_id}
                  onChange={(e) => handleChange('fornecedor_id', e.target.value)}
                >
                  <option value="">Selecione o fornecedor...</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.nome} - NIF: {f.nif}
                    </option>
                  ))}
                </select>
                <DadosAgtDoNif nif={fornecedores.find((f) => f.id === formData.fornecedor_id)?.nif} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="numero_fornecedor">Nº Factura Fornecedor *</Label>
              <Input
                id="numero_fornecedor"
                className={destaque('numero_fornecedor', !formData.numero_fornecedor)}
                placeholder="Ex: FT2026/001"
                value={formData.numero_fornecedor}
                onChange={(e) => handleChange('numero_fornecedor', e.target.value)}
              />
            </div>
          </div>

          {fornecedorNaoListado && bancoExtraido && (bancoExtraido.banco_iban || bancoExtraido.banco_nib) && (
            <div className={`p-3 rounded-lg border text-sm space-y-1 ${destaque('banco_iban')}`}>
              <p className="font-medium">Coordenadas bancárias lidas do documento</p>
              {bancoExtraido.banco_nome && <p><strong>Banco:</strong> {bancoExtraido.banco_nome}</p>}
              {bancoExtraido.banco_titular && <p><strong>Titular:</strong> {bancoExtraido.banco_titular}</p>}
              {bancoExtraido.banco_iban && <p><strong>IBAN:</strong> {formatarIban(bancoExtraido.banco_iban)}</p>}
              {bancoExtraido.banco_nib && <p><strong>NIB:</strong> {formatarNib(bancoExtraido.banco_nib)}</p>}
              <p className="text-xs text-muted-foreground">Ficam registadas na factura. Confirme-as com o documento ao lado.</p>
            </div>
          )}

          {fornecedorNaoListado && (
            <p className="text-xs text-muted-foreground">
              Este fornecedor será registado apenas nesta factura (nome + NIF). Para o cadastrar na plataforma e reutilizar em futuras compras, faça-o em Compras → Fornecedores.
            </p>
          )}

          {!fornecedorNaoListado && formData.fornecedor_id && (
            <div className="p-3 bg-accent rounded-lg space-y-3">
              {(() => {
                const fornecedor = fornecedores.find(f => f.id === formData.fornecedor_id);
                if (!fornecedor) return null;
                return (
                  <div className="grid gap-2 text-sm">
                    <p><strong>Email:</strong> {fornecedor.email}</p>
                    <p><strong>Telefone:</strong> {fornecedor.telefone}</p>
                    <p><strong>Morada:</strong> {fornecedor.morada}</p>
                  </div>
                );
              })()}

              <div className="pt-2 border-t border-border/60">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Dados Bancários do Fornecedor</p>
                  {!loadingDadosBancarios && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => setAddContaBancariaOpen((v) => !v)}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      {dadosBancariosFornecedor ? 'Nova conta' : 'Adicionar conta'}
                    </Button>
                  )}
                </div>
                {loadingDadosBancarios ? (
                  <p className="text-sm text-muted-foreground">A carregar...</p>
                ) : dadosBancariosFornecedor ? (
                  <div className="grid gap-1 text-sm">
                    {dadosBancariosFornecedor.banco_nome && <p><strong>Banco:</strong> {dadosBancariosFornecedor.banco_nome}</p>}
                    {dadosBancariosFornecedor.banco_titular && <p><strong>Titular:</strong> {dadosBancariosFornecedor.banco_titular}</p>}
                    {dadosBancariosFornecedor.banco_iban && <p><strong>IBAN:</strong> {dadosBancariosFornecedor.banco_iban}</p>}
                    {dadosBancariosFornecedor.banco_nib && <p><strong>NIB:</strong> {dadosBancariosFornecedor.banco_nib}</p>}
                    {dadosBancariosFornecedor.banco_swift && <p><strong>SWIFT:</strong> {dadosBancariosFornecedor.banco_swift}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-destructive">Este fornecedor ainda não tem dados bancários guardados. Não é possível gravar a factura sem isso.</p>
                )}
                {dadosBancariosFornecedor && bancoExtraido?.banco_iban && dadosBancariosFornecedor.banco_iban
                  && dadosBancariosFornecedor.banco_iban.replace(/\s/g, '') !== bancoExtraido.banco_iban && (
                  <p className="text-xs mt-1" style={{ color: 'var(--tone-warn)' }}>
                    O IBAN do documento ({formatarIban(bancoExtraido.banco_iban)}) é diferente do guardado para este fornecedor. Confirme antes de registar.
                  </p>
                )}
                {!dadosBancariosFornecedor && bancoExtraido && (bancoExtraido.banco_iban || bancoExtraido.banco_nib) && !addContaBancariaOpen && (
                  <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => setAddContaBancariaOpen(true)}>
                    Usar a conta lida do documento
                  </Button>
                )}

                {addContaBancariaOpen && (
                  <div className="mt-3 p-3 border rounded-lg bg-background space-y-2">
                    <div className="grid gap-2 md:grid-cols-2">
                      <Input placeholder="Banco" value={novaContaBancaria.banco_nome} onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, banco_nome: e.target.value })} />
                      <Input placeholder="Titular da conta" value={novaContaBancaria.banco_titular} onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, banco_titular: e.target.value })} />
                      <div className="space-y-1">
                        <Input
                          placeholder="IBAN — AO06 0055 0000 2159 9539 1019 3"
                          value={novaContaBancaria.banco_iban}
                          maxLength={31}
                          aria-invalid={!!validarIban(novaContaBancaria.banco_iban)}
                          onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, banco_iban: formatarIban(e.target.value) })}
                        />
                        {validarIban(novaContaBancaria.banco_iban) && (
                          <p className="text-xs text-destructive">{validarIban(novaContaBancaria.banco_iban)}</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Input
                          placeholder="NIB — 21 dígitos"
                          value={novaContaBancaria.banco_nib}
                          maxLength={26}
                          aria-invalid={!!validarNib(novaContaBancaria.banco_nib)}
                          onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, banco_nib: formatarNib(e.target.value) })}
                        />
                        {validarNib(novaContaBancaria.banco_nib) && (
                          <p className="text-xs text-destructive">{validarNib(novaContaBancaria.banco_nib)}</p>
                        )}
                      </div>
                      <Input placeholder="SWIFT/BIC" value={novaContaBancaria.banco_swift} onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, banco_swift: e.target.value })} />
                      <Input placeholder="Cidade" value={novaContaBancaria.banco_cidade} onChange={(e) => setNovaContaBancaria({ ...novaContaBancaria, banco_cidade: e.target.value })} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => setAddContaBancariaOpen(false)} disabled={savingContaBancaria}>
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSalvarContaBancaria}
                        disabled={savingContaBancaria || !!validarIban(novaContaBancaria.banco_iban) || !!validarNib(novaContaBancaria.banco_nib)}
                      >
                        {savingContaBancaria ? 'A guardar...' : 'Guardar conta'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tipo de Factura */}
      <Card>
        <CardHeader>
          <CardTitle>Tipo de Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <select
              id="tipo"
              className={`w-full px-3 py-2 border border-input rounded-md bg-background ${destaque('tipo', !formData.tipo)}`}
              value={formData.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              required
            >
              <option value="">Selecione o tipo...</option>
              <option value="mercadoria">Mercadoria</option>
              <option value="servico">Serviço</option>
              <option value="ambos">Ambos</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Selecione se a factura é de mercadoria, serviço ou ambos
            </p>
          </div>
          <div className="space-y-2 mt-4">
            <Label htmlFor="tipo_documento">Documento *</Label>
            <select
              id="tipo_documento"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={formData.tipo_documento}
              onChange={(e) => handleChange('tipo_documento', e.target.value)}
            >
              <option value="factura">Factura</option>
              <option value="factura_proforma">Factura Proforma</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Facturas proforma são aceites para efeitos de cotação/aprovação prévia (VFAP no Mapa de Actividades)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Datas e Condições */}
      <Card>
        <CardHeader>
          <CardTitle>Datas e Condições</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="data_emissao">Data de Emissão *</Label>
              <Input
                id="data_emissao"
                className={destaque('data_emissao', !formData.data_emissao)}
                type="date"
                value={formData.data_emissao}
                onChange={(e) => handleChange('data_emissao', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_vencimento">Data de Vencimento *</Label>
              <Input
                id="data_vencimento"
                className={destaque('data_vencimento', !formData.data_vencimento)}
                type="date"
                value={formData.data_vencimento}
                onChange={(e) => handleChange('data_vencimento', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_recebimento">Data de Recebimento *</Label>
              <Input
                id="data_recebimento"
                type="date"
                value={formData.data_recebimento}
                onChange={(e) => handleChange('data_recebimento', e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="moeda">Moeda *</Label>
              <select
                id="moeda"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.moeda}
                onChange={(e) => handleChange('moeda', e.target.value)}
              >
                <option value="AOA">Kwanza (AOA)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
              <Input
                id="condicoes_pagamento"
                placeholder="Ex: 30 dias"
                value={formData.condicoes_pagamento}
                onChange={(e) => handleChange('condicoes_pagamento', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Itens da Factura */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Itens da Factura</CardTitle>
            <Button size="sm" onClick={addItem}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {itens.map((item, index) => (
            <div key={item.id} className="p-4 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Item {index + 1}</span>
                {itens.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-6">
                <div className="md:col-span-2 space-y-2">
                  <Label>Descrição *</Label>
                  <Input
                    placeholder="Descrição do item"
                    value={item.descricao}
                    onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quantidade *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantidade}
                    onChange={(e) => handleItemChange(index, 'quantidade', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Preço Unit. *</Label>
                  <MoneyInput
                    value={item.preco_unitario}
                    onValueChange={(valor) => handleItemChange(index, 'preco_unitario', valor)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Produto ou Serviço *</Label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={item.tipo_operacao || 'produto'}
                    onChange={(e) => handleItemChange(index, 'tipo_operacao', e.target.value)}
                  >
                    <option value="produto">Produto</option>
                    <option value="servico">Serviço</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>IVA (%)</Label>
                  <select
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    value={item.iva}
                    onChange={(e) => handleItemChange(index, 'iva', parseFloat(e.target.value))}
                  >
                    {TAXAS_IVA_PRODUTOS.map((taxa) => (
                      <option key={taxa} value={taxa}>{taxa}%</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className={`flex items-center gap-2 px-3 py-2 border border-input rounded-md bg-background text-sm ${item.quantidade * item.preco_unitario <= LIMIAR_RETENCAO_SERVICOS ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                      type="checkbox"
                      checked={!!item.aplica_retencao}
                      disabled={item.quantidade * item.preco_unitario <= LIMIAR_RETENCAO_SERVICOS}
                      onChange={(e) => handleItemChange(index, 'aplica_retencao', e.target.checked)}
                    />
                    Retenção na fonte ({TAXA_RETENCAO_SERVICOS}%)
                  </label>
                  {item.quantidade * item.preco_unitario <= LIMIAR_RETENCAO_SERVICOS && (
                    <p className="text-xs text-muted-foreground">Sem retenção até {formatCurrency(LIMIAR_RETENCAO_SERVICOS)}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-4">
                {(item.valor_retencao || 0) > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Retenção: </span>
                    <span className="font-medium text-amber-600">-{formatCurrency(item.valor_retencao || 0)}</span>
                  </div>
                )}
                {item.iva > 0 && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">IVA Cativo: </span>
                    <span className="font-medium text-amber-600">
                      -{formatCurrency(item.quantidade * item.preco_unitario * (item.iva / 100))}
                    </span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">A Pagar: </span>
                  <span className="font-bold">{formatCurrency(item.total)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Totais */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Valor Bruto:</span>
              <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Valor IVA (Cativo):</span>
              <span className="font-medium">{formatCurrency(totals.iva_total)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Valor Retenção ({TAXA_RETENCAO_SERVICOS}%):</span>
              <span className="font-medium text-amber-600">-{formatCurrency(totals.retencao_total)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>Valor Final a Pagar:</span>
              <span className="text-primary">{formatCurrency(totals.valor_final)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Descrição e Observações */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Adicionais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição *</Label>
            <Input
              id="descricao"
              placeholder="Descrição geral da factura"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações ou notas adicionais..."
              rows={3}
              value={formData.observacoes}
              onChange={(e) => handleChange('observacoes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Anexos */}
      <Card>
        <CardHeader>
          <CardTitle>Anexos</CardTitle>
        </CardHeader>
        <CardContent>
          <FileUpload
            files={files}
            uploading={uploading}
            onUpload={handleUpload}
            onRemove={handleRemove}
            formatFileSize={formatFileSize}
            accept=".pdf,.jpg,.jpeg,.png"
          />
        </CardContent>
      </Card>

        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={uploading}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={uploading}>
          <Save className="mr-2 h-4 w-4" />
          {uploading ? 'Aguarde o upload...' : 'Registar Factura'}
        </Button>
      </div>
    </div>
  );
}