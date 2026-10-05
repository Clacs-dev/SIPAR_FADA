import { Fragment, useEffect, useState } from "react";
import { ACCOES_PAGAMENTO, SEPARADORES_PAGAMENTO } from "../auth/separadores-pagamento";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Alert, AlertDescription } from "../ui/alert";
import { ShieldCheck, Plus, Trash2, Users, Save, Info } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { useRoles, type Role, type RolePermissionRow } from "../../hooks/use-roles";

// Modulos "restricted: true" sao geridos exclusivamente pelo role fixo
// admin_sistema, verificado em codigo (requireSystemAdmin), NAO por esta
// matriz - marcar/desmarcar uma acao aqui para outro role nao tem qualquer
// efeito real no acesso a esses modulos. Mostrado explicitamente na UI para
// nao dar uma falsa sensacao de controlo granular.
// "actions": colunas que fazem sentido para o modulo (as outras mostram "—").
// "grupo": cabecalho de seccao mostrado antes do modulo.
const MODULES: { value: string; label: string; restricted?: boolean; actions?: string[]; grupo?: string }[] = [
  { value: 'presentations', label: 'Cartas de Apresentação' },
  { value: 'audiences', label: 'Audiências' },
  { value: 'requests', label: 'Solicitações' },
  { value: 'schedule', label: 'Agenda' },
  { value: 'internal_meetings', label: 'Reuniões Internas' },
  { value: 'meeting_rooms', label: 'Salas de Reunião' },
  { value: 'oficios', label: 'Ofícios' },
  { value: 'actas', label: 'Actas' },
  { value: 'communications', label: 'Comunicações' },
  // Chaves iguais as verificadas no servidor (MODULES em server/src/utils/permissions.ts).
  { value: 'invoices', label: 'Facturas & Pagamentos (Gestão de Pagamento, Mapa de Impostos)' },
  { value: 'finance', label: 'Compras / Procurement (pedidos, cotações, fornecedores)' },
  { value: 'activity_map', label: 'Mapa de Actividades (DSG)' },
  // Cada separador da Gestao de Pagamento: sem "Ler (todos)" o separador nao aparece.
  ...SEPARADORES_PAGAMENTO.filter((s) => s.module !== 'activity_map').map((s, i) => ({
    value: s.module,
    label: s.module === 'tax_map' ? 'Mapa de Impostos (menu, Procurement e Gestão de Pagamento)' : s.label,
    actions: ['read_all'],
    grupo: i === 0 ? 'Gestão de Pagamento — separadores visíveis (Ler = ver o separador)' : undefined,
  })),
  // Passos do fluxo da factura: so quem tem "Aprovar" executa o passo.
  ...ACCOES_PAGAMENTO.map((a, i) => ({
    value: a.module,
    label: a.label,
    actions: ['approve'],
    grupo: i === 0 ? 'Gestão de Pagamento — acções no fluxo da factura (Aprovar = pode executar)' : undefined,
  })),
  { value: 'documents', label: 'Documentos' },
  { value: 'messages', label: 'Mensagens' },
  { value: 'notifications', label: 'Notificações' },
  { value: 'reports', label: 'Relatórios' },
  { value: 'analytics', label: 'Análises' },
  { value: 'users', label: 'Utilizadores', restricted: true },
  { value: 'departments', label: 'Departamentos', restricted: true },
  { value: 'areas', label: 'Áreas', restricted: true },
  { value: 'roles', label: 'Roles e Permissões', restricted: true },
  { value: 'email', label: 'Email', restricted: true },
  { value: 'audit', label: 'Auditoria', restricted: true },
  { value: 'database', label: 'Base de Dados', restricted: true },
  { value: 'settings', label: 'Configurações', restricted: true },
];

const ACTIONS: { value: string; label: string }[] = [
  { value: 'create', label: 'Criar' },
  { value: 'read_all', label: 'Ler (todos)' },
  { value: 'read_own', label: 'Ler (próprios)' },
  { value: 'update', label: 'Editar' },
  { value: 'delete', label: 'Eliminar' },
  { value: 'approve', label: 'Aprovar' },
  { value: 'reject', label: 'Rejeitar' },
  { value: 'manage', label: 'Gerir' },
  { value: 'export', label: 'Exportar' },
  // Só os documentos submetidos pelo próprio utilizador e enquanto ninguém
  // actuou sobre eles (ex: DSG Técnico).
  { value: 'update_own', label: 'Editar/anular próprios (sem acção)' },
  { value: 'delete_own', label: 'Eliminar próprios (sem acção)' },
];

export function RolesPermissionsAdmin() {
  const { roles, loading, createRole, deleteRole, getRolePermissions, saveRolePermissions } = useRoles();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [matrix, setMatrix] = useState<Set<string>>(new Set());
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newRole, setNewRole] = useState({ nome: '', descricao: '' });

  const key = (module: string, action: string) => `${module}::${action}`;

  useEffect(() => {
    if (!selectedRole) return;
    setMatrixLoading(true);
    getRolePermissions(selectedRole.id)
      .then((rows: RolePermissionRow[]) => {
        setMatrix(new Set(rows.map((r) => key(r.module, r.action))));
      })
      .catch(() => toast.error('Erro ao carregar permissões do role'))
      .finally(() => setMatrixLoading(false));
  }, [selectedRole]);

  const toggle = (module: string, action: string) => {
    setMatrix((prev) => {
      const next = new Set(prev);
      const k = key(module, action);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const handleSaveMatrix = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      const permissoes: RolePermissionRow[] = Array.from(matrix).map((k) => {
        const [module, action] = k.split('::');
        return { module, action };
      });
      await saveRolePermissions(selectedRole.id, permissoes);
      toast.success('Permissões guardadas com sucesso');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao guardar permissões');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.nome.trim()) {
      toast.error('O nome do role é obrigatório');
      return;
    }
    try {
      const role = await createRole({ nome: newRole.nome.trim(), descricao: newRole.descricao.trim() || undefined });
      toast.success('Role criado com sucesso');
      setCreateDialogOpen(false);
      setNewRole({ nome: '', descricao: '' });
      setSelectedRole(role);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar role');
    }
  };

  const handleDeleteRole = async (role: Role) => {
    try {
      await deleteRole(role.id);
      toast.success('Role movido para a lixeira');
      if (selectedRole?.id === role.id) setSelectedRole(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao eliminar role');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--ring)', fontSize: '13px', fontWeight: 600 }}>
            Administração
          </div>
          <h1 className="flex items-center gap-2 font-serif" style={{ fontSize: '26px', fontWeight: 600, color: 'var(--foreground)' }}>
            <ShieldCheck className="h-6 w-6" />
            Roles e Permissões
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--muted-foreground)' }}>
            Defina quais acções cada role pode executar em cada módulo do sistema
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Role
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Roles</CardTitle>
            <CardDescription>{roles.length} role(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">A carregar...</p>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted/50 ${selectedRole?.id === role.id ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{role.nome}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {role.total_utilizadores ?? 0}
                      {role.sistema && <Badge variant="outline" className="ml-1 text-[10px] py-0">Sistema</Badge>}
                    </p>
                  </div>
                  {!role.sistema && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--tone-danger)' }} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Eliminar role</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem a certeza que deseja eliminar o role <strong>{role.nome}</strong>? O registo é movido para
                            a lixeira e pode ser restaurado por um administrador do sistema. Só é possível eliminar roles
                            sem utilizadores associados.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteRole(role)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">
                  {selectedRole ? `Permissões de "${selectedRole.nome}"` : 'Seleccione um role'}
                </CardTitle>
                <CardDescription>
                  {selectedRole ? 'Marque as acções permitidas por módulo' : 'Clique num role à esquerda para editar a matriz de permissões'}
                </CardDescription>
              </div>
              {selectedRole && selectedRole.slug !== 'admin_sistema' && (
                <Button onClick={handleSaveMatrix} disabled={saving || matrixLoading} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? 'A guardar...' : 'Guardar'}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedRole ? (
              <p className="text-sm text-muted-foreground text-center py-12">Nenhum role seleccionado</p>
            ) : matrixLoading ? (
              <p className="text-sm text-muted-foreground text-center py-12">A carregar permissões...</p>
            ) : (
              <div className="space-y-3">
                {selectedRole.slug === 'admin_sistema' ? (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      As permissões do Administrador do Sistema são fixas (acesso total, verificado em código) e não
                      podem ser alteradas por aqui — evita bloquear acidentalmente o próprio administrador fora do
                      painel, sem via de recuperação.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Os módulos assinalados com <Badge variant="outline" className="mx-1">restrito</Badge>
                      são geridos exclusivamente pelo Administrador do Sistema — marcar/desmarcar uma ação aqui para
                      este role não altera o acesso real a esses módulos.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-background">Módulo</TableHead>
                      {ACTIONS.map((a) => (
                        <TableHead key={a.value} className="text-center whitespace-nowrap">{a.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULES.map((m) => (
                      <Fragment key={m.value}>
                        {m.grupo && (
                          <TableRow>
                            <TableCell colSpan={ACTIONS.length + 1} className="bg-muted/50 font-semibold text-sm">
                              {m.grupo}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell className={`sticky left-0 bg-background font-medium whitespace-nowrap ${m.actions ? 'pl-6' : ''}`}>
                            {m.label}
                            {m.restricted && <Badge variant="outline" className="ml-2 text-[10px]">restrito</Badge>}
                          </TableCell>
                          {ACTIONS.map((a) => (
                            <TableCell key={a.value} className="text-center">
                              {!m.actions || m.actions.includes(a.value) ? (
                                <Checkbox
                                  checked={matrix.has(key(m.value, a.value))}
                                  onCheckedChange={() => toggle(m.value, a.value)}
                                  disabled={selectedRole.slug === 'admin_sistema'}
                                />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      </Fragment>
                    ))}
                  </TableBody>
                </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Role</DialogTitle>
            <DialogDescription>Crie um role personalizado e depois defina as suas permissões</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-nome">Nome do Role *</Label>
              <Input
                id="role-nome"
                value={newRole.nome}
                onChange={(e) => setNewRole({ ...newRole, nome: e.target.value })}
                placeholder="Ex: Supervisor de Actas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-descricao">Descrição</Label>
              <Textarea
                id="role-descricao"
                value={newRole.descricao}
                onChange={(e) => setNewRole({ ...newRole, descricao: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateRole}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
