import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner@2.0.3";
import { 
  FileText, 
  Calendar, 
  Users, 
  Eye, 
  Download, 
  CheckCircle,
  Clock,
  Search,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';
import { Acta } from "./acta-types";
import { ActaDetails } from "./acta-details";

export function ActasList() {
  const { user, accessToken } = useAuth();
  const [actas, setActas] = useState<Acta[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedActa, setSelectedActa] = useState<Acta | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadActas();
  }, [user]);

  const loadActas = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `${API_BASE_URL}/actas`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar actas');
      }

      const data = await response.json();
      setActas(data.actas || []);
    } catch (error) {
 console.error('Erro ao carregar actas:', error);
      toast.error('Erro ao carregar actas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pendente: { label: 'Pendente', color: 'bg-yellow-500' },
      em_curso: { label: 'Em Curso', color: 'bg-blue-500' },
      finalizada: { label: 'Finalizada', color: 'bg-green-500' },
      aprovada: { label: 'Aprovada', color: 'bg-green-700' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pendente;
    return <Badge className={`${badge.color} text-white`}>{badge.label}</Badge>;
  };

  const filterActas = (status: string) => {
    let filtered = actas;
    
    // Filtrar por status
    if (status !== 'todas') {
      filtered = filtered.filter(a => a.status === status);
    }
    
    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.organizador_nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleViewDetails = (acta: Acta) => {
    setSelectedActa(acta);
    setShowDetails(true);
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedActa(null);
    loadActas(); // Recarregar lista
  };

  const handleDownloadPDF = async (actaId: string) => {
    try {
      toast.info('A gerar PDF...');
      
      const response = await fetch(
        `${API_BASE_URL}/actas/${actaId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }

      // Obter o blob do PDF
      const blob = await response.blob();
      
      // Obter o nome do arquivo do header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'acta.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Criar URL temporário e fazer download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF baixado com sucesso!');
    } catch (error) {
 console.error('Erro ao baixar PDF:', error);
      toast.error('Erro ao baixar PDF');
    }
  };

  if (showDetails && selectedActa) {
    return (
      <ActaDetails 
        acta={selectedActa} 
        onBack={handleCloseDetails}
        onUpdate={loadActas}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">A carregar actas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Actas de Reuniões
            </CardTitle>
            <CardDescription>
              Geradas automaticamente a partir de reuniões agendadas
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar actas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="todas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="todas">
              Todas ({actas.length})
            </TabsTrigger>
            <TabsTrigger value="pendente">
              Pendentes ({actas.filter(a => a.status === 'pendente').length})
            </TabsTrigger>
            <TabsTrigger value="em_curso">
              Em Curso ({actas.filter(a => a.status === 'em_curso').length})
            </TabsTrigger>
            <TabsTrigger value="finalizada">
              Finalizadas ({actas.filter(a => a.status === 'finalizada').length})
            </TabsTrigger>
            <TabsTrigger value="aprovada">
              Aprovadas ({actas.filter(a => a.status === 'aprovada').length})
            </TabsTrigger>
          </TabsList>

          {['todas', 'pendente', 'em_curso', 'finalizada', 'aprovada'].map(status => (
            <TabsContent key={status} value={status}>
              {filterActas(status).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhuma acta encontrada</p>
                  <p className="text-sm mt-2">
                    As actas são criadas automaticamente ao agendar reuniões
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Organizador</TableHead>
                        <TableHead>Data Reunião</TableHead>
                        <TableHead>Participantes</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterActas(status).map((acta) => (
                        <TableRow key={acta.id}>
                          <TableCell className="font-mono text-sm">
                            {acta.numero}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{acta.titulo}</p>
                              <p className="text-xs text-muted-foreground">
                                {acta.pontos_agenda?.length || 0} pontos de agenda
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{acta.organizador_nome}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(acta.data_reuniao), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {acta.hora_inicio} - {acta.hora_fim}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {acta.participantes?.length || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(acta.status)}
                            {acta.rascunho && (
                              <Badge variant="outline" className="ml-2">
                                Rascunho
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleViewDetails(acta)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDownloadPDF(acta.id)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}