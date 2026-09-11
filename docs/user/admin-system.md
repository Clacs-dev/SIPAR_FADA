# Manual do Administrador do Sistema

> Para a implementação técnica por trás de cada ecrã aqui descrito, ver
> [`../developer/admin-system.md`](../developer/admin-system.md).

## Administrador do Sistema vs. administradores de negócio

Estes são **dois papéis diferentes** no SIPAR-FADA, não confundir:

- **Administrador do Sistema** (`admin_sistema`): um papel técnico, exclusivo, que gere a
  aplicação em si — utilizadores, departamentos, roles, licença, backups, diagnóstico. Não é um
  departamento de negócio.
- **Administradores/responsáveis de negócio** (ex.: PCA, PCE, gestores de departamento): gerem
  os seus próprios módulos de negócio (aprovar facturas, actas, etc.), sem acesso aos ecrãs
  técnicos acima.

Uma pessoa pode ter só um destes papéis, nunca os dois em simultâneo (o `role` de um utilizador
é um valor único).

## Gestão de Utilizadores

Criar, editar, desativar contas. **Desativar** (não "eliminar") é a operação real — a conta fica
inacessível, mas o histórico associado (registos criados, assinaturas, auditoria) mantém-se
intacto. Pode reativar uma conta a qualquer momento.

Ao criar um utilizador, atribua o `role` correto (= o departamento a que pertence — ver
[`../developer/authorization-rbac.md`](../developer/authorization-rbac.md) para a lista
completa) e, se aplicável, o departamento formal e posição.

## Departamentos, Áreas e Roles

- **Departamentos**: a lista organizacional real. Eliminar um departamento só é possível se não
  tiver utilizadores associados — move-se para a Lixeira.
- **Áreas**: subdivisões dentro de um departamento.
- **Roles e Permissões**: a matriz que decide o que cada `role` pode fazer nos módulos de
  negócio. ⚠️ **Esta matriz não controla tudo** — os próprios ecrãs administrativos (Utilizadores,
  Departamentos, Roles, Auditoria, Base de Dados, Definições, E-mail) são geridos só pelo
  `admin_sistema`, independentemente do que estiver marcado aqui; a UI avisa disto explicitamente
  quando aplicável. O role `admin_sistema` não pode ser editado nesta matriz (proteção contra
  autobloqueio).

## Auditoria

`Auditoria & Segurança` — regista eventos relevantes (login, alterações de permissões, ações
sobre licença, eliminações) com quem, quando, e o quê. Use para investigar atividade suspeita ou
confirmar quem fez uma alteração específica.

## Diagnóstico do Sistema

Mostra o estado real de cada componente (base de dados, e-mail, push, integrações de reunião,
storage, filas), com verificações que correm de facto contra o sistema — não valores fixos. Se
um componente aparecer como falhado aqui, é um problema real a investigar, não um alarme falso.

## Modo de Manutenção

Bloqueia o acesso a todos os utilizadores exceto o Administrador do Sistema, que nunca fica
trancado fora. Use antes de uma manutenção planeada (ex.: restaurar uma cópia de segurança).

## Cópias de Segurança

Cria uma cópia local da base de dados, com as 30 mais recentes mantidas automaticamente. **Isto
não substitui uma cópia fora do servidor** — descarregue periodicamente as cópias importantes
para um local externo (disco externo, rede, armazenamento próprio para backup). Ver
[`../operations/backup-recovery.md`](../operations/backup-recovery.md).

## Licença

Ativação, renovação e estado da licença do sistema — ver
[`../deployment/licensing.md`](../deployment/licensing.md) para o procedimento completo.

## Sessões

Não existe hoje um ecrã que liste sessões ativas por utilizador individualmente — a forma de
cortar o acesso de alguém é desativar a conta (ver Gestão de Utilizadores acima), o que invalida
imediatamente qualquer sessão dessa pessoa.
