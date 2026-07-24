/**
 * LISTA DE OPERADORES
 * Gestão de operadores que podem submeter reclamações
 */

import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { 
  UserPlus, 
  Search, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2, 
  XCircle,
  Edit,
  Trash2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner@2.0.3";
import { OperadorFormDialog } from "./operador-form-dialog";
import type { Operador } from "./types";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface OperadoresListProps {
  currentUserId: string;
  currentUserName: string;
}

export function OperadoresList({
  currentUserId,
  currentUserName,
}: OperadoresListProps) {
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [operadorToEdit, setOperadorToEdit] = useState<Operador | null>(null);

  useEffect(() => {
    loadOperadores();
  }, []);

  const loadOperadores = async () => {
    try {
      setLoading(true);
      
      // Obter token de autenticação
      const token = localStorage.getItem('access_token');
      if (!token) {
 console.error(' Token de autenticação não encontrado');
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/operadores`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao carregar operadores' }));
 console.error(' Erro HTTP:', response.status, errorData);
        throw new Error(errorData.error || "Erro ao carregar operadores");
      }

      const data = await response.json();
      setOperadores(data.operadores || []);
 console.log(' Operadores carregados:', data.operadores?.length || 0);
    } catch (error) {
 console.error(" Erro ao carregar operadores:", error);
      toast.error("Erro ao carregar operadores");
      setOperadores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOperador = async (operadorData: Omit<Operador, 'id' | 'created_at' | 'updated_at' | 'created_by_id' | 'created_by_name'>) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/operadores`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(operadorData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar operador");
      }

      await loadOperadores();
      toast.success("Operador cadastrado com sucesso!");
    } catch (error: any) {
 console.error("Erro ao criar operador:", error);
      throw error;
    }
  };

  const handleUpdateOperador = async (operadorData: Omit<Operador, 'id' | 'created_at' | 'updated_at' | 'created_by_id' | 'created_by_name'>) => {
    if (!operadorToEdit) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/operadores/${operadorToEdit.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(operadorData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao atualizar operador");
      }

      await loadOperadores();
      setOperadorToEdit(null);
      toast.success("Operador atualizado com sucesso!");
    } catch (error: any) {
 console.error("Erro ao atualizar operador:", error);
      throw error;
    }
  };

  const handleDeleteOperador = async (operador: Operador) => {
    if (!confirm(`Tem certeza que deseja deletar o operador "${operador.nome}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }
      
      const response = await fetch(
        `${API_BASE_URL}/operadores/${operador.id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        
        if (error.code === 'HAS_RELATED_RECORDS') {
          toast.error(`Não é possível deletar: operador possui ${error.count} reclamação(ões) associada(s)`);
          return;
        }
        
        throw new Error(error.error || "Erro ao deletar operador");
      }

      await loadOperadores();
      toast.success("Operador deletado com sucesso!");
    } catch (error: any) {
 console.error("Erro ao deletar operador:", error);
      toast.error(error.message || "Erro ao deletar operador");
    }
  };

  const filteredOperadores = operadores.filter((op) => {
    const search = searchTerm.toLowerCase();
    return (
      op.nome.toLowerCase().includes(search) ||
      op.email.toLowerCase().includes(search) ||
      op.telefone?.includes(search)
    );
  });

  const stats = {
    total: operadores.length,
    ativos: operadores.filter(op => op.ativo).length,
    inativos: operadores.filter(op => !op.ativo).length,
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-600">Total de Operadores</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-700">Ativos</p>
          <p className="text-2xl font-bold text-green-900">{stats.ativos}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-700">Inativos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.inativos}</p>
        </div>
      </div>

      {/* Barra de Ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Pesquisar operadores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowFormDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Cadastrar Operador
        </Button>
      </div>

      {/* Lista de Operadores */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">A carregar operadores...</p>
        </div>
      ) : filteredOperadores.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm ? "Nenhum operador encontrado" : "Nenhum operador cadastrado"}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => setShowFormDialog(true)}
              variant="outline"
              className="mt-4"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Cadastrar Primeiro Operador
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOperadores.map((operador) => (
            <div
              key={operador.id}
              className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{operador.nome}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {operador.ativo ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                        <XCircle className="w-3 h-3 mr-1" />
                        Inativo
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setOperadorToEdit(operador);
                      setShowFormDialog(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteOperador(operador)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{operador.email}</span>
                </div>
                {operador.telefone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{operador.telefone}</span>
                  </div>
                )}
              </div>

              {(operador.total_reclamacoes ?? 0) > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500">
                    <strong>{operador.total_reclamacoes}</strong> reclamação(ões) •{" "}
                    <strong>{operador.reclamacoes_abertas}</strong> em aberto
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog de Formulário */}
      <OperadorFormDialog
        open={showFormDialog}
        onClose={() => {
          setShowFormDialog(false);
          setOperadorToEdit(null);
        }}
        onSubmit={operadorToEdit ? handleUpdateOperador : handleCreateOperador}
        operador={operadorToEdit}
      />
    </div>
  );
}