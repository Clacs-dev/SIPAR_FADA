import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { AlertCircle, CheckCircle, UserPlus, Users, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../auth/auth-context";
import { API_BASE_URL, getAuthHeaders } from '@/services/api';

interface UserToCreate {
  email: string;
  name: string;
  role: string;
  department: string;
  position: string;
}

const USERS_TO_CREATE: UserToCreate[] = [
  {
    email: 'gerente@sistema.ao',
    name: 'João Gerente',
    role: 'admin',
    department: 'Gestão',
    position: 'Gerente Geral'
  },
  {
    email: 'financeiro@sistema.ao',
    name: 'Maria Financeira',
    role: 'attendant',
    department: 'Financeiro',
    position: 'Responsável Financeiro'
  },
  {
    email: 'operador@sistema.ao',
    name: 'Carlos Operador',
    role: 'attendant',
    department: 'Operações',
    position: 'Operador de Frota'
  }
];

interface CreateResult {
  success: boolean;
  created: any[];
  errors: any[];
  message: string;
}

export function CreateAdditionalUsers() {
  const { accessToken } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<CreateResult | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  const handleCreateUsers = async () => {
    if (!accessToken) {
      toast.error('Não autenticado');
      return;
    }

    setIsCreating(true);
    setResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/create-additional-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar utilizadores');
      }

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast.success(data.message);
        // Recarregar lista de utilizadores
        await loadAllUsers();
      } else {
        toast.warning(data.message);
      }

    } catch (error) {
 console.error('Error creating users:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao criar utilizadores');
    } finally {
      setIsCreating(false);
    }
  };

  const loadAllUsers = async () => {
    if (!accessToken) return;

    setIsLoadingUsers(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/list-all-users`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar utilizadores');
      }

      const data = await response.json();
      setAllUsers(data.users || []);

    } catch (error) {
 console.error('Error loading users:', error);
      toast.error('Erro ao carregar lista de utilizadores');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-800">Administrador</Badge>;
      case 'attendant':
        return <Badge className="bg-blue-100 text-blue-800">Atendente</Badge>;
      case 'user':
        return <Badge className="bg-green-100 text-green-800">Utilizador</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de Criação de Utilizadores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Criar Utilizadores Adicionais
          </CardTitle>
          <CardDescription>
            Adicione 3 novos utilizadores ao sistema: Gerente, Financeiro e Operador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Pré-visualização dos utilizadores */}
          <div>
            <h3 className="text-sm font-medium mb-3">Utilizadores a criar:</h3>
            <div className="space-y-3">
              {USERS_TO_CREATE.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-sm text-muted-foreground">
                      {user.department} - {user.position}
                    </div>
                  </div>
                  <div>
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botão de Criação */}
          <div className="flex gap-3">
            <Button 
              onClick={handleCreateUsers}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  A criar utilizadores...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Criar {USERS_TO_CREATE.length} Utilizadores
                </>
              )}
            </Button>

            <Button 
              onClick={loadAllUsers}
              disabled={isLoadingUsers}
              variant="outline"
            >
              {isLoadingUsers ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Ver Todos
                </>
              )}
            </Button>
          </div>

          {/* Resultado da Criação */}
          {result && (
            <div className="space-y-3">
              {result.success ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Sucesso!</AlertTitle>
                  <AlertDescription className="text-green-800">
                    {result.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-900">Atenção</AlertTitle>
                  <AlertDescription className="text-yellow-800">
                    {result.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Utilizadores Criados */}
              {result.created && result.created.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-green-900">
                    ✓ Utilizadores criados ({result.created.length}):
                  </h4>
                  <ul className="text-sm space-y-1 text-green-800">
                    {result.created.map((user: any, index: number) => (
                      <li key={index}>• {user.name} ({user.email})</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Erros */}
              {result.errors && result.errors.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-900">
                    ✗ Erros encontrados ({result.errors.length}):
                  </h4>
                  <ul className="text-sm space-y-1 text-red-800">
                    {result.errors.map((error: any, index: number) => (
                      <li key={index}>
                        • {error.email}: {error.error} (passo: {error.step})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Todos os Utilizadores */}
      {allUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Todos os Utilizadores ({allUsers.length})
            </CardTitle>
            <CardDescription>
              Lista completa de utilizadores no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Posição</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>{user.position || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('pt-AO')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Informações Importantes */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Informações Importantes</AlertTitle>
        <AlertDescription className="space-y-2">
          <p><strong>Senhas padrão:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Gerente: <code className="bg-muted px-1 py-0.5 rounded">gerente123</code></li>
            <li>Financeiro: <code className="bg-muted px-1 py-0.5 rounded">financeiro123</code></li>
            <li>Operador: <code className="bg-muted px-1 py-0.5 rounded">operador123</code></li>
          </ul>
          <p className="mt-3 text-sm">
            <strong>Nota:</strong> Os utilizadores podem alterar suas senhas após o primeiro login.
            As senhas são criadas automaticamente no servidor Express Auth.
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
