# Craft — SaaS Platform

> Estrategia creativa con datos para pequeños negocios.  
> Landing page + panel admin privado + API REST segura.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-blue)](https://expressjs.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange)](https://jwt.io)
[![License](https://img.shields.io/badge/License-MIT-gray)](LICENSE)

---

## 🎭 Demo en vivo

| URL | Descripción |
|-----|-------------|
| `/` | Landing page pública |
| `/admin` | Panel admin privado |

**Credenciales demo:**  
Usuario: `demo` · Contraseña: `demo1234`

---

## 🏗️ Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 vanilla (zero dependencies) |
| Backend | Node.js 18 + Express 4 |
| Auth | JWT + bcrypt (12 rounds) |
| DB | JSON file (drop-in para MongoDB/PostgreSQL) |
| Seguridad | Helmet, CORS, rate limiting, express-validator |
| Deploy | Vercel (Node serverless) |

---

## 📁 Estructura del proyecto

```
craft-saas/
├── index.html              ← Landing page pública (no modificar)
├── server.js               ← Express server principal
├── vercel.json             ← Configuración de deploy
├── package.json
├── .env.example            ← Template de variables de entorno
├── .gitignore
│
├── admin/
│   └── index.html          ← Panel admin (SPA, protegida por JWT)
│
├── api/
│   ├── db.js               ← Capa de datos (JSON, reemplazable)
│   ├── middleware/
│   │   └── auth.js         ← JWT verify + RBAC + activity logger
│   └── routes/
│       ├── auth.js         ← POST /login, GET /me, POST /logout
│       ├── users.js        ← CRUD usuarios + gestión de roles
│       ├── leads.js        ← Leads + export CSV
│       ├── offers.js       ← Ofertas activas/inactivas
│       ├── coupons.js      ← Cupones + validación pública
│       ├── chatbot.js      ← Config chatbot + respuestas
│       ├── settings.js     ← Config global + urgency bar
│       └── logs.js         ← Logs de auditoría
│
├── scripts/
│   ├── seed-admin.js       ← Crea Super Admin en producción
│   └── demo-seed.js        ← Datos demo para portfolio
│
└── data/
    └── .gitkeep            ← db.json se crea aquí en runtime
```

---

## 🔐 Seguridad implementada

- **JWT** firmado con secreto de 64+ caracteres, expira en 8h
- **bcrypt** con 12 rounds para hashing de contraseñas
- **Rate limiting**: 200 req/15min en API, 10 intentos/15min en auth
- **Helmet**: CSP, X-Frame-Options, HSTS y otros headers
- **express-validator**: sanitización y validación de todos los inputs
- **RBAC**: 4 roles con permisos granulares (superadmin → soporte)
- **Activity logs**: cada acción queda registrada con usuario, IP y timestamp
- **Timing attack prevention**: bcrypt fake compare en login fallido
- **Secrets in env**: ningún secreto hardcodeado en el código

---

## 🚀 Instalación local

### Requisitos
- Node.js 18+
- npm 9+

### Pasos

```bash
# 1. Clonar
git clone https://github.com/TU-USUARIO/craft-saas.git
cd craft-saas

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores reales

# 4. Crear Super Admin
npm run seed

# 5. Iniciar en desarrollo
npm run dev

# O para modo demo (sin .env):
npm start
```

Abre http://localhost:3000 (sitio) y http://localhost:3000/admin (panel).

---

## ☁️ Deploy en Vercel

### Opción A — Vercel Dashboard (recomendado)

1. Sube el repo a GitHub
2. Ve a [vercel.com](https://vercel.com) → **New Project**
3. Importa el repo
4. En **Environment Variables**, agrega:

| Variable | Valor |
|----------|-------|
| `JWT_SECRET` | (genera con el comando abajo) |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://tu-dominio.vercel.app` |

5. Click **Deploy**

### Generar JWT_SECRET seguro

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Opción B — Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
```

### Post-deploy: crear Super Admin en producción

```bash
# Con Vercel CLI, ejecuta el seed remotamente:
ADMIN_USERNAME=tu_usuario ADMIN_EMAIL=tu@email.com ADMIN_PASSWORD=tu_pass \
JWT_SECRET=tu_jwt_secret node scripts/seed-admin.js
```

> **Nota**: En Vercel, la DB JSON es efímera (se resetea en cada deploy).  
> Para producción real, migra a PostgreSQL (Supabase, Neon) o MongoDB Atlas.

---

## 👤 Roles y permisos

| Permiso | Super Admin | Admin | Editor | Soporte |
|---------|:-----------:|:-----:|:------:|:-------:|
| Usuarios (CRUD) | ✅ | ✅* | ❌ | ❌ |
| Leads (ver/exportar/eliminar) | ✅ | ✅ | Ver | Ver |
| Ofertas (CRUD) | ✅ | ✅ | ✅ | ❌ |
| Cupones (CRUD) | ✅ | ✅ | ✅ | ❌ |
| Chatbot (config) | ✅ | ✅ | ✅ | Ver |
| Settings / Urgency bar | ✅ | ✅ | Ver | ❌ |
| Logs de auditoría | ✅ | ✅ | ❌ | Ver |
| Eliminar Super Admins | ✅ | ❌ | ❌ | ❌ |

*Admin no puede eliminar ni crear Super Admins.

---

## 🔌 API REST

### Auth
```
POST /api/auth/login    { username, password }  → { token, user }
GET  /api/auth/me       Authorization: Bearer…  → user object
POST /api/auth/logout   Authorization: Bearer…  → { ok: true }
```

### Recursos protegidos (requieren JWT)
```
GET  /api/users                  → lista usuarios
POST /api/users                  → crear usuario
PATCH /api/users/:id             → editar usuario
DELETE /api/users/:id            → eliminar (solo superadmin)

GET  /api/leads                  → leads con filtros ?search=&plan=
GET  /api/leads/export           → descarga CSV
POST /api/leads/public           → endpoint público (landing page)
DELETE /api/leads/:id            → eliminar lead

GET  /api/offers                 → lista ofertas
POST /api/offers                 → crear oferta
PATCH /api/offers/:id            → actualizar
DELETE /api/offers/:id           → eliminar

GET  /api/coupons                → lista cupones
GET  /api/coupons/validate/:code → validación pública
POST /api/coupons                → crear cupón
PATCH /api/coupons/:id           → actualizar
DELETE /api/coupons/:id          → eliminar

GET  /api/chatbot                → config chatbot
PATCH /api/chatbot               → actualizar

GET  /api/settings               → configuración
GET  /api/settings/public        → urgency bar (público, landing)
PATCH /api/settings              → actualizar

GET  /api/logs?limit=100         → logs de auditoría
```

---

## 🤖 Conectar N8N (chatbot)

1. En N8N, crea un workflow con trigger **Webhook**
2. Copia la URL del webhook
3. En el panel admin → **Chatbot** → pega la URL en "Webhook N8N"
4. El webhook recibe: `{ "message": "texto", "sessionId": "id" }`
5. Tu workflow N8N debe responder: `{ "reply": "respuesta" }`

---

## 💳 Conectar PayPal

### Con cuenta personal (inmediato)
1. App PayPal → Solicitar dinero → Crear enlace de pago
2. Crea un enlace por cada plan ($199, $299, $499 MXN)
3. En `index.html`, busca `paypalLinks` y pega tus URLs

### Con cuenta Business (recomendado para producción)
1. [developer.paypal.com](https://developer.paypal.com) → Crear App
2. Copia el **Client ID de producción**
3. Agrega el SDK de PayPal Checkout y usa PayPal Buttons por plan

---

## 📄 Licencia

MIT © 2026 Craft
