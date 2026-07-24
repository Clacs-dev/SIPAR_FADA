import React, { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { ActaCollaborativeEditor } from "../components/actas/acta-collaborative-editor";
import { ActaDocumentViewer } from "../components/actas/acta-document-viewer";
import { DigitalSignature } from "../components/actas/digital-signature";
import { SecretarySelect } from "../components/actas/secretary-select";
import { exportActaToPDF, downloadActaAsText } from "../utils/acta-pdf-export";
import { transformarActaParaJSON } from "../utils/transform-acta-to-json";
import { Download, FileText, Users, MessageSquare, PenTool, ArrowLeft } from "lucide-react";
import { toast } from "sonner@2.0.3";

// Dados mockados para demonstração
const MOCK_ACTA = {
  id: "acta_demo_123456",
  numero: "ACTA-2025-001",
  assunto: "Aprovação do Plano Estratégico 2025-2027",
  data_reuniao: "2025-01-15",
  hora_inicio: "14:00",
  hora_fim: "17:30",
  local: "Sala de Reuniões Executivas - 5º Andar",
  tipo_reuniao: "ordinaria",
  status: "aprovada", // rascunho, em_revisao, aprovada, arquivada
  modalidade: "presencial",
  orgao: "Conselho de Administração",
  created_at: "2025-01-10T10:00:00Z",
  updated_at: "2025-01-16T15:30:00Z",
  created_by_name: "Dr. João Silva",
  
  // Secretário
  secretario_nome: "Dra. Maria Santos",
  secretario_cargo: "Secretária Executiva",
  
  // Participantes
  participantes: [
    {
      nome: "Dr. João Silva",
      cargo: "Presidente do Conselho",
      departamento: "Administração",
      presente: true,
    },
    {
      nome: "Eng. Pedro Costa",
      cargo: "Director de Operações",
      departamento: "Operações",
      presente: true,
    },
    {
      nome: "Dra. Maria Santos",
      cargo: "Secretária Executiva",
      departamento: "Administração",
      presente: true,
    },
    {
      nome: "Dr. Carlos Mendes",
      cargo: "Director Financeiro",
      departamento: "Finanças",
      presente: true,
    },
    {
      nome: "Eng. Ana Ferreira",
      cargo: "Directora de Recursos Humanos",
      departamento: "Recursos Humanos",
      presente: false,
    },
  ],
  
  // Agenda
  agenda: {
    descricao: "A reunião decorreu de acordo com a seguinte agenda:",
    pontos: [
      {
        ordem: 1,
        titulo: "Aprovação da Acta da Reunião Anterior",
        descricao: "Revisão e aprovação da acta da reunião ordinária de dezembro de 2024",
      },
      {
        ordem: 2,
        titulo: "Apresentação do Plano Estratégico 2025-2027",
        descricao: "Discussão e aprovação do plano estratégico proposto pela direcção executiva",
      },
      {
        ordem: 3,
        titulo: "Análise dos Resultados Financeiros do 4º Trimestre de 2024",
        descricao: "Apresentação dos resultados financeiros e análise de desvios orçamentais",
      },
      {
        ordem: 4,
        titulo: "Aprovação do Orçamento 2025",
        descricao: "Votação e aprovação do orçamento anual para o exercício de 2025",
      },
    ],
  },
  
  // Discussões com intervenções
  discussoes: [
    {
      ponto_ordem: 1,
      ponto_titulo: "Aprovação da Acta da Reunião Anterior",
      texto_base: "",
      intervencoes: [
        {
          id: "int_1",
          participante_nome: "Dr. João Silva",
          participante_cargo: "Presidente do Conselho",
          texto: "A acta da reunião anterior foi distribuída previamente a todos os membros. Solicito a análise e eventuais comentários.",
          timestamp: "2025-01-15T14:05:00Z",
          editado: false,
        },
        {
          id: "int_2",
          participante_nome: "Dr. Carlos Mendes",
          participante_cargo: "Director Financeiro",
          texto: "Confirmo que recebi e analisei a acta. Não tenho qualquer objecção, pelo que considero a mesma estar conforme.",
          timestamp: "2025-01-15T14:06:00Z",
          editado: false,
        },
      ],
    },
    {
      ponto_ordem: 2,
      ponto_titulo: "Apresentação do Plano Estratégico 2025-2027",
      texto_base: "",
      intervencoes: [
        {
          id: "int_3",
          participante_nome: "Eng. Pedro Costa",
          participante_cargo: "Director de Operações",
          texto: "Apresento o Plano Estratégico 2025-2027, que foi desenvolvido ao longo dos últimos 6 meses com contributos de todas as direcções. O plano estabelece 5 eixos estratégicos fundamentais: expansão geográfica, transformação digital, sustentabilidade operacional, desenvolvimento de capital humano e inovação de produtos e serviços.",
          timestamp: "2025-01-15T14:15:00Z",
          editado: false,
        },
        {
          id: "int_4",
          participante_nome: "Dr. Carlos Mendes",
          participante_cargo: "Director Financeiro",
          texto: "Relativamente ao eixo de expansão geográfica, gostaria de destacar que o investimento previsto está alinhado com as nossas capacidades financeiras. Projectamos um retorno sobre o investimento de 18% no primeiro triénio.",
          timestamp: "2025-01-15T14:25:00Z",
          editado: false,
        },
        {
          id: "int_5",
          participante_nome: "Dr. João Silva",
          participante_cargo: "Presidente do Conselho",
          texto: "Congratulo a equipa pelo trabalho realizado. O plano apresentado é ambicioso mas realista, e posiciona a empresa para um crescimento sustentável. Proponho a sua aprovação.",
          timestamp: "2025-01-15T14:35:00Z",
          editado: false,
        },
      ],
    },
    {
      ponto_ordem: 3,
      ponto_titulo: "Análise dos Resultados Financeiros do 4º Trimestre de 2024",
      texto_base: "",
      intervencoes: [
        {
          id: "int_6",
          participante_nome: "Dr. Carlos Mendes",
          participante_cargo: "Director Financeiro",
          texto: "Os resultados do 4º trimestre demonstram um crescimento de 12% face ao período homólogo. O EBITDA situou-se em 15,3 milhões de kwanzas, superando em 8% as projecções iniciais. A margem operacional mantém-se saudável em 18,5%.",
          timestamp: "2025-01-15T15:30:00Z",
          editado: false,
        },
      ],
    },
    {
      ponto_ordem: 4,
      ponto_titulo: "Aprovação do Orçamento 2025",
      texto_base: "",
      intervencoes: [
        {
          id: "int_7",
          participante_nome: "Dr. Carlos Mendes",
          participante_cargo: "Director Financeiro",
          texto: "O orçamento proposto para 2025 prevê um crescimento de 15% nas receitas e um investimento de 25 milhões de kwanzas em CAPEX, focado na modernização tecnológica e expansão da capacidade produtiva.",
          timestamp: "2025-01-15T16:45:00Z",
          editado: false,
        },
        {
          id: "int_8",
          participante_nome: "Eng. Pedro Costa",
          participante_cargo: "Director de Operações",
          texto: "Do ponto de vista operacional, o orçamento prevê recursos adequados para suportar os objectivos estratégicos estabelecidos. Destaco particularmente a alocação de 5 milhões para sistemas de gestão integrados.",
          timestamp: "2025-01-15T16:50:00Z",
          editado: false,
        },
      ],
    },
  ],
  
  // Deliberações
  deliberacoes: [
    {
      ponto_ordem: 1,
      ponto_titulo: "Aprovação da Acta da Reunião Anterior",
      decisao: "A acta da reunião ordinária de dezembro de 2024 foi aprovada sem alterações",
      tipo_votacao: "unanimidade",
      resultado_votacao: "aprovado por unanimidade",
      votos_favor: 4,
      votos_contra: 0,
      abstencoes: 0,
    },
    {
      ponto_ordem: 2,
      ponto_titulo: "Apresentação do Plano Estratégico 2025-2027",
      decisao: "O Plano Estratégico 2025-2027 foi aprovado nos termos apresentados, devendo a direcção executiva proceder à sua implementação faseada conforme cronograma estabelecido",
      tipo_votacao: "unanimidade",
      resultado_votacao: "aprovado por unanimidade",
      votos_favor: 4,
      votos_contra: 0,
      abstencoes: 0,
    },
    {
      ponto_ordem: 3,
      ponto_titulo: "Análise dos Resultados Financeiros do 4º Trimestre de 2024",
      decisao: "O Conselho tomou conhecimento dos resultados financeiros apresentados e congratulou a equipa pelos resultados alcançados",
      tipo_votacao: "sem_votacao",
      resultado_votacao: "",
    },
    {
      ponto_ordem: 4,
      ponto_titulo: "Aprovação do Orçamento 2025",
      decisao: "O orçamento para o exercício de 2025 foi aprovado no montante total de 150 milhões de kwanzas, com a recomendação de revisão trimestral dos desvios orçamentais",
      tipo_votacao: "unanimidade",
      resultado_votacao: "aprovado por unanimidade",
      votos_favor: 4,
      votos_contra: 0,
      abstencoes: 0,
    },
  ],
  
  // Recomendações
  recomendacoes: {
    lista: [
      "Implementar mecanismos de acompanhamento mensal dos KPIs estratégicos definidos no Plano Estratégico 2025-2027",
      "Reforçar a equipa de transformação digital com a contratação de especialistas em IA e automação de processos",
      "Estabelecer comité de sustentabilidade para supervisionar a implementação das iniciativas ambientais previstas",
      "Realizar revisão trimestral do orçamento com apresentação de desvios e medidas correctivas ao Conselho",
    ],
    nota: "As recomendações acima deverão ser consideradas para implementação ou acompanhamento nos termos definidos pelos órgãos competentes.",
  },
  
  // Assinaturas
  assinaturas: {
    presidente: {
      nome: "Dr. João Silva",
      cargo: "Presidente do Conselho de Administração",
      assinado: true,
      data_assinatura: "2025-01-16T10:00:00Z",
    },
    secretario: {
      nome: "Dra. Maria Santos",
      cargo: "Secretária Executiva",
      assinado: true,
      data_assinatura: "2025-01-16T10:05:00Z",
    },
  },
  
  totalmente_assinada: true,
  data_assinatura_completa: "2025-01-16T10:05:00Z",
};

export default function ActaDemoPage() {
  const [acta, setActa] = useState(MOCK_ACTA);
  const [activeTab, setActiveTab] = useState("discussoes");
  const [isExporting, setIsExporting] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);

  const handleRefresh = () => {
    // Em produção, isto faria uma nova requisição à API
    toast.info("Acta atualizada (modo demonstração)");
  };

  const handleExportPDF = async () => {
    if (!documentRef.current) {
      toast.error("Documento não encontrado");
      return;
    }

    setIsExporting(true);
    try {
      // Buscar o elemento do documento dentro da tab
      const documentElement = documentRef.current.querySelector('.acta-document-container');
      if (!documentElement) {
        toast.error("Conteúdo do documento não encontrado");
        setIsExporting(false);
        return;
      }

      await exportActaToPDF(documentElement as HTMLElement, acta, {
        filename: `${acta.numero}_${acta.assunto.substring(0, 30)}.pdf`,
      });
    } catch (error) {
 console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao gerar PDF. Verifique o console para mais detalhes.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportText = () => {
    downloadActaAsText(acta);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const actaJSON = useMemo(() => transformarActaParaJSON(acta), [acta]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{acta.numero}</h1>
              <p className="text-gray-600 mt-1">{acta.assunto}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={
                acta.status === 'aprovada' ? 'default' : 
                acta.status === 'em_revisao' ? 'secondary' : 
                'outline'
              }
              className="text-sm"
            >
              {acta.status === 'rascunho' && 'Rascunho'}
              {acta.status === 'em_revisao' && 'Em Revisão'}
              {acta.status === 'aprovada' && 'Aprovada'}
              {acta.status === 'arquivada' && 'Arquivada'}
            </Badge>
            {acta.totalmente_assinada && (
              <Badge variant="default" className="bg-green-600 text-sm">
                ✓ Assinada
              </Badge>
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Informações da Reunião</CardTitle>
                  <CardDescription>
                    {new Date(acta.data_reuniao).toLocaleDateString('pt-AO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} • {acta.hora_inicio} - {acta.hora_fim}
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportText}
                  disabled={isExporting}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Texto
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleExportPDF}
                  disabled={isExporting}
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Gerando...' : 'Baixar PDF'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-1">Tipo de Reunião</p>
                <p className="font-medium capitalize">{acta.tipo_reuniao}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Modalidade</p>
                <p className="font-medium capitalize">{acta.modalidade}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Local</p>
                <p className="font-medium">{acta.local}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Órgão</p>
                <p className="font-medium">{acta.orgao}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Participantes Presentes</p>
                <p className="font-medium">
                  {acta.participantes.filter(p => p.presente).length} de {acta.participantes.length}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Pontos de Agenda</p>
                <p className="font-medium">{acta.agenda.pontos.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs com conteúdo */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discussoes" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Discussões
            </TabsTrigger>
            <TabsTrigger value="documento" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documento Final
            </TabsTrigger>
            <TabsTrigger value="assinaturas" className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="participantes" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Participantes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussoes" className="space-y-4">
            <ActaCollaborativeEditor
              actaId={acta.id}
              discussoes={acta.discussoes}
              status={acta.status}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent value="documento">
            <div ref={documentRef}>
              <ActaDocumentViewer acta={actaJSON} />
            </div>
          </TabsContent>

          <TabsContent value="assinaturas">
            <div className="space-y-6">
              <SecretarySelect
                actaId={acta.id}
                participantes={acta.participantes}
                secretarioAtual={acta.secretario_nome}
                disabled={acta.status !== 'rascunho'}
              />
              <DigitalSignature
                actaId={acta.id}
                acta={acta}
                onRefresh={handleRefresh}
              />
            </div>
          </TabsContent>

          <TabsContent value="participantes">
            <Card>
              <CardHeader>
                <CardTitle>Lista de Participantes</CardTitle>
                <CardDescription>
                  Membros convocados e presentes na reunião
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {acta.participantes.map((participante, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{participante.nome}</p>
                        <p className="text-sm text-muted-foreground">{participante.cargo}</p>
                        <p className="text-xs text-muted-foreground">{participante.departamento}</p>
                      </div>
                      <Badge variant={participante.presente ? "default" : "outline"}>
                        {participante.presente ? "✓ Presente" : "✗ Ausente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Nota de Demonstração */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800">
              <strong>📌 Modo Demonstração:</strong> Esta é uma página de demonstração com dados mockados.
              Todas as funcionalidades estão implementadas e prontas para uso em produção. 
              O PDF pode ser baixado e o documento está formatado segundo normas jurídicas portuguesas/angolanas.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}