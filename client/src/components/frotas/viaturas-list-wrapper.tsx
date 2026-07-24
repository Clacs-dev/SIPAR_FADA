import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Car, Plus, Eye } from "lucide-react";
import { Viatura } from "./types";

interface ViaturasListWrapperProps {
  viaturas: Viatura[];
}

export function ViaturasListWrapper({ viaturas }: ViaturasListWrapperProps) {
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      disponivel: { label: 'Disponível', variant: 'default' },
      em_uso: { label: 'Em Uso', variant: 'secondary' },
      em_manutencao: { label: 'Em Manutenção', variant: 'destructive' },
      inativa: { label: 'Inativa', variant: 'outline' },
    };
    
    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Viaturas</h2>
          <p className="text-muted-foreground">
            {viaturas.length} viatura{viaturas.length !== 1 ? 's' : ''} registada{viaturas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Viatura
        </Button>
      </div>

      <div className="grid gap-4">
        {viaturas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Car className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Nenhuma viatura registada
              </p>
            </CardContent>
          </Card>
        ) : (
          viaturas.map((viatura) => (
            <Card key={viatura.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{viatura.matricula}</Badge>
                      {getStatusBadge(viatura.status)}
                      <Badge variant="outline">{viatura.tipo}</Badge>
                    </div>
                    <CardTitle className="text-lg">
                      {viatura.marca} {viatura.modelo}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {viatura.ano} • {viatura.cor} • {viatura.departamento}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Quilometragem:</span>
                    <p className="font-medium">{(viatura.km_atual ?? 0).toLocaleString()} km</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Combustível:</span>
                    <p className="font-medium">{viatura.combustivel}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Localização:</span>
                    <p className="font-medium">{viatura.localizacao_atual}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Seguro válido até:</span>
                    <p className="font-medium">
                      {new Date(viatura.seguro_validade).toLocaleDateString('pt-PT')}
                    </p>
                  </div>
                </div>
                
                {/* Alertas */}
                {(new Date(viatura.seguro_validade) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ||
                  new Date(viatura.inspecao_validade) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)) && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                      ⚠️ Alertas:
                    </p>
                    <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                      {new Date(viatura.seguro_validade) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                        <li>• Seguro próximo do vencimento</li>
                      )}
                      {new Date(viatura.inspecao_validade) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                        <li>• Inspeção próxima do vencimento</li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
