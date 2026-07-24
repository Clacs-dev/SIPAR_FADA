/**
 * Diálogo de Compartilhamento
 * Permite compartilhar documentos/registros com outros usuários
 */

import { useState, useEffect } from 'react';
import { Share2, Search, X, Check, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Alert, AlertDescription } from '../ui/alert';
import { apiClient } from '../../utils/api-client';
import { toast } from 'sonner@2.0.3';

interface Usuario {
  id: string;
  name: string;
  email: string;
  department?: string;
  position?: string;
}

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (usuarioIds: string[], permissao: 'leitura' | 'edicao') => Promise<boolean>;
  title?: string;
  description?: string;
  itemType?: string; // 'ofício', 'factura', 'viatura', 'acta'
}

export function ShareDialog({
  open,
  onClose,
  onSubmit,
  title = 'Compartilhar',
  description = 'Selecione os usuários com quem deseja compartilhar',
  itemType = 'documento',
}: ShareDialogProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [selectedUsuarios, setSelectedUsuarios] = useState<Set<string>>(new Set());
  const [permissao, setPermissao] = useState<'leitura' | 'edicao'>('leitura');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  /**
   * Carregar lista de usuários
   */
  useEffect(() => {
    if (open) {
      loadUsuarios();
    } else {
      // Limpar estado ao fechar
      setSelectedUsuarios(new Set());
      setPermissao('leitura');
      setSearchTerm('');
    }
  }, [open]);

  const loadUsuarios = async () => {
    setLoadingUsuarios(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const users = await apiClient.getAllUsers(token);
      setUsuarios(users);
    } catch (error) {
 console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar lista de usuários');
    } finally {
      setLoadingUsuarios(false);
    }
  };

  /**
   * Filtrar usuários por termo de busca
   */
  const filteredUsuarios = usuarios.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Toggle seleção de usuário
   */
  const toggleUsuario = (userId: string) => {
    const newSelected = new Set(selectedUsuarios);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsuarios(newSelected);
  };

  /**
   * Selecionar todos os usuários filtrados
   */
  const selectAll = () => {
    const newSelected = new Set<string>();
    filteredUsuarios.forEach(u => newSelected.add(u.id));
    setSelectedUsuarios(newSelected);
  };

  /**
   * Limpar seleção
   */
  const clearSelection = () => {
    setSelectedUsuarios(new Set());
  };

  /**
   * Executar compartilhamento
   */
  const handleShare = async () => {
    if (selectedUsuarios.size === 0) {
      toast.error('Selecione pelo menos um usuário');
      return;
    }

    setLoading(true);
    try {
      const success = await onSubmit(Array.from(selectedUsuarios), permissao);
      if (success) {
        onClose();
      }
    } catch (error) {
 console.error('Erro ao compartilhar:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tipo de Permissão */}
          <div className="space-y-2">
            <Label>Nível de Permissão</Label>
            <RadioGroup value={permissao} onValueChange={(v) => setPermissao(v as 'leitura' | 'edicao')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="leitura" id="leitura" />
                <Label htmlFor="leitura" className="cursor-pointer">
                  <div>
                    <div>Apenas Leitura</div>
                    <div className="text-sm text-muted-foreground">
                      O usuário pode visualizar, mas não editar
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="edicao" id="edicao" />
                <Label htmlFor="edicao" className="cursor-pointer">
                  <div>
                    <div>Leitura e Edição</div>
                    <div className="text-sm text-muted-foreground">
                      O usuário pode visualizar e editar
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Aviso de segurança */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Compartilhar {itemType} concede acesso aos dados. Compartilhe apenas com usuários autorizados.
            </AlertDescription>
          </Alert>

          {/* Busca de usuários */}
          <div className="space-y-2">
            <Label>Selecionar Usuários</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou departamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={loadingUsuarios}
              >
                Selecionar Todos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSelection}
                disabled={selectedUsuarios.size === 0}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lista de usuários selecionados */}
          {selectedUsuarios.size > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">
                Selecionados ({selectedUsuarios.size}):
              </span>
              {Array.from(selectedUsuarios).map(userId => {
                const usuario = usuarios.find(u => u.id === userId);
                return usuario ? (
                  <Badge key={userId} variant="secondary" className="gap-1">
                    {usuario.name}
                    <button
                      type="button"
                      onClick={() => toggleUsuario(userId)}
                      className="ml-1 hover:bg-background rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}

          {/* Lista de usuários */}
          <div className="border rounded-lg max-h-64 overflow-y-auto">
            {loadingUsuarios ? (
              <div className="p-8 text-center text-muted-foreground">
                Carregando usuários...
              </div>
            ) : filteredUsuarios.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum usuário encontrado
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsuarios.map((usuario) => (
                  <div
                    key={usuario.id}
                    className="flex items-start gap-3 p-3 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => toggleUsuario(usuario.id)}
                  >
                    <Checkbox
                      checked={selectedUsuarios.has(usuario.id)}
                      onCheckedChange={() => toggleUsuario(usuario.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{usuario.name}</span>
                        {selectedUsuarios.has(usuario.id) && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{usuario.email}</p>
                      {(usuario.department || usuario.position) && (
                        <div className="flex gap-2 mt-1">
                          {usuario.department && (
                            <Badge variant="outline" className="text-xs">
                              {usuario.department}
                            </Badge>
                          )}
                          {usuario.position && (
                            <Badge variant="outline" className="text-xs">
                              {usuario.position}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleShare} disabled={loading || selectedUsuarios.size === 0}>
            {loading ? 'Compartilhando...' : `Compartilhar com ${selectedUsuarios.size} usuário${selectedUsuarios.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}