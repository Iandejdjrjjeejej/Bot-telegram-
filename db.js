const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDb() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ ebooks: [], offers: [] }, null, 2));
  }
}

function readDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { ebooks: [], offers: [] };
  }
}

function writeDb(db) {
  ensureDb();
  const tmp = `${DB_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function id() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function addEbook(data) {
  const db = readDb();
  const ebook = { id: id(), createdAt: new Date().toISOString(), ...data };
  db.ebooks.unshift(ebook);
  writeDb(db);
  return ebook;
}

function listEbooks() { return readDb().ebooks; }

function searchEbooks(term) {
  const q = String(term || '').trim().toLowerCase();
  if (!q) return [];
  return listEbooks().filter(e => [e.title, e.category, e.description].some(v => String(v || '').toLowerCase().includes(q)));
}

function deleteEbook(ebookId) {
  const db = readDb();
  const ebook = db.ebooks.find(e => e.id === ebookId);
  db.ebooks = db.ebooks.filter(e => e.id !== ebookId);
  writeDb(db);
  return ebook;
}

function addOffer(data) {
  const db = readDb();
  const offer = { id: id(), createdAt: new Date().toISOString(), ...data };
  db.offers.unshift(offer);
  writeDb(db);
  return offer;
}

function listOffers() { return readDb().offers; }

function deleteOffer(offerId) {
  const db = readDb();
  const offer = db.offers.find(o => o.id === offerId);
  db.offers = db.offers.filter(o => o.id !== offerId);
  writeDb(db);
  return offer;
}

module.exports = { addEbook, listEbooks, searchEbooks, deleteEbook, addOffer, listOffers, deleteOffer };
