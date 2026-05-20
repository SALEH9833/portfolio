# Saleh Mahamat Saleh — Portfolio

Portfolio personnel + marketplace CV + chatbot IA.
**Production : https://salehmahamatsaleh.com**

## Stack

- **Frontend** : Next.js 14 (SSR) · Tailwind · Framer Motion → déployé sur **Vercel**
- **Backend** : Express + PostgreSQL → déployé sur **Railway**
- **IA** : Claude API (chatbot intelligent)
- **Paiement** : PayPal (Smart Buttons / paypal.me)
- **DNS** : Cloudflare Registrar

## Développement local

### Prérequis
- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# Backend
cd backend
cp .env.example .env   # remplis tes valeurs
npm install
npm run db:seed        # seed la BDD
npm run dev

# Frontend (autre terminal)
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

URLs locales :
- Frontend : http://localhost:3000
- Backend : http://localhost:5000
- Admin : http://localhost:3000/admin

## Variables d'environnement

Voir `backend/.env.example` et `frontend/.env.local.example`.

**Critique en production** :
- `JWT_SECRET` — chaîne aléatoire 96 chars (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`)
- `ADMIN_PASSWORD` — mot de passe fort
- `ANTHROPIC_API_KEY` — pour le chatbot Claude
- `DATABASE_URL` — fourni par Railway automatiquement
- `EMAIL_USER` + `EMAIL_PASS` — Gmail App Password

## Déploiement

### Backend → Railway

1. **New Project** → **Deploy from GitHub repo**
2. **Root directory** : `backend`
3. **Add PostgreSQL** (database) — `DATABASE_URL` injecté automatiquement
4. **Variables** → copier depuis `.env.example` :
   - `NODE_ENV=production`
   - `JWT_SECRET=...`
   - `ADMIN_USERNAME=admin` / `ADMIN_PASSWORD=...`
   - `ANTHROPIC_API_KEY=...`
   - `EMAIL_USER=...` / `EMAIL_PASS=...` / `EMAIL_TO=...`
   - `FRONTEND_URL=https://salehmahamatsaleh.com`
5. **Settings** → **Networking** → **Generate Domain**
6. **Custom Domain** : `api.salehmahamatsaleh.com`

### Frontend → Vercel

1. **Import Git Repository**
2. **Root Directory** : `frontend`
3. **Environment Variables** :
   - `BACKEND_URL=https://api.salehmahamatsaleh.com`
   - `NEXT_PUBLIC_BACKEND_URL=https://api.salehmahamatsaleh.com`
   - `NEXT_PUBLIC_PAYPAL_ME=salehmahamatsaleh01`
4. **Deploy**
5. **Domains** → ajouter `salehmahamatsaleh.com` + `www.salehmahamatsaleh.com`

### DNS → Cloudflare

Dans **DNS Settings** du domaine :

| Type | Name | Content | Proxy |
|---|---|---|---|
| CNAME | @ | cname.vercel-dns.com | DNS only |
| CNAME | www | cname.vercel-dns.com | DNS only |
| CNAME | api | xxx-yyy.up.railway.app | DNS only |

## Structure

```
portfolio/
├── frontend/                    # Next.js app
│   ├── pages/                   # Routes (index, admin, cv-builder, cv-templates, login, my-cvs, verify-email)
│   ├── components/              # React components
│   │   └── admin/               # Admin-specific UI (editors, panels)
│   ├── lib/                     # i18n, theme, user-auth
│   └── styles/                  # globals.css + cv-templates.css
└── backend/                     # Express API
    ├── routes/                  # admin, chatbot, auth, payments, cv-templates, testimonials, media, ...
    ├── middleware/              # security, auth
    ├── db/                      # PostgreSQL access + schema + auto-migrate + seeds
    └── public/                  # static files (images, uploads, files)
```

## Admin

URL : `/admin/login`
Credentials : variables `ADMIN_USERNAME` / `ADMIN_PASSWORD`

Onglets disponibles :
- Vue d'ensemble · Profil · Médias · Modèles CV · Témoignages · Ventes · Messages
- Édition CRUD pour : profil, projets, compétences, expérience, formation, langues, certifications, activités, etc.

## License

© 2026 Saleh Mahamat Saleh — All rights reserved.
