# Craft — SaaS Marketing Platform

> Full-stack SaaS platform for digital marketing strategy aimed at small businesses.
> Includes a public landing page, a private admin dashboard, and a secure REST API.

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4.18-blue)](https://expressjs.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-orange)](https://jwt.io)
[![License](https://img.shields.io/badge/License-AGPL--3.0-lightgrey)](LICENSE)

---

## Live Demo

| Route | Description |
|-------|-------------|
| `/` | Public landing page |
| `/admin` | Private admin panel |

**Demo credentials**  
Username: `demo` — Password: `demo1234`

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5 + CSS3 — zero dependencies |
| Backend | Node.js 18 + Express 4 |
| Authentication | JWT + bcrypt (12 rounds) |
| Database | JSON flat file — drop-in for MongoDB or PostgreSQL |
| Security | Helmet, CORS, rate limiting, express-validator |
| Deployment | Vercel (Node.js serverless) |

---

## Project Structure

```
craft-saas/
├── index.html              — Public landing page
├── server.js               — Express entry point
├── vercel.json             — Vercel deployment config
├── package.json
├── .env.example            — Environment variable template
├── .gitignore
│
├── admin/
│   └── index.html          — Admin SPA (JWT-protected)
│
├── api/
│   ├── db.js               — Data layer (replaceable)
│   ├── middleware/
│   │   └── auth.js         — JWT verification + RBAC + activity logger
│   └── routes/
│       ├── auth.js         — Login, /me, logout
│       ├── users.js        — User CRUD + role management
│       ├── leads.js        — Lead management + CSV export
│       ├── offers.js       — Offer management
│       ├── coupons.js      — Coupon management + public validation
│       ├── chatbot.js      — Chatbot config + N8N integration
│       ├── settings.js     — Global config + urgency bar
│       └── logs.js         — Audit logs
│
├── scripts/
│   ├── seed-admin.js       — Creates Super Admin for production
│   └── demo-seed.js        — Seeds demo data for portfolio
│
└── data/
    └── .gitkeep            — db.json is generated here at runtime
```

---

## Security

- JWT signed with a 64-character secret, expires in 8 hours
- bcrypt password hashing with 12 rounds
- Rate limiting: 200 req / 15 min on API, 10 attempts / 15 min on auth
- Helmet: CSP, X-Frame-Options, HSTS, and additional HTTP headers
- Input sanitization and validation via express-validator
- RBAC with 4 roles and granular permissions (superadmin down to support)
- Activity logs: every action is recorded with user, IP, and timestamp
- Timing attack prevention via constant-time comparison on failed login
- No secrets hardcoded — all sensitive values loaded from environment variables

---

## Local Setup

**Requirements:** Node.js 18+, npm 9+

```bash
# Clone the repository
git clone https://github.com/YOUR-USERNAME/craft-saas.git
cd craft-saas

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your values

# Create the Super Admin user
npm run seed

# Start in development mode
npm run dev
```

Or run in demo mode without any configuration:

```bash
npm start
```

- Site: http://localhost:3000  
- Admin panel: http://localhost:3000/admin

---

## Deploy to Vercel

**Option A — Vercel Dashboard (recommended)**

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) and click **New Project**
3. Import the repository
4. Add the following environment variables:

| Variable | Value |
|----------|-------|
| `JWT_SECRET` | Generate with the command below |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGINS` | `https://your-domain.vercel.app` |

5. Click **Deploy**

**Generate a secure JWT_SECRET:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Option B — Vercel CLI**

```bash
npm i -g vercel
vercel login
vercel --prod
```

**Post-deploy: create Super Admin in production**

```bash
ADMIN_USERNAME=your_user ADMIN_EMAIL=your@email.com ADMIN_PASSWORD=your_pass \
JWT_SECRET=your_jwt_secret node scripts/seed-admin.js
```

> Note: The JSON database is ephemeral on Vercel and resets on each deployment.
> For production use, migrate to PostgreSQL (Supabase or Neon) or MongoDB Atlas.

---

## Roles and Permissions

| Permission | Super Admin | Admin | Editor | Support |
|------------|:-----------:|:-----:|:------:|:-------:|
| User management (CRUD) | Yes | Yes* | No | No |
| Leads (view / export / delete) | Yes | Yes | View | View |
| Offers (CRUD) | Yes | Yes | Yes | No |
| Coupons (CRUD) | Yes | Yes | Yes | No |
| Chatbot configuration | Yes | Yes | Yes | View |
| Settings / Urgency bar | Yes | Yes | View | No |
| Audit logs | Yes | Yes | No | View |
| Delete Super Admins | Yes | No | No | No |

*Admin cannot create or delete Super Admin accounts.

---

## REST API Reference

**Authentication**

```
POST  /api/auth/login     { username, password }  →  { token, user }
GET   /api/auth/me        Authorization: Bearer…  →  user object
POST  /api/auth/logout    Authorization: Bearer…  →  { ok: true }
```

**Protected endpoints (JWT required)**

```
GET    /api/users                   — List users
POST   /api/users                   — Create user
PATCH  /api/users/:id               — Update user
DELETE /api/users/:id               — Delete user (superadmin only)

GET    /api/leads                   — List leads (filters: ?search= &plan=)
GET    /api/leads/export            — Export leads as CSV
POST   /api/leads/public            — Public endpoint used by landing page
DELETE /api/leads/:id               — Delete lead

GET    /api/offers                  — List offers
POST   /api/offers                  — Create offer
PATCH  /api/offers/:id              — Update offer
DELETE /api/offers/:id              — Delete offer

GET    /api/coupons                 — List coupons
GET    /api/coupons/validate/:code  — Public coupon validation
POST   /api/coupons                 — Create coupon
PATCH  /api/coupons/:id             — Update coupon
DELETE /api/coupons/:id             — Delete coupon

GET    /api/chatbot                 — Get chatbot config
PATCH  /api/chatbot                 — Update chatbot config

GET    /api/settings                — Get settings
GET    /api/settings/public         — Public urgency bar config (no auth)
PATCH  /api/settings                — Update settings

GET    /api/logs?limit=100          — Get audit logs
```

---

## N8N Chatbot Integration

1. Create a workflow in N8N with a **Webhook** trigger
2. Copy the generated webhook URL
3. In the admin panel, go to **Chatbot** and paste the URL
4. The webhook receives: `{ "message": "text", "sessionId": "id" }`
5. Your N8N workflow must respond with: `{ "reply": "response" }`

---

## PayPal Integration

**Personal account (immediate)**

1. PayPal app → Request money → Create payment link
2. Create one link per plan ($199, $299, $499 MXN)
3. In `index.html`, find the `paypalLinks` object and replace the placeholder URLs

**Business account (recommended for production)**

1. Go to [developer.paypal.com](https://developer.paypal.com) and create an app
2. Copy the production Client ID
3. Add the PayPal Checkout SDK and configure buttons per plan

---

## License

AGPL-3.0 © 2026 Craft
