import test from 'node:test';
import assert from 'node:assert/strict';
import { BusinessRulesService } from '../services/business-rules.service';

test('facturas seguem transicao valida ate pagamento', () => {
  assert.equal(BusinessRulesService.validateTransition('factura', 'pendente', 'validado_chefe_dsg').allowed, true);
  assert.equal(BusinessRulesService.validateTransition('factura', 'validado_chefe_dsg', 'validado').allowed, true);
  assert.equal(BusinessRulesService.validateTransition('factura', 'validado', 'aprovado').allowed, true);
  // "aprovado" tem de passar por "submetido_ao_banco" antes de "pago" - ver
  // teste dedicado abaixo para esta invariante financeira.
  assert.equal(BusinessRulesService.validateTransition('factura', 'aprovado', 'submetido_ao_banco').allowed, true);
  assert.equal(BusinessRulesService.validateTransition('factura', 'submetido_ao_banco', 'pago').allowed, true);
});

test('factura pendente tem de passar pela validacao do Chefe DSG antes do Aprovar-DSG', () => {
  assert.equal(BusinessRulesService.validateTransition('factura', 'pendente', 'validado').allowed, false);
  assert.equal(BusinessRulesService.validateTransition('factura', 'pendente', 'aprovado').allowed, false);
  assert.equal(BusinessRulesService.validateTransition('factura', 'validado_chefe_dsg', 'aprovado').allowed, false);
  assert.equal(BusinessRulesService.validateTransition('factura', 'pendente', 'rejeitado').allowed, true);
  assert.equal(BusinessRulesService.validateTransition('factura', 'validado_chefe_dsg', 'rejeitado').allowed, true);
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

test('factura nunca pode ser marcada paga sem antes passar por submetido_ao_banco', () => {
  // Invariante financeira central: a Ordem de Pagamento tem de ser submetida
  // ao banco antes de a factura poder ser marcada como paga. Saltar este
  // passo permitiria registar um pagamento sem o rasto de auditoria bancario.
  const direct = BusinessRulesService.validateTransition('factura', 'aprovado', 'pago');
  assert.equal(direct.allowed, false);

  const viaSubmissao = BusinessRulesService.validateTransition('factura', 'aprovado', 'submetido_ao_banco');
  assert.equal(viaSubmissao.allowed, true);

  const pagoFinal = BusinessRulesService.validateTransition('factura', 'submetido_ao_banco', 'pago');
  assert.equal(pagoFinal.allowed, true);
});

test('factura paga, rejeitada, cancelada e arquivada sao estados terminais (sem saida)', () => {
  for (const status of ['pago', 'rejeitado', 'cancelado', 'arquivado']) {
    const result = BusinessRulesService.validateTransition('factura', status, 'pendente');
    assert.equal(result.allowed, false, `${status} nao deveria permitir voltar a pendente`);
  }
});

test('procurement segue a cadeia completa requisicao -> ordem de compra -> recebida', () => {
  const chain: [string, string][] = [
    ['requisicao', 'cotacao'],
    ['cotacao', 'aprovacao'],
    ['aprovacao', 'aprovado'],
    ['aprovado', 'ordem_compra'],
    ['ordem_compra', 'recebida'],
  ];
  for (const [from, to] of chain) {
    const result = BusinessRulesService.validateTransition('procurement', from, to);
    assert.equal(result.allowed, true, `${from} -> ${to} deveria ser permitido`);
  }
});

test('procurement bloqueia saltar etapas da cadeia de aprovacao', () => {
  const result = BusinessRulesService.validateTransition('procurement', 'requisicao', 'ordem_compra');
  assert.equal(result.allowed, false);
  assert.match(result.message || '', /Transicao invalida/);
});

test('procurement recebida e um estado terminal', () => {
  const result = BusinessRulesService.validateTransition('procurement', 'recebida', 'cotacao');
  assert.equal(result.allowed, false);
});

test('requiredFields devolve os campos obrigatorios por estado e cai para o estado inicial quando desconhecido', () => {
  assert.deepEqual(BusinessRulesService.requiredFields('factura', 'validado'), ['fornecedor', 'valor', 'numero']);
  // "xyz" nao e um estado conhecido do modulo factura: cai para os campos do estado inicial (pendente)
  assert.deepEqual(BusinessRulesService.requiredFields('factura', 'xyz'), ['fornecedor', 'valor']);
});

test('validateTransition permanece permissiva para modulos sem regras definidas', () => {
  const result = BusinessRulesService.validateTransition('modulo_sem_regras', 'qualquer', 'outro');
  assert.equal(result.allowed, true);
});
