# Borrower Cloudways Node SSR Deployment

## Purpose

Deploy the borrower frontend to Cloudways without Cloudflare. The current app is a TanStack Start SSR
app. It is not safe to deploy as static files because the production build does not emit a standalone
`index.html` app shell.

This deployment keeps the existing Cloudflare Worker target intact and adds a Node.js SSR runtime
adapter for Cloudways.

## Hosts

| Surface                   | URL                                    | Deployment                            |
| ------------------------- | -------------------------------------- | ------------------------------------- |
| Borrower frontend staging | `https://borrower-staging.approvu.com` | Node.js SSR behind Nginx on Cloudways |
| Laravel API staging       | `https://api-staging.approvu.com`      | Laravel v2                            |
| Legacy app                | `https://app.approvu.com`              | Existing PHP app; do not touch        |

## GoDaddy DNS

Create or update this staging record in GoDaddy:

```text
borrower-staging.approvu.com  A  <Cloudways server IP>
```

Do not modify `app.approvu.com`.

## Required Environment

The staging build embeds the Laravel API origin into the client bundle:

```env
VITE_APPROVU_API_BASE_URL=https://api-staging.approvu.com
```

Do not put secrets in `VITE_*` variables.

## Build Command

From the borrower frontend repo:

```bash
cd codex-code-companion
bun install --frozen-lockfile
bun run build:staging:node
```

The build script sets `VITE_APPROVU_API_BASE_URL=https://api-staging.approvu.com`, runs the TanStack
Start build, and writes:

```text
dist/server/node-server.mjs
```

## Output

Expected output folders:

```text
dist/client/
dist/server/
dist/server/index.js
dist/server/node-server.mjs
```

`dist/client/` contains static assets. `dist/server/node-server.mjs` starts the Node SSR server and
serves those assets before forwarding application routes to the TanStack Start fetch handler.

## Runtime Command

Run the Node SSR server on an internal port:

```bash
PORT=3000 HOST=127.0.0.1 node dist/server/node-server.mjs
```

The package script is:

```bash
npm run start:staging:node
```

or:

```bash
bun run start:staging:node
```

Set `PORT` and `HOST` through the process manager environment.

## PM2 Example

```bash
pm2 start dist/server/node-server.mjs \
  --name approvu-borrower-staging \
  --interpreter node \
  --env PORT=3000 \
  --env HOST=127.0.0.1

pm2 save
```

If PM2 does not accept `--env` flags in the installed version, create an ecosystem file on the
server and keep it out of the repo if it contains server-specific paths.

## Supervisor Example

```ini
[program:approvu-borrower-staging]
directory=/home/master/applications/<app>/public_html/codex-code-companion
command=/usr/bin/node dist/server/node-server.mjs
autostart=true
autorestart=true
environment=PORT="3000",HOST="127.0.0.1"
stdout_logfile=/home/master/applications/<app>/logs/borrower-node-ssr.out.log
stderr_logfile=/home/master/applications/<app>/logs/borrower-node-ssr.err.log
```

Adjust paths to the actual Cloudways application.

## Nginx Reverse Proxy

Configure the `borrower-staging.approvu.com` Nginx site to proxy to the local Node process:

```nginx
server {
    listen 80;
    server_name borrower-staging.approvu.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name borrower-staging.approvu.com;

    ssl_certificate     /etc/letsencrypt/live/borrower-staging.approvu.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/borrower-staging.approvu.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## SSL / Let's Encrypt

Use the Cloudways SSL tool or Certbot/Nginx for:

```text
borrower-staging.approvu.com
```

The borrower staging frontend should serve HTTPS without certificate errors.

## Health Checks

Run after deployment:

```bash
curl -I https://borrower-staging.approvu.com/
curl -I https://borrower-staging.approvu.com/login
curl -I https://borrower-staging.approvu.com/portal
curl -I https://borrower-staging.approvu.com/purchase
curl -I https://api-staging.approvu.com/v2/health
```

Expected:

- Borrower routes return HTML from the Node SSR server.
- Static assets under `/assets/` return cacheable JavaScript/CSS.
- Laravel health returns API JSON from `api-staging.approvu.com`.

## Rollback

1. Stop the Node SSR process:

   ```bash
   pm2 stop approvu-borrower-staging
   ```

   or stop the Supervisor program.

2. Restore the previous deployment directory or previous release symlink.
3. Reload Nginx only if the reverse proxy config changed.
4. Do not repoint or modify `app.approvu.com`.

## Guardrails

- Do not touch production.
- Do not modify `app.approvu.com`.
- Do not commit secrets or server-specific credentials.
- Do not deploy the current borrower build as a static SPA.
- Keep the existing Cloudflare Worker config available until the Cloudways Node SSR path is proven.
