import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CheckCircle, PenTool, AlertCircle } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface DigitalSignatureProps {
  actaId: string;
  acta: any;
  onRefresh: () => void;
}

export function DigitalSignature({ actaId, acta, onRefresh }: DigitalSignatureProps) {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState(false);

  // Verificar se acta está aprovada (necessário para assinar)
  const podeAssinar = acta.status === 'aprovada';

  // Verificar se usuário é presidente ou secretário
  const ehPresidente = acta.participantes?.[0]?.nome === user?.name || 
                       acta.created_by_name === user?.name;
  
  const ehSecretario = acta.secretario_nome === user?.name;

  // Status das assinaturas
  const presidenteAssinou = acta.assinaturas?.presidente?.assinado || false;
  const secretarioAssinou = acta.assinaturas?.secretario?.assinado || false;

  const handleAssinar = async (tipo: 'presidente' | 'secretario') => {
    if (!podeAssinar) {
      toast.error('Apenas actas aprovadas podem ser assinadas');
      return;
    }

    if (tipo === 'presidente' && !ehPresidente) {
      toast.error('Apenas o presidente pode assinar como presidente');
      return;
    }

    if (tipo === 'secretario' && !ehSecretario) {
      toast.error('Apenas o secretário pode assinar como secretário');
      return;
    }

    const confirmMsg = tipo === 'presidente' 
      ? 'Confirma que deseja assinar esta acta como Presidente?'
      : 'Confirma que deseja assinar esta acta como Secretário(a)?';

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/actas/${actaId}/assinar`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tipo,
            timestamp: new Date().toISOString(),
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao assinar acta');
      }

      toast.success('Acta assinada digitalmente com sucesso!');
      onRefresh();
    } catch (error: any) {
 console.error('Erro ao assinar acta:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatarDataAssinatura = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Assinaturas Digitais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!podeAssinar && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <p className="text-sm text-amber-800">
              Acta deve estar aprovada para permitir assinaturas
            </p>
          </div>
        )}

        {/* Assinatura do Presidente */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Presidente</p>
              <p className="text-sm text-muted-foreground">
                {acta.participantes?.[0]?.nome || acta.created_by_name || '[Nome do Presidente]'}
              </p>
              <p className="text-xs text-muted-foreground">
                {acta.participantes?.[0]?.cargo || '[Cargo]'}
              </p>
            </div>
            {presidenteAssinou ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Assinado
              </Badge>
            ) : (
              <Badge variant="outline">Pendente</Badge>
            )}
          </div>

          {presidenteAssinou ? (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <p>Assinado digitalmente em:</p>
              <p className="font-mono">
                {formatarDataAssinatura(acta.assinaturas?.presidente?.data_assinatura)}
              </p>
            </div>
          ) : ehPresidente && podeAssinar ? (
            <Button
              size="sm"
              onClick={() => handleAssinar('presidente')}
              disabled={loading}
              className="w-full"
            >
              <PenTool className="h-3 w-3 mr-2" />
              Assinar como Presidente
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Aguardando assinatura do presidente
            </p>
          )}
        </div>

        {/* Assinatura do Secretário */}
        <div className="border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Secretário(a)</p>
              <p className="text-sm text-muted-foreground">
                {acta.secretario_nome || '[Nome do Secretário]'}
              </p>
              <p className="text-xs text-muted-foreground">
                {acta.secretario_cargo || '[Cargo]'}
              </p>
            </div>
            {secretarioAssinou ? (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="h-3 w-3 mr-1" />
                Assinado
              </Badge>
            ) : (
              <Badge variant="outline">Pendente</Badge>
            )}
          </div>

          {secretarioAssinou ? (
            <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              <p>Assinado digitalmente em:</p>
              <p className="font-mono">
                {formatarDataAssinatura(acta.assinaturas?.secretario?.data_assinatura)}
              </p>
            </div>
          ) : ehSecretario && podeAssinar ? (
            <Button
              size="sm"
              onClick={() => handleAssinar('secretario')}
              disabled={loading}
              className="w-full"
            >
              <PenTool className="h-3 w-3 mr-2" />
              Assinar como Secretário(a)
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              Aguardando assinatura do(a) secretário(a)
            </p>
          )}
        </div>

        {/* Status Geral */}
        {presidenteAssinou && secretarioAssinou && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-800 font-medium">
              Acta completamente assinada e válida
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
