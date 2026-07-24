import { useState } from 'react';
import api from '../services/api';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
  tipo: string;
}

export function useFileUpload(bucketName: string = 'make-8b82752b-documents') {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Função para inicializar buckets no servidor
  const initializeBuckets = async () => {
    try {
      const result = await api.post<{ success: boolean; error?: string }>('/storage/init-buckets');
      if (!result.success) {
 console.error('Erro ao inicializar buckets:', result.error);
      }
      return result.success;
    } catch (err) {
 console.error('Erro ao inicializar buckets:', err);
      return false;
    }
  };

  const uploadFiles = async (fileList: FileList, retryOnBucketError: boolean = true): Promise<UploadedFile[]> => {
    setUploading(true);
    setError(null);
    const uploadedFiles: UploadedFile[] = [];

    try {
 console.log(` Iniciando upload de ${fileList.length} ficheiro(s) para bucket: ${bucketName}`);
      
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];

 console.log(` Uploading ficheiro ${i + 1}/${fileList.length}: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        // Criar FormData para enviar o ficheiro
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucketName', bucketName);

        // Upload via servidor (usando SERVICE_ROLE para bypassar RLS)
        const result = await api.upload<{ success: boolean; file: UploadedFile; error?: string }>('/storage/upload', formData);

        if (result.error) {
          // Se o erro for "Bucket not found" e ainda não tentamos inicializar, tentar criar os buckets
          if (result.error?.includes('Bucket not found') && retryOnBucketError) {
 console.warn(' Bucket não encontrado. Tentando inicializar buckets...');
            const initialized = await initializeBuckets();
            if (initialized) {
 console.log(' Buckets inicializados. Tentando upload novamente...');
              // Tentar upload novamente (sem retry adicional)
              return uploadFiles(fileList, false);
            }
          }
 console.error(' Erro ao fazer upload:', result.error);
          throw new Error(result.error || 'Erro ao fazer upload');
        }

 console.log(` Upload concluído: ${result.file.name}`);

        const uploadedFile: UploadedFile = {
          id: result.file.id,
          name: result.file.name,
          size: result.file.size,
          url: result.file.url,
          tipo: result.file.tipo,
        };
        uploadedFiles.push(uploadedFile);
 console.log(` URL gerado para: ${file.name}`);
      }

      setFiles((prev) => [...prev, ...uploadedFiles]);
 console.log(` Upload completo! ${uploadedFiles.length} ficheiro(s) carregado(s) com sucesso.`);
      return uploadedFiles;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao fazer upload';
      setError(errorMsg);
 console.error(' Erro fatal no upload:', err);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    try {
      // Remover via servidor (usando SERVICE_ROLE para bypassar RLS)
      const result = await api.delete<{ success: boolean; error?: string }>(`/storage/delete?bucketName=${encodeURIComponent(bucketName)}&filePath=${encodeURIComponent(fileId)}`);
      if (result.error) {
 console.error('Erro ao remover ficheiro:', result.error);
        throw new Error(result.error || 'Erro ao remover ficheiro');
      }

      // Remover do estado local
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
 console.log(` Ficheiro removido: ${fileId}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao remover ficheiro';
      setError(errorMsg);
      throw err;
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setError(null);
  };

  const setInitialFiles = (initialFiles: UploadedFile[]) => {
    setFiles(initialFiles);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return {
    files,
    uploading,
    error,
    uploadFiles,
    removeFile,
    clearFiles,
    setInitialFiles,
    formatFileSize,
  };
}
