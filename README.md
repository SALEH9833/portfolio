# Saleh Mahamat Saleh — Portfolio

Portfolio personnel + chatbot IA + espace admin.
**Production : https://salehmahamatsaleh.com**

## Stack

Une seule application **Next.js 14** déployée sur **Vercel** :

- **Site** : Next.js (SSR) · Tailwind · Framer Motion
- **API** : Express, servie par Next.js via `pages/api/[...path].js` (fonctions serverless Vercel)
- **Base de données** : PostgreSQL sur **Neon** (gratuit, connecté depuis Vercel → Storage)
- **Images uploadées** : **Vercel Blob** (connecté depuis Vercel → Storage)
- **IA** : Claude API (chatbot)
- **DNS** : Cloudflare

## Développement local

Prérequis : Node.js 20+ et une base PostgreSQL (locale ou Neon).

```bash
cd frontend
cp .env.example .env.local   # remplis DATABASE_URL, JWT_SECRET, ADMIN_PASSWORD…
npm install
npm run dev
```

- Site : http://localhost:3000
- API : http://localhost:3000/api/health
- Admin : http://localhost:3000/admin

Les tables sont créées automatiquement au premier appel API, et le contenu
du CV (`server/db/production-import.sql`) est importé si la base est vide.

## Déploiement (Vercel)

1. **Root Directory** du projet Vercel : `frontend`
2. **Storage → Create → Neon (Postgres)** → connecter au projet (ajoute `DATABASE_URL`)
3. **Storage → Create → Blob** → connecter au projet (ajoute `BLOB_READ_WRITE_TOKEN`)
4. **Settings → Environment Variables** :
   - `JWT_SECRET` — `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
   - `ADMIN_USERNAME` / `ADMIN_PASSWORD`
   - `ANTHROPIC_API_KEY`
   - `EMAIL_USER` / `EMAIL_PASS` (Gmail App Password) / `EMAIL_TO`
5. **Deploy** (redéployer après avoir ajouté les variables)

## Structure

```
portfolio/
└── frontend/                 # application Next.js (site + API)
    ├── pages/                # index, admin, sitemap.xml, api/[...path]
    ├── components/           # composants React (+ admin/)
    ├── lib/                  # i18n, thème
    ├── styles/
    ├── public/               # images, files/cv.pdf, robots.txt
    └── server/               # API Express
        ├── app.js            # montage des routes
        ├── routes/           # admin, chatbot, contact, profile, projects, testimonials, media, analytics…
        ├── middleware/       # sécurité, auth JWT
        ├── db/               # connexion, schéma, migrations auto, import du contenu
        └── storage.js        # uploads (Vercel Blob / disque en local)
```

## Admin

URL : `/admin/login` — identifiants : `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

Onglets : Vue d'ensemble · Visiteurs · Profil · Compétences · Parcours · Projets · Témoignages · Messages · Médias.

## License

© 2026 Saleh Mahamat Saleh — All rights reserved.
