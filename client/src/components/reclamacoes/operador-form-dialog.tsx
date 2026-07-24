/**
 * FORMULÁRIO DE CADASTRO DE OPERADOR
 * Permite ao admin cadastrar operadores que poderão submeter reclamações
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { User, Mail, Phone, Building2, UserCheck } from "lucide-react";
import { toast } from "sonner@2.0.3";
import type { Operador } from "./types";

interface OperadorFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (operador: Omit<Operador, 'id' | 'created_at' | 'updated_at' | 'created_by_id' | 'created_by_name'>) => Promise<void>;
  operador?: Operador | null; // Para edição
}

export function OperadorFormDialog({
  open,
  onClose,
  onSubmit,
  operador,
}: OperadorFormDialogProps) {
  const [nome, setNome] = useState(operador?.nome || "");
  const [email, setEmail] = useState(operador?.email || "");
  const [telefone, setTelefone] = useState(operador?.telefone || "");
  const [ativo, setAtivo] = useState(operador?.ativo ?? true);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (!submitting) {
      setNome("");
      setEmail("");
      setTelefone("");
      setAtivo(true);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!nome.trim()) {
      toast.error("O nome do operador é obrigatório");
      return;
    }

    if (!email.trim()) {
      toast.error("O email do operador é obrigatório");
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        telefone: telefone.trim() || undefined,
        ativo,
        updated_by_id: operador?.updated_by_id,
        updated_by_name: operador?.updated_by_name,
      });

      toast.success(operador ? "Operador atualizado com sucesso" : "Operador cadastrado com sucesso");
      handleClose();
    } catch (error) {
 console.error("Erro ao salvar operador:", error);
      toast.error(operador ? "Erro ao atualizar operador" : "Erro ao cadastrar operador");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {operador ? "Editar Operador" : "Cadastrar Novo Operador"}
          </DialogTitle>
          <DialogDescription>
            {operador 
              ? "Atualize as informações do operador" 
              : "Preencha os dados do operador que poderá submeter reclamações"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Dados do Operador
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="nome">
                  Nome Completo <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: João Silva"
                  required
                  disabled={submitting}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operador@email.com"
                    className="pl-10"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="+244 923 456 789"
                    className="pl-10"
                    disabled={submitting}
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="ativo">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={ativo ? "ativo" : "inativo"} 
                  onValueChange={(v) => setAtivo(v === "ativo")} 
                  disabled={submitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-green-600" />
                        Ativo
                      </span>
                    </SelectItem>
                    <SelectItem value="inativo">
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        Inativo
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Informação sobre notificações */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Notificações por Email:</strong> O operador receberá emails automáticos quando:
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
              <li>• A reclamação for registada</li>
              <li>• A reclamação entrar em resolução</li>
              <li>• A reclamação for resolvida (com instrução para fechar na plataforma)</li>
            </ul>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "A guardar..." : operador ? "Atualizar Operador" : "Cadastrar Operador"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}