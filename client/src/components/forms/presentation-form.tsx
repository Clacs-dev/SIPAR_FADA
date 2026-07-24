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

export function PresentationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [documentPath, setDocumentPath] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    position: '',
    email: '',
    phone: '',
    businessArea: '',
    content: '',
    purpose: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obrigatórios
    if (!formData.companyName || !formData.contactName || !formData.email || 
        !formData.position || !formData.content || !formData.purpose) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Documento obrigatório - descomente se quiser tornar opcional
    if (!documentPath) {
      toast.error("Por favor, anexe um documento à carta de apresentação");
      return;
    }
    
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

      const presentationData = {
        company: formData.companyName,
        contact: formData.contactName,
        position: formData.position,
        email: formData.email,
        phone: formData.phone,
        area: formData.businessArea,
        purpose: formData.purpose,
        content: formData.content,
        documentPath,
        documentName,
        userId: user.id,
        userEmail: user.email
      };

      const response = await fetch(
        `${API_BASE_URL}/presentations`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(presentationData)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao enviar carta');
      }

      toast.success("Carta de apresentação enviada com sucesso! Aguarde a análise do administrador.");
      
      // Reset form
      setFormData({
        companyName: '',
        contactName: '',
        position: '',
        email: '',
        phone: '',
        businessArea: '',
        content: '',
        purpose: ''
      });
      setDocumentPath('');
      setDocumentName('');
      
    } catch (error) {
 console.error('Submit error:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar carta de apresentação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDocumentUpload = (filePath: string, fileName: string) => {
    setDocumentPath(filePath);
    setDocumentName(fileName);
  };

  const handleDocumentRemove = () => {
    setDocumentPath('');
    setDocumentName('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Nova Carta de Apresentação</h1>
        <p className="text-muted-foreground">Submeta uma carta de apresentação para análise</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
          <CardDescription>
            Dados básicos da empresa e pessoa de contato
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
                <Label htmlFor="businessArea">Área de Atuação</Label>
                <Select onValueChange={(value) => handleInputChange('businessArea', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnologia">Tecnologia</SelectItem>
                    <SelectItem value="consultoria">Consultoria</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="financeiro">Financeiro</SelectItem>
                    <SelectItem value="saude">Saúde</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nome do Contato *</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) => handleInputChange('contactName', e.target.value)}
                  placeholder="Nome completo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Cargo/Posição *</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Ex: Diretor, Gerente, CEO"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
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
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+244 923 000 000"
                />
                <p className="text-xs text-muted-foreground">
                  Formato: +244 XXX XXX XXX
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Finalidade da Apresentação *</Label>
              <Select onValueChange={(value) => handleInputChange('purpose', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a finalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="parceria">Proposta de Parceria</SelectItem>
                  <SelectItem value="fornecimento">Fornecimento de Produtos/Serviços</SelectItem>
                  <SelectItem value="investimento">Busca de Investimento</SelectItem>
                  <SelectItem value="colaboracao">Colaboração Institucional</SelectItem>
                  <SelectItem value="apresentacao">Apresentação Institucional</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo da Carta *</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                placeholder="Descreva detalhadamente o conteúdo da carta de apresentação, incluindo objetivos, proposta de valor e benefícios esperados..."
                className="min-h-32"
                required
              />
            </div>

            <DocumentUpload
              label="Documento de Apresentação"
              folder="presentations"
              onUploadComplete={handleDocumentUpload}
              onRemove={handleDocumentRemove}
              required
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "A enviar..." : "Enviar Carta"}
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
                    businessArea: '',
                    content: '',
                    purpose: ''
                  });
                  setDocumentPath('');
                  setDocumentName('');
                }}
              >
                Limpar Formulário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}