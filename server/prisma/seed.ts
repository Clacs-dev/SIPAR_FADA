import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { seedRBAC } from './seed-rbac';

const prisma = new PrismaClient();

// Assinatura de demonstracao (SVG simples) para o Presidente e a Secretaria
// poderem assinar actas/ordens de pagamento sem ter de carregar um ficheiro
// manualmente em "Meu Perfil" antes de testar esses fluxos.
const DEMO_SIGNATURE = 'data:image/svg+xml;base64,' + Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><text x="10" y="50" font-family="cursive" font-size="32" fill="#1a1a1a">Assinado</text></svg>'
).toString('base64');

const demoUsers = [
  { email: 'admin@sistema.com', password: '123456', name: 'Administrador PCA', role: 'gabinete_pca', department: 'Gabinete PCA', departmentSlug: 'gabinete_pca', position: 'Presidente do Conselho de Administracao' },
  { email: 'pce@sistema.com', password: '123456', name: 'Director Executivo', role: 'gabinete_pce', department: 'Gabinete PCE', departmentSlug: 'gabinete_pce', position: 'Presidente do Conselho Executivo' },
  { email: 'administrador@sistema.com', password: '123456', name: 'Administrador Geral', role: 'gabinete_administrador', department: 'Gabinete Administrador', departmentSlug: 'gabinete_administrador', position: 'Administrador' },
  { email: 'director@sistema.com', password: '123456', name: 'Director Geral', role: 'gabinete_director', department: 'Gabinete Director', departmentSlug: 'gabinete_director', position: 'Director' },
  { email: 'ministro@sistema.ao', password: '123456', name: 'Ministro da Administracao', role: 'gabinete_ministro', department: 'Gabinete Ministro', departmentSlug: 'gabinete_ministro', position: 'Ministro' },
  { email: 'gerente@sistema.ao', password: 'gerente123', name: 'Joao Gerente', role: 'gestao', department: 'Gestao', departmentSlug: 'gestao', position: 'Gerente Geral' },
  { email: 'financeiro@sistema.ao', password: 'financeiro123', name: 'Maria Financeira', role: 'financeiro', department: 'Financeiro', departmentSlug: 'financeiro', position: 'Responsavel Financeiro' },
  { email: 'rh@sistema.ao', password: 'rh123', name: 'Pedro Recursos Humanos', role: 'recursos_humanos', department: 'Recursos Humanos', departmentSlug: 'recursos_humanos', position: 'Gestor de RH' },
  { email: 'compras@sistema.ao', password: 'compras123', name: 'Ana Compras', role: 'compras', department: 'Compras', departmentSlug: 'compras', position: 'Responsavel de Compras' },
  { email: 'it@sistema.ao', password: 'it123', name: 'Jose TI', role: 'tecnologia_informacao', department: 'Tecnologia da Informacao', departmentSlug: 'tecnologia_informacao', position: 'Analista de TI' },
  { email: 'motorista@sistema.ao', password: 'motorista123', name: 'Carlos Motorista', role: 'operacional_frota', department: 'Frota', departmentSlug: 'operacional_frota', position: 'Motorista' },
  { email: 'operador@sistema.ao', password: 'operador123', name: 'Carlos Operador', role: 'operacoes', department: 'Operacoes', departmentSlug: 'operacoes', position: 'Operador de Frota' },
  { email: 'secretaria@sistema.com', password: '123456', name: 'Maria Secretaria', role: 'secretaria', department: 'Secretaria', departmentSlug: 'secretaria', position: 'Secretaria Executiva' },
  { email: 'usuario@empresa.com', password: '123456', name: 'Joao Utilizador Externo', role: 'externo', department: 'Externo', departmentSlug: null, position: 'Cliente' },
  { email: 'sistema@fada.local', password: 'sistema123', name: 'Administrador do Sistema', role: 'admin_sistema', department: null, departmentSlug: null, position: 'Administrador de Sistema (TI)' },
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '[Seed] Bloqueado: NODE_ENV=production. Este script cria contas de demonstracao com passwords fracas ' +
      'e conhecidas publicamente (estao no repositorio) — nunca deve correr contra uma instalacao real de cliente. ' +
      'Se esta instalacao precisa mesmo de dados de demonstracao, corra com NODE_ENV=development explicitamente.'
    );
    process.exit(1);
  }

 console.log('[Seed] Sincronizando departamentos e roles (RBAC)...');
  await seedRBAC();

 console.log('[Seed] Limpando registros antigos...');
  await prisma.message.deleteMany();
  await prisma.uploadedFile.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.internalMeetingParticipant.deleteMany();
  await prisma.acta.deleteMany();
  await prisma.internalMeeting.deleteMany();
  await prisma.meetingRoom.deleteMany();
  await prisma.presentation.deleteMany();
  await prisma.audience.deleteMany();
  await prisma.pedido.deleteMany();
  await prisma.oficio.deleteMany();
  await prisma.factura.deleteMany();
  await prisma.viatura.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.reclamacao.deleteMany();
  await prisma.purchaseQuotation.deleteMany();
  await prisma.purchaseOrder.deleteMany();
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
    const dept = u.departmentSlug
      ? await prisma.department.findUnique({ where: { slug: u.departmentSlug } })
      : null;
    const dbUser = await prisma.user.create({
      data: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        role: u.role,
        department: u.department,
        departmentId: dept?.id || null,
        position: u.position,
        status: 'active',
        // Presidente e Secretaria ja ficam com assinatura carregada, para
        // testar assinatura de actas/ordens de pagamento sem passos extra.
        signatureImage: (u.role === 'gabinete_pca' || u.role === 'secretaria') ? DEMO_SIGNATURE : null,
      }
    });
    createdUsers.push(dbUser);
    console.log(`   Utilizador: ${dbUser.email} [ID: ${dbUser.id}]`);
  }

  const compras = createdUsers.find(u => u.role === 'compras')!;

  // Contas de fornecedor (role externo) com as suas proprias coordenadas
  // bancarias no perfil - usadas para login/testes de quem usa o sistema
  // como fornecedor. Mantidas mesmo sem dados de procurement de demonstracao,
  // porque sao "utilizadores padrao", nao dados de teste.
 console.log('[Seed] Semeando utilizadores de fornecedor...');
  const fornecedorSenhaHash = await bcrypt.hash('fornecedor123', 10);
  const fornecedoresUsers = await Promise.all([
    prisma.user.create({
      data: { email: 'contacto@techsolutions.ao', password: fornecedorSenhaHash, name: 'Tech Solutions Angola', role: 'externo', department: 'Externo', position: 'Fornecedor', status: 'active',
        bankName: 'BAI', bankAccountHolder: 'Tech Solutions Angola', bankIban: 'AO06 0000 0000 0000 0000 0000 1', bankNib: '0000 0000 0000 0000 0000 1', bankSwift: 'BAIAAOLU', bankCity: 'Luanda', bankCountry: 'Angola' }
    }),
    prisma.user.create({
      data: { email: 'geral@agroinsumos.ao', password: fornecedorSenhaHash, name: 'Agro Insumos Lda', role: 'externo', department: 'Externo', position: 'Fornecedor', status: 'active',
        bankName: 'BFA', bankAccountHolder: 'Agro Insumos Lda', bankIban: 'AO06 0000 0000 0000 0000 0000 2', bankNib: '0000 0000 0000 0000 0000 2', bankSwift: 'BFAAAOLU', bankCity: 'Luanda', bankCountry: 'Angola' }
    }),
    prisma.user.create({
      data: { email: 'reservas@agenciaviagem.ao', password: fornecedorSenhaHash, name: 'Agência de Viagem Lda', role: 'externo', department: 'Externo', position: 'Fornecedor', status: 'active',
        bankName: 'KEVE', bankAccountHolder: 'Agência de Viagem Lda', bankIban: 'AO06 0000 0000 0000 0000 0000 3', bankNib: '0000 0000 0000 0000 0000 3', bankSwift: 'KEVEAOLU', bankCity: 'Luanda', bankCountry: 'Angola' }
    }),
  ]);
  for (const fu of fornecedoresUsers) {
    console.log(`   Utilizador (fornecedor): ${fu.email} [ID: ${fu.id}]`);
  }

  // Categorias de produtos/servicos usadas no cadastro de fornecedores e nos
  // pedidos de compra. E configuracao base (dropdown), nao dado de teste -
  // mantida para o modulo de Compras ficar utilizavel desde o primeiro login.
  const categoriasProcurementSeed = [
    'Material de Escritório',
    'Equipamentos de Informática',
    'Equipamentos e Materiais Agrícolas',
    'Material de Engenharia e Construção',
    'Serviços de Consultoria',
    'Serviços de Manutenção',
    'Transporte e Logística',
    'Combustíveis e Lubrificantes',
    'Alimentação e Catering',
    'Mobiliário',
    'Segurança',
    'Tecnologia e Software',
    'Outros',
  ];
  for (let i = 0; i < categoriasProcurementSeed.length; i++) {
    await prisma.procurementCategoria.upsert({
      where: { nome: categoriasProcurementSeed[i] },
      update: {},
      create: { id: `categoria_seed_${i + 1}`, nome: categoriasProcurementSeed[i], createdById: compras.id },
    });
  }

  console.log('[Seed] Banco de dados semeado com sucesso (apenas utilizadores e categorias base).');
}

main()
  .catch((e) => {
    console.error('[Seed] Erro critico ao semear banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
