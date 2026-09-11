import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { toast } from "sonner@2.0.3";
import {
  API_BASE_URL,
  DEFAULT_API_BASE_URL,
  getApiBaseUrlOverride,
  setApiBaseUrl,
  resetApiBaseUrl,
} from "@/services/api";

interface ServerUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Configuracao do endereco do servidor central, acessivel a partir do icone
 * no ecra de login. Existe porque VITE_API_URL fica fixo no momento do build
 * do instalador Tauri (ver docs/developer/tauri.md) - se o endereco real do
 * servidor mudar depois de distribuido, isto evita ter de gerar e reinstalar
 * um novo instalador em cada PC.
 */
export function ServerUrlDialog({ open, onOpenChange }: ServerUrlDialogProps) {
  const [value, setValue] = useState(API_BASE_URL);
  const hasOverride = getApiBaseUrlOverride() !== null;

  const handleSave = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Indique o endereço do servidor");
      return;
    }
    if (!/^https?:\/\/.+/i.test(trimmed)) {
      toast.error("O endereço deve começar por http:// ou https://");
      return;
    }
    setApiBaseUrl(trimmed);
    toast.success("Endereço do servidor atualizado. A recarregar...");
    window.location.reload();
  };

  const handleReset = () => {
    resetApiBaseUrl();
    toast.success("Endereço do servidor reposto. A recarregar...");
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Endereço do servidor</DialogTitle>
          <DialogDescription>
            Endereço a que esta instalação do SIPAR-FADA se liga na rede da FADA. Só altere isto
            se o Administrador do Sistema/TI indicou um endereço diferente do habitual.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="server-url">Endereço (ex.: http://192.168.1.50:5000/api/v1)</Label>
            <Input
              id="server-url"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={DEFAULT_API_BASE_URL}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {hasOverride
              ? "Este endereço foi definido manualmente nesta instalação."
              : "A usar o endereço definido na instalação (por omissão)."}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {hasOverride && (
            <Button variant="outline" onClick={handleReset}>
              Repor por omissão
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar e recarregar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
