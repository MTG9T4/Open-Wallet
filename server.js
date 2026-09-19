const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const POLL_MS = 15_000;
const STAGGER_MS = 300;
const HISTORY_CAP = 480;
const STALE_MS = 120_000;
const STATE_FILE = path.join(__dirname, '.state.json');

const PEOPLE = [
  { id: 'musk', name: 'Elon Musk', country: 'US', age: 54, source: 'Tesla, SpaceX', tab: 'top', base: 839.0, bio: "Co-founded Tesla, SpaceX, Neuralink and xAI. The world's richest person — most of his fortune sits in SpaceX, xAI and Tesla stock, so it swings more than anyone's.", holdings: [{ slug: 'TSLA:NASDAQ', shares: 411_000_000, currency: 'USD' }] },
  { id: 'page', name: 'Larry Page', country: 'US', age: 52, source: 'Google', tab: 'top', base: 257.0, bio: 'Co-founded Google with Sergey Brin in 1998. He stepped down as Alphabet CEO in 2019 and now backs flying cars, longevity research and other moonshots.', holdings: [{ slug: 'GOOGL:NASDAQ', shares: 577_000_000, currency: 'USD' }] },
  { id: 'brin', name: 'Sergey Brin', country: 'US', age: 52, source: 'Google', tab: 'top', base: 237.0, bio: 'Co-founded Google and co-invented the PageRank algorithm with Larry Page. Born in Moscow, his family emigrated to the U.S. when he was six.', holdings: [{ slug: 'GOOGL:NASDAQ', shares: 474_000_000, currency: 'USD' }] },
  { id: 'bezos', name: 'Jeff Bezos', country: 'US', age: 62, source: 'Amazon', tab: 'top', base: 224.0, bio: 'Founded Amazon in 1994 as an online bookstore run out of his garage. Also owns The Washington Post and rocket company Blue Origin.', holdings: [{ slug: 'AMZN:NASDAQ', shares: 880_000_000, currency: 'USD' }] },
  { id: 'zuckerberg', name: 'Mark Zuckerberg', country: 'US', age: 41, source: 'Meta Platforms', tab: 'top', base: 222.0, bio: 'Started Facebook from his Harvard dorm room in 2004. Now leads Meta — Facebook, Instagram and WhatsApp — and is betting big on AI and VR.', holdings: [{ slug: 'META:NASDAQ', shares: 330_000_000, currency: 'USD' }] },
  { id: 'ellison', name: 'Larry Ellison', country: 'US', age: 81, source: 'Oracle', tab: 'top', base: 190.0, bio: "Co-founded Oracle in 1977 and ran it for decades. Owns most of the Hawaiian island of Lanai and bankrolls one of the world's top sailing teams.", holdings: [{ slug: 'ORCL:NYSE', shares: 1_150_000_000, currency: 'USD' }] },
  { id: 'arnault', name: 'Bernard Arnault & family', country: 'FR', age: 77, source: 'LVMH', tab: 'top', base: 171.0, bio: 'Runs LVMH, the luxury empire behind Louis Vuitton, Dior, Moët and Hennessy. The richest person in Europe — five of his children help run the group.', holdings: [{ slug: 'MC:EPA', shares: 242_000_000, currency: 'EUR' }] },
  { id: 'huang', name: 'Jensen Huang', country: 'US', age: 63, source: 'Nvidia', tab: 'top', base: 154.0, bio: "Founded Nvidia in 1993 — the chip maker whose hardware powers most modern AI. He waited tables at a Denny's, where the company's first business plan was written.", holdings: [{ slug: 'NVDA:NASDAQ', shares: 680_000_000, currency: 'USD' }] },
  { id: 'buffett', name: 'Warren Buffett', country: 'US', age: 95, source: 'Berkshire Hathaway', tab: 'top', base: 149.0, bio: "The 'Oracle of Omaha'. Bought his first stock at age 11 and grew Berkshire Hathaway into a trillion-dollar conglomerate; he's pledged nearly all of it to charity.", holdings: [{ slug: 'BRK.B:NYSE', shares: 292_000_000, currency: 'USD' }] },
  { id: 'ortega', name: 'Amancio Ortega', country: 'ES', age: 89, source: 'Inditex (Zara)', tab: 'top', base: 148.0, bio: "Founded Zara parent Inditex in 1975 and revolutionized fast fashion. Famously private — no tie, no corner office, and for decades almost no interviews.", holdings: [{ slug: 'ITX:BME', shares: 930_000_000, currency: 'EUR' }] }
];

const EXTRA = [
  { id: 'walton', name: 'Alice Walton', country: 'US', age: 76, source: 'Walmart', tab: 'women', base: 118.0, bio: "Sam Walton's only daughter. Her slice of the Walmart fortune makes her the richest woman in the world — she's also one of America's foremost art collectors.", holdings: [{ slug: 'WMT:NASDAQ', shares: 520_000_000, currency: 'USD' }] },
  { id: 'bettencourt', name: 'Françoise Bettencourt Meyers', country: 'FR', age: 73, source: 'LVMH', tab: 'women', base: 92.0, bio: "Granddaughter of L'Oréal's founder. Her family controls about a third of the beauty empire — she was the first woman in history worth over $100 billion.", holdings: [{ slug: 'MC:EPA', shares: 175_000_000, currency: 'EUR' }] },
  { id: 'scott', name: 'MacKenzie Scott', country: 'US', age: 56, source: 'Amazon, philanthropy', tab: 'women', base: 52.0, bio: "Novelist and ex-wife of Jeff Bezos. She has given away tens of billions since her divorce — and quietly at that — while still holding a large Amazon stake.", holdings: [{ slug: 'AMZN:NASDAQ', shares: 190_000_000, currency: 'USD' }] },
  { id: 'lukas', name: 'Lukas Walton', country: 'US', age: 30, source: 'Walmart', tab: 'youngest', base: 38.0, bio: "Grandson of Walmart founder Sam Walton. He inherited his father John's stake at a young age and is now a major funder of climate and conservation work.", holdings: [{ slug: 'WMT:NASDAQ', shares: 210_000_000, currency: 'USD' }] }
];

const STATIC = [
  { id: 'koch_julia', name: 'Julia Koch', country: 'US', age: 63, source: 'Koch Industries', tab: 'women', base: 96.0, bio: "Inherited her husband David Koch's stake in Koch Industries — the private chemicals-and-fuel giant — when he died in 2019. A major museum patron in New York." },
  { id: 'mars_jacqueline', name: 'Jacqueline Mars', country: 'US', age: 86, source: 'Mars Inc.', tab: 'women', base: 54.0, bio: "Granddaughter of Mars candy founder Forrest Mars. The family still fully owns the maker of M&M's, Snickers and Pedigree pet food." },
  { id: 'jindal', name: 'Savitri Jindal', country: 'IN', age: 86, source: 'Jindal Steel & Power', tab: 'women', base: 48.0, bio: "Asia's richest woman. She took over her husband's steel-and-power group after he died in a 2005 helicopter crash — and grew it several times over." },
  { id: 'rinehart', name: 'Gina Rinehart', country: 'AU', age: 72, source: 'Hancock Prospecting', tab: 'women', base: 44.0, bio: "Australia's richest person. She turned her father's debt-ridden iron-ore outfit into a mining giant riding China's demand for steel." },
  { id: 'adelson', name: 'Miriam Adelson', country: 'US', age: 80, source: 'Las Vegas Sands', tab: 'women', base: 38.0, bio: 'Israeli-American physician who inherited the Las Vegas Sands casino empire when her husband Sheldon Adelson died in 2021.' },
  { id: 'klatten', name: 'Susanne Klatten', country: 'DE', age: 64, source: 'BMW, Altana', tab: 'women', base: 35.0, bio: "Germany's richest woman. She owns about a fifth of BMW and a controlling stake in chemicals firm Altana — both inherited from her father." },
  { id: 'fontbona', name: 'Iris Fontbona', country: 'CL', age: 82, source: 'Antofagasta', tab: 'women', base: 32.0, bio: 'Controls Chilean copper-mining giant Antofagasta plus a bank and beer empire, inherited from her late husband Andrónico Luksic.' },

  { id: 'delvecchio_c', name: 'Clemente Del Vecchio', country: 'IT', age: 21, source: 'EssilorLuxottica', tab: 'youngest', base: 4.8, bio: 'Youngest son of Luxottica founder Leonardo Del Vecchio. He inherited a stake in the eyewear giant behind Ray-Ban at just 14.' },
  { id: 'kim_jy', name: 'Kim Jung-youn', country: 'KR', age: 21, source: 'NXC (Nexon)', tab: 'youngest', base: 1.4, bio: 'Daughter of Nexon gaming founder Kim Jung-ju, who died in 2022. She became a billionaire as a teenager without ever seeking the spotlight.' },
  { id: 'kim_jm', name: 'Kim Jung-min', country: 'KR', age: 23, source: 'NXC (Nexon)', tab: 'youngest', base: 1.6, bio: "Older sister of Kim Jung-youn. The two share the NXC holding company behind gaming giant Nexon — maker of MapleStory and many more." },
  { id: 'andresen_a', name: 'Alexandra Andresen', country: 'NO', age: 30, source: 'Ferd', tab: 'youngest', base: 1.8, bio: 'One of two Norwegian sisters who inherited a stake in the family investment firm Ferd. She was named the world\'s youngest billionaire at 19.' },
  { id: 'breslow', name: 'Ryan Breslow', country: 'US', age: 31, source: 'Bolt, Equation', tab: 'youngest', base: 1.2, bio: 'Founded payments startup Bolt at 19, then the drug-pricing venture Equation. Famous for his unorthodox — and loud — style of entrepreneurship.' },
  { id: 'andresen_k', name: 'Katharina Andresen', country: 'NO', age: 32, source: 'Ferd', tab: 'youngest', base: 1.9, bio: 'The elder of Norway\'s billionaire Andresen sisters. The pair once posed for the tax authority\'s posters about family wealth transfers.' },
  { id: 'witzoe', name: 'Gustav Magnar Witzøe', country: 'NO', age: 33, source: 'SalMar', tab: 'youngest', base: 4.2, bio: "Inherited nearly half of SalMar, one of the world's biggest salmon-farming companies, from his father at 19 — and invests in tech on the side." },
  { id: 'mateschitz', name: 'Mark Mateschitz', country: 'AT', age: 33, source: 'Red Bull', tab: 'youngest', base: 41.0, bio: "Only son of Red Bull co-founder Dietrich Mateschitz. He inherited control of the energy-drink empire in 2022 and holds nearly half of it." },
  { id: 'luckey', name: 'Palmer Luckey', country: 'US', age: 33, source: 'Anduril, Oculus', tab: 'youngest', base: 3.9, bio: 'Built the Oculus VR headset as a teenager, sold it to Facebook for $2 billion at 21, then founded defense-tech star Anduril.' },

  { id: 'jordan', name: 'Michael Jordan', country: 'US', age: 63, source: 'Nike, Jordan Brand', tab: 'athletes', base: 3.6, bio: "The greatest basketball player of all time became a billionaire largely through his cut of every Air Jordan sneaker sold — well over $1B from Nike alone." },
  { id: 'woods', name: 'Tiger Woods', country: 'US', age: 50, source: 'Golf', tab: 'athletes', base: 1.7, bio: "Golf's biggest draw ever: 15 major titles and a record endorsement run. He crossed $1 billion mostly through prize money and appearance deals." },
  { id: 'johnson_magic', name: 'Magic Johnson', country: 'US', age: 67, source: 'NBA, investments', tab: 'athletes', base: 1.5, bio: 'Five NBA rings, then a second act as a dealmaker — stakes in the Dodgers, Lakers, soccer teams and a slew of franchises made him a billionaire investor.' },
  { id: 'james_lebron', name: 'LeBron James', country: 'US', age: 41, source: 'NBA, media', tab: 'athletes', base: 1.5, bio: "The NBA's all-time scoring king. On top of his salary he owns stakes in Blaze Pizza, Liverpool FC and SpringHill, his media company." },
  { id: 'ronaldo', name: 'Cristiano Ronaldo', country: 'PT', age: 41, source: 'Al Nassr, endorsements', tab: 'athletes', base: 1.5, bio: 'The most-followed person on Earth. His Saudi contract plus endorsements made him the first billionaire footballer while still playing.' },
  { id: 'federer', name: 'Roger Federer', country: 'CH', age: 45, source: 'Tennis, On Running', tab: 'athletes', base: 1.3, bio: '20 Grand Slams, then one of the smoothest retirements in sport — a stake in On Running and years of Rolex and Uniqlo deals keep him at ten figures.' },
  { id: 'mayweather', name: 'Floyd Mayweather', country: 'US', age: 49, source: 'Boxing', tab: 'athletes', base: 1.2, bio: 'Undefeated across 50 pro fights. He promoted his own bouts and kept most of the money — his 2015 showdown alone grossed about $600 million.' },
  { id: 'messi', name: 'Lionel Messi', country: 'AR', age: 39, source: 'Inter Miami, endorsements', tab: 'athletes', base: 0.95, bio: 'Eight Ballon d\'Or awards and a World Cup win. Now at Inter Miami, he added Apple and Adidas profit shares to his record salary.' },
  { id: 'durant', name: 'Kevin Durant', country: 'US', age: 37, source: 'NBA, venture capital', tab: 'athletes', base: 0.85, bio: 'Two-time NBA champion who spends his off-seasons investing — his fund backed Coinbase and Acorns early.' },
  { id: 'shaq', name: 'Shaquille O\'Neal', country: 'US', age: 54, source: 'NBA, franchises', tab: 'athletes', base: 0.65, bio: "The Diesel is as famous for franchises as rings — he owns hundreds of Five Guys, Auntie Anne's and Papa John's locations, plus early Google shares." },

  { id: 'slim', name: 'Carlos Slim', country: 'MX', age: 86, source: 'América Móvil', tab: 'nontech', base: 118.0, bio: "Mexico's telecom titan. His América Móvil dominates phone and internet service across Latin America — he was the world's richest man from 2010 to 2013." },
  { id: 'walton_jim', name: 'Jim Walton', country: 'US', age: 78, source: 'Walmart, Arvest Bank', tab: 'nontech', base: 116.0, bio: "Sam Walton's eldest surviving son. He chairs the family's Arvest Bank and holds one of the three big sibling stakes in Walmart." },
  { id: 'koch_charles', name: 'Charles Koch', country: 'US', age: 90, source: 'Koch Industries', tab: 'nontech', base: 66.0, bio: 'Runs Koch Industries, the private giant behind everything from gasoline to carpets — one of the biggest, and most political, fortunes in America.' },
  { id: 'yanai', name: 'Tadashi Yanai', country: 'JP', age: 77, source: 'Uniqlo (Fast Retailing)', tab: 'nontech', base: 52.0, bio: "Took his father's tailor shop in a small Japanese city and turned it into Uniqlo — the world's third-largest clothing retailer." },
  { id: 'schwarz', name: 'Dieter Schwarz', country: 'DE', age: 87, source: 'Lidl, Kaufland', tab: 'nontech', base: 48.0, bio: "Owns half of Lidl and Kaufland parent Schwarz Group, Europe's biggest retailer. He lives quietly in a small Swabian town and almost never appears in public." },
  { id: 'ferrero', name: 'Giovanni Ferrero', country: 'IT', age: 62, source: 'Ferrero Group', tab: 'nontech', base: 46.0, bio: 'Runs the family firm behind Nutella, Kinder and Ferrero Rocher — the chocolate empire his grandfather started in 1940s Italy.' },
  { id: 'knight', name: 'Phil Knight', country: 'US', age: 88, source: 'Nike', tab: 'nontech', base: 42.0, bio: 'A middle-distance runner turned accountant who founded Nike with a $1,200 loan and built it into the world\'s biggest sportswear brand.' }
];

const NONTECH_REFS = ['arnault', 'buffett', 'ortega'];

const SEC_UA = 'OpenWallet/1.0 (contact: local-project@example.com)';
const BRK_CIK = '0001067983';
const BRK_TICKERS = {
  'APPLE INC': 'NASDAQ:AAPL',
  'AMERICAN EXPRESS CO': 'NYSE:AXP',
  'ALPHABET INC': 'NASDAQ:GOOGL',
  'COCA COLA CO': 'NYSE:KO',
  'BANK OF AMER CORP': 'NYSE:BAC',
  'CHEVRON CORPORATION': 'NYSE:CVX',
  'OCCIDENTAL PETE CORP': 'NYSE:OXY',
  'CHUBB LIMITED': 'NYSE:CB',
  'MOODYS CORP': 'NYSE:MCO',
  "MOODY'S CORP": 'NYSE:MCO',
  'KRAFT HEINZ CO': 'NASDAQ:KHC',
  'DAVITA INC': 'NYSE:DVA',
  'DELTA AIR LINES INC': 'NYSE:DAL'
};

const TRACKED = PEOPLE.concat(EXTRA);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const prices = new Map();
const baselinePrice = new Map();
const privateAssets = new Map();
const history = new Map();
const lastDeltas = new Map();
const failStreak = new Map();
const cooldownUntil = new Map();
let fx = { rate: 1.08, ts: 0 };
let updatedAt = null;
let nextPollAt = null;
let serverStartedAt = null;
let berkshire = { filed: null, asOf: null, positions: [], positionCount: 0, secValue: 0 };
let market = { btc: null, sp500: null, us10y: null, ts: null };
const brkPrices = new Map();
const viewers = new Map();
let lastRankOrder = null;
const flipLog = [];
const RANK_WEBHOOK = process.env.RANK_WEBHOOK || '';
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3000';

async function sendFlipWebhook(flip) {
  if (!RANK_WEBHOOK) return;
  try {
    await fetch(RANK_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: `RANK FLIP on Open Wallet: ${flip.aName} just passed ${flip.bName} for #${flip.rank} — watch it live: ${PUBLIC_URL}` })
    });
  } catch (e) {
    console.error('flip webhook failed:', e.message);
  }
}

function detectFlips() {
  const rows = PEOPLE.map((p) => {
    const { total, complete } = holdingsUsd(p);
    const nw = complete && privateAssets.has(p.id) ? (total + privateAssets.get(p.id)) / 1e9 : (history.get(p.id)?.at(-1)?.v ?? p.base);
    return { id: p.id, nw };
  }).sort((a, b) => b.nw - a.nw);
  const order = rows.map((r) => r.id);
  if (lastRankOrder) {
    for (let i = 0; i < order.length; i++) {
      const prevIdx = lastRankOrder.indexOf(order[i]);
      if (prevIdx > i) {
        const swappedWith = lastRankOrder[i];
        if (order.indexOf(swappedWith) === prevIdx) {
          const aName = (PEOPLE.find((p) => p.id === order[i]) || {}).name || order[i];
          const bName = (PEOPLE.find((p) => p.id === swappedWith) || {}).name || swappedWith;
          const flip = { t: Date.now(), aName, bName, rank: i + 1 };
          flipLog.unshift(flip);
          if (flipLog.length > 20) flipLog.pop();
          console.log(`RANK FLIP: ${aName} passed ${bName} for #${i + 1}`);
          sendFlipWebhook(flip);
        }
      }
    }
  }
  lastRankOrder = order;
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function tvScan(tickers) {
  const res = await fetch('https://scanner.tradingview.com/america/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
    body: JSON.stringify({ symbols: { tickers }, columns: ['close', 'change'] })
  });
  if (!res.ok) throw new Error(`TV HTTP ${res.status}`);
  const j = await res.json();
  const out = new Map();
  for (const row of j.data || []) {
    const close = row.d && row.d[0];
    if (isFinite(close)) out.set(row.s, { price: close, changePct: row.d[1] });
  }
  return out;
}

async function fetchBerkshire13F() {
  try {
    const subRes = await fetch(`https://data.sec.gov/submissions/CIK${BRK_CIK}.json`, { headers: { 'User-Agent': SEC_UA } });
    if (!subRes.ok) throw new Error('submissions HTTP ' + subRes.status);
    const sub = await subRes.json();
    const recent = sub.filings.recent;
    const idx = recent.form.findIndex((f) => f === '13F-HR');
    if (idx === -1) return;
    const acc = recent.accessionNumber[idx];
    const accNoDashes = acc.replace(/-/g, '');
    const filed = recent.filingDate[idx];
    const ixRes = await fetch(`https://www.sec.gov/Archives/edgar/data/${parseInt(BRK_CIK)}/${accNoDashes}/index.json`, { headers: { 'User-Agent': SEC_UA } });
    if (!ixRes.ok) throw new Error('index HTTP ' + ixRes.status);
    const ix = await ixRes.json();
    const xmlItems = (ix.directory.item || []).filter((f) => f.name.endsWith('.xml') && f.name !== 'primary_doc.xml');
    if (!xmlItems.length) return;
    xmlItems.sort((a, b) => (b.size || 0) - (a.size || 0));
    const xmlRes = await fetch(`https://www.sec.gov/Archives/edgar/data/${parseInt(BRK_CIK)}/${accNoDashes}/${xmlItems[0].name}`, { headers: { 'User-Agent': SEC_UA } });
    if (!xmlRes.ok) throw new Error('xml HTTP ' + xmlRes.status);
    const xml = await xmlRes.text();

    const agg = new Map();
    let totalValue = 0;
    const re = /<infoTable>([\s\S]*?)<\/infoTable>/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      const b = m[1];
      if (/<putCall>/.test(b)) continue;
      if (!/SH<\/sshPrnamtType>/.test(b)) continue;
      const name = (b.match(/<nameOfIssuer>([^<]+)</) || [])[1];
      if (!name) continue;
      const shares = parseFloat(((b.match(/<sshPrnamt>([^<]+)</) || [])[1] || '0').replace(/,/g, ''));
      const value = parseFloat((b.match(/<value>([^<]+)</) || [])[1] || '0');
      if (!isFinite(shares) || shares <= 0) continue;
      const cur = agg.get(name) || { shares: 0, value: 0 };
      cur.shares += shares;
      cur.value += value;
      agg.set(name, cur);
    }
    const rows = [...agg].map(([name, v]) => ({ issuer: name, ...v })).sort((a, b) => b.value - a.value);
    for (const r of rows) totalValue += r.value;
    const positions = [];
    for (const r of rows) {
      const ticker = BRK_TICKERS[r.issuer];
      if (ticker && positions.length < 10) positions.push({ issuer: r.issuer, ticker, shares: r.shares, secValue: r.value });
    }
    berkshire = { filed, asOf: Date.now(), positions, positionCount: rows.length, secValue: totalValue };
    console.log(`Berkshire 13F loaded: filed ${filed}, ${rows.length} issuers, ${positions.length} live-priced (SEC value $${(totalValue / 1e9).toFixed(1)}B)`);
  } catch (e) {
    console.error('Berkshire 13F fetch failed:', e.message);
  }
}

async function refreshBrkPrices() {
  const tickers = [...new Set(berkshire.positions.map((p) => p.ticker))];
  if (!tickers.length) return;
  try {
    const out = await tvScan(tickers);
    for (const [t, v] of out) brkPrices.set(t, { ...v, ts: Date.now() });
  } catch (e) {
    console.error('Berkshire price fetch failed:', e.message);
  }
}

function fredLatest(csv) {
  const lines = csv.trim().split('\n').slice(1);
  const pts = [];
  for (const line of lines) {
    const [d, v] = line.split(',');
    const num = parseFloat(v);
    if (isFinite(num)) pts.push({ d, v: num });
  }
  return pts.length ? { last: pts[pts.length - 1], prev: pts[pts.length - 2] || pts[pts.length - 1] } : null;
}

async function fetchMarket() {
  const cosd = new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);
  const jobs = await Promise.allSettled([
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true', { headers: { 'User-Agent': UA } }).then((r) => r.json()),
    fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=SP500&cosd=${cosd}`, { headers: { 'User-Agent': UA } }).then((r) => r.text()),
    fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=DGS10&cosd=${cosd}`, { headers: { 'User-Agent': UA } }).then((r) => r.text())
  ]);
  const next = { btc: null, sp500: null, us10y: null, ts: Date.now() };
  if (jobs[0].status === 'fulfilled' && jobs[0].value && jobs[0].value.bitcoin) {
    next.btc = { price: jobs[0].value.bitcoin.usd, change24hPct: jobs[0].value.bitcoin.usd_24h_change || 0 };
  }
  if (jobs[1].status === 'fulfilled') {
    const f = fredLatest(jobs[1].value);
    if (f) next.sp500 = { level: f.last.v, changePct: ((f.last.v / f.prev.v) - 1) * 100, asOf: f.last.d };
  }
  if (jobs[2].status === 'fulfilled') {
    const f = fredLatest(jobs[2].value);
    if (f) next.us10y = { yieldPct: f.last.v, changeBps: (f.last.v - f.prev.v) * 100, asOf: f.last.d };
  }
  market = next;
  console.log(`market context updated: BTC ${next.btc ? '$' + next.btc.price.toLocaleString() : '—'} · S&P ${next.sp500 ? next.sp500.level.toFixed(0) + ' (' + next.sp500.asOf + ')' : '—'} · 10Y ${next.us10y ? next.us10y.yieldPct + '%' : '—'}`);
}

function parseGooglePrice(html) {
  const m = html.match(/(?:[$€]\s?([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s?€)/);
  if (!m) return null;
  const num = parseFloat((m[1] || m[2]).replace(/,/g, ''));
  if (!isFinite(num) || num <= 0) return null;
  return num;
}

async function fetchPrice(slug) {
  if ((cooldownUntil.get(slug) || 0) > Date.now()) return false;
  try {
    const html = await fetchText(`https://www.google.com/finance/quote/${encodeURIComponent(slug)}`);
    const price = parseGooglePrice(html);
    if (!price) throw new Error('no price found');
    const prev = prices.get(slug);
    prices.set(slug, { price, ts: Date.now() });
    failStreak.set(slug, 0);
    if (!baselinePrice.has(slug)) baselinePrice.set(slug, price);
    if (!prev || prev.price !== price) console.log(`price ${slug} = ${price}`);
    return true;
  } catch (e) {
    try {
      const [ticker, exchange] = slug.split(':');
      const out = await tvScan([`${exchange}:${ticker}`]);
      const hit = out.get(`${exchange}:${ticker}`);
      if (hit && isFinite(hit.price) && hit.price > 0) {
        const prev = prices.get(slug);
        prices.set(slug, { price: hit.price, ts: Date.now() });
        if (!baselinePrice.has(slug)) baselinePrice.set(slug, hit.price);
        failStreak.set(slug, 0);
        if (!prev || prev.price !== hit.price) console.log(`price ${slug} = ${hit.price} (TradingView)`);
        return true;
      }
    } catch (e2) {
      console.error(`TradingView fallback failed for ${slug}: ${e2.message}`);
    }
    const n = (failStreak.get(slug) || 0) + 1;
    failStreak.set(slug, n);
    if (n >= 3) {
      const cycles = Math.min(n, 8);
      cooldownUntil.set(slug, Date.now() + cycles * POLL_MS);
      console.error(`backing off ${slug} for ${cycles} cycles after ${n} failures`);
    } else {
      console.error(`price fetch failed for ${slug}: ${e.message}`);
    }
    return false;
  }
}

async function fetchFx() {
  if (Date.now() - fx.ts < 3_600_000) return;
  try {
    const j = JSON.parse(await fetchText('https://api.frankfurter.dev/v1/latest?base=EUR&symbols=USD'));
    if (j.rates && j.rates.USD) fx = { rate: j.rates.USD, ts: Date.now() };
  } catch (e) {
    console.error('FX fetch failed:', e.message);
  }
}

function uniqueSlugs() {
  return [...new Set(TRACKED.flatMap((p) => p.holdings.map((h) => h.slug)))];
}

async function pollPrices() {
  if (process.env.QUOTE_SOURCE === 'tradingview') {
    try {
      const slugs = uniqueSlugs();
      const tvTickers = slugs.map((s) => {
        const [t, ex] = s.split(':');
        return `${ex}:${t}`;
      });
      const out = await tvScan(tvTickers);
      let ok = 0;
      for (const slug of slugs) {
        const [t, ex] = slug.split(':');
        const hit = out.get(`${ex}:${t}`);
        if (hit && isFinite(hit.price) && hit.price > 0) {
          const prev = prices.get(slug);
          prices.set(slug, { price: hit.price, ts: Date.now() });
          if (!baselinePrice.has(slug)) baselinePrice.set(slug, hit.price);
          failStreak.set(slug, 0);
          if (!prev || prev.price !== hit.price) console.log(`price ${slug} = ${hit.price} (tv-batch)`);
          ok++;
        }
      }
      if (ok > 0) return;
    } catch (e) {
      console.error('tv batch failed, falling back to per-quote fetch:', e.message);
    }
  }
  for (const slug of uniqueSlugs()) {
    await fetchPrice(slug);
    await new Promise((r) => setTimeout(r, STAGGER_MS));
  }
}

function priceUsd(slug, currency) {
  const entry = prices.get(slug);
  if (!entry) return null;
  return currency === 'EUR' ? entry.price * fx.rate : entry.price;
}

function holdingsUsd(p) {
  let total = 0;
  let complete = true;
  for (const h of p.holdings) {
    const usd = priceUsd(h.slug, h.currency);
    if (usd == null) {
      complete = false;
      continue;
    }
    total += usd * h.shares;
  }
  return { total, complete };
}

function stockRows(p) {
  return p.holdings.map((h) => {
    const entry = prices.get(h.slug);
    const usd = priceUsd(h.slug, h.currency);
    const bl = baselinePrice.get(h.slug);
    return {
      slug: h.slug,
      ticker: h.slug.split(':')[0],
      price: entry ? entry.price : null,
      currency: h.currency,
      shares: h.shares,
      valueUsd: usd != null ? usd * h.shares : null,
      baselinePrice: bl ?? null,
      priceDelta: entry && bl != null ? entry.price - bl : null,
      priceDeltaPct: entry && bl != null ? ((entry.price - bl) / bl) * 100 : null,
      ageMs: entry ? Date.now() - entry.ts : null
    };
  });
}

function ensureCalibrated(p) {
  if (privateAssets.has(p.id)) return;
  const { total, complete } = holdingsUsd(p);
  if (!complete) return;
  privateAssets.set(p.id, p.base * 1e9 - total);
  console.log(`calibrated ${p.name}: stakes $${(total / 1e9).toFixed(2)}B, private/other $${(privateAssets.get(p.id) / 1e9).toFixed(2)}B`);
}

function saveState() {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify({
      version: 1,
      savedAt: Date.now(),
      prices: [...prices],
      baselinePrice: [...baselinePrice],
      privateAssets: [...privateAssets],
      lastDeltas: [...lastDeltas],
      history: [...history],
      fx,
      updatedAt,
      serverStartedAt,
      flipLog,
      lastRankOrder
    }));
  } catch (e) {
    console.error('state save failed:', e.message);
  }
}

function loadState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return false;
    const s = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!s.savedAt || Date.now() - s.savedAt > 6 * 3600_000) return false;
    for (const [k, v] of s.prices || []) prices.set(k, v);
    for (const [k, v] of s.baselinePrice || []) baselinePrice.set(k, v);
    for (const [k, v] of s.privateAssets || []) privateAssets.set(k, v);
    for (const [k, v] of s.lastDeltas || []) lastDeltas.set(k, v);
    for (const [k, v] of s.history || []) if (Array.isArray(v) && v.length) history.set(k, v);
    if (s.fx && s.fx.rate) fx = s.fx;
    if (s.updatedAt) updatedAt = s.updatedAt;
    if (s.serverStartedAt) serverStartedAt = s.serverStartedAt;
    if (Array.isArray(s.flipLog)) flipLog.push(...s.flipLog.splice(0, 20));
    if (Array.isArray(s.lastRankOrder)) lastRankOrder = s.lastRankOrder;
    console.log(`state restored (saved ${new Date(s.savedAt).toLocaleString()}) — charts and baselines continue from the previous session`);
    return true;
  } catch (e) {
    console.error('state load failed:', e.message);
    return false;
  }
}

async function calibrate() {
  serverStartedAt = serverStartedAt ?? Date.now();
  if (loadState()) {
    for (const p of TRACKED) {
      if (!history.has(p.id)) history.set(p.id, [{ t: Date.now(), v: p.base }]);
      if (!lastDeltas.has(p.id)) lastDeltas.set(p.id, 0);
    }
    await fetchFx();
    await pollPrices();
    for (const p of TRACKED) ensureCalibrated(p);
    updatedAt = updatedAt || Date.now();
    nextPollAt = Date.now() + 8000;
    return;
  }
  serverStartedAt = Date.now();
  for (let attempt = 1; attempt <= 4; attempt++) {
    await fetchFx();
    await pollPrices();
    if (uniqueSlugs().every((s) => prices.has(s))) break;
    console.log(`calibration attempt ${attempt} incomplete, retrying in 4s...`);
    await new Promise((r) => setTimeout(r, 4000));
  }
  for (const p of TRACKED) {
    ensureCalibrated(p);
    history.set(p.id, [{ t: Date.now(), v: p.base }]);
    lastDeltas.set(p.id, 0);
  }
  updatedAt = Date.now();
  nextPollAt = Date.now() + 8000;
}

function trackedRow(p) {
  const { total, complete } = holdingsUsd(p);
  const other = privateAssets.get(p.id) ?? 0;
  const nwUsd = complete && privateAssets.has(p.id) ? total + other : (history.get(p.id)?.at(-1)?.v ?? p.base) * 1e9;
  const nwB = nwUsd / 1e9;
  return {
    id: p.id,
    name: p.name,
    country: p.country,
    age: p.age,
    source: p.source,
    bio: p.bio,
    base: p.base,
    netWorth: nwB,
    deltaBase: nwB - p.base,
    deltaPrev: lastDeltas.get(p.id) ?? 0,
    stakesValue: total / 1e9,
    otherAssets: other / 1e9,
    stocks: stockRows(p),
    live: true
  };
}

function staticRow(s) {
  return {
    id: s.id,
    name: s.name,
    country: s.country,
    age: s.age,
    source: s.source,
    bio: s.bio,
    base: s.base,
    netWorth: s.base,
    deltaBase: 0,
    deltaPrev: 0,
    stakesValue: 0,
    otherAssets: 0,
    stocks: [],
    live: false
  };
}

const byNw = (a, b) => b.netWorth - a.netWorth;
const byAge = (a, b) => a.age - b.age;

function rankList(arr, order, labelFn) {
  const copy = arr.slice();
  copy.sort(order);
  copy.forEach((r, i) => {
    r.rank = i + 1;
    r.rankLabel = labelFn(i + 1);
  });
  return copy;
}

function snapshot() {
  let maxAgeMs = 0;
  const rows = TRACKED.map((p) => {
    const r = trackedRow(p);
    for (const s of r.stocks) {
      if (s.ageMs != null && s.ageMs > maxAgeMs) maxAgeMs = s.ageMs;
    }
    return r;
  });
  const byId = new Map(rows.map((r) => [r.id, r]));

  const mainRows = rows.filter((r) => PEOPLE.some((p) => p.id === r.id));
  mainRows.sort(byNw);
  mainRows.forEach((r, i) => {
    r.rank = i + 1;
    r.rankLabel = `#${i + 1} of the 10 richest`;
  });

  const women = rankList(
    [...rows.filter((r) => EXTRA.some((p) => p.id === r.id && p.tab === 'women')), ...STATIC.filter((s) => s.tab === 'women').map(staticRow)],
    byNw,
    (i) => `#${i} richest woman`
  );

  const youngest = rankList(
    [...rows.filter((r) => EXTRA.some((p) => p.id === r.id && p.tab === 'youngest')), ...STATIC.filter((s) => s.tab === 'youngest').map(staticRow)],
    byAge,
    (i) => `#${i} youngest billionaire`
  );

  const athletes = rankList(
    STATIC.filter((s) => s.tab === 'athletes').map(staticRow),
    byNw,
    (i) => `#${i} richest athlete`
  );

  const nontech = rankList(
    [...NONTECH_REFS.map((id) => byId.get(id)).filter(Boolean), ...STATIC.filter((s) => s.tab === 'nontech').map(staticRow)],
    byNw,
    (i) => `#${i} richest outside tech`
  );

  return {
    status: 'ok',
    updatedAt,
    nextPollAt,
    pollIntervalMs: POLL_MS,
    serverStartedAt,
    fx: fx.rate,
    fxAsOf: fx.ts,
    stale: maxAgeMs > STALE_MS,
    priceAgeMs: maxAgeMs,
    people: mainRows,
    lists: { women, youngest, athletes, nontech },
    flips: flipLog.slice(0, 10),
    viewers: [...viewers.values()].filter((t) => Date.now() - t < 45_000).length,
    berkshire: {
      filed: berkshire.filed,
      positionCount: berkshire.positionCount,
      positions: berkshire.positions.map((p) => {
        const q = brkPrices.get(p.ticker);
        return {
          issuer: p.issuer,
          ticker: p.ticker.split(':')[1],
          shares: p.shares,
          secValue: p.secValue,
          price: q ? q.price : null,
          changePct: q ? q.changePct : null,
          liveValue: q ? q.price * p.shares : null
        };
      })
    },
    market,
    history: Object.fromEntries([...history].map(([id, pts]) => [id, pts.map((pt) => ({ t: pt.t, v: pt.v }))]))
  };
}

async function pollLoop() {
  while (true) {
    await fetchFx();
    await pollPrices();
    for (const p of TRACKED) {
      ensureCalibrated(p);
      const { total, complete } = holdingsUsd(p);
      if (!complete || !privateAssets.has(p.id)) continue;
      const nwB = (total + privateAssets.get(p.id)) / 1e9;
      const prev = history.get(p.id)?.at(-1)?.v ?? nwB;
      lastDeltas.set(p.id, nwB - prev);
      const pts = history.get(p.id);
      pts.push({ t: Date.now(), v: nwB });
      if (pts.length > HISTORY_CAP) pts.shift();
    }
    updatedAt = Date.now();
    nextPollAt = Date.now() + POLL_MS;
    detectFlips();
    await refreshBrkPrices();
    if (!berkshire.asOf || Date.now() - berkshire.asOf > 86400_000) await fetchBerkshire13F();
    if (!market.ts || Date.now() - market.ts > 1800_000) fetchMarket();
    for (const [id, t] of [...viewers]) if (Date.now() - t > 600_000) viewers.delete(id);
    saveState();
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

const PUBLIC_DIR = path.join(__dirname, 'public');
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon' };

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/data') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(snapshot()));
    return;
  }
  if (url.pathname === '/api/ping' && req.method === 'POST') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*' });
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const j = JSON.parse(body || '{}');
        if (j.id) viewers.set(String(j.id).slice(0, 64), Date.now());
      } catch (e) {}
      res.end();
    });
    return;
  }
  if (url.pathname === '/favicon.ico') {
    res.writeHead(204);
    res.end();
    return;
  }
  const file = url.pathname === '/' ? '/index.html' : url.pathname;
  const full = path.normalize(path.join(PUBLIC_DIR, file));
  if (!full.startsWith(PUBLIC_DIR) || !fs.existsSync(full) || !fs.statSync(full).isFile()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(full)] || 'application/octet-stream' });
  fs.createReadStream(full).pipe(res);
});

process.on('SIGINT', () => {
  console.log('shutting down');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500);
});

process.on('uncaughtException', (e) => console.error('uncaught exception (continuing):', e));
process.on('unhandledRejection', (e) => console.error('unhandled rejection (continuing):', e));

calibrate()
  .then(() => {
    server.listen(PORT, () => console.log(`Open Wallet running at http://localhost:${PORT}`));
    fetchBerkshire13F().then(() => refreshBrkPrices());
    fetchMarket();
    pollLoop();
  })
  .catch((e) => {
    console.error('startup failed:', e);
    process.exit(1);
  });
