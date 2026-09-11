import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../auth/auth-context';
import { toast } from 'sonner@2.0.3';
import { Bell, BellRing, Send, Users, User, Settings } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface PushStats {
  totalSubscriptions: number;
  totalNotifications: number;
  totalSent: number;
  totalFailed: number;
  recentNotifications: Array<{
    id: string;
    title: string;
    target: string;
    sent: number;
    failed: number;
    timestamp: string;
  }>;
}

export function PushNotificationManager() {
  const { accessToken, user } = useAuth();
  const [stats, setStats] = useState<PushStats>({
    totalSubscriptions: 0,
    totalNotifications: 0,
    totalSent: 0,
    totalFailed: 0,
    recentNotifications: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [vapidKey, setVapidKey] = useState('');
  
  useEffect(() => {
    if (accessToken) {
      loadPushStats();
      loadVapidKey();
      checkNotificationPermission();
    }
  }, [accessToken]);

  const loadPushStats = async () => {
    if (!accessToken || user?.role !== 'admin') return;

    try {
      const response = await fetch(`${API_BASE_URL}/push/stats`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
 console.error('Error loading push stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadVapidKey = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/push/vapid-key`);
      
      if (response.ok) {
        const data = await response.json();
        setVapidKey(data.publicKey);
      }
    } catch (error) {
 console.error('Error loading VAPID key:', error);
    }
  };

  const checkNotificationPermission = () => {
    if (!('Notification' in window)) {
      toast.error('Este navegador não suporta notificações push');
      return;
    }

    setIsSubscribed(Notification.permission === 'granted');
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Este navegador não suporta notificações push');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      toast.error('Este navegador não suporta Service Workers');
      return;
    }

    try {
      // Solicitar permissão
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Registrar service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Converter VAPID key para Uint8Array
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        
        // Criar subscription
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });

        // Enviar subscription para o servidor
        const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ subscription })
        });

        if (response.ok) {
          setIsSubscribed(true);
          toast.success('Notificações push ativadas com sucesso!');
          
          // Enviar notificação de teste
          await sendTestNotification();
        } else {
          toast.error('Erro ao registrar para notificações push');
        }
      } else {
        toast.error('Permissão para notificações negada');
      }
    } catch (error) {
 console.error('Error setting up push notifications:', error);
      toast.error('Erro ao configurar notificações push');
    }
  };

  const sendTestNotification = async () => {
    if (!accessToken || !user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/push/send-to-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          notification: {
            title: '🎉 Notificações Ativadas!',
            body: 'Você agora receberá notificações importantes do sistema.',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              type: 'test',
              timestamp: new Date().toISOString()
            },
            requireInteraction: true
          }
        })
      });

      if (response.ok) {
        toast.success('Notificação de teste enviada!');
      }
    } catch (error) {
 console.error('Error sending test notification:', error);
    }
  };

  const sendBulkNotification = async (target: 'all' | 'admin' | 'attendant' | 'user') => {
    if (!accessToken || user?.role !== 'admin') return;

    const titles = {
      all: '📢 Comunicado Geral',
      admin: '🔧 Comunicado para Administradores',
      attendant: '👥 Comunicado para Atendentes',
      user: '📝 Comunicado para Usuários'
    };

    const bodies = {
      all: 'Nova atualização importante no sistema para todos os usuários.',
      admin: 'Atenção administradores: nova funcionalidade disponível.',
      attendant: 'Atendentes: nova ferramenta de gerenciamento disponível.',
      user: 'Novos recursos disponíveis para suas solicitações.'
    };

    try {
      const endpoint = target === 'all' 
        ? '/push/broadcast'
        : `/push/send-to-role`;

      const body = target === 'all'
        ? {
            notification: {
              title: titles[target],
              body: bodies[target],
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              data: {
                type: 'broadcast',
                target,
                timestamp: new Date().toISOString()
              },
              actions: [
                {
                  action: 'view',
                  title: 'Ver Detalhes',
                  icon: '/action-view.png'
                }
              ]
            }
          }
        : {
            role: target,
            notification: {
              title: titles[target],
              body: bodies[target],
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              data: {
                type: 'role_notification',
                target,
                timestamp: new Date().toISOString()
              }
            }
          };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Notificação enviada! ${result.sent} enviadas, ${result.failed} falharam`);
        loadPushStats(); // Recarregar estatísticas
      } else {
        toast.error('Erro ao enviar notificação');
      }
    } catch (error) {
 console.error('Error sending bulk notification:', error);
      toast.error('Erro ao enviar notificação');
    }
  };

  // Função helper para converter VAPID key
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Gerenciamento de Notificações Push</h1>
        <p className="text-muted-foreground">
          Configure e monitore notificações push em tempo real
        </p>
      </div>

      {/* Status das notificações */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Status das Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Permissão do Navegador:</span>
              <Badge className={isSubscribed ? 'bg-tone-success-soft text-tone-success' : 'bg-tone-danger-soft text-tone-danger'}>
                {isSubscribed ? 'Ativada' : 'Desativada'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Suporte do Navegador:</span>
              <Badge className={('Notification' in window) ? 'bg-tone-success-soft text-tone-success' : 'bg-tone-danger-soft text-tone-danger'}>
                {('Notification' in window) ? 'Suportado' : 'Não Suportado'}
              </Badge>
            </div>

            {!isSubscribed && (
              <Button onClick={requestNotificationPermission} className="w-full">
                <BellRing className="h-4 w-4 mr-2" />
                Ativar Notificações Push
              </Button>
            )}

            {isSubscribed && (
              <Alert>
                <BellRing className="h-4 w-4" />
                <AlertDescription>
                  Notificações push estão ativas! Você receberá alertas importantes.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Configuração VAPID */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuração VAPID
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Chave Pública VAPID:</label>
              <div className="mt-1 p-2 bg-tone-neutral-soft rounded text-xs font-mono break-all">
                {vapidKey || 'Carregando...'}
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Esta chave é usada para autenticar notificações push com o navegador.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas (apenas para admins) */}
      {user?.role === 'admin' && !isLoading && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Subscriptions Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Notificações Enviadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalNotifications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-tone-success">
                {stats.totalSent + stats.totalFailed > 0 ? 
                  Math.round((stats.totalSent / (stats.totalSent + stats.totalFailed)) * 100) : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Falhas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-tone-danger">{stats.totalFailed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Envio de notificações (apenas para admins) */}
      {user?.role === 'admin' && (
        <Card>
          <CardHeader>
            <CardTitle>Enviar Notificação</CardTitle>
            <CardDescription>
              Envie notificações push para grupos específicos de usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <Button 
                onClick={() => sendBulkNotification('all')}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar para Todos
              </Button>

              <Button 
                onClick={() => sendBulkNotification('admin')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Enviar para Admins
              </Button>

              <Button 
                onClick={() => sendBulkNotification('attendant')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Enviar para Atendentes
              </Button>

              <Button 
                onClick={() => sendBulkNotification('user')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Enviar para Usuários
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de notificações (apenas para admins) */}
      {user?.role === 'admin' && stats.recentNotifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Notificações Recentes</CardTitle>
            <CardDescription>
              Últimas notificações push enviadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Alvo: {notification.target} | {formatDate(notification.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-tone-success-soft text-tone-success">
                      {notification.sent} enviadas
                    </Badge>
                    {notification.failed > 0 && (
                      <Badge className="bg-tone-danger-soft text-tone-danger">
                        {notification.failed} falharam
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}