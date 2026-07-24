/**
 * Página Pública de Reclamações
 * Permite que usuários externos submetam e rastreiem reclamações
 */

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent } from "../ui/card";
import { MessageSquareWarning, CheckCircle2 } from "lucide-react";
import { ReclamacaoFormPublica } from "./reclamacao-form-publica";
import { RastreioReclamacao } from "./rastreio-reclamacao";

export function ReclamacoesPublicPage() {
  const [activeTab, setActiveTab] = useState<"submeter" | "rastrear">("submeter");
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ codigo: string; numero: string } | null>(null);

  const handleSuccess = (codigo: string, numero: string) => {
    setSuccessData({ codigo, numero });
    setShowSuccess(true);
  };

  if (showSuccess && successData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-6">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-green-600">Reclamação Registada com Sucesso!</h2>
              <p className="text-muted-foreground">
                A sua reclamação foi registada e será analisada pela nossa equipa.
              </p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Número da Reclamação</p>
                <p className="text-xl font-bold">{successData.numero}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Código de Rastreio</p>
                <p className="text-2xl font-bold text-blue-600">{successData.codigo}</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">📧 Verifique o seu email</p>
                <p className="text-xs text-muted-foreground">
                  Enviámos uma confirmação com o código de rastreio para o seu email. 
                  Guarde este código para acompanhar o estado da sua reclamação.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-semibold">Use o código de rastreio para:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Acompanhar o estado da reclamação</li>
                <li>✓ Ver atualizações em tempo real</li>
                <li>✓ Confirmar quando for resolvida</li>
              </ul>
            </div>

            <div className="pt-4">
              <button
                onClick={() => {
                  setShowSuccess(false);
                  setActiveTab("rastrear");
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Rastrear Reclamação
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-12 px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <MessageSquareWarning className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold">Portal de Reclamações</h1>
          <p className="text-lg text-muted-foreground">
            Submeta a sua reclamação ou acompanhe o estado de uma reclamação existente
          </p>
        </div>

        {/* Tabs */}
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="submeter">Submeter Reclamação</TabsTrigger>
                <TabsTrigger value="rastrear">Rastrear Reclamação</TabsTrigger>
              </TabsList>

              <TabsContent value="submeter">
                <ReclamacaoFormPublica onSuccess={handleSuccess} />
              </TabsContent>

              <TabsContent value="rastrear">
                <RastreioReclamacao />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}