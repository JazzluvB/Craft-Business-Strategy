#!/usr/bin/env node
/**
 * craft-landing/scripts/seed-admin.js
 * Crea el Super Admin inicial.
 * Uso: node scripts/seed-admin.js
 * Requiere .env con ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');

// Validar vars de entorno
const { ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD, BCRYPT_ROUNDS } = process.env;
if (!ADMIN_USERNAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('\n❌ Faltan variables en .env:');
  console.error('   ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD\n');
  process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
  console.error('\n❌ ADMIN_PASSWORD debe tener mínimo 8 caracteres\n');
  process.exit(1);
}

const db = require('../api/db');

async function seed() {
  console.log('\n🌱 Iniciando seed del Super Admin...\n');

  // Check if superadmin already exists
  const existing = db.getUserByUsername(ADMIN_USERNAME) || db.getUserByEmail(ADMIN_EMAIL);
  if (existing) {
    console.log('⚠️  Ya existe un usuario con ese username o email.');
    console.log('   Si quieres recrearlo, elimina data/db.json y vuelve a correr el seed.\n');
    process.exit(0);
  }

  const rounds = parseInt(BCRYPT_ROUNDS) || 12;
  console.log(`   Hasheando contraseña con ${rounds} rounds...`);
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, rounds);

  const user = db.createUser({
    id:           uuid(),
    username:     ADMIN_USERNAME,
    email:        ADMIN_EMAIL,
    name:         'Super Admin',
    role:         'superadmin',
    passwordHash,
    active:       true,
    createdAt:    new Date().toISOString(),
    updatedAt:    new Date().toISOString(),
    lastLogin:    null
  });

  db.addLog({
    userId:   user.id,
    username: user.username,
    action:   'SEED_SUPERADMIN_CREATED',
    ip:       'localhost'
  });

  console.log('✅ Super Admin creado exitosamente:\n');
  console.log(`   Username : ${user.username}`);
  console.log(`   Email    : ${user.email}`);
  console.log(`   Role     : ${user.role}`);
  console.log(`   ID       : ${user.id}`);
  console.log('\n🔐 Guarda estas credenciales en un lugar seguro.');
  console.log('   La contraseña NO se puede recuperar — solo resetear.\n');
  console.log('➡️  Ahora puedes ir a /admin para iniciar sesión.\n');
}

seed().catch(err => {
  console.error('❌ Error en seed:', err.message);
  process.exit(1);
});
