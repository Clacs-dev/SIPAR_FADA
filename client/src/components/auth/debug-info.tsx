import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { ScrollArea } from '../ui/scroll-area';
import { ChevronDown, Bug, Info, Globe } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export function DebugInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);
    setDebugData(null);

    const results = {
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        apiBaseUrl: API_BASE_URL,
        authConfigured: !!localStorage.getItem('access_token')
      },
      connectivity: {
        serverHealth: 'checking',
        serverHealthDetails: null,
        authEndpoint: 'checking',
        authEndpointDetails: null
      },
      errors: []
    };

    // Test 1: Server Health
    try {
 console.log('Testing server health...');
      const healthResponse = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET'
      });

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        results.connectivity.serverHealth = 'online';
        results.connectivity.serverHealthDetails = healthData;
 console.log('Server health OK:', healthData);
      } else {
        results.connectivity.serverHealth = 'error';
        results.connectivity.serverHealthDetails = {
          status: healthResponse.status,
          statusText: healthResponse.statusText
        };
        results.errors.push(`Server health check failed: ${healthResponse.status}`);
      }
    } catch (healthError) {
 console.error('Health check error:', healthError);
      results.connectivity.serverHealth = 'offline';
      results.connectivity.serverHealthDetails = { error: healthError.message };
      results.errors.push(`Server health check error: ${healthError.message}`);
    }

    // Test 2: Auth endpoint
    try {
 console.log('Testing auth endpoint...');
      const authResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(false),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'test@test.com', password: 'test' })
      });

      // Esperamos um erro 401 ou 400, não um erro de rede
      if (authResponse.status === 401 || authResponse.status === 400) {
        results.connectivity.authEndpoint = 'online';
        results.connectivity.authEndpointDetails = {
          status: authResponse.status,
          message: 'Endpoint responding (invalid credentials expected)'
        };
 console.log('Auth endpoint OK (returned expected error)');
      } else {
        const authData = await authResponse.json();
        results.connectivity.authEndpoint = 'error';
        results.connectivity.authEndpointDetails = {
          status: authResponse.status,
          data: authData
        };
        results.errors.push(`Unexpected auth endpoint response: ${authResponse.status}`);
      }
    } catch (authError) {
 console.error('Auth endpoint error:', authError);
      results.connectivity.authEndpoint = 'offline';
      results.connectivity.authEndpointDetails = { error: authError.message };
      results.errors.push(`Auth endpoint error: ${authError.message}`);
    }

    setDebugData(results);
    setIsChecking(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full text-xs">
          <Bug className="h-3 w-3 mr-2" />
          Diagnósticos de Conexão
          <ChevronDown className={`h-3 w-3 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="mt-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4" />
                Informações de Debug
              </CardTitle>
              <Button 
                size="sm" 
                onClick={runDiagnostics} 
                disabled={isChecking}
                variant="outline"
              >
                <Globe className="h-3 w-3 mr-1" />
                {isChecking ? 'Testando...' : 'Executar Testes'}
              </Button>
            </div>
          </CardHeader>
          
          {debugData && (
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-4 text-xs">
                  <div>
                    <h4 className="font-medium mb-2">Ambiente</h4>
                    <div className="space-y-1 pl-2">
                      <div>API: {debugData.environment.apiBaseUrl}</div>
                      <div>Auth local: {debugData.environment.authConfigured ? 'sim' : 'nao'}</div>
                      <div>URL: {debugData.environment.url}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Conectividade</h4>
                    <div className="space-y-2 pl-2">
                      <div className="flex items-center gap-2">
                        <span>Server Health:</span>
                        <Badge variant={
                          debugData.connectivity.serverHealth === 'online' ? 'default' : 'destructive'
                        }>
                          {debugData.connectivity.serverHealth}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>Auth Endpoint:</span>
                        <Badge variant={
                          debugData.connectivity.authEndpoint === 'online' ? 'default' : 'destructive'
                        }>
                          {debugData.connectivity.authEndpoint}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {debugData.errors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">Erros Encontrados</h4>
                      <div className="space-y-1 pl-2">
                        {debugData.errors.map((error: string, index: number) => (
                          <div key={index} className="text-red-600 bg-red-50 p-2 rounded">
                            {error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Teste executado em: {debugData.timestamp && new Date(debugData.timestamp).toLocaleString('pt-BR')}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
