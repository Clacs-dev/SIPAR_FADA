/**
 * Formulário de Criação/Edição de Reclamações
 * Campos: Título, Importância, Descrição, Email, Operador (opcional)
 */

import { useState, useEffect } from "react";
import { X, AlertCircle, FileText, Mail, Paperclip, Upload } from "lucide-react";
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
import type { Reclamacao, PrioridadeReclamacao, Operador } from "./types";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface ReclamacaoFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Reclamacao>) => Promise<Reclamacao | null>;
  reclamacao?: Reclamacao;
  mode: "create" | "edit";
}

export function ReclamacaoForm({
  open,
  onClose,
  onSubmit,
  reclamacao,
  mode,
}: ReclamacaoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [loadingOperadores, setLoadingOperadores] = useState(false);
  const [selectedOperador, setSelectedOperador] = useState<string>("");
  const [anexos, setAnexos] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    assunto: "",
    descricao: "",
    prioridade: "media" as PrioridadeReclamacao,
    reclamante_email: "",
  });

  // Carregar operadores ativos
  useEffect(() => {
    if (open && mode === "create") {
      loadOperadores();
    }
  }, [open, mode]);

  const loadOperadores = async () => {
    try {
      setLoadingOperadores(true);
      
      // Obter token de autenticação
      const token = localStorage.getItem('access_token');
      if (!token) {
 console.error(' Token de autenticação não encontrado');
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        setOperadores([]);
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
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
 console.error(' Erro ao carregar operadores:', errorData);
        throw new Error(errorData.error || 'Erro ao carregar operadores');
      }

      const data = await response.json();
      
      // Se houver erro no retorno mas status 200 (fallback)
      if (data.error) {
 console.error(' Erro no retorno:', data.error);
        setOperadores([]);
        return;
      }
      
      // Filtrar apenas operadores ativos
      const operadoresAtivos = (data.operadores || []).filter((op: Operador) => op.ativo);
      setOperadores(operadoresAtivos);
      
 console.log(' Operadores carregados:', operadoresAtivos.length);
    } catch (error) {
 console.error(' Erro ao carregar operadores:', error);
      toast.error('Erro ao carregar lista de operadores. Você ainda pode preencher manualmente.');
      setOperadores([]);
    } finally {
      setLoadingOperadores(false);
    }
  };

  // Atualizar dados do formulário quando selecionar um operador
  const handleSelectOperador = (operadorId: string) => {
    setSelectedOperador(operadorId);
    const operador = operadores.find(op => op.id === operadorId);
    
    if (operador) {
      setFormData(prev => ({
        ...prev,
        reclamante_email: operador.email,
      }));
    }
  };

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (mode === "edit" && reclamacao) {
      setFormData({
        assunto: reclamacao.assunto,
        descricao: reclamacao.descricao,
        prioridade: reclamacao.prioridade,
        reclamante_email: reclamacao.reclamante_email || "",
      });
      setAnexos(reclamacao.anexos || []);
    } else {
      // Reset ao criar novo
      setFormData({
        assunto: "",
        descricao: "",
        prioridade: "media",
        reclamante_email: "",
      });
      setAnexos([]);
      setSelectedOperador("");
    }
  }, [mode, reclamacao, open]);

  // Upload de anexo
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Tamanho máximo: 10MB");
      return;
    }

    try {
      setUploadingFile(true);
      
      // Obter token de autenticação
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Fazer upload
        const response = await fetch(
          `${API_BASE_URL}/reclamacoes/upload-anexo`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              fileData: base64,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro no upload' }));
          throw new Error(errorData.error || 'Erro no upload');
        }

        const data = await response.json();
        
        if (data.anexo) {
          setAnexos(prev => [...prev, data.anexo]);
          toast.success('Arquivo carregado com sucesso!');
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
 console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload do arquivo');
    } finally {
      setUploadingFile(false);
      // Limpar input
      e.target.value = '';
    }
  };

  // Remover anexo
  const handleRemoveAnexo = (anexoId: string) => {
    setAnexos(prev => prev.filter(a => a.id !== anexoId));
    toast.success('Anexo removido');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!formData.assunto.trim()) {
      toast.error("Assunto é obrigatório");
      return;
    }
    if (!formData.descricao.trim()) {
      toast.error("Descrição é obrigatória");
      return;
    }
    if (!formData.reclamante_email.trim()) {
      toast.error("Email do reclamante é obrigatório");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.reclamante_email)) {
      toast.error("Email inválido");
      return;
    }

    // Proteção contra duplo clique
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        ...formData,
        anexos: anexos, // Incluir anexos no submit
        // Campos obrigatórios do backend com valores padrão
        tipo: 'geral',
        tipo_utilizador: 'cliente',
        canal: 'sistema',
        reclamante_nome: formData.reclamante_email.split('@')[0], // Usar parte do email como nome padrão
      };
      const result = await onSubmit(dataToSubmit);
      if (result) {
        toast.success("Reclamação registada com sucesso! Um email de confirmação foi enviado.");
        onClose();
        // Reset form
        setFormData({
          assunto: "",
          descricao: "",
          prioridade: "media",
          reclamante_email: "",
        });
        setAnexos([]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {mode === "create" ? "Nova Reclamação" : "Editar Reclamação"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da reclamação. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seletor de Operador (apenas no modo criar) */}
          {mode === "create" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Label htmlFor="operador" className="text-sm font-semibold mb-2 block">
                Selecionar Operador Cadastrado
              </Label>
              <Select
                value={selectedOperador}
                onValueChange={handleSelectOperador}
                disabled={isSubmitting || loadingOperadores}
              >
                <SelectTrigger id="operador">
                  <SelectValue placeholder={loadingOperadores ? "A carregar..." : "Selecione um operador ou preencha manualmente"} />
                </SelectTrigger>
                <SelectContent>
                  {operadores.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">
                      Nenhum operador cadastrado
                    </div>
                  ) : (
                    operadores.map((operador) => (
                      <SelectItem key={operador.id} value={operador.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{operador.nome}</span>
                          <span className="text-xs text-gray-500">{operador.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-blue-600 mt-2">
                💡 Selecione um operador para preencher automaticamente os dados, ou preencha manualmente abaixo
              </p>
            </div>
          )}

          {/* Assunto */}
          <div>
            <Label htmlFor="assunto">Assunto *</Label>
            <Input
              id="assunto"
              value={formData.assunto}
              onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
              placeholder="Ex: Atraso na entrega de produto"
              maxLength={200}
              disabled={isSubmitting}
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao">Descrição Detalhada *</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descreva a reclamação em detalhes..."
              rows={5}
              maxLength={2000}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.descricao.length}/2000 caracteres
            </p>
          </div>

          {/* Importância */}
          <div>
            <Label htmlFor="prioridade">Importância *</Label>
            <Select
              value={formData.prioridade}
              onValueChange={(value) => setFormData({ ...formData, prioridade: value as PrioridadeReclamacao })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="prioridade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa (14 dias)</SelectItem>
                <SelectItem value="media">Média (7 dias)</SelectItem>
                <SelectItem value="alta">Alta (3 dias)</SelectItem>
                <SelectItem value="urgente">Urgente (24 horas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dados do Reclamante */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Dados do Reclamante</h4>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="reclamante_email">Email *</Label>
                <Input
                  id="reclamante_email"
                  type="email"
                  value={formData.reclamante_email}
                  onChange={(e) => setFormData({ ...formData, reclamante_email: e.target.value })}
                  placeholder="email@exemplo.com"
                  maxLength={200}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Anexos */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Paperclip className="h-5 w-5" />
              <h4 className="font-medium">Anexos (Opcional)</h4>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="anexo" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">
                      {uploadingFile ? "A carregar..." : "Clique para selecionar um arquivo"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Máximo 10MB</p>
                  </div>
                </Label>
                <Input
                  id="anexo"
                  type="file"
                  onChange={handleFileUpload}
                  disabled={isSubmitting || uploadingFile}
                  className="hidden"
                />
              </div>
              
              {anexos.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium text-gray-700">Arquivos anexados ({anexos.length}):</h5>
                  <div className="space-y-2">
                    {anexos.map(anexo => (
                      <div key={anexo.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <Paperclip className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm truncate">{anexo.nome}</span>
                          <span className="text-xs text-gray-400">({(anexo.tamanho / 1024).toFixed(1)} KB)</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                          onClick={() => handleRemoveAnexo(anexo.id)}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              {isSubmitting ? "A gravar..." : mode === "create" ? "Criar Reclamação" : "Guardar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}