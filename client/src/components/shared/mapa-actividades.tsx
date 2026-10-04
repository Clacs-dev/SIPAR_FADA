/**
 * MAPA DE ACTIVIDADES (DSG)
 *
 * Reproduz, no ecra, o modelo oficial "Mapa_de_Actividades_FADA.xlsx" com as
 * mesmas folhas, colunas e textos - Resumo, Serviços Adquiridos, Bens
 * Adquiridos, Guia de Preenchimento e Listas - preenchido automaticamente a
 * partir das facturas do sistema (ver
 * server/src/services/mapa-actividades.service.ts). O botão "Descarregar
 * .xlsx" gera o ficheiro no servidor por cima do próprio modelo, por isso o
 * Excel descarregado é estruturalmente idêntico ao original.
 *
 * Usado no Procurement (Compras) e em Finanças (Gestão de Pagamento), e como
 * item próprio do menu.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { ChevronUp, ClipboardList, Download, Filter, Info, Loader2, Pencil, RotateCcw, X } from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "@/services/api";
import { useAuth } from "../auth/auth-context";
import { toast } from "sonner@2.0.3";
import { FADA_LOGO_DATA_URI } from "../../assets/fada-logo";

// ---------------------------------------------------------------------------
// Tipos (espelham server/src/services/mapa-actividades.service.ts)
// ---------------------------------------------------------------------------

type CampoEditavel =
  | 'categoria' | 'servico' | 'local_prestado' | 'objectivo'
  | 'classificacao' | 'nome_bem' | 'centro_custo' | 'localizacao_responsavel'
  | 'codigo_artigo' | 'fornecedor' | 'numero_documento' | 'tipo_documento' | 'observacoes';

interface LinhaBase {
  factura_id: string;
  item_key: string;
  factura_status: string;
  editado: CampoEditavel[];
  categoria: 'servico' | 'bem';
  valor: number;
  quantidade_facturas: number;
  data_documento: string;
  fornecedor: string;
  tipo_documento: string;
  numero_documento: string;
  codigo_artigo: string;
  estado_aprovacao: string;
  data_aprovacao: string;
  numero_np: string;
  data_pagamento: string;
  observacoes: string;
}
interface LinhaServico extends LinhaBase { servico: string; local_prestado: string; objectivo: string }
interface LinhaBem extends LinhaBase {
  classificacao: string; nome_bem: string; quantidade: number; centro_custo: string; localizacao_responsavel: string;
}
type Linha = LinhaServico | LinhaBem;

interface ResumoLinha {
  categoria: string;
  registos: number;
  quantidade_bens: number | null;
  valor: number;
  quantidade_facturas: number;
}

interface Mapa {
  ano: number;
  mes: number;
  identificacao: { direccao: string; periodo: string; elaborado_por: string; data_elaboracao: string; aprovado_por: string };
  servicos: LinhaServico[];
  bens: LinhaBem[];
  resumo: ResumoLinha[];
  total_geral: ResumoLinha;
  filtros: Record<string, string | number>;
  filtros_descricao: string[];
  opcoes: { fornecedores: string[]; centros_custo: string[] };
  total_sem_filtros: number;
}

interface Filtros {
  categoria: string;
  fornecedor: string;
  centro_custo: string;
  estado_aprovacao: string;
  tipo_documento: string;
  pagamento: string;
  data_inicio: string;
  data_fim: string;
  valor_min: string;
  valor_max: string;
  pesquisa: string;
}
const FILTROS_VAZIOS: Filtros = {
  categoria: '', fornecedor: '', centro_custo: '', estado_aprovacao: '', tipo_documento: '',
  pagamento: '', data_inicio: '', data_fim: '', valor_min: '', valor_max: '', pesquisa: '',
};

// ---------------------------------------------------------------------------
// Estrutura do modelo (linhas 5, 6 e 7 de cada folha, textualmente)
// ---------------------------------------------------------------------------

type Formato = 'texto' | 'valor' | 'inteiro';
interface Coluna<T> {
  titulo: string;      // linha 5
  descricao: string;   // linha 6
  exemplo: string | number; // linha 7
  campo: (l: T) => string | number;
  formato?: Formato;
  /** Grupo do cabeçalho da linha 3: campos do modelo vs sugeridos (opcionais). */
  modelo?: boolean;
  total?: (linhas: T[]) => number;
}

const COLUNAS_SERVICOS: Coluna<LinhaServico>[] = [
  { titulo: 'Serviço', descricao: 'Descrição do serviço adquirido', exemplo: 'Manutenção de equipamentos informáticos', campo: (l) => l.servico, modelo: true },
  { titulo: 'Local prestado', descricao: 'Local onde o serviço foi prestado', exemplo: 'Sede do FADA, Luanda', campo: (l) => l.local_prestado, modelo: true },
  { titulo: 'Objectivo/Motivo do Serviço', descricao: 'Finalidade ou razão da contratação', exemplo: 'Garantir a operacionalidade dos postos de trabalho', campo: (l) => l.objectivo, modelo: true },
  { titulo: 'Valor', descricao: 'Valor total em Kwanzas (Kz)', exemplo: 350000, campo: (l) => l.valor, formato: 'valor', modelo: true, total: (ls) => ls.reduce((a, l) => a + l.valor, 0) },
  { titulo: 'Quantidade de facturas de serviços', descricao: 'N.º de facturas do serviço', exemplo: 1, campo: (l) => l.quantidade_facturas, formato: 'inteiro', modelo: true, total: (ls) => ls.reduce((a, l) => a + l.quantidade_facturas, 0) },
  { titulo: 'Data do documento', descricao: 'Data da factura (dd/mm/aaaa)', exemplo: '15/09/2026', campo: (l) => l.data_documento },
  { titulo: 'Fornecedor', descricao: 'Código/nome do fornecedor no Primavera', exemplo: 'Informática & Serviços, Lda', campo: (l) => l.fornecedor },
  { titulo: 'Tipo de documento', descricao: 'VFAP ou VFA', exemplo: 'VFA — Factura', campo: (l) => l.tipo_documento },
  { titulo: 'N.º do documento', descricao: 'N.º do documento no Primavera', exemplo: 'VFA 2026/0112', campo: (l) => l.numero_documento },
  { titulo: 'Código do artigo', descricao: 'Código do artigo (ex.: DSG0001)', exemplo: 'DSG0001', campo: (l) => l.codigo_artigo },
  { titulo: 'Estado da aprovação', descricao: 'Estado do documento APR', exemplo: 'Aprovado', campo: (l) => l.estado_aprovacao },
  { titulo: 'Data da aprovação', descricao: 'Data da aprovação (dd/mm/aaaa)', exemplo: '16/09/2026', campo: (l) => l.data_aprovacao },
  { titulo: 'N.º da Nota de Pagamento (NP)', descricao: 'N.º da NP gerada pela DFI', exemplo: 'NP 2026/0045', campo: (l) => l.numero_np },
  { titulo: 'Data do pagamento', descricao: 'Data do pagamento (dd/mm/aaaa)', exemplo: '18/09/2026', campo: (l) => l.data_pagamento },
  { titulo: 'Observações', descricao: 'Informação adicional', exemplo: 'Exemplo de preenchimento', campo: (l) => l.observacoes },
];

const COLUNAS_BENS: Coluna<LinhaBem>[] = [
  { titulo: 'Bens/Imobilizados', descricao: 'Seleccionar: Bem ou Imobilizado', exemplo: 'Bem', campo: (l) => l.classificacao, modelo: true },
  { titulo: 'Nome do bem ou imobilizado', descricao: 'Designação do bem ou imobilizado', exemplo: 'Papel A4 (resma)', campo: (l) => l.nome_bem, modelo: true },
  { titulo: 'Quantidade dos bens adquirido', descricao: 'N.º de unidades adquiridas', exemplo: 50, campo: (l) => l.quantidade, formato: 'inteiro', modelo: true, total: (ls) => ls.reduce((a, l) => a + l.quantidade, 0) },
  { titulo: 'Centro de Custo', descricao: 'Centro de custo imputado', exemplo: 'Direcção de Serviços Gerais', campo: (l) => l.centro_custo, modelo: true },
  { titulo: 'Valor', descricao: 'Valor total em Kwanzas (Kz)', exemplo: 425000, campo: (l) => l.valor, formato: 'valor', modelo: true, total: (ls) => ls.reduce((a, l) => a + l.valor, 0) },
  { titulo: 'Quantidade de facturas de bens/imobilizados', descricao: 'N.º de facturas dos bens', exemplo: 1, campo: (l) => l.quantidade_facturas, formato: 'inteiro', modelo: true, total: (ls) => ls.reduce((a, l) => a + l.quantidade_facturas, 0) },
  { titulo: 'Data do documento', descricao: 'Data da factura (dd/mm/aaaa)', exemplo: '15/09/2026', campo: (l) => l.data_documento },
  { titulo: 'Fornecedor', descricao: 'Código/nome do fornecedor no Primavera', exemplo: 'Papelaria Central, Lda', campo: (l) => l.fornecedor },
  { titulo: 'Tipo de documento', descricao: 'VFAP ou VFA', exemplo: 'VFA — Factura', campo: (l) => l.tipo_documento },
  { titulo: 'N.º do documento', descricao: 'N.º do documento no Primavera', exemplo: 'VFA 2026/0113', campo: (l) => l.numero_documento },
  { titulo: 'Código do artigo', descricao: 'Código do artigo (ex.: DSG0001)', exemplo: 'DSG0002', campo: (l) => l.codigo_artigo },
  { titulo: 'Estado da aprovação', descricao: 'Estado do documento APR', exemplo: 'Aprovado', campo: (l) => l.estado_aprovacao },
  { titulo: 'Data da aprovação', descricao: 'Data da aprovação (dd/mm/aaaa)', exemplo: '16/09/2026', campo: (l) => l.data_aprovacao },
  { titulo: 'N.º da Nota de Pagamento (NP)', descricao: 'N.º da NP gerada pela DFI', exemplo: 'NP 2026/0046', campo: (l) => l.numero_np },
  { titulo: 'Data do pagamento', descricao: 'Data do pagamento (dd/mm/aaaa)', exemplo: '18/09/2026', campo: (l) => l.data_pagamento },
  { titulo: 'Localização / Responsável pelo bem', descricao: 'Onde está afecto e quem responde', exemplo: 'Armazém da DSG', campo: (l) => l.localizacao_responsavel },
  { titulo: 'Observações', descricao: 'Informação adicional', exemplo: 'Exemplo de preenchimento', campo: (l) => l.observacoes },
];

// Folha "Guia de Preenchimento" (A3:E25 do modelo).
const GUIA: [string, string, string, string, string][] = [
  ['Serviços Adquiridos', 'Serviço', 'Modelo', 'Descrição do serviço adquirido.', 'Descrição do artigo/documento — Compras → Compras → Documentos (2.3.4 e 2.3.5).'],
  ['Serviços Adquiridos', 'Local prestado', 'Modelo', 'Local onde o serviço foi efectivamente prestado.', 'Descrições adicionais do processo (2.3.5).'],
  ['Serviços Adquiridos', 'Objectivo/Motivo do Serviço', 'Modelo', 'Finalidade ou razão que justifica a contratação.', 'Dossiê do processo anexado no Editor de Compras (2.3.7).'],
  ['Serviços Adquiridos', 'Valor', 'Modelo', 'Valor total do serviço, em Kwanzas.', 'Preço e quantidades do documento VFAP/VFA (2.3.6).'],
  ['Serviços Adquiridos', 'Quantidade de facturas de serviços', 'Modelo', 'N.º de facturas (VFA) relativas ao serviço.', 'Documentos registados em Compras → Compras → Documentos (2.3).'],
  ['Bens Adquiridos', 'Bens/Imobilizados', 'Modelo', 'Seleccionar «Bem» ou «Imobilizado» na lista.', 'Classificação do artigo — Marketing e Vendas → Inventários → Artigos (2.1).'],
  ['Bens Adquiridos', 'Nome do bem ou imobilizado', 'Modelo', 'Designação do bem ou imobilizado.', 'Artigo registado no sistema (2.1 e 2.3.4).'],
  ['Bens Adquiridos', 'Quantidade dos bens adquirido', 'Modelo', 'N.º de unidades adquiridas.', 'Quantidades do documento VFAP/VFA (2.3.6).'],
  ['Bens Adquiridos', 'Centro de Custo', 'Modelo', 'Centro de custo a que o bem é imputado.', 'Descrições adicionais do processo (2.3.5).'],
  ['Bens Adquiridos', 'Valor', 'Modelo', 'Valor total, em Kwanzas.', 'Preço e quantidades do documento (2.3.6).'],
  ['Bens Adquiridos', 'Quantidade de facturas de bens/imobilizados', 'Modelo', 'N.º de facturas (VFA) dos bens e imobilizados.', 'Documentos registados em Compras (2.3).'],
  ['Ambas', 'Data do documento', 'Sugerido', 'Data da factura do fornecedor.', 'Documento VFAP/VFA (2.3).'],
  ['Ambas', 'Fornecedor', 'Sugerido', 'Código e nome do fornecedor.', 'Compras → Compras → Documentos, campo Fornecedor (2.2 e 2.3.3).'],
  ['Ambas', 'Tipo de documento', 'Sugerido', 'VFAP — Factura Provisória ou VFA — Factura.', 'Escolha do tipo de documento (2.3.2). A VFAP é substituída pela factura final, com VNC (Nota de Crédito) da VFAP inicial.'],
  ['Ambas', 'N.º do documento', 'Sugerido', 'Número do documento no Primavera, para rastreabilidade.', 'Compras → Compras → Documentos (2.3).'],
  ['Ambas', 'Código do artigo', 'Sugerido', 'Código do artigo, seguindo a codificação da DSG (ex.: DSG0001).', 'Marketing e Vendas → Inventários → Artigos (2.1).'],
  ['Ambas', 'Estado da aprovação', 'Sugerido', 'Pendente ou Aprovado pelo responsável da DSG.', 'Documento APR — Compras → Pagamentos e Recebimentos → Operações (2.4).'],
  ['Ambas', 'Data da aprovação', 'Sugerido', 'Data em que o responsável da DSG aprovou o documento.', 'Aprovação dos documentos VFAP/VFA (2.4.5).'],
  ['Ambas', 'N.º da Nota de Pagamento (NP)', 'Sugerido', 'Número da NP gerada pela DFI após o pagamento.', 'Geração da Nota de Pagamento (3.1).'],
  ['Ambas', 'Data do pagamento', 'Sugerido', 'Data em que o pagamento foi efectuado.', 'Data do pagamento na NP (3.1.5).'],
  ['Bens Adquiridos', 'Localização / Responsável pelo bem', 'Sugerido', 'Onde o bem está afecto e quem responde por ele (útil para imobilizados).', 'Controlo interno; não consta do manual.'],
  ['Ambas', 'Observações', 'Sugerido', 'Informação adicional relevante.', '—'],
];

// Folha "Listas" do modelo.
const LISTAS = {
  bens: ['Bem', 'Imobilizado'],
  tipos: ['VFAP — Factura Provisória', 'VFA — Factura'],
  estados: ['Pendente', 'Aprovado'],
};

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Cores do modelo (cabeçalhos azul-escuro, resumo verde, células amarelas a preencher).
const COR_CABECALHO = '#1F3864';
const COR_RESUMO = '#548235';
const COR_DESCRICAO = '#DCE6F2';
const COR_EXEMPLO = '#F2F2F2';
const COR_PREENCHER = '#FFF2CC';

const fmtValor = (v: number) => new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
const fmtInteiro = (v: number) => new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(v || 0);

function formatar(valor: string | number, formato?: Formato) {
  if (formato === 'valor') return fmtValor(Number(valor));
  if (formato === 'inteiro') return fmtInteiro(Number(valor));
  return valor === '' || valor === null || valor === undefined ? '' : String(valor);
}

// ---------------------------------------------------------------------------

interface MapaActividadesProps {
  /** Só altera o texto do cabeçalho - os dados são sempre os mesmos. */
  contexto?: 'compras' | 'financeiro';
}

export function MapaActividades({ contexto }: MapaActividadesProps) {
  const { user } = useAuth();
  const hoje = new Date();
  const [ano, setAno] = useState(hoje.getFullYear());
  const [mes, setMes] = useState(hoje.getMonth() + 1); // 0 = ano inteiro
  const [direccao, setDireccao] = useState('DSG — Direcção de Serviços Gerais');
  const [elaboradoPor, setElaboradoPor] = useState(user?.name || '');
  const [aprovadoPor, setAprovadoPor] = useState('');

  // Filtros: aplicados no servidor (o ecrã e o .xlsx mostram as mesmas
  // linhas) e registados na Auditoria. Os campos só disparam o pedido depois
  // de o utilizador parar de escrever, para não encher a auditoria com uma
  // entrada por tecla.
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);
  const [filtrosAplicados, setFiltrosAplicados] = useState<Filtros>(FILTROS_VAZIOS);
  useEffect(() => {
    const t = setTimeout(() => setFiltrosAplicados(filtros), 600);
    return () => clearTimeout(t);
  }, [filtros]);
  const setFiltro = (campo: keyof Filtros, valor: string) => setFiltros((f) => ({ ...f, [campo]: valor }));
  const nFiltrosActivos = Object.values(filtros).filter(Boolean).length;
  // Painel de filtros recolhido por omissao: abre/fecha no icone de filtro.
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [mapa, setMapa] = useState<Mapa | null>(null);
  const [podeEditar, setPodeEditar] = useState(false);
  const [podeExportar, setPodeExportar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [aDescarregar, setADescarregar] = useState(false);
  const [folha, setFolha] = useState('resumo');
  const [emEdicao, setEmEdicao] = useState<Linha | null>(null);

  const paramsDados = useMemo(() => {
    const params = new URLSearchParams({ ano: String(ano), mes: String(mes) });
    for (const [k, v] of Object.entries(filtrosAplicados)) {
      if (v && String(v).trim()) params.set(k, String(v).trim());
    }
    return params.toString();
  }, [ano, mes, filtrosAplicados]);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/mapa-actividades?${paramsDados}`, { headers: getAuthHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Erro ao carregar o Mapa de Actividades');
      setMapa(body.mapa);
      setPodeEditar(!!body.pode_editar);
      setPodeExportar(!!body.pode_exportar);
    } catch (error: any) {
      console.error('Erro ao carregar o Mapa de Actividades:', error);
      toast.error(error?.message || 'Erro ao carregar o Mapa de Actividades');
      setMapa(null);
    } finally {
      setLoading(false);
    }
  }, [paramsDados]);

  useEffect(() => { carregar(); }, [carregar]);

  const descarregar = async () => {
    setADescarregar(true);
    try {
      // Exactamente os mesmos filtros que estão aplicados no ecrã.
      const params = new URLSearchParams(paramsDados);
      if (direccao.trim()) params.set('direccao', direccao.trim());
      if (elaboradoPor.trim()) params.set('elaborado_por', elaboradoPor.trim());
      if (aprovadoPor.trim()) params.set('aprovado_por', aprovadoPor.trim());
      const res = await fetch(`${API_BASE_URL}/mapa-actividades/export?${params}`, { headers: getAuthHeaders(false) });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message || 'Erro ao gerar o ficheiro');
      }
      const blob = await res.blob();
      const nomeServidor = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1];
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // O browser só expõe o Content-Disposition se o CORS o permitir; senão usa-se o mesmo padrão de nome do servidor.
      a.download = nomeServidor
        || `Mapa_de_Actividades_FADA_${ano}${mes ? `-${String(mes).padStart(2, '0')}` : ''}${mapa?.filtros_descricao.length ? '_filtrado' : ''}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Mapa de Actividades descarregado');
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao descarregar o Mapa de Actividades');
    } finally {
      setADescarregar(false);
    }
  };

  const anos = useMemo(() => {
    const atual = hoje.getFullYear();
    return Array.from({ length: 6 }, (_, i) => atual - 4 + i);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const periodo = mes ? `${MESES[mes - 1]} de ${ano}` : `Ano de ${ano}`;
  const selectClass = "w-full px-3 py-2 border border-input rounded-md bg-background";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6" />
            Mapa de Actividades
          </h1>
          <p className="text-muted-foreground">
            {contexto === 'compras'
              ? 'Serviços, bens e imobilizados adquiridos no período — preenchido automaticamente a partir do Procurement e das facturas'
              : 'Serviços, bens e imobilizados adquiridos no período — preenchido automaticamente a partir das facturas (Compras e Finanças)'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filtrosAbertos || nFiltrosActivos > 0 ? 'default' : 'outline'}
            size="icon"
            className="relative"
            onClick={() => setFiltrosAbertos((v) => !v)}
            title={filtrosAbertos ? 'Fechar filtros' : 'Abrir filtros'}
            aria-label="Filtros"
            aria-expanded={filtrosAbertos}
          >
            <Filter className="h-4 w-4" />
            {nFiltrosActivos > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] leading-[18px] text-center">
                {nFiltrosActivos}
              </span>
            )}
          </Button>
          {podeExportar && (
            <Button onClick={descarregar} disabled={aDescarregar || loading}>
              {aDescarregar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Descarregar .xlsx{mapa && mapa.filtros_descricao.length > 0 ? ' (filtrado)' : ''}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Período e identificação</CardTitle>
          <CardDescription>O período define as facturas incluídas (pela data do documento). A identificação vai para a folha Resumo do ficheiro.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-2">
            <Label>Mês</Label>
            <select className={selectClass} value={mes} onChange={(e) => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              <option value={0}>Todo o ano</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Ano</Label>
            <select className={selectClass} value={ano} onChange={(e) => setAno(Number(e.target.value))}>
              {anos.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Direcção</Label>
            <Input value={direccao} onChange={(e) => setDireccao(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Elaborado por</Label>
            <Input value={elaboradoPor} onChange={(e) => setElaboradoPor(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Aprovado por (resp. DSG)</Label>
            <Input value={aprovadoPor} onChange={(e) => setAprovadoPor(e.target.value)} placeholder="Nome do responsável" />
          </div>
        </CardContent>
      </Card>

      {filtrosAbertos && (
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filtros
              {nFiltrosActivos > 0 && <Badge variant="secondary">{nFiltrosActivos} activo(s)</Badge>}
            </CardTitle>
            <CardDescription>
              Só aparecem (no ecrã e no .xlsx descarregado) as linhas que cumprem todos os filtros. Cada consulta e exportação fica registada na Auditoria com os filtros usados.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setFiltros(FILTROS_VAZIOS)} disabled={nFiltrosActivos === 0}>
              <X className="mr-1 h-4 w-4" /> Limpar filtros
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setFiltrosAbertos(false)} title="Fechar filtros" aria-label="Fechar filtros">
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <select className={selectClass} value={filtros.categoria} onChange={(e) => setFiltro('categoria', e.target.value)}>
              <option value="">Todas</option>
              <option value="servicos">Serviços adquiridos</option>
              <option value="bens">Bens adquiridos</option>
              <option value="imobilizados">Imobilizados adquiridos</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Fornecedor</Label>
            <Input list="mapa-act-fornecedores" value={filtros.fornecedor} onChange={(e) => setFiltro('fornecedor', e.target.value)} placeholder="Todos" />
            <datalist id="mapa-act-fornecedores">
              {(mapa?.opcoes.fornecedores || []).map((f) => <option key={f} value={f} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Centro de Custo</Label>
            <Input list="mapa-act-centros" value={filtros.centro_custo} onChange={(e) => setFiltro('centro_custo', e.target.value)} placeholder="Todos" />
            <datalist id="mapa-act-centros">
              {(mapa?.opcoes.centros_custo || []).map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Estado da aprovação</Label>
            <select className={selectClass} value={filtros.estado_aprovacao} onChange={(e) => setFiltro('estado_aprovacao', e.target.value)}>
              <option value="">Todos</option>
              {LISTAS.estados.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Tipo de documento</Label>
            <select className={selectClass} value={filtros.tipo_documento} onChange={(e) => setFiltro('tipo_documento', e.target.value)}>
              <option value="">Todos</option>
              <option value="VFAP">VFAP — Factura Provisória</option>
              <option value="VFA">VFA — Factura</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Pagamento</Label>
            <select className={selectClass} value={filtros.pagamento} onChange={(e) => setFiltro('pagamento', e.target.value)}>
              <option value="">Todos</option>
              <option value="pago">Pagos</option>
              <option value="por_pagar">Por pagar</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Data do documento desde</Label>
            <Input type="date" value={filtros.data_inicio} onChange={(e) => setFiltro('data_inicio', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Data do documento até</Label>
            <Input type="date" value={filtros.data_fim} onChange={(e) => setFiltro('data_fim', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor mínimo (Kz)</Label>
            <Input type="number" min={0} value={filtros.valor_min} onChange={(e) => setFiltro('valor_min', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Valor máximo (Kz)</Label>
            <Input type="number" min={0} value={filtros.valor_max} onChange={(e) => setFiltro('valor_max', e.target.value)} />
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Pesquisar</Label>
            <Input value={filtros.pesquisa} onChange={(e) => setFiltro('pesquisa', e.target.value)} placeholder="Serviço/bem, nº documento, código do artigo, NP, observações..." />
          </div>
        </CardContent>
      </Card>
      )}

      {/* Resumo dos filtros activos - visivel mesmo com o painel fechado. */}
      {mapa && (filtrosAbertos || mapa.filtros_descricao.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">
            {mapa.servicos.length + mapa.bens.length} de {mapa.total_sem_filtros} linha(s) do período
          </span>
          {mapa.filtros_descricao.map((d) => <Badge key={d} variant="outline">{d}</Badge>)}
          {!filtrosAbertos && nFiltrosActivos > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setFiltros(FILTROS_VAZIOS)}>
              Limpar filtros
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 mr-2 animate-spin" /> A carregar...
        </div>
      ) : !mapa ? (
        <p className="text-center py-10 text-muted-foreground">Não foi possível carregar o Mapa de Actividades.</p>
      ) : (
        <Tabs value={folha} onValueChange={setFolha}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="servicos">Serviços Adquiridos ({mapa.servicos.length})</TabsTrigger>
            <TabsTrigger value="bens">Bens Adquiridos ({mapa.bens.length})</TabsTrigger>
            <TabsTrigger value="guia">Guia de Preenchimento</TabsTrigger>
            <TabsTrigger value="listas">Listas</TabsTrigger>
          </TabsList>

          <TabsContent value="resumo" className="mt-4">
            <FolhaResumo mapa={mapa} direccao={direccao} periodo={periodo} elaboradoPor={elaboradoPor} aprovadoPor={aprovadoPor} />
          </TabsContent>

          <TabsContent value="servicos" className="mt-4">
            <FolhaDados
              titulo="MAPA DE ACTIVIDADES — SERVIÇOS ADQUIRIDOS"
              subtitulo={`FADA — Fundo de Apoio ao Desenvolvimento Agrário   |   Direcção: ${direccao}   |   Período: ${periodo}`}
              colunas={COLUNAS_SERVICOS}
              linhas={mapa.servicos}
              nModelo={5}
              podeEditar={podeEditar}
              onEditar={setEmEdicao}
            />
          </TabsContent>

          <TabsContent value="bens" className="mt-4">
            <FolhaDados
              titulo="MAPA DE ACTIVIDADES — BENS ADQUIRIDOS"
              subtitulo={`FADA — Fundo de Apoio ao Desenvolvimento Agrário   |   Direcção: ${direccao}   |   Período: ${periodo}`}
              colunas={COLUNAS_BENS}
              linhas={mapa.bens}
              nModelo={6}
              podeEditar={podeEditar}
              onEditar={setEmEdicao}
            />
          </TabsContent>

          <TabsContent value="guia" className="mt-4">
            <FolhaGuia />
          </TabsContent>

          <TabsContent value="listas" className="mt-4">
            <FolhaListas />
          </TabsContent>
        </Tabs>
      )}

      <EditarLinhaDialog
        linha={emEdicao}
        onClose={() => setEmEdicao(null)}
        onGuardado={() => { setEmEdicao(null); carregar(); }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Folhas
// ---------------------------------------------------------------------------

const thEstilo = { backgroundColor: COR_CABECALHO, color: '#fff' } as const;

function FolhaResumo({ mapa, direccao, periodo, elaboradoPor, aprovadoPor }: {
  mapa: Mapa; direccao: string; periodo: string; elaboradoPor: string; aprovadoPor: string;
}) {
  const ident: [string, string][] = [
    ['Direcção', direccao],
    ['Período (mês/ano)', periodo],
    ['Elaborado por', elaboradoPor],
    ['Data de elaboração', mapa.identificacao.data_elaboracao],
    ['Aprovado por (responsável da DSG)', aprovadoPor],
  ];
  const linhas = [...mapa.resumo, mapa.total_geral];
  return (
    <Card>
      <CardHeader className="text-center">
        <img src={FADA_LOGO_DATA_URI} alt="FADA" className="h-12 w-auto self-start" />
        <CardTitle>MAPA DE ACTIVIDADES</CardTitle>
        <CardDescription>FADA — Fundo de Apoio ao Desenvolvimento Agrário</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr><th colSpan={2} className="text-left px-3 py-2" style={thEstilo}>IDENTIFICAÇÃO</th></tr>
            </thead>
            <tbody>
              {ident.map(([rotulo, valor]) => (
                <tr key={rotulo}>
                  <td className="border px-3 py-2 font-semibold w-1/3" style={{ backgroundColor: COR_DESCRICAO, color: '#000' }}>{rotulo}</td>
                  <td className="border px-3 py-2" style={{ backgroundColor: COR_PREENCHER, color: '#0000FF' }}>{valor || ' '}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr><th colSpan={5} className="text-left px-3 py-2" style={thEstilo}>RESUMO DO PERÍODO (calculado automaticamente)</th></tr>
              <tr>
                {['Categoria', 'N.º de registos', 'Quantidade de bens', 'Valor (Kz)', 'Quantidade de facturas'].map((h) => (
                  <th key={h} className="border px-3 py-2 text-left" style={{ backgroundColor: COR_RESUMO, color: '#fff' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((r, i) => {
                const total = i === linhas.length - 1;
                const estilo = total ? { backgroundColor: COR_DESCRICAO, color: '#000', fontWeight: 700 } : undefined;
                return (
                  <tr key={r.categoria}>
                    <td className="border px-3 py-2" style={estilo}>{r.categoria}</td>
                    <td className="border px-3 py-2 text-right" style={estilo}>{fmtInteiro(r.registos)}</td>
                    <td className="border px-3 py-2 text-right" style={estilo}>{r.quantidade_bens === null ? '—' : fmtInteiro(r.quantidade_bens)}</td>
                    <td className="border px-3 py-2 text-right" style={estilo}>{fmtValor(r.valor)}</td>
                    <td className="border px-3 py-2 text-right" style={estilo}>{fmtInteiro(r.quantidade_facturas)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-muted-foreground flex gap-2">
          <Info className="h-4 w-4 shrink-0" />
          Células a amarelo: a preencher pelo utilizador. Os restantes valores são calculados a partir das folhas «Serviços Adquiridos» e «Bens Adquiridos» (linhas 8 a 1000). A linha de exemplo (linha 7) não entra nos totais. Os valores de exemplo em Identificação devem ser substituídos.
        </p>
        {mapa.filtros_descricao.length > 0 && (
          <p className="text-xs italic" style={{ color: '#C00000' }}>
            Filtros aplicados: {mapa.filtros_descricao.join('; ')}. Linhas incluídas: {mapa.servicos.length + mapa.bens.length} de {mapa.total_sem_filtros}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function FolhaDados<T extends Linha>({ titulo, subtitulo, colunas, linhas, nModelo, podeEditar, onEditar }: {
  titulo: string;
  subtitulo: string;
  colunas: Coluna<T>[];
  linhas: T[];
  nModelo: number;
  podeEditar: boolean;
  onEditar: (linha: Linha) => void;
}) {
  const nSugeridos = colunas.length - nModelo;
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-base">{titulo}</CardTitle>
        <CardDescription>{subtitulo}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              {/* Linha 3: grupos de campos */}
              <TableRow>
                <TableHead />
                <TableHead colSpan={nModelo} className="text-center font-semibold" style={{ backgroundColor: COR_DESCRICAO, color: '#000' }}>Campos do modelo</TableHead>
                <TableHead colSpan={nSugeridos} className="text-center font-semibold" style={{ backgroundColor: COR_EXEMPLO, color: '#000' }}>Campos sugeridos (opcionais)</TableHead>
                {podeEditar && <TableHead />}
              </TableRow>
              {/* Linha 5: títulos */}
              <TableRow>
                <TableHead style={thEstilo}>N.º</TableHead>
                {colunas.map((c) => <TableHead key={c.titulo} className="min-w-[120px] whitespace-normal" style={thEstilo}>{c.titulo}</TableHead>)}
                {podeEditar && <TableHead style={thEstilo} />}
              </TableRow>
              {/* Linha 6: descrições */}
              <TableRow>
                <TableHead style={{ backgroundColor: COR_DESCRICAO }} />
                {colunas.map((c) => (
                  <TableHead key={c.titulo} className="whitespace-normal font-normal text-[11px]" style={{ backgroundColor: COR_DESCRICAO, color: '#595959' }}>{c.descricao}</TableHead>
                ))}
                {podeEditar && <TableHead style={{ backgroundColor: COR_DESCRICAO }} />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Linha 7: exemplo (não entra nos totais) */}
              <TableRow style={{ backgroundColor: COR_EXEMPLO, color: '#7F7F7F' }}>
                <TableCell className="italic">Ex.</TableCell>
                {colunas.map((c) => (
                  <TableCell key={c.titulo} className={`italic ${c.formato ? 'text-right' : ''}`}>{formatar(c.exemplo, c.formato)}</TableCell>
                ))}
                {podeEditar && <TableCell />}
              </TableRow>
              {linhas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colunas.length + (podeEditar ? 2 : 1)} className="text-center py-8 text-muted-foreground">
                    Nenhuma linha para o período e filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : linhas.map((l, i) => (
                <TableRow key={`${l.factura_id}-${l.item_key}`}>
                  <TableCell>{i + 1}</TableCell>
                  {colunas.map((c) => (
                    <TableCell key={c.titulo} className={`whitespace-normal ${c.formato ? 'text-right' : ''}`}>
                      {formatar(c.campo(l), c.formato)}
                    </TableCell>
                  ))}
                  {podeEditar && (
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => onEditar(l)} title="Completar/corrigir esta linha">
                        <Pencil className="h-3.5 w-3.5" />
                        {l.editado.length > 0 && <Badge variant="secondary" className="ml-1 text-[10px]">editado</Badge>}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
            {/* Linha 4: TOTAL */}
            <TableFooter>
              <TableRow style={{ backgroundColor: COR_EXEMPLO }}>
                <TableCell />
                {colunas.map((c, i) => (
                  <TableCell key={c.titulo} className={`font-semibold ${c.formato ? 'text-right' : ''}`}>
                    {i === 0 ? 'TOTAL' : c.total ? formatar(c.total(linhas), c.formato) : ''}
                  </TableCell>
                ))}
                {podeEditar && <TableCell />}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function FolhaGuia() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">GUIA DE PREENCHIMENTO</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              {['Folha', 'Campo', 'Tipo', 'Como preencher', 'Origem no Manual de Procedimentos / Primavera'].map((h) => (
                <TableHead key={h} style={thEstilo}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {GUIA.map((linha) => (
              <TableRow key={`${linha[0]}-${linha[1]}`}>
                {linha.map((v, i) => <TableCell key={i} className="whitespace-normal">{v}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function FolhaListas() {
  const max = Math.max(LISTAS.bens.length, LISTAS.tipos.length, LISTAS.estados.length);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Listas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table className="text-xs">
            <TableHeader>
              <TableRow>
                {['Bens/Imobilizados', 'Tipo de documento', 'Estado da aprovação'].map((h) => <TableHead key={h} style={thEstilo}>{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: max }, (_, i) => (
                <TableRow key={i}>
                  <TableCell>{LISTAS.bens[i] || ''}</TableCell>
                  <TableCell>{LISTAS.tipos[i] || ''}</TableCell>
                  <TableCell>{LISTAS.estados[i] || ''}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Listas usadas nos menus pendentes. Os valores seguem o glossário do manual (VFAP, VFA); o estado de aprovação corresponde ao documento APR.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Edição de uma linha (campos que o sistema não regista ou que se queira corrigir)
// ---------------------------------------------------------------------------

interface CampoForm { campo: CampoEditavel; rotulo: string; opcoes?: string[] }

const CAMPOS_SERVICO: CampoForm[] = [
  { campo: 'servico', rotulo: 'Serviço' },
  { campo: 'local_prestado', rotulo: 'Local prestado' },
  { campo: 'objectivo', rotulo: 'Objectivo/Motivo do Serviço' },
];
const CAMPOS_BEM: CampoForm[] = [
  { campo: 'classificacao', rotulo: 'Bens/Imobilizados', opcoes: LISTAS.bens },
  { campo: 'nome_bem', rotulo: 'Nome do bem ou imobilizado' },
  { campo: 'centro_custo', rotulo: 'Centro de Custo' },
  { campo: 'localizacao_responsavel', rotulo: 'Localização / Responsável pelo bem' },
];
const CAMPOS_COMUNS: CampoForm[] = [
  { campo: 'fornecedor', rotulo: 'Fornecedor' },
  { campo: 'tipo_documento', rotulo: 'Tipo de documento', opcoes: LISTAS.tipos },
  { campo: 'numero_documento', rotulo: 'N.º do documento' },
  { campo: 'codigo_artigo', rotulo: 'Código do artigo (ex.: DSG0001)' },
  { campo: 'observacoes', rotulo: 'Observações' },
];

function EditarLinhaDialog({ linha, onClose, onGuardado }: { linha: Linha | null; onClose: () => void; onGuardado: () => void }) {
  const [valores, setValores] = useState<Partial<Record<CampoEditavel, string>>>({});
  const [aGuardar, setAGuardar] = useState(false);

  useEffect(() => {
    if (!linha) return;
    const inicial: Partial<Record<CampoEditavel, string>> = { categoria: linha.categoria };
    for (const c of [...CAMPOS_SERVICO, ...CAMPOS_BEM, ...CAMPOS_COMUNS]) {
      const v = (linha as any)[c.campo];
      if (v !== undefined) inicial[c.campo] = String(v ?? '');
    }
    setValores(inicial);
  }, [linha]);

  if (!linha) return null;
  const categoria = (valores.categoria as 'servico' | 'bem') || linha.categoria;
  const campos = [...(categoria === 'servico' ? CAMPOS_SERVICO : CAMPOS_BEM), ...CAMPOS_COMUNS];

  const guardar = async (repor = false) => {
    setAGuardar(true);
    try {
      // Só se gravam os campos alterados face ao que o sistema mostrou (ou já
      // tinham sido editados); "Repor" limpa tudo e volta ao preenchimento automático.
      const payload: Record<string, string> = {};
      if (repor) {
        for (const c of linha.editado) payload[c] = '';
      } else {
        if (categoria !== linha.categoria || linha.editado.includes('categoria')) payload.categoria = categoria;
        for (const c of campos) {
          const atual = String((linha as any)[c.campo] ?? '');
          const novo = valores[c.campo] ?? '';
          if (novo !== atual || linha.editado.includes(c.campo)) payload[c.campo] = novo;
        }
      }
      const res = await fetch(
        `${API_BASE_URL}/mapa-actividades/facturas/${encodeURIComponent(linha.factura_id)}/itens/${encodeURIComponent(linha.item_key)}`,
        { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(payload) },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message || 'Erro ao guardar');
      toast.success(repor ? 'Linha reposta com os dados do sistema' : 'Linha actualizada');
      onGuardado();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao guardar');
    } finally {
      setAGuardar(false);
    }
  };

  return (
    <Dialog open={!!linha} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Completar / corrigir linha</DialogTitle>
          <DialogDescription>
            Documento {linha.numero_documento || '-'} · {linha.fornecedor || '-'}. Os valores, datas, estado e NP vêm sempre do sistema;
            aqui completam-se os campos que o sistema não regista (ex.: Código do artigo) ou corrige-se a classificação.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Folha</Label>
            <select
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={categoria}
              onChange={(e) => setValores((v) => ({ ...v, categoria: e.target.value }))}
            >
              <option value="servico">Serviços Adquiridos</option>
              <option value="bem">Bens Adquiridos</option>
            </select>
          </div>
          {campos.map((c) => (
            <div key={c.campo} className="space-y-2">
              <Label>{c.rotulo}</Label>
              {c.opcoes ? (
                <select
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={valores[c.campo] || c.opcoes[0]}
                  onChange={(e) => setValores((v) => ({ ...v, [c.campo]: e.target.value }))}
                >
                  {c.opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <Input value={valores[c.campo] ?? ''} onChange={(e) => setValores((v) => ({ ...v, [c.campo]: e.target.value }))} />
              )}
            </div>
          ))}
        </div>
        {categoria !== linha.categoria && (
          <p className="text-xs text-muted-foreground">Ao guardar, a linha passa para a folha «{categoria === 'servico' ? 'Serviços Adquiridos' : 'Bens Adquiridos'}». Complete os campos dessa folha depois de guardar.</p>
        )}

        <DialogFooter className="gap-2">
          {linha.editado.length > 0 && (
            <Button variant="outline" onClick={() => guardar(true)} disabled={aGuardar}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Repor dados do sistema
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={aGuardar}>Cancelar</Button>
          <Button onClick={() => guardar(false)} disabled={aGuardar}>
            {aGuardar && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
