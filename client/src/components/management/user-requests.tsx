import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Eye } from "lucide-react";
import { useAuth } from "../auth/auth-context";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { format } from "date-fns@4.1.0";
import { ptBR } from "date-fns@4.1.0/locale";
import { DocumentViewer } from "../forms/document-viewer";

export function UserRequests() {
  const { user } = useAuth();
  const [userPresentations, setUserPresentations] = useState<any[]>([]);
  const [userAudiences, setUserAudiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserRequests();
  }, []);

  const fetchUserRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Sessão expirada");
        return;
      }

      // Fetch presentations
      const presentationsResponse = await fetch(
        `${API_BASE_URL}/presentations`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      // Fetch audiences
      const audiencesResponse = await fetch(
        `${API_BASE_URL}/audiences`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (presentationsResponse.ok) {
        const data = await presentationsResponse.json();
        // Filtrar apenas as do usuário logado
        const myPresentations = data.data?.filter((p: any) => p.userId === user?.id) || [];
        setUserPresentations(myPresentations);
      }

      if (audiencesResponse.ok) {
        const data = await audiencesResponse.json();
        // Filtrar apenas as do usuário logado
        const myAudiences = data.data?.filter((a: any) => a.userId === user?.id) || [];
        setUserAudiences(myAudiences);
      }

    } catch (error) {
 console.error('Error fetching user requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  // Função para transformar status interno para o que o usuário vê
  const getUserVisibleStatus = (status: string) => {
    // Usuário vê PENDENTE até que seja AGENDADO
    if (status === 'aceite_admin' || status === 'delegado') {
      return 'pendente'; // Ainda em análise
    }
    if (status === 'agendado' || status === 'aprovado') {
      return 'agendado'; // Foi agendado
    }
    return status; // pendente, rejeitado, etc
  };

  const getStatusColor = (status: string) => {
    const visibleStatus = getUserVisibleStatus(status);
    switch (visibleStatus) {
      case 'pendente': return 'bg-[var(--status-pendente)] text-[var(--status-pendente-foreground)]';
      case 'agendado': return 'bg-[var(--status-agendado)] text-[var(--status-agendado-foreground)]';
      case 'aprovado': return 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]';
      case 'revisada': return 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]';
      case 'confirmado': return 'bg-[var(--status-agendado)] text-[var(--status-agendado-foreground)]';
      case 'rejeitado': return 'bg-[var(--status-rejeitado)] text-[var(--status-rejeitado-foreground)]';
      case 'cancelado': return 'bg-[var(--status-rejeitado)] text-[var(--status-rejeitado-foreground)]';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    const visibleStatus = getUserVisibleStatus(status);
    const labels: Record<string, string> = {
      'pendente': 'Pendente',
      'agendado': 'Agendado',
      'aprovado': 'Aprovado',
      'revisada': 'Revisada',
      'rejeitado': 'Rejeitado',
      'confirmado': 'Confirmado',
      'cancelado': 'Cancelado'
    };
    return labels[visibleStatus] || visibleStatus;
  };

  const RequestDetails = ({ item, type }: { item: any, type: string }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{type === 'presentation' ? 'Detalhes da Carta' : 'Detalhes da Audiência'}</DialogTitle>
          <DialogDescription>
            Informações completas da sua solicitação
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4>Status</h4>
              <Badge className={getStatusColor(item.status)}>
                {getStatusLabel(item.status)}
              </Badge>
            </div>
            <div>
              <h4>Data de Submissão</h4>
              <p>{item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
            </div>
          </div>
          {type === 'presentation' ? (
            <div>
              <h4>Conteúdo da Carta</h4>
              <p className="text-sm text-muted-foreground">{item.content || item.purpose}</p>
              {item.documentUrl && (
                <div className="mt-4">
                  <h4>Documento</h4>
                  <DocumentViewer documentUrl={item.documentUrl} />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4>Tipo de Reunião</h4>
                  <p>{item.status === 'pendente' ? 'A definir' : (item.meetingType === 'online' ? `Online${item.platform ? ' - ' + item.platform : ''}` : 'Presencial')}</p>
                </div>
                <div>
                  <h4>Data/Hora Solicitada</h4>
                  {item.preferredDate ? (
                    <p>{item.preferredDate} às {item.time}</p>
                  ) : (
                    <p className="text-muted-foreground">Aguardando agendamento</p>
                  )}
                </div>
              </div>
              <div className="w-full">
                <h4>Motivo</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words w-full overflow-visible">{item.reason}</p>
              </div>
              {item.meetingLink && (
                <div>
                  <h4>Link/Local da Reunião</h4>
                  <p className="text-sm text-blue-600">{item.meetingLink}</p>
                </div>
              )}
              {item.location && !item.meetingLink && (
                <div>
                  <h4>Local da Reunião</h4>
                  <p className="text-sm">{item.location}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1>Minhas Solicitações</h1>
        <p className="text-muted-foreground">Acompanhe o status das suas cartas e pedidos de audiência</p>
      </div>

      <Tabs defaultValue="presentations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="presentations">Minhas Cartas de Apresentação</TabsTrigger>
          <TabsTrigger value="audiences">Minhas Audiências</TabsTrigger>
        </TabsList>

        <TabsContent value="presentations">
          <Card>
            <CardHeader>
              <CardTitle>Cartas de Apresentação</CardTitle>
              <CardDescription>
                Histórico das suas cartas submetidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : userPresentations.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma carta de apresentação submetida ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Área</TableHead>
                      <TableHead>Finalidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userPresentations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.area}</TableCell>
                        <TableCell>{item.purpose}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.createdAt ? format(new Date(item.createdAt), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <RequestDetails item={item} type="presentation" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audiences">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de Audiência</CardTitle>
              <CardDescription>
                Histórico das suas solicitações de reunião
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Carregando...</p>
              ) : userAudiences.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum pedido de audiência submetido ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAudiences.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.status === 'pendente' ? (
                            <span className="text-muted-foreground text-sm">A definir</span>
                          ) : (
                            <div>
                              <p>{item.meetingType === 'online' ? 'Online' : 'Presencial'}</p>
                              {item.platform && (
                                <p className="text-xs text-muted-foreground">{item.platform}</p>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.preferredDate ? (
                            <div>
                              <p>{item.preferredDate}</p>
                              <p className="text-xs text-muted-foreground">{item.time} ({item.duration})</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Aguardando agendamento</span>
                          )}
                        </TableCell>
                        <TableCell>{item.reason}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <RequestDetails item={item} type="audience" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}