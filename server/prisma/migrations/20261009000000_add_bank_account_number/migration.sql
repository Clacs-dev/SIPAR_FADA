-- Numero de conta bancaria (alem do IBAN/NIB) no utilizador e na Ordem de Pagamento Interna.
ALTER TABLE "User" ADD COLUMN "bankAccountNumber" TEXT;
ALTER TABLE "InternalPaymentOrder" ADD COLUMN "bancoNumeroConta" TEXT;
