/**
 * Dialog de Detalhes do Planejamento
 * Suporta: Orçamento, Relatório Financeiro, Conta a Pagar
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import {
  TrendingUp,
  FileBarChart,
  DollarSign,
  Calendar,
  User,
  Building,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Orcamento, RelatorioFinanceiro, ContaPagar } from "./types";

interface PlanejamentoDetailsDialogProps {
  tipo: "orcamento" | "relatorio" | "conta_pagar";
  item: Orcamento | RelatorioFinanceiro | ContaPagar | null;
  open: boolean;
  onClose: () => void;
}

export function PlanejamentoDetailsDialog({
  tipo,
  item,
  open,
  onClose,
}: PlanejamentoDetailsDialogProps) {
  if (!item) return null;

  // ========== ORÇAMENTO ==========
  if (tipo === "orcamento") {
    const orcamento = item as Orcamento;

    const getStatusBadge = (status: string) => {
      const badges: Record<string, { label: string; color: string }> = {
        rascunho: { label: "Rascunho", color: "bg-gray-500" },
        enviado: { label: "Enviado", color: "bg-blue-500" },
        aprovado: { label: "Aprovado", color: "bg-green-500" },
        rejeitado: { label: "Rejeitado", color: "bg-red-500" },
        em_execucao: { label: "Em Execução", color: "bg-yellow-500" },
        concluido: { label: "Concluído", color: "bg-gray-600" },
      };
      const badge = badges[status] || badges.rascunho;
      return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Detalhes do Orçamento
            </DialogTitle>
            <DialogDescription>Informações completas do orçamento</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{orcamento.numero}</h3>
                  {getStatusBadge(orcamento.status)}
                  <Badge variant="outline">Versão {orcamento.versao}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ano Fiscal: {orcamento.ano_fiscal} | Período: {orcamento.periodo}
                </p>
              </div>
            </div>

            {/* Informações Principais */}
            <div>
              <h5 className="font-semibold mb-3">Informações Principais</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Departamento</p>
                  <p className="text-sm font-medium">{orcamento.departamento}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Elaborado por</p>
                  <p className="text-sm font-medium">{orcamento.elaborado_por}</p>
                </div>
              </div>
            </div>

            {/* Valores */}
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-3">Valores</h5>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Valor Previsto</p>
                  <p className="text-lg font-bold text-blue-700">
                    {orcamento.valor_previsto.toLocaleString("pt-AO")} AOA
                  </p>
                </div>
                {orcamento.valor_aprovado && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Valor Aprovado</p>
                    <p className="text-lg font-bold text-green-700">
                      {orcamento.valor_aprovado.toLocaleString("pt-AO")} AOA
                    </p>
                  </div>
                )}
                {orcamento.valor_reservado && (
                  <div className="bg-orange-50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">Valor Reservado</p>
                    <p className="text-lg font-bold text-orange-700">
                      {orcamento.valor_reservado.toLocaleString("pt-AO")} AOA
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Categorias Orçamentais */}
            {orcamento.categorias && orcamento.categorias.length > 0 && (
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-3">Categorias Orçamentais</h5>
                <div className="space-y-2">
                  {orcamento.categorias.map((cat) => (
                    <div key={cat.id} className="border rounded-lg p-3 bg-muted">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{cat.nome}</p>
                          {cat.subcategoria && (
                            <p className="text-sm text-muted-foreground">{cat.subcategoria}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {cat.valor_previsto.toLocaleString("pt-AO")} AOA
                          </p>
                          {cat.valor_aprovado && (
                            <p className="text-sm text-green-600">
                              Aprovado: {cat.valor_aprovado.toLocaleString("pt-AO")} AOA
                            </p>
                          )}
                        </div>
                      </div>
                      {cat.descricao && (
                        <p className="text-sm text-muted-foreground">{cat.descricao}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Forecast Trimestral */}
            {orcamento.forecast_trimestral && (
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-3">Forecast Trimestral</h5>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(orcamento.forecast_trimestral).map(([trimestre, valor]) => (
                    <div key={trimestre} className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase">{trimestre}</p>
                      <p className="text-lg font-bold">
                        {typeof valor === "number" ? valor.toLocaleString("pt-AO") : valor} AOA
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Premissas */}
            {orcamento.premissas && (
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-2">Premissas</h5>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{orcamento.premissas}</p>
                </div>
              </div>
            )}

            {/* Aprovação */}
            {orcamento.status === "aprovado" && orcamento.aprovado_por && (
              <div className="border-t pt-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="font-semibold text-green-900">Orçamento Aprovado</p>
                  </div>
                  <p className="text-sm">Aprovado por: {orcamento.aprovado_por}</p>
                  {orcamento.aprovado_em && (
                    <p className="text-sm">
                      Data: {format(new Date(orcamento.aprovado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Metadados */}
            <div className="border-t pt-4 text-xs text-muted-foreground">
              <p>
                Criado em:{" "}
                {format(new Date(orcamento.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ========== RELATÓRIO FINANCEIRO ==========
  if (tipo === "relatorio") {
    const relatorio = item as RelatorioFinanceiro;

    const getStatusBadge = (status: string) => {
      const badges: Record<string, { label: string; color: string }> = {
        rascunho: { label: "Rascunho", color: "bg-gray-500" },
        revisao: { label: "Em Revisão", color: "bg-yellow-500" },
        aprovado: { label: "Aprovado", color: "bg-green-500" },
        publicado: { label: "Publicado", color: "bg-blue-500" },
      };
      const badge = badges[status] || badges.rascunho;
      return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
    };

    const getTipoLabel = (tipo: string) => {
      const tipos: Record<string, string> = {
        balanco: "Balanço Patrimonial",
        demonstracao_resultados: "Demonstração de Resultados",
        fluxo_caixa: "Fluxo de Caixa",
        contas_pagar: "Contas a Pagar",
        contas_receber: "Contas a Receber",
        consolidado: "Consolidado",
      };
      return tipos[tipo] || tipo;
    };

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileBarChart className="h-5 w-5" />
              Detalhes do Relatório Financeiro
            </DialogTitle>
            <DialogDescription>Informações completas do relatório</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{relatorio.numero}</h3>
                  {getStatusBadge(relatorio.status)}
                </div>
                <h4 className="text-lg font-semibold">{relatorio.titulo}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Tipo: {getTipoLabel(relatorio.tipo)}
                </p>
              </div>
            </div>

            {/* Período */}
            <div>
              <h5 className="font-semibold mb-3">Período de Referência</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Início</p>
                    <p className="text-sm font-medium">
                      {format(new Date(relatorio.periodo_inicio), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fim</p>
                    <p className="text-sm font-medium">
                      {format(new Date(relatorio.periodo_fim), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Resumo Executivo */}
            {relatorio.resumo_executivo && (
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-2">Resumo Executivo</h5>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{relatorio.resumo_executivo}</p>
                </div>
              </div>
            )}

            {/* Dados Financeiros */}
            {relatorio.dados && (
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-3">Dados Financeiros</h5>
                <div className="grid grid-cols-2 gap-4">
                  {relatorio.dados.receitas !== undefined && (
                    <div className="border rounded-lg p-3 bg-green-50">
                      <p className="text-xs text-muted-foreground">Receitas</p>
                      <p className="text-lg font-bold text-green-700">
                        {relatorio.dados.receitas.toLocaleString("pt-AO")} AOA
                      </p>
                    </div>
                  )}
                  {relatorio.dados.despesas !== undefined && (
                    <div className="border rounded-lg p-3 bg-red-50">
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="text-lg font-bold text-red-700">
                        {relatorio.dados.despesas.toLocaleString("pt-AO")} AOA
                      </p>
                    </div>
                  )}
                  {relatorio.dados.resultado !== undefined && (
                    <div className="border rounded-lg p-3 bg-blue-50">
                      <p className="text-xs text-muted-foreground">Resultado</p>
                      <p className="text-lg font-bold text-blue-700">
                        {relatorio.dados.resultado.toLocaleString("pt-AO")} AOA
                      </p>
                    </div>
                  )}
                  {relatorio.dados.ativos !== undefined && (
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Ativos</p>
                      <p className="text-lg font-bold">
                        {relatorio.dados.ativos.toLocaleString("pt-AO")} AOA
                      </p>
                    </div>
                  )}
                  {relatorio.dados.passivos !== undefined && (
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Passivos</p>
                      <p className="text-lg font-bold">
                        {relatorio.dados.passivos.toLocaleString("pt-AO")} AOA
                      </p>
                    </div>
                  )}
                  {relatorio.dados.patrimonio_liquido !== undefined && (
                    <div className="border rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Patrimônio Líquido</p>
                      <p className="text-lg font-bold">
                        {relatorio.dados.patrimonio_liquido.toLocaleString("pt-AO")} AOA
                      </p>
                    </div>
                  )}
                  {relatorio.dados.saldo_caixa !== undefined && (
                    <div className="border rounded-lg p-3 bg-yellow-50">
                      <p className="text-xs text-muted-foreground">Saldo em Caixa</p>
                      <p className="text-lg font-bold text-yellow-700">
                        {relatorio.dados.saldo_caixa.toLocaleString("pt-AO")} AOA
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detalhamento */}
            {relatorio.detalhamento && relatorio.detalhamento.length > 0 && (
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-3">Detalhamento</h5>
                <div className="space-y-2">
                  {relatorio.detalhamento.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="font-medium">{item.categoria}</p>
                        {item.observacao && (
                          <p className="text-sm text-muted-foreground">{item.observacao}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{item.valor.toLocaleString("pt-AO")} AOA</p>
                        {item.percentual && (
                          <p className="text-sm text-muted-foreground">{item.percentual}%</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendações */}
            {relatorio.recomendacoes && relatorio.recomendacoes.length > 0 && (
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-3">Recomendações</h5>
                <div className="space-y-2">
                  {relatorio.recomendacoes.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentos Anexos */}
            {relatorio.anexos && relatorio.anexos.length > 0 && (
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-3">Documentos Anexos</h5>
                <div className="space-y-2">
                  {relatorio.anexos.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium">{doc.nome}</p>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Ver
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadados */}
            <div className="border-t pt-4 text-xs text-muted-foreground">
              <p>Elaborado por: {relatorio.elaborado_por}</p>
              <p>
                Data de criação:{" "}
                {format(new Date(relatorio.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </p>
              {relatorio.publicado_em && (
                <p>
                  Publicado em:{" "}
                  {format(new Date(relatorio.publicado_em), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ========== CONTA A PAGAR ==========
  if (tipo === "conta_pagar") {
    const conta = item as ContaPagar;

    const getStatusBadge = (status: string) => {
      const badges: Record<string, { label: string; color: string }> = {
        pendente: { label: "Pendente", color: "bg-yellow-500" },
        vencida: { label: "Vencida", color: "bg-red-500" },
        paga: { label: "Paga", color: "bg-green-500" },
        cancelada: { label: "Cancelada", color: "bg-gray-500" },
      };
      const badge = badges[status] || badges.pendente;
      return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
    };

    const isVencida = conta.status === "vencida";
    const isPaga = conta.status === "paga";

    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detalhes da Conta a Pagar
            </DialogTitle>
            <DialogDescription>Informações completas da conta</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{conta.numero}</h3>
                  {getStatusBadge(conta.status)}
                </div>
                <p className="text-lg font-semibold">{conta.descricao}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="text-2xl font-bold text-red-600">
                  {conta.valor.toLocaleString("pt-AO")} AOA
                </p>
              </div>
            </div>

            {/* Alerta de Vencimento */}
            {isVencida && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <p className="font-semibold text-red-900">Conta Vencida</p>
                </div>
                <p className="text-sm text-red-700">
                  Esta conta está vencida. Realizar pagamento o quanto antes.
                </p>
              </div>
            )}

            {/* Informações do Fornecedor */}
            <div>
              <h5 className="font-semibold mb-3">Informações do Fornecedor</h5>
              <div className="border rounded-lg p-3 bg-muted space-y-2">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fornecedor</p>
                    <p className="text-sm font-medium">{conta.fornecedor}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalhes da Conta */}
            <div className="border-t pt-4">
              <h5 className="font-semibold mb-3">Detalhes</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Categoria</p>
                  <p className="text-sm font-medium capitalize">{conta.categoria}</p>
                </div>
                {conta.centro_custo && (
                  <div>
                    <p className="text-xs text-muted-foreground">Centro de Custo</p>
                    <p className="text-sm font-medium">{conta.centro_custo}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Data de Vencimento</p>
                    <p className="text-sm font-medium">
                      {format(new Date(conta.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {isPaga && conta.data_pagamento && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xs text-muted-foreground">Data de Pagamento</p>
                      <p className="text-sm font-medium">
                        {format(new Date(conta.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Observações */}
            {conta.observacoes && (
              <div className="border-t pt-4">
                <h5 className="font-semibold mb-2">Observações</h5>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{conta.observacoes}</p>
                </div>
              </div>
            )}

            {/* Status de Pagamento */}
            {isPaga && (
              <div className="border-t pt-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="font-semibold text-green-900">Pagamento Realizado</p>
                  </div>
                  {conta.data_pagamento && (
                    <p className="text-sm text-green-700">
                      Pago em:{" "}
                      {format(new Date(conta.data_pagamento), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return null;
}
