import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DocumentUpload } from "./document-upload";
import { toast } from "sonner@2.0.3";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

export function AudienceForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentPath, setDocumentPath] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    position: '',
    email: '',
    phone: '',
    reason: '',
    description: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDocumentUpload = (filePath: string, fileName: string) => {
    setDocumentPath(filePath);
    setDocumentName(fileName);
  };

  const handleDocumentRemove = () => {
    setDocumentPath('');
    setDocumentName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos obrigatórios
    if (!formData.companyName || !formData.contactName || !formData.email || 
        !formData.phone || !formData.position || !formData.reason || !formData.description) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Documento é opcional - descomente a linha abaixo para tornar obrigatório
    // if (!documentPath) {
    //   toast.error("Por favor, anexe um documento");
    //   return;
    // }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!token || !user) {
        toast.error("Sessão expirada. Por favor, faça login novamente.");
        setIsSubmitting(false);
        return;
      }

      const audienceData = {
        company: formData.companyName,
        contact: formData.contactName,
        position: formData.position,
        email: formData.email,
        phone: formData.phone,
        reason: formData.reason,
        description: formData.description,
        documentPath,
        documentName,
        userId: user.id,
        userEmail: user.email
      };

      const response = await fetch(
        `${API_BASE_URL}/audiences`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(audienceData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar pedido');
      }

      toast.success("Pedido de audiência enviado com sucesso! Aguarde a aprovação e agendamento pelo administrador.");
      
      // Reset form
      setFormData({
        companyName: '',
        contactName: '',
        position: '',
        email: '',
        phone: '',
        reason: '',
        description: ''
      });
      setDocumentPath('');
      setDocumentName('');
      
    } catch (error) {
 console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar pedido de audiência');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Novo Pedido de Audiência</h1>
        <p className="text-muted-foreground">
          Solicite uma audiência. O administrador irá definir a data, horário e formato da reunião.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações do Requerente</CardTitle>
          <CardDescription>
            Dados da empresa e pessoa responsável pelo pedido
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Digite o nome da empresa"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome do Requerente *</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="position">Cargo do Requerente *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Ex: Diretor, Gerente, CEO"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="contato@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+244 923 000 000"
                required
              />
              <p className="text-xs text-muted-foreground">
                Formato: +244 XXX XXX XXX
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da Audiência *</Label>
              <Select onValueChange={(value) => handleInputChange('reason', value)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Apresentação de Produto/Serviço">Apresentação de Produto/Serviço</SelectItem>
                  <SelectItem value="Discussão de Parceria">Discussão de Parceria</SelectItem>
                  <SelectItem value="Apresentação de Proposta">Apresentação de Proposta</SelectItem>
                  <SelectItem value="Follow-up de Carta">Follow-up de Carta</SelectItem>
                  <SelectItem value="Negociação Comercial">Negociação Comercial</SelectItem>
                  <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                  <SelectItem value="Pedido de Esclarecimentos">Pedido de Esclarecimentos</SelectItem>
                  <SelectItem value="Reclamação">Reclamação</SelectItem>
                  <SelectItem value="Outros Assuntos">Outros Assuntos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição Detalhada do Pedido *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descreva detalhadamente o objetivo da audiência, pontos a serem discutidos, resultado esperado..."
                className="min-h-32"
                required
              />
              <p className="text-xs text-muted-foreground">
                Quanto mais detalhes fornecer, melhor o administrador poderá avaliar e agendar a sua audiência.
              </p>
            </div>

            <DocumentUpload
              label="Documento Complementar"
              folder="audiences"
              onUploadComplete={handleDocumentUpload}
              onRemove={handleDocumentRemove}
              currentFile={documentPath ? { path: documentPath, name: documentName } : null}
              required={false}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "A enviar..." : "Enviar Pedido"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setFormData({
                    companyName: '',
                    contactName: '',
                    position: '',
                    email: '',
                    phone: '',
                    reason: '',
                    description: ''
                  });
                  setDocumentPath('');
                  setDocumentName('');
                }}
              >
                Limpar Formulário
              </Button>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Próximos passos:</strong>
              </p>
              <ol className="text-sm text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                <li>O seu pedido será analisado pelo administrador</li>
                <li>Se aprovado, o administrador irá agendar a data, horário e formato da reunião</li>
                <li>Receberá uma notificação com todos os detalhes do agendamento</li>
                <li>Poderá acompanhar o status do pedido na seção "Minhas Solicitações"</li>
              </ol>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
