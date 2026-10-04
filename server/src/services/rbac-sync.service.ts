/**
 * Sincronizacao incremental do RBAC no arranque do servidor.
 *
 * O seed completo (prisma/seed-rbac.ts) SUBSTITUI as permissoes de cada role
 * de sistema - correr isso numa instalacao em producao apagaria os ajustes
 * feitos pelo Administrador do Sistema no ecra "Roles e Permissoes". Aqui so
 * se ACRESCENTA o que falta, de forma idempotente:
 *
 *  1. Role "dsg_tecnico" (DSG Tecnico) - criado com as permissoes por omissao
 *     apenas se ainda nao existir (se existir, respeita-se o que la estiver).
 *  2. Modulo "activity_map" (Mapa de Actividades) - passou a ter permissao
 *     propria. Uma unica vez (marcador em SystemSetting), concede-o aos roles
 *     que ja o viam pela regra antiga (leitura de todas as facturas ou do
 *     Procurement), para ninguem perder acesso com a mudanca.
 */

import prisma from '../config/database';
import logger from '../config/logger';
import { ACTIONS as A, MODULES, MODULOS_SEPARADORES_PAGAMENTO } from '../utils/permissions';

// Manter igual a DSG_TECNICO_PERMISSIONS em prisma/seed-rbac.ts.
export const DSG_TECNICO_PERMISSIONS: { module: string; actions: string[] }[] = [
  { module: MODULES.FINANCE, actions: [A.CREATE, A.READ_ALL, A.UPDATE_OWN, A.DELETE_OWN] },
  { module: MODULES.INVOICES, actions: [A.CREATE, A.READ_ALL, A.UPDATE_OWN, A.DELETE_OWN] },
  { module: MODULES.MESSAGES, actions: [A.CREATE, A.READ_ALL] },
  { module: MODULES.NOTIFICATIONS, actions: [A.READ_ALL] },
  { module: MODULES.SCHEDULE, actions: [A.READ_ALL] },
  // Mesmos ecras da Gestao de Pagamento: todos os separadores + Mapa de Impostos.
  ...MODULOS_SEPARADORES_PAGAMENTO.map((module) => ({ module, actions: [A.READ_ALL] })),
];

const MARCADOR_ACTIVITY_MAP = 'rbac.migracao.activity_map.v1';
const MARCADOR_SEPARADORES = 'rbac.migracao.separadores_pagamento.v1';
const ROLES_SEM_MAPA = new Set(['dsg_tecnico', 'externo', 'publico']);

async function garantirPermissao(roleId: string, module: string, action: string) {
  await prisma.rolePermission.upsert({
    where: { roleId_module_action: { roleId, module, action } },
    update: {},
    create: { roleId, module, action },
  });
}

async function garantirRoleDsgTecnico() {
  const existente = await prisma.role.findUnique({ where: { slug: 'dsg_tecnico' } });
  if (existente) return false;
  const role = await prisma.role.create({
    data: {
      slug: 'dsg_tecnico',
      nome: 'DSG Técnico',
      descricao: 'Submete pedidos, fornecedores, cotações e facturas/proformas em nome dos fornecedores; vê o Mapa de Impostos. Só edita, anula ou elimina os seus documentos enquanto ninguém actuou sobre eles.',
      sistema: true,
    },
  });
  for (const spec of DSG_TECNICO_PERMISSIONS) {
    for (const action of spec.actions) await garantirPermissao(role.id, spec.module, action);
  }
  return true;
}

async function migrarMapaActividades() {
  const feito = await prisma.systemSetting.findUnique({ where: { key: MARCADOR_ACTIVITY_MAP } });
  if (feito) return 0;

  const roles = await prisma.role.findMany({ where: { deletedAt: null }, include: { permissoes: true } });
  let concedidos = 0;
  for (const role of roles) {
    if (ROLES_SEM_MAPA.has(role.slug)) continue;
    const tem = (module: string, action: string) => role.permissoes.some((p) => p.module === module && p.action === action);
    const lia = tem(MODULES.INVOICES, A.READ_ALL) || tem(MODULES.FINANCE, A.READ_ALL);
    if (!lia) continue;
    await garantirPermissao(role.id, MODULES.ACTIVITY_MAP, A.READ_ALL);
    await garantirPermissao(role.id, MODULES.ACTIVITY_MAP, A.EXPORT);
    if (tem(MODULES.INVOICES, A.UPDATE) || tem(MODULES.FINANCE, A.UPDATE)) {
      await garantirPermissao(role.id, MODULES.ACTIVITY_MAP, A.UPDATE);
    }
    concedidos += 1;
  }
  await prisma.systemSetting.create({ data: { key: MARCADOR_ACTIVITY_MAP, value: new Date().toISOString(), updatedByName: 'sistema' } });
  return concedidos;
}

/**
 * Os separadores da Gestao de Pagamento e o Mapa de Impostos passaram a ter
 * permissao propria. Uma unica vez, concede-os a quem ja os via (roles com
 * leitura de todas as facturas), para ninguem perder acesso.
 */
async function migrarSeparadoresPagamento() {
  const feito = await prisma.systemSetting.findUnique({ where: { key: MARCADOR_SEPARADORES } });
  if (feito) return 0;
  const roles = await prisma.role.findMany({ where: { deletedAt: null }, include: { permissoes: true } });
  let concedidos = 0;
  for (const role of roles) {
    if (role.slug === 'externo' || role.slug === 'publico') continue;
    if (!role.permissoes.some((p) => p.module === MODULES.INVOICES && p.action === A.READ_ALL)) continue;
    for (const module of MODULOS_SEPARADORES_PAGAMENTO) await garantirPermissao(role.id, module, A.READ_ALL);
    concedidos += 1;
  }
  await prisma.systemSetting.create({ data: { key: MARCADOR_SEPARADORES, value: new Date().toISOString(), updatedByName: 'sistema' } });
  return concedidos;
}

export async function sincronizarRbac() {
  const criado = await garantirRoleDsgTecnico();
  if (criado) logger.info('[RBAC] Role "dsg_tecnico" (DSG Técnico) criado com as permissões por omissão.');
  const n = await migrarMapaActividades();
  if (n > 0) logger.info(`[RBAC] Permissão do Mapa de Actividades concedida a ${n} role(s) que já tinham acesso.`);
  const s = await migrarSeparadoresPagamento();
  if (s > 0) logger.info(`[RBAC] Separadores da Gestão de Pagamento e Mapa de Impostos concedidos a ${s} role(s) que já os viam.`);
}
