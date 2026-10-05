/**
 * Restaura uma copia de seguranca JSON (gerada em Administracao -> Copias de
 * seguranca, com PostgreSQL) para a base indicada em DATABASE_URL.
 *
 * Uso:
 *   1. Base PostgreSQL vazia com as migracoes aplicadas (npx prisma migrate deploy)
 *   2. node scripts/restaurar-backup-json.js backups/sipar-AAAA-MM-DD....json
 *
 * Recusa correr se a base ja tiver dados (para nunca misturar), a menos que
 * se passe --forcar (nesse caso ignora registos que ja existam).
 */

const fs = require('fs');
const { PrismaClient, Prisma } = require('@prisma/client');

const ficheiro = process.argv.find((a, i) => i > 1 && !a.startsWith('--'));
const forcar = process.argv.includes('--forcar');
if (!ficheiro) {
  console.error('Indique o ficheiro: node scripts/restaurar-backup-json.js backups/sipar-....json');
  process.exit(1);
}

const prisma = new PrismaClient();
const modelos = Prisma.dmmf.datamodel.models;
const delegate = (nome) => prisma[nome.charAt(0).toLowerCase() + nome.slice(1)];

function ordenar() {
  const deps = new Map(modelos.map((m) => [m.name, new Set(
    m.fields.filter((f) => f.kind === 'object' && f.relationFromFields?.length && f.type !== m.name).map((f) => f.type)
  )]));
  const ordem = [];
  const feitos = new Set();
  while (ordem.length < modelos.length) {
    const prontos = modelos.filter((m) => !feitos.has(m.name) && [...deps.get(m.name)].every((d) => feitos.has(d)));
    if (prontos.length === 0) throw new Error('Dependencias circulares entre modelos');
    for (const m of prontos) { ordem.push(m); feitos.add(m.name); }
  }
  return ordem;
}

(async () => {
  const backup = JSON.parse(fs.readFileSync(ficheiro, 'utf8'));
  if (backup.formato !== 'sipar-backup-json') throw new Error('Ficheiro nao e uma copia de seguranca JSON do SIPAR.');
  const ordem = ordenar();

  if (!forcar) {
    for (const m of ordem) {
      if ((await delegate(m.name).count()) > 0) {
        console.error(`A base ja tem dados (${m.name}). Use uma base vazia, ou --forcar.`);
        process.exit(1);
      }
    }
  }

  let total = 0;
  for (const m of ordem) {
    const linhas = backup.tabelas[m.name] || [];
    const bigints = m.fields.filter((f) => f.type === 'BigInt').map((f) => f.name);
    const dados = linhas.map((l) => {
      for (const c of bigints) if (l[c] != null) l[c] = BigInt(l[c]);
      return l;
    });
    for (let i = 0; i < dados.length; i += 500) {
      await delegate(m.name).createMany({ data: dados.slice(i, i + 500), skipDuplicates: forcar });
    }
    total += dados.length;
    if (dados.length) console.log(`- ${m.name}: ${dados.length}`);
  }
  console.log(`\nRestaurados ${total} registos de ${ficheiro} (copia de ${backup.criado_em}).`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error('Falhou:', e.message);
  await prisma.$disconnect();
  process.exit(1);
});
