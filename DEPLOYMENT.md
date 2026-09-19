# Deploying Open Wallet

This guide covers the three moving parts of a public deployment: the GitHub repo,
the Cloudflare domain, and where the price-fetching server actually runs.

## The short version

| Piece | Where it can live | Notes |
|---|---|---|
| Frontend (`public/`) | Cloudflare Pages, Netlify, GitHub Pages, anywhere static | Zero build step — it's plain HTML/CSS/JS |
| API server (`server.js`) | Any Node 18+ host: Railway, Render, Fly.io, a $4 VPS, a Raspberry Pi at home | Needs outbound internet to fetch quotes |
| Domain | Cloudflare (orange-cloud proxy is fine) | Point DNS at wherever the server runs |

## Important: quote sources and datacenter IPs

`server.js` fetches quotes in one of two modes:

- **Google Finance mode (default)** — scrapes 10 quote pages per cycle. Works well from
  residential-style IPs (your machine, a home server). Datacenter IPs (Railway/Render/etc.)
  are much more likely to get served CAPTCHAs or blocked, and scraping Google at scale is
  not a supported use of their site.
- **TradingView mode (deploy mode)** — set `QUOTE_SOURCE=tradingview` and the server makes
  ONE batch scanner request per 15-second cycle instead of scraping 10 pages. This is the
  recommended mode for cloud deployments: lighter, faster, and more tolerant of datacenter
  IPs. If the batch request fails, the server falls back to per-quote fetching.

```bash
QUOTE_SOURCE=tradingview PORT=3000 node server.js
```

Either way, budget the service's courtesy: keep the 15-second polling interval, don't run
many instances against the same sources, and accept that a public unofficial source can
change or block you at any time. The site already handles that gracefully (stale prices,
DELAYED badge) — but don't build a business on uninterrupted supply.

## Option A: Cloudflare Tunnel (serve from your own machine)

The fastest way to put the site on a real domain with zero hosting setup. Traffic flows
`internet → Cloudflare edge → encrypted tunnel → localhost:3000`, with free HTTPS.

```bash
# one-time setup
cloudflared tunnel login            # authorize your domain in the browser
cloudflared tunnel create open-wallet
cloudflared tunnel route dns open-wallet openwallet.fyi
cloudflared tunnel route dns open-wallet www.openwallet.fyi
```

`~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /Users/<you>/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: openwallet.fyi
    service: http://localhost:3000
  - hostname: www.openwallet.fyi
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# run it (keep the Node server running too)
nohup cloudflared tunnel run open-wallet >> tunnel.log 2>&1 &
```

Caveat: the Mac must stay on, awake, and online — if it sleeps, the site goes down.
For 24/7 uptime use Option B (a hosted server) instead.

## Option B: split hosting

The frontend is static. To host it apart from the server:

1. Deploy `public/` to Cloudflare Pages.
2. Tell it where the API lives by setting a global before `app.js` runs. Add to the
   `<head>` of `index.html` (or via a Pages environment-injected snippet):

   ```html
   <script>window.OW_API = "https://your-api-host.example.com";</script>
   ```

3. The server already sends `Access-Control-Allow-Origin: *` on `/api/data` and `/api/ping`,
   so cross-origin deployments work out of the box. If you want to lock CORS down, edit the
   header in `server.js` to your own domain.

## Server state

- `.state.json` — charts/baselines/history persistence (6-hour memory). On a server, keep
  it on a persistent volume if you can; it regenerates fine if lost.
- `server.log` — rotate it if you run long-term (it only logs price *changes*).

## Community notifications (rank-flip webhooks)

The server detects when one billionaire passes another and can push the moment straight
into your community chat (Discord webhook format):

```bash
RANK_WEBHOOK="https://discord.com/api/webhooks/..." PUBLIC_URL="https://your-domain.com" node server.js
```

- `RANK_WEBHOOK` — any Discord-compatible webhook URL (Discord, or a bridge to Telegram/Slack).
- `PUBLIC_URL` — the link included in the message; set it to your live domain.
- Flip history also shows on the site ("Recent rank flips" feed) and persists across restarts.

## Link previews (og:image)

`index.html` includes Open Graph tags with `og:image` pointing at `/og-banner.png`.
Social crawlers resolve relative image URLs against your domain, but some require an
absolute URL — if previews look broken, change it to `https://your-domain.com/og-banner.png`
in `index.html`.

## Photos and licensing

Photos were fetched from Wikimedia Commons under their respective free licenses and are
stored in `public/photos/`. Keep the "Photos: Wikimedia Commons" attribution in the page
footnote (already there). If you prefer, delete the folder — the UI gracefully falls back
to gold initials avatars for anyone without a photo.

## Honesty notes for a public audience

- All wealth figures are estimates computed Forbes-style: live share price x known stakes +
  fixed private assets. The page says so in the footnote and every detail window — keep it
  that way so the community knows exactly what the numbers mean.
- The "watching now" counter is real connections (45-second heartbeat window), not a vanity
  number. Keep it honest.
