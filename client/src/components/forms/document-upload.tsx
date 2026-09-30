import { useState, useRef } from "react";
import { previewDocument } from "../ui/document-preview";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Upload, X, FileText, Download, Loader2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface DocumentUploadProps {
  label?: string;
  folder: string;
  onUploadComplete?: (filePath: string, fileName: string) => void;
  onRemove?: () => void;
  currentFile?: { path: string; name: string } | null;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  required?: boolean;
}

export function DocumentUpload({
  label = "Documento",
  folder,
  onUploadComplete,
  onRemove,
  currentFile = null,
  maxSizeMB = 10,
  acceptedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/jpg"
  ],
  required = false
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ path: string; name: string } | null>(currentFile);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!acceptedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado. Apenas PDF, Word, Excel e imagens são permitidos.");
      return;
    }

    // Validar tamanho
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast.error(`O arquivo não pode exceder ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);

    try {
      const token = getToken();
      if (!token) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        setUploading(false);
        return;
      }

      const body = new FormData();
      body.append('file', file);
      body.append('module', folder);

      const response = await fetch(
        `${API_BASE_URL}/documents/upload`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Sem 'Content-Type': o browser define o boundary do multipart automaticamente.
          },
          body
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || error.error || 'Erro ao fazer upload');
      }

      const data = await response.json();
      const filePath = data.file?.url || data.path;

      const uploadedFileInfo = {
        path: filePath,
        name: file.name
      };

      setUploadedFile(uploadedFileInfo);
      toast.success("Documento enviado com sucesso!");

      if (onUploadComplete) {
        onUploadComplete(filePath, file.name);
      }
    } catch (error) {
 console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer upload do documento');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
    toast.success("Documento removido");
  };

  const handleDownload = async () => {
    if (!uploadedFile) return;

    setDownloading(true);

    try {
      const token = getToken();
      if (!token) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/documents/signed-url`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filePath: uploadedFile.path
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao obter link de download');
      }

      const data = await response.json();
      
 previewDocument({ url: data.url, nome: uploadedFile.name || uploadedFile.path.split('/').pop() });
      
    } catch (error) {
 console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao baixar documento');
    } finally {
      setDownloading(false);
    }
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || '';
  };

  const getFileTypeLabel = (fileName: string) => {
    const ext = getFileExtension(fileName);
    const typeMap: Record<string, string> = {
      'pdf': 'PDF',
      'doc': 'Word',
      'docx': 'Word',
      'xls': 'Excel',
      'xlsx': 'Excel',
      'jpg': 'Imagem',
      'jpeg': 'Imagem',
      'png': 'Imagem'
    };
    return typeMap[ext] || ext.toUpperCase();
  };

  return (
    <div className="space-y-2">
      <Label>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      
      {!uploadedFile ? (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept={acceptedTypes.join(',')}
            disabled={uploading}
            required={required}
          />
          
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground">
                  A enviar documento...
                </p>
              </>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar um documento
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, Word, Excel ou Imagens (máx. {maxSizeMB}MB)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Selecionar Ficheiro
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getFileTypeLabel(uploadedFile.name)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        Formatos aceites: PDF, Word (.doc, .docx), Excel (.xls, .xlsx), Imagens (.jpg, .png)
      </p>
    </div>
  );
}
