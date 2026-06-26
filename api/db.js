/**
 * craft-landing/api/db.js
 * Base de datos ligera en JSON — no requiere PostgreSQL ni MongoDB.
 * Para producción escala fácilmente a cualquier DB real.
 */
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

const DEFAULT = {
  users:      [],
  leads:      [],
  offers:     [],
  coupons:    [],
  chatbot:    { active: true, n8nUrl: '', responses: [] },
  logs:       [],
  settings:   {
    siteName:     'Craft',
    urgencyEnd:   null,
    urgencyLabel: 'Oferta de lanzamiento termina en',
    trialDays:    14
  }
};

function read() {
  try {
    if (!fs.existsSync(DB_PATH)) return JSON.parse(JSON.stringify(DEFAULT));
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch { return JSON.parse(JSON.stringify(DEFAULT)); }
}

function write(data) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

const db = {
  // ── USERS ──────────────────────────────────────────────────
  getUsers:   ()        => read().users,
  getUserById:(id)      => read().users.find(u => u.id === id),
  getUserByEmail:(e)    => read().users.find(u => u.email === e),
  getUserByUsername:(u) => read().users.find(x => x.username === u),

  createUser(user) {
    const d = read(); d.users.push(user); write(d); return user;
  },
  updateUser(id, updates) {
    const d = read();
    const i = d.users.findIndex(u => u.id === id);
    if (i === -1) return null;
    d.users[i] = { ...d.users[i], ...updates, updatedAt: new Date().toISOString() };
    write(d); return d.users[i];
  },
  deleteUser(id) {
    const d = read();
    d.users = d.users.filter(u => u.id !== id);
    write(d);
  },

  // ── LEADS ──────────────────────────────────────────────────
  getLeads:   ()    => read().leads,
  createLead(lead) {
    const d = read(); d.leads.push(lead); write(d); return lead;
  },
  deleteLead(id) {
    const d = read(); d.leads = d.leads.filter(l => l.id !== id); write(d);
  },

  // ── OFFERS / COUPONS ───────────────────────────────────────
  getOffers:  ()    => read().offers,
  createOffer(o)    { const d=read(); d.offers.push(o); write(d); return o; },
  updateOffer(id,u) {
    const d=read(); const i=d.offers.findIndex(x=>x.id===id);
    if(i===-1) return null;
    d.offers[i]={...d.offers[i],...u,updatedAt:new Date().toISOString()};
    write(d); return d.offers[i];
  },
  deleteOffer(id)   { const d=read(); d.offers=d.offers.filter(x=>x.id!==id); write(d); },

  getCoupons: ()    => read().coupons,
  getCouponByCode:(c) => read().coupons.find(x=>x.code===c),
  createCoupon(c)   { const d=read(); d.coupons.push(c); write(d); return c; },
  updateCoupon(id,u){
    const d=read(); const i=d.coupons.findIndex(x=>x.id===id);
    if(i===-1) return null;
    d.coupons[i]={...d.coupons[i],...u,updatedAt:new Date().toISOString()};
    write(d); return d.coupons[i];
  },
  deleteCoupon(id)  { const d=read(); d.coupons=d.coupons.filter(x=>x.id!==id); write(d); },

  // ── CHATBOT ────────────────────────────────────────────────
  getChatbot:  ()   => read().chatbot,
  updateChatbot(u)  { const d=read(); d.chatbot={...d.chatbot,...u}; write(d); return d.chatbot; },

  // ── LOGS ───────────────────────────────────────────────────
  getLogs:(limit=200) => read().logs.slice(-limit).reverse(),
  addLog(entry) {
    const d = read();
    d.logs.push({ ...entry, ts: new Date().toISOString() });
    if (d.logs.length > 1000) d.logs = d.logs.slice(-1000);
    write(d);
  },

  // ── SETTINGS ───────────────────────────────────────────────
  getSettings:  ()  => read().settings,
  updateSettings(u) { const d=read(); d.settings={...d.settings,...u}; write(d); return d.settings; }
};

module.exports = db;
