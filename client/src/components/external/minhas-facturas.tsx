import { useState, useEffect } from "react";
import { FileText, Plus, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { SubmitFacturaForm } from "./submit-factura-form";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface Factura {
  id: string;
  numero: string;
  numero_fornecedor: string;
  data_emissao: string;
  data_vencimento: string;
  total: number;
  moeda: string;
  status: string;
  descricao: string;
  created_at: string;
  validacao_comentario?: string;
  aprovacao_comentario?: string;
  rejeicao_motivo?: string;
}

export function MinhasFacturas() {
  const { user, accessToken } = useAuth();
  const [view, setView] = useState<'list' | 'form' | 'details'>('list');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFacturas = async () => {
    if (!accessToken) {
 console.log('Sem token de acesso');
      return;
    }

    setLoading(true);
    setError(null);
    try {
 console.log('Carregando facturas do fornecedor externo...');
      
      const response = await fetch(
        `${API_BASE_URL}/facturas`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

 console.log('Resposta da API:', response.status);

      if (response.ok) {
        const data = await response.json();
 console.log('Dados recebidos:', data);
 console.log('Número de facturas:', data.facturas?.length || 0);
        setFacturas(data.facturas || []);
      } else {
        const errorData = await response.json();
 console.error('Erro ao carregar facturas:', errorData);
        setError(errorData.error || 'Erro ao carregar facturas');
      }
    } catch (error) {
 console.error('Erro ao carregar facturas:', error);
      setError('Erro de conexão ao carregar facturas');
    } finally {
      setLoading(false);
    }
  };

  // Carregar facturas ao montar e quando accessToken mudar
  useEffect(() => {
    loadFacturas();
  }, [accessToken]);

  const getStatusBadge = (status: string) => {
    const badges = {
      registada: { label: 'Registada', color: 'bg-blue-500', icon: Clock },
      rascunho: { label: 'Rascunho', color: 'bg-gray-500', icon: Clock },
      pendente: { label: 'Pendente', color: 'bg-blue-500', icon: Clock },
      em_validacao: { label: 'Em Validação', color: 'bg-purple-500', icon: Clock },
      validado: { label: 'Validado', color: 'bg-purple-500', icon: CheckCircle },
      aprovada: { label: 'Aprovada', color: 'bg-green-500', icon: CheckCircle },
      aprovado: { label: 'Aprovado', color: 'bg-green-500', icon: CheckCircle },
      rejeitada: { label: 'Rejeitada', color: 'bg-red-500', icon: XCircle },
      rejeitado: { label: 'Rejeitado', color: 'bg-red-500', icon: XCircle },
      submetido_ao_banco: { label: 'Submetido ao Banco', color: 'bg-indigo-500', icon: CheckCircle },
      paga: { label: 'Paga', color: 'bg-green-700', icon: CheckCircle },
      pago: { label: 'Pago', color: 'bg-green-700', icon: CheckCircle },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number, moeda: string = 'AOA') => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: moeda,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const stats = {
    total: facturas.length,
    registadas: facturas.filter((f) => ['registada', 'rascunho', 'pendente'].includes(f.status)).length,
    em_validacao: facturas.filter((f) => f.status === 'em_validacao').length,
    aprovadas: facturas.filter((f) => ['aprovada', 'aprovado'].includes(f.status)).length,
    rejeitadas: facturas.filter((f) => ['rejeitada', 'rejeitado'].includes(f.status)).length,
    pagas: facturas.filter((f) => ['paga', 'pago'].includes(f.status)).length,
  };

 console.log(' Estatísticas de facturas:', stats);
 console.log(' Status de todas as facturas:', facturas.map(f => ({ numero: f.numero, status: f.status })));

  if (view === 'form') {
    return (
      <SubmitFacturaForm
        onCancel={() => {
          setView('list');
          loadFacturas(); // Recarregar lista
        }}
        onSuccess={() => {
          setView('list');
          loadFacturas(); // Recarregar lista
        }}
      />
    );
  }

  if (view === 'details' && selectedFactura) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Detalhes da Factura</h1>
            <p className="text-muted-foreground mt-1">
              {selectedFactura.numero}
            </p>
          </div>
          <Button variant="outline" onClick={() => setView('list')}>
            Voltar
          </Button>
        </div>

        {/* Informações */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedFactura.numero}</Badge>
                  {getStatusBadge(selectedFactura.status)}
                </div>
                <CardTitle>{selectedFactura.descricao}</CardTitle>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(selectedFactura.total, selectedFactura.moeda)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nº Factura Fornecedor</p>
                <p className="font-medium">{selectedFactura.numero_fornecedor}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Emissão</p>
                <p className="font-medium">{formatDate(selectedFactura.data_emissao)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Vencimento</p>
                <p className="font-medium">{formatDate(selectedFactura.data_vencimento)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submetida em</p>
                <p className="font-medium">{formatDate(selectedFactura.created_at)}</p>
              </div>
            </div>

            {/* Feedback */}
            {selectedFactura.validacao_comentario && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="font-medium text-purple-900 mb-1">Comentário de Validação</p>
                <p className="text-sm text-purple-700">{selectedFactura.validacao_comentario}</p>
              </div>
            )}

            {selectedFactura.aprovacao_comentario && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="font-medium text-green-900 mb-1">Comentário de Aprovação</p>
                <p className="text-sm text-green-700">{selectedFactura.aprovacao_comentario}</p>
              </div>
            )}

            {selectedFactura.rejeicao_motivo && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-medium text-red-900 mb-1">Motivo de Rejeição</p>
                <p className="text-sm text-red-700">{selectedFactura.rejeicao_motivo}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <FileText className="h-6 w-6" />
            Minhas Facturas
          </h1>
          <p className="text-muted-foreground mt-1">
            Submeta e acompanhe o estado das suas facturas
          </p>
        </div>
        <Button onClick={() => setView('form')}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Factura
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.registadas}</p>
              <p className="text-xs text-muted-foreground mt-1">Registadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.em_validacao}</p>
              <p className="text-xs text-muted-foreground mt-1">Em Validação</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.aprovadas}</p>
              <p className="text-xs text-muted-foreground mt-1">Aprovadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.rejeitadas}</p>
              <p className="text-xs text-muted-foreground mt-1">Rejeitadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-700">{stats.pagas}</p>
              <p className="text-xs text-muted-foreground mt-1">Pagas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="todas">
        <TabsList>
          <TabsTrigger value="todas">
            Todas ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="pendentes">
            <Clock className="mr-2 h-4 w-4" />
            Pendentes ({stats.registadas + stats.em_validacao})
          </TabsTrigger>
          <TabsTrigger value="aprovadas">
            <CheckCircle className="mr-2 h-4 w-4" />
            Aprovadas ({stats.aprovadas})
          </TabsTrigger>
          <TabsTrigger value="pagas">
            <CheckCircle className="mr-2 h-4 w-4" />
            Pagas ({stats.pagas})
          </TabsTrigger>
          <TabsTrigger value="rejeitadas">
            <XCircle className="mr-2 h-4 w-4" />
            Rejeitadas ({stats.rejeitadas})
          </TabsTrigger>
        </TabsList>

        {/* Todas */}
        <TabsContent value="todas" className="space-y-4">
          {/* Mensagem de erro */}
          {error && (
            <Card className="border-red-500">
              <CardContent className="py-6 text-center">
                <p className="text-red-600 font-semibold mb-2">Erro ao carregar facturas</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button onClick={loadFacturas} variant="outline" className="mt-4">
                  Tentar Novamente
                </Button>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">A carregar...</p>
              </CardContent>
            </Card>
          ) : facturas.length === 0 && !error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Ainda não submeteu nenhuma factura
                </p>
                <Button onClick={() => setView('form')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Submeter Primeira Factura
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {facturas.map((factura) => (
                <Card
                  key={factura.id}
                  className="hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedFactura(factura);
                    setView('details');
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{factura.numero}</Badge>
                          {getStatusBadge(factura.status)}
                          <Badge variant="outline">{factura.moeda}</Badge>
                        </div>
                        <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-muted-foreground">
                            <strong>Nº Fornecedor:</strong> {factura.numero_fornecedor}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            <strong>Vencimento:</strong> {formatDate(factura.data_vencimento)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(factura.total, factura.moeda)}
                        </p>
                        <Button variant="ghost" size="sm" className="mt-2">
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Pendentes */}
        <TabsContent value="pendentes" className="space-y-4">
          <div className="grid gap-4">
            {facturas
              .filter((f) => ['registada', 'rascunho', 'pendente', 'em_validacao'].includes(f.status))
              .map((factura) => (
                <Card
                  key={factura.id}
                  className="hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedFactura(factura);
                    setView('details');
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{factura.numero}</Badge>
                          {getStatusBadge(factura.status)}
                        </div>
                        <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(factura.total, factura.moeda)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Aprovadas */}
        <TabsContent value="aprovadas" className="space-y-4">
          <div className="grid gap-4">
            {facturas
              .filter((f) => ['aprovada', 'aprovado', 'paga'].includes(f.status))
              .map((factura) => (
                <Card
                  key={factura.id}
                  className="hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedFactura(factura);
                    setView('details');
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{factura.numero}</Badge>
                          {getStatusBadge(factura.status)}
                        </div>
                        <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(factura.total, factura.moeda)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Pagas */}
        <TabsContent value="pagas" className="space-y-4">
          <div className="grid gap-4">
            {facturas
              .filter((f) => ['paga', 'pago'].includes(f.status))
              .length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhuma factura paga</p>
                </CardContent>
              </Card>
            ) : (
              facturas
                .filter((f) => ['paga', 'pago'].includes(f.status))
                .map((factura) => (
                  <Card
                    key={factura.id}
                    className="hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedFactura(factura);
                      setView('details');
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{factura.numero}</Badge>
                            {getStatusBadge(factura.status)}
                            <Badge variant="outline">{factura.moeda}</Badge>
                          </div>
                          <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-muted-foreground">
                              <strong>Nº Fornecedor:</strong> {factura.numero_fornecedor}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <strong>Vencimento:</strong> {formatDate(factura.data_vencimento)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-700">
                            {formatCurrency(factura.total, factura.moeda)}
                          </p>
                          <Badge className="mt-2 bg-green-100 text-green-800">
                            ✓ Pagamento Concluído
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
            )}
          </div>
        </TabsContent>

        {/* Rejeitadas */}
        <TabsContent value="rejeitadas" className="space-y-4">
          <div className="grid gap-4">
            {facturas
              .filter((f) => ['rejeitada', 'rejeitado'].includes(f.status))
              .map((factura) => (
                <Card
                  key={factura.id}
                  className="hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedFactura(factura);
                    setView('details');
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{factura.numero}</Badge>
                          {getStatusBadge(factura.status)}
                        </div>
                        <CardTitle className="text-lg">{factura.descricao}</CardTitle>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(factura.total, factura.moeda)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}