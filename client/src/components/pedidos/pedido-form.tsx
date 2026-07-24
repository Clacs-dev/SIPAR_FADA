/**
 * Formulário de Criação de Tickets - Pedido e Helpdesk
 */

import { useState } from "react";
import { ShoppingCart, Upload, X, AlertCircle, Monitor, Laptop, Wifi, Mail, Phone, Lock, Settings, FileText, Image as ImageIcon, File } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { ImportanciaTicket } from "./types";

interface TicketFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  userProfile?: any;
}

const CATEGORIAS_SUPORTE = [
  { value: 'hardware', label: 'Hardware (Computador, Impressora, etc.)', icon: Monitor },
  { value: 'software', label: 'Software (Aplicações, Licenças)', icon: Laptop },
  { value: 'rede', label: 'Rede e Internet', icon: Wifi },
  { value: 'email', label: 'Email e Comunicação', icon: Mail },
  { value: 'telefonia', label: 'Telefonia', icon: Phone },
  { value: 'acesso', label: 'Acesso e Senhas', icon: Lock },
  { value: 'sistema', label: 'Sistemas Internos', icon: Settings },
  { value: 'outro', label: 'Outro', icon: FileText },
];

export function TicketForm({ open, onClose, onSubmit, userProfile }: TicketFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    importancia: 'normal' as ImportanciaTicket,
    categoria: '',
    direcao: userProfile?.department || '',
    funcao: userProfile?.funcao || '',
  });
  const [anexos, setAnexos] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.titulo.trim()) {
      alert('Por favor, informe um título para o ticket');
      return;
    }
    if (!formData.descricao.trim()) {
      alert('Por favor, descreva o problema encontrado');
      return;
    }
    if (!formData.direcao.trim()) {
      alert('Por favor, informe a sua direção/departamento');
      return;
    }
    if (!formData.funcao.trim()) {
      alert('Por favor, informe a sua função/cargo');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        anexos: anexos.map(file => ({
          nome: file.name,
          tipo: file.type,
          tamanho: file.size,
        })),
      });
      
      // Reset form
      setFormData({
        titulo: '',
        descricao: '',
        importancia: 'normal',
        categoria: '',
        direcao: userProfile?.department || '',
        funcao: userProfile?.funcao || '',
      });
      setAnexos([]);
      onClose();
    } catch (error) {
 console.error('Erro ao criar ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosAnexos = Array.from(e.target.files);
      setAnexos(prev => [...prev, ...novosAnexos]);
    }
  };

  const removerAnexo = (index: number) => {
    setAnexos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Novo Ticket de Suporte
          </DialogTitle>
          <DialogDescription>
            Descreva o problema encontrado e nossa equipe de TI irá ajudá-lo. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alerta Informativo */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Como funciona:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-800">
                <li>Você cadastra o ticket descrevendo o problema</li>
                <li>A equipe de TI recebe e abre o ticket</li>
                <li>Após a resolução, você confirma o fechamento</li>
              </ol>
            </div>
          </div>

          {/* Dados do Solicitante */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Dados do Solicitante
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="direcao">
                  Direção/Departamento *
                </Label>
                <Input
                  id="direcao"
                  value={formData.direcao}
                  onChange={(e) => setFormData(prev => ({ ...prev, direcao: e.target.value }))}
                  placeholder="Ex: Recursos Humanos"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="funcao">
                  Função/Cargo *
                </Label>
                <Input
                  id="funcao"
                  value={formData.funcao}
                  onChange={(e) => setFormData(prev => ({ ...prev, funcao: e.target.value }))}
                  placeholder="Ex: Assistente Administrativo"
                  required
                />
              </div>
            </div>
          </div>

          {/* Detalhes do Problema */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Detalhes do Problema
            </h3>

            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título do Problema *
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Impressora não funciona"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">
                  Categoria do Problema
                </Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                >
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_SUPORTE.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.icon && <cat.icon className="h-5 w-5 mr-2" />}
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="importancia">
                  Nível de Importância *
                </Label>
                <Select
                  value={formData.importancia}
                  onValueChange={(value: ImportanciaTicket) => setFormData(prev => ({ ...prev, importancia: value }))}
                >
                  <SelectTrigger id="importancia">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">
                Descrição Detalhada do Problema *
              </Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva detalhadamente o problema encontrado, quando começou, mensagens de erro, etc."
                rows={6}
                required
              />
              <p className="text-xs text-muted-foreground">
                Seja o mais específico possível para ajudar nossa equipe a resolver o problema rapidamente.
              </p>
            </div>
          </div>

          {/* Anexos */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Anexos (Opcional)
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="anexos">
                Documentos ou Imagens
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="anexos"
                  type="file"
                  onChange={handleFileChange}
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="icon">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anexe capturas de tela, fotos ou documentos que ajudem a entender o problema.
              </p>
            </div>

            {/* Lista de Anexos */}
            {anexos.length > 0 && (
              <div className="space-y-2">
                <Label>Arquivos Anexados ({anexos.length})</Label>
                <div className="border rounded-lg divide-y">
                  {anexos.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <File className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removerAnexo(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}