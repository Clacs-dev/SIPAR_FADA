-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccountPayable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT,
    "fornecedor" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "dataVencimento" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "pagoEm" DATETIME,
    "origemModulo" TEXT,
    "origemId" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountPayable_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AccountPayable" ("createdAt", "createdById", "createdByName", "data", "dataVencimento", "descricao", "fornecedor", "id", "moeda", "numero", "origemId", "origemModulo", "pagoEm", "status", "updatedAt", "valor") SELECT "createdAt", "createdById", "createdByName", "data", "dataVencimento", "descricao", "fornecedor", "id", "moeda", "numero", "origemId", "origemModulo", "pagoEm", "status", "updatedAt", "valor" FROM "AccountPayable";
DROP TABLE "AccountPayable";
ALTER TABLE "new_AccountPayable" RENAME TO "AccountPayable";
CREATE UNIQUE INDEX "AccountPayable_numero_key" ON "AccountPayable"("numero");
CREATE INDEX "AccountPayable_createdById_idx" ON "AccountPayable"("createdById");
CREATE TABLE "new_AccountReceivable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT,
    "cliente" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "dataVencimento" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "recebidoEm" DATETIME,
    "origemModulo" TEXT,
    "origemId" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccountReceivable_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AccountReceivable" ("cliente", "createdAt", "createdById", "createdByName", "data", "dataVencimento", "descricao", "id", "moeda", "numero", "origemId", "origemModulo", "recebidoEm", "status", "updatedAt", "valor") SELECT "cliente", "createdAt", "createdById", "createdByName", "data", "dataVencimento", "descricao", "id", "moeda", "numero", "origemId", "origemModulo", "recebidoEm", "status", "updatedAt", "valor" FROM "AccountReceivable";
DROP TABLE "AccountReceivable";
ALTER TABLE "new_AccountReceivable" RENAME TO "AccountReceivable";
CREATE UNIQUE INDEX "AccountReceivable_numero_key" ON "AccountReceivable"("numero");
CREATE INDEX "AccountReceivable_createdById_idx" ON "AccountReceivable"("createdById");
CREATE TABLE "new_Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT,
    "ano" INTEGER NOT NULL,
    "periodo" TEXT NOT NULL DEFAULT 'anual',
    "department" TEXT,
    "titulo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "totalOrcado" REAL NOT NULL DEFAULT 0,
    "totalComprometido" REAL NOT NULL DEFAULT 0,
    "totalRealizado" REAL NOT NULL DEFAULT 0,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Budget_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Budget" ("ano", "createdAt", "createdById", "createdByName", "data", "department", "id", "numero", "periodo", "status", "titulo", "totalComprometido", "totalOrcado", "totalRealizado", "updatedAt") SELECT "ano", "createdAt", "createdById", "createdByName", "data", "department", "id", "numero", "periodo", "status", "titulo", "totalComprometido", "totalOrcado", "totalRealizado", "updatedAt" FROM "Budget";
DROP TABLE "Budget";
ALTER TABLE "new_Budget" RENAME TO "Budget";
CREATE UNIQUE INDEX "Budget_numero_key" ON "Budget"("numero");
CREATE INDEX "Budget_createdById_idx" ON "Budget"("createdById");
CREATE TABLE "new_BudgetExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "budgetLineId" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'realizado',
    "valor" REAL NOT NULL,
    "descricao" TEXT,
    "origemModulo" TEXT,
    "origemId" TEXT,
    "dataMovimento" TEXT NOT NULL,
    "createdById" TEXT,
    "createdByName" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetExecution_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BudgetExecution_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BudgetExecution_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_BudgetExecution" ("budgetId", "budgetLineId", "createdAt", "createdById", "createdByName", "data", "dataMovimento", "descricao", "id", "origemId", "origemModulo", "tipo", "updatedAt", "valor") SELECT "budgetId", "budgetLineId", "createdAt", "createdById", "createdByName", "data", "dataMovimento", "descricao", "id", "origemId", "origemModulo", "tipo", "updatedAt", "valor" FROM "BudgetExecution";
DROP TABLE "BudgetExecution";
ALTER TABLE "new_BudgetExecution" RENAME TO "BudgetExecution";
CREATE INDEX "BudgetExecution_budgetId_idx" ON "BudgetExecution"("budgetId");
CREATE INDEX "BudgetExecution_budgetLineId_idx" ON "BudgetExecution"("budgetLineId");
CREATE INDEX "BudgetExecution_createdById_idx" ON "BudgetExecution"("createdById");
CREATE TABLE "new_FinancialReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipo" TEXT NOT NULL,
    "periodoInicio" TEXT,
    "periodoFim" TEXT,
    "department" TEXT,
    "status" TEXT NOT NULL DEFAULT 'gerado',
    "payload" TEXT NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FinancialReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_FinancialReport" ("createdAt", "createdById", "createdByName", "department", "id", "payload", "periodoFim", "periodoInicio", "status", "tipo", "updatedAt") SELECT "createdAt", "createdById", "createdByName", "department", "id", "payload", "periodoFim", "periodoInicio", "status", "tipo", "updatedAt" FROM "FinancialReport";
DROP TABLE "FinancialReport";
ALTER TABLE "new_FinancialReport" RENAME TO "FinancialReport";
CREATE INDEX "FinancialReport_createdById_idx" ON "FinancialReport"("createdById");
CREATE TABLE "new_Procurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "tipo" TEXT,
    "numero" TEXT,
    "fornecedorId" TEXT,
    "fornecedor" TEXT,
    "valor" REAL,
    "descricao" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    CONSTRAINT "Procurement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Procurement_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Procurement" ("createdAt", "createdById", "createdByName", "data", "deletedAt", "deletedById", "deletedByName", "descricao", "fornecedor", "fornecedorId", "id", "numero", "status", "tipo", "updatedAt", "valor") SELECT "createdAt", "createdById", "createdByName", "data", "deletedAt", "deletedById", "deletedByName", "descricao", "fornecedor", "fornecedorId", "id", "numero", "status", "tipo", "updatedAt", "valor" FROM "Procurement";
DROP TABLE "Procurement";
ALTER TABLE "new_Procurement" RENAME TO "Procurement";
CREATE INDEX "Procurement_createdById_idx" ON "Procurement"("createdById");
CREATE INDEX "Procurement_fornecedorId_idx" ON "Procurement"("fornecedorId");
CREATE TABLE "new_PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT,
    "procurementId" TEXT,
    "quotationId" TEXT,
    "fornecedorId" TEXT,
    "fornecedor" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "status" TEXT NOT NULL DEFAULT 'emitida',
    "prazoEntrega" TEXT,
    "localEntrega" TEXT,
    "recebidoEm" DATETIME,
    "recebidoPorId" TEXT,
    "recebidoPorNome" TEXT,
    "itens" TEXT NOT NULL DEFAULT '[]',
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "Procurement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "PurchaseQuotation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseOrder" ("anexos", "createdAt", "createdById", "createdByName", "data", "fornecedor", "fornecedorId", "id", "itens", "localEntrega", "moeda", "numero", "prazoEntrega", "procurementId", "quotationId", "recebidoEm", "recebidoPorId", "recebidoPorNome", "status", "updatedAt", "valor") SELECT "anexos", "createdAt", "createdById", "createdByName", "data", "fornecedor", "fornecedorId", "id", "itens", "localEntrega", "moeda", "numero", "prazoEntrega", "procurementId", "quotationId", "recebidoEm", "recebidoPorId", "recebidoPorNome", "status", "updatedAt", "valor" FROM "PurchaseOrder";
DROP TABLE "PurchaseOrder";
ALTER TABLE "new_PurchaseOrder" RENAME TO "PurchaseOrder";
CREATE UNIQUE INDEX "PurchaseOrder_numero_key" ON "PurchaseOrder"("numero");
CREATE INDEX "PurchaseOrder_procurementId_idx" ON "PurchaseOrder"("procurementId");
CREATE INDEX "PurchaseOrder_quotationId_idx" ON "PurchaseOrder"("quotationId");
CREATE INDEX "PurchaseOrder_fornecedorId_idx" ON "PurchaseOrder"("fornecedorId");
CREATE INDEX "PurchaseOrder_createdById_idx" ON "PurchaseOrder"("createdById");
CREATE TABLE "new_PurchaseQuotation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "procurementId" TEXT,
    "fornecedorId" TEXT,
    "fornecedor" TEXT NOT NULL,
    "email" TEXT,
    "valor" REAL NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "prazoEntrega" TEXT,
    "validade" TEXT,
    "status" TEXT NOT NULL DEFAULT 'recebida',
    "selected" BOOLEAN NOT NULL DEFAULT false,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PurchaseQuotation_procurementId_fkey" FOREIGN KEY ("procurementId") REFERENCES "Procurement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PurchaseQuotation_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "Fornecedor" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PurchaseQuotation" ("anexos", "createdAt", "data", "email", "fornecedor", "fornecedorId", "id", "moeda", "prazoEntrega", "procurementId", "selected", "status", "updatedAt", "validade", "valor") SELECT "anexos", "createdAt", "data", "email", "fornecedor", "fornecedorId", "id", "moeda", "prazoEntrega", "procurementId", "selected", "status", "updatedAt", "validade", "valor" FROM "PurchaseQuotation";
DROP TABLE "PurchaseQuotation";
ALTER TABLE "new_PurchaseQuotation" RENAME TO "PurchaseQuotation";
CREATE INDEX "PurchaseQuotation_procurementId_idx" ON "PurchaseQuotation"("procurementId");
CREATE INDEX "PurchaseQuotation_fornecedorId_idx" ON "PurchaseQuotation"("fornecedorId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Acta_createdById_idx" ON "Acta"("createdById");

-- CreateIndex
CREATE INDEX "Audience_createdById_idx" ON "Audience"("createdById");

-- CreateIndex
CREATE INDEX "Comunicacao_createdById_idx" ON "Comunicacao"("createdById");

-- CreateIndex
CREATE INDEX "Contrato_createdById_idx" ON "Contrato"("createdById");

-- CreateIndex
CREATE INDEX "Factura_createdById_idx" ON "Factura"("createdById");

-- CreateIndex
CREATE INDEX "Fornecedor_createdById_idx" ON "Fornecedor"("createdById");

-- CreateIndex
CREATE INDEX "InternalMeetingParticipant_meetingId_idx" ON "InternalMeetingParticipant"("meetingId");

-- CreateIndex
CREATE INDEX "ManutencaoViatura_createdById_idx" ON "ManutencaoViatura"("createdById");

-- CreateIndex
CREATE INDEX "Message_fromUserId_idx" ON "Message"("fromUserId");

-- CreateIndex
CREATE INDEX "Message_toUserId_idx" ON "Message"("toUserId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_email_idx" ON "Notification"("email");

-- CreateIndex
CREATE INDEX "Oficio_createdById_idx" ON "Oficio"("createdById");

-- CreateIndex
CREATE INDEX "Operador_createdById_idx" ON "Operador"("createdById");

-- CreateIndex
CREATE INDEX "Pedido_createdById_idx" ON "Pedido"("createdById");

-- CreateIndex
CREATE INDEX "PedidoViatura_createdById_idx" ON "PedidoViatura"("createdById");

-- CreateIndex
CREATE INDEX "Planejamento_createdById_idx" ON "Planejamento"("createdById");

-- CreateIndex
CREATE INDEX "Presentation_createdById_idx" ON "Presentation"("createdById");

-- CreateIndex
CREATE INDEX "ProcurementCategoria_createdById_idx" ON "ProcurementCategoria"("createdById");

-- CreateIndex
CREATE INDEX "Reclamacao_createdById_idx" ON "Reclamacao"("createdById");

-- CreateIndex
CREATE INDEX "UtilizacaoViatura_createdById_idx" ON "UtilizacaoViatura"("createdById");

-- CreateIndex
CREATE INDEX "Viatura_createdById_idx" ON "Viatura"("createdById");

