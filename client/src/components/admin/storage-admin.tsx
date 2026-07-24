import { useState } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export function StorageAdmin() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const recreateBuckets = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isto vai DELETAR todos os ficheiros existentes nos buckets e recriá-los. Tem certeza?')) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/storage/recreate-buckets`,
        {
          method: 'POST',
          headers: {
            ...getAuthHeaders(false),
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: '✅ Buckets recriados com sucesso! Pode fazer upload de qualquer tipo de ficheiro agora.' });
      } else {
        setMessage({ type: 'error', text: `❌ Erro: ${result.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Erro ao recriar buckets: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Administração de Storage
        </CardTitle>
        <CardDescription>
          Gerir configurações dos buckets de armazenamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm">
                <strong>Recriar Buckets:</strong> Se estiver com erros de "MIME type not supported", 
                use este botão para deletar e recriar todos os buckets com configurações corretas.
              </p>
              <p className="text-sm text-muted-foreground">
                ⚠️ <strong>ATENÇÃO:</strong> Isto vai deletar TODOS os ficheiros existentes!
              </p>
            </div>
          </div>
        </div>

        <Button
          onClick={recreateBuckets}
          disabled={loading}
          variant="destructive"
          className="w-full"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              A recriar buckets...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Recriar Todos os Buckets
            </>
          )}
        </Button>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-900'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-900'
            }`}
          >
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1 pt-4 border-t">
          <p><strong>Buckets configurados:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>make-8b82752b-documents (Documentos gerais)</li>
            <li>make-8b82752b-oficios (Ofícios)</li>
            <li>make-8b82752b-facturas (Facturas)</li>
            <li>make-8b82752b-frotas (Frotas/Viaturas)</li>
            <li>make-8b82752b-actas (Actas de reuniões)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
