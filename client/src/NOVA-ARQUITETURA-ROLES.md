# 🎯 NOVA ARQUITETURA DE ROLES POR DEPARTAMENTO

## 📊 SITUAÇÃO ATUAL

### ❌ ANTES (Sistema Antigo):
```typescript
// 3 roles fixos
type Role = 'admin' | 'attendant' | 'user';

// Estrutura do utilizador
{
  "role": "user",  // ← Apenas 3 opções
  "profiles": ["utilizador_interno"],
  "department": "financeiro"
}
```

---

## ✅ DEPOIS (Sistema Novo):

### 🔄 Role = Departamento
```typescript
// 22 roles (um para cada departamento)
type Role = 
  // Gabinetes Executivos
  | 'gabinete_pca'
  | 'gabinete_pce'
  | 'gabinete_administrador'
  | 'gabinete_director'
  
  // Gabinetes Governamentais
  | 'gabinete_ministro'
  | 'gabinete_secretario_estado_1'
  | 'gabinete_secretario_estado_2'
  | 'gabinete_vice_governador_1'
  | 'gabinete_vice_governador_2'
  
  // Operacionais
  | 'financeiro'
  | 'recursos_humanos'
  | 'juridico'
  | 'compras'
  | 'tecnologia_informacao'
  
  // Apoio
  | 'administracao'
  | 'administrativo'
  | 'comunicacao_imagem'
  | 'seguranca'
  
  // Estratégicos
  | 'planeamento'
  | 'organizacao_qualidade'
  | 'compliance'
  | 'risco';

// Estrutura do utilizador
{
  "role": "financeiro",  // ← Agora = department
  "profiles": ["utilizador_interno"],
  "department": "financeiro"
}
```

---

## 📋 LISTA COMPLETA DOS 22 DEPARTAMENTOS/ROLES

### 🔷 GABINETES EXECUTIVOS (4)
1. **gabinete_pca** - Gabinete do PCA
2. **gabinete_pce** - Gabinete do PCE
3. **gabinete_administrador** - Gabinete do Administrador
4. **gabinete_director** - Gabinete do Director

### 🔵 GABINETES GOVERNAMENTAIS (5)
5. **gabinete_ministro** - Gabinete do Ministro
6. **gabinete_secretario_estado_1** - Gabinete do Secretário de Estado 1
7. **gabinete_secretario_estado_2** - Gabinete do Secretário de Estado 2
8. **gabinete_vice_governador_1** - Gabinete do Vice-Governador 1
9. **gabinete_vice_governador_2** - Gabinete do Vice-Governador 2

### 🟢 DEPARTAMENTOS OPERACIONAIS (5)
10. **financeiro** - Financeiro
11. **recursos_humanos** - Recursos Humanos
12. **juridico** - Jurídico
13. **compras** - Compras
14. **tecnologia_informacao** - Tecnologia e Informação

### 🟠 DEPARTAMENTOS DE APOIO (4)
15. **administracao** - Administração
16. **administrativo** - Administrativo
17. **comunicacao_imagem** - Comunicação e Imagem
18. **seguranca** - Segurança

### 🟣 DEPARTAMENTOS ESTRATÉGICOS (4)
19. **planeamento** - Planeamento
20. **organizacao_qualidade** - Organização e Qualidade
21. **compliance** - Compliance
22. **risco** - Risco

**TOTAL: 22 DEPARTAMENTOS**

---

## 🔄 MIGRAÇÃO DOS 8 UTILIZADORES EXISTENTES

### Mapeamento: Role Antigo → Role Novo

| Email | Nome | Role Antigo | Department | Role Novo |
|-------|------|-------------|------------|-----------|
| admin@sistema.com | Administrador | **admin** | Administração | **administracao** |
| atendente@sistema.com | Maria Atendente | **attendant** | Secretaria | ⚠️ **PROBLEMA** |
| usuario@empresa.com | João Usuário | **user** | Externo | ⚠️ **PROBLEMA** |
| gerente@sistema.ao | João Gerente | **admin** | Gestão | ⚠️ **PROBLEMA** |
| financeiro@sistema.ao | Maria Financeira | **attendant** | Financeiro | **financeiro** |
| operador@sistema.ao | Carlos Operador | **attendant** | Operações | ⚠️ **PROBLEMA** |

### ⚠️ PROBLEMAS IDENTIFICADOS:

#### 1. **Secretaria** não existe na lista de 22 departamentos
- Utilizador: `atendente@sistema.com`
- Department atual: "Secretaria"
- ❓ **Mapear para qual departamento?**
  - [ ] `administracao`
  - [ ] `administrativo`
  - [ ] Criar novo: `secretaria`

#### 2. **Externo** não existe na lista
- Utilizador: `usuario@empresa.com`
- Department atual: "Externo"
- ❓ **Mapear para qual?**
  - [ ] Criar role especial: `externo`
  - [ ] Usar `administrativo`

#### 3. **Gestão** não existe na lista
- Utilizador: `gerente@sistema.ao`
- Department atual: "Gestão"
- ❓ **Mapear para qual?**
  - [ ] `gabinete_pca`
  - [ ] `gabinete_administrador`
  - [ ] `administracao`

#### 4. **Operações** não existe na lista
- Utilizador: `operador@sistema.ao`
- Department atual: "Operações"
- ❓ **Mapear para qual?**
  - [ ] Criar novo: `operacoes`
  - [ ] Usar um dos operacionais existentes

---

## 🎯 DECISÕES NECESSÁRIAS

### Opção A: Adicionar 4 novos departamentos (TOTAL: 26)
```typescript
// Adicionar:
'secretaria'         // Para atendentes
'externo'           // Para utilizadores externos
'gestao'            // Para gerentes
'operacoes'         // Para operadores
```

### Opção B: Mapear para departamentos existentes
```typescript
// Mapeamento:
Secretaria → 'administracao'
Externo → 'externo' (novo, especial)
Gestão → 'gabinete_administrador'
Operações → 'administracao'
```

### Opção C: Criar categorias especiais
```typescript
// Mantém os 22 + adiciona especiais:
'admin_geral'       // Administradores gerais
'externo'          // Utilizadores externos
```

---

## 🔍 QUAL OPÇÃO VOCÊ PREFERE?

**Por favor, decida:**

1. **Secretaria** (atendente@sistema.com):
   - [ ] Adicionar `secretaria` aos 22 departamentos
   - [ ] Mapear para `administracao`
   - [ ] Mapear para `administrativo`
   - [ ] Outro: __________

2. **Externo** (usuario@empresa.com):
   - [ ] Adicionar `externo` aos 22 departamentos
   - [ ] Mapear para `administrativo`
   - [ ] Manter sistema especial para externos
   - [ ] Outro: __________

3. **Gestão** (gerente@sistema.ao):
   - [ ] Adicionar `gestao` aos 22 departamentos
   - [ ] Mapear para `gabinete_administrador`
   - [ ] Mapear para `administracao`
   - [ ] Outro: __________

4. **Operações** (operador@sistema.ao):
   - [ ] Adicionar `operacoes` aos 22 departamentos
   - [ ] Mapear para `administracao`
   - [ ] Mapear para um operacional existente
   - [ ] Outro: __________

5. **João Ferreira** (compras@sistema.com) - NOVO:
   - ✅ Já existe: `compras`
   - Role novo: `compras`

6. **Carlos Silva** (motorista@sistema.com) - NOVO:
   - ⚠️ Não existe departamento para motorista
   - [ ] Adicionar `operacional_frota`
   - [ ] Mapear para `administracao`
   - [ ] Outro: __________

---

## 💡 MINHA RECOMENDAÇÃO

Adicionar **4 novos departamentos** aos 22 existentes = **TOTAL: 26**

```typescript
// Departamentos Operacionais +2
'compras',              // ← Já existe
'operacoes',            // ← NOVO
'operacional_frota',    // ← NOVO (para motoristas)

// Departamentos de Apoio +2
'secretaria',           // ← NOVO (para atendentes)
'gestao',              // ← NOVO (para gerentes)

// Especial
'externo'              // ← NOVO (para utilizadores externos)
```

**Total final: 26 departamentos/roles**

---

## ✅ AGUARDANDO SUA DECISÃO

**Me confirme:**
1. Quantos departamentos finais? (22, 26, ou outro número)
2. Como mapear cada um dos 4 problemáticos?
3. Depois eu implemento tudo de uma vez!

**Aguardando sua resposta...** 🎯
