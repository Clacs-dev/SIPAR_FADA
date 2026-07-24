import { useState } from "react";
import { 
  Car, 
  Calendar, 
  User, 
  Fuel,
  Wrench,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Edit,
  MapPin,
  Clock,
  FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Viatura, Utilizacao, Manutencao, Motorista } from "./types";
import { UtilizacaoForm, UtilizacaoFormData } from "./utilizacao-form";
import { ManutencaoForm, ManutencaoFormData } from "./manutencao-form";

interface ViaturaDetailsProps {
  viatura: Viatura;
  utilizacoes: Utilizacao[];
  manutencoes: Manutencao[];
  motoristas: Motorista[];
  canEdit: boolean;
  onBack: () => void;
  onEdit: () => void;
  onNovaUtilizacao: (data: UtilizacaoFormData) => void;
  onNovaManutencao: (data: ManutencaoFormData) => void;
}

export function ViaturaDetails({
  viatura,
  utilizacoes,
  manutencoes,
  motoristas,
  canEdit,
  onBack,
  onEdit,
  onNovaUtilizacao,
  onNovaManutencao
}: ViaturaDetailsProps) {
  const [showUtilizacaoForm, setShowUtilizacaoForm] = useState(false);
  const [showManutencaoForm, setShowManutencaoForm] = useState(false);

  const handleSubmitUtilizacao = async (data: UtilizacaoFormData) => {
    await onNovaUtilizacao(data);
    setShowUtilizacaoForm(false);
  };

  const handleSubmitManutencao = async (data: ManutencaoFormData) => {
    await onNovaManutencao(data);
    setShowManutencaoForm(false);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      rascunho: { label: 'Rascunho', color: 'bg-gray-400' },
      disponivel: { label: 'Disponível', color: 'bg-green-500' },
      em_uso: { label: 'Em Uso', color: 'bg-blue-500' },
      em_manutencao: { label: 'Em Manutenção', color: 'bg-yellow-500' },
      inativa: { label: 'Inativa', color: 'bg-gray-500' },
    };
    const badge = badges[status as keyof typeof badges] || badges.disponivel;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-PT').format(value);
  };

  const isSeguroVencido = viatura.seguro_validade && 
    new Date(viatura.seguro_validade) < new Date();

  const isInspecaoVencida = viatura.inspecao_validade && 
    new Date(viatura.inspecao_validade) < new Date();

  const isRevisaoProxima = viatura.km_proxima_revisao && 
    viatura.km_atual >= (viatura.km_proxima_revisao - 1000);

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
              <Car className="h-6 w-6" />
              {viatura.matricula}
            </h1>
            <p className="text-muted-foreground">
              {viatura.marca} {viatura.modelo} ({viatura.ano})
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          {viatura.status === 'disponivel' && (
            <Button onClick={() => setShowUtilizacaoForm(true)}>
              <MapPin className="mr-2 h-4 w-4" />
              Nova Utilização
            </Button>
          )}
          <Button variant="outline" onClick={() => setShowManutencaoForm(true)}>
            <Wrench className="mr-2 h-4 w-4" />
            Nova Manutenção
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-2">
        {getStatusBadge(viatura.status)}
        <Badge variant="outline">{viatura.tipo}</Badge>
        <Badge variant="outline">{viatura.combustivel}</Badge>
        {isSeguroVencido && (
          <Badge className="bg-red-500 text-white">
            ⚠️ Seguro Vencido
          </Badge>
        )}
        {isInspecaoVencida && (
          <Badge className="bg-red-500 text-white">
            ⚠️ Inspecção Vencida
          </Badge>
        )}
        {isRevisaoProxima && (
          <Badge className="bg-yellow-500 text-white">
            ⚠️ Revisão Próxima
          </Badge>
        )}
      </div>

      {/* Alertas */}
      {(isSeguroVencido || isInspecaoVencida || isRevisaoProxima) && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 space-y-2">
            {isSeguroVencido && (
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  Seguro vencido desde{' '}
                  {new Date(viatura.seguro_validade!).toLocaleDateString('pt-PT')}
                </span>
              </div>
            )}
            {isInspecaoVencida && (
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  Inspecção vencida desde{' '}
                  {new Date(viatura.inspecao_validade!).toLocaleDateString('pt-PT')}
                </span>
              </div>
            )}
            {isRevisaoProxima && (
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  Revisão próxima: {formatNumber(viatura.km_proxima_revisao!)} km
                  (actual: {formatNumber(viatura.km_atual)} km)
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Coluna Principal - 2/3 */}
        <div className="md:col-span-2 space-y-6">
          {/* Informações da Viatura */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Viatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Matrícula</p>
                  <p className="font-medium">{viatura.matricula}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Chassis</p>
                  <p className="font-medium">{viatura.chassis || 'N/A'}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Marca</p>
                  <p className="font-medium">{viatura.marca}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Modelo</p>
                  <p className="font-medium">{viatura.modelo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ano</p>
                  <p className="font-medium">{viatura.ano}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{viatura.tipo}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Combustível</p>
                  <p className="font-medium capitalize">{viatura.combustivel}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cor</p>
                  <p className="font-medium">{viatura.cor || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lugares</p>
                  <p className="font-medium">{viatura.lugares}</p>
                </div>
              </div>

              {viatura.cilindrada && (
                <div>
                  <p className="text-sm text-muted-foreground">Cilindrada</p>
                  <p className="font-medium">{viatura.cilindrada}</p>
                </div>
              )}

              {viatura.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Observações</p>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-sm">{viatura.observacoes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Kilometragem */}
          <Card>
            <CardHeader>
              <CardTitle>Kilometragem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Kilometragem Actual</p>
                  <p className="text-2xl font-bold">{formatNumber(viatura.km_atual)} km</p>
                </div>
                {viatura.km_proxima_revisao && (
                  <div>
                    <p className="text-sm text-muted-foreground">Próxima Revisão</p>
                    <p className="text-2xl font-bold">{formatNumber(viatura.km_proxima_revisao)} km</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Custos */}
          <Card>
            <CardHeader>
              <CardTitle>Custos Acumulados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {viatura.custo_aquisicao && viatura.custo_aquisicao > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      Aquisição
                    </p>
                    <p className="text-xl font-bold">{formatCurrency(viatura.custo_aquisicao)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    Combustível
                  </p>
                  <p className="text-xl font-bold">{formatCurrency(viatura.custo_total_combustivel)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Manutenção
                  </p>
                  <p className="text-xl font-bold">{formatCurrency(viatura.custo_total_manutencao)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Últimas Utilizações */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Últimas Utilizações ({utilizacoes.length})</CardTitle>
                {viatura.status === 'disponivel' && (
                  <Button size="sm" onClick={() => setShowUtilizacaoForm(true)}>
                    <MapPin className="mr-2 h-4 w-4" />
                    Nova Utilização
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {utilizacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma utilização registada
                </p>
              ) : (
                <div className="space-y-3">
                  {utilizacoes.slice(0, 5).map((utilizacao) => (
                    <div key={utilizacao.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{utilizacao.destino}</p>
                          <p className="text-sm text-muted-foreground">
                            {utilizacao.motorista_nome}
                          </p>
                        </div>
                        <Badge variant={utilizacao.status === 'em_curso' ? 'default' : 'outline'}>
                          {utilizacao.status === 'em_curso' ? 'Em Curso' : 'Concluída'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {new Date(utilizacao.data_saida).toLocaleDateString('pt-PT')}
                        </span>
                        {utilizacao.km_percorridos && (
                          <span>{formatNumber(utilizacao.km_percorridos)} km</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico de Manutenções */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Manutenções ({manutencoes.length})</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowManutencaoForm(true)}>
                  <Wrench className="mr-2 h-4 w-4" />
                  Nova Manutenção
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {manutencoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma manutenção registada
                </p>
              ) : (
                <div className="space-y-3">
                  {manutencoes.slice(0, 5).map((manutencao) => (
                    <div key={manutencao.id} className="p-3 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{manutencao.descricao}</p>
                          <p className="text-sm text-muted-foreground">
                            {manutencao.oficina}
                          </p>
                        </div>
                        <Badge variant={manutencao.status === 'concluida' ? 'outline' : 'default'}>
                          {manutencao.status === 'concluida' ? 'Concluída' : 
                           manutencao.status === 'em_andamento' ? 'Em Andamento' : 'Agendada'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {new Date(manutencao.data_entrada).toLocaleDateString('pt-PT')}
                        </span>
                        <span className="font-bold">{formatCurrency(manutencao.custo_total)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - 1/3 */}
        <div className="space-y-6">
          {/* Estado Actual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Estado Actual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                {getStatusBadge(viatura.status)}
              </div>

              {viatura.motorista_atual_nome && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Motorista Actual
                  </p>
                  <p className="font-medium">{viatura.motorista_atual_nome}</p>
                </div>
              )}

              {viatura.localizacao_atual && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localização
                  </p>
                  <p className="font-medium">{viatura.localizacao_atual}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Documentação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Documentação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {viatura.seguro_validade && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Validade do Seguro
                  </p>
                  <p className={`font-medium ${isSeguroVencido ? 'text-red-600' : ''}`}>
                    {new Date(viatura.seguro_validade).toLocaleDateString('pt-PT')}
                  </p>
                  {isSeguroVencido && (
                    <p className="text-xs text-red-600">Vencido</p>
                  )}
                </div>
              )}

              {viatura.inspecao_validade && (
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Validade da Inspecção
                  </p>
                  <p className={`font-medium ${isInspecaoVencida ? 'text-red-600' : ''}`}>
                    {new Date(viatura.inspecao_validade).toLocaleDateString('pt-PT')}
                  </p>
                  {isInspecaoVencida && (
                    <p className="text-xs text-red-600">Vencida</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Criação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Registo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Registado por</p>
                <p className="font-medium">{viatura.created_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {new Date(viatura.created_at).toLocaleDateString('pt-PT')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formulários */}
      {showUtilizacaoForm && (
        <UtilizacaoForm
          open={showUtilizacaoForm}
          onOpenChange={setShowUtilizacaoForm}
          viatura={viatura}
          motoristas={motoristas}
          onSubmit={handleSubmitUtilizacao}
        />
      )}

      {showManutencaoForm && (
        <ManutencaoForm
          open={showManutencaoForm}
          onOpenChange={setShowManutencaoForm}
          viatura={viatura}
          onSubmit={handleSubmitManutencao}
        />
      )}
    </div>
  );
}