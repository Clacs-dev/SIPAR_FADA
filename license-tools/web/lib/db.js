// Base de dados local (SQLite embutido do Node) com o historico de todas as
// licencas emitidas por esta ferramenta. Nunca sai desta maquina - guarda-se
// ao lado das chaves do vendor, tal como elas (ver .gitignore).
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(path.join(DATA_DIR, 'clients.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    licenseId        TEXT PRIMARY KEY,
    customerName     TEXT NOT NULL,
    licenseType      TEXT NOT NULL,
    startsAt         TEXT NOT NULL,
    expiresAt        TEXT,
    maxUsers         INTEGER,
    maxAdmins        INTEGER,
    modules          TEXT NOT NULL,
    features         TEXT NOT NULL,
    offlineGraceDays INTEGER NOT NULL,
    issuedAt         TEXT NOT NULL,
    licenseFile      TEXT NOT NULL,
    fingerprint      TEXT,
    certFile         TEXT,
    activatedAt      TEXT,
    revoked          INTEGER NOT NULL DEFAULT 0,
    createdAt        TEXT NOT NULL,
    updatedAt        TEXT NOT NULL
  );
`);

function listClients() {
  return db.prepare('SELECT * FROM clients ORDER BY createdAt DESC').all();
}

function getClient(licenseId) {
  return db.prepare('SELECT * FROM clients WHERE licenseId = ?').get(licenseId) || null;
}

function insertClient(row) {
  db.prepare(`
    INSERT INTO clients (
      licenseId, customerName, licenseType, startsAt, expiresAt, maxUsers, maxAdmins,
      modules, features, offlineGraceDays, issuedAt, licenseFile,
      fingerprint, certFile, activatedAt, revoked, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, 0, ?, ?)
  `).run(
    row.licenseId, row.customerName, row.licenseType, row.startsAt, row.expiresAt,
    row.maxUsers, row.maxAdmins, row.modules, row.features, row.offlineGraceDays,
    row.issuedAt, row.licenseFile, row.createdAt, row.updatedAt
  );
}

// Renovacao: mantem o mesmo licenseId e NUNCA mexe em fingerprint/certFile/activatedAt
// (e precisamente isso que evita ter de pedir nova ativacao ao cliente).
function renewClient(licenseId, row) {
  db.prepare(`
    UPDATE clients SET
      customerName = ?, licenseType = ?, startsAt = ?, expiresAt = ?, maxUsers = ?, maxAdmins = ?,
      modules = ?, features = ?, offlineGraceDays = ?, issuedAt = ?, licenseFile = ?, updatedAt = ?
    WHERE licenseId = ?
  `).run(
    row.customerName, row.licenseType, row.startsAt, row.expiresAt, row.maxUsers, row.maxAdmins,
    row.modules, row.features, row.offlineGraceDays, row.issuedAt, row.licenseFile, row.updatedAt,
    licenseId
  );
}

function setActivation(licenseId, { fingerprint, certFile, activatedAt }) {
  db.prepare(`
    UPDATE clients SET fingerprint = ?, certFile = ?, activatedAt = ?, updatedAt = ?
    WHERE licenseId = ?
  `).run(fingerprint, certFile, activatedAt, new Date().toISOString(), licenseId);
}

function setRevoked(licenseId, revoked) {
  db.prepare('UPDATE clients SET revoked = ?, updatedAt = ? WHERE licenseId = ?')
    .run(revoked ? 1 : 0, new Date().toISOString(), licenseId);
}

function deleteClient(licenseId) {
  db.prepare('DELETE FROM clients WHERE licenseId = ?').run(licenseId);
}

function listRevokedIds() {
  return db.prepare('SELECT licenseId FROM clients WHERE revoked = 1').all().map((r) => r.licenseId);
}

module.exports = {
  DATA_DIR, listClients, getClient, insertClient, renewClient,
  setActivation, setRevoked, deleteClient, listRevokedIds,
};
