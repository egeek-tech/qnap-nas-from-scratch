# QNAP NAS guide — site build & deploy

Generated from the repo-root `README.md`. Do not edit `dist/` by hand.

## Build
```bash
npm install
npm run build      # -> dist/
npm test           # unit + integration
npm run serve      # preview at http://localhost:8080
```

## Deploy (manual for now)

### Cloudflare Workers → https://qnap.egeek.tech
```bash
npx wrangler login          # once
npm run deploy:cf           # wrangler deploy (uploads ./dist as static assets)
```
First time only: add the `qnap.egeek.tech` custom domain in the Cloudflare dashboard
(Workers → this worker → Settings → Domains & Routes), or accept the `custom_domain` route.

### GitHub Pages (mirror)
```bash
npx gh-pages -d dist        # publishes dist/ to the gh-pages branch
```
Then enable Pages → Deploy from branch → `gh-pages` once in repo settings.

## Later: auto-deploy
See `.github/workflows/deploy.yml` (currently manual-trigger only). Enabling it needs a
`CLOUDFLARE_API_TOKEN` repo secret (Workers Scripts:Edit) and Pages write permission.
