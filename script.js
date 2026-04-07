(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkStar() {
    return {
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2, a: Math.random(),
      da: (Math.random() * 0.003 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
      vx: (Math.random() - 0.5) * 0.04, vy: -Math.random() * 0.06 - 0.02,
    };
  }

  resize();
  stars = Array.from({ length: 160 }, mkStar);

  let t = 0;
  function frame() {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.028)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 56) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 56) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.save();
    ctx.globalAlpha = 0.07;
    const gx1 = W * 0.2 + Math.sin(t * 0.4) * W * 0.08, gy1 = H * 0.25 + Math.cos(t * 0.3) * H * 0.05;
    const g1 = ctx.createRadialGradient(gx1, gy1, 0, gx1, gy1, W * 0.35);
    g1.addColorStop(0, '#4c9aff'); g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
    const gx2 = W * 0.75 + Math.cos(t * 0.35) * W * 0.09, gy2 = H * 0.6 + Math.sin(t * 0.28) * H * 0.06;
    const g2 = ctx.createRadialGradient(gx2, gy2, 0, gx2, gy2, W * 0.3);
    g2.addColorStop(0, '#8b5cf6'); g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    ctx.restore();

    stars.forEach(s => {
      s.x += s.vx; s.y += s.vy; s.a += s.da;
      if (s.a < 0 || s.a > 1) s.da *= -1;
      if (s.y < -2) s.y = H + 2;
      if (s.x < -2) s.x = W + 2;
      if (s.x > W + 2) s.x = -2;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a * 0.7})`; ctx.fill();
    });

    t += 0.01;
    requestAnimationFrame(frame);
  }

  frame();
  window.addEventListener('resize', resize);
})();

const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20), { passive: true });

const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileDrawer = document.getElementById('mobileDrawer');

function closeMobile() {
  mobileBtn.classList.remove('open');
  mobileDrawer.classList.remove('open');
}
window.closeMobile = closeMobile;

if (mobileBtn) mobileBtn.addEventListener('click', () => {
  mobileBtn.classList.toggle('open');
  mobileDrawer.classList.toggle('open');
});

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobile();
  });
});

const API = 'https://skyline-roblox-api.bschofield987.workers.dev';
const UNIVERSE_IDS = ['8581899016', '7201268162', '9626953705'];
const VERIFIED_CREATORS = ['Secret Base Community', 'Shopping Drift'];

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function truncate(text, max) {
  if (!text) return 'No description available.';
  return text.length <= max ? text : text.slice(0, max) + '…';
}

function isVerified(data) {
  return data.isVerified || data.hasVerifiedBadge || data.verified || VERIFIED_CREATORS.includes(data.creator);
}

function setThumb(el, src) {
  el.onerror = () => { el.src = 'placeholderimg.png'; el.classList.add('thumb-placeholder'); };
  el.src = src || 'placeholderimg.png';
  if (!src) el.classList.add('thumb-placeholder');
}

async function loadIndexGames() {
  const cards = document.querySelectorAll('.game-card[data-universe-id]');
  if (!cards.length) return;

  let totalPlaying = 0, totalVisits = 0;

  for (const card of cards) {
    try {
      const res = await fetch(`${API}?universeId=${card.dataset.universeId}`);
      const d = await res.json();

      const ccu = d.playing ?? d.ccu ?? d.playerCount ?? 0;
      const vis = d.visits ?? d.totalVisits ?? d.placeVisits ?? 0;
      totalPlaying += ccu;
      totalVisits += vis;

      const thumb = card.querySelector('.game-thumb');
      if (thumb) setThumb(thumb, d.thumbnail);

      const nameEl = card.querySelector('.game-name');
      if (nameEl && d.name) nameEl.textContent = d.name;

      const descEl = card.querySelector('.game-desc');
      if (descEl) descEl.textContent = truncate(d.description, 100);

      const authorEl = card.querySelector('.author-name');
      const badge = card.querySelector('.verified-badge');
      if (authorEl && d.creator) authorEl.textContent = d.creator;
      if (badge) badge.style.display = isVerified(d) ? 'inline-block' : 'none';

      const ccuEl = card.querySelector('.ccu');
      const visEl = card.querySelector('.visits');
      if (ccuEl) ccuEl.textContent = fmt(ccu);
      if (visEl) visEl.textContent = fmt(vis);

      const btn = card.querySelector('.card-play-btn');
      if (btn && d.placeId) btn.onclick = () => window.open(`https://www.roblox.com/games/${d.placeId}`, '_blank');
    } catch (e) {
      const thumb = card.querySelector('.game-thumb');
      if (thumb) { thumb.src = 'placeholderimg.png'; thumb.classList.add('thumb-placeholder'); }
      console.error('Failed to load game', card.dataset.universeId, e);
    }
  }

   const tp = document.getElementById('total-playing');
   const tv = document.getElementById('total-visits');
   if (tp) tp.textContent = fmt(totalPlaying);
   if (tv) tv.textContent = fmt(totalVisits);
   const sc = document.getElementById('strip-avg-ccu');
   if (sc) sc.textContent = fmt(totalPlaying);
}

function initCarousel() {
  const cardsEl = document.querySelector('.cards');
  const gameCards = document.querySelectorAll('.game-card');
  const cdots = document.querySelectorAll('.cdot');
  if (!cardsEl || !gameCards.length) return;

  const GAP = 24, PAD = 40;
  let idx = 1, dragging = false, startX = 0, prevTx = 0, curTx = 0;

  function cardW() { return gameCards[0]?.offsetWidth || 0; }

  function setPos(x, animated = true) {
    cardsEl.style.transition = animated ? 'transform .5s cubic-bezier(.4,0,.2,1)' : 'none';
    cardsEl.style.transform = `translateX(${x}px)`;
  }

  function update(animated = true) {
    const w = cardW(), stride = w + GAP;
    const tx = cardsEl.parentElement.offsetWidth / 2 - PAD - idx * stride - w / 2;
    prevTx = curTx = tx;
    setPos(tx, animated);
    gameCards.forEach((c, i) => c.classList.toggle('active', i === idx));
    cdots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  function goTo(i) { idx = Math.max(0, Math.min(gameCards.length - 1, i)); update(); }

  cdots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.idx)));

  function posX(e) { return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX; }

  cardsEl.addEventListener('mousedown', e => {
    if (e.target.tagName === 'IMG') return;
    dragging = true; startX = posX(e); cardsEl.style.transition = 'none';
  });
  cardsEl.addEventListener('touchstart', e => {
    dragging = true; startX = posX(e); cardsEl.style.transition = 'none';
  }, { passive: true });

  function onMove(e) {
    if (!dragging) return;
    if (e.cancelable) e.preventDefault();
    curTx = prevTx + posX(e) - startX;
    setPos(curTx, false);
  }
  cardsEl.addEventListener('mousemove', onMove);
  cardsEl.addEventListener('touchmove', onMove, { passive: false });

  function onEnd() {
    if (!dragging) return;
    dragging = false;
    const moved = curTx - prevTx, thresh = (cardW() + GAP) * 0.33;
    if (moved < -thresh && idx < gameCards.length - 1) idx++;
    else if (moved > thresh && idx > 0) idx--;
    update();
  }
  cardsEl.addEventListener('mouseup', onEnd);
  cardsEl.addEventListener('mouseleave', onEnd);
  cardsEl.addEventListener('touchend', onEnd);
  cardsEl.addEventListener('contextmenu', e => e.preventDefault());

  let resizeTimer;
  window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => update(false), 200); });

  update(false);
}

function initTiltCards() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      const rx = (y - r.height / 2) / r.height * -8;
      const ry = (x - r.width / 2) / r.width * 8;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
      const shine = card.querySelector('.tilt-shine');
      if (shine) { shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.08) 0%, transparent 65%)`; shine.style.opacity = '1'; }
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      const shine = card.querySelector('.tilt-shine');
      if (shine) shine.style.opacity = '0';
    });
  });
}

function initGamesPage() {
  const grid = document.getElementById('gpGrid');
  if (!grid) return;

  let gameData = [];

  function buildCard(d) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="game-thumb${!d.thumbnail ? ' thumb-placeholder' : ''}" src="${d.thumbnail || 'placeholderimg.png'}" alt="${d.name || 'Game'}" loading="lazy" onerror="this.src='placeholderimg.png';this.classList.add('thumb-placeholder');">
        <div class="card-img-fade"></div>
        <div class="card-badges">
          <div class="card-badge-pill"><img src="UserIcon.png" alt=""><span>${fmt(d.ccu || 0)}</span></div>
          <div class="card-badge-pill"><img src="VisitIcon.png" alt=""><span>${fmt(d.visits || 0)}</span></div>
        </div>
      </div>
      <div class="card-body">
        <h3 class="game-name">${d.name || 'Unknown Game'}</h3>
        <p class="card-creator">
          <span class="by">by</span>
          <span class="author-name">${d.creator || 'Unknown'}</span>
          <img src="VerifiedIcon.png" class="verified-badge" alt="✓" style="display:${isVerified(d) ? 'inline-block' : 'none'}">
        </p>
        <p class="game-desc">${truncate(d.description, 100)}</p>
        <button class="card-play-btn"${d.placeId ? ` onclick="window.open('https://www.roblox.com/games/${d.placeId}','_blank')"` : ''}>
          Play Now <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z"/></svg>
        </button>
      </div>`;
    return card;
  }

  function showSkeletons() {
    grid.innerHTML = '';
    UNIVERSE_IDS.forEach(() => {
      const c = document.createElement('div');
      c.className = 'game-card loading';
      c.innerHTML = `
        <div class="card-img-wrap"><div class="game-thumb" style="display:block;min-height:169px;"></div></div>
        <div class="card-body">
          <div class="game-name" style="width:70%;height:1.3em;">&nbsp;</div>
          <div class="card-creator" style="width:50%;height:1em;margin-bottom:14px;">&nbsp;</div>
          <div class="game-desc" style="height:4.8em;">&nbsp;</div>
          <div style="height:48px;border-radius:12px;background:rgba(59,130,246,.12);"></div>
        </div>`;
      grid.appendChild(c);
    });
  }

  function renderGrid(data) {
    grid.innerHTML = '';
    if (!data.length) { grid.innerHTML = '<div class="gp-empty">No games found.</div>'; return; }
    data.forEach(d => grid.appendChild(buildCard(d)));
  }

  function applyFilterSort() {
    let data = [...gameData];
    const f = document.querySelector('.gp-filter-btn.active')?.dataset.filter || 'all';
    if (f === 'popular') { data = data.filter(d => d.visits > 1000000); if (!data.length) data = [...gameData].sort((a, b) => b.visits - a.visits); }
    else if (f === 'live') { data = data.filter(d => d.ccu > 0); }
    const s = document.getElementById('gp-sort')?.value;
    if (s === 'visits') data.sort((a, b) => b.visits - a.visits);
    if (s === 'playing') data.sort((a, b) => b.ccu - a.ccu);
    renderGrid(data);
  }

  async function loadAllGames() {
    showSkeletons();
    gameData = [];
    let totalPlaying = 0, totalVisits = 0;

    const results = await Promise.all(UNIVERSE_IDS.map(async id => {
      try {
        const res = await fetch(`${API}?universeId=${id}`);
        const d = await res.json();
        d.universeId = id;
        d.ccu = d.playing ?? d.ccu ?? d.playerCount ?? 0;
        d.visits = d.visits ?? d.totalVisits ?? d.placeVisits ?? 0;
        totalPlaying += d.ccu;
        totalVisits += d.visits;
        return d;
      } catch (e) { console.error('Failed to load game', id, e); return null; }
    }));

    gameData = results.filter(Boolean);

    const tp = document.getElementById('gp-total-playing');
    const tv = document.getElementById('gp-total-visits');
    if (tp) tp.textContent = fmt(totalPlaying);
    if (tv) tv.textContent = fmt(totalVisits);

    applyFilterSort();
  }

  document.querySelectorAll('.gp-filter-btn').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.gp-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    applyFilterSort();
  }));

  document.getElementById('gp-sort')?.addEventListener('change', applyFilterSort);

  loadAllGames();
}

loadIndexGames();
initCarousel();
initTiltCards();
initGamesPage();
