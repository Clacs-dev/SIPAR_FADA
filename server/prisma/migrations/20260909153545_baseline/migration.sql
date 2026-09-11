-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "organization" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "departmentId" TEXT,
    "areaId" TEXT,
    "position" TEXT,
    "address" TEXT,
    "document" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME,
    "bankName" TEXT,
    "bankAccountHolder" TEXT,
    "bankIban" TEXT,
    "bankNib" TEXT,
    "bankSwift" TEXT,
    "bankCity" TEXT,
    "bankCountry" TEXT,
    "signatureImage" TEXT,
    CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "categoria" TEXT,
    "descricao" TEXT,
    "cor" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "sistema" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "descricao" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    CONSTRAINT "Area_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InternalMeeting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizerId" TEXT NOT NULL,
    "participantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "meetingDate" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "meetingType" TEXT NOT NULL,
    "location" TEXT,
    "platform" TEXT,
    "meetingLink" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "tipoReuniao" TEXT NOT NULL DEFAULT 'ordinaria',
    "orgao" TEXT,
    "pontosAgenda" TEXT NOT NULL DEFAULT '[]',
    "roomId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InternalMeeting_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InternalMeeting_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InternalMeeting_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "MeetingRoom" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MeetingRoom" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "capacidade" INTEGER NOT NULL DEFAULT 0,
    "localizacao" TEXT,
    "recursos" TEXT NOT NULL DEFAULT '[]',
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InternalMeetingParticipant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT,
    "cargo" TEXT,
    "department" TEXT,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InternalMeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "InternalMeeting" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InternalMeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Presentation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "company" TEXT,
    "nif" TEXT,
    "purpose" TEXT,
    "department" TEXT,
    "desiredDate" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    CONSTRAINT "Presentation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Audience" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "requestorName" TEXT,
    "requestorEmail" TEXT,
    "requestorPhone" TEXT,
    "organization" TEXT,
    "nif" TEXT,
    "purpose" TEXT,
    "department" TEXT,
    "desiredDate" TEXT,
    "participants" INTEGER,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    CONSTRAINT "Audience_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "importancia" TEXT NOT NULL,
    "categoria" TEXT,
    "direcao" TEXT,
    "funcao" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "atribuidoAId" TEXT,
    "atribuidoANome" TEXT,
    "abertoEm" DATETIME,
    "resolvidoEm" DATETIME,
    "fechadoEm" DATETIME,
    "solucao" TEXT,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Pedido_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Acta" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "numero" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "internalMeetingId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "assunto" TEXT,
    "dataReuniao" TEXT,
    "horaInicio" TEXT,
    "horaFim" TEXT,
    "local" TEXT,
    "tipoReuniao" TEXT,
    "modalidade" TEXT,
    "departamento" TEXT,
    "conteudo" TEXT,
    "decisoes" TEXT,
    "participantes" TEXT NOT NULL DEFAULT '[]',
    "pontosAgenda" TEXT NOT NULL DEFAULT '[]',
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    CONSTRAINT "Acta_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Acta_internalMeetingId_fkey" FOREIGN KEY ("internalMeetingId") REFERENCES "InternalMeeting" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Oficio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "numero" TEXT,
    "assunto" TEXT,
    "destinatario" TEXT,
    "departamento" TEXT,
    "prioridade" TEXT,
    "conteudo" TEXT,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Oficio_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Factura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "numero" TEXT,
    "fornecedor" TEXT,
    "nif" TEXT,
    "valor" REAL,
    "moeda" TEXT,
    "dataEmissao" TEXT,
    "dataVencimento" TEXT,
    "descricao" TEXT,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "paidAt" DATETIME,
    "purchaseOrderId" TEXT,
    "numeroOrdem" TEXT,
    "numeroOrdemPagamento" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    CONSTRAINT "Factura_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Viatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'disponivel',
    "plate" TEXT,
    "brand" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "type" TEXT,
    "currentKm" INTEGER,
    "assignedTo" TEXT,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Viatura_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "numero" TEXT,
    "fornecedor" TEXT,
    "objeto" TEXT,
    "valor" REAL,
    "dataInicio" TEXT,
    "dataFim" TEXT,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contrato_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reclamacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "codigo" TEXT,
    "titulo" TEXT,
    "descricao" TEXT,
    "categoria" TEXT,
    "prioridade" TEXT,
    "solicitante" TEXT,
    "contacto" TEXT,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reclamacao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "nome" TEXT,
    "email" TEXT,
    "nif" TEXT,
    "telefone" TEXT,
    "endereco" TEXT,
    "userId" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    CONSTRAINT "Fornecedor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProcurementCategoria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProcurementCategoria_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Planejamento" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "tipo" TEXT,
    "titulo" TEXT,
    "descricao" TEXT,
    "valor" REAL,
    "dataInicio" TEXT,
    "dataFim" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planejamento_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Procurement" (
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
    CONSTRAINT "Procurement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Operador" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "nome" TEXT,
    "email" TEXT,
    "telefone" TEXT,
    "area" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Operador_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comunicacao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "titulo" TEXT,
    "assunto" TEXT,
    "mensagem" TEXT,
    "destinatarios" TEXT NOT NULL DEFAULT '[]',
    "prioridade" TEXT,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    "deletedById" TEXT,
    "deletedByName" TEXT,
    CONSTRAINT "Comunicacao_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PedidoViatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "viaturaId" TEXT,
    "motivo" TEXT,
    "destino" TEXT,
    "dataInicio" TEXT,
    "dataFim" TEXT,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PedidoViatura_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UtilizacaoViatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'em_curso',
    "viaturaId" TEXT,
    "motorista" TEXT,
    "destino" TEXT,
    "motivo" TEXT,
    "dataInicio" TEXT,
    "dataFim" TEXT,
    "kmInicio" INTEGER,
    "kmFim" INTEGER,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UtilizacaoViatura_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ManutencaoViatura" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdById" TEXT,
    "createdByName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "viaturaId" TEXT,
    "tipo" TEXT,
    "descricao" TEXT,
    "fornecedor" TEXT,
    "valor" REAL,
    "dataInicio" TEXT,
    "dataFim" TEXT,
    "anexos" TEXT NOT NULL DEFAULT '[]',
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ManutencaoViatura_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "originalName" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "module" TEXT,
    "resourceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedFile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "resourceId" TEXT,
    "status" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "resource" TEXT,
    "resourceId" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN,
    "errorMessage" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "oldValue" TEXT,
    "newValue" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedByName" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "updatedById" TEXT,
    "updatedByName" TEXT
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "licenseId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startsAt" DATETIME NOT NULL,
    "expiresAt" DATETIME,
    "maxUsers" INTEGER,
    "maxAdmins" INTEGER,
    "modules" TEXT NOT NULL DEFAULT '[]',
    "features" TEXT NOT NULL DEFAULT '{}',
    "offlineGraceDays" INTEGER NOT NULL DEFAULT 7,
    "minVersion" TEXT,
    "issuedAt" DATETIME NOT NULL,
    "signedPayload" TEXT NOT NULL,
    "signature" TEXT NOT NULL,
    "activationCertPayload" TEXT,
    "activationCertSignature" TEXT,
    "installationFingerprint" TEXT,
    "activatedAt" DATETIME,
    "lastValidatedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'internal',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'unread',
    "relatedToType" TEXT,
    "relatedToId" TEXT,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL DEFAULT 0,
    "prefix" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DocumentHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "statusFrom" TEXT,
    "statusTo" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "comment" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ApprovalWorkflow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "totalLevels" INTEGER NOT NULL DEFAULT 1,
    "requestedById" TEXT,
    "requestedByName" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "metadata" TEXT NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "ApprovalStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approverId" TEXT,
    "approverName" TEXT,
    "approverEmail" TEXT,
    "approverRole" TEXT,
    "decision" TEXT,
    "comment" TEXT,
    "decidedAt" DATETIME,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApprovalStep_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "ApprovalWorkflow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValidationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "module" TEXT NOT NULL,
    "status" TEXT,
    "field" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "message" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "userAgent" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseQuotation" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Budget" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "budgetId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "subcategoria" TEXT,
    "descricao" TEXT,
    "valorOrcado" REAL NOT NULL,
    "valorComprometido" REAL NOT NULL DEFAULT 0,
    "valorRealizado" REAL NOT NULL DEFAULT 0,
    "data" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BudgetLine_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "Budget" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BudgetExecution" (
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
    CONSTRAINT "BudgetExecution_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AccountPayable" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AccountReceivable" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FinancialReport" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_departmentId_idx" ON "User"("departmentId");

-- CreateIndex
CREATE INDEX "User_areaId_idx" ON "User"("areaId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_slug_key" ON "Department"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Role_slug_key" ON "Role"("slug");

-- CreateIndex
CREATE INDEX "Area_departmentId_idx" ON "Area"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Area_departmentId_slug_key" ON "Area"("departmentId", "slug");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_module_action_key" ON "RolePermission"("roleId", "module", "action");

-- CreateIndex
CREATE INDEX "InternalMeeting_roomId_meetingDate_idx" ON "InternalMeeting"("roomId", "meetingDate");

-- CreateIndex
CREATE UNIQUE INDEX "Pedido_numero_key" ON "Pedido"("numero");

-- CreateIndex
CREATE INDEX "Factura_purchaseOrderId_idx" ON "Factura"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcurementCategoria_nome_key" ON "ProcurementCategoria"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "License_licenseId_key" ON "License"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSequence_module_year_month_prefix_key" ON "DocumentSequence"("module", "year", "month", "prefix");

-- CreateIndex
CREATE INDEX "DocumentHistory_module_resourceId_idx" ON "DocumentHistory"("module", "resourceId");

-- CreateIndex
CREATE INDEX "ApprovalWorkflow_module_resourceId_idx" ON "ApprovalWorkflow"("module", "resourceId");

-- CreateIndex
CREATE INDEX "ApprovalStep_workflowId_level_idx" ON "ApprovalStep"("workflowId", "level");

-- CreateIndex
CREATE INDEX "ValidationRule_module_status_idx" ON "ValidationRule"("module", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "PurchaseQuotation_procurementId_idx" ON "PurchaseQuotation"("procurementId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_numero_key" ON "PurchaseOrder"("numero");

-- CreateIndex
CREATE INDEX "PurchaseOrder_procurementId_idx" ON "PurchaseOrder"("procurementId");

-- CreateIndex
CREATE UNIQUE INDEX "Budget_numero_key" ON "Budget"("numero");

-- CreateIndex
CREATE INDEX "BudgetLine_budgetId_idx" ON "BudgetLine"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetExecution_budgetId_idx" ON "BudgetExecution"("budgetId");

-- CreateIndex
CREATE INDEX "BudgetExecution_budgetLineId_idx" ON "BudgetExecution"("budgetLineId");

-- CreateIndex
CREATE UNIQUE INDEX "AccountPayable_numero_key" ON "AccountPayable"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "AccountReceivable_numero_key" ON "AccountReceivable"("numero");

