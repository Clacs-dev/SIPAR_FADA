/**
 * Gestão de Fornecedores - Interface Completa
 */

import { useState, useEffect } from "react";
import { 
  Building2, Plus, Search, Edit, Trash2, Power, 
  Ban, CheckCircle2, Mail, Phone, MapPin, Package, ArrowLeft, Send
} from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useFornecedores } from "../../hooks/use-fornecedores";
import { FornecedorFormDialog } from "./fornecedor-form-dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toast } from "sonner@2.0.3";
import type { Fornecedor } from "./types";

interface FornecedoresGestaoProps {
  onBack?: () => void;
}

export function FornecedoresGestao({ onBack }: FornecedoresGestaoProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedFornecedor, setSelectedFornecedor] = useState<Fornecedor | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fornecedorToDelete, setFornecedorToDelete] = useState<Fornecedor | null>(null);

  const {
    fornecedores,
    loading,
    fetchFornecedores,
    createFornecedor,
    updateFornecedor,
    deleteFornecedor,
    ativarFornecedor,
    desativarFornecedor,
    enviarCredenciais,
  } = useFornecedores();

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  const handleCreate = async (data: any) => {
    const success = await createFornecedor(data);
    if (success) {
      setFormOpen(false);
    }
    return success;
  };

  const handleUpdate = async (data: any) => {
    if (!selectedFornecedor) return null;
    const success = await updateFornecedor(selectedFornecedor.id, data);
    if (success) {
      setFormOpen(false);
      setSelectedFornecedor(null);
    }
    return success;
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setSelectedFornecedor(fornecedor);
    setFormOpen(true);
  };

  const handleDeleteClick = (fornecedor: Fornecedor) => {
    setFornecedorToDelete(fornecedor);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fornecedorToDelete) return;
    const success = await deleteFornecedor(fornecedorToDelete.id);
    if (success) {
      setDeleteDialogOpen(false);
      setFornecedorToDelete(null);
    }
  };

  const handleToggleStatus = async (fornecedor: Fornecedor) => {
    if (fornecedor.situacao === "ativo") {
      await desativarFornecedor(fornecedor.id);
    } else {
      await ativarFornecedor(fornecedor.id);
    }
  };

  const getSituacaoBadge = (situacao: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      ativo: { label: "Ativo", color: "bg-green-500", icon: CheckCircle2 },
      inativo: { label: "Inativo", color: "bg-gray-500", icon: Power },
      bloqueado: { label: "Bloqueado", color: "bg-red-500", icon: Ban },
    };
    const badge = badges[situacao] || badges.inativo;
    const Icon = badge.icon;
    return (
      <Badge className={`${badge.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </Badge>
    );
  };

  // Filtrar por pesquisa
  const fornecedoresFiltrados = fornecedores.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.nif.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas
  const stats = {
    total: fornecedores.length,
    ativos: fornecedores.filter(f => f.situacao === "ativo").length,
    inativos: fornecedores.filter(f => f.situacao === "inativo").length,
    bloqueados: fornecedores.filter(f => f.situacao === "bloqueado").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Gestão de Fornecedores
            </h2>
            <p className="text-muted-foreground">
              Gerir fornecedores externos que podem submeter cotações
            </p>
          </div>
        </div>
        <Button onClick={() => {
          setSelectedFornecedor(null);
          setFormOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total de Fornecedores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.ativos}</div>
            <p className="text-xs text-muted-foreground">Ativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-gray-600">{stats.inativos}</div>
            <p className="text-xs text-muted-foreground">Inativos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.bloqueados}</div>
            <p className="text-xs text-muted-foreground">Bloqueados</p>
          </CardContent>
        </Card>
      </div>

      {/* Pesquisa */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por nome, NIF ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Fornecedores */}
      {loading && <p className="text-center text-muted-foreground">A carregar...</p>}
      
      {!loading && fornecedoresFiltrados.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum fornecedor encontrado</p>
            <Button className="mt-4" variant="outline" onClick={() => setFormOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Fornecedor
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {!loading && fornecedoresFiltrados.map((fornecedor) => (
          <Card key={fornecedor.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Cabeçalho */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{fornecedor.nome}</h3>
                    {getSituacaoBadge(fornecedor.situacao)}
                    {fornecedor.categorias_produto && fornecedor.categorias_produto.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Package className="h-3 w-3 mr-1" />
                        {fornecedor.categorias_produto.length} categoria(s)
                      </Badge>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">NIF:</span>
                      <p className="font-medium">{fornecedor.nif}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        Email:
                      </span>
                      <p className="font-medium">{fornecedor.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Telefone:
                      </span>
                      <p className="font-medium">{fornecedor.telefone || "N/A"}</p>
                    </div>
                  </div>

                  {/* Endereço */}
                  {(fornecedor.cidade || fornecedor.provincia) && (
                    <div className="mt-2 text-sm flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {fornecedor.cidade && <span>{fornecedor.cidade}</span>}
                      {fornecedor.cidade && fornecedor.provincia && <span>•</span>}
                      {fornecedor.provincia && <span>{fornecedor.provincia}</span>}
                      {(fornecedor.cidade || fornecedor.provincia) && fornecedor.pais && <span>•</span>}
                      {fornecedor.pais && <span>{fornecedor.pais}</span>}
                    </div>
                  )}

                  {/* Contato Principal */}
                  {fornecedor.contato_nome && (
                    <div className="mt-2 text-sm bg-blue-50 p-2 rounded">
                      <span className="font-medium">Contato: </span>
                      {fornecedor.contato_nome}
                      {fornecedor.contato_cargo && ` (${fornecedor.contato_cargo})`}
                      {fornecedor.contato_email && ` - ${fornecedor.contato_email}`}
                    </div>
                  )}

                  {/* Categorias */}
                  {fornecedor.categorias_produto && fornecedor.categorias_produto.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {fornecedor.categorias_produto.map((cat, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Estatísticas */}
                  {(fornecedor.total_cotacoes > 0 || fornecedor.total_vendas > 0) && (
                    <div className="mt-3 flex gap-4 text-sm">
                      {fornecedor.total_cotacoes > 0 && (
                        <div>
                          <span className="text-muted-foreground">Cotações: </span>
                          <span className="font-medium">{fornecedor.total_cotacoes}</span>
                        </div>
                      )}
                      {fornecedor.total_vendas > 0 && (
                        <div>
                          <span className="text-muted-foreground">Vendas: </span>
                          <span className="font-medium text-green-600">
                            {fornecedor.total_vendas.toLocaleString('pt-AO')} AOA
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => enviarCredenciais(fornecedor.id)}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Enviar Credenciais
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(fornecedor)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  
                  {fornecedor.situacao !== "bloqueado" && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleToggleStatus(fornecedor)}
                    >
                      <Power className="h-4 w-4 mr-1" />
                      {fornecedor.situacao === "ativo" ? "Desativar" : "Ativar"}
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(fornecedor)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Formulário */}
      <FornecedorFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedFornecedor(null);
        }}
        onSubmit={selectedFornecedor ? handleUpdate : handleCreate}
        fornecedor={selectedFornecedor}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja excluir o fornecedor <strong>{fornecedorToDelete?.nome}</strong>?
              Esta ação não pode ser desfeita.
              {fornecedorToDelete?.total_cotacoes > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-900">
                  <strong>Atenção:</strong> Este fornecedor possui cotações registadas no sistema.
                  Se houver cotações ativas, a exclusão será bloqueada.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}