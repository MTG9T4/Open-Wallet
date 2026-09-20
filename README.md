# Open Wallet

A Forbes-style real-time dashboard of the world's richest people — live prices, live rankings,
category tabs, bios, photos and search. Built for everyone: plain-English numbers, one-tap
detail views, and a green/amber badge on every person so you always know what's live and
what's an estimate.

## Run

```bash
node server.js
```

Then open http://localhost:3000

No dependencies. Requires Node 18+ (uses built-in `fetch`). Custom port: `PORT=8080 node server.js`.
State (charts, baselines, price history) persists across restarts via `.state.json` (kept for 6 hours).

## Features

- **Live tracking** — green-badged people have their public share stakes re-priced from real
  Google Finance quotes every 15 seconds; rows flash green/red and re-sort as fortunes move.
- **Honest estimates** — amber-badged people (athletes, most women/youngest/non-tech) show
  Forbes-style figures; the wealth has no live feed anywhere.
- **Berkshire's real portfolio** — Buffett's detail window shows his actual SEC 13F holdings
  (Apple, AmEx, Alphabet, Coca-Cola…), re-priced live and re-ranked as markets move.
- **Market context strip** — Bitcoin (CoinGecko), S&P 500 and 10-year Treasury (FRED / St. Louis Fed)
  under the header.
- **Terminal mode** — one click swaps the whole site between the light look and a dark
  Bloomberg-terminal theme (remembered in your browser).
- **Search everything** — the search bar (or press `/`) instantly finds any of the ~50 people
  across all tabs; click a result to open their detail window.
- **Detail window** — giant counting number, live chart with pulsing "now" marker,
  since-you-opened and per-minute trackers (with % moves), bio, holdings breakdown, live share prices.
- **Salary calculator** — type your own yearly salary in any detail window: see how long it
  would take you to earn that fortune, plus what you'd have earned since opening the page.
- **Market status** — the header notes when prices are moving, flat, or it's a weekend.
- **Try to spend it** — every person has a **Spend it** button (on their row and in their
  detail window) opening a full spend layer: 23 real items with square product photos and
  real-world MSRP / list prices — PS5 Pro ($749.99 Sony MSRP), iPhone 18 Pro, Toyota Camry,
  Range Rover, Rolex, Lamborghini, Super Bowl ad, Malibu beach house, Falcon 9 launch,
  Gulfstream G700, superyacht, Salvator Mundi, NFL team, Twitter. Add to cart, see live
  "affords ×N" counts per item, watch the budget drain against their live fortune, and share
  your result. Product photos: Wikimedia Commons.
  first trillion-dollar fortune, with a pace-based ETA when markets move.
- **Rank-flip alerts + flips feed** — when one billionaire passes another live, the site
  fires a toast and confetti so you catch the moment. Recent flips stay on a feed, and the
  server can push them straight into your Discord via `RANK_WEBHOOK` (see DEPLOYMENT.md).
- **Milestone toasts** — the page calls out live moves: "Musk is up over 1% since open".
- **Live "watching now"** — a real count of people viewing right now (45s heartbeat window).
- **Share on X / copy stats** — one click generates a live-status post ("Elon Musk is +$1.2B
  since I opened this page…") with the deep link already included.
- **Tab-title ticker** — the browser tab shows the current #1 and their live fortune.
- **Link previews** — Open Graph tags + a generated banner image, so shared links look sharp.
- **Persistence** — charts and baselines survive server restarts (up to 6 hours), so history
  stays continuous and "since open" numbers remain meaningful.
- **Resilience** — per-ticker back-off if a source misbehaves, automatic TradingView fallback
  (or TradingView-first with `QUOTE_SOURCE=tradingview` — recommended for cloud deploys,
  see DEPLOYMENT.md), crash-tolerant event loop, and a DELAYED badge if data goes stale.

## Tabs

| Tab | What it shows |
|---|---|
| **Top 10 Richest** | The 10 wealthiest people on Earth, all live-tracked. |
| **Richest Women** | The 10 wealthiest women. Walton, Bettencourt Meyers and Scott are live from their Walmart/LVMH/Amazon stakes. |
| **Youngest** | The 10 youngest billionaires, ordered by age. Lukas Walton is live-tracked. |
| **Athletes** | The 10 richest athletes — Jordan, Woods, LeBron, Ronaldo and more (estimates). |
| **Non-Tech** | The 10 richest outside technology. Arnault, Buffett and Ortega update live here too. |
| **Wealth Chart** | A race-style bar chart comparing all top-10 fortunes at a glance. |

Deep links work: `http://localhost:3000/#jordan` opens Michael Jordan directly.

## How to read the badges

- **Green dot (LIVE)** — this person's public share stakes are re-priced from real Google Finance
  quotes every 15 seconds. When the market moves, their number moves.
- **Amber dot (ESTIMATE)** — Forbes-style editorial figure (March 2026). Their wealth sits in
  private holdings — brands, private companies, inheritances — that have no live price feed,
  so the number holds steady.

A legend under the table header explains this on every page, and the detail window carries the
same LIVE / ESTIMATE flag.

## How it works

There is no public API for real-time billionaire net worth (Forbes/Bloomberg block automated
access), so Open Wallet computes it the same way Forbes does:

1. **Live-tracked people** have their estimated public share stakes priced live from Google
   Finance, polled every 15 seconds with automatic back-off. European holdings (LVMH, Inditex)
   convert at ECB rates (Frankfurter API). Private assets are calibrated at startup to match the
   **Forbes World's Billionaires List 2026** baseline exactly, then held constant.
2. **Editorial-estimate people** show figures from the March 2026 snapshot, chip-labeled
   "Forbes 2026 est." and amber-badged.
3. The browser polls the local server every 2.5 seconds; numbers glide to new values so the page
   always feels alive. A DELAYED badge appears in the header if price data goes stale.

## Data sources

- Baseline net worth: Forbes World's Billionaires List 2026 (March snapshot)
- Live stock quotes: Google Finance (primary) with TradingView scanner fallback
- Berkshire Hathaway holdings: SEC EDGAR 13F filings (data.sec.gov), priced live via TradingView
- Market context: Bitcoin via CoinGecko · S&P 500 & 10-year Treasury via FRED (St. Louis Fed)
- FX: European Central Bank via api.frankfurter.dev
- Photos: Wikimedia Commons (free licenses; a few very private people show initials instead)

## Notes & limitations

- Figures are **estimates** for illustration, not official statements of wealth.
- Share counts are approximate and drift over time. Update them in `PEOPLE`/`EXTRA` in `server.js`.
- Google Finance may rate-limit in some regions; failed quotes back off automatically and the last
  good price is kept (the header shows DELAYED while stale).
- When markets are closed, live numbers hold steady — the site notes "markets may be closed".
