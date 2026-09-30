-- CreateTable
CREATE TABLE "InternalPaymentOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "descricao" TEXT NOT NULL,
    "valor" REAL NOT NULL,
    "moeda" TEXT NOT NULL DEFAULT 'AOA',
    "destinatario" TEXT NOT NULL,
    "numeroDespacho" TEXT,
    "contaDebito" TEXT,
    "bancoNome" TEXT,
    "bancoIban" TEXT,
    "bancoCidade" TEXT,
    "bancoPais" TEXT,
    "paidAt" DATETIME,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InternalPaymentOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalPaymentOrder_numero_key" ON "InternalPaymentOrder"("numero");

-- CreateIndex
CREATE INDEX "InternalPaymentOrder_createdById_idx" ON "InternalPaymentOrder"("createdById");

