/**
 * Modal para criar uma nova categoria de produtos/serviços do Procurement.
 */

import { useState } from "react";
import { Tag } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner@2.0.3";

interface CategoriaFormDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (nome: string) => Promise<{ id: string; nome: string }>;
}

export function CategoriaFormDialog({ open, onClose, onCreate }: CategoriaFormDialogProps) {
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setNome("");
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }

    setLoading(true);
    try {
      await onCreate(nome.trim());
      toast.success("Categoria criada com sucesso!");
      setNome("");
      onClose();
    } catch (error) {
 console.error("Erro ao criar categoria:", error);
      toast.error("Erro ao criar categoria");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Nova Categoria
          </DialogTitle>
          <DialogDescription>
            Crie uma nova categoria de produtos/serviços. Ficará disponível para seleccionar em fornecedores e pedidos de compra.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoria-nome">Nome da Categoria *</Label>
            <Input
              id="categoria-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Material Hospitalar"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A criar..." : "Criar Categoria"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
