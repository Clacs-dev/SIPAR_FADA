import { useState, useEffect } from "react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { useAuth } from "../auth/auth-context";

interface SecretarySelectProps {
  actaId: string;
  participantes: Array<{
    nome: string;
    cargo: string;
    departamento: string;
    usuario_id?: string;
  }>;
  secretarioAtual?: string;
  onSecretarioChange?: (nome: string, cargo: string) => void;
  disabled?: boolean;
}

export function SecretarySelect({ 
  actaId, 
  participantes, 
  secretarioAtual,
  onSecretarioChange,
  disabled = false 
}: SecretarySelectProps) {
  const { accessToken } = useAuth();
  const [secretarioSelecionado, setSecretarioSelecionado] = useState<string>(secretarioAtual || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (secretarioAtual) {
      setSecretarioSelecionado(secretarioAtual);
    }
  }, [secretarioAtual]);

  const handleSecretarioChange = async (participanteNome: string) => {
    const participante = participantes.find(p => p.nome === participanteNome);
    if (!participante) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/actas/${actaId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            secretario_nome: participante.nome,
            secretario_cargo: participante.cargo,
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar secretário');
      }

      setSecretarioSelecionado(participante.nome);
      toast.success(`${participante.nome} foi definido(a) como secretário(a)`);
      
      if (onSecretarioChange) {
        onSecretarioChange(participante.nome, participante.cargo);
      }
    } catch (error: any) {
 console.error('Erro ao atualizar secretário:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!participantes || participantes.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Secretário(a) da Reunião</Label>
        <p className="text-sm text-muted-foreground">
          Nenhum participante disponível
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="secretario">Secretário(a) da Reunião *</Label>
      <Select
        value={secretarioSelecionado}
        onValueChange={handleSecretarioChange}
        disabled={disabled || loading}
      >
        <SelectTrigger id="secretario">
          <SelectValue placeholder="Selecione o(a) secretário(a)" />
        </SelectTrigger>
        <SelectContent>
          {participantes.map((participante, idx) => (
            <SelectItem key={idx} value={participante.nome}>
              <div className="flex flex-col">
                <span className="font-medium">{participante.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {participante.cargo}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {secretarioSelecionado && (
        <p className="text-xs text-muted-foreground">
          Responsável por secretariar os trabalhos e assinar a acta
        </p>
      )}
    </div>
  );
}
