import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PermissionSpec {
  module: string;
  actions: string[];
}

const MODULES = {
  PRESENTATIONS: 'presentations',
  AUDIENCES: 'audiences',
  REQUESTS: 'requests',
  SCHEDULE: 'schedule',
  INTERNAL_MEETINGS: 'internal_meetings',
  ACTAS: 'actas',
  COMMUNICATIONS: 'communications',
  FINANCE: 'finance',
  INVOICES: 'invoices',
  USERS: 'users',
  DEPARTMENTS: 'departments',
  ROLES: 'roles',
  MESSAGES: 'messages',
  NOTIFICATIONS: 'notifications',
  EMAIL: 'email',
  AUDIT: 'audit',
  DATABASE: 'database',
  SETTINGS: 'settings',
  REPORTS: 'reports',
  ANALYTICS: 'analytics',
  ACTIVITY_MAP: 'activity_map',
  TAX_MAP: 'tax_map',
} as const;


const A = {
  CREATE: 'create',
  READ_ALL: 'read_all',
  READ_OWN: 'read_own',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  REJECT: 'reject',
  CANCEL: 'cancel',
  EXPORT: 'export',
  IMPORT: 'import',
  MANAGE: 'manage',
  UPDATE_OWN: 'update_own',
  DELETE_OWN: 'delete_own',
};

// Separadores da Gestao de Pagamento + Mapa de Impostos (so "ver" = read_all).
const SEPARADORES_PAGAMENTO = [
  'pagamentos_dashboard', 'pagamentos_todas', 'pagamentos_pendentes', 'pagamentos_validados_chefe_dsg', 'pagamentos_aprovados_dsg',
  'pagamentos_autorizacao_despesas', 'pagamentos_ordens_fornecedor', 'pagamentos_ordens_interna',
  'pagamentos_submetido_banco', 'pagamentos_pagos', MODULES.TAX_MAP,
];
const VER_SEPARADORES_PAGAMENTO: PermissionSpec[] = SEPARADORES_PAGAMENTO.map((module) => ({ module, actions: ['read_all'] }));

// Passos do fluxo da factura (accao approve = pode executar o passo).
const PASSO_VALIDAR_CHEFE_DSG: PermissionSpec = { module: 'pagamentos_accao_validar_chefe_dsg', actions: ['approve'] };
const PASSO_APROVAR_DSG: PermissionSpec = { module: 'pagamentos_accao_aprovar_dsg', actions: ['approve'] };
const PASSO_AUTORIZAR: PermissionSpec = { module: 'pagamentos_accao_autorizar', actions: ['approve'] };
const PASSO_PAGAR: PermissionSpec = { module: 'pagamentos_accao_pagar', actions: ['approve'] };

// Reproduz exatamente o que os grupos estaticos concediam hoje
// (server/src/utils/permissions.ts), menos os modulos exclusivamente
// tecnicos que passam para o novo role admin_sistema.
const EXECUTIVO_PERMISSIONS: PermissionSpec[] = [
  PASSO_AUTORIZAR,
  ...VER_SEPARADORES_PAGAMENTO,
  { module: MODULES.ACTIVITY_MAP, actions: [A.READ_ALL, A.EXPORT, A.UPDATE] },
  { module: MODULES.PRESENTATIONS, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.APPROVE, A.REJECT] },
  { module: MODULES.AUDIENCES, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.APPROVE, A.REJECT] },
  { module: MODULES.REQUESTS, actions: [A.READ_ALL, A.MANAGE, A.APPROVE, A.REJECT] },
  { module: MODULES.SCHEDULE, actions: [A.READ_ALL, A.CREATE, A.UPDATE, A.CANCEL] },
  { module: MODULES.INTERNAL_MEETINGS, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE] },
  { module: MODULES.ACTAS, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.APPROVE, A.REJECT] },
  { module: MODULES.COMMUNICATIONS, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.APPROVE, A.REJECT] },
  { module: MODULES.FINANCE, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.APPROVE, A.REJECT] },
  { module: MODULES.INVOICES, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.APPROVE, A.REJECT] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_ALL, A.DELETE] },
  { module: MODULES.NOTIFICATIONS, actions: [A.CREATE, A.READ_ALL, A.DELETE] },
  { module: MODULES.REPORTS, actions: [A.READ_ALL, A.CREATE, A.EXPORT] },
  { module: MODULES.ANALYTICS, actions: [A.READ_ALL] },
];

// Novo role tecnico, exclusivo: gestao de utilizadores/departamentos/roles/
// auditoria/email/BD/configuracoes, mais visao geral (read_all) sobre os
// modulos de negocio para fins de supervisao/suporte.
const ADMIN_TECNICO_PERMISSIONS: PermissionSpec[] = [
  ...VER_SEPARADORES_PAGAMENTO,
  { module: MODULES.ACTIVITY_MAP, actions: [A.READ_ALL, A.EXPORT] },
  { module: MODULES.USERS, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.MANAGE] },
  { module: MODULES.DEPARTMENTS, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.MANAGE] },
  { module: MODULES.ROLES, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.MANAGE] },
  { module: MODULES.EMAIL, actions: [A.CREATE, A.READ_ALL, A.MANAGE] },
  { module: MODULES.AUDIT, actions: [A.READ_ALL, A.EXPORT, A.MANAGE] },
  { module: MODULES.DATABASE, actions: [A.READ_ALL, A.MANAGE, A.EXPORT, A.IMPORT] },
  { module: MODULES.SETTINGS, actions: [A.READ_ALL, A.UPDATE] },
  { module: MODULES.REPORTS, actions: [A.READ_ALL, A.CREATE, A.EXPORT] },
  { module: MODULES.ANALYTICS, actions: [A.READ_ALL] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_ALL, A.DELETE] },
  { module: MODULES.NOTIFICATIONS, actions: [A.CREATE, A.READ_ALL, A.DELETE] },
  { module: MODULES.PRESENTATIONS, actions: [A.READ_ALL] },
  { module: MODULES.AUDIENCES, actions: [A.READ_ALL] },
  { module: MODULES.REQUESTS, actions: [A.READ_ALL] },
  { module: MODULES.SCHEDULE, actions: [A.READ_ALL] },
  { module: MODULES.INTERNAL_MEETINGS, actions: [A.READ_ALL] },
  { module: MODULES.ACTAS, actions: [A.READ_ALL] },
  { module: MODULES.COMMUNICATIONS, actions: [A.READ_ALL] },
  { module: MODULES.FINANCE, actions: [A.READ_ALL] },
  { module: MODULES.INVOICES, actions: [A.READ_ALL] },
];

const GERENTE_PERMISSIONS: PermissionSpec[] = [
  { module: MODULES.PRESENTATIONS, actions: [A.CREATE, A.READ_ALL, A.APPROVE, A.REJECT, A.UPDATE] },
  { module: MODULES.AUDIENCES, actions: [A.CREATE, A.READ_ALL, A.APPROVE, A.REJECT, A.UPDATE] },
  { module: MODULES.REQUESTS, actions: [A.READ_ALL, A.MANAGE, A.APPROVE, A.REJECT] },
  { module: MODULES.SCHEDULE, actions: [A.READ_ALL, A.CREATE, A.UPDATE] },
  { module: MODULES.INTERNAL_MEETINGS, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE] },
  { module: MODULES.ACTAS, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.APPROVE, A.REJECT] },
  { module: MODULES.COMMUNICATIONS, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.APPROVE, A.REJECT] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_ALL] },
  { module: MODULES.NOTIFICATIONS, actions: [A.CREATE, A.READ_ALL] },
  { module: MODULES.REPORTS, actions: [A.READ_ALL, A.CREATE, A.EXPORT] },
  { module: MODULES.ANALYTICS, actions: [A.READ_ALL] },
  { module: MODULES.USERS, actions: [A.READ_ALL] },
];

const ATENDENTE_PERMISSIONS: PermissionSpec[] = [
  { module: MODULES.PRESENTATIONS, actions: [A.CREATE, A.READ_ALL, A.UPDATE] },
  { module: MODULES.AUDIENCES, actions: [A.CREATE, A.READ_ALL, A.UPDATE] },
  { module: MODULES.REQUESTS, actions: [A.READ_ALL, A.UPDATE] },
  { module: MODULES.SCHEDULE, actions: [A.READ_ALL, A.CREATE, A.UPDATE] },
  { module: MODULES.INTERNAL_MEETINGS, actions: [A.READ_ALL] },
  { module: MODULES.ACTAS, actions: [A.READ_ALL, A.UPDATE] },
  { module: MODULES.COMMUNICATIONS, actions: [A.READ_ALL, A.UPDATE] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_ALL] },
  { module: MODULES.NOTIFICATIONS, actions: [A.CREATE, A.READ_ALL] },
  { module: MODULES.REPORTS, actions: [A.READ_ALL] },
];

const FINANCEIRO_PERMISSIONS: PermissionSpec[] = [
  PASSO_PAGAR,
  ...VER_SEPARADORES_PAGAMENTO,
  { module: MODULES.ACTIVITY_MAP, actions: [A.READ_ALL, A.EXPORT, A.UPDATE] },
  { module: MODULES.PRESENTATIONS, actions: [A.READ_ALL] },
  { module: MODULES.AUDIENCES, actions: [A.READ_ALL] },
  { module: MODULES.FINANCE, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.APPROVE, A.REJECT] },
  { module: MODULES.INVOICES, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.DELETE, A.EXPORT, A.APPROVE, A.REJECT] },
  { module: MODULES.REQUESTS, actions: [A.READ_ALL] },
  { module: MODULES.INTERNAL_MEETINGS, actions: [A.READ_ALL] },
  { module: MODULES.ACTAS, actions: [A.READ_ALL] },
  { module: MODULES.COMMUNICATIONS, actions: [A.READ_ALL] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_ALL] },
  { module: MODULES.NOTIFICATIONS, actions: [A.READ_ALL] },
  { module: MODULES.REPORTS, actions: [A.CREATE, A.READ_ALL, A.EXPORT] },
  { module: MODULES.ANALYTICS, actions: [A.READ_ALL] },
];

const COMPRAS_PERMISSIONS: PermissionSpec[] = [
  PASSO_APROVAR_DSG,
  ...VER_SEPARADORES_PAGAMENTO,
  { module: MODULES.ACTIVITY_MAP, actions: [A.READ_ALL, A.EXPORT, A.UPDATE] },
  { module: MODULES.PRESENTATIONS, actions: [A.READ_ALL] },
  { module: MODULES.AUDIENCES, actions: [A.READ_ALL] },
  { module: MODULES.FINANCE, actions: [A.CREATE, A.READ_ALL, A.UPDATE, A.APPROVE, A.REJECT] },
  { module: MODULES.INVOICES, actions: [A.READ_ALL, A.UPDATE, A.APPROVE, A.REJECT] },
  { module: MODULES.REQUESTS, actions: [A.READ_ALL] },
  { module: MODULES.INTERNAL_MEETINGS, actions: [A.READ_ALL] },
  { module: MODULES.ACTAS, actions: [A.READ_ALL] },
  { module: MODULES.COMMUNICATIONS, actions: [A.READ_ALL] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_ALL] },
  { module: MODULES.NOTIFICATIONS, actions: [A.READ_ALL] },
  { module: MODULES.REPORTS, actions: [A.READ_ALL, A.CREATE] },
];

// DSG Tecnico: submete em nome dos fornecedores (pedidos, fornecedores,
// cotacoes, facturas/proformas) e ve o Mapa de Impostos. So edita/anula/
// elimina os seus proprios documentos enquanto ninguem actuou sobre eles
// (update_own/delete_own) - nunca valida, aprova, rejeita ou paga. O Mapa de
// Actividades (activity_map) so se o Administrador do Sistema o conceder.
// Manter igual a DSG_TECNICO_PERMISSIONS em src/services/rbac-sync.service.ts.
const DSG_TECNICO_PERMISSIONS: PermissionSpec[] = [
  ...VER_SEPARADORES_PAGAMENTO,
  { module: MODULES.FINANCE, actions: [A.CREATE, A.READ_ALL, A.UPDATE_OWN, A.DELETE_OWN] },
  { module: MODULES.INVOICES, actions: [A.CREATE, A.READ_ALL, A.UPDATE_OWN, A.DELETE_OWN] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_ALL] },
  { module: MODULES.NOTIFICATIONS, actions: [A.READ_ALL] },
  { module: MODULES.SCHEDULE, actions: [A.READ_ALL] },
];

// Chefe de Departamento DSG: valida (ou rejeita/edita/elimina) as facturas e
// proformas Pendentes antes do Aprovar-DSG.
// Manter igual a CHEFE_DSG_PERMISSIONS em src/services/rbac-sync.service.ts.
const CHEFE_DSG_PERMISSIONS: PermissionSpec[] = [
  PASSO_VALIDAR_CHEFE_DSG,
  ...VER_SEPARADORES_PAGAMENTO,
  { module: MODULES.INVOICES, actions: [A.READ_ALL] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_ALL] },
  { module: MODULES.NOTIFICATIONS, actions: [A.READ_ALL] },
  { module: MODULES.SCHEDULE, actions: [A.READ_ALL] },
];

const USUARIO_PERMISSIONS: PermissionSpec[] = [
  { module: MODULES.PRESENTATIONS, actions: [A.CREATE, A.READ_OWN, A.UPDATE] },
  { module: MODULES.AUDIENCES, actions: [A.CREATE, A.READ_OWN, A.UPDATE] },
  { module: MODULES.INVOICES, actions: [A.CREATE, A.READ_OWN, A.UPDATE] },
  { module: MODULES.REQUESTS, actions: [A.READ_OWN] },
  { module: MODULES.SCHEDULE, actions: [A.READ_OWN] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_OWN] },
  { module: MODULES.NOTIFICATIONS, actions: [A.READ_OWN] },
];

// Role minimo, sem login, usado apenas pelo pseudo-utilizador que injeta os
// endpoints publicos/nao-autenticados de submissao (server/src/routes/modules.routes.ts,
// rotas "/publica"). So pode CRIAR nestes dois modulos, nunca ler/editar/apagar
// nada - impedir que um futuro role chamado "admin" (criado via a UI de Roles)
// ative acidentalmente um caminho de escrita/leitura nao-autenticado mais amplo.
const PUBLICO_PERMISSIONS: PermissionSpec[] = [
  { module: MODULES.PRESENTATIONS, actions: [A.CREATE] },
  { module: MODULES.AUDIENCES, actions: [A.CREATE] },
];

// Mapeamento role -> grupo de permissoes, replicando exatamente a logica
// atual de getUserPermissions() em server/src/utils/permissions.ts.
const EXECUTIVO_ROLES = [
  'gabinete_pca', 'gabinete_pce', 'gabinete_administrador', 'gabinete_director',
  'gabinete_ministro', 'gabinete_secretario_estado_1', 'gabinete_secretario_estado_2', // gitleaks:allow ("secretario" e nome de role, nao um segredo)
  'gabinete_vice_governador_1', 'gabinete_vice_governador_2',
  'administracao', 'gestao', 'tecnologia_informacao',
];
const ATENDENTE_ROLES = ['secretaria', 'administrativo', 'seguranca'];
const GERENTE_ROLES = ['recursos_humanos', 'juridico', 'comunicacao_imagem', 'planeamento', 'organizacao_qualidade', 'compliance', 'risco'];
const FINANCEIRO_ROLES = ['financeiro'];
const OPERADOR_ROLES: string[] = ['operacoes', 'operacional_frota'];
const COMPRAS_ROLES = ['compras'];
const USUARIO_ROLES = ['externo'];

const ROLE_LABELS: Record<string, string> = {
  gabinete_pca: 'Gabinete do PCA',
  gabinete_pce: 'Gabinete do PCE',
  gabinete_administrador: 'Gabinete do Administrador',
  gabinete_director: 'Gabinete do Director',
  gabinete_ministro: 'Gabinete do Ministro',
  gabinete_secretario_estado_1: 'Gabinete do Secretário de Estado 1',
  gabinete_secretario_estado_2: 'Gabinete do Secretário de Estado 2',
  gabinete_vice_governador_1: 'Gabinete do Vice-Governador 1',
  gabinete_vice_governador_2: 'Gabinete do Vice-Governador 2',
  administracao: 'Administração',
  gestao: 'Gestão',
  tecnologia_informacao: 'Tecnologia da Informação',
  secretaria: 'Secretaria',
  administrativo: 'Administrativo',
  seguranca: 'Segurança',
  recursos_humanos: 'Recursos Humanos',
  juridico: 'Jurídico',
  comunicacao_imagem: 'Comunicação e Imagem',
  planeamento: 'Planeamento',
  organizacao_qualidade: 'Organização e Qualidade',
  compliance: 'Compliance',
  risco: 'Gestão de Risco',
  financeiro: 'Financeiro',
  operacoes: 'Operações',
  operacional_frota: 'Operacional de Frota',
  compras: 'Procurement / Compras',
  dsg_tecnico: 'DSG Técnico',
  chefe_dsg: 'Chefe de Departamento DSG',
  externo: 'Utilizador Externo',
  admin_sistema: 'Administrador do Sistema',
  publico: 'Submissão Pública (sem login)',
};

const DEPARTMENTS: { slug: string; nome: string; categoria: string; cor: string }[] = [
  { slug: 'gabinete_pca', nome: 'Gabinete do PCA', categoria: 'gabinetes_executivos', cor: 'bg-red-600' },
  { slug: 'gabinete_pce', nome: 'Gabinete do PCE', categoria: 'gabinetes_executivos', cor: 'bg-red-600' },
  { slug: 'gabinete_administrador', nome: 'Gabinete do Administrador', categoria: 'gabinetes_executivos', cor: 'bg-red-500' },
  { slug: 'gabinete_director', nome: 'Gabinete do Director', categoria: 'gabinetes_executivos', cor: 'bg-red-500' },
  { slug: 'gestao', nome: 'Gestão', categoria: 'gabinetes_executivos', cor: 'bg-orange-600' },
  { slug: 'gabinete_ministro', nome: 'Gabinete do Ministro', categoria: 'gabinetes_governamentais', cor: 'bg-purple-600' },
  { slug: 'gabinete_secretario_estado_1', nome: 'Gabinete do Secretário de Estado 1', categoria: 'gabinetes_governamentais', cor: 'bg-purple-500' },
  { slug: 'gabinete_secretario_estado_2', nome: 'Gabinete do Secretário de Estado 2', categoria: 'gabinetes_governamentais', cor: 'bg-purple-500' },
  { slug: 'gabinete_vice_governador_1', nome: 'Gabinete do Vice-Governador 1', categoria: 'gabinetes_governamentais', cor: 'bg-indigo-600' },
  { slug: 'gabinete_vice_governador_2', nome: 'Gabinete do Vice-Governador 2', categoria: 'gabinetes_governamentais', cor: 'bg-indigo-600' },
  { slug: 'financeiro', nome: 'Financeiro', categoria: 'operacionais', cor: 'bg-green-600' },
  { slug: 'recursos_humanos', nome: 'Recursos Humanos', categoria: 'operacionais', cor: 'bg-teal-600' },
  { slug: 'juridico', nome: 'Jurídico', categoria: 'operacionais', cor: 'bg-blue-700' },
  { slug: 'compras', nome: 'Procurement / Compras', categoria: 'operacionais', cor: 'bg-cyan-600' },
  { slug: 'tecnologia_informacao', nome: 'Tecnologia da Informação', categoria: 'operacionais', cor: 'bg-blue-600' },
  { slug: 'operacoes', nome: 'Operações', categoria: 'operacionais', cor: 'bg-emerald-600' },
  { slug: 'operacional_frota', nome: 'Operacional de Frota', categoria: 'operacionais', cor: 'bg-green-700' },
  { slug: 'administracao', nome: 'Administração', categoria: 'apoio', cor: 'bg-slate-600' },
  { slug: 'administrativo', nome: 'Administrativo', categoria: 'apoio', cor: 'bg-slate-500' },
  { slug: 'comunicacao_imagem', nome: 'Comunicação e Imagem', categoria: 'apoio', cor: 'bg-sky-600' },
  { slug: 'seguranca', nome: 'Segurança', categoria: 'apoio', cor: 'bg-gray-700' },
  { slug: 'secretaria', nome: 'Secretaria', categoria: 'apoio', cor: 'bg-slate-500' },
  { slug: 'planeamento', nome: 'Planeamento', categoria: 'estrategicos', cor: 'bg-amber-600' },
  { slug: 'organizacao_qualidade', nome: 'Organização e Qualidade', categoria: 'estrategicos', cor: 'bg-yellow-600' },
  { slug: 'compliance', nome: 'Compliance', categoria: 'estrategicos', cor: 'bg-orange-600' },
  { slug: 'risco', nome: 'Gestão de Risco', categoria: 'estrategicos', cor: 'bg-orange-700' },
];

async function seedDepartments() {
  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { slug: dept.slug },
      update: { nome: dept.nome, categoria: dept.categoria, cor: dept.cor },
      create: { slug: dept.slug, nome: dept.nome, categoria: dept.categoria, cor: dept.cor },
    });
  }
 console.log(`[Seed RBAC] ${DEPARTMENTS.length} departamentos sincronizados.`);
}

async function seedRole(slug: string, permissions: PermissionSpec[], sistema: boolean, executivo: boolean = false) {
  const role = await prisma.role.upsert({
    where: { slug },
    update: { nome: ROLE_LABELS[slug] || slug, sistema, executivo },
    create: { slug, nome: ROLE_LABELS[slug] || slug, sistema, executivo },
  });

  // Substitui o conjunto de permissoes do role para bater exatamente com o spec.
  await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
  const rows = permissions.flatMap((spec) =>
    spec.actions.map((action) => ({ roleId: role.id, module: spec.module, action }))
  );
  if (rows.length > 0) {
    await prisma.rolePermission.createMany({ data: rows });
  }
  return role;
}

async function seedRoles() {
  for (const slug of EXECUTIVO_ROLES) await seedRole(slug, EXECUTIVO_PERMISSIONS, true, true);
  for (const slug of ATENDENTE_ROLES) await seedRole(slug, ATENDENTE_PERMISSIONS, true);
  for (const slug of GERENTE_ROLES) await seedRole(slug, GERENTE_PERMISSIONS, true);
  for (const slug of FINANCEIRO_ROLES) await seedRole(slug, FINANCEIRO_PERMISSIONS, true);
  for (const slug of OPERADOR_ROLES) await seedRole(slug, ATENDENTE_PERMISSIONS, true);
  for (const slug of COMPRAS_ROLES) await seedRole(slug, COMPRAS_PERMISSIONS, true);
  for (const slug of USUARIO_ROLES) await seedRole(slug, USUARIO_PERMISSIONS, true);
  await seedRole('dsg_tecnico', DSG_TECNICO_PERMISSIONS, true);
  await seedRole('chefe_dsg', CHEFE_DSG_PERMISSIONS, true);
  await seedRole('admin_sistema', ADMIN_TECNICO_PERMISSIONS, true);
  await seedRole('publico', PUBLICO_PERMISSIONS, true);

  const total = EXECUTIVO_ROLES.length + ATENDENTE_ROLES.length + GERENTE_ROLES.length
    + FINANCEIRO_ROLES.length + OPERADOR_ROLES.length + COMPRAS_ROLES.length + USUARIO_ROLES.length + 4;
 console.log(`[Seed RBAC] ${total} roles sincronizados (incluindo admin_sistema).`);
}

export async function seedRBAC() {
  await seedDepartments();
  await seedRoles();
}

if (require.main === module) {
  seedRBAC()
    .catch((e) => {
 console.error('[Seed RBAC] Erro critico:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
