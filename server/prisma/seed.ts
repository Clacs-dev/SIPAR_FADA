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

  const requester = createdUsers.find(u => u.role === 'externo')!;
  const admin = createdUsers.find(u => u.role === 'gabinete_pca')!;
  const administrador = createdUsers.find(u => u.role === 'gabinete_administrador')!;
  const gerente = createdUsers.find(u => u.role === 'gestao')!;
  const financeiro = createdUsers.find(u => u.role === 'financeiro')!;
  const compras = createdUsers.find(u => u.role === 'compras')!;
  const secretaria = createdUsers.find(u => u.role === 'secretaria')!;

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
      },
      {
        id: 'pres_3',
        createdById: requester.id,
        createdByName: requester.name,
        company: 'Construtora Kianda, Lda',
        nif: '5000321654',
        purpose: 'Apresentacao de proposta de obras de reabilitacao',
        department: 'Departamento de Infraestruturas',
        desiredDate: '2026-06-25',
        contactName: requester.name,
        contactEmail: requester.email,
        contactPhone: '+244 923 456 789',
        status: 'agendado',
        data: JSON.stringify({
          type: 'presentation', meetingType: 'presencial', location: 'Sala de Reuniões 1',
          scheduledDate: '2026-09-10T10:00:00.000Z', time: '10:00', duration: '1h',
          scheduledAt: new Date().toISOString(), scheduledBy: secretaria.name,
        })
      },
      {
        id: 'pres_4',
        createdById: requester.id,
        createdByName: requester.name,
        company: 'Distribuidora Central, S.A.',
        nif: '5000654321',
        purpose: 'Apresentacao de catalogo de produtos',
        department: 'Departamento Comercial',
        desiredDate: '2026-05-10',
        contactName: requester.name,
        contactEmail: requester.email,
        contactPhone: '+244 923 456 789',
        status: 'realizado',
        data: JSON.stringify({
          type: 'presentation', meetingType: 'online', platform: 'zoom',
          scheduledDate: '2026-05-12T14:00:00.000Z', time: '14:00', duration: '30min',
        })
      },
      {
        id: 'pres_5',
        createdById: requester.id,
        createdByName: requester.name,
        company: 'Import Export Bengo, Lda',
        nif: '5000112233',
        purpose: 'Proposta de parceria comercial internacional',
        department: 'Departamento Comercial',
        desiredDate: '2026-04-15',
        contactName: requester.name,
        contactEmail: requester.email,
        contactPhone: '+244 923 456 789',
        status: 'rejeitado',
        data: JSON.stringify({ type: 'presentation', rejectionReason: 'Fora do âmbito de atuação do FADA' })
      }
    ]
  });

  await prisma.audience.createMany({
    data: [
      {
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
      },
      {
        id: 'aud_2',
        createdById: requester.id,
        createdByName: requester.name,
        requestorName: requester.name,
        requestorEmail: requester.email,
        requestorPhone: '+244 923 456 789',
        organization: 'Cooperativa Agrícola do Bié',
        nif: '5000887766',
        purpose: 'Pedido de apoio técnico para projecto agrícola',
        department: 'Direcção Técnica',
        desiredDate: '2026-06-22',
        participants: 3,
        status: 'delegado',
        data: JSON.stringify({
          type: 'audience', delegatedTo: gerente.id, delegatedToId: gerente.id,
          delegatedToEmail: gerente.email, delegatedToName: gerente.name,
          delegationNotes: 'Encaminhado por ser da área de gestão de projectos.',
        })
      },
      {
        id: 'aud_3',
        createdById: requester.id,
        createdByName: requester.name,
        requestorName: requester.name,
        requestorEmail: requester.email,
        requestorPhone: '+244 923 456 789',
        organization: 'Associação de Produtores do Kwanza Sul',
        nif: '5000776655',
        purpose: 'Apresentação de resultados da campanha agrícola',
        department: 'Direcção Técnica',
        desiredDate: '2026-06-28',
        participants: 4,
        status: 'agendado',
        data: JSON.stringify({
          type: 'audience', meetingType: 'presencial', location: 'Auditório Principal',
          scheduledDate: '2026-09-15T09:30:00.000Z', time: '09:30', duration: '1h30',
          scheduledAt: new Date().toISOString(), scheduledBy: secretaria.name,
        })
      },
      {
        id: 'aud_4',
        createdById: requester.id,
        createdByName: requester.name,
        requestorName: requester.name,
        requestorEmail: requester.email,
        requestorPhone: '+244 923 456 789',
        organization: 'ONG Desenvolvimento Rural',
        nif: '5000665544',
        purpose: 'Proposta de parceria para formação de agricultores',
        department: 'Direcção Técnica',
        desiredDate: '2026-05-05',
        participants: 2,
        status: 'realizado',
        data: JSON.stringify({
          type: 'audience', meetingType: 'online', platform: 'teams',
          scheduledDate: '2026-05-06T11:00:00.000Z', time: '11:00', duration: '1h',
        })
      },
      {
        id: 'aud_5',
        createdById: requester.id,
        createdByName: requester.name,
        requestorName: requester.name,
        requestorEmail: requester.email,
        requestorPhone: '+244 923 456 789',
        organization: 'Consultora Agropecuária Sul, Lda',
        nif: '5000554433',
        purpose: 'Reunião de acompanhamento de contrato',
        department: 'Direcção Técnica',
        desiredDate: '2026-04-20',
        participants: 2,
        status: 'nao_compareceu',
        data: JSON.stringify({
          type: 'audience', meetingType: 'presencial', location: 'Sala Pequena',
          scheduledDate: '2026-04-22T15:00:00.000Z', time: '15:00', duration: '30min',
        })
      },
    ]
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

  // ==========================================
  // SALAS DE REUNIÃO
  // ==========================================
 console.log('[Seed] Semeando salas de reunião...');
  const [salaGrande, salaPequena, auditorio] = await Promise.all([
    prisma.meetingRoom.create({
      data: { nome: 'Sala de Reuniões 1', capacidade: 12, localizacao: '2º Piso, Ala Norte', recursos: JSON.stringify(['Projector', 'Videoconferência', 'Quadro branco']), ativa: true }
    }),
    prisma.meetingRoom.create({
      data: { nome: 'Sala Pequena', capacidade: 4, localizacao: '2º Piso, Ala Sul', recursos: JSON.stringify(['TV', 'Quadro branco']), ativa: true }
    }),
    prisma.meetingRoom.create({
      data: { nome: 'Auditório Principal', capacidade: 50, localizacao: 'Rés-do-chão', recursos: JSON.stringify(['Projector', 'Som', 'Videoconferência']), ativa: true }
    }),
  ]);

  // ==========================================
  // REUNIÕES INTERNAS + ACTAS
  // ==========================================
 console.log('[Seed] Semeando reuniões internas e actas...');
  const meeting1 = await prisma.internalMeeting.create({
    data: {
      organizerId: admin.id,
      participantId: gerente.id,
      title: 'Reunião de Conselho de Administração',
      description: 'Revisão trimestral de resultados e aprovação de orçamento',
      meetingDate: '2026-09-02',
      startTime: '09:00',
      endTime: '11:00',
      meetingType: 'presencial',
      location: null,
      roomId: salaGrande.id,
      priority: 'alta',
      status: 'confirmado',
      tipoReuniao: 'ordinaria',
      orgao: 'Conselho de Administração',
      pontosAgenda: JSON.stringify([
        { titulo: 'Resultados do trimestre', descricao: 'Apresentação dos indicadores financeiros', tempo_estimado: '30 min' },
        { titulo: 'Aprovação de orçamento', descricao: 'Discussão do orçamento do próximo trimestre', tempo_estimado: '45 min' },
      ]),
    }
  });
  await prisma.internalMeetingParticipant.createMany({
    data: [
      { meetingId: meeting1.id, userId: gerente.id, name: gerente.name, email: gerente.email, cargo: gerente.position || '', department: gerente.department || '', presente: false },
      { meetingId: meeting1.id, userId: financeiro.id, name: financeiro.name, email: financeiro.email, cargo: financeiro.position || '', department: financeiro.department || '', presente: false },
    ]
  });
  await prisma.acta.create({
    data: {
      id: 'acta_seed_1',
      numero: 'ACTA-2026-000001',
      createdById: admin.id,
      createdByName: admin.name,
      internalMeetingId: meeting1.id,
      status: 'rascunho',
      assunto: meeting1.title,
      dataReuniao: meeting1.meetingDate,
      horaInicio: meeting1.startTime,
      horaFim: meeting1.endTime,
      tipoReuniao: 'ordinaria',
      modalidade: 'presencial',
      departamento: admin.department,
      participantes: JSON.stringify([
        { nome: admin.name, cargo: admin.position, departamento: admin.department, presente: false },
        { nome: gerente.name, cargo: gerente.position, departamento: gerente.department, presente: false },
      ]),
      pontosAgenda: meeting1.pontosAgenda,
      anexos: '[]',
      data: JSON.stringify({ pauta: meeting1.description }),
    }
  });

  const meeting2 = await prisma.internalMeeting.create({
    data: {
      organizerId: secretaria.id,
      title: 'Ponto de situação semanal - Secretaria',
      description: 'Alinhamento semanal de tarefas administrativas',
      meetingDate: '2026-09-05',
      startTime: '14:00',
      endTime: '15:00',
      meetingType: 'online',
      platform: 'google_meet',
      meetingLink: 'https://meet.google.com/exemplo-demo',
      priority: 'normal',
      status: 'pendente',
      tipoReuniao: 'ordinaria',
      pontosAgenda: JSON.stringify([{ titulo: 'Pendências da semana', descricao: '', tempo_estimado: '20 min' }]),
    }
  });

  // Reunião já realizada, com acta completa (discussão/decisão/votação por
  // ponto, recomendações, estrutura formal e ambas as assinaturas) - pronta
  // para testar o botão "Aprovar Acta" e o e-mail que isso dispara.
  const meeting3 = await prisma.internalMeeting.create({
    data: {
      organizerId: admin.id,
      participantId: financeiro.id,
      title: 'Reunião Extraordinária - Aprovação Orçamental',
      description: 'Aprovação extraordinária do reforço orçamental do 3º trimestre',
      meetingDate: '2026-08-20',
      startTime: '10:00',
      endTime: '11:30',
      meetingType: 'presencial',
      roomId: salaGrande.id,
      priority: 'urgente',
      status: 'concluido',
      tipoReuniao: 'extraordinaria',
      orgao: 'Conselho de Administração',
      pontosAgenda: JSON.stringify([
        { titulo: 'Reforço orçamental', descricao: 'Análise do pedido de reforço para o 3º trimestre', tempo_estimado: '45 min' },
      ]),
    }
  });
  await prisma.internalMeetingParticipant.createMany({
    data: [
      { meetingId: meeting3.id, userId: financeiro.id, name: financeiro.name, email: financeiro.email, cargo: financeiro.position || '', department: financeiro.department || '', presente: true },
      { meetingId: meeting3.id, userId: secretaria.id, name: secretaria.name, email: secretaria.email, cargo: secretaria.position || '', department: secretaria.department || '', presente: true },
    ]
  });

  // Reunião confirmada mas que acabou por não se realizar.
  const meeting4 = await prisma.internalMeeting.create({
    data: {
      organizerId: gerente.id,
      participantId: compras.id,
      title: 'Alinhamento Gestão x Compras',
      description: 'Revisão do plano de compras do trimestre',
      meetingDate: '2026-08-25',
      startTime: '16:00',
      endTime: '17:00',
      meetingType: 'online',
      platform: 'zoom',
      meetingLink: 'https://zoom.us/exemplo-demo',
      priority: 'normal',
      status: 'nao_realizada',
      tipoReuniao: 'ordinaria',
    }
  });

  // Acta finalizada e ja assinada por Presidente e Secretario - falta so
  // clicar "Aprovar Acta" para disparar o e-mail aos participantes.
  const pontosAgendaMeeting3 = [
    {
      titulo: 'Reforço orçamental',
      descricao: 'Análise do pedido de reforço para o 3º trimestre',
      discussao: 'Foram apresentados os números actualizados de execução orçamental e a necessidade de reforço para cobrir despesas extraordinárias de manutenção.',
      intervencoes: [
        { participante_nome: financeiro.name, participante_cargo: financeiro.position || '', texto: 'apoiou o reforço, alertando para a necessidade de acompanhamento mensal da execução.' },
      ],
      decisao: 'Aprovado o reforço orçamental de 15.000.000 AOA para o 3º trimestre.',
      tipo_votacao: 'unanimidade',
      resultado_votacao: 'Aprovado por unanimidade',
    },
  ];
  await prisma.acta.create({
    data: {
      id: 'acta_seed_2',
      numero: 'ACTA-2026-000002',
      createdById: admin.id,
      createdByName: admin.name,
      internalMeetingId: meeting3.id,
      status: 'finalizada',
      assunto: meeting3.title,
      dataReuniao: meeting3.meetingDate,
      horaInicio: meeting3.startTime,
      horaFim: meeting3.endTime,
      tipoReuniao: 'extraordinaria',
      modalidade: 'presencial',
      local: 'Sala de Reuniões 1',
      departamento: admin.department,
      decisoes: JSON.stringify([
        { id: 'decisao_seed_1', descricao: 'Reforço orçamental de 15.000.000 AOA aprovado para o 3º trimestre', responsavel: financeiro.name, status: 'concluida' },
      ]),
      participantes: JSON.stringify([
        { nome: admin.name, cargo: admin.position, departamento: admin.department, presente: true },
        { nome: financeiro.name, cargo: financeiro.position, departamento: financeiro.department, presente: true },
        { nome: secretaria.name, cargo: secretaria.position, departamento: secretaria.department, presente: true },
      ]),
      pontosAgenda: JSON.stringify(pontosAgendaMeeting3),
      anexos: '[]',
      data: JSON.stringify({
        pauta: meeting3.description,
        resumo: 'Reunião extraordinária para aprovação de reforço orçamental do 3º trimestre.',
        discussoes: 'Discussão centrada na necessidade de reforço orçamental face a despesas extraordinárias de manutenção.',
        recomendacoes: ['Acompanhar mensalmente a execução do reforço aprovado.'],
        entidade: 'FADA - Fundo de Apoio ao Desenvolvimento Agrário',
        endereco_completo: 'Rua Rainha Ginga, nº 25, Luanda',
        cidade: 'Luanda',
        numero_reuniao: '2',
        presidente: admin.name,
        cargo_presidente: admin.position,
        secretario: secretaria.name,
        cargo_secretario: secretaria.position,
        assinaturas_reais: [
          { papel: 'presidente', user_id: admin.id, nome: admin.name, assinatura_url: DEMO_SIGNATURE, assinado_em: new Date().toISOString() },
          { papel: 'secretario', user_id: secretaria.id, nome: secretaria.name, assinatura_url: DEMO_SIGNATURE, assinado_em: new Date().toISOString() },
        ],
      }),
    }
  });

  // Acta ja totalmente aprovada (fim da linha) - para ver o estado final e
  // exportar o PDF.
  await prisma.acta.create({
    data: {
      id: 'acta_seed_3',
      numero: 'ACTA-2026-000003',
      createdById: secretaria.id,
      createdByName: secretaria.name,
      status: 'aprovada',
      assunto: 'Reunião Ordinária de Direcção - Julho 2026',
      dataReuniao: '2026-07-15',
      horaInicio: '09:00',
      horaFim: '10:30',
      tipoReuniao: 'ordinaria',
      modalidade: 'presencial',
      local: 'Sala de Reuniões 1',
      departamento: secretaria.department,
      decisoes: JSON.stringify([
        { id: 'decisao_seed_2', descricao: 'Aprovado o plano de formação interna para o 2º semestre', responsavel: gerente.name, status: 'concluida' },
      ]),
      participantes: JSON.stringify([
        { nome: admin.name, cargo: admin.position, departamento: admin.department, presente: true },
        { nome: gerente.name, cargo: gerente.position, departamento: gerente.department, presente: true },
      ]),
      pontosAgenda: JSON.stringify([
        { titulo: 'Plano de formação interna', descricao: 'Apresentação do plano de formação para o 2º semestre', decisao: 'Aprovado sem alterações.', tipo_votacao: 'unanimidade', resultado_votacao: 'Aprovado por unanimidade' },
      ]),
      anexos: '[]',
      data: JSON.stringify({
        resumo: 'Reunião ordinária de direcção, com aprovação do plano de formação interna.',
        entidade: 'FADA - Fundo de Apoio ao Desenvolvimento Agrário',
        endereco_completo: 'Rua Rainha Ginga, nº 25, Luanda',
        cidade: 'Luanda',
        numero_reuniao: '1',
        presidente: admin.name,
        cargo_presidente: admin.position,
        secretario: secretaria.name,
        cargo_secretario: secretaria.position,
        assinaturas_reais: [
          { papel: 'presidente', user_id: admin.id, nome: admin.name, assinatura_url: DEMO_SIGNATURE, assinado_em: '2026-07-15T11:00:00.000Z' },
          { papel: 'secretario', user_id: secretaria.id, nome: secretaria.name, assinatura_url: DEMO_SIGNATURE, assinado_em: '2026-07-15T11:05:00.000Z' },
        ],
        aprovada_por_id: admin.id,
        aprovada_por_nome: admin.name,
        aprovada_em: '2026-07-15T12:00:00.000Z',
      }),
    }
  });

  // Acta criada manualmente (sem reunião interna associada), para testar o
  // fluxo "Nova Acta" isoladamente - inclui um participante externo.
  await prisma.acta.create({
    data: {
      id: 'acta_seed_manual',
      numero: 'ACTA-2026-000004',
      createdById: secretaria.id,
      createdByName: secretaria.name,
      status: 'rascunho',
      assunto: 'Reunião com Parceiros Externos - Cooperação Técnica',
      dataReuniao: '2026-09-08',
      horaInicio: '15:00',
      horaFim: '16:00',
      tipoReuniao: 'outros',
      modalidade: 'presencial',
      local: 'Sala Pequena',
      departamento: secretaria.department,
      participantes: JSON.stringify([
        { nome: secretaria.name, cargo: secretaria.position, departamento: secretaria.department, presente: true },
        { nome: 'Engº Paulo Neto', cargo: 'Consultor Externo', departamento: 'Externo', presente: true, externo: true },
      ]),
      pontosAgenda: '[]',
      anexos: '[]',
      data: JSON.stringify({ resumo: 'Primeira reunião de alinhamento com consultor externo de cooperação técnica.' }),
    }
  });

  // ==========================================
  // COMUNICAÇÕES INTERNAS
  // ==========================================
 console.log('[Seed] Semeando comunicações internas...');
  const [deptFinanceiro, deptCompras, deptAdministracao, deptGestao] = await Promise.all([
    prisma.department.findUnique({ where: { slug: 'financeiro' } }),
    prisma.department.findUnique({ where: { slug: 'compras' } }),
    prisma.department.findUnique({ where: { slug: 'administracao' } }),
    prisma.department.findUnique({ where: { slug: 'gestao' } }),
  ]);
  await prisma.comunicacao.createMany({
    data: [
      {
        id: 'comunicacao_seed_1',
        createdById: secretaria.id,
        createdByName: secretaria.name,
        status: 'pendente',
        titulo: 'Circular Interna 01/2026',
        assunto: 'Novo horário de funcionamento',
        mensagem: 'Informamos que a partir de 1 de Setembro o horário de funcionamento passa a ser das 8h às 17h.',
        destinatarios: JSON.stringify(['Todos os Departamentos']),
        prioridade: 'normal',
        anexos: '[]',
        data: JSON.stringify({
          departamento_origem: secretaria.department,
          departamento_destino: deptGestao?.nome,
          departamento_destino_id: deptGestao?.id,
        }),
      },
      {
        id: 'comunicacao_seed_2',
        createdById: gerente.id,
        createdByName: gerente.name,
        status: 'despachado',
        titulo: 'Solicitação de material de escritório',
        assunto: 'Reposição de material',
        mensagem: 'Solicito a reposição de material de escritório para o departamento de Gestão.',
        destinatarios: JSON.stringify(['Administração']),
        prioridade: 'baixa',
        anexos: '[]',
        data: JSON.stringify({
          departamento_origem: gerente.department,
          departamento_destino: deptAdministracao?.nome,
          departamento_destino_id: deptAdministracao?.id,
          despachos: [{ texto: 'Aprovado, encaminhar para Compras.', autor: admin.name, data: new Date().toISOString() }],
        }),
      },
      {
        id: 'comunicacao_seed_3',
        createdById: financeiro.id,
        createdByName: financeiro.name,
        status: 'arquivado',
        titulo: 'Encerramento do exercício anterior',
        assunto: 'Fecho de contas',
        mensagem: 'Comunicamos o encerramento definitivo das contas do exercício anterior.',
        destinatarios: JSON.stringify(['Gabinete PCA', 'Financeiro']),
        prioridade: 'alta',
        anexos: '[]',
        data: JSON.stringify({
          departamento_origem: financeiro.department,
          departamento_destino: 'Gabinete PCA',
          arquivado_em: new Date().toISOString(),
        }),
      },
      {
        id: 'comunicacao_seed_4',
        createdById: compras.id,
        createdByName: compras.name,
        status: 'em_analise',
        titulo: 'Pedido de cabimentação orçamental',
        assunto: 'Cabimentação para aquisição de equipamento informático',
        mensagem: 'Solicito a cabimentação orçamental para a aquisição de 5 computadores portáteis (ver Pedido de Compra PED-2026-000001).',
        destinatarios: JSON.stringify([financeiro.name]),
        prioridade: 'alta',
        anexos: '[]',
        // Comunicação dirigida a UMA pessoa especifica (destinatario_id), nao
        // a todo o departamento - para testar essa via de notificacao.
        data: JSON.stringify({
          departamento_origem: compras.department,
          departamento_destino: deptFinanceiro?.nome,
          departamento_destino_id: deptFinanceiro?.id,
          destinatario_id: financeiro.id,
          destinatario_nome: financeiro.name,
          destinatario_cargo: financeiro.position,
        }),
      },
    ]
  });

  // ==========================================
  // PROCUREMENT: FORNECEDORES, PEDIDOS, COTAÇÕES, ORDEM DE COMPRA
  // ==========================================
 console.log('[Seed] Semeando fornecedores e procurement...');
  // Cada fornecedor tem uma conta de utilizador (role externo) com as suas proprias
  // coordenadas bancarias registadas no perfil - e desta conta (nao de texto estatico)
  // que a Ordem de Pagamento resolve Banco/IBAN/Cidade/Pais em tempo real.
  const fornecedorSenhaHash = await bcrypt.hash('fornecedor123', 10);
  const [fornecedorUser1, fornecedorUser2, fornecedorUser3] = await Promise.all([
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

  // Categorias de produtos/servicos usadas no cadastro de fornecedores e nos
  // pedidos de compra (antes uma lista fixa no front-end, agora gerida na
  // base de dados para que o utilizador possa criar novas categorias).
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

  const [fornecedor1, fornecedor2, fornecedor3] = await Promise.all([
    prisma.fornecedor.create({
      data: { id: 'fornecedor_seed_1', createdById: compras.id, createdByName: compras.name, nome: 'Tech Solutions Angola', email: 'contacto@techsolutions.ao', nif: '5000789012', telefone: '+244 923 111 222', endereco: 'Luanda, Talatona', status: 'ativo', userId: fornecedorUser1.id, data: JSON.stringify({ categorias_produto: ['Equipamentos de Informática', 'Tecnologia e Software'] }) }
    }),
    prisma.fornecedor.create({
      data: { id: 'fornecedor_seed_2', createdById: compras.id, createdByName: compras.name, nome: 'Agro Insumos Lda', email: 'geral@agroinsumos.ao', nif: '5000456789', telefone: '+244 923 333 444', endereco: 'Luanda, Viana', status: 'ativo', userId: fornecedorUser2.id, data: JSON.stringify({ categorias_produto: ['Equipamentos e Materiais Agrícolas'] }) }
    }),
    prisma.fornecedor.create({
      data: { id: 'fornecedor_seed_3', createdById: compras.id, createdByName: compras.name, nome: 'Agência de Viagem Lda', email: 'reservas@agenciaviagem.ao', nif: '5000998877', telefone: '+244 923 555 666', endereco: 'Luanda, Ingombota', status: 'ativo', userId: fornecedorUser3.id, data: JSON.stringify({ categorias_produto: ['Transporte e Logística'] }) }
    }),
  ]);

  // Ainda por publicar - so aparece no separador correspondente sem cotacoes.
  const procurementCriado = await prisma.procurement.create({
    data: {
      id: 'procurement_seed_0', createdById: compras.id, createdByName: compras.name,
      tipo: 'pedido_compra', numero: 'PED-2026-000000', descricao: 'Aquisição de material de escritório diverso',
      valor: 120000, status: 'criado',
      data: JSON.stringify({
        categoria: 'Mobiliário', departamento_solicitante: 'Administração',
        orcamento_estimado: 130000, prazo_entrega_desejado: '2026-02-15', local_entrega: 'Sede FADA - Luanda',
        itens: [{ id: 'item_seed_0_1', descricao: 'Resmas de papel A4', tipo: 'consumivel', quantidade: 50, unidade: 'resma' }],
      }),
    }
  });

  // Ja tem cotacoes recebidas - estado correcto e "em_cotacao" (nao
  // "aguardando_cotacoes", que e so ate a 1ª cotacao chegar), pronto para
  // testar o botao "Analisar Cotações".
  const procurementAguardando = await prisma.procurement.create({
    data: {
      id: 'procurement_seed_1', createdById: compras.id, createdByName: compras.name,
      tipo: 'pedido_compra', numero: 'PED-2026-000001', descricao: 'Aquisição de material informático',
      valor: 850000, status: 'em_cotacao',
      data: JSON.stringify({
        categoria: 'Equipamentos de Informática', departamento_solicitante: 'Tecnologia da Informação',
        orcamento_estimado: 900000, prazo_entrega_desejado: '2026-02-28', local_entrega: 'Sede FADA - Luanda',
        itens: [{ id: 'item_seed_1_1', descricao: 'Computadores portáteis', tipo: 'equipamento', quantidade: 5, unidade: 'unidade' }],
      }),
    }
  });

  // Ja em analise, com 2 cotacoes - pronto para testar "Aprovar Esta Cotação".
  const procurementEmAnalise = await prisma.procurement.create({
    data: {
      id: 'procurement_seed_3', createdById: compras.id, createdByName: compras.name,
      tipo: 'pedido_compra', numero: 'PED-2026-000003', descricao: 'Aquisição de viaturas de serviço',
      valor: 9500000, status: 'em_analise',
      data: JSON.stringify({
        categoria: 'Transporte e Logística', departamento_solicitante: 'Operações',
        orcamento_estimado: 9800000, prazo_entrega_desejado: '2026-03-31', local_entrega: 'Sede FADA - Luanda',
        itens: [{ id: 'item_seed_3_1', descricao: 'Viatura ligeira de passageiros', tipo: 'equipamento', quantidade: 1, unidade: 'unidade' }],
      }),
    }
  });

  // Concluido: cotacao ja aprovada, com Ordem de Compra emitida e recebida -
  // e o que gera automaticamente a factura "fact_seed_rascunho" abaixo.
  const procurementAprovado = await prisma.procurement.create({
    data: {
      id: 'procurement_seed_2', createdById: compras.id, createdByName: compras.name,
      tipo: 'pedido_compra', numero: 'PED-2026-000002', descricao: 'Aquisição de mobiliário de escritório',
      valor: 620000, status: 'concluido', fornecedorId: fornecedor2.id, fornecedor: fornecedor2.nome,
      data: JSON.stringify({
        categoria: 'Mobiliário', departamento_solicitante: 'Administração',
        orcamento_estimado: 650000, prazo_entrega_desejado: '2026-01-31', local_entrega: 'Sede FADA - Luanda',
        itens: [{ id: 'item_seed_2_1', descricao: 'Cadeiras ergonómicas', tipo: 'material', quantidade: 10, unidade: 'unidade' }],
      }),
    }
  });

  await prisma.purchaseQuotation.createMany({
    data: [
      { procurementId: procurementAguardando.id, fornecedorId: fornecedor1.id, fornecedor: fornecedor1.nome || 'Fornecedor', email: fornecedor1.email, valor: 830000, moeda: 'AOA', status: 'recebida', data: JSON.stringify({ itens_resposta: [{ item_descricao: 'Computadores portáteis', disponivel: 'sim', quantidade_disponivel: 5, preco_unitario: 166000, prazo_entrega_dias: 10 }] }) },
      { procurementId: procurementAguardando.id, fornecedorId: fornecedor2.id, fornecedor: fornecedor2.nome || 'Fornecedor', email: fornecedor2.email, valor: 870000, moeda: 'AOA', status: 'recebida', data: JSON.stringify({ itens_resposta: [{ item_descricao: 'Computadores portáteis', disponivel: 'sim', quantidade_disponivel: 5, preco_unitario: 174000, prazo_entrega_dias: 15 }] }) },
      { procurementId: procurementEmAnalise.id, fornecedorId: fornecedor3.id, fornecedor: fornecedor3.nome || 'Fornecedor', email: fornecedor3.email, valor: 9200000, moeda: 'AOA', status: 'recebida', data: JSON.stringify({ itens_resposta: [{ item_descricao: 'Viatura ligeira de passageiros', disponivel: 'sim', quantidade_disponivel: 1, preco_unitario: 9200000, prazo_entrega_dias: 30 }] }) },
      { procurementId: procurementEmAnalise.id, fornecedorId: fornecedor1.id, fornecedor: fornecedor1.nome || 'Fornecedor', email: fornecedor1.email, valor: 9500000, moeda: 'AOA', status: 'recebida', data: JSON.stringify({ itens_resposta: [{ item_descricao: 'Viatura ligeira de passageiros', disponivel: 'sim', quantidade_disponivel: 1, preco_unitario: 9500000, prazo_entrega_dias: 20 }] }) },
    ]
  });

  const ordemCompra1 = await prisma.purchaseOrder.create({
    data: {
      numero: 'OC-2026-000001', procurementId: procurementAprovado.id, fornecedorId: fornecedor2.id, fornecedor: fornecedor2.nome || 'Fornecedor',
      valor: 620000, moeda: 'AOA', status: 'recebida', itens: JSON.stringify([{ descricao: 'Cadeiras ergonómicas', quantidade: 10 }]),
      createdById: compras.id, createdByName: compras.name, data: JSON.stringify({}),
    }
  });

  // ==========================================
  // FACTURAS EM VÁRIOS ESTADOS (incluindo Ordem de Pagamento)
  // ==========================================
 console.log('[Seed] Semeando facturas em vários estados...');
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
      dataEmissao: '2026-08-15',
      dataVencimento: '2026-09-14',
      data: JSON.stringify({ numero_fornecedor: 'FAT/1883/2026' })
    }
  });

  await prisma.factura.create({
    data: {
      id: 'fact_seed_validado', numero: 'FT-2026-002', fornecedor: fornecedor1.nome, nif: fornecedor1.nif,
      valor: 245000, moeda: 'AOA', status: 'validado', descricao: 'Manutenção de equipamento informático',
      dataEmissao: '2026-08-10', dataVencimento: '2026-09-09',
      createdById: fornecedor1.createdById, createdByName: fornecedor1.createdByName,
      data: JSON.stringify({ numero_fornecedor: 'FT/TSA/0456', fornecedor_id: fornecedor1.id, banco_nome: fornecedorUser1.bankName, banco_iban: fornecedorUser1.bankIban, banco_cidade: fornecedorUser1.bankCity, banco_pais: fornecedorUser1.bankCountry }),
    }
  });

  await prisma.factura.create({
    data: {
      id: 'fact_seed_rascunho', numero: 'FT-2026-003', fornecedor: fornecedor2.nome, nif: fornecedor2.nif,
      // "validado" e o estado real gerado automaticamente quando uma Ordem
      // de Compra e marcada como recebida (ja passou pela cotacao/aprovacao
      // do Procurement, so falta a aprovacao final em Gestao de Pagamento).
      valor: 620000, moeda: 'AOA', status: 'validado', descricao: procurementAprovado.descricao || 'Aquisição de mobiliário de escritório',
      dataEmissao: '2026-08-20', dataVencimento: '2026-09-19',
      purchaseOrderId: ordemCompra1.id, numeroOrdem: ordemCompra1.numero,
      createdById: compras.id, createdByName: compras.name,
      data: JSON.stringify({ origem: 'procurement', fornecedor_id: fornecedor2.id, banco_nome: fornecedorUser2.bankName, banco_iban: fornecedorUser2.bankIban, banco_cidade: fornecedorUser2.bankCity, banco_pais: fornecedorUser2.bankCountry }),
    }
  });

  await prisma.factura.create({
    data: {
      id: 'fact_seed_aprovado', numero: 'FT-2026-004', fornecedor: fornecedor3.nome, nif: fornecedor3.nif,
      valor: 380000, moeda: 'AOA', status: 'aprovado', descricao: 'Alojamento e bilhete de passagem - missão de serviço',
      dataEmissao: '2026-08-05', dataVencimento: '2026-09-04',
      numeroOrdemPagamento: 'OP/N.º 1001/2026',
      createdById: requester.id, createdByName: requester.name,
      data: JSON.stringify({
        numero_fornecedor: 'FAT/AGV/0221',
        fornecedor_id: fornecedor3.id,
        banco_nome: fornecedorUser3.bankName,
        banco_iban: fornecedorUser3.bankIban,
        banco_cidade: fornecedorUser3.bankCity, banco_pais: fornecedorUser3.bankCountry,
        ordem_pagamento: {
          numero_despacho: '080/2026',
          conta_debito: '2775407110001',
          banco_destino_cidade: fornecedorUser3.bankCity,
          banco_destino_pais: fornecedorUser3.bankCountry,
          gerada_em: new Date().toISOString(),
          gerada_por_id: financeiro.id,
          gerada_por_name: financeiro.name,
          assinaturas: [
            { papel: 'presidente', user_id: admin.id, nome: admin.name, assinado_em: new Date().toISOString() },
          ],
        },
      }),
    }
  });

  await prisma.factura.create({
    data: {
      id: 'fact_seed_submetido', numero: 'FT-2026-005', fornecedor: fornecedor1.nome, nif: fornecedor1.nif,
      valor: 95000, moeda: 'AOA', status: 'submetido_ao_banco', descricao: 'Licenças de software anual',
      dataEmissao: '2026-07-28', dataVencimento: '2026-08-27',
      numeroOrdemPagamento: 'OP/N.º 0998/2026',
      createdById: financeiro.id, createdByName: financeiro.name,
      data: JSON.stringify({ numero_fornecedor: 'FT/TSA/0501', fornecedor_id: fornecedor1.id, banco_nome: fornecedorUser1.bankName, banco_iban: fornecedorUser1.bankIban, banco_cidade: fornecedorUser1.bankCity, banco_pais: fornecedorUser1.bankCountry }),
    }
  });

  await prisma.factura.create({
    data: {
      id: 'fact_seed_pago', numero: 'FT-2025-118', fornecedor: fornecedor2.nome, nif: fornecedor2.nif,
      valor: 412000, moeda: 'AOA', status: 'pago', descricao: 'Fornecimento de insumos agrícolas',
      dataEmissao: '2026-07-10', dataVencimento: '2026-08-09',
      numeroOrdemPagamento: 'OP/N.º 0950/2026', paidAt: new Date('2026-08-10'),
      createdById: financeiro.id, createdByName: financeiro.name,
      data: JSON.stringify({ numero_fornecedor: 'FT/AIL/0118', fornecedor_id: fornecedor2.id, banco_nome: fornecedorUser2.bankName, banco_iban: fornecedorUser2.bankIban, banco_cidade: fornecedorUser2.bankCity, banco_pais: fornecedorUser2.bankCountry }),
    }
  });

  await prisma.factura.create({
    data: {
      id: 'fact_seed_rejeitado', numero: 'FT-2026-006', fornecedor: fornecedor3.nome, nif: fornecedor3.nif,
      valor: 58000, moeda: 'AOA', status: 'rejeitado', descricao: 'Serviço de catering não conforme com o pedido',
      dataEmissao: '2026-08-01', dataVencimento: '2026-08-31',
      createdById: fornecedor3.createdById, createdByName: fornecedor3.createdByName,
      data: JSON.stringify({ numero_fornecedor: 'FT/AGV/0155', fornecedor_id: fornecedor3.id, motivo_rejeicao: 'Serviço prestado não corresponde ao orçamento aprovado.' }),
    }
  });

  // ==========================================
  // MENSAGENS INTERNAS
  // ==========================================
 console.log('[Seed] Semeando mensagens internas...');
  await prisma.message.createMany({
    data: [
      {
        fromUserId: gerente.id, toUserId: financeiro.id,
        subject: 'Ponto de situação orçamental', content: 'Podes enviar-me o ponto de situação do orçamento até sexta-feira?',
        priority: 'medium', status: 'read', readAt: new Date(),
      },
      {
        fromUserId: financeiro.id, toUserId: gerente.id,
        subject: 'Re: Ponto de situação orçamental', content: 'Claro, envio até quinta-feira com os números actualizados.',
        priority: 'medium', status: 'unread',
      },
      {
        fromUserId: secretaria.id, toUserId: admin.id,
        subject: 'Confirmação de agenda', content: 'A agenda da próxima semana está confirmada, incluindo a reunião extraordinária de dia 20.',
        priority: 'high', status: 'unread',
      },
    ]
  });

  // ==========================================
  // NOTIFICAÇÕES
  // ==========================================
 console.log('[Seed] Semeando notificações...');
  await prisma.notification.createMany({
    data: [
      { id: 'notif_seed_1', userId: financeiro.id, email: financeiro.email, type: 'comunicacao_recebida', message: 'Nova comunicação interna de Compras: Pedido de cabimentação orçamental', resourceId: 'comunicacao_seed_4', read: false },
      { id: 'notif_seed_2', userId: gerente.id, email: gerente.email, type: 'meeting_scheduled', message: `${admin.name} agendou uma reunião: "${meeting1.title}" para ${meeting1.meetingDate}`, resourceId: meeting1.id, read: true },
      { id: 'notif_seed_3', userId: compras.id, email: compras.email, type: 'factura_paga', message: 'A factura FT-2025-118 foi paga.', resourceId: 'fact_seed_pago', read: false },
    ]
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
