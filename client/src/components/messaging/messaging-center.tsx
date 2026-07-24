import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { useAuth } from '../auth/auth-context';
import { toast } from 'sonner@2.0.3';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Filter, 
  Mail, 
  MailOpen, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Plus,
  User,
  Building
} from 'lucide-react';
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface Message {
  id: string;
  from_user_id: string;
  from_user_name: string;
  from_user_role: string;
  to_user_id: string;
  to_user_name: string;
  to_user_role: string;
  subject: string;
  content: string;
  message_type: 'internal' | 'system' | 'notification';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'archived';
  related_to_type?: 'presentation' | 'audience_request';
  related_to_id?: string;
  created_at: string;
  read_at?: string;
}

interface NewMessage {
  to_user_id: string;
  subject: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  related_to_type?: 'presentation' | 'audience_request';
  related_to_id?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function MessagingCenter() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState<NewMessage>({
    to_user_id: '',
    subject: '',
    content: '',
    priority: 'medium'
  });

  useEffect(() => {
    if (user?.id) {
      loadMessages();
      loadUsers();
    }
  }, [user?.id]);

  const loadMessages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens');
      }

      const data = await response.json();
 console.log('Mensagens carregadas:', data.messages?.length || 0);
      setMessages(data.messages || []);
    } catch (error) {
 console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        return;
      }

 console.log('Carregando lista de usuários...');
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        }
      });

      if (response.ok) {
        const data = await response.json();
 console.log('Usuários carregados:', data.users?.length || 0);
        // Filtrar o próprio usuário da lista
        const filteredUsers = data.users?.filter((u: User) => u.id !== user?.id) || [];
 console.log('Usuários disponíveis para mensagem:', filteredUsers.length);
        setUsers(filteredUsers);
      } else {
 console.error('Erro ao carregar usuários:', response.status);
      }
    } catch (error) {
 console.error('Erro ao carregar usuários:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.to_user_id || !newMessage.subject || !newMessage.content) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        },
        body: JSON.stringify(newMessage)
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      toast.success('Mensagem enviada com sucesso!');
      setIsComposeOpen(false);
      setNewMessage({
        to_user_id: '',
        subject: '',
        content: '',
        priority: 'medium'
      });
      loadMessages();
    } catch (error) {
 console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(false),
          'Content-Type': 'application/json',
          'x-user-id': user?.id || ''
        }
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, status: 'read', read_at: new Date().toISOString() } : msg
        ));
      }
    } catch (error) {
 console.error('Erro ao marcar mensagem como lida:', error);
    }
  };

  const getFilteredMessages = () => {
    let filtered = messages;

    // Filtrar por aba
    if (activeTab === 'inbox') {
      filtered = filtered.filter(msg => msg.to_user_id === user?.id);
    } else if (activeTab === 'sent') {
      filtered = filtered.filter(msg => msg.from_user_id === user?.id);
    } else if (activeTab === 'unread') {
      filtered = filtered.filter(msg => msg.to_user_id === user?.id && msg.status === 'unread');
    }

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.from_user_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por prioridade
    if (filterPriority !== 'all') {
      filtered = filtered.filter(msg => msg.priority === filterPriority);
    }

    // Filtrar por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(msg => msg.status === filterStatus);
    }

    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'secondary';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertCircle className="h-4 w-4" />;
      case 'high': return <AlertCircle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const unreadCount = messages.filter(msg => msg.to_user_id === user?.id && msg.status === 'unread').length;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Centro de Mensagens</h1>
          <p className="text-muted-foreground">
            Gerencie comunicações internas do sistema
          </p>
        </div>
        <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Mensagem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Mensagem</DialogTitle>
              <DialogDescription>
                Envie uma mensagem para outro usuário do sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipient">Destinatário *</Label>
                {users.length === 0 ? (
                  <div className="p-3 border rounded-md bg-muted/50">
                    <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                  </div>
                ) : (
                  <Select value={newMessage.to_user_id} onValueChange={(value) => {
 console.log('Usuário selecionado:', value);
                    setNewMessage(prev => ({ ...prev, to_user_id: value }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o destinatário" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} - {u.role === 'admin' ? 'Administrador' : u.role === 'attendant' ? 'Atendente' : 'Requerente'} ({u.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {users.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {users.length} usuário(s) disponível(is) para envio de mensagem
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select value={newMessage.priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                  setNewMessage(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Assunto *</Label>
                <Input
                  id="subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Digite o assunto da mensagem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Mensagem *</Label>
                <Textarea
                  id="content"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite sua mensagem aqui..."
                  rows={4}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={sendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top 1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar mensagens..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="inbox" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Recebidas</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center space-x-2">
                <Send className="h-4 w-4" />
                <span>Enviadas</span>
              </TabsTrigger>
              <TabsTrigger value="unread" className="flex items-center space-x-2">
                <MailOpen className="h-4 w-4" />
                <span>Não Lidas</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <ScrollArea className="h-[600px]">
                {getFilteredMessages().length === 0 ? (
                  <Alert>
                    <MessageSquare className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma mensagem encontrada para os filtros selecionados.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {getFilteredMessages().map((message) => (
                      <Card 
                        key={message.id} 
                        className={`cursor-pointer transition-colors hover:bg-accent ${
                          message.status === 'unread' && message.to_user_id === user?.id ? 'border-primary' : ''
                        }`}
                        onClick={() => {
                          setSelectedMessage(message);
                          if (message.status === 'unread' && message.to_user_id === user?.id) {
                            markAsRead(message.id);
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center space-x-2">
                                {message.status === 'unread' && message.to_user_id === user?.id && (
                                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                                )}
                                <Badge variant={getPriorityColor(message.priority)}>
                                  {getPriorityIcon(message.priority)}
                                  <span className="ml-1 capitalize">{message.priority}</span>
                                </Badge>
                                <Badge variant={message.message_type === 'system' ? 'secondary' : 'outline'}>
                                  {message.message_type === 'system' ? 'Sistema' : 'Interna'}
                                </Badge>
                                {message.related_to_type && (
                                  <Badge variant="outline">
                                    {message.related_to_type === 'presentation' ? 'Carta' : 'Audiência'}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">
                                    {activeTab === 'sent' ? message.to_user_name : message.from_user_name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {activeTab === 'sent' ? `Para: ${message.to_user_role}` : `De: ${message.from_user_role}`}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(message.created_at).toLocaleDateString('pt-BR')}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(message.created_at).toLocaleTimeString('pt-BR', { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium">{message.subject}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {message.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para visualizar mensagem completa */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMessage && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-2">
                  <Badge variant={getPriorityColor(selectedMessage.priority)}>
                    {getPriorityIcon(selectedMessage.priority)}
                    <span className="ml-1 capitalize">{selectedMessage.priority}</span>
                  </Badge>
                  <Badge variant={selectedMessage.message_type === 'system' ? 'secondary' : 'outline'}>
                    {selectedMessage.message_type === 'system' ? 'Sistema' : 'Interna'}
                  </Badge>
                </div>
                <DialogTitle>{selectedMessage.subject}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center justify-between">
                    <span>
                      De: {selectedMessage.from_user_name} ({selectedMessage.from_user_role})
                    </span>
                    <span>
                      {new Date(selectedMessage.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <Separator />
              <div className="max-h-96 overflow-y-auto">
                <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
              </div>
              {selectedMessage.read_at && (
                <div className="text-xs text-muted-foreground">
                  Lida em: {new Date(selectedMessage.read_at).toLocaleString('pt-BR')}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}