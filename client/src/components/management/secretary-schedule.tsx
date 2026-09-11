import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { ScheduleMeetingDialog } from "./schedule-meeting-dialog";
import { DocumentViewer } from "../forms/document-viewer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Eye, Calendar as CalendarIconLucide, FileText, Clock } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { format } from "date-fns@4.1.0";
import { ptBR } from "date-fns@4.1.0/locale";

export function SecretarySchedule() {
  const [presentations, setPresentations] = useState<any[]>([]);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [allPresentations, setAllPresentations] = useState<any[]>([]);
  const [allAudiences, setAllAudiences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<'presentation' | 'audience'>('audience');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

 console.log('Fetching requests for secretary...');

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
        // Armazenar TODOS os pedidos
        setAllPresentations(data.data || []);
        // Filtrar apenas as aceites pelo admin (aguardando agendamento)
        const accepted = data.data?.filter((p: any) => p.status === 'aceite_admin') || [];
 console.log('Presentations aceites pelo admin:', accepted.length);
 console.log('Total de presentations:', data.data?.length || 0);
        setPresentations(accepted);
      }

      if (audiencesResponse.ok) {
        const data = await audiencesResponse.json();
        // Armazenar TODOS os pedidos
        setAllAudiences(data.data || []);
        // Filtrar apenas as aceites pelo admin (aguardando agendamento)
        const accepted = data.data?.filter((a: any) => a.status === 'aceite_admin') || [];
 console.log('Audiences aceites pelo admin:', accepted.length);
 console.log('Total de audiences:', data.data?.length || 0);
        setAudiences(accepted);
      }

    } catch (error) {
 console.error('Error fetching data:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = (request: any, type: 'presentation' | 'audience') => {
    setSelectedRequest(request);
    setSelectedType(type);
    setScheduleDialogOpen(true);
  };

  const filteredPresentations = presentations;
  const filteredAudiences = audiences;
  const filteredAllPresentations = allPresentations;
  const filteredAllAudiences = allAudiences;

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      'pendente': { label: 'Pendente', className: 'bg-[var(--status-pendente)] text-[var(--status-pendente-foreground)]' },
      'aceite_admin': { label: 'Aceite-Admin', className: 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]' },
      'delegado': { label: 'Delegado', className: 'bg-[var(--status-delegado)] text-[var(--status-delegado-foreground)]' },
      'agendado': { label: 'Agendado', className: 'bg-[var(--status-agendado)] text-[var(--status-agendado-foreground)]' },
      'aprovado': { label: 'Aprovado', className: 'bg-[var(--status-aceite)] text-[var(--status-aceite-foreground)]' },
      'rejeitado': { label: 'Rejeitado', className: 'bg-[var(--status-rejeitado)] text-[var(--status-rejeitado-foreground)]' },
      'cancelado': { label: 'Cancelado', className: 'bg-[var(--status-rejeitado)] text-[var(--status-rejeitado-foreground)]' },
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge variant="none" className={statusInfo.className}>{statusInfo.label}</Badge>;
  };

  const renderTable = (requests: any[], type: 'presentation' | 'audience') => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhuma solicitação encontrada
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Email</TableHead>
            {type === 'presentation' && <TableHead>Área</TableHead>}
            {type === 'audience' && <TableHead>Motivo</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.company}</TableCell>
              <TableCell>{request.contact || request.contactPerson}</TableCell>
              <TableCell className="text-sm">{request.email}</TableCell>
              {type === 'presentation' && <TableCell>{request.area}</TableCell>}
              {type === 'audience' && <TableCell className="max-w-xs truncate">{request.reason}</TableCell>}
              <TableCell>
                {getStatusBadge(request.status)}
              </TableCell>
              <TableCell className="text-sm">
                {request.createdAt ? 
                  format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) 
                  : 'N/A'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {request.documentPath && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Documento</DialogTitle>
                          <DialogDescription>
                            {request.documentName || 'Documento anexo'}
                          </DialogDescription>
                        </DialogHeader>
                        <DocumentViewer 
                          filePath={request.documentPath} 
                          fileName={request.documentName}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Solicitação</DialogTitle>
                        <DialogDescription>
                          {type === 'presentation' ? 'Carta de Apresentação' : 'Pedido de Audiência'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Empresa</p>
                            <p>{request.company}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Contacto</p>
                            <p>{request.contact || request.contactPerson}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p>{request.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Telefone</p>
                            <p>{request.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            {getStatusBadge(request.status)}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data de Criação</p>
                            <p>{request.createdAt ? format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</p>
                          </div>
                        </div>
                        {type === 'presentation' && (
                          <div>
                            <p className="text-sm text-muted-foreground">Mensagem</p>
                            <p className="mt-1">{request.message || 'N/A'}</p>
                          </div>
                        )}
                        {type === 'audience' && (
                          <div>
                            <p className="text-sm text-muted-foreground">Motivo</p>
                            <p className="mt-1">{request.reason || 'N/A'}</p>
                          </div>
                        )}
                        {request.status === 'agendado' && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Informações do Agendamento</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Data</p>
                                <p>{request.preferredDate ? format(new Date(request.preferredDate), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Hora</p>
                                <p>{request.time || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Tipo</p>
                                <p>{request.meetingType === 'online' ? 'Online' : 'Presencial'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Duração</p>
                                <p>{request.duration || 'N/A'}</p>
                              </div>
                              {request.meetingType === 'online' && request.platform && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Plataforma</p>
                                  <p>{request.platform}</p>
                                </div>
                              )}
                              {request.meetingType === 'presencial' && request.location && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Local</p>
                                  <p>{request.location}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {request.status === 'aceite_admin' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleSchedule(request, type)}
                      className="gap-2"
                    >
                      <CalendarIconLucide className="h-4 w-4" />
                      Agendar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderAllRequestsTable = (requests: any[], type: 'presentation' | 'audience') => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhuma solicitação encontrada
          </p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Empresa</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Email</TableHead>
            {type === 'presentation' && <TableHead>Área</TableHead>}
            {type === 'audience' && <TableHead>Motivo</TableHead>}
            <TableHead>Status</TableHead>
            <TableHead>Data de Criação</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => (
            <TableRow key={request.id}>
              <TableCell>{request.company}</TableCell>
              <TableCell>{request.contact || request.contactPerson}</TableCell>
              <TableCell className="text-sm">{request.email}</TableCell>
              {type === 'presentation' && <TableCell>{request.area}</TableCell>}
              {type === 'audience' && <TableCell className="max-w-xs truncate">{request.reason}</TableCell>}
              <TableCell>
                {getStatusBadge(request.status)}
              </TableCell>
              <TableCell className="text-sm">
                {request.createdAt ? 
                  format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) 
                  : 'N/A'}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {request.documentPath && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle>Documento</DialogTitle>
                          <DialogDescription>
                            {request.documentName || 'Documento anexo'}
                          </DialogDescription>
                        </DialogHeader>
                        <DocumentViewer 
                          filePath={request.documentPath} 
                          fileName={request.documentName}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalhes da Solicitação</DialogTitle>
                        <DialogDescription>
                          {type === 'presentation' ? 'Carta de Apresentação' : 'Pedido de Audiência'}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Empresa</p>
                            <p>{request.company}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Contacto</p>
                            <p>{request.contact || request.contactPerson}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p>{request.email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Telefone</p>
                            <p>{request.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            {getStatusBadge(request.status)}
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Data de Criação</p>
                            <p>{request.createdAt ? format(new Date(request.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}</p>
                          </div>
                        </div>
                        {type === 'presentation' && (
                          <div>
                            <p className="text-sm text-muted-foreground">Mensagem</p>
                            <p className="mt-1">{request.message || 'N/A'}</p>
                          </div>
                        )}
                        {type === 'audience' && (
                          <div>
                            <p className="text-sm text-muted-foreground">Motivo</p>
                            <p className="mt-1">{request.reason || 'N/A'}</p>
                          </div>
                        )}
                        {request.status === 'agendado' && (
                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-2">Informações do Agendamento</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Data</p>
                                <p>{request.preferredDate ? format(new Date(request.preferredDate), "dd/MM/yyyy", { locale: ptBR }) : 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Hora</p>
                                <p>{request.time || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Tipo</p>
                                <p>{request.meetingType === 'online' ? 'Online' : 'Presencial'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Duração</p>
                                <p>{request.duration || 'N/A'}</p>
                              </div>
                              {request.meetingType === 'online' && request.platform && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Plataforma</p>
                                  <p>{request.platform}</p>
                                </div>
                              )}
                              {request.meetingType === 'presencial' && request.location && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Local</p>
                                  <p>{request.location}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>

                  {request.status === 'aceite_admin' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleSchedule(request, type)}
                      className="gap-2"
                    >
                      <CalendarIconLucide className="h-4 w-4" />
                      Agendar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Agendamento - Secretaria</h1>
        <p className="text-muted-foreground">
          Solicitações aceites pelo Administrador aguardando agendamento
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Aguardando Agendamento
              </CardTitle>
              <CardDescription>
                Total: {presentations.length + audiences.length} solicitações
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="audiences" className="space-y-4">
            <TabsList>
              <TabsTrigger value="audiences">
                Audiências ({filteredAudiences.length})
              </TabsTrigger>
              <TabsTrigger value="presentations">
                Apresentações ({filteredPresentations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="audiences">
              {renderTable(filteredAudiences, 'audience')}
            </TabsContent>

            <TabsContent value="presentations">
              {renderTable(filteredPresentations, 'presentation')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Todos os Pedidos Recebidos
              </CardTitle>
              <CardDescription>
                Total: {allPresentations.length + allAudiences.length} solicitações (todos os status)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all-audiences" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all-audiences">
                Audiências ({filteredAllAudiences.length})
              </TabsTrigger>
              <TabsTrigger value="all-presentations">
                Apresentações ({filteredAllPresentations.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all-audiences">
              {renderAllRequestsTable(filteredAllAudiences, 'audience')}
            </TabsContent>

            <TabsContent value="all-presentations">
              {renderAllRequestsTable(filteredAllPresentations, 'presentation')}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {selectedRequest && (
        <ScheduleMeetingDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          audience={selectedRequest}
          type={selectedType}
          onSuccess={() => {
            fetchData();
            toast.success("Reunião agendada com sucesso! O requerente foi notificado.");
          }}
        />
      )}
    </div>
  );
}