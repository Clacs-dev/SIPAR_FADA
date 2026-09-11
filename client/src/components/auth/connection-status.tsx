import { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Wifi, WifiOff, RefreshCw, Server, AlertTriangle } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface ConnectionStatus {
  server: 'online' | 'offline' | 'checking';
  database: 'online' | 'offline' | 'checking';
  lastCheck: string | null;
  error?: string;
}

export function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>({
    server: 'checking',
    database: 'checking', 
    lastCheck: null
  });
  const [isManualCheck, setIsManualCheck] = useState(false);

  const checkConnectionStatus = async (isManual = false) => {
    if (isManual) setIsManualCheck(true);
    
    setStatus(prev => ({
      ...prev,
      server: 'checking',
      database: 'checking',
      error: undefined
    }));

    try {
 console.log('Checking server connection...');
      
      // Verificar servidor
      const serverUrl = `${API_BASE_URL}/health`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const serverResponse = await fetch(serverUrl, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (serverResponse.ok) {
          const serverData = await serverResponse.json();
 console.log('Server status:', serverData);
          setStatus(prev => ({ ...prev, server: 'online' }));
        } else {
 console.error('Server returned error:', serverResponse.status);
          setStatus(prev => ({ 
            ...prev, 
            server: 'offline', 
            error: `Server error: ${serverResponse.status}` 
          }));
        }
      } catch (serverError) {
 console.error('Server connection error:', serverError);
        setStatus(prev => ({ 
          ...prev, 
          server: 'offline',
          error: serverError.name === 'AbortError' ? 'Server timeout' : 'Server connection failed'
        }));
      }

      // Verificar database através de uma rota simples
      try {
        const dbResponse = await fetch(`${API_BASE_URL}/stats`, {
          headers: {
            ...getAuthHeaders(false),
            'Content-Type': 'application/json'
          }
        });

        if (dbResponse.ok) {
 console.log('Database connection OK');
          setStatus(prev => ({ ...prev, database: 'online' }));
        } else {
 console.error('Database connection error:', dbResponse.status);
          setStatus(prev => ({ 
            ...prev, 
            database: 'offline',
            error: `Database error: ${dbResponse.status}`
          }));
        }
      } catch (dbError) {
 console.error('Database check error:', dbError);
        setStatus(prev => ({ 
          ...prev, 
          database: 'offline',
          error: 'Database connection failed'
        }));
      }

      setStatus(prev => ({ 
        ...prev, 
        lastCheck: new Date().toLocaleString('pt-BR') 
      }));

    } catch (generalError) {
 console.error('General connection error:', generalError);
      setStatus(prev => ({ 
        ...prev, 
        server: 'offline',
        database: 'offline',
        error: 'General connection error',
        lastCheck: new Date().toLocaleString('pt-BR')
      }));
    } finally {
      if (isManual) setIsManualCheck(false);
    }
  };

  useEffect(() => {
    checkConnectionStatus();
    
    // Verificar a cada 60 segundos
    const interval = setInterval(() => {
      checkConnectionStatus();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (statusType: 'online' | 'offline' | 'checking') => {
    switch (statusType) {
      case 'online':
        return <Badge className="bg-tone-success-soft text-tone-success">Online</Badge>;
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>;
      case 'checking':
        return <Badge variant="secondary">Verificando...</Badge>;
    }
  };

  const getStatusIcon = (statusType: 'online' | 'offline' | 'checking') => {
    switch (statusType) {
      case 'online':
        return <Wifi className="h-4 w-4 text-tone-success" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-tone-danger" />;
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
  };

  const hasConnectionIssues = status.server === 'offline' || status.database === 'offline';

  return (
    <div className="space-y-3">
      {hasConnectionIssues && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-medium">Problema de conectividade detectado</div>
            <div className="text-sm">
              Se o problema persistir, verifique sua conexão com a internet ou entre em contato com o suporte técnico.
            </div>
            {status.error && (
              <div className="text-xs bg-muted/50 p-2 rounded">
                Erro técnico: {status.error}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {getStatusIcon(status.server)}
            <span>Servidor</span>
            {getStatusBadge(status.server)}
          </div>
          
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-muted-foreground" />
            <span>Base de dados</span>
            {getStatusBadge(status.database)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {status.lastCheck && (
            <span className="text-xs text-muted-foreground">
              Última verificação: {status.lastCheck}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkConnectionStatus(true)}
            disabled={isManualCheck}
            className="h-6 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isManualCheck ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}