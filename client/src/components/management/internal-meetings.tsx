import { useState } from "react";
import { InternalMeetingForm } from "./internal-meeting-form";
import { InternalMeetingsList } from "./internal-meetings-list";
import { ActasList } from "./actas-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CalendarPlus, FileText, X, Lightbulb } from "lucide-react";
import { Button } from "../ui/button";

interface InternalMeetingsProps {
  onNavigateToActa?: (actaId: string) => void;
}

export function InternalMeetings({ onNavigateToActa }: InternalMeetingsProps = {}) {
  const [activeTab, setActiveTab] = useState("agendar");
  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  // Se o formulário estiver aberto, mostra tela cheia
  if (showForm) {
    return (
      <div className="space-y-6">
        {/* Cabeçalho do Formulário */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarPlus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Agendar Reunião Interna</h1>
              <p className="text-sm text-muted-foreground">
                Preencha os dados para agendar uma nova reunião
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancelForm}
            className="h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Formulário em 2 colunas conforme Figma */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-1">
            <InternalMeetingForm onSuccess={handleFormSuccess} />
          </div>
          <div className="lg:col-span-1 hidden lg:block">
            {/* Espaço para preview ou informações adicionais */}
            <div className="sticky top-6 p-6 border rounded-lg bg-muted/50">
              <h3 className="font-semibold mb-2 flex items-center gap-2"><Lightbulb className="h-4 w-4" />Dicas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Adicione todos os participantes necessários</li>
                <li>• Defina pontos de agenda para melhor organização</li>
                <li>• Uma acta será criada automaticamente</li>
                <li>• Todos os participantes serão notificados</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1>Reuniões Internas & Livro de Actas</h1>
        <p className="text-muted-foreground">
          Agende reuniões e gerencie actas automaticamente
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="agendar" className="gap-2">
            <CalendarPlus className="h-4 w-4" />
            Agendar Reunião
          </TabsTrigger>
          <TabsTrigger value="actas" className="gap-2">
            <FileText className="h-4 w-4" />
            Actas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agendar" className="space-y-6 mt-6">
          {/* Botão para abrir o formulário em tela cheia */}
          <div className="flex justify-end">
            <Button className="gap-2" onClick={() => setShowForm(true)}>
              <CalendarPlus className="h-4 w-4" />
              Agendar Reunião
            </Button>
          </div>

          {/* Lista de Reuniões */}
          <InternalMeetingsList onNavigateToActa={onNavigateToActa} />
        </TabsContent>

        <TabsContent value="actas" className="space-y-6 mt-6">
          <ActasList />
        </TabsContent>
      </Tabs>
    </div>
  );
}