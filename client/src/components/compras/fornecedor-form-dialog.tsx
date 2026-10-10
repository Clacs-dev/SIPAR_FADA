/**
 * Formulário de Criação/Edição de Fornecedor
 */

import { useState, useEffect } from "react";
import { Building2, Mail, Phone, MapPin, Globe, User, AlertCircle, X, Plus, Tag, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { toast } from "sonner@2.0.3";
import type { Fornecedor } from "./types";
import { useCategorias } from "../../hooks/use-categorias";
import { CategoriaFormDialog } from "./categoria-form-dialog";
import { NifLookupField } from "../shared/nif-lookup-field";
import { formatarIban, formatarNib, validarIban, validarNib } from "../../utils/bank-format";

interface Prestacao {
  id: string;
  descricao: string;
  percentagem: number;
}

interface FornecedorFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
  fornecedor?: Fornecedor | null;
}

export function FornecedorFormDialog({ 
  open, 
  onClose, 
  onSubmit,
  fornecedor 
}: FornecedorFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEdit = !!fornecedor;
  const { categorias, createCategoria } = useCategorias();
  const [categoriaDialogOpen, setCategoriaDialogOpen] = useState(false);

  // Dados básicos
  const [nome, setNome] = useState("");
  const [razaoSocial, setRazaoSocial] = useState("");
  const [nif, setNif] = useState("");
  
  // Endereço
  const [endereco, setEndereco] = useState("");
  const [cidade, setCidade] = useState("");
  const [provincia, setProvincia] = useState("");
  const [pais, setPais] = useState("Angola");
  
  // Contato
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  
  // Contato principal
  const [contatoNome, setContatoNome] = useState("");
  const [contatoCargo, setContatoCargo] = useState("");
  const [contatoTelefone, setContatoTelefone] = useState("");
  const [contatoEmail, setContatoEmail] = useState("");
  
  // Informações comerciais
  const [categoriasProduto, setCategoriasProduto] = useState<string[]>([]);
  const [condicoesPagamento, setCondicoesPagamento] = useState<string[]>([]);
  const [prestacoes, setPrestacoes] = useState<Prestacao[]>([]);
  const [prazoEntrega, setPrazoEntrega] = useState("");
  const [valorMinimo, setValorMinimo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Dados bancários (só usados quando o fornecedor não tem conta própria no
  // portal - ver server resolveFornecedorBankInfo, que prefere os dados da
  // conta de utilizador ligada quando existe).
  const [bancoNome, setBancoNome] = useState("");
  const [bancoTitular, setBancoTitular] = useState("");
  const [bancoIban, setBancoIban] = useState("");
  const [bancoNib, setBancoNib] = useState("");
  const [bancoNumeroConta, setBancoNumeroConta] = useState("");
  const [bancoSwift, setBancoSwift] = useState("");
  const [bancoCidade, setBancoCidade] = useState("");
  const [bancoPais, setBancoPais] = useState("Angola");

  // Preencher form se for edição
  useEffect(() => {
    if (fornecedor) {
      setNome(fornecedor.nome || "");
      setRazaoSocial(fornecedor.razao_social || "");
      setNif(fornecedor.nif || "");
      setEndereco(fornecedor.endereco || "");
      setCidade(fornecedor.cidade || "");
      setProvincia(fornecedor.provincia || "");
      setPais(fornecedor.pais || "Angola");
      setTelefone(fornecedor.telefone || "");
      setEmail(fornecedor.email || "");
      setWebsite(fornecedor.website || "");
      setContatoNome(fornecedor.contato_nome || "");
      setContatoCargo(fornecedor.contato_cargo || "");
      setContatoTelefone(fornecedor.contato_telefone || "");
      setContatoEmail(fornecedor.contato_email || "");
      setCategoriasProduto(
        Array.isArray(fornecedor.categorias_produto) ? fornecedor.categorias_produto : []
      );
      setCondicoesPagamento(fornecedor.condicoes_pagamento_padrao || []);
      setPrestacoes(fornecedor.prestacoes || []);
      setPrazoEntrega(fornecedor.prazo_entrega_padrao_dias?.toString() || "");
      setValorMinimo(fornecedor.valor_minimo_pedido?.toString() || "");
      setObservacoes(fornecedor.observacoes || "");
      setBancoNome(fornecedor.banco_nome || "");
      setBancoTitular(fornecedor.banco_titular || "");
      setBancoIban(formatarIban(fornecedor.banco_iban || ""));
      setBancoNib(formatarNib(fornecedor.banco_nib || ""));
      setBancoNumeroConta(fornecedor.banco_numero_conta || "");
      setBancoSwift(fornecedor.banco_swift || "");
      setBancoCidade(fornecedor.banco_cidade || "");
      setBancoPais(fornecedor.banco_pais || "Angola");
    }
  }, [fornecedor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!nome.trim()) {
      toast.error("Nome do fornecedor é obrigatório");
      return;
    }
    
    if (!nif.trim()) {
      toast.error("NIF é obrigatório");
      return;
    }

    const erroConta = validarIban(bancoIban) || validarNib(bancoNib);
    if (erroConta) {
      toast.error(erroConta);
      return;
    }
    
    if (!email.trim()) {
      toast.error("Email é obrigatório");
      return;
    }

    if (categoriasProduto.length === 0) {
      toast.error("Seleccione pelo menos uma categoria de produtos/serviços");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email inválido");
      return;
    }

    setLoading(true);
    
    const data = {
      nome: nome.trim(),
      razao_social: razaoSocial.trim() || undefined,
      nif: nif.trim(),
      endereco: endereco.trim() || undefined,
      cidade: cidade.trim() || undefined,
      provincia: provincia.trim() || undefined,
      pais: pais.trim(),
      telefone: telefone.trim() || undefined,
      email: email.trim(),
      website: website.trim() || undefined,
      contato_nome: contatoNome.trim() || undefined,
      contato_cargo: contatoCargo.trim() || undefined,
      contato_telefone: contatoTelefone.trim() || undefined,
      contato_email: contatoEmail.trim() || undefined,
      categorias_produto: categoriasProduto,
      condicoes_pagamento_padrao: condicoesPagamento,
      prestacoes: prestacoes,
      prazo_entrega_padrao_dias: prazoEntrega ? parseInt(prazoEntrega) : 0,
      valor_minimo_pedido: valorMinimo ? parseFloat(valorMinimo) : 0,
      observacoes: observacoes.trim() || undefined,
      banco_nome: bancoNome.trim() || undefined,
      banco_titular: bancoTitular.trim() || undefined,
      banco_iban: bancoIban.trim() || undefined,
      banco_nib: bancoNib.trim() || undefined,
      banco_numero_conta: bancoNumeroConta.trim() || undefined,
      banco_swift: bancoSwift.trim() || undefined,
      banco_cidade: bancoCidade.trim() || undefined,
      banco_pais: bancoPais.trim() || undefined,
    };

    try {
      await onSubmit(data);
      handleClose();
    } catch (error) {
 console.error("Erro ao salvar fornecedor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      // Reset form
      setNome("");
      setRazaoSocial("");
      setNif("");
      setEndereco("");
      setCidade("");
      setProvincia("");
      setPais("Angola");
      setTelefone("");
      setEmail("");
      setWebsite("");
      setContatoNome("");
      setContatoCargo("");
      setContatoTelefone("");
      setContatoEmail("");
      setCategoriasProduto([]);
      setCondicoesPagamento([]);
      setPrestacoes([]);
      setPrazoEntrega("");
      setValorMinimo("");
      setObservacoes("");
      setBancoNome("");
      setBancoTitular("");
      setBancoIban("");
      setBancoNib("");
      setBancoNumeroConta("");
      setBancoSwift("");
      setBancoCidade("");
      setBancoPais("Angola");
      onClose();
    }
  };

  const provinciasAngola = [
    "Bengo", "Benguela", "Bié", "Cabinda", "Cuando-Cubango", 
    "Cuanza Norte", "Cuanza Sul", "Cunene", "Huambo", "Huíla",
    "Luanda", "Lunda Norte", "Lunda Sul", "Malanje", "Moxico",
    "Namibe", "Uíge", "Zaire"
  ];

  // Condições de pagamento disponíveis
  const condicoesPagamentoDisponiveis = [
    { value: "pronto_pagamento", label: "Pronto Pagamento" },
    { value: "7_dias", label: "7 Dias" },
    { value: "14_dias", label: "14 Dias" },
    { value: "30_dias", label: "30 Dias" },
    { value: "60_dias", label: "60 Dias" },
    { value: "prestacoes", label: "Prestações" }
  ];

  const handleCondicaoPagamentoToggle = (value: string) => {
    setCondicoesPagamento(prev => {
      if (prev.includes(value)) {
        // Remover condição
        if (value === "prestacoes") {
          setPrestacoes([]); // Limpar prestações se desmarcar
        }
        return prev.filter(c => c !== value);
      } else {
        // Adicionar condição
        return [...prev, value];
      }
    });
  };

  const handleAddPrestacao = () => {
    const novaPrestacao: Prestacao = {
      id: `prestacao-${Date.now()}`,
      descricao: "",
      percentagem: 0
    };
    setPrestacoes([...prestacoes, novaPrestacao]);
  };

  const handleRemovePrestacao = (id: string) => {
    setPrestacoes(prestacoes.filter(p => p.id !== id));
  };

  const handlePrestacaoChange = (id: string, field: 'descricao' | 'percentagem', value: string | number) => {
    setPrestacoes(prestacoes.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const totalPrestacoes = prestacoes.reduce((sum, p) => sum + (p.percentagem || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!w-[95vw] !max-w-[95vw] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Fornecedor" : "Novo Fornecedor"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Atualize as informações do fornecedor." : "Adicione um novo fornecedor."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Informações Básicas
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Fornecedor *</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Empresa ABC Lda"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="razao">Órgão Social</Label>
                <Input
                  id="razao"
                  value={razaoSocial}
                  onChange={(e) => setRazaoSocial(e.target.value)}
                  placeholder="Órgão social registado"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nif">NIF / Número de Contribuinte *</Label>
              <NifLookupField
                id="nif"
                value={nif}
                onChange={setNif}
                onEncontrado={(dados) => {
                  setNif(dados.nif);
                  if (!nome.trim()) setNome(dados.nome);
                }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Categorias de Produtos/Serviços *</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCategoriaDialogOpen(true)}
                  className="h-7"
                >
                  <Tag className="h-3.5 w-3.5 mr-1" />
                  Nova Categoria
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Seleccione todas as categorias que este fornecedor fornece. Só será notificado por
                e-mail sobre pedidos de compra que correspondam a estas categorias.
              </p>
              <div className="border rounded-lg p-4 grid gap-2 sm:grid-cols-2 bg-gray-50">
                {categorias.length === 0 ? (
                  <p className="text-sm text-muted-foreground sm:col-span-2">
                    Nenhuma categoria criada ainda. Use "Nova Categoria" para começar.
                  </p>
                ) : (
                  categorias.map((categoria) => (
                    <div key={categoria.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`categoria-${categoria.id}`}
                        checked={categoriasProduto.includes(categoria.nome)}
                        onCheckedChange={(checked) => {
                          setCategoriasProduto((prev) =>
                            checked ? [...prev, categoria.nome] : prev.filter((c) => c !== categoria.nome)
                          );
                        }}
                      />
                      <label
                        htmlFor={`categoria-${categoria.id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {categoria.nome}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <CategoriaFormDialog
            open={categoriaDialogOpen}
            onClose={() => setCategoriaDialogOpen(false)}
            onCreate={async (nome) => {
              const categoria = await createCategoria(nome);
              setCategoriasProduto((prev) => (prev.includes(categoria.nome) ? prev : [...prev, categoria.nome]));
              return categoria;
            }}
          />

          {/* Endereço */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </h3>

            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço Completo</Label>
              <Input
                id="endereco"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder="Rua, número, bairro"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Ex: Luanda"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="provincia">Província</Label>
                <Select value={provincia} onValueChange={setProvincia}>
                  <SelectTrigger id="provincia">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {provinciasAngola.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pais">País *</Label>
                <Input
                  id="pais"
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  placeholder="Angola"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contato da Empresa
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="+244 923 000 000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@empresa.ao"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://www.empresa.ao"
              />
            </div>
          </div>

          {/* Contato Principal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Contato Principal (Representante)
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contato-nome">Nome Completo</Label>
                <Input
                  id="contato-nome"
                  value={contatoNome}
                  onChange={(e) => setContatoNome(e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contato-cargo">Cargo</Label>
                <Input
                  id="contato-cargo"
                  value={contatoCargo}
                  onChange={(e) => setContatoCargo(e.target.value)}
                  placeholder="Ex: Gerente Comercial"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contato-telefone">Telefone Direto</Label>
                <Input
                  id="contato-telefone"
                  value={contatoTelefone}
                  onChange={(e) => setContatoTelefone(e.target.value)}
                  placeholder="+244 923 000 000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contato-email">Email Direto</Label>
                <Input
                  id="contato-email"
                  type="email"
                  value={contatoEmail}
                  onChange={(e) => setContatoEmail(e.target.value)}
                  placeholder="joao@empresa.ao"
                />
              </div>
            </div>
          </div>

          {/* Informações Comerciais */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Informações Comerciais</h3>

            {/* Condições de Pagamento - Checklist */}
            <div className="space-y-3">
              <Label>Condições de Pagamento</Label>
              <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
                {condicoesPagamentoDisponiveis.map(condicao => (
                  <div key={condicao.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`condicao-${condicao.value}`}
                      checked={condicoesPagamento.includes(condicao.value)}
                      onCheckedChange={() => handleCondicaoPagamentoToggle(condicao.value)}
                    />
                    <label
                      htmlFor={`condicao-${condicao.value}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {condicao.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-formulário de Prestações */}
            {condicoesPagamento.includes("prestacoes") && (
              <div className="border rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--tone-info-soft)', borderColor: 'var(--tone-info)' }}>
                <div className="flex items-center justify-between">
                  <Label style={{ color: 'var(--tone-info)' }}>Detalhes das Prestações</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddPrestacao}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Prestação
                  </Button>
                </div>

                {prestacoes.length === 0 ? (
                  <p className="text-sm italic" style={{ color: 'var(--tone-info)' }}>
                    Nenhuma prestação adicionada. Clique em "Adicionar Prestação" para começar.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {prestacoes.map((prestacao, index) => (
                      <div key={prestacao.id} className="flex gap-2 items-start bg-white p-3 rounded border">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Descrição (ex: 1ª Prestação)</Label>
                            <Input
                              value={prestacao.descricao}
                              onChange={(e) => handlePrestacaoChange(prestacao.id, 'descricao', e.target.value)}
                              placeholder="Ex: 1ª Prestação"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Percentagem (%)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={prestacao.percentagem}
                              onChange={(e) => handlePrestacaoChange(prestacao.id, 'percentagem', parseFloat(e.target.value) || 0)}
                              placeholder="Ex: 25"
                              className="h-9"
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemovePrestacao(prestacao.id)}
                          className="h-9 px-2 hover:opacity-80"
                          style={{ color: 'var(--tone-danger)' }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}

                    {/* Total das Prestações */}
                    <div
                      className="text-sm font-medium p-2 rounded"
                      style={totalPrestacoes === 100
                        ? { backgroundColor: 'var(--tone-success-soft)', color: 'var(--tone-success)' }
                        : { backgroundColor: 'var(--tone-warn-soft)', color: 'var(--tone-warn)' }}
                    >
                      Total: {totalPrestacoes.toFixed(2)}% 
                      {totalPrestacoes !== 100 && ` (Faltam ${(100 - totalPrestacoes).toFixed(2)}% para completar 100%)`}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="prazo">Prazo de Entrega (dias)</Label>
                <Input
                  id="prazo"
                  type="number"
                  value={prazoEntrega}
                  onChange={(e) => setPrazoEntrega(e.target.value)}
                  placeholder="Ex: 15"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minimo">Valor Mínimo de Pedido (AOA)</Label>
                <Input
                  id="minimo"
                  type="number"
                  value={valorMinimo}
                  onChange={(e) => setValorMinimo(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais sobre o fornecedor..."
                rows={3}
              />
            </div>
          </div>

          {/* Dados Bancários */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Landmark className="h-4 w-4" />
              Dados Bancários
            </h3>
            <p className="text-xs text-muted-foreground">
              Usados para a Ordem de Pagamento quando este fornecedor não tiver conta própria no portal.
              Se mais tarde ele próprio fizer login e guardar os dados bancários dele, esses passam a ter prioridade.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="banco-titular">Titular da Conta</Label>
                <Input
                  id="banco-titular"
                  value={bancoTitular}
                  onChange={(e) => setBancoTitular(e.target.value)}
                  placeholder="Nome do titular da conta"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco-nome">Banco</Label>
                <Input
                  id="banco-nome"
                  value={bancoNome}
                  onChange={(e) => setBancoNome(e.target.value)}
                  placeholder="Nome do banco"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco-iban">IBAN (25 caracteres: AO + 2 dígitos + 21 dígitos)</Label>
                <Input
                  id="banco-iban"
                  value={bancoIban}
                  maxLength={31}
                  aria-invalid={!!validarIban(bancoIban)}
                  onChange={(e) => setBancoIban(formatarIban(e.target.value))}
                  placeholder="AO06 0055 0000 2159 9539 1019 3"
                />
                {validarIban(bancoIban) && <p className="text-xs text-destructive">{validarIban(bancoIban)}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco-nib">NIB (21 dígitos)</Label>
                <Input
                  id="banco-nib"
                  value={bancoNib}
                  maxLength={26}
                  aria-invalid={!!validarNib(bancoNib)}
                  onChange={(e) => setBancoNib(formatarNib(e.target.value))}
                  placeholder="0055 0000 2159 9539 1019 3"
                />
                {validarNib(bancoNib) && <p className="text-xs text-destructive">{validarNib(bancoNib)}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco-numero-conta">Número de Conta</Label>
                <Input
                  id="banco-numero-conta"
                  value={bancoNumeroConta}
                  maxLength={40}
                  onChange={(e) => setBancoNumeroConta(e.target.value)}
                  placeholder="Ex: 215995391019"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco-swift">Código SWIFT/BIC</Label>
                <Input
                  id="banco-swift"
                  value={bancoSwift}
                  onChange={(e) => setBancoSwift(e.target.value)}
                  placeholder="Ex: BAOAAOLU"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco-cidade">Cidade do Banco</Label>
                <Input
                  id="banco-cidade"
                  value={bancoCidade}
                  onChange={(e) => setBancoCidade(e.target.value)}
                  placeholder="Ex: Luanda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="banco-pais">País do Banco</Label>
                <Input
                  id="banco-pais"
                  value={bancoPais}
                  onChange={(e) => setBancoPais(e.target.value)}
                  placeholder="Angola"
                />
              </div>
            </div>
          </div>

          {/* Aviso */}
          <div className="border rounded-lg p-4 flex gap-3" style={{ backgroundColor: 'var(--tone-info-soft)', borderColor: 'var(--tone-info)' }}>
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--tone-info)' }} />
            <div className="text-sm" style={{ color: 'var(--tone-info)' }}>
              <p className="font-medium mb-1">Importante:</p>
              <ul className="list-disc list-inside space-y-1" style={{ color: 'var(--tone-info)' }}>
                <li>O fornecedor poderá fazer login no sistema usando o email cadastrado</li>
                <li>Ele receberá notificações sobre novos pedidos de compra</li>
                <li>Poderá submeter cotações através do portal de fornecedores</li>
              </ul>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : isEdit ? "Atualizar Fornecedor" : "Criar Fornecedor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}