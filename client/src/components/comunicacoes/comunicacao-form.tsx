import { useState, useEffect } from "react";
import { MessageSquare, X, Save, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Comunicacao } from "./types";
import { FileUpload } from "../ui/file-upload";
import { useFileUpload } from "../../hooks/use-file-upload";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { Search, User as UserIcon } from "lucide-react";

interface ComunicacaoFormProps {
  comunicacao?: Comunicacao;
  onSave: (comunicacao: Partial<Comunicacao>) => void;
  onCancel: () => void;
}

interface DepartamentoOption {
  id: string;
  nome: string;
}

interface UtilizadorOption {
  id: string;
  name: string;
  email: string;
  position?: string;
  department?: string;
}

export function ComunicacaoForm({ comunicacao, onSave, onCancel }: ComunicacaoFormProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [departamentosDisponiveis, setDepartamentosDisponiveis] = useState<DepartamentoOption[]>([]);
  const [utilizadores, setUtilizadores] = useState<UtilizadorOption[]>([]);
  const [destinatarioSearch, setDestinatarioSearch] = useState('');
  const [formData, setFormData] = useState({
    assunto: comunicacao?.assunto || '',
    departamento_destino: comunicacao?.departamento_destino || '',
    departamento_destino_id: comunicacao?.departamento_destino_id || '',
    destinatario_id: comunicacao?.destinatario_id || '',
    destinatario_nome: comunicacao?.destinatario_nome || '',
    destinatario_cargo: comunicacao?.destinatario_cargo || '',
    conteudo: comunicacao?.conteudo || '',
    prioridade: comunicacao?.prioridade || 'normal',
    confidencial: comunicacao?.confidencial || false,
    // Origem e sempre o departamento de quem esta a enviar - nunca escolhido
    // manualmente, para nao ser possivel forjar a origem de uma comunicacao.
    departamento_origem: comunicacao?.departamento_origem || user?.department || '',
  });

  useEffect(() => {
    const carregarDepartamentos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/departments`, { headers: getAuthHeaders() });
        if (!response.ok) return;
        const result = await response.json();
        setDepartamentosDisponiveis((result.departamentos || []).map((d: any) => ({ id: d.id, nome: d.nome })));
      } catch (err) {
 console.error('Erro ao carregar departamentos:', err);
      }
    };
    const carregarUtilizadores = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/users`, { headers: getAuthHeaders() });
        if (!response.ok) return;
        const result = await response.json();
        setUtilizadores(result.data || []);
      } catch (err) {
 console.error('Erro ao carregar utilizadores:', err);
      }
    };
    carregarDepartamentos();
    carregarUtilizadores();
  }, []);

  // So mostra utilizadores do departamento de destino escolhido - nao faz
  // sentido nomear alguem de outro departamento como destinatario especifico.
  const destinatarioSelecionado = utilizadores.find((u) => u.id === formData.destinatario_id) || null;
  const destinatarioMatches = (() => {
    const term = destinatarioSearch.trim().toLowerCase();
    if (!term || !formData.departamento_destino) return [];
    return utilizadores
      .filter((u) => u.department === formData.departamento_destino)
      .filter((u) =>
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.position || '').toLowerCase().includes(term)
      )
      .slice(0, 8);
  })();

  const {
    files,
    uploading,
    uploadFiles,
    removeFile,
    formatFileSize,
  } = useFileUpload('make-8b82752b-comunicacoes');

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (submitting) return; // Prevenir duplo clique
    
    setSubmitting(true);
    try {
      await onSave({
        ...formData,
        tipo: 'saida', // Sempre saída
        status: 'pendente',
        anexos: files.map(f => ({ 
          id: f.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          nome: f.name, 
          url: f.url, 
          tamanho: f.size,
          tipo: f.type || 'application/octet-stream',
          uploaded_at: new Date().toISOString(),
          uploaded_by: ''
        })),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async (fileList: FileList) => {
    try {
      await uploadFiles(fileList);
    } catch (err) {
 console.error('Erro ao fazer upload:', err);
    }
  };

  const handleRemove = async (fileId: string) => {
    try {
      await removeFile(fileId);
    } catch (err) {
 console.error('Erro ao remover ficheiro:', err);
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            {comunicacao ? 'Editar Comunicação' : 'Nova Comunicação Interna'}
          </h1>
          <p className="text-muted-foreground">
            {comunicacao ? `Comunicação ${comunicacao.numero}` : 'Criar nova comunicação de saída'}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Comunicação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Assunto e Importância */}
          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto *</Label>
            <Input
              id="assunto"
              value={formData.assunto}
              onChange={(e) => handleChange('assunto', e.target.value)}
              placeholder="Assunto da comunicação"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prioridade">Importância *</Label>
              <select
                id="prioridade"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.prioridade}
                onChange={(e) => handleChange('prioridade', e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>

            <div className="space-y-2 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.confidencial}
                  onChange={(e) => handleChange('confidencial', e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Comunicação Confidencial</span>
              </label>
            </div>
          </div>

          {/* Departamento de Origem - sempre o do remetente, nao e escolhido manualmente */}
          <div className="space-y-2">
            <Label htmlFor="departamento_origem">Departamento de Origem</Label>
            <Input id="departamento_origem" value={formData.departamento_origem} disabled />
          </div>

          {/* Destinatário */}
          <div className="space-y-2">
            <Label htmlFor="departamento_destino">Departamento Destino *</Label>
            <select
              id="departamento_destino"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={formData.departamento_destino_id}
              onChange={(e) => {
                const dept = departamentosDisponiveis.find((d) => d.id === e.target.value);
                setFormData((prev) => ({
                  ...prev,
                  departamento_destino_id: e.target.value,
                  departamento_destino: dept?.nome || '',
                  // Muda o departamento: o destinatario especifico anterior
                  // pode ja nao pertencer a este departamento.
                  destinatario_id: '',
                  destinatario_nome: '',
                  destinatario_cargo: '',
                }));
                setDestinatarioSearch('');
              }}
            >
              <option value="">Seleccione um departamento</option>
              {departamentosDisponiveis.map(dep => (
                <option key={dep.id} value={dep.id}>{dep.nome}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Destinatário específico (opcional)</Label>
            {!formData.departamento_destino ? (
              <p className="text-xs text-muted-foreground p-3 border rounded-md bg-muted/30">
                Escolha primeiro o departamento de destino.
              </p>
            ) : destinatarioSelecionado ? (
              <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{destinatarioSelecionado.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {destinatarioSelecionado.email} · {destinatarioSelecionado.position || 'Sem cargo'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, destinatario_id: '', destinatario_nome: '', destinatario_cargo: '' }))}
                >
                  Alterar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Pesquisar por nome, e-mail ou cargo neste departamento..."
                  value={destinatarioSearch}
                  onChange={(e) => setDestinatarioSearch(e.target.value)}
                  className="pl-10"
                  autoComplete="off"
                />
                {destinatarioSearch.trim().length > 0 && (
                  <div className="mt-2 border rounded-md max-h-56 overflow-y-auto bg-background">
                    {destinatarioMatches.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum utilizador encontrado neste departamento
                      </p>
                    ) : (
                      destinatarioMatches.map((u) => (
                        <button
                          type="button"
                          key={u.id}
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              destinatario_id: u.id,
                              destinatario_nome: u.name,
                              destinatario_cargo: u.position || '',
                            }));
                            setDestinatarioSearch('');
                          }}
                          className="w-full flex items-center gap-2 p-3 text-left hover:bg-accent transition-colors border-b last:border-b-0"
                        >
                          <UserIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {u.email} · {u.position || 'Sem cargo'}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.destinatario_id
                ? 'A comunicação será entregue a este utilizador (e continua visível para o departamento).'
                : 'Sem destinatário específico: a comunicação é entregue a todos os utilizadores deste departamento.'}
            </p>
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo da Comunicação *</Label>
            <Textarea
              id="conteudo"
              value={formData.conteudo}
              onChange={(e) => handleChange('conteudo', e.target.value)}
              placeholder="Descreva o conteúdo da comunicação..."
              rows={10}
            />
          </div>

          {/* Anexos */}
          <div className="space-y-2">
            <Label>Anexos</Label>
            <FileUpload
              files={files}
              onUpload={handleUpload}
              onRemove={handleRemove}
              uploading={uploading}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Acção */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!formData.assunto || !formData.departamento_origem || !formData.departamento_destino || !formData.conteudo || submitting}
        >
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Enviar Comunicação
        </Button>
      </div>
    </div>
  );
}