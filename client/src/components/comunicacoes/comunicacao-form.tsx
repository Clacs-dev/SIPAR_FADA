import { useState } from "react";
import { MessageSquare, X, Save, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Comunicacao } from "./types";
import { FileUpload } from "../ui/file-upload";
import { useFileUpload } from "../../hooks/use-file-upload";

interface ComunicacaoFormProps {
  comunicacao?: Comunicacao;
  onSave: (comunicacao: Partial<Comunicacao>) => void;
  onCancel: () => void;
}

export function ComunicacaoForm({ comunicacao, onSave, onCancel }: ComunicacaoFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    assunto: comunicacao?.assunto || '',
    departamento_destino: comunicacao?.departamento_destino || '',
    destinatario_nome: comunicacao?.destinatario_nome || '',
    destinatario_cargo: comunicacao?.destinatario_cargo || '',
    conteudo: comunicacao?.conteudo || '',
    prioridade: comunicacao?.prioridade || 'normal',
    confidencial: comunicacao?.confidencial || false,
    departamento_origem: comunicacao?.departamento_origem || '',
  });

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

  const departamentos = [
    'Gabinete PCA',
    'Gabinete PCE',
    'Gabinete Administrador',
    'Gabinete Director',
    'Gestão',
    'Gabinete Ministro',
    'Gabinete Secretário de Estado 1',
    'Gabinete Secretário de Estado 2',
    'Gabinete Vice-Governador 1',
    'Gabinete Vice-Governador 2',
    'Financeiro',
    'Recursos Humanos',
    'Jurídico',
    'Compras',
    'Tecnologia e Informação',
    'Operações',
    'Operacional Frota',
    'Administração',
    'Administrativo',
    'Comunicação e Imagem',
    'Segurança',
    'Secretaria',
    'Externo',
    'Planeamento',
    'Organização e Qualidade',
    'Compliance',
    'Risco',
  ];

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

          {/* Departamento de Origem */}
          <div className="space-y-2">
            <Label htmlFor="departamento_origem">Departamento de Origem *</Label>
            <select
              id="departamento_origem"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              value={formData.departamento_origem}
              onChange={(e) => handleChange('departamento_origem', e.target.value)}
            >
              <option value="">Seleccione um departamento</option>
              {departamentos.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          {/* Destinatário */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="departamento_destino">Departamento Destino *</Label>
              <select
                id="departamento_destino"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.departamento_destino}
                onChange={(e) => handleChange('departamento_destino', e.target.value)}
              >
                <option value="">Seleccione um departamento</option>
                {departamentos.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destinatario_nome">Nome do Destinatário</Label>
              <Input
                id="destinatario_nome"
                value={formData.destinatario_nome}
                onChange={(e) => handleChange('destinatario_nome', e.target.value)}
                placeholder="Nome completo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinatario_cargo">Cargo do Destinatário</Label>
            <Input
              id="destinatario_cargo"
              value={formData.destinatario_cargo}
              onChange={(e) => handleChange('destinatario_cargo', e.target.value)}
              placeholder="Cargo/Função"
            />
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