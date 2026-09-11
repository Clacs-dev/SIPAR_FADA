import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { Search, Plus, Edit, Trash2, User, Settings, Users, Check, X, Clock } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../auth/auth-context";
import { apiClient } from "../../utils/api-client";
import { getGroupedDepartmentOptions, getDepartmentName, getDepartmentIcon, DepartmentLike } from "../admin/departments";
import { useDepartments } from "../../hooks/use-departments";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: 'active' | 'pending' | 'inactive';
  created_at: string;
  last_login?: string;
  organization?: string;
  phone?: string;
  department?: string;
  position?: string;
}

const LEGACY_ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrador do sistema' },
  { value: 'attendant', label: 'Atendente' },
  { value: 'user', label: 'Usuario comum' }
];

const isDepartmentRole = (departments: DepartmentLike[], role: string) => departments.some((department) => department.slug === role);

const getRoleLabel = (departments: DepartmentLike[], role: string) => {
  const legacyRole = LEGACY_ROLE_OPTIONS.find((option) => option.value === role);
  if (legacyRole) {
    return legacyRole.label;
  }

  const departmentRole = departments.find((department) => department.slug === role);
  return departmentRole?.nome || role || 'Sem papel';
};

export function UserManagement() {
  const { accessToken, user: currentUser } = useAuth();
  const { departments } = useDepartments();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isClearingDemo, setIsClearingDemo] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    organization: '',
    phone: '',
    department: '',
    position: '',
    address: '',
    document: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      if (!accessToken) {
        setUsers([]);
        return;
      }

 console.log('Loading users with token:', accessToken ? 'Token presente' : 'Token ausente');
 console.log('Current user role:', currentUser?.role);
      const allUsers = await apiClient.getAllUsers(accessToken!);
      setUsers(allUsers);
    } catch (error) {
 console.error('Error loading users:', error);
      toast.error(`Erro ao carregar usuários: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAttendant = async (userId: string, userName: string) => {
    try {
      await apiClient.updateUserStatus(accessToken!, userId, 'active');
      toast.success(`Atendente ${userName} aprovado com sucesso!`);
      loadUsers();
    } catch (error) {
 console.error('Error approving attendant:', error);
      toast.error('Erro ao aprovar atendente');
    }
  };

  const handleRejectAttendant = async (userId: string, userName: string) => {
    try {
      await apiClient.updateUserStatus(accessToken!, userId, 'inactive');
      toast.success(`Solicitação de ${userName} rejeitada`);
      loadUsers();
    } catch (error) {
 console.error('Error rejecting attendant:', error);
      toast.error('Erro ao rejeitar atendente');
    }
  };

  const getRoleBadge = (role: string) => {
    const departmentRole = departments.find((department) => department.slug === role);
    if (departmentRole) {
      return <Badge className="bg-tone-accent-soft text-tone-accent">{departmentRole.nome}</Badge>;
    }

    switch (role) {
      case 'admin':
        return <Badge className="bg-tone-danger-soft text-tone-danger">Administrador</Badge>;
      case 'attendant':
        return <Badge className="bg-tone-info-soft text-tone-info">Atendente</Badge>;
      case 'user':
        return <Badge className="bg-tone-success-soft text-tone-success">Usuário</Badge>;
      default:
        return <Badge>{role || 'Sem papel'}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'active'
      ? <Badge className="bg-tone-success-soft text-tone-success">Ativo</Badge>
      : <Badge className="bg-tone-neutral-soft text-tone-neutral">Inativo</Badge>;
  };

  const getRoleIcon = (role: string) => {
    const departmentRole = departments.find((department) => department.slug === role);
    if (departmentRole) {
      const DepartmentIcon = getDepartmentIcon(departmentRole.slug);
      return <DepartmentIcon className="h-4 w-4" />;
    }

    switch (role) {
      case 'admin':
        return <Settings className="h-4 w-4" />;
      case 'attendant':
        return <Users className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const handleCreateUser = async () => {
    // Validar campos obrigatórios
    if (!newUser.name || !newUser.email || !newUser.password || !newUser.role || 
        !newUser.organization || !newUser.phone || !newUser.document || !newUser.department) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error("Por favor, insira um email válido");
      return;
    }

    // Validar senha (mínimo 6 caracteres)
    if (newUser.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    try {
      await apiClient.createUser(accessToken!, {
        name: newUser.name,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        organization: newUser.organization,
        phone: newUser.phone,
        department: newUser.department,
        position: newUser.position,
        address: newUser.address,
        document: newUser.document
      });

      toast.success(`Usuário ${newUser.name} criado com sucesso!`);
      setNewUser({ 
        name: '', 
        email: '', 
        password: '', 
        role: '', 
        organization: '', 
        phone: '', 
        department: '', 
        position: '', 
        address: '', 
        document: '' 
      });
      setIsCreating(false);
      loadUsers(); // Recarregar lista de usuários
    } catch (error) {
 console.error('Error creating user:', error);
      toast.error(error.message || 'Erro ao criar usuário');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      // Utilizadores nunca sao eliminados fisicamente (dezenas de tabelas
      // referenciam createdById em todo o sistema) - "Excluir" desativa a
      // conta, impedindo login, sem apagar o historico associado.
      await apiClient.updateUserStatus(accessToken!, userId, 'inactive');
      toast.success(`Utilizador ${userName} desativado com sucesso`);
      loadUsers();
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      toast.error(error.message || 'Erro ao desativar utilizador');
    }
  };

  const handleClearDemoUsers = async () => {
    setIsClearingDemo(true);
    try {
      const result = await apiClient.clearDemoUsers(accessToken!);
      toast.success(result.message || 'Usuários de demonstração removidos com sucesso!');
      loadUsers(); // Recarregar lista
    } catch (error) {
 console.error('Error clearing demo users:', error);
      toast.error(error.message || 'Erro ao remover usuários de demonstração');
    } finally {
      setIsClearingDemo(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getRoleLabel(departments, user.role).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getDepartmentName(departments, user.department || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingAttendants = users.filter(u => u.role === 'attendant' && u.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1>Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">Gerencie usuários e suas permissões no sistema</p>
      </div>

      {/* Card de Atendentes Pendentes */}
      {pendingAttendants.length > 0 && (
        <Card style={{ borderColor: 'var(--tone-warn)', backgroundColor: 'var(--tone-warn-soft)' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" style={{ color: 'var(--tone-warn)' }} />
                  Atendentes Aguardando Aprovação
                </CardTitle>
                <CardDescription>
                  {pendingAttendants.length} {pendingAttendants.length === 1 ? 'atendente precisa' : 'atendentes precisam'} de aprovação
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingAttendants.map((attendant) => (
                <div key={attendant.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: 'var(--tone-warn-soft)' }}>
                      <User className="h-5 w-5" style={{ color: 'var(--tone-warn)' }} />
                    </div>
                    <div>
                      <p className="font-medium">{attendant.name}</p>
                      <p className="text-sm text-muted-foreground">{attendant.email}</p>
                      {attendant.organization && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Organização: {attendant.organization}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Registrado em: {new Date(attendant.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      style={{ color: 'var(--tone-success)' }}
                      onClick={() => handleApproveAttendant(attendant.id, attendant.name)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      style={{ color: 'var(--tone-danger)' }}
                      onClick={() => handleRejectAttendant(attendant.id, attendant.name)}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário ao sistema. Todos os campos marcados com * são obrigatórios.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="password">Senha *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Papel no Sistema *</Label>
                  <Select 
                    value={newUser.role}
                    onValueChange={(value) => setNewUser(prev => ({
                      ...prev,
                      role: value,
                      department: isDepartmentRole(departments, value) && (!prev.department || prev.department === prev.role)
                        ? value
                        : prev.department
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o papel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Papéis clássicos</SelectLabel>
                        {LEGACY_ROLE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      {getGroupedDepartmentOptions(departments).map((group) => (
                        <SelectGroup key={`role-${group.label}`}>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.icon} {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="organization">Organização *</Label>
                  <Input
                    id="organization"
                    value={newUser.organization}
                    onChange={(e) => setNewUser(prev => ({ ...prev, organization: e.target.value }))}
                    placeholder="Nome da organização"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">NIF/BI *</Label>
                  <Input
                    id="document"
                    value={newUser.document}
                    onChange={(e) => setNewUser(prev => ({ ...prev, document: e.target.value }))}
                    placeholder="Número do documento"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={newUser.phone}
                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+244 XXX XXX XXX"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    value={newUser.position}
                    onChange={(e) => setNewUser(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Cargo na organização"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento *</Label>
                <Select
                  value={newUser.department}
                  onValueChange={(value) => setNewUser(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {getGroupedDepartmentOptions(departments).map((group) => (
                      <SelectGroup key={group.label}>
                        <SelectLabel>{group.label}</SelectLabel>
                        {group.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.icon} {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newUser.address}
                  onChange={(e) => setNewUser(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo"
                />
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateUser}>
                Criar Usuário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados e suas informações
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(user.role)}
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getDepartmentName(departments, user.department || '')}</TableCell>
                  <TableCell>{getStatusBadge(user.status || 'inactive')}</TableCell>
                  <TableCell>{user.last_login || 'N/A'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Desativar utilizador</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem a certeza que deseja desativar o utilizador <strong>{user.name}</strong>?
                              A conta deixa de conseguir iniciar sessão, mas todo o histórico associado (registos criados,
                              assinaturas, auditoria) é mantido. Pode reativar a conta a qualquer momento.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estatísticas de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total de Usuários:</span>
                <span className="font-medium">{users.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Administradores:</span>
                <span className="font-medium">{users.filter(u => u.role === 'admin').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Atendentes:</span>
                <span className="font-medium">{users.filter(u => u.role === 'attendant').length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Papéis departamentais:</span>
                <span className="font-medium">{users.filter(u => isDepartmentRole(departments, u.role)).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status dos Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Ativos:</span>
                <span className="font-medium" style={{ color: 'var(--tone-success)' }}>
                  {users.filter(u => u.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Inativos:</span>
                <span className="font-medium" style={{ color: 'var(--tone-neutral)' }}>
                  {users.filter(u => u.status === 'inactive').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Exportar Lista de Usuários
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Enviar Convites em Lote
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Relatório de Acessos
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={isClearingDemo}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isClearingDemo ? 'Removendo...' : 'Remover Usuários Demo'}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remover utilizadores de demonstração</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem a certeza que deseja remover os utilizadores de demonstração (admin@sistema.com,
                      atendente@sistema.com, usuario@empresa.com)? Esta ação não pode ser revertida.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearDemoUsers}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Remover
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
