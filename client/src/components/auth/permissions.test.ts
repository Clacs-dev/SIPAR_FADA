import { describe, it, expect } from 'vitest';
import { hasPermission } from './permissions';

describe('hasPermission', () => {
  it('MANAGE_USERS e MANAGE_SETTINGS sao exclusivos do admin_sistema', () => {
    expect(hasPermission('admin_sistema', 'MANAGE_USERS')).toBe(true);
    expect(hasPermission('admin_sistema', 'MANAGE_SETTINGS')).toBe(true);
  });

  it('um role de negocio comum nao tem acesso administrativo', () => {
    expect(hasPermission('externo', 'MANAGE_USERS')).toBe(false);
    expect(hasPermission('externo', 'MANAGE_SETTINGS')).toBe(false);
    expect(hasPermission('secretaria', 'MANAGE_USERS')).toBe(false);
  });

  it('VIEW_DASHBOARD abrange os roles de negocio mas nao o admin_sistema (role tecnico)', () => {
    expect(hasPermission('gestao', 'VIEW_DASHBOARD')).toBe(true);
    expect(hasPermission('gabinete_pca', 'VIEW_DASHBOARD')).toBe(true);
    expect(hasPermission('externo', 'VIEW_DASHBOARD')).toBe(true);
    expect(hasPermission('admin_sistema', 'VIEW_DASHBOARD')).toBe(false);
  });

  it('CREATE_PRESENTATION e exclusivo do utilizador externo', () => {
    expect(hasPermission('externo', 'CREATE_PRESENTATION')).toBe(true);
    expect(hasPermission('admin_sistema', 'CREATE_PRESENTATION')).toBe(false);
  });

  it('um role desconhecido nunca tem permissoes administrativas', () => {
    expect(hasPermission('role_inexistente' as any, 'MANAGE_USERS')).toBe(false);
    expect(hasPermission('role_inexistente' as any, 'MANAGE_SETTINGS')).toBe(false);
  });
});
