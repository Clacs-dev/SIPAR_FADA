import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { 
  Calendar, 
  MapPin, 
  User, 
  Clock,
  Search,
  Plus,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { PedidoViatura, PedidoViaturaStatus, PedidoViaturaPrioridade } from "./pedidos-viatura-types";

interface PedidosViaturaListProps {
  pedidos: PedidoViatura[];
  onNovoPedido: () => void;
  onViewDetails: (pedido: PedidoViatura) => void;
  canCreate: boolean;
}

export function PedidosViaturaList({
  pedidos,
  onNovoPedido,
  onViewDetails,
  canCreate
}: PedidosViaturaListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<PedidoViaturaStatus | "">("");
  const [filterPrioridade, setFilterPrioridade] = useState<PedidoViaturaPrioridade | "">("");

  const getStatusBadge = (status: PedidoViaturaStatus) => {
    const badges = {
      rascunho: { label: "Rascunho", variant: "outline" as const, color: "text-gray-600" },
      submetido: { label: "Submetido", variant: "default" as const, color: "text-blue-600" },
      aprovado: { label: "Aprovado", variant: "default" as const, color: "text-green-600 bg-green-100" },
      rejeitado: { label: "Rejeitado", variant: "destructive" as const, color: "text-red-600" },
      cancelado: { label: "Cancelado", variant: "outline" as const, color: "text-gray-600" },
      em_viagem: { label: "Em Viagem", variant: "default" as const, color: "text-orange-600 bg-orange-100" },
      concluido: { label: "Concluído", variant: "outline" as const, color: "text-green-600" },
    };
    const badge = badges[status];
    
    // Fallback para status desconhecido
    if (!badge) {
 console.warn('Status desconhecido:', status);
      return (
        <Badge variant="outline" className="text-gray-600">
          {status}
        </Badge>
      );
    }
    
    return (
      <Badge variant={badge.variant} className={badge.color}>
        {badge.label}
      </Badge>
    );
  };

  const getPrioridadeBadge = (prioridade: PedidoViaturaPrioridade) => {
    const badges = {
      baixa: { label: "Baixa", color: "bg-gray-200 text-gray-800" },
      normal: { label: "Normal", color: "bg-blue-200 text-blue-800" },
      alta: { label: "Alta", color: "bg-orange-200 text-orange-800" },
      urgente: { label: "Urgente", color: "bg-red-200 text-red-800" },
    };
    const badge = badges[prioridade];
    return (
      <Badge className={badge.color}>
        {badge.label}
      </Badge>
    );
  };

  const filteredPedidos = pedidos.filter(pedido => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !pedido.solicitante_nome.toLowerCase().includes(term) &&
        !pedido.destino.toLowerCase().includes(term) &&
        !pedido.departamento.toLowerCase().includes(term)
      ) {
        return false;
      }
    }
    if (filterStatus && pedido.status !== filterStatus) return false;
    if (filterPrioridade && pedido.prioridade !== filterPrioridade) return false;
    return true;
  });

 console.log('[PEDIDOS LIST] Total de pedidos recebidos:', pedidos.length);
 console.log('[PEDIDOS LIST] Pedidos após filtros:', filteredPedidos.length);
 console.log('[PEDIDOS LIST] Filtros ativos - Status:', filterStatus, 'Prioridade:', filterPrioridade, 'Busca:', searchTerm);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT');
  };

  const formatDateTime = (date: string, time: string) => {
    return `${formatDate(date)} às ${time}`;
  };

  return (
    <div className="space-y-4">
      {/* Header com filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por solicitante, destino ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <select
              className="px-3 py-2 border border-input rounded-md bg-background"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="">Todos os estados</option>
              <option value="rascunho">Rascunho</option>
              <option value="submetido">Submetido</option>
              <option value="aprovado">Aprovado</option>
              <option value="rejeitado">Rejeitado</option>
              <option value="em_viagem">Em Viagem</option>
              <option value="cancelado">Cancelado</option>
              <option value="concluido">Concluído</option>
            </select>
            <select
              className="px-3 py-2 border border-input rounded-md bg-background"
              value={filterPrioridade}
              onChange={(e) => setFilterPrioridade(e.target.value as any)}
            >
              <option value="">Todas as prioridades</option>
              <option value="urgente">Urgente</option>
              <option value="alta">Alta</option>
              <option value="normal">Normal</option>
              <option value="baixa">Baixa</option>
            </select>
            {canCreate && (
              <Button onClick={onNovoPedido}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Pedido
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de pedidos */}
      {filteredPedidos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || filterStatus || filterPrioridade
                ? "Nenhum pedido encontrado com os filtros aplicados"
                : "Nenhum pedido de viatura registado"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPedidos.map((pedido) => (
            <Card
              key={pedido.id}
              className="hover:bg-accent cursor-pointer transition-colors"
              onClick={() => onViewDetails(pedido)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusBadge(pedido.status)}
                      {getPrioridadeBadge(pedido.prioridade)}
                      {pedido.viatura_atribuida_matricula && (
                        <Badge variant="outline" className="bg-green-50">
                          {pedido.viatura_atribuida_matricula}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        {pedido.destino}
                      </div>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {pedido.finalidade}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{pedido.solicitante_nome}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{pedido.departamento}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Início:</span>
                    <span className="font-medium">
                      {formatDateTime(pedido.data_inicio_pretendida, pedido.hora_inicio_pretendida)}
                    </span>
                  </div>

                  {pedido.numero_passageiros > 0 && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Passageiros:</span>
                      <span className="font-medium">{pedido.numero_passageiros}</span>
                    </div>
                  )}

                  {pedido.tipo_viatura_pretendida && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Tipo pretendido:</span>
                      <Badge variant="outline">{pedido.tipo_viatura_pretendida}</Badge>
                    </div>
                  )}

                  {pedido.motorista_atribuido_nome && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Motorista:</span>
                      <span className="font-medium">{pedido.motorista_atribuido_nome}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}