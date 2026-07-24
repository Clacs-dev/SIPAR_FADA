import test from 'node:test';
import assert from 'node:assert/strict';
import { BusinessRulesService } from '../services/business-rules.service';

test('facturas seguem transicao valida ate pagamento', () => {
  assert.equal(BusinessRulesService.validateTransition('factura', 'pendente', 'validado').allowed, true);
  assert.equal(BusinessRulesService.validateTransition('factura', 'validado', 'aprovado').allowed, true);
  assert.equal(BusinessRulesService.validateTransition('factura', 'aprovado', 'pago').allowed, true);
});

test('facturas bloqueiam transicao invalida', () => {
  const result = BusinessRulesService.validateTransition('factura', 'pago', 'aprovado');
  assert.equal(result.allowed, false);
  assert.match(result.message || '', /Transicao invalida|Status atual invalido/);
});

test('status aliases sao normalizados por modulo', () => {
  assert.equal(BusinessRulesService.normalizeStatus('contrato', 'aprovado'), 'ativo');
  assert.equal(BusinessRulesService.normalizeStatus('reclamacao', 'pendente'), 'aberta');
  assert.equal(BusinessRulesService.normalizeStatus('factura', 'pay'), 'pago');
});

test('status terminais sao reconhecidos por modulo', () => {
  assert.equal(BusinessRulesService.isTerminal('pedido', 'fechado'), true);
  assert.equal(BusinessRulesService.isTerminal('contrato', 'ativo'), false);
  assert.equal(BusinessRulesService.isTerminal('factura', 'pago'), true);
});
