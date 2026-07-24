import { useState } from "react";
import { ViaturaForm } from "./viatura-form";
import { Viatura } from "./types";
import { useViaturas } from "../../hooks/use-viaturas";
import { useAuth } from "../auth/auth-context";
import { toast } from "sonner@2.0.3";

interface ViaturaFormWrapperProps {
  viatura?: Viatura;
  onBack: () => void;
  onSuccess: () => void;
}

export function ViaturaFormWrapper({ viatura, onBack, onSuccess }: ViaturaFormWrapperProps) {
  const { accessToken } = useAuth();
  const { createViatura, updateViatura } = useViaturas(accessToken);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (data: Partial<Viatura>) => {
    if (!accessToken) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      setIsLoading(true);

      if (viatura) {
        // Atualizar viatura existente
        await updateViatura(viatura.id, data, accessToken);
        toast.success("Viatura atualizada com sucesso");
      } else {
        // Criar nova viatura
        await createViatura(data, accessToken);
        toast.success("Viatura criada com sucesso");
      }

      onSuccess();
    } catch (error: any) {
 console.error("Erro ao salvar viatura:", error);
      toast.error(error.message || "Erro ao salvar viatura");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ViaturaForm
      viatura={viatura}
      onSave={handleSave}
      onCancel={onBack}
    />
  );
}
