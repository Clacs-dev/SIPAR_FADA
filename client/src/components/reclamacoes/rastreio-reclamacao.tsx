/**
 * Página Pública de Rastreio de Reclamação
 * Permite que usuários externos acompanhem e fechem suas reclamações
 */

import { useState } from "react";
import { Search, Loader2, CheckCircle2, Star, Calendar, User, FileText, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { toast } from "sonner@2.0.3";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import type { Reclamacao } from "./types";

export function RastreioReclamacao() {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [reclamacao, setReclamacao] = useState<Reclamacao | null>(null);
  const [showFechamento, setShowFechamento] = useState(false);
  const [satisfacao, setSatisfacao] = useState<number>(0);
  const [comentario, setComentario] = useState("");
  const [loadingFechar, setLoadingFechar] = useState(false);

  const handleBuscar = async () => {
    if (!codigo.trim()) {
      toast.error("Por favor, insira o código de rastreio");
      return;
    }

    setLoading(true);
    try {
      // Fazer URL encoding do código para evitar problemas com caracteres especiais
      const codigoEncoded = encodeURIComponent(codigo.trim());
      
 console.log(' Buscando reclamação com código:', codigo);
 console.log(' URL encoded:', codigoEncoded);
      
      const response = await fetch(
        `${API_BASE_URL}/reclamacoes/rastreio/${codigoEncoded}`,
        {
          headers: {
            ...getAuthHeaders(false),
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
 console.error(' Erro na resposta:', errorData);
        throw new Error(errorData.error || "Código de rastreio inválido");
      }

      const data = await response.json();
 console.log(' Reclamação encontrada:', data);
      setReclamacao(data.reclamacao);
      toast.success("Reclamação encontrada!");
    } catch (error: any) {
 console.error("Erro ao buscar reclamação:", error);
      toast.error(error.message || "Erro ao buscar reclamação");
      setReclamacao(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFechar = async () => {
    if (!reclamacao) return;

    if (satisfacao === 0) {
      toast.error("Por favor, selecione uma avaliação");
      return;
    }

    setLoadingFechar(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/reclamacoes/${reclamacao.id}/fechar-publica`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(false),
          },
          body: JSON.stringify({
            codigo_rastreio: codigo,
            satisfacao,
            comentario,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao fechar reclamação");
      }

      toast.success("Reclamação fechada com sucesso! Obrigado pelo seu feedback.");
      setShowFechamento(false);
      
      // Atualizar reclamação
      handleBuscar();
    } catch (error: any) {
 console.error("Erro ao fechar reclamação:", error);
      toast.error(error.message || "Erro ao fechar reclamação");
    } finally {
      setLoadingFechar(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      registrado: { label: "Registado", color: "bg-blue-500", icon: FileText },
      em_resolucao: { label: "Em Resolução", color: "bg-orange-500", icon: AlertCircle },
      resolvido: { label: "Resolvido", color: "bg-green-500", icon: CheckCircle2 },
      fechado: { label: "Fechado", color: "bg-gray-600", icon: CheckCircle2 },
    };
    const badge = badges[status as keyof typeof badges] || badges.registrado;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Rastrear Reclamação</h2>
        <p className="text-muted-foreground">
          Insira o código de rastreio que recebeu por email
        </p>
      </div>

      {/* Formulário de Busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Ex: REC/2026/02/0001 ou REC/2026/02/0001-ABC123"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === "Enter" && handleBuscar()}
              />
            </div>
            <Button onClick={handleBuscar} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da Reclamação */}
      {reclamacao && (
        <Card>
          <CardContent className="pt-6 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold mb-2">{reclamacao.numero}</h3>
                {reclamacao.codigo_rastreio && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Código de Rastreio: <span className="font-mono font-medium text-blue-600">{reclamacao.codigo_rastreio}</span>
                  </p>
                )}
                <p className="font-medium">{reclamacao.assunto}</p>
              </div>
              {getStatusBadge(reclamacao.status)}
            </div>

            {/* Informações */}
            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Data de Submissão</p>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(reclamacao.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {reclamacao.responsavel_nome && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Responsável</p>
                  <p className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {reclamacao.responsavel_nome}
                  </p>
                </div>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Descrição</p>
              <p className="text-sm bg-muted p-3 rounded-lg">{reclamacao.descricao}</p>
            </div>

            {/* Solução (se resolvida) */}
            {reclamacao.solucao && (
              <div className="space-y-2 border-t pt-4">
                <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Solução Apresentada
                </p>
                <p className="text-sm bg-green-50 border border-green-200 p-3 rounded-lg">
                  {reclamacao.solucao}
                </p>
              </div>
            )}

            {/* Botão de Fechar (apenas se resolvida e ainda não fechada) */}
            {reclamacao.status === 'resolvido' && !showFechamento && (
              <div className="border-t pt-4">
                <Button 
                  onClick={() => setShowFechamento(true)}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirmar Resolução e Fechar
                </Button>
              </div>
            )}

            {/* Formulário de Fechamento */}
            {showFechamento && (
              <div className="border-t pt-4 space-y-4">
                <h4 className="font-semibold">Avalie a Resolução</h4>
                
                <div className="space-y-2">
                  <Label>Satisfação *</Label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSatisfacao(star)}
                        className="transition-colors"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= satisfacao
                              ? "text-yellow-500 fill-yellow-500"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comentario">Comentário (opcional)</Label>
                  <Textarea
                    id="comentario"
                    placeholder="Deixe um comentário sobre a resolução..."
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleFechar}
                    disabled={loadingFechar || satisfacao === 0}
                    className="flex-1"
                  >
                    {loadingFechar ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A fechar...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirmar e Fechar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowFechamento(false)}
                    disabled={loadingFechar}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {/* Já fechada */}
            {reclamacao.status === 'fechado' && (
              <div className="border-t pt-4">
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg space-y-2">
                  <p className="font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-gray-600" />
                    Reclamação Fechada
                  </p>
                  {reclamacao.satisfacao_cliente && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Avaliação:</span>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= reclamacao.satisfacao_cliente!
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {reclamacao.comentario_fechamento && (
                    <p className="text-sm text-muted-foreground">
                      "{reclamacao.comentario_fechamento}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}