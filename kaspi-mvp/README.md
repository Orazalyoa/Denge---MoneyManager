# Kaspi MVP Tracker

Local-first MVP for parsing Kaspi transaction text with optional Supabase auth and cloud sync.

## Production Stack (Free)

- Frontend: Next.js static export (`output: export`)
- Hosting: Nginx on your Debian server
- Storage: Browser localStorage (fallback) + Supabase (cloud sync)
- Domain: `sslip.io` subdomain or your own domain

## Architecture

- `src/domain` - business entities and pure logic (parser, stats, types, contracts)
- `src/application` - use-cases that orchestrate flows
- `src/infrastructure` - adapters (localStorage repository)
- `src/components` - reusable UI pieces
- `src/app` - routes and page composition
- `src/shared` - formatting helpers and shared utilities

This layering keeps parser/storage isolated from UI so future changes (IndexedDB, backend API, new parsers) can be added without rewriting pages.

## MVP Features

- Smart paste input (single and bulk)
- Deterministic split and parse logic for Kaspi patterns
- Preview before save with edit/delete actions
- Local storage persistence (always available)
- Optional registration/login for cross-device sync
- Cloud sync for transactions and parser catalog (accounts/categories/rules)
- History page with filter and basic analytics

## Supabase setup (auth + cloud sync)

1. Create a project in Supabase.
2. Open SQL Editor and run [supabase/schema.sql](supabase/schema.sql).
3. Copy [.env.example](.env.example) to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. In Supabase Auth settings, enable Email/Password sign-in.
5. Restart dev server.

When Supabase keys are missing, the app automatically stays in local-only mode.

## Run locally

1. Install Node.js 20+
2. Install dependencies:
   - `npm install`
3. Start dev server:
   - `npm run dev`
4. Open `http://localhost:3000`

## Deploy to your server (production)

1. Build static files:
   - `npm run build`
2. Upload `out/` to server:
   - `scp -r ./out/* debian@82.115.48.47:/var/www/denge/`
3. Upload Nginx config:
   - `scp ./denge.conf debian@82.115.48.47:/tmp/denge.conf`
4. Apply config on server:
   - `ssh debian@82.115.48.47`
   - `sudo mv /tmp/denge.conf /etc/nginx/sites-available/denge.conf`
   - `sudo ln -sf /etc/nginx/sites-available/denge.conf /etc/nginx/sites-enabled/denge.conf`
   - `sudo nginx -t`
   - `sudo systemctl reload nginx`

## Optional HTTPS (recommended)

Install Certbot and issue certificate for your domain. For temporary `sslip.io` testing, HTTP is acceptable, but production should use HTTPS.

## Notes

- MVP supports only Kaspi text format keywords: `Покупка`, `Перевод`, `Пополнение`
- Parsing remains deterministic (no AI parsing)
