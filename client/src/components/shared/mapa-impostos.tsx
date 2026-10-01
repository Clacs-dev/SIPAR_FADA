/**
 * MAPA DE IMPOSTOS
 *
 * Relatório consolidado de IVA (14/7/5/2% - produtos) e Retenção na Fonte
 * (6,5% - serviços) aplicados às facturas, com o breakdown fiscal por
 * documento: Valor Bruto, Valor IVA (Cativo), Valor Retenção, Valor Final a
 * Pagar. Fonte única de dados: GET /facturas - cobre tanto as facturas
 * criadas directamente em Financeiro/Gestão de Pagamento como as geradas
 * automaticamente a partir de Ordens de Compra do módulo Compras (ver
 * server/src/services/procurement-factura.service.ts), por isso o mesmo
 * componente serve de "Mapa de Impostos" nos dois módulos (ver
 * client/src/components/facturas/facturas-main.tsx e
 * client/src/components/compras/compras-main.tsx).
 */

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "../ui/table";
import { Download, Loader2, Receipt, Info } from "lucide-react";
import { API_BASE_URL, getAuthHeaders } from "@/services/api";
import { previewDocument } from "../ui/document-preview";
import { TAXA_RETENCAO_SERVICOS } from "../../utils/fiscal";
import { toast } from "sonner@2.0.3";

interface FacturaFiscal {
  id: string;
  numero?: string;
  fornecedor?: string;
  fornecedor_nome?: string;
  data_emissao?: string;
  status?: string;
  tipo?: 'mercadoria' | 'servico' | 'ambos';
  moeda?: string;
  subtotal?: number;
  valor?: number;
  iva_total?: number;
  retencao_total?: number;
  total?: number;
  valor_final?: number;
  data?: { origem?: string };
  itens?: Array<{ taxa_iva?: number; iva?: number; tipo_operacao?: string; quantidade?: number; preco_unitario?: number; subtotal?: number }>;
}

interface MapaImpostosProps {
  /** Só afecta o texto do cabeçalho/descrição - os dados são sempre os mesmos. */
  contexto?: 'financeiro' | 'compras';
  /** Chamado ao clicar numa linha, com o id da factura - deve levar aos detalhes dela (com o seu estado real). */
  onOpenFactura?: (facturaId: string) => void;
}

type FiltroOrigem = 'todas' | 'compras' | 'financeiro';
type FiltroTipo = 'todos' | 'mercadoria' | 'servico' | 'ambos';
type FiltroStatus = 'todos' | string;

// Rótulos de estado iguais aos usados no resto do módulo de Facturas
// (client/src/components/facturas/facturas-main.tsx:getStatusBadge), para o
// filtro e a coluna "Estado" aqui mostrarem sempre o mesmo texto.
const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  registada: 'Registada',
  pendente: 'Pendente',
  validado: 'Aprovado-DSG',
  aprovado: 'Despesas Aprovadas',
  submetido_ao_banco: 'Submetido ao Banco',
  pago: 'Pago',
  rejeitado: 'Rejeitado',
  cancelado: 'Cancelado',
};
const STATUS_ORDENADOS = ['pendente', 'validado', 'aprovado', 'submetido_ao_banco', 'pago', 'rejeitado', 'cancelado', 'rascunho', 'registada'];

export function MapaImpostos({ contexto = 'financeiro', onOpenFactura }: MapaImpostosProps) {
  const [loading, setLoading] = useState(true);
  const [facturas, setFacturas] = useState<FacturaFiscal[]>([]);
  // Filtra pela Data de Emissão da factura (ver coluna "Data Emissão" na
  // tabela) - não pela data de vencimento, pagamento ou submissão ao banco.
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [filtroOrigem, setFiltroOrigem] = useState<FiltroOrigem>('todas');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [busca, setBusca] = useState('');

  useEffect(() => {
    let cancelado = false;
    setLoading(true);
    fetch(`${API_BASE_URL}/facturas?all=true`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Erro ao carregar facturas'))))
      .then((result) => {
        if (cancelado) return;
        setFacturas(result.facturas || result.data || []);
      })
      .catch((error) => {
        console.error('Erro ao carregar o Mapa de Impostos:', error);
        toast.error('Erro ao carregar o Mapa de Impostos');
      })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, []);

  const linhas = useMemo(() => {
    return facturas.map((f) => {
      const valorBruto = f.subtotal ?? f.valor ?? 0;
      const valorIva = f.iva_total ?? 0;
      const valorRetencao = f.retencao_total ?? 0;
      // Valor Final a Pagar = bruto menos IVA cativo (retido na totalidade,
      // não pago ao fornecedor) e menos retenção de serviços - nunca soma.
      const valorFinal = f.valor_final ?? (valorBruto - valorIva - valorRetencao);
      const origem = f.data?.origem === 'procurement' ? 'compras' as const : 'financeiro' as const;
      const itens = f.itens || [];
      const taxasIva = Array.from(new Set(itens
        .map((i) => i.taxa_iva ?? i.iva)
        .filter((v): v is number => typeof v === 'number' && v > 0)));
      // Valor Bruto separado por Mercadoria vs Serviços - uma factura "Ambos"
      // mistura os dois, e o Valor Bruto sozinho não deixa ver quanto é de
      // cada. Itens antigos (anteriores a esta distinção) não têm
      // "tipo_operacao" gravado - nesse caso usa-se o tipo da própria
      // factura como fallback, em vez de assumir sempre "produto" (senão
      // uma factura de Serviço sem itens estruturados aparecia como
      // Mercadoria). Quando não há itens estruturados, o mesmo fallback
      // aplica-se directamente ao valor bruto todo.
      let valorMercadoria = 0;
      let valorServicos = 0;
      const tipoFallback: 'produto' | 'servico' = f.tipo === 'servico' ? 'servico' : 'produto';
      if (itens.length > 0) {
        for (const item of itens) {
          const bruto = item.subtotal ?? ((item.quantidade || 0) * (item.preco_unitario || 0));
          const tipoItem = item.tipo_operacao === 'servico' || item.tipo_operacao === 'produto' ? item.tipo_operacao : tipoFallback;
          if (tipoItem === 'servico') valorServicos += bruto;
          else valorMercadoria += bruto;
        }
      } else if (tipoFallback === 'servico') {
        valorServicos = valorBruto;
      } else {
        valorMercadoria = valorBruto;
      }
      return {
        ...f,
        valorBruto,
        valorIva,
        valorRetencao,
        valorFinal,
        valorMercadoria,
        valorServicos,
        origem,
        taxaIvaExibicao: taxasIva.length === 0 ? '-' : taxasIva.length === 1 ? `${taxasIva[0]}%` : 'Várias',
        fornecedorNome: f.fornecedor_nome || (typeof f.fornecedor === 'string' ? f.fornecedor : '-'),
      };
    });
  }, [facturas]);

  const linhasFiltradas = useMemo(() => {
    return linhas.filter((linha) => {
      if (dataInicio && linha.data_emissao && linha.data_emissao < dataInicio) return false;
      if (dataFim && linha.data_emissao && linha.data_emissao > dataFim) return false;
      if (filtroTipo !== 'todos' && linha.tipo !== filtroTipo) return false;
      if (filtroOrigem !== 'todas' && linha.origem !== filtroOrigem) return false;
      if (filtroStatus !== 'todos' && linha.status !== filtroStatus) return false;
      if (busca) {
        const alvo = `${linha.numero || ''} ${linha.fornecedorNome || ''}`.toLowerCase();
        if (!alvo.includes(busca.toLowerCase())) return false;
      }
      return true;
    });
  }, [linhas, dataInicio, dataFim, filtroTipo, filtroOrigem, filtroStatus, busca]);

  // Estados realmente presentes nas facturas carregadas, por ordem do
  // ciclo de vida (STATUS_ORDENADOS) - evita mostrar opções de estado que
  // não existem em nenhuma factura actual.
  const statusDisponiveis = useMemo(() => {
    const presentes = new Set(linhas.map((l) => l.status).filter((s): s is string => !!s));
    return STATUS_ORDENADOS.filter((s) => presentes.has(s));
  }, [linhas]);

  const totais = useMemo(() => linhasFiltradas.reduce((acc, l) => ({
    valorMercadoria: acc.valorMercadoria + l.valorMercadoria,
    valorServicos: acc.valorServicos + l.valorServicos,
    valorBruto: acc.valorBruto + l.valorBruto,
    valorIva: acc.valorIva + l.valorIva,
    valorRetencao: acc.valorRetencao + l.valorRetencao,
    valorFinal: acc.valorFinal + l.valorFinal,
  }), { valorMercadoria: 0, valorServicos: 0, valorBruto: 0, valorIva: 0, valorRetencao: 0, valorFinal: 0 }), [linhasFiltradas]);

  const formatCurrency = (value: number, moeda = 'AOA') => new Intl.NumberFormat('pt-AO', {
    style: 'currency', currency: moeda || 'AOA', minimumFractionDigits: 2,
  }).format(value || 0);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-PT');
  };

  const exportarCSV = () => {
    const headers = ['Número', 'Fornecedor', 'Data Emissão', 'Tipo', 'Origem', 'Taxa IVA', 'Valor Mercadoria', 'Valor Serviços', 'Valor Bruto', 'Valor IVA', 'Valor Retenção', 'Valor Final a Pagar', 'Estado'];
    const csvRows = linhasFiltradas.map((l) => [
      l.numero || '', l.fornecedorNome || '', l.data_emissao || '', l.tipo || '', l.origem,
      l.taxaIvaExibicao, l.valorMercadoria.toFixed(2), l.valorServicos.toFixed(2),
      l.valorBruto.toFixed(2), l.valorIva.toFixed(2), l.valorRetencao.toFixed(2),
      l.valorFinal.toFixed(2), l.status || '',
    ]);
    const csvContent = [headers.join(','), ...csvRows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    previewDocument({ blob, nome: `mapa_impostos_${Date.now()}.csv`, tipo: 'text/csv' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Mapa de Impostos
          </h1>
          <p className="text-muted-foreground">
            {contexto === 'compras'
              ? 'IVA e Retenção na Fonte aplicados às facturas geradas a partir das Ordens de Compra'
              : 'IVA e Retenção na Fonte aplicados a todas as facturas (Financeiro e Compras)'}
          </p>
        </div>
        <Button variant="outline" onClick={exportarCSV} disabled={linhasFiltradas.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card className="bg-accent/40">
        <CardContent className="pt-4 flex gap-3 text-sm text-muted-foreground">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            Regras fiscais aplicadas (Angola, CIVA): <strong>IVA Cativo</strong> de 14% (taxa geral), 7% (regime
            simplificado / hotelaria-restauração), 5% (bens alimentares/agrícolas ou equipamento industrial) ou 2%,
            sobre facturas de <strong> produtos</strong> — retido na totalidade e entregue directamente à AGT, não
            é pago ao fornecedor. <strong>Retenção na Fonte</strong> de {TAXA_RETENCAO_SERVICOS}% sobre facturas de
            <strong> serviços</strong>. Nenhum dos dois reduz o valor da factura emitida pelo fornecedor (esse
            continua bruto + IVA), mas ambos reduzem o valor efectivamente desembolsado — daí o Valor Final a Pagar
            ser sempre o valor bruto menos IVA e/ou retenção.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="space-y-2">
            <Label>Emissão desde</Label>
            <Input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Emissão até</Label>
            <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <select
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as FiltroTipo)}
            >
              <option value="todos">Todos</option>
              <option value="mercadoria">Produto</option>
              <option value="servico">Serviço</option>
              <option value="ambos">Ambos</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Origem</Label>
            <select
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={filtroOrigem}
              onChange={(e) => setFiltroOrigem(e.target.value as FiltroOrigem)}
            >
              <option value="todas">Todas</option>
              <option value="compras">Compras</option>
              <option value="financeiro">Financeiro (directo)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <select
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
            >
              <option value="todos">Todos</option>
              {statusDisponiveis.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Pesquisar</Label>
            <Input placeholder="Nº factura ou fornecedor" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {linhasFiltradas.length} {linhasFiltradas.length === 1 ? 'factura' : 'facturas'}
          </CardTitle>
          <CardDescription>
            Valor Mercadoria/Serviços, Valor Bruto, Valor IVA (Cativo), Valor Retenção e Valor Final a Pagar por factura
            {onOpenFactura && ' — clique numa linha para abrir a factura'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> A carregar...
            </div>
          ) : linhasFiltradas.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">Nenhuma factura encontrada para os filtros seleccionados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Factura</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Data Emissão</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Taxa IVA</TableHead>
                  <TableHead className="text-right">Valor Mercadoria/Serviços</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Valor IVA</TableHead>
                  <TableHead className="text-right">Valor Retenção</TableHead>
                  <TableHead className="text-right">Valor Final a Pagar</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhasFiltradas.map((l) => (
                  <TableRow
                    key={l.id}
                    className={onOpenFactura ? "cursor-pointer hover:bg-accent/60" : undefined}
                    onClick={() => onOpenFactura?.(l.id)}
                    title={onOpenFactura ? "Ver a factura" : undefined}
                  >
                    <TableCell className="font-medium">{l.numero || '-'}</TableCell>
                    <TableCell>{l.fornecedorNome}</TableCell>
                    <TableCell>{formatDate(l.data_emissao)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {l.tipo === 'servico' ? 'Serviço' : l.tipo === 'ambos' ? 'Ambos' : 'Produto'}
                      </Badge>
                    </TableCell>
                    <TableCell>{l.taxaIvaExibicao}</TableCell>
                    <TableCell className="text-right text-xs">
                      {l.valorMercadoria > 0 && <div>Mercadoria: {formatCurrency(l.valorMercadoria, l.moeda)}</div>}
                      {l.valorServicos > 0 && <div>Serviços: {formatCurrency(l.valorServicos, l.moeda)}</div>}
                      {l.valorMercadoria === 0 && l.valorServicos === 0 && '-'}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(l.valorBruto, l.moeda)}</TableCell>
                    <TableCell className="text-right text-amber-600">
                      {l.valorIva > 0 ? `-${formatCurrency(l.valorIva, l.moeda)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right text-amber-600">
                      {l.valorRetencao > 0 ? `-${formatCurrency(l.valorRetencao, l.moeda)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(l.valorFinal, l.moeda)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{l.status ? (STATUS_LABELS[l.status] || l.status) : '-'}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={5} className="font-semibold">Totais</TableCell>
                  <TableCell className="text-right font-semibold text-xs">
                    <div>Mercadoria: {formatCurrency(totais.valorMercadoria)}</div>
                    <div>Serviços: {formatCurrency(totais.valorServicos)}</div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(totais.valorBruto)}</TableCell>
                  <TableCell className="text-right font-semibold text-amber-600">-{formatCurrency(totais.valorIva)}</TableCell>
                  <TableCell className="text-right font-semibold text-amber-600">-{formatCurrency(totais.valorRetencao)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(totais.valorFinal)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
