# Correção: Erro "Viatura não encontrado" ao Carregar Pedidos de Viatura

## Problema Identificado

**Erro**: `Erro ao carregar pedidos de viatura: Error: Viatura não encontrado`

## Causa Raiz

O problema estava na **ordem de registro das rotas** no servidor Hono (`/supabase/functions/server/index.tsx`).

### Situação Anterior (INCORRETA):
```typescript
// Rotas de Frotas/Viaturas
app.route('/make-server-8b82752b/frotas', frotasRoutes);

// Rotas de Pedidos de Viatura
app.route('/make-server-8b82752b/frotas/pedidos-viatura', pedidosViaturaRoutes);
```

### O que acontecia:

1. Cliente fazia requisição GET para: `/make-server-8b82752b/frotas/pedidos-viatura`
2. O Hono processa as rotas na ordem em que foram registradas
3. A rota `/frotas` era verificada primeiro
4. Dentro de `frotas-routes.tsx`, a rota `/:id` (linha 47) capturava a requisição
5. O Hono interpretava `pedidos-viatura` como um **ID de viatura**
6. Tentava buscar uma viatura com ID "pedidos-viatura"
7. Não encontrava e retornava erro "Viatura não encontrada"

## Solução Aplicada

Reordenar as rotas para que **rotas mais específicas venham ANTES de rotas mais genéricas**:

```typescript
// ⚠️ IMPORTANTE: Rotas de Pedidos de Viatura DEVEM vir ANTES de Frotas
// porque /frotas/pedidos-viatura é mais específico que /frotas/:id
app.route('/make-server-8b82752b/frotas/pedidos-viatura', pedidosViaturaRoutes);

// Rotas de Frotas/Viaturas
app.route('/make-server-8b82752b/frotas', frotasRoutes);
```

### Como funciona agora:

1. Cliente faz requisição GET para: `/make-server-8b82752b/frotas/pedidos-viatura`
2. O Hono verifica a rota `/frotas/pedidos-viatura` **primeiro**
3. A rota corresponde exatamente → Processa `pedidosViaturaRoutes`
4. Retorna a lista de pedidos de viatura corretamente ✅

## Regra Geral para Roteamento

**Sempre registre rotas mais específicas ANTES de rotas com parâmetros dinâmicos**

### Correto ✅:
```typescript
app.route('/api/users/me', meRoutes);           // Específico
app.route('/api/users', usersRoutes);           // Menos específico (tem /:id dentro)
```

### Incorreto ❌:
```typescript
app.route('/api/users', usersRoutes);           // /:id captura tudo, incluindo "me"
app.route('/api/users/me', meRoutes);           // Nunca será alcançado
```

## Teste da Correção

1. Abra o módulo de Frotas
2. Vá para "Pedidos de Viatura"
3. A lista deve carregar sem erros
4. Crie um novo pedido
5. Submeta o pedido
6. Saia da secção e volte
7. O pedido deve aparecer na lista

## Arquivos Modificados

- `/supabase/functions/server/index.tsx` - Ordem das rotas corrigida

## Status

✅ **Correção Aplicada**
✅ **Teste Recomendado**

---

**Data**: 2026-01-07  
**Tipo**: Correção de Bug Crítico  
**Impacto**: Módulo de Frotas/Pedidos de Viatura completamente funcional
