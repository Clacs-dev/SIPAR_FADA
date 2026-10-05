/**
 * Copia todos os dados da base SQLite antiga (prisma/dev.db) para a base
 * PostgreSQL indicada em DATABASE_URL.
 *
 * Uso (Node 22.5+, por causa do modulo node:sqlite):
 *   1. DATABASE_URL a apontar para o PostgreSQL (vazio, com as migracoes
 *      aplicadas: npx prisma migrate deploy)
 *   2. node scripts/migrar-sqlite-para-postgres.js [caminho/para/dev.db]
 *
 * - Usa o schema do Prisma (DMMF) para saber as tabelas, os tipos e a ordem
 *   certa de insercao (primeiro as tabelas de que as outras dependem).
 * - Converte os tipos do SQLite: datas (milissegundos) -> DateTime,
 *   booleanos 0/1 -> true/false.
 * - Recusa correr se o PostgreSQL ja tiver dados (para nunca duplicar nem
 *   misturar), a menos que se passe --forcar.
 */

const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { PrismaClient, Prisma } = require('@prisma/client');

const ficheiro = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) || path.join(__dirname, '../prisma/dev.db');
const forcar = process.argv.includes('--forcar');
const LOTE = 500;

if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL || '')) {
  console.error('DATABASE_URL tem de apontar para o PostgreSQL de destino (postgresql://...).');
  process.exit(1);
}

const prisma = new PrismaClient();
const sqlite = new DatabaseSync(ficheiro, { readOnly: true });
const modelos = Prisma.dmmf.datamodel.models;

function delegate(nome) {
  return prisma[nome.charAt(0).toLowerCase() + nome.slice(1)];
}

// Ordem de insercao: um modelo so entra depois dos modelos para que aponta.
function ordenar() {
  const deps = new Map(modelos.map((m) => [m.name, new Set(
    m.fields.filter((f) => f.kind === 'object' && f.relationFromFields?.length && f.type !== m.name).map((f) => f.type)
  )]));
  const ordem = [];
  const feitos = new Set();
  while (ordem.length < modelos.length) {
    const prontos = modelos.filter((m) => !feitos.has(m.name) && [...deps.get(m.name)].every((d) => feitos.has(d)));
    if (prontos.length === 0) throw new Error('Dependencias circulares entre modelos: ' + modelos.filter((m) => !feitos.has(m.name)).map((m) => m.name).join(', '));
    for (const m of prontos) { ordem.push(m); feitos.add(m.name); }
  }
  return ordem;
}

function converter(valor, campo) {
  if (valor === null || valor === undefined) return valor;
  switch (campo.type) {
    case 'DateTime': return new Date(typeof valor === 'number' || /^\d+$/.test(String(valor)) ? Number(valor) : valor);
    case 'Boolean': return valor === 1 || valor === true || valor === '1' || valor === 'true';
    case 'Int': return Number(valor);
    case 'Float': return Number(valor);
    case 'BigInt': return BigInt(valor);
    default: return valor;
  }
}

(async () => {
  const tabelasSqlite = new Set(sqlite.prepare("select name from sqlite_master where type='table'").all().map((t) => t.name));
  const ordem = ordenar();

  if (!forcar) {
    for (const m of ordem) {
      const n = await delegate(m.name).count();
      if (n > 0) {
        console.error(`O PostgreSQL ja tem dados (${m.name}: ${n} registos). Use uma base vazia, ou --forcar para continuar.`);
        process.exit(1);
      }
    }
  }

  let total = 0;
  for (const m of ordem) {
    const tabela = m.dbName || m.name;
    if (!tabelasSqlite.has(tabela)) { console.log(`- ${m.name}: nao existe no SQLite, ignorado`); continue; }
    const escalares = m.fields.filter((f) => f.kind === 'scalar' || f.kind === 'enum');
    const linhas = sqlite.prepare(`select * from "${tabela}"`).all();
    const dados = linhas.map((linha) => {
      const registo = {};
      for (const f of escalares) {
        const coluna = f.dbName || f.name;
        if (coluna in linha) registo[f.name] = converter(linha[coluna], f);
      }
      return registo;
    });
    for (let i = 0; i < dados.length; i += LOTE) {
      await delegate(m.name).createMany({ data: dados.slice(i, i + LOTE), skipDuplicates: forcar });
    }
    total += dados.length;
    console.log(`- ${m.name}: ${dados.length}`);
  }

  // Sequencias autoincrement (se existirem) acompanham os ids copiados.
  for (const m of ordem) {
    const id = m.fields.find((f) => f.isId && f.type === 'Int' && f.default?.name === 'autoincrement');
    if (!id) continue;
    const tabela = m.dbName || m.name;
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"${tabela}"', '${id.name}'), COALESCE((SELECT MAX("${id.name}") FROM "${tabela}"), 1))`);
  }

  console.log(`\nConcluido: ${total} registos copiados de ${ficheiro} para o PostgreSQL.`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('Falhou:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
