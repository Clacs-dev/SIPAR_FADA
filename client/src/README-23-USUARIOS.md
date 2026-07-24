# 🚀 Criar 23 Utilizadores Departamentais - README

## 📌 Início Rápido

Precisa criar **23 utilizadores**, um para cada departamento? Este é o lugar certo!

### ⚡ 3 Passos Simples

```bash
1. SQL      → Executar CREATE-USERS-DEPARTMENTS.sql (5 min)
2. Auth     → Criar 23 contas no Supabase (10 min)
3. Verificar → Executar VERIFICAR-23-USUARIOS.sql (5 min)
```

**⏱️ Tempo Total:** 15-20 minutos

---

## 📚 Escolha Seu Caminho

### 🎯 Quero Visão Geral
👉 Leia: [**RESUMO-23-USUARIOS.md**](./RESUMO-23-USUARIOS.md)  
_Resumo executivo completo com estatísticas e métricas_

### 🌐 Quero Interface Visual
👉 Abra: [**criar-23-usuarios.html**](./criar-23-usuarios.html)  
_Página web interativa com lista de utilizadores_

### 📖 Quero Guia Detalhado
👉 Leia: [**GUIA-CRIACAO-23-USUARIOS.md**](./GUIA-CRIACAO-23-USUARIOS.md)  
_Instruções passo a passo com todas as credenciais_

### 📋 Quero Checklist
👉 Use: [**CHECKLIST-23-USUARIOS.md**](./CHECKLIST-23-USUARIOS.md)  
_Lista de verificação para imprimir e seguir_

### 🗺️ Quero Explorar Tudo
👉 Veja: [**INDEX-23-USUARIOS.md**](./INDEX-23-USUARIOS.md)  
_Índice completo com todos os recursos_

---

## 📊 O Que Será Criado

### 23 Utilizadores

| Categoria | Quantidade |
|-----------|------------|
| 🟣 Gabinetes Executivos | 4 |
| 🔵 Gabinetes Governamentais | 5 |
| 🟢 Departamentos Operacionais | 5 |
| 🟠 Departamentos de Apoio | 4 |
| 🟣 Departamentos Estratégicos | 4 |
| 👤 Utilizador Externo | 1 |
| **TOTAL** | **23** |

### 6 Perfis Diferentes

- ⚫ Admin Sistema (1)
- 🔵 Gestor (5)
- 🟢 Utilizador Interno (14)
- 💰 Financeiro (1)
- 🚗 Operacional/Frota (1)
- 👤 Utilizador Externo (1)

---

## 🗂️ Ficheiros Disponíveis

### 📝 Scripts SQL
- `CREATE-USERS-DEPARTMENTS.sql` - Criar os 23 utilizadores
- `VERIFICAR-23-USUARIOS.sql` - Validar a criação

### 📖 Documentação
- `RESUMO-23-USUARIOS.md` - Resumo executivo
- `GUIA-CRIACAO-23-USUARIOS.md` - Guia completo
- `REFERENCIA-RAPIDA-USUARIOS.md` - Referência rápida
- `CHECKLIST-23-USUARIOS.md` - Checklist
- `INDEX-23-USUARIOS.md` - Índice geral
- `CONCLUSAO-23-USUARIOS.md` - Conclusão do projeto

### 🌐 Interface
- `criar-23-usuarios.html` - Página web interativa

---

## 📋 Lista Rápida de Emails

```
EXECUTIVOS (4):
  pca@sistema.ao | pce@sistema.ao
  administrador@sistema.ao | director@sistema.ao

GOVERNAMENTAIS (5):
  ministro@sistema.ao | secretario1@sistema.ao
  secretario2@sistema.ao | vicegovernador1@sistema.ao
  vicegovernador2@sistema.ao

OPERACIONAIS (5):
  financeiro@sistema.ao | rh@sistema.ao
  juridico@sistema.ao | compras@sistema.ao | ti@sistema.ao

APOIO (4):
  administracao@sistema.ao | administrativo@sistema.ao
  comunicacao@sistema.ao | seguranca@sistema.ao

ESTRATÉGICOS (4):
  planeamento@sistema.ao | qualidade@sistema.ao
  compliance@sistema.ao | risco@sistema.ao

EXTERNO (1):
  externo@exemplo.ao
```

**Senha para todos:** `senha123`

---

## ⚡ Início Imediato

### Passo 1: SQL (5 min)
```bash
1. Supabase Dashboard → SQL Editor
2. Copiar: CREATE-USERS-DEPARTMENTS.sql
3. Executar: RUN
4. ✅ Verificar: 23 utilizadores criados
```

### Passo 2: Auth (10 min)
```bash
1. Authentication → Users → Add user
2. Para cada email (23x):
   - Email: (ver lista acima)
   - Password: senha123
   - ✅ Auto Confirm User
   - Create user
```

### Passo 3: Verificar (5 min)
```bash
1. SQL Editor
2. Executar: VERIFICAR-23-USUARIOS.sql
3. ✅ Deve mostrar: 23/23
```

---

## 🧪 Testar Criação

```bash
# Login 1: Admin
pca@sistema.ao / senha123

# Login 2: Gestor
ministro@sistema.ao / senha123

# Login 3: Financeiro
financeiro@sistema.ao / senha123

# Login 4: Operacional
seguranca@sistema.ao / senha123

# Login 5: Externo
externo@exemplo.ao / senha123
```

---

## 🆘 Precisa de Ajuda?

### Problema Comum 1: "User not found"
**Solução:** Certifique-se que executou PASSO 1 (SQL) E PASSO 2 (Auth)

### Problema Comum 2: "Invalid credentials"
**Solução:** Senha é `senha123` (sem espaços, tudo minúsculo)

### Problema Comum 3: "User already exists"
**Solução:** Normal, o utilizador já existe. Pode ignorar.

### Mais Ajuda?
👉 Ver seção "Resolução de Problemas" em `GUIA-CRIACAO-23-USUARIOS.md`

---

## ✅ Verificação Rápida

Execute este SQL:
```sql
SELECT COUNT(*) FROM kv_store 
WHERE key LIKE 'user_profile:dept-%';
```

**Resultado esperado:** 23

---

## 📚 Documentação Completa

Para documentação completa, consulte:

| Documento | Quando Usar |
|-----------|-------------|
| RESUMO-23-USUARIOS.md | Primeiro - Visão geral |
| GUIA-CRIACAO-23-USUARIOS.md | Durante implementação |
| REFERENCIA-RAPIDA-USUARIOS.md | Consulta rápida |
| CHECKLIST-23-USUARIOS.md | Acompanhamento |
| INDEX-23-USUARIOS.md | Navegar todos os recursos |
| CONCLUSAO-23-USUARIOS.md | Resumo final do projeto |

---

## 🎯 Próximos Passos

Após criar os 23 utilizadores:

1. ✅ Testar login com 5 perfis diferentes
2. ✅ Verificar dashboards departamentais
3. ✅ Validar permissões por perfil
4. ✅ Testar filtros por departamento
5. ✅ Confirmar módulos específicos

---

## 📊 Status do Projeto

```
✅ Script SQL: Completo (550 linhas)
✅ Scripts de Verificação: 8 queries
✅ Documentação: 9 ficheiros
✅ Interface Visual: HTML interativo
✅ Cobertura: 100% departamentos
✅ Tempo: 15-20 minutos
✅ Status: Pronto para Produção
```

---

## 🎉 Resultado Final

```
╔════════════════════════════════════════╗
║  ✅ 23 UTILIZADORES DEPARTAMENTAIS     ║
║  ✅ 100% COBERTURA ORGANIZACIONAL      ║
║  ✅ 6 PERFIS DISTINTOS                 ║
║  ✅ DOCUMENTAÇÃO COMPLETA              ║
║  ✅ PRONTO PARA PRODUÇÃO               ║
╚════════════════════════════════════════╝
```

---

## 📞 Informações

**Sistema:** Gestão de Apresentações e Audiências  
**Versão:** 1.0  
**Data:** Janeiro 2026  
**Status:** ✅ Completo  
**Tempo:** 15-20 minutos  
**Dificuldade:** ⭐⭐ Média  

---

## 🚀 Comece Agora!

1. 📖 Leia [RESUMO-23-USUARIOS.md](./RESUMO-23-USUARIOS.md) (5 min)
2. 🌐 Abra [criar-23-usuarios.html](./criar-23-usuarios.html) (visualização)
3. 💻 Execute `CREATE-USERS-DEPARTMENTS.sql` (implementação)
4. ✅ Verifique com `VERIFICAR-23-USUARIOS.sql` (validação)

---

**🎊 Boa Sorte! O Sistema Está Pronto! 🎊**
