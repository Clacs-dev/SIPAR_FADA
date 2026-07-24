import { useRef, useState } from 'react';
import { Upload, X, FileIcon, Loader2 } from 'lucide-react';
import { Button } from './button';
import { UploadedFile } from '../../hooks/use-file-upload';

interface FileUploadProps {
  files: UploadedFile[];
  uploading: boolean;
  onUpload: (files: FileList) => Promise<void>;
  onRemove: (fileId: string) => Promise<void>;
  formatFileSize?: (bytes: number) => string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // em MB
}

// Função auxiliar para formatar tamanho de arquivo
const defaultFormatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export function FileUpload({
  files,
  uploading,
  onUpload,
  onRemove,
  formatFileSize = defaultFormatFileSize,
  accept,
  multiple = true,
  maxSize = 10,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFiles = (fileList: FileList): boolean => {
    setError(null);
    const maxSizeBytes = maxSize * 1024 * 1024;
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > maxSizeBytes) {
        setError(`O ficheiro "${file.name}" excede o tamanho máximo de ${maxSize}MB`);
        return false;
      }
    }
    return true;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (validateFiles(e.dataTransfer.files)) {
        await onUpload(e.dataTransfer.files);
      }
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (validateFiles(e.target.files)) {
        try {
          await onUpload(e.target.files);
          // Resetar o input para permitir selecionar o mesmo ficheiro novamente
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        } catch (error) {
 console.error('Erro no upload:', error);
          setError(error instanceof Error ? error.message : 'Erro ao fazer upload');
          // Resetar o input mesmo em caso de erro
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        }
      }
    }
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Área de Upload */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              A fazer upload...
            </p>
          </div>
        ) : (
          <>
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-2">
              Arraste ficheiros ou clique para fazer upload
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Tamanho máximo: {maxSize}MB por ficheiro
            </p>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleChange}
              accept={accept}
              multiple={multiple}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={handleButtonClick}
              disabled={uploading}
            >
              Selecionar Ficheiros
            </Button>
          </>
        )}
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Lista de Ficheiros */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm">
            Ficheiros anexados ({files.length})
          </p>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
              >
                <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(file.id)}
                  className="flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}