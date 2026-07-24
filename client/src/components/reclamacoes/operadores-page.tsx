/**
 * PÁGINA COMPLETA DE GESTÃO DE OPERADORES
 * View separada para gerenciar operadores do sistema de reclamações
 */

import { ArrowLeft, Users } from "lucide-react";
import { Button } from "../ui/button";
import { OperadoresList } from "./operadores-list";
import { useAuth } from "../auth/auth-context";

interface OperadoresPageProps {
  onBack: () => void;
}

export function OperadoresPage({ onBack }: OperadoresPageProps) {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header com botão de voltar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="flex items-center gap-2">
              <Users className="h-6 w-6" />
              Gestão de Operadores
            </h1>
            <p className="text-muted-foreground">
              Gerir operadores autorizados a submeter reclamações
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Operadores */}
      <OperadoresList
        currentUserId={user?.id || ""}
        currentUserName={user?.name || ""}
      />
    </div>
  );
}
