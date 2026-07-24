/**
 * Formulário Público de Reclamação
 * Permite que usuários externos submetam reclamações sem autenticação
 */

import { useState } from "react";
import { X, Upload, FileText, Loader2, AlertCircle } from "lucide-react";
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
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface ReclamacaoFormPublicaProps {
  onSuccess: (codigo: string, numero: string) => void;
}

export function ReclamacaoFormPublica({ onSuccess }: ReclamacaoFormPublicaProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    assunto: "",
    descricao: "",
    prioridade: "media",
    reclamante_email: "",
    reclamante_nome: "",
    reclamante_telefone: "",
  });
  const [anexos, setAnexos] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    if (!formData.assunto || !formData.descricao || !formData.reclamante_email) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload de anexos (se existirem)
      let anexosUrls: string[] = [];
      if (anexos.length > 0) {
        const uploadPromises = anexos.map(async (file) => {
          const formDataUpload = new FormData();
          formDataUpload.append("file", file);
          
          const response = await fetch(
            `${API_BASE_URL}/reclamacoes/upload`,
            {
              method: "POST",
              headers: {
                ...getAuthHeaders(false),
              },
              body: formDataUpload,
            }
          );

          if (!response.ok) {
            throw new Error("Erro ao fazer upload do anexo");
          }

          const data = await response.json();
          return data.url;
        });

        anexosUrls = await Promise.all(uploadPromises);
      }

      // 2. Criar reclamação
      const response = await fetch(
        `${API_BASE_URL}/reclamacoes/publica`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(false),
          },
          body: JSON.stringify({
            ...formData,
            anexos: anexosUrls,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar reclamação");
      }

      const data = await response.json();
      
      toast.success("Reclamação registada com sucesso!");
      onSuccess(data.reclamacao.codigo_rastreio, data.reclamacao.numero);
      
    } catch (error: any) {
 console.error("Erro ao criar reclamação:", error);
      toast.error(error.message || "Erro ao criar reclamação");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    // Validar tamanho (10MB máximo)
    const MAX_SIZE = 10 * 1024 * 1024;
    const validFiles = files.filter((file) => {
      if (file.size > MAX_SIZE) {
        toast.error(`Arquivo ${file.name} excede 10MB`);
        return false;
      }
      return true;
    });

    setAnexos((prev) => [...prev, ...validFiles]);
  };

  const removeAnexo = (index: number) => {
    setAnexos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Submeter Reclamação</h2>
        <p className="text-muted-foreground">
          Preencha o formulário abaixo. Receberá um código de rastreio para acompanhar a sua reclamação.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados do Reclamante */}
        <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Seus Dados
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="reclamante_nome">Nome *</Label>
            <Input
              id="reclamante_nome"
              value={formData.reclamante_nome}
              onChange={(e) => setFormData({ ...formData, reclamante_nome: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reclamante_email">Email *</Label>
            <Input
              id="reclamante_email"
              type="email"
              value={formData.reclamante_email}
              onChange={(e) => setFormData({ ...formData, reclamante_email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reclamante_telefone">Telefone (opcional)</Label>
            <Input
              id="reclamante_telefone"
              type="tel"
              placeholder="+244..."
              value={formData.reclamante_telefone}
              onChange={(e) => setFormData({ ...formData, reclamante_telefone: e.target.value })}
              disabled={loading}
            />
          </div>
        </div>

        {/* Dados da Reclamação */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto *</Label>
            <Input
              id="assunto"
              placeholder="Breve descrição do problema"
              value={formData.assunto}
              onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridade">Importância *</Label>
            <Select
              value={formData.prioridade}
              onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
              disabled={loading}
            >
              <SelectTrigger id="prioridade">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição Detalhada *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva detalhadamente o problema..."
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
              rows={6}
              disabled={loading}
            />
          </div>
        </div>

        {/* Anexos */}
        <div className="space-y-4">
          <Label>Anexos (opcional)</Label>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Arraste ficheiros ou clique para selecionar
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Máximo 10MB por ficheiro
            </p>
            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-upload"
              disabled={loading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => document.getElementById("file-upload")?.click()}
              disabled={loading}
            >
              Selecionar Ficheiros
            </Button>
          </div>

          {anexos.length > 0 && (
            <div className="space-y-2">
              {anexos.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAnexo(index)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              A enviar...
            </>
          ) : (
            "Submeter Reclamação"
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Após submeter, receberá um código de rastreio no seu email para acompanhar o estado da reclamação.
        </p>
      </form>
    </div>
  );
}
