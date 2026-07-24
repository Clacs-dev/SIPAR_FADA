import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  FileText,
  Plus,
  Search,
  Calendar,
  Users,
  MapPin,
  Filter,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Archive,
  FileEdit,
  AlertCircle,
  Download
} from 'lucide-react';
import { useActas } from '../../hooks/use-actas';
import type { Acta } from '../../types/acta';
import { toast } from 'sonner';
import { exportActaToPDF } from '../../utils/acta-pdf-export';
import { ActaDocumentViewer } from './acta-document-viewer';
import { transformarActaParaJSON } from '../../utils/transform-acta-to-json';

interface ActasListProps {
  onSelectActa: (acta: Acta) => void;
  onCreateNew: () => void;
  onEdit: (acta: Acta) => void;
  onNavigateToDemo?: () => void;
}

export function ActasList({ onSelectActa, onCreateNew, onEdit, onNavigateToDemo }: ActasListProps) {
  const { actas, loading, error, deleteActa, fetchActas } = useActas();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [origemFilter, setOrigemFilter] = useState<string>('todos'); // Novo filtro
  const [isExporting, setIsExporting] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  // ✅ CARREGAR ACTAS QUANDO O COMPONENTE É MONTADO
  useEffect(() => {
 console.log(' Componente ActasList montado - carregando actas...');
    fetchActas();
  }, [fetchActas]);

  // ✅ DADOS DEMO DA ACTA PARA TESTE DE PDF
  const actaDemo: Acta = {
    id: 'demo-001',
    numero: 'ACTA-DEMO-2025-001',
    assunto: 'Reunião de Planeamento Estratégico 2025',
    tipo_reuniao: 'ordinaria',
    data_reuniao: '2025-01-15',
    hora_inicio: '09:00',
    hora_fim: '11:30',
    local: 'Sala de Conferências Principal - Edifício Sede',
    status: 'aprovada',
    participantes: [
      { id: '1', nome: 'Dr. João Silva', cargo: 'Director Executivo', presente: true, papel: 'presidente' },
      { id: '2', nome: 'Eng. Maria Santos', cargo: 'Directora de TI', presente: true, papel: 'secretario' },
      { id: '3', nome: 'Dr. Carlos Mendes', cargo: 'Director Financeiro', presente: true, papel: 'membro' },
      { id: '4', nome: 'Dra. Ana Costa', cargo: 'Directora de RH', presente: false, papel: 'membro' }
    ],
    agenda: {
      pontos: [
        { ordem: 1, titulo: 'Abertura e verificação de presenças', duracao_estimada: 10 },
        { ordem: 2, titulo: 'Aprovação da acta anterior', duracao_estimada: 15 },
        { ordem: 3, titulo: 'Apresentação do Plano Estratégico 2025', duracao_estimada: 45 },
        { ordem: 4, titulo: 'Orçamento para expansão tecnológica', duracao_estimada: 30 },
        { ordem: 5, titulo: 'Diversos e encerramento', duracao_estimada: 20 }
      ]
    },
    discussoes: [
      {
        ponto_ordem: 3,
        ponto_titulo: 'Apresentação do Plano Estratégico 2025',
        intervencoes: [
          {
            participante_id: '1',
            participante_nome: 'Dr. João Silva',
            texto: 'Apresentação dos principais objectivos estratégicos para 2025, com foco em transformação digital e expansão internacional.',
            ordem: 1
          },
          {
            participante_id: '2',
            participante_nome: 'Eng. Maria Santos',
            texto: 'Destacou a importância de investir em infraestrutura tecnológica e capacitação da equipa.',
            ordem: 2
          }
        ]
      }
    ],
    deliberacoes: [
      {
        ponto_ordem: 3,
        ponto_titulo: 'Apresentação do Plano Estratégico 2025',
        tipo: 'aprovacao',
        decisao: 'Aprovado por unanimidade o Plano Estratégico 2025',
        votos_favor: 3,
        votos_contra: 0,
        abstencoes: 0
      }
    ],
    acoes_definidas: {
      tipo: 'lista',
      lista: [
        'Reforçar a equipa de TI com 3 novos colaboradores',
        'Implementar sistema de gestão documental até Março de 2025',
        'Realizar formação em cibersegurança para todos os funcionários'
      ],
      nota: 'Implementação a decorrer conforme planeado'
    },
    created_by_name: 'Sistema Demo',
    created_at: '2025-01-14'
  };

  // ✅ FUNÇÃO PARA BAIXAR PDF DA DEMO
  const handleDownloadDemoPDF = async () => {
    setIsExporting(true);
    try {
      // Criar elemento temporário invisível
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      // Renderizar o documento temporariamente
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempDiv);
      
      await new Promise<void>((resolve) => {
        root.render(
          <div className="acta-document-container">
            <ActaDocumentViewer acta={actaDemo} />
          </div>
        );
        setTimeout(resolve, 500); // Dar tempo para renderizar
      });

      // Exportar para PDF
      const documentElement = tempDiv.querySelector('.acta-document-container');
      if (documentElement) {
        await exportActaToPDF(documentElement as HTMLElement, actaDemo, {
          filename: `Demo_${actaDemo.numero}.pdf`,
        });
        toast.success('PDF da demonstração gerado com sucesso!');
      }

      // Limpar
      root.unmount();
      document.body.removeChild(tempDiv);
    } catch (error) {
 console.error('Erro ao exportar PDF demo:', error);
      toast.error('Erro ao gerar PDF de demonstração');
    } finally {
      setIsExporting(false);
    }
  };

  // Função para baixar PDF de uma acta da lista
  const handleDownloadActaPDF = async (acta: Acta, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExporting(true);
    try {
      // ✅ TRANSFORMAR ACTA PARA ESTRUTURA JSON OFICIAL
      const actaTransformada = transformarActaParaJSON(acta);
      
      // Criar elemento temporário invisível
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '0';
      document.body.appendChild(tempDiv);

      // Renderizar o documento temporariamente
      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempDiv);
      
      await new Promise<void>((resolve) => {
        root.render(
          <div className="acta-document-container">
            <ActaDocumentViewer acta={actaTransformada} />
          </div>
        );
        setTimeout(resolve, 500); // Dar tempo para renderizar
      });

      // Exportar para PDF
      const documentElement = tempDiv.querySelector('.acta-document-container');
      if (documentElement) {
        await exportActaToPDF(documentElement as HTMLElement, actaTransformada, {
          filename: `${acta.numero.replace(/\//g, '_')}.pdf`,
        });
        toast.success('PDF gerado com sucesso!');
      }

      // Limpar
      root.unmount();
      document.body.removeChild(tempDiv);
    } catch (error) {
 console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Filtrar actas
  const filteredActas = actas.filter((acta) => {
    const matchesSearch =
      acta.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acta.assunto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acta.local && acta.local.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'todos' || acta.status === statusFilter;
    const matchesTipo = tipoFilter === 'todos' || acta.tipo_reuniao === tipoFilter;
    
    // Filtro de origem (manual ou automática)
    const matchesOrigem = 
      origemFilter === 'todos' || 
      (origemFilter === 'automatica' && (acta as any).reuniao_interna_id) ||
      (origemFilter === 'manual' && !(acta as any).reuniao_interna_id);

    return matchesSearch && matchesStatus && matchesTipo && matchesOrigem;
  });

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'bg-gray-500';
      case 'em_revisao':
        return 'bg-blue-500';
      case 'aprovada':
        return 'bg-green-500';
      case 'arquivada':
        return 'bg-slate-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'rascunho':
        return <FileEdit className="h-4 w-4" />;
      case 'em_revisao':
        return <Clock className="h-4 w-4" />;
      case 'aprovada':
        return <CheckCircle className="h-4 w-4" />;
      case 'arquivada':
        return <Archive className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  // Função para obter label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rascunho':
        return 'Rascunho';
      case 'em_revisao':
        return 'Em Revisão';
      case 'aprovada':
        return 'Aprovada';
      case 'arquivada':
        return 'Arquivada';
      default:
        return status;
    }
  };

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Função para deletar acta
  const handleDelete = async (acta: Acta) => {
    if (acta.status === 'arquivada') {
      alert('Não é possível deletar uma acta arquivada');
      return;
    }

    if (confirm(`Tem certeza que deseja deletar a acta ${acta.numero}?`)) {
      await deleteActa(acta.id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Carregando actas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Erro ao carregar actas: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabeçalho com Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gestão de Livro de Actas
              </CardTitle>
              <CardDescription>
                Gerir actas de reuniões e assembleias
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDownloadDemoPDF}
                disabled={isExporting}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'A gerar PDF...' : 'Baixar PDF Demo'}
              </Button>
              <Button onClick={onCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Acta
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Pesquisa */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por número, assunto ou local..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtro de Status */}
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="em_revisao">Em Revisão</SelectItem>
                  <SelectItem value="aprovada">Aprovada</SelectItem>
                  <SelectItem value="arquivada">Arquivada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Tipo */}
            <div>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="ordinaria">Ordinária</SelectItem>
                  <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de Origem */}
            <div>
              <Select value={origemFilter} onValueChange={setOrigemFilter}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as Origens</SelectItem>
                  <SelectItem value="automatica">Automática</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contador de Resultados */}
          <div className="text-sm text-muted-foreground">
            {filteredActas.length} acta{filteredActas.length !== 1 ? 's' : ''} encontrada
            {filteredActas.length !== 1 ? 's' : ''}
            {(searchTerm || statusFilter !== 'todos' || tipoFilter !== 'todos' || origemFilter !== 'todos') && (
              <span> (filtrado de {actas.length} total)</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Actas */}
      {filteredActas.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Nenhuma acta encontrada</p>
              <p className="text-sm mt-1">
                {searchTerm || statusFilter !== 'todos' || tipoFilter !== 'todos' || origemFilter !== 'todos'
                  ? 'Tente ajustar os filtros'
                  : 'Comece criando uma nova acta'}
              </p>
              {!(searchTerm || statusFilter !== 'todos' || tipoFilter !== 'todos' || origemFilter !== 'todos') && (
                <Button onClick={onCreateNew} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Acta
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredActas.map((acta) => (
            <Card
              key={acta.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectActa(acta)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  {/* Informações Principais */}
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{acta.numero}</h3>
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(acta.status)} text-white`}
                          >
                            <span className="mr-1">{getStatusIcon(acta.status)}</span>
                            {getStatusLabel(acta.status)}
                          </Badge>
                          <Badge variant="outline">
                            {acta.tipo_reuniao === 'ordinaria' ? 'Ordinária' : 'Extraordinária'}
                          </Badge>
                        </div>
                        <p className="text-base text-foreground">{acta.assunto}</p>
                      </div>
                    </div>

                    {/* Detalhes */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(acta.data_reuniao)}</span>
                        {acta.hora_inicio && (
                          <span className="ml-1">às {acta.hora_inicio}</span>
                        )}
                      </div>

                      {acta.local && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          <span>{acta.local}</span>
                        </div>
                      )}

                      {acta.participantes && acta.participantes.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          <span>{acta.participantes.length} participante{acta.participantes.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                    </div>

                    {/* Criado por */}
                    <div className="text-xs text-muted-foreground">
                      Criado por {acta.created_by_name} em {formatDate(acta.created_at)}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectActa(acta);
                      }}
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {acta.status !== 'arquivada' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(acta);
                        }}
                        title="Editar"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}

                    {acta.status !== 'arquivada' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(acta);
                        }}
                        title="Deletar"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDownloadActaPDF(acta, e)}
                      title="Exportar para PDF"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}