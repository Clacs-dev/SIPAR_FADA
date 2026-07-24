import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const demoUsers = [
  { email: 'admin@sistema.com', password: '123456', name: 'Administrador PCA', role: 'gabinete_pca', department: 'Gabinete PCA', position: 'Presidente do Conselho de Administracao' },
  { email: 'pce@sistema.com', password: '123456', name: 'Director Executivo', role: 'gabinete_pce', department: 'Gabinete PCE', position: 'Presidente do Conselho Executivo' },
  { email: 'administrador@sistema.com', password: '123456', name: 'Administrador Geral', role: 'gabinete_administrador', department: 'Gabinete Administrador', position: 'Administrador' },
  { email: 'director@sistema.com', password: '123456', name: 'Director Geral', role: 'gabinete_director', department: 'Gabinete Director', position: 'Director' },
  { email: 'ministro@sistema.ao', password: '123456', name: 'Ministro da Administracao', role: 'gabinete_ministro', department: 'Gabinete Ministro', position: 'Ministro' },
  { email: 'gerente@sistema.ao', password: 'gerente123', name: 'Joao Gerente', role: 'gestao', department: 'Gestao', position: 'Gerente Geral' },
  { email: 'financeiro@sistema.ao', password: 'financeiro123', name: 'Maria Financeira', role: 'financeiro', department: 'Financeiro', position: 'Responsavel Financeiro' },
  { email: 'rh@sistema.ao', password: 'rh123', name: 'Pedro Recursos Humanos', role: 'recursos_humanos', department: 'Recursos Humanos', position: 'Gestor de RH' },
  { email: 'compras@sistema.ao', password: 'compras123', name: 'Ana Compras', role: 'compras', department: 'Compras', position: 'Responsavel de Compras' },
  { email: 'it@sistema.ao', password: 'it123', name: 'Jose TI', role: 'tecnologia_informacao', department: 'Tecnologia da Informacao', position: 'Analista de TI' },
  { email: 'motorista@sistema.ao', password: 'motorista123', name: 'Carlos Motorista', role: 'operacional_frota', department: 'Frota', position: 'Motorista' },
  { email: 'operador@sistema.ao', password: 'operador123', name: 'Carlos Operador', role: 'operacoes', department: 'Operacoes', position: 'Operador de Frota' },
  { email: 'secretaria@sistema.com', password: '123456', name: 'Maria Secretaria', role: 'secretaria', department: 'Secretaria', position: 'Secretaria Executiva' },
  { email: 'usuario@empresa.com', password: '123456', name: 'Joao Utilizador Externo', role: 'externo', department: 'Externo', position: 'Cliente' }
];

async function main() {
  console.log('[Seed] Limpando registros antigos...');
  await prisma.uploadedFile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.internalMeetingParticipant.deleteMany();
  await prisma.acta.deleteMany();
  await prisma.internalMeeting.deleteMany();
  await prisma.presentation.deleteMany();
  await prisma.audience.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.oficio.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.viatura.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.reclamacao.deleteMany();
  await prisma.fornecedor.deleteMany();
  await prisma.planejamento.deleteMany();
  await prisma.procurement.deleteMany();
  await prisma.operador.deleteMany();
  await prisma.comunicacao.deleteMany();
  await prisma.pedidoViatura.deleteMany();
  await prisma.user.deleteMany();

  console.log(`[Seed] Semeando ${demoUsers.length} utilizadores de demonstracao...`);
  const createdUsers = [];
  for (const u of demoUsers) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    const dbUser = await prisma.user.create({
      data: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        department: u.department,
        position: u.position,
        status: 'active'
      }
    });
    createdUsers.push(dbUser);
    console.log(`   Utilizador: ${dbUser.email} [ID: ${dbUser.id}]`);
  }

  const requester = createdUsers.find(u => u.role === 'externo')!;
  const admin = createdUsers.find(u => u.role === 'gabinete_pca')!;

  await prisma.presentation.createMany({
    data: [
      {
        id: 'pres_1',
        createdById: requester.id,
        createdByName: requester.name,
        company: 'Empresa Comercial Luanda, Lda',
        nif: '5000123456',
        purpose: 'Apresentacao de proposta comercial para fornecimento de equipamentos',
        department: 'Departamento Comercial',
        desiredDate: '2026-06-15',
        contactName: requester.name,
        contactEmail: requester.email,
        contactPhone: '+244 923 456 789',
        status: 'pendente',
        data: JSON.stringify({ type: 'presentation' })
      },
      {
        id: 'pres_2',
        createdById: requester.id,
        createdByName: requester.name,
        company: 'Tech Solutions Angola',
        nif: '5000789012',
        purpose: 'Apresentacao de solucoes tecnologicas para digitalizacao',
        department: 'Departamento de TI',
        desiredDate: '2026-06-20',
        contactName: requester.name,
        contactEmail: requester.email,
        contactPhone: '+244 923 456 789',
        status: 'aceite_admin',
        data: JSON.stringify({ acceptedBy: admin.name, type: 'presentation' })
      }
    ]
  });

  await prisma.audience.create({
    data: {
      id: 'aud_1',
      createdById: requester.id,
      createdByName: requester.name,
      requestorName: requester.name,
      requestorEmail: requester.email,
      requestorPhone: '+244 923 456 789',
      organization: 'Associacao Empresarial',
      nif: '5000999888',
      purpose: 'Discutir politicas de incentivo ao sector empresarial',
      department: 'Gabinete do Governador',
      desiredDate: '2026-06-18',
      participants: 5,
      status: 'pendente',
      data: JSON.stringify({ type: 'audience' })
    }
  });

  await prisma.viatura.createMany({
    data: [
      {
        id: 'veh_1',
        plate: 'LD-45-78-AB',
        brand: 'Toyota',
        model: 'Hilux',
        year: 2023,
        type: 'Pickup',
        status: 'disponivel',
        currentKm: 15420,
        data: JSON.stringify({ lastMaintenance: '2026-05-01', nextMaintenance: '2026-09-01' })
      },
      {
        id: 'veh_2',
        plate: 'LD-32-15-CD',
        brand: 'Hyundai',
        model: 'Tucson',
        year: 2024,
        type: 'SUV',
        status: 'em_uso',
        currentKm: 8750,
        assignedTo: 'Secretaria',
        data: JSON.stringify({ lastMaintenance: '2026-04-10', nextMaintenance: '2026-08-10' })
      }
    ]
  });

  await prisma.factura.create({
    data: {
      id: 'fact_1',
      createdById: requester.id,
      createdByName: requester.name,
      numero: 'FT-2026-001',
      fornecedor: 'Tech Solutions Angola',
      nif: '5000789012',
      valor: 1500000,
      moeda: 'AOA',
      status: 'pendente',
      descricao: 'Factura de demonstracao',
      data: JSON.stringify({})
    }
  });

  console.log('[Seed] Banco de dados semeado com sucesso!');
}

main()
  .catch((e) => {
    console.error('[Seed] Erro critico ao semear banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
