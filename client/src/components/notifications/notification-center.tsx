import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { useAuth } from '../auth/auth-context';
import { toast } from 'sonner@2.0.3';
import { Bell, Mail, Calendar, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface EmailNotification {
  id: string;
  to: string;
  subject: string;
  body: string;
  type: 'status_change' | 'meeting_scheduled' | 'password_reset' | 'general';
  status: 'pending' | 'sent' | 'failed';
  created_at: string;
  sent_at?: string;
  data?: Record<string, any>;
}

export function NotificationCenter() {
  const { user, accessToken } = useAuth();
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<EmailNotification | null>(null);

  useEffect(() => {
    if (user && accessToken) {
      loadNotifications();
    }
  }, [user, accessToken]);

  const loadNotifications = async () => {
    if (!user || !accessToken) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/user/${user.email}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
 console.error('Failed to load notifications');
      }
    } catch (error) {
 console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateSendNotifications = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications/send-pending`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        toast.success('Notificações processadas com sucesso!');
        loadNotifications(); // Recarregar notificações
      } else {
        toast.error('Erro ao processar notificações');
      }
    } catch (error) {
 console.error('Error sending notifications:', error);
      toast.error('Erro ao processar notificações');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <Bell className="h-4 w-4" />;
      case 'meeting_scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'password_reset':
        return <Mail className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-tone-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-tone-danger" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-tone-warn" />;
      default:
        return <Clock className="h-4 w-4 text-tone-neutral" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-tone-success-soft text-tone-success';
      case 'failed':
        return 'bg-tone-danger-soft text-tone-danger';
      case 'pending':
        return 'bg-tone-warn-soft text-tone-warn';
      default:
        return 'bg-tone-neutral-soft text-tone-neutral';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1>Central de Notificações</h1>
          <p className="text-muted-foreground">Carregando notificações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Central de Notificações</h1>
          <p className="text-muted-foreground">
            Histórico de e-mails enviados pelo sistema
          </p>
        </div>
        
        {user?.role === 'admin' && (
          <Button onClick={simulateSendNotifications}>
            <Mail className="h-4 w-4 mr-2" />
            Processar Notificações Pendentes
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Total de Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tone-success">
              {notifications.filter(n => n.status === 'sent').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-tone-warn">
              {notifications.filter(n => n.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Notificações</CardTitle>
          <CardDescription>
            Lista de todas as notificações {user?.role === 'admin' ? 'do sistema' : 'enviadas para você'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50"
                  >
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{notification.subject}</h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={getStatusColor(notification.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(notification.status)}
                              <span className="capitalize">{notification.status === 'sent' ? 'enviada' : notification.status === 'pending' ? 'pendente' : 'falhou'}</span>
                            </div>
                          </Badge>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setSelectedNotification(notification)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>{notification.subject}</DialogTitle>
                                <DialogDescription>
                                  Enviado para: {notification.to} em {formatDate(notification.created_at)}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div>
                                    <h4 className="font-medium mb-2">Informações</h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span>Status:</span>
                                        <Badge className={getStatusColor(notification.status)}>
                                          {notification.status === 'sent' ? 'Enviada' : notification.status === 'pending' ? 'Pendente' : 'Falhou'}
                                        </Badge>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Tipo:</span>
                                        <span>{notification.type === 'status_change' ? 'Mudança de Status' : notification.type === 'meeting_scheduled' ? 'Reunião Agendada' : notification.type}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span>Criado:</span>
                                        <span>{formatDate(notification.created_at)}</span>
                                      </div>
                                      {notification.sent_at && (
                                        <div className="flex justify-between">
                                          <span>Enviado:</span>
                                          <span>{formatDate(notification.sent_at)}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="font-medium mb-2">Conteúdo do E-mail</h4>
                                  <div 
                                    className="border rounded-lg p-4 bg-white text-sm"
                                    dangerouslySetInnerHTML={{ __html: notification.body }}
                                  />
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">
                        Para: {notification.to}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Criado: {formatDate(notification.created_at)}</span>
                        {notification.sent_at && (
                          <span>Enviado: {formatDate(notification.sent_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}