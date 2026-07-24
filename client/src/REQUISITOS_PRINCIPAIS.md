# 📋 REQUISITOS PRINCIPAIS - MÓDULOS SIPAR

## 🎯 REQUISITOS TÉCNICOS

### **1. INFRAESTRUTURA**

#### **Backend**
- **Runtime:** Deno (via Supabase Edge Functions)
- **Framework Web:** Hono 4.6.3
- **Database:** Supabase (PostgreSQL + KV Store)
- **Storage:** Supabase Storage (buckets públicos e privados)
- **Auth:** Supabase Auth (JWT tokens)

#### **Frontend**
- **Framework:** React 18+
- **Linguagem:** TypeScript (strict mode)
- **UI Components:** shadcn/ui + Tailwind CSS v4
- **Ícones:** Lucide React
- **Formulários:** React Hook Form 7.55.0
- **Notificações:** Sonner 2.0.3
- **Datas:** date-fns com locale pt-BR

#### **APIs e Integrações**
- **Email:** Gmail SMTP (via Nodemailer) ou SendGrid
- **Notificações:** Push Notifications via Supabase
- **PDF:** jsPDF para geração de relatórios
- **Storage:** Supabase Storage API

---

### **2. SEGURANÇA E PERMISSÕES**

#### **Autenticação**
```typescript
// Todos os endpoints requerem token válido
Authorization: Bearer <JWT_TOKEN>

// Validação obrigatória em todas as rotas
const { error: authError, user } = await moduleHelper.validateAuth(c);
if (authError) return authError;
```

#### **Sistema de Permissões**
```typescript
// 13 Módulos com permissões granulares
MODULES = [
  'PRESENTATIONS',
  'AUDIENCES', 
  'SCHEDULE',
  'INTERNAL_MEETINGS',
  'ACTAS',
  'OFICIOS',
  'COMMUNICATIONS',
  'COMPLAINTS',      // Reclamações
  'CONTRACTS',       // Contratos
  'PURCHASES',       // Compras
  'REQUESTS',        // Pedidos
  'PLANNING',        // Planejamento
  'FACTURAS'
]

// 8 Ações disponíveis
ACTIONS = [
  'CREATE',
  'READ_ALL',
  'READ_OWN',
  'UPDATE',
  'DELETE',
  'APPROVE',
  'REJECT',
  'EXPORT'
]
```

#### **27 Departamentos (Roles)**
```
Gestão, Tecnologias de Informação, Recursos Humanos,
Financeiro, Jurídico, Compras, Comercial, Marketing,
Operações, Logística, Qualidade, Auditoria Interna,
Compliance, Projectos, Manutenção, Segurança Patrimonial,
Atendimento ao Cliente, Relações Públicas, Formação e Desenvolvimento,
Planeamento Estratégico, Contabilidade, Tesouraria,
Expediente e Arquivo, Comunicação Interna, Sustentabilidade,
Inovação, Expansão e Novos Negócios
```

#### **Hierarquia de Acesso**
- **Admin:** Acesso total a todos os módulos
- **Attendant:** Módulos de gestão operacional
- **User:** Módulos básicos + específicos do departamento
- **Externo:** Apenas facturas próprias

---

### **3. REGRAS DE NEGÓCIO OBRIGATÓRIAS**

#### **REGRA 1: Sistema de Estados**
Cada módulo possui fluxo de status bem definido:

```typescript
// Reclamações
Status: aberta → em_analise → em_resolucao → resolvida → fechada

// Contratos
Status: rascunho → em_aprovacao → ativo → renovacao_pendente → expirado

// Pedidos
Status: rascunho → pendente → aprovado → em_compra → entregue

// Compras
Status: requisicao → cotacao → aprovacao → ordem_compra → recebida
```

#### **REGRA 2: Logs de Auditoria**
```typescript
// Todas as ações críticas são registradas
await auditService.logAction(
  'presentation_created',  // Tipo de ação
  'info',                  // Nível
  {                        // Metadados
    numero: reclamacao.numero,
    assunto: reclamacao.assunto
  },
  {                        // Contexto
    userId: user.id,
    userEmail: user.email,
    resource: 'reclamacao',
    resourceId: reclamacao.id,
    success: true
  }
);
```

#### **REGRA 3: Permissões por Perfil**
```typescript
// Validação em todas as rotas
const permCheck = await moduleHelper.validatePermission(
  c,
  user,
  'COMPLAINTS',          // Módulo
  permissions.ACTIONS.CREATE  // Ação
);
if (!permCheck.allowed) return permCheck.response;
```

#### **REGRA 4: Autenticação Obrigatória**
```typescript
// Sem exceções - todos os endpoints protegidos
const { error: authError, user } = await validateAuth(c);
if (authError) return authError;
```

#### **REGRA 5: Imutabilidade de Dados Aprovados**
```typescript
// Validação de modificação
if (contrato.status === 'ativo') {
  return c.json({ 
    error: 'Contratos ativos requerem aditivo',
    code: 'IMMUTABLE_ACTIVE'
  }, 403);
}

if (reclamacao.status === 'fechada') {
  return c.json({ 
    error: 'Reclamações fechadas não podem ser alteradas',
    code: 'IMMUTABLE_CLOSED'
  }, 403);
}
```

#### **REGRA 6: Validação Dupla (Frontend + Backend)**
```typescript
// Backend valida todos os campos
const requiredFields = ['assunto', 'descricao', 'tipo'];
for (const field of requiredFields) {
  if (!body[field]) {
    return c.json({ 
      error: `Campo obrigatório: ${field}` 
    }, 400);
  }
}

// Frontend também valida antes de enviar
if (!data.assunto || !data.descricao) {
  toast.error('Preencha todos os campos obrigatórios');
  return;
}
```

---

### **4. NUMERAÇÃO AUTOMÁTICA**

Todos os documentos seguem padrão consistente:

```typescript
// Reclamações: REC/AAAA/MM/NNNN
// Exemplo: REC/2026/02/0001

// Contratos: CONT/AAAA/NNNN  
// Exemplo: CONT/2026/0001

// Pedidos: PED/AAAA/MM/NNNN
// Exemplo: PED/2026/02/0042

// Ordens de Compra: OC/AAAA/MM/NNNN
// Exemplo: OC/2026/02/0015

// Geração automática no backend
const ano = new Date().getFullYear();
const mes = String(new Date().getMonth() + 1).padStart(2, '0');
const existentes = await kv.getByPrefix(prefix);
const numeroSequencial = existentes.filter(
  doc => doc.numero?.startsWith(`${prefix}/${ano}/${mes}/`)
).length + 1;
const numero = `${prefix}/${ano}/${mes}/${String(numeroSequencial).padStart(4, '0')}`;
```

---

### **5. SISTEMA DE ALERTAS E NOTIFICAÇÕES**

#### **Alertas Automáticos**
```typescript
// Contratos expirando
- 30 dias antes: prioridade MÉDIA
- 15 dias antes: prioridade ALTA  
- 7 dias antes: prioridade URGENTE

// Reclamações com SLA próximo
- Urgente: alerta 6h antes
- Alta: alerta 24h antes
- Média: alerta 48h antes

// Orçamento próximo do limite
- 80% executado: alerta NORMAL
- 90% executado: alerta ALTA
- 100% executado: alerta CRÍTICO
```

#### **Notificações por Email**
```typescript
// Eventos que disparam emails
1. Reclamação criada → Email ao reclamante
2. Reclamação resolvida → Email ao reclamante
3. Contrato expirando → Email ao gestor
4. Pedido aprovado → Email ao solicitante
5. Ordem de compra emitida → Email ao fornecedor
6. Orçamento ultrapassado → Email ao responsável
```

---

### **6. CÁLCULOS AUTOMÁTICOS**

#### **Prazos e SLA**
```typescript
// Reclamações - SLA baseado em prioridade
const prazos = {
  urgente: 24,    // 24 horas
  alta: 72,       // 3 dias
  media: 168,     // 7 dias
  baixa: 336,     // 14 dias
};

// Tempo de resolução calculado automaticamente
const tempoResolucao = Math.round(
  (dataResolucao.getTime() - dataCriacao.getTime()) / (1000 * 60 * 60)
);
```

#### **Vigência de Contratos**
```typescript
// Duração em meses calculada
const dataInicio = new Date(contrato.data_inicio);
const dataFim = new Date(contrato.data_fim);
const duracaoMeses = Math.round(
  (dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 30)
);

// Dias para vencimento
const hoje = new Date();
const diasRestantes = Math.ceil(
  (dataFim.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
);
```

#### **Execução Orçamental**
```typescript
// Percentual de execução
const percentualExecucao = (realizado / orcado) * 100;

// Desvio orçamental
const desvio = realizado - orcado;
const desvioPercentual = (desvio / orcado) * 100;

// Saldo disponível
const disponivel = orcado - realizado - comprometido;
```

---

### **7. HISTÓRICO E AUDITORIA**

Todos os documentos mantêm histórico completo:

```typescript
interface Historico {
  id: string;
  data: string;
  usuario: string;
  acao: string;  // 'criacao', 'atualizacao', 'aprovacao', etc
  detalhes: string;
  valor_anterior?: any;
  valor_novo?: any;
}

// Adicionado automaticamente em todas as operações
documento.historico.push({
  id: `hist-${Date.now()}`,
  data: new Date().toISOString(),
  usuario: user.nome,
  acao: 'atualizacao',
  detalhes: 'Documento atualizado'
});
```

---

### **8. ESTATÍSTICAS E MÉTRICAS**

Cada módulo fornece estatísticas em tempo real:

```typescript
// Reclamações
interface ReclamacaoStats {
  total: number;
  abertas: number;
  resolvidas: number;
  tempo_medio_resolucao: number;  // em horas
  satisfacao_media: number;        // 1-5
  por_tipo: Record<TipoReclamacao, number>;
  por_prioridade: Record<PrioridadeReclamacao, number>;
}

// Contratos
interface ContratoStats {
  total: number;
  ativos: number;
  expirando_30_dias: number;
  valor_total_contratos_ativos: number;
  por_tipo: Record<TipoContrato, number>;
  por_status: Record<StatusContrato, number>;
}

// Pedidos
interface PedidoStats {
  total: number;
  pendentes: number;
  aprovados: number;
  valor_total_aprovados: number;
  por_tipo: Record<TipoPedido, number>;
  por_departamento: Record<string, number>;
}
```

---

### **9. ANEXOS E DOCUMENTOS**

Sistema padronizado de upload e gestão de arquivos:

```typescript
interface Anexo {
  id: string;
  nome: string;
  url: string;
  tipo: string;
  tamanho: number;
  uploaded_at: string;
  uploaded_by: string;
}

// Upload via servidor (bypassa RLS)
POST /make-server-8b82752b/storage/upload
FormData: {
  file: File,
  bucketName: string
}

// Buckets criados automaticamente
- make-8b82752b-oficios
- make-8b82752b-actas
- make-8b82752b-comunicacoes
- make-8b82752b-reclamacoes
- make-8b82752b-contratos
- make-8b82752b-pedidos
- make-8b82752b-compras
```

---

### **10. FILTROS E PESQUISA**

Todos os módulos suportam filtros avançados:

```typescript
// Interface de filtros
interface Filters {
  status?: Status;
  prioridade?: Prioridade;
  tipo?: Tipo;
  departamento?: string;
  responsavel_id?: string;
  data_inicio?: string;
  data_fim?: string;
  search?: string;
}

// Pesquisa em múltiplos campos
const filtered = items.filter(item => {
  if (search && !item.titulo.toLowerCase().includes(search.toLowerCase()) &&
      !item.numero.toLowerCase().includes(search.toLowerCase())) {
    return false;
  }
  // ... outros filtros
  return true;
});
```

---

## 🎯 REQUISITOS FUNCIONAIS

### **MÓDULO 1: RECLAMAÇÕES**

#### **RF-REC-001:** Criar Reclamação
- **Dados obrigatórios:** tipo, canal, assunto, descrição, reclamante
- **Geração automática:** número sequencial, prazo de resolução
- **Notificação:** email ao reclamante com número e prazo

#### **RF-REC-002:** Atribuir Responsável
- **Permissão:** gestor ou admin
- **Validação:** responsável deve ser do departamento
- **Mudança de status:** aberta → em_analise

#### **RF-REC-003:** Resolver Reclamação
- **Dados obrigatórios:** solução, ações tomadas
- **Cálculo automático:** tempo de resolução
- **Notificação:** email ao reclamante
- **Mudança de status:** qualquer → resolvida

#### **RF-REC-004:** Fechar Reclamação
- **Pré-requisito:** status = resolvida
- **Dados opcionais:** satisfação (1-5), comentário
- **Imutabilidade:** após fechamento, não pode ser alterada

#### **RF-REC-005:** Adicionar Ação/Comentário
- **Tipos:** comentario, atribuicao, mudanca_status, resolucao, feedback
- **Histórico:** registrado na timeline
- **Anexos:** suporte a documentos

---

### **MÓDULO 2: CONTRATOS**

#### **RF-CONT-001:** Criar Contrato
- **Dados obrigatórios:** título, tipo, contratado, datas, valor
- **Cálculo automático:** duração em meses, valor mensal
- **Geração automática:** número sequencial
- **Status inicial:** rascunho

#### **RF-CONT-002:** Aprovar Contrato
- **Permissão:** apenas quem tem APPROVE
- **Validação:** status = em_aprovacao ou rascunho
- **Mudança de status:** qualquer → ativo
- **Imutabilidade:** após ativo, requer aditivo para alteração

#### **RF-CONT-003:** Renovar Contrato
- **Dados obrigatórios:** nova_data_fim
- **Dados opcionais:** novo_valor
- **Histórico:** registro completo da renovação
- **Recálculo:** duração, valor mensal

#### **RF-CONT-004:** Cancelar Contrato
- **Dados obrigatórios:** motivo_cancelamento
- **Permissão:** apenas quem tem REJECT ou DELETE
- **Histórico:** registro do cancelamento
- **Mudança de status:** qualquer → cancelado

#### **RF-CONT-005:** Alertas de Vencimento
- **Cálculo automático:** dias para vencimento
- **Níveis de alerta:** 30d (média), 15d (alta), 7d (urgente)
- **Notificação:** email ao gestor do contrato
- **Dashboard:** banner destacado com alertas

---

### **MÓDULO 3: PEDIDOS (IT E CONSUMÍVEIS)**

#### **RF-PED-001:** Criar Pedido
- **Tipos:** IT, Consumível, Equipamento, Serviço
- **Múltiplos itens:** descrição, quantidade, unidade, especificações
- **Cálculo automático:** valor total estimado
- **Status inicial:** rascunho

#### **RF-PED-002:** Aprovar Pedido (Multinível)
- **Nível 1:** Gestor do departamento
- **Nível 2:** Financeiro (se valor > threshold)
- **Nível 3:** Compras (final)
- **Mudança de status:** pendente → aprovado

#### **RF-PED-003:** Vincular Ordem de Compra
- **Automático:** quando Compras cria OC
- **Dados vinculados:** fornecedor, prazo entrega
- **Mudança de status:** aprovado → em_compra

#### **RF-PED-004:** Registrar Recebimento
- **Dados obrigatórios:** recebido_por, data_recebimento
- **Dados opcionais:** observações sobre qualidade/quantidade
- **Mudança de status:** em_compra → entregue

---

### **MÓDULO 4: COMPRAS E CONTRATAÇÃO**

#### **RF-COMP-001:** Criar Requisição de Compra
- **Origem:** manual ou de pedido
- **Dados obrigatórios:** itens, justificativa, orçamento estimado
- **Geração automática:** número sequencial

#### **RF-COMP-002:** Processo de Cotação
- **Solicitar cotações:** múltiplos fornecedores
- **Receber propostas:** upload de documentos
- **Comparativo:** tabela de análise
- **Seleção:** fornecedor vencedor

#### **RF-COMP-003:** Emitir Ordem de Compra
- **Dados obrigatórios:** fornecedor, itens, valores, prazos
- **Geração automática:** número, PDF da OC
- **Notificação:** email ao fornecedor
- **Mudança de status:** aprovacao → ordem_compra

#### **RF-COMP-004:** Controlar Entrega
- **Rastreamento:** status da entrega
- **Confirmação:** recebimento e conferência
- **Avaliação:** fornecedor e qualidade
- **Integração:** atualizar pedido origem

---

### **MÓDULO 5: PLANEJAMENTO E GESTÃO**

#### **RF-PLAN-001:** Elaborar Orçamento
- **Períodos:** anual, trimestral, mensal
- **Categorias:** hierárquicas (categoria > subcategoria)
- **Forecast:** projeções trimestrais
- **Versões:** rascunho, enviado, aprovado

#### **RF-PLAN-002:** Acompanhar Execução
- **Cálculo automático:** percentual executado, desvios
- **Valores:** orçado, realizado, comprometido, disponível
- **Alertas:** ultrapassagem de limites (80%, 90%, 100%)
- **Dashboard:** gráficos de tendência

#### **RF-PLAN-003:** Gerar Relatórios Financeiros
- **Tipos:** balanço, DRE, fluxo de caixa, consolidado
- **Períodos:** personalizável
- **Análises:** indicadores, tendências, recomendações
- **Exportação:** PDF com gráficos

#### **RF-PLAN-004:** Gerir Contas a Pagar
- **Registro:** obrigações com fornecedores
- **Alertas:** vencimentos próximos
- **Controle:** pagamentos realizados
- **Relatórios:** aging, por categoria

#### **RF-PLAN-005:** Gerir Contas a Receber
- **Registro:** direitos de clientes
- **Alertas:** recebimentos vencidos
- **Controle:** inadimplência
- **Projeções:** fluxo de caixa futuro

---

## 📱 REQUISITOS DE INTERFACE

### **Padrões Visuais**

#### **Cards de Estatísticas**
```tsx
<Card>
  <CardContent className="pt-6">
    <div className="text-2xl font-bold text-green-600">
      {stats.ativos}
    </div>
    <p className="text-xs text-muted-foreground">
      Contratos Ativos
    </p>
  </CardContent>
</Card>
```

#### **Badges de Status**
```tsx
// Cores padronizadas
const statusColors = {
  aberta: 'bg-red-500',
  em_analise: 'bg-blue-500',
  resolvida: 'bg-green-500',
  fechada: 'bg-gray-600'
};

<Badge className={`${color} text-white`}>
  {label}
</Badge>
```

#### **Tabs de Navegação**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList>
    <TabsTrigger value="todas">
      Todas ({total})
    </TabsTrigger>
    <TabsTrigger value="abertas">
      Abertas ({abertas})
    </TabsTrigger>
  </TabsList>
</Tabs>
```

#### **Alertas Visuais**
```tsx
// Banner de alerta no topo
<Card className="border-yellow-500 bg-yellow-50">
  <CardContent className="pt-6">
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-yellow-600" />
      <div>
        <h3 className="font-semibold">
          {alertas.length} Contrato(s) Próximo(s) do Vencimento
        </h3>
        {/* Lista de alertas */}
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 🔧 REQUISITOS DE DESENVOLVIMENTO

### **Estrutura de Projeto**
```
/components/
  /[modulo]/
    - types.tsx          # Interfaces TypeScript
    - [modulo]-main.tsx  # Componente principal
    - [modulo]-form.tsx  # Formulário (opcional)
    - [modulo]-details.tsx # Detalhes (opcional)

/hooks/
  - use-[modulo].tsx     # Hook customizado

/supabase/functions/server/
  - [modulo]-routes.tsx  # Rotas backend

/utils/
  - api-client.tsx       # Cliente HTTP
  - [modulo]-helpers.tsx # Funções auxiliares
```

### **Convenções de Código**

#### **Nomenclatura**
- **Componentes:** PascalCase (`ReclamacoesMain`)
- **Hooks:** camelCase com prefixo `use` (`useReclamacoes`)
- **Types/Interfaces:** PascalCase (`Reclamacao`, `ReclamacaoStats`)
- **Constantes:** UPPER_SNAKE_CASE (`RECLAMACOES_CONFIG`)
- **Variáveis:** camelCase (`reclamacoes`, `loading`)

#### **Organização de Imports**
```typescript
// 1. Bibliotecas externas
import { useState, useCallback } from 'react';
import { Hono } from 'npm:hono@4.6.3';

// 2. Componentes UI
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';

// 3. Hooks e utils
import { useAuth } from '../auth/auth-context';
import { apiClient } from '../utils/api-client';

// 4. Types
import type { Reclamacao } from './types';
```

#### **Error Handling**
```typescript
try {
  const response = await apiClient.post('/endpoint', data);
  toast.success('Operação realizada com sucesso!');
  return response.data;
} catch (err: any) {
 console.error(' Erro na operação:', err);
  toast.error(err.message || 'Erro ao realizar operação');
  return null;
}
```

---

## 📚 DOCUMENTAÇÃO ADICIONAL

### **Links Úteis**
- [Supabase Documentation](https://supabase.com/docs)
- [Hono Documentation](https://hono.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### **Variáveis de Ambiente Necessárias**
```env
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://...
SENDGRID_API_KEY=SG...  (ou Gmail credentials)
GMAIL_USER=user@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### **Para cada novo módulo:**
- [ ] Criar types completos
- [ ] Implementar rotas backend
- [ ] Adicionar rota no index.tsx
- [ ] Criar hook customizado
- [ ] Implementar componente principal
- [ ] Adicionar rota no App.tsx
- [ ] Adicionar item no sidebar
- [ ] Testar CRUD completo
- [ ] Validar permissões
- [ ] Verificar auditoria
- [ ] Testar notificações
- [ ] Validar estatísticas
- [ ] Documentar funcionalidades

---

**Última Atualização:** 2026-02-16  
**Versão do Sistema:** 2.0  
**Módulos Documentados:** 5 (Reclamações, Contratos, Pedidos, Compras, Planejamento)  
**Status:** ✅ Documentação completa e validada
