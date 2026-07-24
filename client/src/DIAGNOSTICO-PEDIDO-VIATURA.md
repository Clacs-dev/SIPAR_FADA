# Diagnóstico: Pedido de Viatura Desaparece Após Submissão

## Problema Reportado
Após criar um rascunho de pedido de viatura e submetê-lo, quando o utilizador volta à interface, o pedido não aparece na lista.

## Logs de Diagnóstico Implementados

Foram adicionados logs detalhados em todas as camadas do sistema para identificar onde o pedido está a ser perdido:

### 1. Backend - Rota GET (Listar Pedidos)
**Arquivo**: `/supabase/functions/server/pedidos-viatura-routes.tsx`

Logs adicionados:
- `[PEDIDOS VIATURA] Usuário autenticado: {email} Role: {role}`
- `[PEDIDOS VIATURA] Total de pedidos encontrados: {count}`
- `[PEDIDOS VIATURA] IDs e status dos pedidos:` (lista detalhada)
- `[PEDIDOS VIATURA] Filtrando pedidos para usuário não-admin`
- `[PEDIDOS VIATURA] Retornando {count} pedidos`

### 2. Frontend - Hook
**Arquivo**: `/hooks/use-pedidos-viatura.ts`

Logs adicionados:
- `[PEDIDOS VIATURA HOOK] Buscando pedidos...`
- `[PEDIDOS VIATURA HOOK] Pedidos recebidos: {count}`
- `[PEDIDOS VIATURA HOOK] IDs e status:` (lista detalhada)

### 3. Frontend - Wrapper
**Arquivo**: `/components/frotas/pedidos-viatura-wrapper.tsx`

Logs adicionados:
- `[WRAPPER] Submetendo pedido: {id}`
- `[WRAPPER] Pedido submetido com sucesso: {id} Status: {status}`
- `[WRAPPER] Erro ao submeter: {error}`

### 4. Frontend - Lista
**Arquivo**: `/components/frotas/pedidos-viatura-list.tsx`

Logs adicionados:
- `[PEDIDOS LIST] Total de pedidos recebidos: {count}`
- `[PEDIDOS LIST] Pedidos após filtros: {count}`
- `[PEDIDOS LIST] Filtros ativos - Status: {status} Prioridade: {prioridade} Busca: {term}`

## Como Diagnosticar

### Passo 1: Abrir a Consola do Browser
1. Pressione F12 ou clique com o botão direito e selecione "Inspecionar"
2. Vá para a aba "Console"

### Passo 2: Reproduzir o Problema
1. Crie um novo pedido de viatura (salvo como rascunho)
2. Submeta o pedido
3. Anote os logs que aparecem na consola
4. Saia da secção de Frotas (ou recarregue a página)
5. Volte para a secção de Pedidos de Viatura
6. Observe os logs novamente

### Passo 3: Analisar os Logs

Compare os logs antes e depois de voltar à interface:

#### Se o problema está no Backend (BD):
- `[PEDIDOS VIATURA] Total de pedidos encontrados: 0` → O pedido não foi salvo na BD
- `[PEDIDOS VIATURA] IDs e status dos pedidos:` → Verificar se o pedido aparece aqui

#### Se o problema está na Filtragem do Backend:
- O pedido aparece em "Total de pedidos encontrados" mas não em "Retornando X pedidos"
- Verificar o `solicitante_id` do pedido vs o `user.id`

#### Se o problema está no Frontend:
- Backend retorna o pedido mas frontend não o recebe
- `[PEDIDOS VIATURA HOOK] Pedidos recebidos: 0`

#### Se o problema está nos Filtros:
- `[PEDIDOS LIST] Total de pedidos recebidos: 1` mas `Pedidos após filtros: 0`
- Verificar os filtros ativos (Status, Prioridade, Busca)

## Possíveis Causas e Soluções

### Causa 1: Pedido não está a ser persistido
**Sintoma**: `[PEDIDOS VIATURA] Total de pedidos encontrados: 0`

**Solução**: Verificar se o pedido está a ser salvo corretamente:
```typescript
// Linha 213 do backend
await (await import('./kv_store.tsx')).set(`pedido_viatura:${pedidoId}`, pedido);
```

### Causa 2: Problema com o ID do pedido
**Sintoma**: Pedido salvo com um ID mas buscado com outro

**Verificação**: 
- ID do pedido criado: `pedido_viatura_${Date.now()}_${random}`
- Chave na BD: `pedido_viatura:pedido_viatura_${Date.now()}_${random}`

### Causa 3: Filtragem incorreta por utilizador
**Sintoma**: Pedido existe mas o filtro `solicitante_id` não corresponde

**Verificação**: Comparar nos logs:
- `solicitante_id` do pedido
- `user.id` do utilizador autenticado

### Causa 4: Filtros de UI ativos
**Sintoma**: `[PEDIDOS LIST] Filtros ativos - Status: rascunho` (por exemplo)

**Solução**: Limpar os filtros ou garantir que o status do pedido corresponde

## Dados para Reportar

Se o problema persistir, por favor forneça os seguintes dados dos logs:

1. **Após criar e submeter o pedido:**
   - `[WRAPPER] Pedido submetido com sucesso: {id} Status: {status}`
   - ID completo do pedido

2. **Ao voltar à lista:**
   - `[PEDIDOS VIATURA] Total de pedidos encontrados: {count}`
   - `[PEDIDOS VIATURA] IDs e status dos pedidos:` (lista completa)
   - `[PEDIDOS VIATURA] Retornando {count} pedidos`
   - `[PEDIDOS VIATURA HOOK] Pedidos recebidos: {count}`
   - `[PEDIDOS LIST] Total de pedidos recebidos: {count}`
   - `[PEDIDOS LIST] Pedidos após filtros: {count}`

3. **Informações do utilizador:**
   - `[PEDIDOS VIATURA] Usuário autenticado: {email} Role: {role}`

Com estas informações, poderei identificar exatamente onde o pedido está a ser perdido e aplicar a correção apropriada.

## Teste Rápido

Execute este comando na consola do browser após submeter o pedido:
```javascript
// Verificar o estado local
localStorage.getItem('supabase.auth.token')
```

Depois, ao voltar à lista, execute novamente para verificar se a sessão persiste.

---

**Status**: Logs de diagnóstico implementados e prontos para teste
**Data**: 2026-01-07
