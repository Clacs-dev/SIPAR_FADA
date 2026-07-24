import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Users,
  Car,
  CheckCircle,
  XCircle,
  Send,
  Edit,
  Clock,
  FileText,
  AlertTriangle
} from "lucide-react";
import { PedidoViatura, PedidoViaturaStatus } from "./pedidos-viatura-types";

interface PedidoViaturaDetailsProps {
  pedido: PedidoViatura;
  canEdit: boolean;
  canSubmit: boolean;
  canApprove: boolean;
  canAssign: boolean;
  onBack: () => void;
  onEdit: () => void;
  onSubmit: () => void;
  onApprove: () => void;
  onReject: () => void;
  onAssign: () => void;
  onCancel: () => void;
}

export function PedidoViaturaDetails({
  pedido,
  canEdit,
  canSubmit,
  canApprove,
  canAssign,
  onBack,
  onEdit,
  onSubmit,
  onApprove,
  onReject,
  onAssign,
  onCancel
}: PedidoViaturaDetailsProps) {
  
  const getStatusBadge = (status: PedidoViaturaStatus | string) => {
    const badges = {
      rascunho: { 
        label: "Rascunho", 
        className: "bg-gray-200 text-gray-800",
        icon: Edit 
      },
      submetido: { 
        label: "Submetido", 
        className: "bg-blue-500 text-white",
        icon: Send 
      },
      aprovado: { 
        label: "Aprovado", 
        className: "bg-green-500 text-white",
        icon: CheckCircle 
      },
      rejeitado: { 
        label: "Rejeitado", 
        className: "bg-red-500 text-white",
        icon: XCircle 
      },
      em_viagem: { 
        label: "Em Viagem", 
        className: "bg-purple-500 text-white",
        icon: Car 
      },
      concluido: { 
        label: "Concluído", 
        className: "bg-gray-600 text-white",
        icon: CheckCircle 
      },
      cancelado: { 
        label: "Cancelado", 
        className: "bg-gray-400 text-white",
        icon: XCircle 
      },
    };
    const statusAliases: Record<string, keyof typeof badges> = {
      pendente: 'submetido',
      aprovado: 'aprovado',
      rejeitado: 'rejeitado',
      cancelada: 'cancelado',
      arquivado: 'cancelado',
      active: 'aprovado',
      inactive: 'cancelado',
    };
    const normalizedStatus = statusAliases[status] || status;
    const badge = badges[normalizedStatus as keyof typeof badges] || {
      label: status || 'Desconhecido',
      className: "bg-gray-200 text-gray-800",
      icon: AlertTriangle,
    };
    const Icon = badge.icon;
    return (
      <Badge className={badge.className}>
        <Icon className="mr-1 h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const badges = {
      baixa: { label: "Baixa", className: "bg-gray-200 text-gray-800" },
      normal: { label: "Normal", className: "bg-blue-200 text-blue-800" },
      alta: { label: "Alta", className: "bg-orange-200 text-orange-800" },
      urgente: { label: "Urgente", className: "bg-red-200 text-red-800" },
    };
    const badge = badges[prioridade as keyof typeof badges] || badges.normal;
    return <Badge className={badge.className}>{badge.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT');
  };

  const formatDateTime = (date: string, time: string) => {
    return `${formatDate(date)} às ${time}`;
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
              <MapPin className="h-6 w-6" />
              Pedido de Viatura #{pedido.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground">
              {pedido.destino}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2">
          {/* Editar (apenas em rascunho) */}
          {canEdit && pedido.status === 'rascunho' && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}

          {/* Submeter (de rascunho para submetido) */}
          {canSubmit && pedido.status === 'rascunho' && (
            <Button onClick={onSubmit}>
              <Send className="mr-2 h-4 w-4" />
              Submeter Pedido
            </Button>
          )}

          {/* Aprovar (Gerente/Admin) */}
          {canApprove && pedido.status === 'submetido' && (
            <>
              <Button variant="outline" onClick={onReject} className="text-red-600">
                <XCircle className="mr-2 h-4 w-4" />
                Rejeitar
              </Button>
              <Button onClick={onApprove} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" />
                Aprovar
              </Button>
            </>
          )}

          {/* Atribuir Viatura (Operador/Admin em pedido aprovado) */}
          {canAssign && pedido.status === 'aprovado' && !pedido.viatura_atribuida_id && (
            <Button onClick={onAssign}>
              <Car className="mr-2 h-4 w-4" />
              Atribuir Viatura
            </Button>
          )}

          {/* Cancelar */}
          {(pedido.status === 'rascunho' || pedido.status === 'submetido') && (
            <Button variant="destructive" onClick={onCancel}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar Pedido
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex gap-2 items-center">
        {getStatusBadge(pedido.status)}
        {getPrioridadeBadge(pedido.prioridade)}
        {pedido.viatura_atribuida_matricula && (
          <Badge variant="outline" className="bg-green-50">
            <Car className="mr-1 h-3 w-3" />
            {pedido.viatura_atribuida_matricula}
          </Badge>
        )}
      </div>

      {/* Alertas */}
      {pedido.status === 'rejeitado' && pedido.motivo_rejeicao && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pedido Rejeitado:</strong> {pedido.motivo_rejeicao}
            <br />
            <span className="text-sm">Por: {pedido.rejeitado_por_nome} em {formatDate(pedido.rejeitado_em!)}</span>
          </AlertDescription>
        </Alert>
      )}

      {pedido.status === 'submetido' && (
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Pedido aguarda análise da gestão. Será notificado quando houver uma decisão.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Coluna Principal */}
        <div className="md:col-span-2 space-y-6">
          {/* Dados da Viagem */}
          <Card>
            <CardHeader>
              <CardTitle>Dados da Viagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Origem
                  </p>
                  <p className="font-medium">{pedido.itinerario?.split(' -> ')[0] || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Destino
                  </p>
                  <p className="font-medium">{pedido.destino}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Saída
                  </p>
                  <p className="font-medium">
                    {formatDateTime(pedido.data_inicio_pretendida, pedido.hora_inicio_pretendida)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Retorno
                  </p>
                  <p className="font-medium">
                    {formatDateTime(pedido.data_fim_pretendida, pedido.hora_fim_pretendida)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Finalidade</p>
                <div className="p-3 bg-accent rounded-lg">
                  <p className="text-sm">{pedido.finalidade}</p>
                </div>
              </div>

              {pedido.observacoes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Observações</p>
                  <div className="p-3 bg-accent rounded-lg">
                    <p className="text-sm">{pedido.observacoes}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Passageiros */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Passageiros
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Número de Passageiros</p>
                <p className="font-medium text-lg">{pedido.numero_passageiros}</p>
              </div>
              
              {pedido.lista_passageiros && pedido.lista_passageiros.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Lista de Passageiros:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {pedido.lista_passageiros.map((passageiro, index) => (
                      <li key={index} className="text-sm">{passageiro}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Atribuição */}
          {(pedido.viatura_atribuida_id || pedido.motorista_atribuido_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Viatura e Motorista Atribuídos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pedido.viatura_atribuida_matricula && (
                  <div>
                    <p className="text-sm text-muted-foreground">Viatura</p>
                    <p className="font-medium text-lg">{pedido.viatura_atribuida_matricula}</p>
                  </div>
                )}
                
                {pedido.motorista_atribuido_nome && (
                  <div>
                    <p className="text-sm text-muted-foreground">Motorista</p>
                    <p className="font-medium">{pedido.motorista_atribuido_nome}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Histórico de Aprovação */}
          {(pedido.aprovado_por_nome || pedido.rejeitado_por_nome) && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Decisão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pedido.aprovado_por_nome && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Aprovado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Por: {pedido.aprovado_por_nome}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Em: {formatDate(pedido.aprovado_em!)}
                    </p>
                    {pedido.notas_aprovacao && (
                      <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                        {pedido.notas_aprovacao}
                      </div>
                    )}
                  </div>
                )}

                {pedido.rejeitado_por_nome && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Rejeitado</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Por: {pedido.rejeitado_por_nome}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Em: {formatDate(pedido.rejeitado_em!)}
                    </p>
                    {pedido.motivo_rejeicao && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                        <strong>Motivo:</strong> {pedido.motivo_rejeicao}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Solicitante */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Solicitante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome
                </p>
                <p className="font-medium">{pedido.solicitante_nome}</p>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Departamento</p>
                <p className="font-medium">{pedido.departamento}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{pedido.telefone}</p>
              </div>

              {pedido.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-sm">{pedido.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferências */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Preferências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pedido.tipo_viatura_pretendida && (
                <div>
                  <p className="text-sm text-muted-foreground">Tipo de Viatura</p>
                  <Badge variant="outline">{pedido.tipo_viatura_pretendida}</Badge>
                </div>
              )}
              
              {pedido.motorista_pretendido_nome && (
                <div>
                  <p className="text-sm text-muted-foreground">Motorista Solicitado</p>
                  <p className="font-medium">{pedido.motorista_pretendido_nome}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Registo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Criado por</p>
                <p className="font-medium">{pedido.created_by_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data</p>
                <p className="font-medium">
                  {formatDate(pedido.created_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
