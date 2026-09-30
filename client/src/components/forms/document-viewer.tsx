import { useState } from "react";
import { previewDocument } from "../ui/document-preview";
import { Button } from "../ui/button";
import { FileText, Download, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface DocumentViewerProps {
  filePath: string;
  fileName: string;
  showLabel?: boolean;
  variant?: "default" | "compact";
}

export function DocumentViewer({
  filePath,
  fileName,
  showLabel = true,
  variant = "default"
}: DocumentViewerProps) {
  const [downloading, setDownloading] = useState(false);

  const getToken = () => {
    return localStorage.getItem('access_token');
  };

  const handleDownload = async () => {
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
            filePath: filePath
          })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao obter link de download');
      }

      const data = await response.json();
      
      previewDocument({ url: data.url, nome: fileName || filePath.split('/').pop() });
      
    } catch (error) {
 console.error('Download error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao abrir documento');
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

  if (variant === "compact") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDownload}
        disabled={downloading}
        className="gap-2"
      >
        {downloading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        Ver Documento
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      {showLabel && (
        <p className="text-sm text-muted-foreground">Documento Anexado</p>
      )}
      <div className="flex items-center gap-2 p-3 border border-border rounded-lg bg-muted/20">
        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground">
            {getFileTypeLabel(fileName)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="gap-2"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Abrir
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
