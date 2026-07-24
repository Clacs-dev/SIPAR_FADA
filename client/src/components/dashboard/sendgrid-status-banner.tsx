import { useState, useEffect } from 'react';
import { AlertCircle, X, Settings } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface SendGridStatusBannerProps {
  onConfigure: () => void;
}

export function SendGridStatusBanner({ onConfigure }: SendGridStatusBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkEmailStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/email/test`,
          {
            method: 'GET',
            headers: {
              ...getAuthHeaders(false),
              'Content-Type': 'application/json',
            },
          }
        );

        // Verificar se a resposta é ok antes de tentar fazer parse
        if (!response.ok) {
 console.warn('Email status check returned non-OK status:', response.status);
          // Não mostrar banner em caso de erro de rede
          return;
        }

        const data = await response.json();
        
        if (!data.success) {
          setShowBanner(true);
          setStatusMessage(data.message || 'Gmail SMTP não configurado');
        }
      } catch (error) {
        // Silenciar erros de rede (CORS, connection failed, etc)
        // O banner só aparece se conseguirmos confirmar que o email NÃO está configurado
 console.debug('Email status check skipped (network error):', error);
      }
    };

    checkEmailStatus();
  }, []);

  if (!showBanner || dismissed) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">⚠️ Gmail SMTP não configurado</p>
          <p className="text-sm mt-1">{statusMessage}</p>
          <p className="text-xs mt-2">
            Os emails automáticos de ofícios despachados não serão enviados até configurar o Gmail.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button
            size="sm"
            variant="outline"
            onClick={onConfigure}
            className="bg-white text-red-600 hover:bg-red-50"
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurar Gmail
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDismissed(true)}
            className="text-white hover:bg-red-600/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}