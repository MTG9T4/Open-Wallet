const API_BASE = window.OW_API || '';

const els = {
  board: document.getElementById('board'),
  bars: document.getElementById('bars'),
  movers: document.getElementById('movers'),
  moversWrap: document.getElementById('movers-wrap'),
  thChange: document.getElementById('th-change'),
  loading: document.getElementById('loading'),
  updated: document.getElementById('updated'),
  countdown: document.getElementById('countdown'),
  combined: document.getElementById('combined'),
  combinedDelta: document.getElementById('combined-delta'),
  liveChip: document.getElementById('live-chip'),
  backdrop: document.getElementById('backdrop'),
  modal: document.getElementById('modal'),
  modalClose: document.getElementById('modal-close'),
  mAvatar: document.getElementById('m-avatar'),
  mRank: document.getElementById('m-rank'),
  mName: document.getElementById('m-name'),
  mSub: document.getElementById('m-sub'),
  mBio: document.getElementById('m-bio'),
  mLiveFlag: document.getElementById('m-live-flag'),
  mMain: document.getElementById('m-main'),
  mNw: document.getElementById('m-nw'),
  mDeltaOpen: document.getElementById('m-delta-open'),
  mDeltaBase: document.getElementById('m-delta-base'),
  mRate: document.getElementById('m-rate'),
  mFun: document.getElementById('m-fun'),
  mChartWrap: document.getElementById('m-chart-wrap'),
  mChart: document.getElementById('m-chart'),
  mChartNote: document.getElementById('m-chart-note'),
  mHoldingsWrap: document.getElementById('m-holdings-wrap'),
  mHoldings: document.getElementById('m-holdings'),
  mStocksWrap: document.getElementById('m-stocks-wrap'),
  mStocks: document.getElementById('m-stocks'),
  mNote: document.getElementById('m-note'),
  mFunLine: document.getElementById('m-fun-line'),
  mSalary: document.getElementById('m-salary'),
  mEarnLine: document.getElementById('m-earn-line'),
  marketStatus: document.getElementById('market-status'),
  searchInput: document.getElementById('search-input'),
  searchResults: document.getElementById('search-results'),
  marketStrip: document.getElementById('market-strip'),
  themeToggle: document.getElementById('theme-toggle'),
  mBrkWrap: document.getElementById('m-brk-wrap'),
  mBrkRows: document.getElementById('m-brk-rows'),
  mBrkTitle: document.getElementById('m-brk-title'),
  mBrkNote: document.getElementById('m-brk-note'),
  watchers: document.getElementById('watchers'),
  mSpendOpen: document.getElementById('m-spend-open'),
  spendLayer: document.getElementById('spend-layer'),
  spendBack: document.getElementById('spend-back'),
  spAvatar: document.getElementById('sp-avatar'),
  spImg: document.getElementById('sp-img'),
  spName: document.getElementById('sp-name'),
  spNw: document.getElementById('sp-nw'),
  spFlag: document.getElementById('sp-flag'),
  spRemaining: document.getElementById('sp-remaining'),
  spSpent: document.getElementById('sp-spent'),
  spPct: document.getElementById('sp-pct'),
  spFill: document.getElementById('sp-fill'),
  spendGrid: document.getElementById('spend-grid'),
  spendReset: document.getElementById('spend-reset'),
  spendShare: document.getElementById('spend-share'),
  mShareX: document.getElementById('m-share-x'),
  mShareCopy: document.getElementById('m-share-copy'),
  toasts: document.getElementById('toasts'),
  confetti: document.getElementById('confetti'),
  trillionWrap: document.getElementById('trillion-wrap'),
  trName: document.getElementById('tr-name'),
  trNw: document.getElementById('tr-nw'),
  trPct: document.getElementById('tr-pct'),
  trGap: document.getElementById('tr-gap'),
  trFill: document.getElementById('tr-fill'),
  trPace: document.getElementById('tr-pace'),
  trAvatar: document.getElementById('tr-avatar'),
  trImg: document.getElementById('tr-img'),
  flipsWrap: document.getElementById('flips-wrap'),
  flips: document.getElementById('flips')
};

const milestones = new Map();
const MILESTONE_PCTS = [0.5, 1, 2, 5];

function checkMilestones(data) {
  for (const p of data.people) {
    if (!p.live || !p.base) continue;
    const pct = (p.deltaBase / p.base) * 100;
    const m = milestones.get(p.id) || { up: 0, down: 0 };
    const first = p.name.split(' ')[0];
    for (const th of MILESTONE_PCTS) {
      if (pct >= th && m.up < th) {
        m.up = th;
        toast(`${first} is up over ${th}% since open`, `${fmtSigned(p.deltaBase)} — live on Open Wallet`);
      }
      if (-pct >= th && m.down < th) {
        m.down = th;
        toast(`${first} is down over ${th}% since open`, `${fmtSigned(p.deltaBase)} — live on Open Wallet`);
      }
    }
    milestones.set(p.id, m);
  }
}

function renderTrillion(data) {
  const top = data.people[0];
  if (state.tab !== 'top' || !top || top.netWorth < 700) {
    els.trillionWrap.style.display = 'none';
    return;
  }
  els.trillionWrap.style.display = '';
  els.trName.textContent = top.name;
  els.trNw.textContent = fmtMoney(top.netWorth);
  const pct = Math.min(100, (top.netWorth / 1000) * 100);
  els.trPct.textContent = pct.toFixed(1) + '% of the way';
  els.trFill.style.width = pct + '%';
  els.trGap.textContent = fmtMoney(1000 - top.netWorth) + ' to go';

  const init = els.trAvatar.querySelector('.init');
  const ini = initials(top.name);
  if (init.textContent !== ini) init.textContent = ini;
  if (els.trImg.dataset.for !== top.id) {
    els.trImg.dataset.for = top.id;
    els.trImg.style.display = '';
    els.trImg.src = '/photos/' + top.id + '.jpg';
  }

  const pts = data.history[top.id] || [];
  let paceTxt = isWeekend() ? 'markets closed — resumes Monday' : 'waiting for markets to move';
  if (pts.length >= 4) {
    const t0 = pts[0].t;
    const t1 = pts[pts.length - 1].t;
    const hours = (t1 - t0) / 3600_000;
    const perH = (pts[pts.length - 1].v - pts[0].v) / Math.max(0.1, hours);
    if (hours >= 0.75 && perH > 0.05) {
      const etaH = (1000 - top.netWorth) / perH;
      paceTxt = 'at this pace: ' + (etaH >= 48 ? Math.round(etaH / 24) + ' days' : etaH >= 1 ? Math.round(etaH) + ' hours' : Math.max(1, Math.round(etaH * 60)) + ' minutes');
    } else if (hours >= 0.75 && perH < -0.05) {
      paceTxt = 'moving away from $1T — ' + fmtSigned(perH) + '/hr';
    }
  }
  els.trPace.textContent = paceTxt;
}

function renderFlips(data) {
  if (state.tab !== 'top' || !data.flips || !data.flips.length) {
    els.flipsWrap.style.display = 'none';
    return;
  }
  els.flipsWrap.style.display = '';
  els.flips.innerHTML = data.flips
    .slice(0, 5)
    .map(
      (f) => `
      <li>
        <span class="flip-time">${new Date(f.t).toLocaleTimeString()}</span>
        <span><b>${f.aName}</b> passed <b>${f.bName}</b></span>
        <span class="flip-rank">now #${f.rank}</span>
      </li>`
    )
    .join('');
}

const COUNTRIES = {
  US: 'United States', FR: 'France', ES: 'Spain', TW: 'Taiwan', MX: 'Mexico', JP: 'Japan',
  DE: 'Germany', IT: 'Italy', NO: 'Norway', AT: 'Austria', KR: 'South Korea', CH: 'Switzerland',
  PT: 'Portugal', AR: 'Argentina', AU: 'Australia', CL: 'Chile', IN: 'India'
};

const HOLD_COLORS = ['#c9a227', '#4f6fc4', '#4fd1c5', '#e8875a', '#b48ef5', '#6ea8ff'];

const TABS = ['top', 'women', 'youngest', 'athletes', 'nontech', 'bars'];
const LIST_TABS = ['top', 'women', 'youngest', 'athletes', 'nontech'];
const TAB_LABELS = { top: 'Top 10', women: 'Richest women', youngest: 'Youngest', athletes: 'Athletes', nontech: 'Non-tech' };

const state = {
  data: null,
  tab: 'top',
  modalTab: null,
  modalId: null,
  openAt: Date.now(),
  openVals: new Map(),
  colorOf: new Map(),
  salary: 50000,
  hashChecked: false
};

const rowEls = new Map();
const barEls = new Map();
const shown = new Map();
const tweens = new Map();
const flashTimers = new Map();
let modalBuiltFor = null;
let modalTimer = null;

function colorFor(id) {
  if (!state.colorOf.has(id)) state.colorOf.set(id, HOLD_COLORS[state.colorOf.size % HOLD_COLORS.length]);
  return state.colorOf.get(id);
}

function fmtMoney(b) {
  const abs = Math.abs(b);
  if (abs >= 1000) return '$' + (abs / 1000).toFixed(3) + 'T';
  if (abs >= 1) return '$' + abs.toFixed(1) + 'B';
  return '$' + Math.round(abs * 1000) + 'M';
}

function fmtSigned(b) {
  if (Math.abs(b) < 0.0005) return 'no change';
  return (b > 0 ? '+' : '−') + fmtMoney(Math.abs(b));
}

function pctStr(b, base) {
  if (!base || Math.abs(b) < 0.0005) return '';
  const pct = Math.abs((b / base) * 100);
  const dp = pct >= 10 ? 1 : 2;
  return ' (' + (b > 0 ? '+' : '−') + pct.toFixed(dp) + '%)';
}

function arrowSigned(b, base) {
  if (Math.abs(b) < 0.0005) return '· no change';
  return (b > 0 ? '▲ +' : '▼ −') + fmtMoney(Math.abs(b)) + pctStr(b, base);
}

function deltaClass(b) {
  return b > 0.0005 ? 'up' : b < -0.0005 ? 'down' : 'flat';
}

function initials(name) {
  return name.replace(/&/g, ' ').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function tween(key, target, render) {
  const from = shown.has(key) ? shown.get(key) : target;
  if (Math.abs(target - from) < 0.0005) {
    cancelAnimationFrame(tweens.get(key));
    tweens.delete(key);
    shown.set(key, target);
    render(target);
    return;
  }
  cancelAnimationFrame(tweens.get(key));
  const t0 = performance.now();
  const dur = 900;
  const step = (now) => {
    const k = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    const v = from + (target - from) * e;
    shown.set(key, v);
    render(v);
    if (k < 1) tweens.set(key, requestAnimationFrame(step));
  };
  tweens.set(key, requestAnimationFrame(step));
}

function flip(container, applyOrder) {
  const before = new Map();
  for (const el of container.children) before.set(el, el.getBoundingClientRect().top);
  applyOrder();
  for (const el of container.children) {
    if (!before.has(el)) continue;
    const dy = before.get(el) - el.getBoundingClientRect().top;
    if (Math.abs(dy) < 1) continue;
    el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
}

function flashRow(li, dir) {
  li.classList.remove('flash-up', 'flash-down');
  void li.offsetWidth;
  li.classList.add(dir > 0 ? 'flash-up' : 'flash-down');
  clearTimeout(flashTimers.get(li));
  flashTimers.set(li, setTimeout(() => li.classList.remove('flash-up', 'flash-down'), 1450));
}

function setChip(label, delayed) {
  els.liveChip.classList.toggle('delayed', delayed);
  els.liveChip.innerHTML = '<span class="dot"></span>' + label;
}

function toast(msg, sub) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `${msg}${sub ? `<span class="toast-sub">${sub}</span>` : ''}`;
  els.toasts.appendChild(el);
  const kill = () => {
    el.classList.add('gone');
    setTimeout(() => el.remove(), 350);
  };
  el.addEventListener('click', kill);
  setTimeout(kill, 6500);
}

const CONFETTI_COLORS = ['#f5c451', '#34d399', '#6ea8ff', '#f87171', '#ffffff'];
let confettiAnim = null;

function confettiBurst(count = 90) {
  const canvas = els.confetti;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  const W = window.innerWidth;
  const parts = [];
  for (let i = 0; i < count; i++) {
    parts.push({
      x: W / 2 + (Math.random() - 0.5) * 160,
      y: -12,
      vx: (Math.random() - 0.5) * 9,
      vy: 2 + Math.random() * 5,
      w: 5 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      c: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]
    });
  }
  const t0 = performance.now();
  cancelAnimationFrame(confettiAnim);
  const step = (now) => {
    const elapsed = now - t0;
    ctx.clearRect(0, 0, W, window.innerHeight);
    let alive = 0;
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12;
      p.rot += p.vr;
      if (p.y < window.innerHeight + 20) alive++;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive > 0 && elapsed < 3200) {
      confettiAnim = requestAnimationFrame(step);
    } else {
      ctx.clearRect(0, 0, W, window.innerHeight);
    }
  };
  confettiAnim = requestAnimationFrame(step);
}

function pingViewers() {
  let vid = null;
  try {
    vid = localStorage.getItem('ow-vid');
    if (!vid) {
      vid = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem('ow-vid', vid);
    }
  } catch (e) {
    vid = 'anon-' + Math.random().toString(36).slice(2);
  }
  fetch(API_BASE + '/api/ping', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: vid })
  }).catch(() => {});
}

const prevRanks = new Map();

function checkRankFlips() {
  const people = state.data.people;
  if (prevRanks.size) {
    for (const a of people) {
      const pa = prevRanks.get(a.id);
      if (pa == null || a.rank >= pa) continue;
      const b = people.find((x) => x.id !== a.id && prevRanks.get(x.id) === a.rank && x.rank === pa);
      if (b) {
        toast(`RANK FLIP: ${a.name} passed ${b.name}`, `now #${a.rank} — live on Open Wallet`);
        confettiBurst();
      }
    }
  }
  prevRanks.clear();
  people.forEach((p) => prevRanks.set(p.id, p.rank));
}

function tLabel(t) {
  return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function drawChart(canvas, pts, liveV) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;
  ctx.clearRect(0, 0, W, H);

  const data = pts.slice();
  if (liveV != null) data.push({ t: Date.now(), v: liveV });
  if (data.length < 2) {
    ctx.fillStyle = 'rgba(138,147,166,0.75)';
    ctx.font = '13px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Collecting live data — points arrive every 15 seconds…', W / 2, H / 2);
    return;
  }

  const pad = { l: 58, r: 18, t: 30, b: 26 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  let min = Math.min(...data.map((d) => d.v));
  let max = Math.max(...data.map((d) => d.v));
  let span = max - min;
  if (span <= 0) span = Math.max(0.002, Math.abs(max) * 0.0004);
  min -= span * 0.18;
  max += span * 0.18;
  const t0 = data[0].t;
  const t1 = data[data.length - 1].t;
  const X = (t) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * innerW;
  const Y = (v) => pad.t + innerH - ((v - min) / (max - min)) * innerH;

  ctx.font = '10.5px ui-monospace, Menlo, monospace';
  for (let i = 0; i <= 3; i++) {
    const gv = min + ((max - min) * i) / 3;
    const gy = Y(gv);
    ctx.strokeStyle = 'rgba(255,255,255,0.055)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, gy);
    ctx.lineTo(W - pad.r, gy);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232,236,243,0.42)';
    ctx.textAlign = 'right';
    ctx.fillText(fmtMoney(gv), pad.l - 8, gy + 3.5);
  }
  ctx.fillStyle = 'rgba(232,236,243,0.42)';
  ctx.textAlign = 'left';
  ctx.fillText(tLabel(t0), pad.l, H - 8);
  ctx.textAlign = 'right';
  ctx.fillText(tLabel(t1), W - pad.r, H - 8);

  const up = data[data.length - 1].v >= data[0].v;
  const lineC = up ? '#34d399' : '#f87171';

  ctx.beginPath();
  data.forEach((d, i) => (i ? ctx.lineTo(X(d.t), Y(d.v)) : ctx.moveTo(X(d.t), Y(d.v))));
  ctx.strokeStyle = lineC;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.lineTo(X(t1), pad.t + innerH);
  ctx.lineTo(X(t0), pad.t + innerH);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + innerH);
  grad.addColorStop(0, up ? 'rgba(52,211,153,0.20)' : 'rgba(248,113,113,0.20)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fill();

  const ex = X(t1);
  const ey = Y(data[data.length - 1].v);
  const phase = (Date.now() % 1400) / 1400;
  ctx.beginPath();
  ctx.arc(ex, ey, 4 + phase * 11, 0, Math.PI * 2);
  ctx.fillStyle = up ? `rgba(52,211,153,${0.45 * (1 - phase)})` : `rgba(248,113,113,${0.45 * (1 - phase)})`;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = lineC;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(ex, ey, 2, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();

  const tag = fmtMoney(data[data.length - 1].v);
  ctx.font = '800 12.5px ui-monospace, Menlo, monospace';
  const tw = ctx.measureText(tag).width + 20;
  const th = 24;
  const tx = Math.min(W - pad.r - tw, Math.max(pad.l, ex - tw / 2));
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(tx, 2, tw, th, 12);
  else ctx.rect(tx, 2, tw, th);
  ctx.fillStyle = up ? 'rgba(52,211,153,0.14)' : 'rgba(248,113,113,0.14)';
  ctx.fill();
  ctx.strokeStyle = up ? 'rgba(52,211,153,0.5)' : 'rgba(248,113,113,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = lineC;
  ctx.textAlign = 'center';
  ctx.fillText(tag, tx + tw / 2, 18.5);
}

function stockLine(p) {
  const bits = p.stocks.map((s) => {
    const px = s.price == null ? '—' : (s.currency === 'EUR' ? '€' : '$') + s.price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const pct = s.priceDeltaPct == null ? '' : ' (' + (s.priceDeltaPct >= 0 ? '+' : '') + s.priceDeltaPct.toFixed(2) + '%)';
    return `${s.ticker} ${px}${pct}`;
  });
  const other = (p.otherAssets >= 0 ? 'private $' : 'adjustments $') + p.otherAssets.toFixed(1) + 'B (est.)';
  return bits.join(' · ') + ' · ' + other;
}

function ensureRow(tab, p) {
  const key = tab + ':' + p.id;
  let li = rowEls.get(key);
  if (!li) {
    li = document.createElement('li');
    li.className = 'row';
    li.dataset.id = p.id;
    li.tabIndex = 0;
    li.setAttribute('role', 'button');
    li.setAttribute('aria-label', p.name + ' — view details');
    li.innerHTML = `
      <span class="rank-chip"></span>
      <div class="avatar"><span class="init"></span><img alt="" loading="lazy" src="/photos/${p.id}.jpg"><span class="avatar-badge"></span></div>
      <div class="who">
        <div class="name-line"><span class="name"></span><span class="cc"></span></div>
        <div class="source-line"></div>
        <div class="stake-line"></div>
      </div>
      <div class="age-col"></div>
      <div class="wealth">
        <div class="nw"></div>
        <div class="row-chips"><span class="chip flat delta"></span><button class="spend-btn">Spend it</button></div>
      </div>`;
    const img = li.querySelector('.avatar img');
    img.addEventListener('error', () => img.remove());
    li.querySelector('.spend-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openSpend(p.id);
    });
    li.addEventListener('click', () => openModal(p.id));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(p.id);
      }
    });
    rowEls.set(key, li);
  }
  return li;
}

function updateRow(tab, li, p) {
  const init = li.querySelector('.init');
  const ini = initials(p.name);
  if (init.textContent !== ini) init.textContent = ini;

  const rank = li.querySelector('.rank-chip');
  rank.textContent = p.rank;
  rank.className = 'rank-chip' + (tab !== 'youngest' && p.rank <= 3 ? ' top' + p.rank : '');

  li.querySelector('.name').textContent = p.name;
  li.querySelector('.cc').textContent = p.country;
  li.querySelector('.source-line').textContent = p.source;
  li.querySelector('.age-col').textContent = p.age != null ? p.age : '—';

  const badge = li.querySelector('.avatar-badge');
  badge.className = 'avatar-badge ' + (p.live ? 'live' : 'est');
  badge.title = p.live ? 'Live — priced from real stock quotes' : 'Estimate — Forbes-style figure, not price-tracked';

  const stake = li.querySelector('.stake-line');
  if (tab === 'top' && p.stocks && p.stocks.length) {
    stake.className = 'stake-line';
    stake.textContent = stockLine(p);
  } else if (p.bio) {
    stake.className = 'stake-line bio';
    stake.textContent = p.bio;
  } else {
    stake.className = 'stake-line';
    stake.textContent = '';
  }

  tween('nw-' + tab + ':' + p.id, p.netWorth, (v) => (li.querySelector('.nw').textContent = fmtMoney(v)));

  const delta = li.querySelector('.delta');
  if (p.live) {
    delta.textContent = arrowSigned(p.deltaBase, p.base);
    delta.className = 'chip delta ' + deltaClass(p.deltaBase);
  } else {
    delta.textContent = 'Forbes 2026 est.';
    delta.className = 'chip delta flat';
  }

  if (p.live && Math.abs(p.deltaPrev) > 0.0005) flashRow(li, p.deltaPrev);
}

function renderList(tab, data) {
  const entries = tab === 'top' ? data.people : data.lists[tab];
  entries.forEach((p) => {
    const li = ensureRow(tab, p);
    updateRow(tab, li, p);
  });
  flip(els.board, () => entries.forEach((p) => els.board.appendChild(rowEls.get(tab + ':' + p.id))));
}

function renderMovers(data) {
  const sorted = [...data.people].sort((a, b) => b.deltaBase - a.deltaBase);
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  if (!top || Math.abs(top.deltaBase) < 0.0005) {
    els.movers.innerHTML = isWeekend()
      ? '<span>Weekend — markets closed. Showing last close; live ticking resumes Monday.</span>'
      : '<span>Markets quiet since open — no movers yet. Prices update every 15 seconds.</span>';
    return;
  }
  let html = `<span>Biggest gainer: <b>${top.name}</b> <span class="chip ${deltaClass(top.deltaBase)}">${arrowSigned(top.deltaBase)}</span></span>`;
  if (bottom && Math.abs(bottom.deltaBase) >= 0.0005 && bottom.id !== top.id) {
    html += `<span>Biggest loser: <b>${bottom.name}</b> <span class="chip ${deltaClass(bottom.deltaBase)}">${arrowSigned(bottom.deltaBase)}</span></span>`;
  }
  els.movers.innerHTML = html;
}

function ensureBar(p) {
  let el = barEls.get(p.id);
  if (!el) {
    el = document.createElement('div');
    el.className = 'bar-row';
    el.dataset.id = p.id;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', p.name + ' — view live chart');
    el.innerHTML = `
      <div class="bar-top">
        <span class="bar-rank"></span>
        <span class="bar-name"></span>
        <span class="bar-src"></span>
        <span class="bar-right"><span class="chip flat bar-delta"></span><span class="bar-nw"></span></span>
      </div>
      <div class="bar-track"><div class="bar-fill"></div></div>`;
    el.addEventListener('click', () => openModal(p.id));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(p.id);
      }
    });
    barEls.set(p.id, el);
  }
  return el;
}

function updateBar(el, p, maxNw) {
  const rank = el.querySelector('.bar-rank');
  rank.textContent = p.rank;
  rank.className = 'bar-rank ' + (p.rank === 1 ? 'r1' : p.rank === 2 ? 'r2' : p.rank === 3 ? 'r3' : 'r');

  el.querySelector('.bar-name').textContent = p.name;
  el.querySelector('.bar-src').textContent = p.source;
  el.querySelector('.bar-nw').textContent = fmtMoney(p.netWorth);

  const delta = el.querySelector('.bar-delta');
  delta.textContent = arrowSigned(p.deltaBase, p.base);
  delta.className = 'chip bar-delta ' + deltaClass(p.deltaBase);

  const fill = el.querySelector('.bar-fill');
  fill.className = 'bar-fill ' + (p.rank === 1 ? 'r1' : p.rank === 2 ? 'r2' : p.rank === 3 ? 'r3' : 'r');
  fill.style.width = Math.max(3, (p.netWorth / maxNw) * 100) + '%';
  fill.textContent = fmtMoney(p.netWorth);
}

function renderBars(data) {
  const maxNw = Math.max(...data.people.map((p) => p.netWorth));
  data.people.forEach((p) => {
    const el = ensureBar(p);
    updateBar(el, p, maxNw);
  });
  flip(els.bars, () => data.people.forEach((p) => els.bars.appendChild(barEls.get(p.id))));
}

function locate(id) {
  if (!state.data) return null;
  const inMain = state.data.people.find((p) => p.id === id);
  if (inMain) return { p: inMain, tab: 'top' };
  for (const tab of LIST_TABS) {
    if (tab === 'top') continue;
    const f = state.data.lists[tab].find((x) => x.id === id);
    if (f) return { p: f, tab };
  }
  return null;
}

function buildModalContents(p) {
  els.mAvatar.innerHTML = `<span>${initials(p.name)}</span><img alt="" src="/photos/${p.id}.jpg">`;
  els.mAvatar.querySelector('img').addEventListener('error', (e) => e.target.remove());

  if (p.id === 'buffett') buildBrkContents();
  else els.mBrkWrap.style.display = 'none';

  let html = '';
  for (const s of p.stocks) {
    html += `
      <div class="hold-row" data-slug="${s.slug}">
        <span class="hold-label">${s.ticker} shares</span>
        <div class="hold-track"><div class="hold-fill" style="background:${colorFor(p.id)}"></div></div>
        <span class="hold-value"></span>
      </div>`;
  }
  html += `
      <div class="hold-row" data-slug="__other">
        <span class="hold-label">Everything else (private assets)</span>
        <div class="hold-track"><div class="hold-fill" style="background:#7a8699"></div></div>
        <span class="hold-value"></span>
      </div>`;
  els.mHoldings.innerHTML = html;

  html = '';
  for (const s of p.stocks) {
    html += `
      <div class="stock-chip" data-slug="${s.slug}">
        <span class="tick">${s.ticker}</span>
        <span class="px"></span>
        <span class="pct"></span>
      </div>`;
  }
  els.mStocks.innerHTML = html;
}

function updateModalContents(p) {
  els.mRank.textContent = p.rankLabel || `#${p.rank}`;
  els.mLiveFlag.textContent = p.live ? 'LIVE' : 'ESTIMATE';
  els.mLiveFlag.className = 'live-flag ' + (p.live ? 'live' : 'est');
  els.mName.textContent = p.name;
  els.mSub.textContent = (COUNTRIES[p.country] || p.country) + ' · ' + p.source + (p.age != null ? ' · age ' + p.age : '');
  els.mBio.textContent = p.bio || '';

  tween('modal-nw', p.netWorth, (v) => (els.mNw.textContent = fmtMoney(v)));

  if (p.live) {
    const openV = state.openVals.get(p.id) ?? p.netWorth;
    const dOpen = p.netWorth - openV;

    els.mDeltaOpen.style.display = '';
    els.mDeltaBase.style.display = '';
    els.mDeltaOpen.textContent = fmtSigned(dOpen) + ' since you opened this';
    els.mDeltaOpen.className = 'chip ' + deltaClass(dOpen);
    els.mDeltaBase.textContent = fmtSigned(p.deltaBase) + pctStr(p.deltaBase, p.base) + ' since open';
    els.mDeltaBase.className = 'chip ' + deltaClass(p.deltaBase);

    const minutes = (Date.now() - state.openAt) / 60000;
    if (minutes >= 0.5 && Math.abs(dOpen) >= 0.001) {
      const perMin = dOpen / minutes;
      els.mRate.style.display = '';
      els.mRate.className = 'rate-line ' + deltaClass(perMin);
      els.mRate.innerHTML = `That works out to about <span class="chip ${deltaClass(perMin)}">${fmtSigned(perMin)}</span> per minute — roughly <span class="chip ${deltaClass(perMin)}">${fmtSigned(perMin / 60)}</span> every second while you're here.`;
    } else {
      els.mRate.style.display = '';
      els.mRate.className = 'rate-line';
      els.mRate.textContent = 'Watching the markets — movements show up here as share prices tick.';
    }

    els.mHoldings.querySelectorAll('.hold-row').forEach((rowEl) => {
      const slug = rowEl.dataset.slug;
      let value;
      if (slug === '__other') {
        value = p.otherAssets;
      } else {
        const s = p.stocks.find((x) => x.slug === slug);
        value = s && s.valueUsd != null ? s.valueUsd / 1e9 : 0;
      }
      rowEl.querySelector('.hold-fill').style.width = Math.max(0, Math.min(100, (value / p.netWorth) * 100)) + '%';
      rowEl.querySelector('.hold-value').textContent = fmtMoney(value);
    });

    els.mStocks.querySelectorAll('.stock-chip').forEach((chipEl) => {
      const s = p.stocks.find((x) => x.slug === chipEl.dataset.slug);
      chipEl.querySelector('.px').textContent = s.price == null ? '—' : (s.currency === 'EUR' ? '€' : '$') + s.price.toLocaleString('en-US', { maximumFractionDigits: 2 });
      const pctEl = chipEl.querySelector('.pct');
      if (s.priceDeltaPct == null) {
        pctEl.textContent = '';
        pctEl.className = 'pct';
      } else {
        pctEl.textContent = (s.priceDeltaPct >= 0 ? '+' : '') + s.priceDeltaPct.toFixed(2) + '% since open';
        pctEl.className = 'pct ' + deltaClass(s.priceDeltaPct);
      }
    });

    const flat = p.stocks.every((s) => s.priceDeltaPct == null || Math.abs(s.priceDeltaPct) < 0.005);
    els.mChartNote.textContent = flat ? 'flat so far — markets may be closed' : 'live · updates every 15s';

    const pts = state.data.history[p.id] || [];
    drawChart(els.mChart, pts, shown.get('modal-nw') ?? p.netWorth);

    els.mNote.textContent = 'Live estimate: public share stakes are priced from Google Finance every 15 seconds; private assets are held at their Forbes 2026 values.';
  } else {
    els.mRate.style.display = 'none';
    els.mNote.textContent = 'Editorial estimate from Forbes-style data (March 2026). Wealth from private holdings and brand deals is not priced live.';
  }

  updateSalaryLines(p);

  if (p.id === 'buffett' && state.data.berkshire) updateBrkContents();

  if (spendState.personId) updateSpendValues();
}

function buildBrkContents() {
  const b = state.data.berkshire;
  if (!b || !b.positions.length) {
    els.mBrkWrap.style.display = 'none';
    return;
  }
  els.mBrkWrap.style.display = '';
  els.mBrkTitle.textContent = `Berkshire's real portfolio — SEC 13F${b.filed ? ' (filed ' + new Date(b.filed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ')' : ''}`;
  els.mBrkRows.innerHTML = b.positions
    .map(
      (pos) => `
    <div class="brk-row" data-ticker="${pos.ticker}">
      <span class="brk-tick">${pos.ticker}</span>
      <span class="brk-name">${pos.issuer}<small>${(pos.shares / 1e6).toFixed(1)}M shares</small></span>
      <span class="brk-px"><span class="px"></span><span class="pct"></span></span>
      <span class="brk-val"></span>
    </div>`
    )
    .join('');
}

function updateBrkContents() {
  const b = state.data.berkshire;
  if (!b) return;
  let totalLive = 0;
  const valued = [];
  els.mBrkRows.querySelectorAll('.brk-row').forEach((rowEl) => {
    const pos = b.positions.find((x) => x.ticker === rowEl.dataset.ticker);
    if (!pos) return;
    rowEl.querySelector('.px').textContent = pos.price == null ? '—' : '$' + pos.price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const pctEl = rowEl.querySelector('.pct');
    if (pos.changePct == null) {
      pctEl.textContent = '';
      pctEl.className = 'pct';
    } else {
      pctEl.textContent = (pos.changePct >= 0 ? '+' : '') + pos.changePct.toFixed(2) + '%';
      pctEl.className = 'pct ' + deltaClass(pos.changePct);
    }
    const valEl = rowEl.querySelector('.brk-val');
    valEl.textContent = pos.liveValue != null ? fmtMoney(pos.liveValue / 1e9) : '—';
    if (pos.liveValue != null) totalLive += pos.liveValue;
    valued.push({ rowEl, v: pos.liveValue ?? pos.secValue });
  });
  valued.sort((a, z) => z.v - a.v);
  valued.forEach(({ rowEl }) => els.mBrkRows.appendChild(rowEl));
  els.mBrkNote.textContent = `Positions from Berkshire Hathaway's latest quarterly 13F filing with the SEC — ${b.positionCount} stocks total, top ${b.positions.length} shown${totalLive ? ' (live value $' + (totalLive / 1e9).toFixed(1) + 'B)' : ''}, re-ranked live via TradingView prices.`;
}

function updateSalaryLines(p) {
  const salary = state.salary > 0 ? state.salary : 50000;
  const yrs = (p.netWorth * 1e9) / salary;
  const yrsTxt = yrs >= 1e6 ? (yrs / 1e6).toFixed(1) + ' million years' : yrs >= 1e3 ? Math.round(yrs / 1e3).toLocaleString() + ' thousand years' : Math.round(yrs).toLocaleString() + ' years';
  els.mFunLine.textContent = `At $${salary.toLocaleString('en-US')} a year, it would take you about ${yrsTxt} to earn this fortune.`;
  const earned = (salary / 31_536_000) * ((Date.now() - state.openAt) / 1000);
  els.mEarnLine.textContent = `Meanwhile, since you opened this page, you'd have earned about $${earned.toFixed(2)}.`;
}

function openModal(id) {
  const loc = locate(id);
  if (!loc) return;
  const p = loc.p;
  state.modalId = id;
  state.modalTab = loc.tab;
  history.replaceState(null, '', '#' + id);
  if (modalBuiltFor !== id) {
    buildModalContents(p);
    modalBuiltFor = id;
    shown.delete('modal-nw');
  }

  els.mChartWrap.style.display = p.live ? '' : 'none';
  els.mHoldingsWrap.style.display = p.live ? '' : 'none';
  els.mStocksWrap.style.display = p.live ? '' : 'none';
  els.mDeltaOpen.style.display = p.live ? '' : 'none';
  els.mDeltaBase.style.display = p.live ? '' : 'none';

  els.backdrop.classList.add('open');
  document.body.classList.add('modal-open');
  updateModalContents(p);
  clearInterval(modalTimer);
  modalTimer = setInterval(() => {
    const cur = locate(state.modalId);
    if (cur) updateModalContents(cur.p);
  }, 130);
  els.modalClose.focus();
}

function closeModal() {
  if (!state.modalId) return;
  state.modalId = null;
  history.replaceState(null, '', location.pathname);
  els.backdrop.classList.remove('open');
  document.body.classList.remove('modal-open');
  clearInterval(modalTimer);
  modalTimer = null;
}

function switchTab(tab) {
  state.tab = tab;
  document.querySelectorAll('.view-toggle button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  const isBars = tab === 'bars';
  document.getElementById('view-list').hidden = isBars;
  document.getElementById('view-bars').hidden = !isBars;
  els.moversWrap.style.display = tab === 'top' ? '' : 'none';
  els.thChange.textContent = tab === 'top' || tab === 'women' ? 'Change since open' : 'Notes';
  if (!isBars) {
    els.board.innerHTML = '';
    rowEls.clear();
  }
  if (state.data) render(state.data);
}

function render(data) {
  els.loading.classList.add('hidden');
  state.data = data;

  setChip(data.stale ? 'DELAYED' : 'LIVE', data.stale);

  const combined = data.people.reduce((s, p) => s + p.netWorth, 0);
  const combinedBase = data.people.reduce((s, p) => s + p.base, 0);
  tween('combined', combined, (v) => (els.combined.textContent = fmtMoney(v)));
  els.combinedDelta.textContent = fmtSigned(combined - combinedBase) + pctStr(combined - combinedBase, combinedBase) + ' since open';
  els.combinedDelta.className = 'chip ' + deltaClass(combined - combinedBase);

  data.people.forEach((p) => {
    if (!state.openVals.has(p.id)) state.openVals.set(p.id, p.netWorth);
  });
  Object.values(data.lists).forEach((list) => list.forEach((p) => {
    if (!state.openVals.has(p.id)) state.openVals.set(p.id, p.netWorth);
  }));

  if (state.tab === 'top') renderMovers(data);
  if (state.tab === 'bars') renderBars(data);
  else renderList(state.tab, data);

  renderMarketStrip();
  checkRankFlips();
  checkMilestones(data);
  renderTrillion(data);
  renderFlips(data);

  if (data.viewers != null) {
    els.watchers.textContent = data.viewers;
    const chip = document.getElementById('watch-chip');
    if (chip) chip.style.display = data.viewers >= 10 ? '' : 'none';
  }

  const top = data.people[0];
  if (top) {
    document.title = `${top.deltaBase >= 0 ? '▲' : '▼'} ${top.name.split(' ')[0]} ${fmtMoney(top.netWorth)} — Open Wallet`;
  }

  if (data.updatedAt) els.updated.textContent = new Date(data.updatedAt).toLocaleTimeString();

  if (state.modalId) {
    const loc = locate(state.modalId);
    if (loc) updateModalContents(loc.p);
  }

  updateMarketStatus();

  if (!state.hashChecked) {
    state.hashChecked = true;
    const qs = new URLSearchParams(location.search);
    const qSpend = qs.get('spend');
    const qPerson = qs.get('person');
    if (qSpend && locate(qSpend)) openSpend(qSpend);
    else if (qPerson && locate(qPerson)) openModal(qPerson);
    else {
      const h = location.hash.slice(1);
      if (h.startsWith('spend-')) {
        const sid = h.slice(6);
        if (sid && locate(sid)) openSpend(sid);
      } else if (h && locate(h)) openModal(h);
    }
  }

  if (spendState.personId) updateSpendValues();
}

async function poll() {
  try {
    const res = await fetch(API_BASE + '/api/data', { cache: 'no-store' });
    const data = await res.json();
    if (data.status !== 'ok') throw new Error('bad status');
    render(data);
  } catch (e) {
    setChip('RECONNECTING', true);
  }
}

document.querySelectorAll('.view-toggle button[data-tab]').forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

els.modalClose.addEventListener('click', closeModal);
els.backdrop.addEventListener('click', (e) => {
  if (e.target === els.backdrop) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (spendState.personId) closeSpend();
    else closeModal();
  }
});

function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function updateMarketStatus() {
  if (!state.data) {
    els.marketStatus.textContent = '';
    return;
  }
  if (isWeekend()) {
    els.marketStatus.textContent = ' · weekend — markets closed, showing last close';
    return;
  }
  const moving = state.data.people.some((p) => p.stocks && p.stocks.some((s) => Math.abs(s.priceDeltaPct || 0) > 0.005));
  els.marketStatus.textContent = moving ? ' · prices moving' : ' · prices flat — market may be closed';
}

function allPeople() {
  if (!state.data) return [];
  const seen = new Map();
  for (const p of state.data.people) seen.set(p.id, { p, tab: 'top' });
  for (const tab of ['women', 'youngest', 'athletes', 'nontech']) {
    for (const p of state.data.lists[tab]) if (!seen.has(p.id)) seen.set(p.id, { p, tab });
  }
  return [...seen.values()];
}

function hideSearchResults() {
  els.searchResults.hidden = true;
}

function runSearch() {
  const q = els.searchInput.value.trim().toLowerCase();
  if (q.length < 2) {
    hideSearchResults();
    return;
  }
  const matches = allPeople()
    .filter(({ p }) => p.name.toLowerCase().includes(q) || p.source.toLowerCase().includes(q) || (COUNTRIES[p.country] || '').toLowerCase().includes(q))
    .slice(0, 8);
  if (!matches.length) {
    els.searchResults.innerHTML = '<div class="sr-empty">No matches found</div>';
    els.searchResults.hidden = false;
    return;
  }
  els.searchResults.innerHTML = matches
    .map(
      ({ p, tab }) => `
    <button class="sr-item" data-id="${p.id}">
      <span class="avatar mini"><span>${initials(p.name)}</span><img alt="" loading="lazy" src="/photos/${p.id}.jpg"><span class="avatar-badge ${p.live ? 'live' : 'est'}"></span></span>
      <span class="sr-main"><span class="sr-name">${p.name}</span><span class="sr-sub">${TAB_LABELS[tab]} · ${p.source}</span></span>
      <span class="sr-right"><span class="sr-nw">${fmtMoney(p.netWorth)}</span><span class="sr-rank">#${p.rank} by ${tab === 'youngest' ? 'age' : 'wealth'}</span></span>
    </button>`
    )
    .join('');
  els.searchResults.hidden = false;
  els.searchResults.querySelectorAll('.sr-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      openModal(btn.dataset.id);
      els.searchInput.value = '';
      hideSearchResults();
      els.searchInput.blur();
    });
  });
}

let searchTimer = null;
els.searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 140);
});
els.searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    els.searchInput.value = '';
    hideSearchResults();
    els.searchInput.blur();
  }
});
els.searchResults.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'IMG') e.target.remove();
}, true);
document.addEventListener('click', (e) => {
  if (!e.target.closest('.search')) hideSearchResults();
});
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== els.searchInput && !/INPUT|TEXTAREA/.test((document.activeElement && document.activeElement.tagName) || '')) {
    e.preventDefault();
    els.searchInput.focus();
  }
});

els.mSalary.addEventListener('input', () => {
  const v = parseInt(els.mSalary.value, 10);
  state.salary = isFinite(v) && v > 0 ? v : 50000;
  try {
    localStorage.setItem('ow-salary', String(state.salary));
  } catch (e) {}
  const cur = locate(state.modalId);
  if (cur) updateModalContents(cur.p);
});

try {
  const saved = localStorage.getItem('ow-salary');
  if (saved) {
    const v = parseInt(saved, 10);
    if (isFinite(v) && v > 0) {
      state.salary = v;
      els.mSalary.value = v;
    }
  }
} catch (e) {}

function renderMarketStrip() {
  const m = state.data.market;
  if (!m || (!m.btc && !m.sp500 && !m.us10y)) {
    els.marketStrip.innerHTML = '';
    return;
  }
  let html = '';
  if (m.btc) {
    html += `<span class="mkt-pill">Bitcoin <b>$${m.btc.price.toLocaleString('en-US', { maximumFractionDigits: 0 })}</b><span class="mkt-chg ${deltaClass(m.btc.change24hPct)}">${m.btc.change24hPct >= 0 ? '+' : '−'}${Math.abs(m.btc.change24hPct).toFixed(2)}% 24h</span></span>`;
  }
  if (m.sp500) {
    html += `<span class="mkt-pill">S&P 500 <b>${m.sp500.level.toLocaleString('en-US', { maximumFractionDigits: 2 })}</b><span class="mkt-chg ${deltaClass(m.sp500.changePct)}">${m.sp500.changePct >= 0 ? '+' : '−'}${Math.abs(m.sp500.changePct).toFixed(2)}% daily</span></span>`;
  }
  if (m.us10y) {
    html += `<span class="mkt-pill">10Y Treasury <b>${m.us10y.yieldPct.toFixed(2)}%</b><span class="mkt-chg ${deltaClass(m.us10y.changeBps)}">${m.us10y.changeBps >= 0 ? '+' : '−'}${Math.abs(m.us10y.changeBps).toFixed(0)} bps</span></span>`;
  }
  els.marketStrip.innerHTML = html;
}

function setTheme(dark) {
  document.body.classList.toggle('theme-dark', dark);
  els.themeToggle.textContent = dark ? 'Light mode' : 'Terminal mode';
  try {
    localStorage.setItem('ow-theme', dark ? 'dark' : 'light');
  } catch (e) {}
}

els.themeToggle.addEventListener('click', () => setTheme(!document.body.classList.contains('theme-dark')));
try {
  if (localStorage.getItem('ow-theme') === 'dark') setTheme(true);
} catch (e) {}

setInterval(() => {
  if (!state.data || !state.data.nextPollAt) return;
  const ms = state.data.nextPollAt - Date.now();
  els.countdown.textContent = ms <= 0 ? 'refreshing…' : Math.ceil(ms / 1000) + 's';
}, 250);

const SPEND_ITEMS = [
  { id: 'coffee', name: 'Specialty coffee', price: 5, tag: 'typical' },
  { id: 'movie', name: 'Movie ticket', price: 12.5, tag: 'avg. US' },
  { id: 'airpods', name: 'AirPods Pro', price: 249, tag: 'Apple MSRP' },
  { id: 'ps5', name: 'PlayStation 5 Pro', price: 749.99, tag: 'Sony MSRP' },
  { id: 'iphone', name: 'iPhone 18 Pro', price: 1099, tag: 'est.' },
  { id: 'rolex', name: 'Rolex Submariner Date', price: 10700, tag: 'retail est.' },
  { id: 'camry', name: 'Toyota Camry LE', price: 28700, tag: 'MSRP' },
  { id: 'model3', name: 'Tesla Model 3', price: 42490, tag: 'MSRP' },
  { id: 'rangerover', name: 'Range Rover SE', price: 107900, tag: 'MSRP' },
  { id: 'huracan', name: 'Lamborghini Huracán EVO', price: 248295, tag: 'MSRP' },
  { id: 'superbowl', name: '30-sec Super Bowl ad', price: 8000000, tag: '2025 rate' },
  { id: 'malibu', name: 'Malibu beach house', price: 12500000, tag: 'est.' },
  { id: 'falcon9', name: 'SpaceX Falcon 9 launch', price: 67000000, tag: 'SpaceX list' },
  { id: 'gulfstream', name: 'Gulfstream G700', price: 80000000, tag: 'list price' },
  { id: 'yacht', name: '300-ft superyacht', price: 275000000, tag: 'est. new-build' },
  { id: 'salvator', name: 'Salvator Mundi', price: 450312500, tag: '2017 auction' },
  { id: 'nfl', name: 'NFL team (average)', price: 6500000000, tag: '2026 est.' },
  { id: 'twitter', name: 'Twitter (2022 deal)', price: 44000000000, tag: 'deal price' }
];

function trimNum(x) {
  if (x >= 100) return String(Math.round(x * 10) / 10);
  if (x >= 10) return x.toFixed(1).replace(/\.0$/, '');
  return String(Math.round(x * 100) / 100);
}

function fmtPrice(v) {
  if (v >= 1e9) return '$' + trimNum(v / 1e9) + 'B';
  if (v >= 1e6) return '$' + trimNum(v / 1e6) + 'M';
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

const spendState = { personId: null, spent: 0, owned: {}, startAt: null, celebrated: false };

function openSpend(id) {
  const loc = locate(id);
  if (!loc) return;
  const p = loc.p;
  spendState.personId = id;
  spendState.spent = 0;
  spendState.owned = {};
  spendState.startAt = Date.now();
  spendState.celebrated = false;
  els.spAvatar.querySelector('.init').textContent = initials(p.name);
  const img = els.spImg;
  img.style.display = '';
  img.src = '/photos/' + p.id + '.jpg';
  img.onerror = () => { img.style.display = 'none'; };
  els.spName.textContent = p.name;
  els.spFlag.textContent = p.live ? 'LIVE' : 'ESTIMATE';
  els.spFlag.className = 'live-flag ' + (p.live ? 'live' : 'est');
  buildSpendGrid();
  updateSpendValues();
  els.spendLayer.hidden = false;
  requestAnimationFrame(() => els.spendLayer.classList.add('open'));
  document.body.classList.add('modal-open');
  history.replaceState(null, '', '#spend-' + id);
  els.spendBack.focus();
}

function closeSpend() {
  if (!spendState.personId) return;
  spendState.personId = null;
  els.spendLayer.classList.remove('open');
  els.spendLayer.hidden = true;
  if (!state.modalId) document.body.classList.remove('modal-open');
  history.replaceState(null, '', state.modalId ? '#' + state.modalId : location.pathname);
}

function buildSpendGrid() {
  els.spendGrid.innerHTML = SPEND_ITEMS.map(
    (item, i) => `
    <div class="sp-tile" data-i="${i}">
      <div class="sp-img"><span>${item.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</span><img alt="${item.name}" loading="lazy" src="/spend/${item.id}.jpg"></div>
      <div class="sp-info">
        <span class="sp-name">${item.name}</span>
        <span class="sp-price">${fmtPrice(item.price)} <em>${item.tag}</em></span>
        <span class="sp-afford"></span>
        <span class="sp-line"></span>
      </div>
      <div class="sp-step">
        <button data-op="sell" aria-label="Remove one ${item.name}">−</button>
        <span class="sp-count">0</span>
        <button data-op="buy" aria-label="Add one ${item.name}">+</button>
      </div>
    </div>`
  ).join('');
  els.spendGrid.querySelectorAll('img').forEach((im) => {
    im.addEventListener('error', () => { im.style.display = 'none'; });
  });
  els.spendGrid.querySelectorAll('.sp-step button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.closest('.sp-tile').dataset.i, 10);
      const item = SPEND_ITEMS[i];
      const loc = locate(spendState.personId);
      const nw = loc ? loc.p.netWorth * 1e9 : 0;
      if (btn.dataset.op === 'buy') {
        if (spendState.spent + item.price <= nw) {
          spendState.spent += item.price;
          spendState.owned[i] = (spendState.owned[i] || 0) + 1;
        }
      } else if (spendState.owned[i] > 0) {
        spendState.owned[i]--;
        spendState.spent -= item.price;
      }
      updateSpendValues();
    });
  });
}

function updateSpendValues() {
  const loc = locate(spendState.personId);
  if (!loc || els.spendLayer.hidden) return;
  const p = loc.p;
  const nw = p.netWorth * 1e9;
  const remaining = Math.max(0, nw - spendState.spent);
  els.spNw.textContent = fmtMoney(p.netWorth);
  els.spRemaining.textContent = fmtPrice(remaining) + ' left';
  els.spSpent.textContent = 'spent ' + fmtPrice(spendState.spent);
  const pct = nw > 0 ? (spendState.spent / nw) * 100 : 0;
  els.spPct.textContent = pct > 0 ? pct.toFixed(pct >= 10 ? 1 : 2) + '% of fortune' : 'cart empty';
  els.spFill.style.width = Math.min(100, pct) + '%';
  els.spendGrid.querySelectorAll('.sp-tile').forEach((tile) => {
    const i = parseInt(tile.dataset.i, 10);
    const item = SPEND_ITEMS[i];
    const own = spendState.owned[i] || 0;
    tile.querySelector('.sp-count').textContent = own;
    const afford = Math.floor(remaining / item.price);
    tile.querySelector('.sp-afford').textContent = 'affords ×' + afford.toLocaleString('en-US');
    tile.querySelector('.sp-line').textContent = own > 0 ? fmtPrice(own * item.price) + ' in cart' : '';
    tile.querySelector('[data-op="buy"]').disabled = remaining < item.price;
    tile.querySelector('[data-op="sell"]').disabled = own === 0;
  });
  if (!spendState.celebrated && spendState.spent > 0 && remaining <= nw * 0.001) {
    spendState.celebrated = true;
    const secs = Math.max(1, Math.round((Date.now() - spendState.startAt) / 1000));
    toast('Fortune spent!', `${p.name.split(' ')[0]}'s ${fmtMoney(p.netWorth)} gone in ${secs}s`);
    confettiBurst(140);
  }
}

els.spendReset.addEventListener('click', () => {
  const loc = locate(spendState.personId);
  if (loc) {
    spendState.spent = 0;
    spendState.owned = {};
    spendState.startAt = Date.now();
    spendState.celebrated = false;
    updateSpendValues();
  }
});

els.spendBack.addEventListener('click', closeSpend);

els.spendShare.addEventListener('click', () => {
  const loc = locate(spendState.personId);
  if (!loc) return;
  const p = loc.p;
  const secs = Math.max(1, Math.round((Date.now() - spendState.startAt) / 1000));
  const text = `I just spent ${fmtPrice(spendState.spent)} of ${p.name}'s ${fmtMoney(p.netWorth)} fortune in ${secs}s — try it: ${location.origin}/?spend=${p.id}`;
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
    .then(() => toast('Copied!', text))
    .catch(() => toast('Copy failed', 'Select and copy manually'));
});

els.mSpendOpen.addEventListener('click', () => {
  const loc = locate(state.modalId);
  if (loc) openSpend(loc.p.id);
});

window.addEventListener('hashchange', () => {
  const h = location.hash.slice(1);
  if (spendState.personId && h !== 'spend-' + spendState.personId) closeSpend();
});

function shareText(p) {
  const openV = state.openVals.get(p.id);
  const dOpen = openV != null ? p.netWorth - openV : null;
  const link = ` ${location.origin}/?person=${p.id}`;
  if (p.live && dOpen != null && Math.abs(dOpen) >= 0.001) {
    return `${p.name} is ${fmtSigned(dOpen)} since I opened this page, sitting at ${fmtMoney(p.netWorth)} — watching it live on Open Wallet` + link;
  }
  return `${p.name} — ${fmtMoney(p.netWorth)} net worth, #${p.rank} on the live list — Open Wallet` + link;
}

els.mShareX.addEventListener('click', () => {
  const loc = locate(state.modalId);
  if (!loc) return;
  window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(shareText(loc.p)), '_blank', 'noopener');
});

els.mShareCopy.addEventListener('click', () => {
  const loc = locate(state.modalId);
  if (!loc) return;
  const text = shareText(loc.p);
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
    .then(() => toast('Copied!', text))
    .catch(() => toast('Copy failed', 'Select and copy manually'));
});

setInterval(poll, 2500);
setInterval(pingViewers, 15000);
pingViewers();
poll();
