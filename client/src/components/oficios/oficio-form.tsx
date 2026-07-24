import { useState } from "react";
import { FileSignature, Upload, X, Save, Send, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Oficio, OficioType } from "./types";
import { FileUpload } from "../ui/file-upload";
import { useFileUpload } from "../../hooks/use-file-upload";

interface OficioFormProps {
  oficio?: Oficio;
  onSave: (oficio: Partial<Oficio>) => void;
  onCancel: () => void;
}

export function OficioForm({ oficio, onSave, onCancel }: OficioFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [formData, setFormData] = useState({
    tipo: oficio?.tipo || 'saida' as OficioType,
    assunto: oficio?.assunto || '',
    remetente: oficio?.remetente || '',
    destinatario: oficio?.destinatario || '',
    email_remetente: oficio?.email_remetente || '', // Novo campo para email do remetente
    departamento_origem: oficio?.departamento_origem || '',
    departamento_destino: oficio?.departamento_destino || '',
    nome_empresa_solicitante: oficio?.nome_empresa_solicitante || '',
    nif_empresa: oficio?.nif_empresa || '',
    conteudo: oficio?.conteudo || '',
    prioridade: oficio?.prioridade || 'normal',
    prazo_resposta: oficio?.prazo_resposta || '',
  });

  const {
    files,
    uploading,
    uploadFiles,
    removeFile,
    formatFileSize,
  } = useFileUpload('make-8b82752b-oficios');

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    onSave({
      ...formData,
      status: 'rascunho',
      anexos: files.map(f => ({ 
        id: f.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nome: f.name, 
        url: f.url, 
        tamanho: f.size,
        tipo: f.type || 'application/octet-stream',
        uploaded_at: new Date().toISOString()
      })),
      despachos: [], // Garantir que despachos seja um array vazio
    });
    setSavingDraft(false);
  };

  const handleRegister = async () => {
    setSubmitting(true);
    onSave({
      ...formData,
      status: 'pendente', // Mudado de 'registado' para 'pendente'
      anexos: files.map(f => ({ 
        id: f.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        nome: f.name, 
        url: f.url, 
        tamanho: f.size,
        tipo: f.type || 'application/octet-stream',
        uploaded_at: new Date().toISOString()
      })),
      despachos: [], // Garantir que despachos seja um array vazio
    });
    setSubmitting(false);
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
            <FileSignature className="h-6 w-6" />
            {oficio ? 'Editar Ofício' : 'Novo Ofício'}
          </h1>
          <p className="text-muted-foreground">
            {oficio ? `Ofício ${oficio.numero}` : 'Criar nova correspondência oficial'}
          </p>
        </div>
        <Button variant="outline" onClick={onCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Ofício</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Tipo de Ofício */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Ofício *</Label>
              <select
                id="tipo"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
              >
                <option value="entrada">Entrada (Recebido)</option>
                <option value="saida">Saída (Enviado)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Importância *</Label>
              <select
                id="prioridade"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.prioridade}
                onChange={(e) => handleChange('prioridade', e.target.value)}
              >
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Remetente/Destinatário */}
          <div className="grid gap-4 md:grid-cols-2">
            {formData.tipo === 'entrada' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="remetente">Remetente *</Label>
                  <Input
                    id="remetente"
                    placeholder="Nome da entidade/pessoa"
                    value={formData.remetente}
                    onChange={(e) => handleChange('remetente', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email_remetente">Email do Remetente *</Label>
                  <Input
                    id="email_remetente"
                    type="email"
                    placeholder="exemplo@email.com"
                    value={formData.email_remetente}
                    onChange={(e) => handleChange('email_remetente', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    📧 O remetente será notificado por email quando o ofício for despachado
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="destinatario">Destinatário *</Label>
                <Input
                  id="destinatario"
                  placeholder="Nome da entidade/pessoa"
                  value={formData.destinatario}
                  onChange={(e) => handleChange('destinatario', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="prazo_resposta">Prazo de Resposta</Label>
              <Input
                id="prazo_resposta"
                type="date"
                value={formData.prazo_resposta}
                onChange={(e) => handleChange('prazo_resposta', e.target.value)}
              />
            </div>
          </div>

          {/* Departamentos */}
          <div className="grid gap-4 md:grid-cols-2">
            {formData.tipo === 'entrada' ? (
              // Campos para ofícios de ENTRADA (empresa externa)
              <>
                <div className="space-y-2">
                  <Label htmlFor="nome_empresa_solicitante">Nome da Empresa Solicitante *</Label>
                  <Input
                    id="nome_empresa_solicitante"
                    placeholder="Ex: Empresa ABC, Lda"
                    value={formData.nome_empresa_solicitante}
                    onChange={(e) => handleChange('nome_empresa_solicitante', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nif_empresa">NIF da Empresa *</Label>
                  <Input
                    id="nif_empresa"
                    placeholder="Ex: 5000123456"
                    value={formData.nif_empresa}
                    onChange={(e) => handleChange('nif_empresa', e.target.value)}
                  />
                </div>
              </>
            ) : (
              // Campos para ofícios de SAÍDA (internos)
              <div className="space-y-2">
                <Label htmlFor="departamento_origem">Departamento Origem</Label>
                <select
                  id="departamento_origem"
                  className="w-full px-3 py-2 border border-input rounded-md bg-background"
                  value={formData.departamento_origem}
                  onChange={(e) => handleChange('departamento_origem', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  <option value="Gabinete do Governador">Gabinete do Governador</option>
                  <option value="Administração">Administração</option>
                  <option value="Financeiro">Financeiro</option>
                  <option value="Recursos Humanos">Recursos Humanos</option>
                  <option value="Operações">Operações</option>
                  <option value="Jurídico">Jurídico</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="departamento_destino">Departamento Destino</Label>
              <select
                id="departamento_destino"
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                value={formData.departamento_destino}
                onChange={(e) => handleChange('departamento_destino', e.target.value)}
              >
                <option value="">Selecione...</option>
                <option value="Gabinete do Governador">Gabinete do Governador</option>
                <option value="Administração">Administração</option>
                <option value="Financeiro">Financeiro</option>
                <option value="Recursos Humanos">Recursos Humanos</option>
                <option value="Operações">Operações</option>
                <option value="Jurídico">Jurídico</option>
              </select>
            </div>
          </div>

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto *</Label>
            <Input
              id="assunto"
              placeholder="Assunto do ofício"
              value={formData.assunto}
              onChange={(e) => handleChange('assunto', e.target.value)}
            />
          </div>

          {/* Conteúdo */}
          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <Textarea
              id="conteudo"
              placeholder="Digite o conteúdo completo do ofício..."
              rows={10}
              value={formData.conteudo}
              onChange={(e) => handleChange('conteudo', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {formData.conteudo.length} caracteres
            </p>
          </div>

          {/* Anexos */}
          <div className="space-y-2">
            <Label>Anexos</Label>
            <FileUpload
              files={files}
              uploading={uploading}
              onUpload={handleUpload}
              onRemove={handleRemove}
              formatFileSize={formatFileSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="outline" onClick={handleSaveDraft} disabled={savingDraft}>
          {savingDraft ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Rascunho
        </Button>
        <Button onClick={handleRegister} disabled={submitting}>
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Registar Ofício
        </Button>
      </div>
    </div>
  );
}