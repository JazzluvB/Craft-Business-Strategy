/**
 * scripts/demo-seed.js
 * Seeds realistic demo data for portfolio / interview demos.
 * Called automatically in DEMO MODE from server.js
 * Safe to call multiple times — checks before inserting.
 */
const bcrypt   = require('bcryptjs');
const { v4: uuid } = require('uuid');
const db       = require('../api/db');

module.exports = async function demoSeed() {
  const users = db.getUsers();

  // ── DEMO USERS ─────────────────────────────────────────────
  if (!users.find(u => u.username === 'demo')) {
    const hash = await bcrypt.hash('demo1234', 10);

    const demoUsers = [
      { username: 'demo',      email: 'demo@craft.com',    name: 'Super Admin Demo', role: 'superadmin' },
      { username: 'admin',     email: 'admin@craft.com',   name: 'Ana García',       role: 'admin'      },
      { username: 'editor',    email: 'editor@craft.com',  name: 'Carlos López',     role: 'editor'     },
      { username: 'soporte',   email: 'soporte@craft.com', name: 'Sofía Ramírez',    role: 'soporte'    },
    ];

    for (const u of demoUsers) {
      db.createUser({
        id: uuid(), ...u, passwordHash: hash,
        active: true,
        createdAt: randomDate(60), updatedAt: new Date().toISOString(),
        lastLogin: randomDate(2)
      });
    }
    console.log('    ✓ Demo users seeded');
  }

  // ── DEMO LEADS ─────────────────────────────────────────────
  if (db.getLeads().length < 5) {
    const leads = [
      { email: 'ana.martinez@gmail.com',   business: 'Cafetería La Paloma',     plan: 'Pro'     },
      { email: 'carlos.reyes@outlook.com', business: 'Barbería El Clan',         plan: 'Pro'     },
      { email: 'sofia.nunez@hotmail.com',  business: 'Pastelería Dulce Origen',  plan: 'Premium' },
      { email: 'marco@restaurante.mx',     business: 'Tacos El Compa',           plan: 'Básico'  },
      { email: 'lucia@boutique.com',       business: 'Boutique Luna',            plan: 'Pro'     },
      { email: 'pedro@gym.mx',             business: 'Gym FitZone',              plan: 'Premium' },
      { email: 'maria@spazen.com',         business: 'Spa Zen',                  plan: 'Básico'  },
      { email: 'jose@panaderia.mx',        business: 'Panadería El Trigal',      plan: 'Pro'     },
    ];
    for (const l of leads) {
      db.createLead({ id: uuid(), ...l, source: 'landing', ip: '127.0.0.1', createdAt: randomDate(30) });
    }
    console.log('    ✓ Demo leads seeded');
  }

  // ── DEMO OFFERS ────────────────────────────────────────────
  if (db.getOffers().length < 2) {
    db.createOffer({
      id: uuid(), title: 'Oferta de lanzamiento — 20% off primer mes',
      discount: 20, plan: 'all', description: 'Oferta especial para early adopters',
      active: true, createdAt: randomDate(15)
    });
    db.createOffer({
      id: uuid(), title: 'Black Friday — 30% off Plan Pro',
      discount: 30, plan: 'pro', description: 'Solo por tiempo limitado',
      active: false, createdAt: randomDate(7)
    });
    console.log('    ✓ Demo offers seeded');
  }

  // ── DEMO COUPONS ───────────────────────────────────────────
  if (db.getCoupons().length < 2) {
    db.createCoupon({
      id: uuid(), code: 'CRAFT20', type: 'percent', discount: 20,
      plan: 'all', description: 'Cupón de bienvenida', active: true,
      usesCount: 14, usesLimit: 100, expiresAt: futureDate(60),
      createdAt: randomDate(20)
    });
    db.createCoupon({
      id: uuid(), code: 'PRIMERAÑO', type: 'percent', discount: 15,
      plan: 'premium', description: 'Descuento anual exclusivo', active: true,
      usesCount: 3, usesLimit: null, expiresAt: null,
      createdAt: randomDate(10)
    });
    db.createCoupon({
      id: uuid(), code: 'BIENVENIDO', type: 'fixed', discount: 50,
      plan: 'basico', description: '$50 MXN de descuento primer mes', active: false,
      usesCount: 32, usesLimit: 50, expiresAt: futureDate(-5),
      createdAt: randomDate(45)
    });
    console.log('    ✓ Demo coupons seeded');
  }

  // ── DEMO SETTINGS ──────────────────────────────────────────
  const s = db.getSettings();
  if (!s.urgencyEnd) {
    db.updateSettings({
      siteName:     'Craft',
      urgencyLabel: 'Oferta de lanzamiento termina en',
      urgencyEnd:   futureDate(7),
      trialDays:    14
    });
    console.log('    ✓ Demo settings seeded');
  }

  // ── DEMO CHATBOT ───────────────────────────────────────────
  const cb = db.getChatbot();
  if (!cb.responses || cb.responses.length === 0) {
    db.updateChatbot({
      active: true,
      n8nUrl: '',
      responses: [
        { keyword: 'precio',         reply: 'Básico $199/mes · Pro $299/mes · Premium $499/mes MXN. Todos incluyen 14 días gratis.' },
        { keyword: 'cuánto cuesta',  reply: 'Tenemos 3 planes: Básico $199, Pro $299, Premium $499 MXN/mes. ¿Te ayudo a elegir?' },
        { keyword: 'funciona',       reply: 'Craft analiza tu negocio y objetivo, y genera un plan de contenido completo. Puedes probarlo gratis arriba.' },
        { keyword: 'cancelar',       reply: 'Puedes cancelar cuando quieras, sin penalizaciones. Tu acceso dura hasta el fin del periodo pagado.' },
        { keyword: 'paypal',         reply: 'Los pagos son vía PayPal, 100% seguros. Puedes pagar con cuenta PayPal o cualquier tarjeta.' },
        { keyword: 'garantía',       reply: '30 días de garantía de devolución. Si no estás satisfecho, te devolvemos el 100% de tu primer mes.' },
      ]
    });
    console.log('    ✓ Demo chatbot seeded');
  }

  // ── DEMO LOGS ──────────────────────────────────────────────
  if (db.getLogs(5).length < 3) {
    const actions = [
      { action: 'LOGIN_OK',       username: 'demo',    role: 'superadmin' },
      { action: 'USER_CREATE',    username: 'demo',    role: 'superadmin' },
      { action: 'COUPON_CREATE',  username: 'admin',   role: 'admin'      },
      { action: 'OFFER_UPDATE',   username: 'editor',  role: 'editor'     },
      { action: 'LOGIN_FAILED',   username: 'unknown', role: null         },
      { action: 'SETTINGS_UPDATE',username: 'demo',    role: 'superadmin' },
      { action: 'LEAD_DELETE',    username: 'admin',   role: 'admin'      },
      { action: 'LOGIN_OK',       username: 'soporte', role: 'soporte'    },
    ];
    for (const a of actions) {
      db.addLog({ ...a, ip: '127.0.0.1', method: 'POST', path: '/api/'+a.action.toLowerCase().replace('_','/') });
    }
    console.log('    ✓ Demo logs seeded');
  }
};

// ── HELPERS ────────────────────────────────────────────────────
function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString();
}
function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
