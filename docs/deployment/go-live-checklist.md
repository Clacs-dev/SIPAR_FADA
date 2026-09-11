# Checklist de Go-Live — SIPAR-FADA

Cada item: **Status** (✅/🟡/❌) · **Responsável** · **Evidência** · **Observação**. Preencher
antes de declarar a instalação pronta para uso real pelos utilizadores finais.

| Área | Item | Status | Responsável | Evidência | Observação |
|---|---|---|---|---|---|
| Infraestrutura | Servidor a correr de forma estável, com supervisão de processo | | TI FADA | | Ver `installation-checklist.md` |
| Infraestrutura | Endereço do servidor definitivo, estável, não sujeito a mudar | | TI FADA | | Trocar depois de distribuído exige reinstalar todos os PCs |
| Segurança | Segredos rodados (não os de exemplo) | | Desenvolvedor/TI FADA | | |
| Segurança | Contas de demonstração desativadas | | TI FADA | | |
| Segurança | RBAC validado com pelo menos 2 perfis reais | | Admin Sistema | | |
| Banco | Migrações aplicadas, sem erros | | Desenvolvedor/TI FADA | | |
| Banco | Backup testado (criar + descarregar) | | Admin Sistema | | Restauro ainda não testado — ver `operations/backup-recovery.md` |
| Backend | Health check real (200, não 503) | | TI FADA | | |
| Backend | `dist/` gerado a partir do código atual (`prestart`) | | TI FADA | | |
| Tauri | Instalador gerado com endereço de servidor correto | | Desenvolvedor | | |
| Tauri | Instalado e testado em pelo menos 1 PC real | | TI FADA | | |
| Rede | Todos os PCs alcançam a API | | TI FADA | | |
| Rede | Nenhum PC tem acesso direto à base de dados | | TI FADA | | |
| RBAC | Menus corretos por perfil confirmados | | Admin Sistema | | |
| Licença | Ativada, estado `ACTIVE` | | Admin Sistema | | |
| Backup | Testado | | Admin Sistema | | |
| Logs | A serem escritos, sem erros inesperados no arranque | | TI FADA | | Sem rotação configurada — monitorizar tamanho |
| Auditoria | `AuditLog` a registar eventos de teste (login, criação de registo) | | Admin Sistema | | |
| Utilizadores | Primeiro `admin_sistema` criado e testado | | TI FADA | | |
| Módulos | Um fluxo de negócio completo testado ponta-a-ponta (ex.: criar → aprovar → eliminar uma factura de teste) | | Admin Sistema | | |
| Performance | ⚠️ Sem paginação nas listagens principais — aceitável só com dezenas de registos | | Desenvolvedor | | Ver `known-issues.md` |
| Recuperação | Procedimento de restauro documentado, ainda não testado em produção | | TI FADA | | Testar antes de depender dele |
