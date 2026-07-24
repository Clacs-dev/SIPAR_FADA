import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { toast } from "sonner@2.0.3";
import { MessageSquare, Send, Edit2, Trash2, Check, X } from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface Intervencao {
  id: string;
  participante_nome: string;
  participante_cargo: string;
  texto: string;
  timestamp: string;
  editado: boolean;
  editado_em?: string;
}

interface Discussao {
  ponto_ordem: number;
  ponto_titulo: string;
  texto_base: string;
  intervencoes: Intervencao[];
  texto_final?: string;
}

interface ActaCollaborativeEditorProps {
  actaId: string;
  discussoes: Discussao[];
  status: string;
  onRefresh: () => void;
}

export function ActaCollaborativeEditor({ 
  actaId, 
  discussoes, 
  status,
  onRefresh 
}: ActaCollaborativeEditorProps) {
  const { user, accessToken } = useAuth();
  const [expandedPontos, setExpandedPontos] = useState<Set<number>>(new Set());
  const [novaIntervencao, setNovaIntervencao] = useState<{ [key: number]: string }>({});
  const [editandoIntervencao, setEditandoIntervencao] = useState<string | null>(null);
  const [textoEditado, setTextoEditado] = useState("");
  const [loading, setLoading] = useState(false);

  // Verificar se pode editar (rascunho ou em_revisao)
  const podeEditar = ['rascunho', 'em_revisao'].includes(status);

  const togglePonto = (ordem: number) => {
    const newExpanded = new Set(expandedPontos);
    if (newExpanded.has(ordem)) {
      newExpanded.delete(ordem);
    } else {
      newExpanded.add(ordem);
    }
    setExpandedPontos(newExpanded);
  };

  const handleAdicionarIntervencao = async (pontoOrdem: number) => {
    const texto = novaIntervencao[pontoOrdem];
    if (!texto?.trim()) {
      toast.error('Por favor, escreva sua intervenção');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/actas/${actaId}/intervencoes`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ponto_ordem: pontoOrdem,
            texto: texto
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar intervenção');
      }

      toast.success('Intervenção adicionada com sucesso!');
      setNovaIntervencao({ ...novaIntervencao, [pontoOrdem]: '' });
      onRefresh();
    } catch (error: any) {
 console.error('Erro ao adicionar intervenção:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarIntervencao = async (intervencaoId: string) => {
    if (!textoEditado.trim()) {
      toast.error('Por favor, escreva o texto da intervenção');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/actas/${actaId}/intervencoes/${intervencaoId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            texto: textoEditado
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao editar intervenção');
      }

      toast.success('Intervenção editada com sucesso!');
      setEditandoIntervencao(null);
      setTextoEditado('');
      onRefresh();
    } catch (error: any) {
 console.error('Erro ao editar intervenção:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoverIntervencao = async (intervencaoId: string) => {
    if (!confirm('Tem certeza que deseja remover esta intervenção?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/actas/${actaId}/intervencoes/${intervencaoId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover intervenção');
      }

      toast.success('Intervenção removida com sucesso!');
      onRefresh();
    } catch (error: any) {
 console.error('Erro ao remover intervenção:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const iniciarEdicao = (intervencao: Intervencao) => {
    setEditandoIntervencao(intervencao.id);
    setTextoEditado(intervencao.texto);
  };

  const cancelarEdicao = () => {
    setEditandoIntervencao(null);
    setTextoEditado('');
  };

  const formatarData = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!discussoes || discussoes.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Nenhum ponto de agenda disponível para discussão
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Discussões e Intervenções</h3>
          <p className="text-sm text-muted-foreground">
            {podeEditar 
              ? 'Adicione suas intervenções aos pontos de agenda' 
              : 'Visualização das discussões (acta não editável)'}
          </p>
        </div>
        {!podeEditar && (
          <Badge variant="secondary">Somente Leitura</Badge>
        )}
      </div>

      {discussoes.map((discussao) => {
        const isExpanded = expandedPontos.has(discussao.ponto_ordem);
        const totalIntervencoes = discussao.intervencoes?.length || 0;

        return (
          <Card key={discussao.ponto_ordem}>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => togglePonto(discussao.ponto_ordem)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">
                    Ponto {discussao.ponto_ordem}: {discussao.ponto_titulo}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {totalIntervencoes} {totalIntervencoes === 1 ? 'intervenção' : 'intervenções'}
                  </CardDescription>
                </div>
                <Badge variant={isExpanded ? "default" : "outline"}>
                  {isExpanded ? 'Expandido' : 'Ver Discussão'}
                </Badge>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="space-y-4 border-t pt-4">
                {/* Lista de Intervenções */}
                <div className="space-y-3">
                  {discussao.intervencoes && discussao.intervencoes.length > 0 ? (
                    discussao.intervencoes.map((intervencao) => (
                      <div 
                        key={intervencao.id}
                        className="border rounded-lg p-4 bg-muted/30"
                      >
                        {/* Cabeçalho da Intervenção */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-primary" />
                              <span className="font-semibold text-sm">
                                {intervencao.participante_nome}
                              </span>
                              {intervencao.participante_cargo && (
                                <Badge variant="outline" className="text-xs">
                                  {intervencao.participante_cargo}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatarData(intervencao.timestamp)}
                              {intervencao.editado && intervencao.editado_em && (
                                <span className="ml-2">(editado em {formatarData(intervencao.editado_em)})</span>
                              )}
                            </p>
                          </div>

                          {/* Ações (apenas se for o autor e acta editável) */}
                          {podeEditar && intervencao.participante_nome === user?.name && (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => iniciarEdicao(intervencao)}
                                disabled={loading}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoverIntervencao(intervencao.id)}
                                disabled={loading}
                              >
                                <Trash2 className="h-3 w-3 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Texto da Intervenção */}
                        {editandoIntervencao === intervencao.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={textoEditado}
                              onChange={(e) => setTextoEditado(e.target.value)}
                              rows={4}
                              className="text-sm"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelarEdicao}
                                disabled={loading}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleEditarIntervencao(intervencao.id)}
                                disabled={loading}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Salvar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{intervencao.texto}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma intervenção registada neste ponto
                    </p>
                  )}
                </div>

                {/* Formulário para Nova Intervenção */}
                {podeEditar && (
                  <div className="border-t pt-4 space-y-3">
                    <label className="text-sm font-medium">
                      Adicionar sua intervenção
                    </label>
                    <Textarea
                      placeholder="Escreva aqui sua contribuição para este ponto de agenda..."
                      value={novaIntervencao[discussao.ponto_ordem] || ''}
                      onChange={(e) => setNovaIntervencao({
                        ...novaIntervencao,
                        [discussao.ponto_ordem]: e.target.value
                      })}
                      rows={4}
                      disabled={loading}
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={() => handleAdicionarIntervencao(discussao.ponto_ordem)}
                        disabled={loading || !novaIntervencao[discussao.ponto_ordem]?.trim()}
                      >
                        <Send className="h-3 w-3 mr-2" />
                        Enviar Intervenção
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
