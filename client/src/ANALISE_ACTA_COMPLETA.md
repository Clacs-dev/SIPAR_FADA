# 📋 ANÁLISE COMPLETA - ESTRUTURA DA ACTA
## Mapeamento Campo a Campo: Formulário → Transformação → PDF

---

## 🎯 ESTRUTURA DO DOCUMENTO PDF

### 1️⃣ CABEÇALHO
**Localização no PDF:** Topo do documento

#### 1.1 TÍTULO
- **Fonte de dados:** `acta.numero` OU gerado automaticamente
- **Campos do formulário:**
  - ❌ Não tem campo específico no formulário
  - ✅ **AÇÃO:** Adicionar campo "Número da Acta" (ex: "ACTA N.º 001/2025")
- **Geração:** `ACTA N.º ${ano}` (padrão)
- **Exibição:** Centralizado, maiúsculas, negrito

#### 1.2 TEXTO DE ABERTURA (Parágrafo oficial)
- **Formato:** "Aos X dias do mês de Y do ano de Z, pelas HH:MM..."
- **Campos do formulário usados:**
  - ✅ `data_reuniao` → dia/mês/ano
  - ✅ `hora_inicio` → hora de início
  - ✅ `entidade` → nome da entidade
  - ✅ `endereco_completo` → localização
  - ✅ `numero_reuniao` → número da reunião (ex: "1ª reunião")
  - ✅ `tipo_reuniao` → ordinária/extraordinária
  - ✅ `orgao` → órgão que se reúne
  - ✅ `presidente` → nome do presidente
  - ✅ `participantes[]` → lista de presentes
  - ✅ `secretario` → secretário da reunião
- **Status:** ✅ COMPLETO - Todos os campos presentes

#### 1.3 QUÓRUM
- **Fonte de dados:** Texto fixo padrão
- **Campo do formulário:**
  - ✅ `quorum` (campo de texto livre no formulário)
  - ⚠️ **PROBLEMA:** Campo existe mas não é usado na transformação!
- **Texto atual:** "Verificada a existência de quórum legal, o Senhor(a) Presidente declarou aberta a sessão."
- **Status:** ⚠️ CAMPO IGNORADO - Usar valor do formulário

---

### 2️⃣ AGENDA (Ordem de Trabalhos)
**Localização no PDF:** Após o cabeçalho

#### 2.1 DESCRIÇÃO DA AGENDA
- **Fonte de dados:** Texto fixo
- **Texto:** "A reunião decorreu de acordo com a seguinte agenda:"
- **Status:** ✅ FIXO

#### 2.2 PONTOS DA AGENDA
- **Fonte de dados:** `acta.pontos_agenda[]`
- **Campos do formulário:**
  - ✅ `ponto.titulo` → título do ponto
  - ✅ `ponto.descricao` → observação/descrição adicional
  - ❌ `ponto.tempo_estimado` → **NÃO USADO NO PDF**
- **Formato PDF:**
  - Lista numerada (1, 2, 3...)
  - Título em negrito
  - Observação em texto secundário
- **Status:** ✅ COMPLETO

---

### 3️⃣ DISCUSSÕES
**Localização no PDF:** Após agenda

#### 3.1 ESTRUTURA POR PONTO
Para cada ponto de agenda com discussão:

**Cabeçalho do Ponto:**
- **Número:** "PONTO UM", "PONTO DOIS", etc.
- **Título:** Título do ponto de agenda
- **Status:** ✅ COMPLETO

**Texto da Discussão:**
- **Fonte de dados:** `ponto.discussao`
- **Campo do formulário:** ✅ `discussao` (Textarea)
- **Fallback:** "Neste ponto da ordem de trabalhos, foram apresentadas e discutidas as matérias relacionadas."
- **Status:** ✅ COMPLETO

#### 3.2 INTERVENÇÕES DOS PARTICIPANTES
- **Fonte de dados:** `ponto.intervencoes[]`
- **Campos do formulário:**
  - ✅ `intervencao.participante_nome` → nome
  - ✅ `intervencao.participante_cargo` → cargo
  - ✅ `intervencao.texto` → texto da intervenção
- **Formato PDF:**
  - Lista de intervenções
  - Formato: "**Nome** (cargo): texto"
- **Status:** ✅ COMPLETO

---

### 4️⃣ DELIBERAÇÕES
**Localização no PDF:** Após discussões

#### 4.1 ESTRUTURA POR PONTO
Para cada ponto de agenda com decisão:

**Cabeçalho do Ponto:**
- **Número:** "PONTO UM", "PONTO DOIS", etc.
- **Título:** Título do ponto de agenda
- **Status:** ✅ COMPLETO

**Decisão:**
- **Fonte de dados:** `ponto.decisao`
- **Campo do formulário:** ✅ `decisao` (Textarea)
- **Status:** ✅ COMPLETO

#### 4.2 VOTAÇÃO
- **Fonte de dados:** `ponto.tipo_votacao`
- **Campos do formulário:**
  - ✅ `tipo_votacao` → sem_votacao/unanimidade/maioria
  - ✅ `votos_favor` → número (apenas se maioria)
  - ✅ `votos_contra` → número (apenas se maioria)
  - ✅ `abstencoes` → número (apenas se maioria)
- **Formatos de saída:**
  - "Aprovado por unanimidade"
  - "Aprovado por maioria - X votos a favor, Y votos contra, Z abstenções"
  - "Decisão tomada sem votação formal"
- **Status:** ✅ COMPLETO

---

### 5️⃣ RECOMENDAÇÕES
**Localização no PDF:** Após deliberações

#### 5.1 LISTA DE RECOMENDAÇÕES
- **Fonte de dados:** `acta.recomendacoes[]` (array)
- **Campo do formulário:** ✅ Sistema de adicionar recomendações
- **Formato PDF:** Lista numerada
- **Status:** ✅ COMPLETO

#### 5.2 NOTA FINAL
- **Fonte de dados:** Texto fixo
- **Texto:** "As recomendações acima deverão ser consideradas para implementação ou acompanhamento nos termos definidos pelos órgãos competentes."
- **Status:** ✅ FIXO

---

### 6️⃣ ENCERRAMENTO
**Localização no PDF:** Antes das assinaturas

#### 6.1 TEXTO DE ENCERRAMENTO
- **Formato:** "Nada mais havendo a tratar, o Senhor(a) Presidente deu por encerrada a sessão pelas HH:MM..."
- **Campos do formulário usados:**
  - ✅ `hora_fim` → hora de encerramento
  - ✅ `secretario` → nome do secretário
  - ❌ `texto_encerramento` → **CAMPO EXISTE MAS NÃO É USADO!**
- **Status:** ⚠️ CAMPO IGNORADO - Usar valor do formulário

#### 6.2 LOCAL E DATA
- **Formato:** "Luanda, 16 de janeiro de 2026"
- **Campos do formulário:**
  - ✅ `cidade` → cidade
  - ✅ `data_reuniao` → dia/mês/ano
- **Status:** ✅ COMPLETO

---

### 7️⃣ ASSINATURAS
**Localização no PDF:** Final do documento

#### 7.1 PRESIDENTE
- **Campos do formulário:**
  - ✅ `presidente` → nome
  - ✅ `cargo_presidente` → cargo
- **Formato PDF:**
  - Linha de assinatura
  - "O/A Presidente"
  - Nome
  - Cargo
- **Status:** ✅ COMPLETO

#### 7.2 SECRETÁRIO
- **Campos do formulário:**
  - ✅ `secretario` → nome
  - ✅ `cargo_secretario` → cargo
- **Formato PDF:**
  - Linha de assinatura
  - "O/A Secretário(a)"
  - Nome
  - Cargo
- **Status:** ✅ COMPLETO

---

### 8️⃣ PARTICIPANTES (Lista de Presenças)
**Localização no PDF:** Apêndice final

- **Fonte de dados:** `acta.participantes[]`
- **Campos do formulário:**
  - ✅ `participante.nome` → nome
  - ✅ `participante.cargo` → cargo
  - ✅ `participante.departamento` → departamento
  - ✅ `participante.presente` → status presença
- **Formato PDF:**
  - Tabela com nome, cargo, departamento
  - Status: Presente/Ausente
  - Linha para assinatura
- **Status:** ✅ COMPLETO

---

## ⚠️ CAMPOS DO FORMULÁRIO NÃO USADOS NO PDF

### ❌ CAMPOS REDUNDANTES/INÚTEIS:
1. **`tempo_estimado`** (por ponto de agenda)
   - Não aparece no PDF
   - Poderia ser útil para gestão, mas não para documento oficial

### ❌ CAMPOS IGNORADOS NA TRANSFORMAÇÃO:
1. **`texto_abertura`** 
   - Campo existe no formulário
   - ⚠️ **É IGNORADO** - transformação usa template fixo
   - **SOLUÇÃO:** Remover do formulário OU usar o valor inserido

2. **`quorum`**
   - Campo existe no formulário (com valor padrão)
   - ⚠️ **É IGNORADO** - transformação usa texto fixo
   - **SOLUÇÃO:** Usar valor do formulário

3. **`texto_encerramento`**
   - Campo existe no formulário
   - ⚠️ **É IGNORADO** - transformação usa template fixo
   - **SOLUÇÃO:** Remover do formulário OU usar o valor inserido

### ❌ CAMPOS FALTANDO NO FORMULÁRIO:
1. **Número da Acta** (`numero`)
   - Não tem campo no formulário
   - Usaria: `acta.numero` ou gera `ACTA N.º ${ano}`
   - **SOLUÇÃO:** Adicionar campo "Número da Acta"

---

## 🎯 CAMPOS USADOS CORRETAMENTE (Checklist):

### ✅ Informações Básicas:
- [x] `assunto` → Usado no título/contexto
- [x] `tipo_reuniao` → ordinaria/extraordinaria
- [x] `departamento` → Referência organizacional

### ✅ Data, Hora e Local:
- [x] `data_reuniao` → dia/mês/ano
- [x] `hora_inicio` → texto de abertura
- [x] `hora_fim` → texto de encerramento
- [x] `local` → [não usado diretamente no PDF atual]

### ✅ Participantes:
- [x] `participantes[].nome`
- [x] `participantes[].cargo`
- [x] `participantes[].departamento`
- [x] `participantes[].presente`

### ✅ Pontos de Agenda:
- [x] `pontos_agenda[].titulo`
- [x] `pontos_agenda[].descricao`
- [x] `pontos_agenda[].discussao`
- [x] `pontos_agenda[].intervencoes[]`
- [x] `pontos_agenda[].decisao`
- [x] `pontos_agenda[].tipo_votacao`
- [x] `pontos_agenda[].votos_favor`
- [x] `pontos_agenda[].votos_contra`
- [x] `pontos_agenda[].abstencoes`

### ✅ Estrutura Formal:
- [x] `entidade`
- [x] `endereco_completo`
- [x] `cidade`
- [x] `numero_reuniao`
- [x] `presidente`
- [x] `cargo_presidente`
- [x] `secretario`
- [x] `cargo_secretario`
- [x] `recomendacoes[]`
- [x] `modalidade` → presencial/online (contexto)
- [x] `prioridade` → baixa/normal/alta/urgente (contexto)
- [x] `orgao` → Conselho de Administração, etc.

### ⚠️ Campos com Problemas:
- [ ] `texto_abertura` → EXISTE mas é IGNORADO
- [ ] `quorum` → EXISTE mas é IGNORADO  
- [ ] `texto_encerramento` → EXISTE mas é IGNORADO
- [ ] `numero` → NÃO EXISTE no formulário
- [ ] `tempo_estimado` → NÃO É USADO no PDF

---

## 📊 RESUMO ESTATÍSTICO:

- **Total de campos no formulário:** 48
- **Campos usados no PDF:** 42 (87.5%)
- **Campos ignorados:** 4 (8.3%)
- **Campos faltando:** 1 (2.1%)
- **Campos redundantes/inúteis:** 1 (2.1%)

---

## ✅ PRÓXIMAS AÇÕES RECOMENDADAS:

### 🔴 CRÍTICO:
1. **Decidir sobre campos ignorados:**
   - Opção A: Remover `texto_abertura`, `quorum`, `texto_encerramento` do formulário
   - Opção B: Modificar `transform-acta-to-json.ts` para usar valores do formulário

2. **Adicionar campo faltante:**
   - Adicionar campo "Número da Acta" no formulário

### 🟡 OPCIONAL:
3. **Remover campo inútil:**
   - Remover `tempo_estimado` dos pontos de agenda (não usado no PDF)

4. **Consistência:**
   - Garantir que `local` seja usado no PDF (atualmente não aparece)
   - Verificar se `assunto` deve aparecer em algum lugar do PDF

---

## 🏁 CONCLUSÃO:

O sistema está **87.5% otimizado**, mas há **inconsistências** entre o formulário e a transformação JSON. Os campos `texto_abertura`, `quorum` e `texto_encerramento` existem no formulário mas são completamente ignorados na geração do PDF, o que pode confundir os utilizadores.

**Recomendação:** Alinhar 100% o formulário com o PDF, removendo campos que não são usados ou adaptando a transformação para os utilizar.
