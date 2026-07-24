import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { useAuth } from './auth-context';
import { toast } from 'sonner@2.0.3';
import { ArrowLeft, Eye, EyeOff, User, Mail, Building, Phone, MapPin, FileText, Users, CheckCircle2, XCircle } from 'lucide-react';

interface RegisterFormProps {
  onBackToLogin: () => void;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'user' | 'attendant';
  organization: string;
  phone: string;
  department: string;
  position: string;
  address: string;
  document: string;
  acceptTerms: boolean;
}

interface NIFValidation {
  isValid: boolean;
  type: 'singular' | 'coletiva' | null;
  province: string;
  contributorType: string;
  message: string;
}

export function RegisterForm({ onBackToLogin }: RegisterFormProps) {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nifValidation, setNifValidation] = useState<NIFValidation | null>(null);
  
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    organization: '',
    phone: '',
    department: '',
    position: '',
    address: '',
    document: '',
    acceptTerms: false
  });

  // Mapa de códigos provinciais para NIFs de pessoa singular
  const provinceCodes: Record<string, string> = {
    '01': 'Luanda',
    '02': 'Bengo',
    '03': 'Benguela',
    '04': 'Bié',
    '05': 'Cabinda',
    '06': 'Cuando-Cubango',
    '07': 'Cuanza Norte',
    '08': 'Cuanza Sul',
    '09': 'Cunene',
    '10': 'Huambo',
    '11': 'Huíla',
    '12': 'Lunda Norte',
    '13': 'Lunda Sul',
    '14': 'Malanje',
    '15': 'Moxico',
    '16': 'Namibe',
    '17': 'Uíge',
    '18': 'Zaire'
  };

  // Validar NIF de pessoa singular (9 dígitos)
  const validateNIFSingular = (nif: string): NIFValidation => {
    if (!/^\d{9}$/.test(nif)) {
      return {
        isValid: false,
        type: null,
        province: '',
        contributorType: '',
        message: 'NIF de pessoa singular deve ter 9 dígitos numéricos'
      };
    }

    const provinceCode = nif.substring(0, 2);
    const province = provinceCodes[provinceCode] || 'Província não identificada';

    return {
      isValid: true,
      type: 'singular',
      province,
      contributorType: 'Pessoa Singular',
      message: `NIF válido - Pessoa Singular registrada em ${province}`
    };
  };

  // Validar NIF de pessoa coletiva (13 caracteres alfanuméricos)
  const validateNIFColetiva = (nif: string): NIFValidation => {
    // Formato típico: 2-3 letras seguidas de números (total 13 caracteres)
    if (!/^[A-Z]{2,3}\d{10,11}$/.test(nif.toUpperCase())) {
      return {
        isValid: false,
        type: null,
        province: '',
        contributorType: '',
        message: 'NIF de pessoa coletiva deve ter 13 caracteres (letras seguidas de números)'
      };
    }

    const prefix = nif.substring(0, 2).toUpperCase();
    let contributorType = 'Pessoa Coletiva';

    // Identificar tipo de pessoa coletiva baseado no prefixo
    switch (prefix) {
      case 'SA':
        contributorType = 'Sociedade Anónima';
        break;
      case 'LD':
        contributorType = 'Sociedade por Quotas (Lda)';
        break;
      case 'PC':
        contributorType = 'Pessoa Coletiva Pública';
        break;
      case 'AS':
        contributorType = 'Associação';
        break;
      case 'FU':
        contributorType = 'Fundação';
        break;
      case 'CO':
        contributorType = 'Cooperativa';
        break;
      default:
        contributorType = 'Pessoa Coletiva';
    }

    return {
      isValid: true,
      type: 'coletiva',
      province: 'Angola',
      contributorType,
      message: `NIF válido - ${contributorType}`
    };
  };

  // Validar NIF (detecta automaticamente o tipo)
  const validateNIF = (nif: string): NIFValidation => {
    if (!nif || nif.length === 0) {
      return {
        isValid: false,
        type: null,
        province: '',
        contributorType: '',
        message: ''
      };
    }

    // Tentar validar como pessoa singular (apenas números)
    if (/^\d+$/.test(nif)) {
      return validateNIFSingular(nif);
    }

    // Tentar validar como pessoa coletiva (alfanumérico)
    if (/^[A-Z]/i.test(nif)) {
      return validateNIFColetiva(nif);
    }

    return {
      isValid: false,
      type: null,
      province: '',
      contributorType: '',
      message: 'Formato de NIF inválido'
    };
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validar nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validar senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Validar confirmação de senha
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirmação de senha é obrigatória';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Senhas não coincidem';
    }

    // Validar organização
    if (!formData.organization.trim()) {
      newErrors.organization = 'Organização é obrigatória';
    }

    // Validar telefone
    const phoneRegex = /^\+244\s\d{3}\s\d{3}\s\d{3}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = 'Telefone deve estar no formato +244 923 000 000';
    }

    // Validar NIF (pessoa singular ou coletiva)
    if (!formData.document.trim()) {
      newErrors.document = 'NIF/BI é obrigatório';
    } else {
      const validation = validateNIF(formData.document);
      if (!validation.isValid) {
        newErrors.document = validation.message || 'NIF inválido. Use 9 dígitos (pessoa singular) ou 13 caracteres (pessoa coletiva)';
      }
    }

    // Validar termos
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof RegisterData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validar NIF em tempo real
    if (field === 'document' && typeof value === 'string') {
      const validation = validateNIF(value);
      setNifValidation(validation);
    }
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara angolana: +244 XXX XXX XXX
    if (numbers.length === 0) {
      return '';
    } else if (numbers.length <= 3) {
      return `+244 ${numbers}`;
    } else if (numbers.length <= 6) {
      return `+244 ${numbers.slice(0, 3)} ${numbers.slice(3)}`;
    } else {
      return `+244 ${numbers.slice(0, 3)} ${numbers.slice(3, 6)} ${numbers.slice(6, 9)}`;
    }
  };

  const formatDocument = (value: string) => {
    // Aceitar letras e números para pessoa coletiva
    // Remove caracteres especiais mas mantém letras e números
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Limitar a 13 caracteres (máximo para pessoa coletiva)
    return cleaned.slice(0, 13);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija os erros no formulário');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        role: formData.role,
        organization: formData.organization.trim(),
        phone: formData.phone,
        department: formData.department.trim(),
        position: formData.position.trim(),
        address: formData.address.trim(),
        document: formData.document
      });

      toast.success('Conta criada com sucesso! Você já pode fazer login.');
      onBackToLogin();
    } catch (error: any) {
 console.error('Registration error:', error);
      toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToLogin}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>Criar Nova Conta</CardTitle>
              <CardDescription>
                Preencha os dados abaixo para criar sua conta no sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Dados Pessoais
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Sua senha"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={errors.password ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirme sua senha"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={errors.confirmPassword ? 'border-red-500' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+244 923 000 000"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', formatPhone(e.target.value))}
                    className={errors.phone ? 'border-red-500' : ''}
                    maxLength={17}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formato: +244 XXX XXX XXX
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">NIF/BI *</Label>
                  <Input
                    id="document"
                    type="text"
                    placeholder="123456789 ou SA1234567890"
                    value={formData.document}
                    onChange={(e) => handleInputChange('document', formatDocument(e.target.value))}
                    className={errors.document ? 'border-red-500' : nifValidation?.isValid ? 'border-green-500' : ''}
                    maxLength={13}
                  />
                  {errors.document && (
                    <p className="text-sm text-red-600">{errors.document}</p>
                  )}
                  
                  {/* Feedback visual da validação do NIF */}
                  {nifValidation && formData.document.length > 0 && !errors.document && (
                    <div className={`flex items-start gap-2 p-3 rounded-md text-sm ${
                      nifValidation.isValid 
                        ? 'bg-green-50 text-green-800 border border-green-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {nifValidation.isValid ? (
                        <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{nifValidation.message}</p>
                        {nifValidation.isValid && (
                          <div className="mt-1 space-y-0.5 text-xs">
                            <p><strong>Tipo:</strong> {nifValidation.contributorType}</p>
                            {nifValidation.type === 'singular' && nifValidation.province && (
                              <p><strong>Província:</strong> {nifValidation.province}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Aceita: 9 dígitos (pessoa singular) ou 13 caracteres (pessoa coletiva)
                  </p>
                </div>
              </div>
            </div>

            {/* Dados Profissionais */}
            <div className="space-y-4">
              <h3 className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Dados Profissionais
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organização *</Label>
                  <Input
                    id="organization"
                    type="text"
                    placeholder="Nome da empresa/organização"
                    value={formData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    className={errors.organization ? 'border-red-500' : ''}
                  />
                  {errors.organization && (
                    <p className="text-sm text-red-600">{errors.organization}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Tipo de Usuário *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'user' | 'attendant') => handleInputChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Requerente (Solicitar apresentações/audiências)
                        </div>
                      </SelectItem>
                      <SelectItem value="attendant">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Atendente (Gerenciar solicitações)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    type="text"
                    placeholder="Departamento/Setor"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    type="text"
                    placeholder="Seu cargo/função"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  type="text"
                  placeholder="Endereço completo"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>
            </div>

            {/* Termos e Condições */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleInputChange('acceptTerms', checked as boolean)}
                  className={errors.acceptTerms ? 'border-red-500' : ''}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="acceptTerms"
                    className="text-sm font-normal leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Eu aceito os{' '}
                    <a href="#" className="text-primary underline underline-offset-4 hover:no-underline">
                      termos de uso
                    </a>{' '}
                    e{' '}
                    <a href="#" className="text-primary underline underline-offset-4 hover:no-underline">
                      política de privacidade
                    </a>
                    *
                  </Label>
                </div>
              </div>
              {errors.acceptTerms && (
                <p className="text-sm text-red-600">{errors.acceptTerms}</p>
              )}
            </div>

            {/* Informações importantes */}
            <Alert>
              <AlertDescription>
                <strong>Importante:</strong> Sua conta será criada e você poderá fazer login imediatamente. 
                Contas de atendentes precisam ser aprovadas por um administrador antes de ter acesso completo ao sistema.
              </AlertDescription>
            </Alert>

            {/* Botão de envio */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={onBackToLogin}
                className="text-sm"
              >
                Já tem uma conta? Fazer login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}