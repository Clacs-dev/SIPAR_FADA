/**
 * Formulário de Cadastro de Fornecedores
 */

import { useState, useEffect } from "react";
import { Building2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { toast } from "sonner@2.0.3";
import type { Fornecedor } from "./types";

interface FornecedorFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Fornecedor>) => Promise<Fornecedor | null>;
  fornecedor?: Fornecedor;
  mode: "create" | "edit";
}

export function FornecedorForm({
  open,
  onClose,
  onSubmit,
  fornecedor,
  mode,
}: FornecedorFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    razao_social: "",
    nif: "",
    endereco: "",
    cidade: "",
    pais: "Angola",
    telefone: "",
    email: "",
    contato_nome: "",
    contato_cargo: "",
    contato_telefone: "",
    contato_email: "",
    condicoes_pagamento: "",
    prazo_entrega_padrao: 0,
    situacao: "ativo" as "ativo" | "inativo" | "bloqueado",
    observacoes: "",
  });

  useEffect(() => {
    if (mode === "edit" && fornecedor) {
      setFormData({
        nome: fornecedor.nome,
        razao_social: fornecedor.razao_social || "",
        nif: fornecedor.nif || "",
        endereco: fornecedor.endereco || "",
        cidade: fornecedor.cidade || "",
        pais: fornecedor.pais || "Angola",
        telefone: fornecedor.telefone || "",
        email: fornecedor.email || "",
        contato_nome: fornecedor.contato_nome || "",
        contato_cargo: fornecedor.contato_cargo || "",
        contato_telefone: fornecedor.contato_telefone || "",
        contato_email: fornecedor.contato_email || "",
        condicoes_pagamento: fornecedor.condicoes_pagamento || "",
        prazo_entrega_padrao: fornecedor.prazo_entrega_padrao || 0,
        situacao: fornecedor.situacao || "ativo",
        observacoes: fornecedor.observacoes || "",
      });
    } else {
      setFormData({
        nome: "",
        razao_social: "",
        nif: "",
        endereco: "",
        cidade: "",
        pais: "Angola",
        telefone: "",
        email: "",
        contato_nome: "",
        contato_cargo: "",
        contato_telefone: "",
        contato_email: "",
        condicoes_pagamento: "",
        prazo_entrega_padrao: 0,
        situacao: "ativo",
        observacoes: "",
      });
    }
  }, [mode, fornecedor, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!formData.nome.trim()) {
      toast.error("Nome do fornecedor é obrigatório");
      return;
    }
    if (!formData.nif.trim()) {
      toast.error("NIF é obrigatório");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email inválido");
      return;
    }

    // Proteção contra duplo clique
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await onSubmit(formData);
      if (result) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {mode === "create" ? "Novo Fornecedor" : "Editar Fornecedor"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados do fornecedor. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* DADOS PRINCIPAIS */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Dados do Fornecedor</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nome">Nome/Órgão Social *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome comercial ou órgão social"
                  required
                  maxLength={150}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="razao_social">Órgão Social Completo</Label>
                <Input
                  id="razao_social"
                  value={formData.razao_social}
                  onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                  placeholder="Órgão social registado"
                  maxLength={200}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="nif">NIF *</Label>
                <Input
                  id="nif"
                  value={formData.nif}
                  onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                  placeholder="000000000"
                  maxLength={20}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="situacao">Situação *</Label>
                <Select
                  value={formData.situacao}
                  onValueChange={(value: any) => setFormData({ ...formData, situacao: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="situacao">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ENDEREÇO */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Endereço</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="endereco">Endereço Completo</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                  maxLength={500}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                  placeholder="Ex: Luanda"
                  maxLength={100}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="pais">País *</Label>
                <Select
                  value={formData.pais}
                  onValueChange={(value) => setFormData({ ...formData, pais: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="pais">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Angola">Angola</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* CONTATOS */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Contatos</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telefone">Telefone Principal</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="+244 900 000 000"
                  maxLength={20}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="fornecedor@exemplo.com"
                  maxLength={200}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="contato_nome">Nome do Contato</Label>
                <Input
                  id="contato_nome"
                  value={formData.contato_nome}
                  onChange={(e) => setFormData({ ...formData, contato_nome: e.target.value })}
                  placeholder="Responsável pelo contato"
                  maxLength={200}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="contato_cargo">Cargo do Contato</Label>
                <Input
                  id="contato_cargo"
                  value={formData.contato_cargo}
                  onChange={(e) => setFormData({ ...formData, contato_cargo: e.target.value })}
                  placeholder="Ex: Gerente Comercial"
                  maxLength={100}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="contato_telefone">Telefone do Contato</Label>
                <Input
                  id="contato_telefone"
                  value={formData.contato_telefone}
                  onChange={(e) => setFormData({ ...formData, contato_telefone: e.target.value })}
                  placeholder="+244 900 000 000"
                  maxLength={20}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="contato_email">Email do Contato</Label>
                <Input
                  id="contato_email"
                  type="email"
                  value={formData.contato_email}
                  onChange={(e) => setFormData({ ...formData, contato_email: e.target.value })}
                  placeholder="contato@exemplo.com"
                  maxLength={200}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* CONDIÇÕES COMERCIAIS */}
          <div className="space-y-4">
            <h3 className="font-medium text-sm border-b pb-2">Condições Comerciais</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="condicoes_pagamento">Condições de Pagamento</Label>
                <Textarea
                  id="condicoes_pagamento"
                  value={formData.condicoes_pagamento}
                  onChange={(e) => setFormData({ ...formData, condicoes_pagamento: e.target.value })}
                  placeholder="Ex: 30 dias após entrega, 50% antecipado"
                  rows={2}
                  maxLength={500}
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <Label htmlFor="prazo_entrega_padrao">Prazo de Entrega Padrão (dias)</Label>
                <Input
                  id="prazo_entrega_padrao"
                  type="number"
                  min="0"
                  value={formData.prazo_entrega_padrao}
                  onChange={(e) => setFormData({ ...formData, prazo_entrega_padrao: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 15"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* OBSERVAÇÕES */}
          <div>
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Informações adicionais sobre o fornecedor..."
              rows={3}
              maxLength={1000}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "A gravar..." : mode === "create" ? "Criar Fornecedor" : "Guardar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}