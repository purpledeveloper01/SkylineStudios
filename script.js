/* ===========================
   CANVAS STARFIELD + AURORA BG
   =========================== */
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], animId;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkStar() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.2,
      a: Math.random(),
      da: (Math.random() * 0.003 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
      vx: (Math.random() - 0.5) * 0.04,
      vy: -Math.random() * 0.06 - 0.02,
    };
  }

  function init() {
    resize();
    stars = Array.from({ length: 160 }, mkStar);
  }

  // Subtle aurora blobs
  let t = 0;
  function drawAurora() {
    ctx.save();
    ctx.globalAlpha = 0.07;

    // Blue blob
    const gx1 = W * 0.2 + Math.sin(t * 0.4) * W * 0.08;
    const gy1 = H * 0.25 + Math.cos(t * 0.3) * H * 0.05;
    const g1 = ctx.createRadialGradient(gx1, gy1, 0, gx1, gy1, W * 0.35);
    g1.addColorStop(0, '#4c9aff');
    g1.addColorStop(1, 'transparent');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    // Violet blob
    const gx2 = W * 0.75 + Math.cos(t * 0.35) * W * 0.09;
    const gy2 = H * 0.6 + Math.sin(t * 0.28) * H * 0.06;
    const g2 = ctx.createRadialGradient(gx2, gy2, 0, gx2, gy2, W * 0.3);
    g2.addColorStop(0, '#8b5cf6');
    g2.addColorStop(1, 'transparent');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);

    // Dark bg
    ctx.fillStyle = '#06060a';
    ctx.fillRect(0, 0, W, H);

    // Subtle grid
    ctx.strokeStyle = 'rgba(255,255,255,0.028)';
    ctx.lineWidth = 1;
    const gsize = 56;
    for (let x = 0; x < W; x += gsize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += gsize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    drawAurora();

    // Stars
    stars.forEach(s => {
      s.x += s.vx;
      s.y += s.vy;
      s.a += s.da;
      if (s.a < 0 || s.a > 1) s.da *= -1;
      if (s.y < -2) s.y = H + 2;
      if (s.x < -2) s.x = W + 2;
      if (s.x > W + 2) s.x = -2;

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.a * 0.7})`;
      ctx.fill();
    });

    t += 0.01;
    animId = requestAnimationFrame(frame);
  }

  init();
  frame();
  window.addEventListener('resize', () => { resize(); });
})();

/* ===========================
   NAVBAR SCROLL
   =========================== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 20) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
}, { passive: true });

/* ===========================
   MOBILE MENU
   =========================== */
const mobileBtn = document.getElementById('mobileMenuBtn');
const mobileDrawer = document.getElementById('mobileDrawer');

function closeMobileMenu() {
  mobileBtn.classList.remove('open');
  mobileDrawer.classList.remove('open');
}

if (mobileBtn && mobileDrawer) {
  mobileBtn.addEventListener('click', () => {
    mobileBtn.classList.toggle('open');
    mobileDrawer.classList.toggle('open');
  });
}

/* ===========================
   SMOOTH SCROLL
   =========================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    closeMobileMenu();
  });
});

/* ===========================
   ROBLOX API
   =========================== */
const API = "https://skyline-roblox-api.bschofield987.workers.dev";
let totalPlaying = 0, totalVisits = 0;

const verifiedCreators = [
  "Secret Base Community",
  "Prismplay Experiment",
  "Crazy Real Games",
];

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function truncate(text, max) {
  if (!text) return "No description available.";
  return text.length <= max ? text : text.slice(0, max) + '…';
}

async function loadGames() {
  totalPlaying = 0;
  totalVisits = 0;
  const cards = document.querySelectorAll('.game-card');

  for (const card of cards) {
    const id = card.dataset.universeId;
    try {
      const res = await fetch(`${API}?universeId=${id}`);
      const data = await res.json();

      const thumb = card.querySelector('.game-thumb');
      if (thumb && data.thumbnail) thumb.src = data.thumbnail;

      const nameEl = card.querySelector('.game-name');
      if (nameEl && data.name) nameEl.textContent = data.name;

      const descEl = card.querySelector('.game-desc');
      if (descEl) descEl.textContent = truncate(data.description, 100);

      const authorEl = card.querySelector('.author-name');
      const badge = card.querySelector('.verified-badge');
      if (authorEl && data.creator) authorEl.textContent = data.creator;
      if (badge && data.creator) {
        const verified = data.isVerified || data.hasVerifiedBadge || data.verified || verifiedCreators.includes(data.creator);
        badge.style.display = verified ? 'inline-block' : 'none';
      }

      const ccuEl = card.querySelector('.ccu');
      const visitsEl = card.querySelector('.visits');
      const ccu = data.playing ?? data.ccu ?? data.playerCount ?? 0;
      const vis = data.visits ?? data.totalVisits ?? data.placeVisits ?? 0;

      if (ccuEl) { ccuEl.textContent = fmt(ccu); totalPlaying += ccu; }
      if (visitsEl) { visitsEl.textContent = fmt(vis); totalVisits += vis; }

      const playBtn = card.querySelector('.play-btn');
      if (playBtn && data.placeId) {
        playBtn.onclick = () => window.open(`https://www.roblox.com/games/${data.placeId}`, '_blank');
      }
    } catch (err) {
      console.error(`Error loading game ${id}:`, err);
    }
  }

  const tp = document.getElementById('total-playing');
  const tv = document.getElementById('total-visits');
  if (tp) tp.textContent = fmt(totalPlaying);
  if (tv) tv.textContent = fmt(totalVisits);
}

loadGames();

/* ===========================
   CAROUSEL
   =========================== */
const cardsEl = document.querySelector('.cards');
const gameCards = document.querySelectorAll('.game-card');
const dots = document.querySelectorAll('.dot');
let currentIdx = 1;
let isDragging = false, startX = 0, prevTranslate = 0, currentTranslate = 0;

function getCardWidth() {
  const card = gameCards[0];
  if (!card) return 0;
  return card.offsetWidth + 28; // gap
}

function setTranslate(x, animated = true) {
  cardsEl.style.transition = animated ? 'transform 0.5s cubic-bezier(0.4,0,0.2,1)' : 'none';
  cardsEl.style.transform = `translateX(${x}px)`;
}

function updateCarousel(animated = true) {
  const cw = getCardWidth();
  const containerW = cardsEl.parentElement.offsetWidth;
  const center = containerW / 2 - cw / 2;
  const tx = center - currentIdx * cw;
  prevTranslate = tx;
  currentTranslate = tx;
  setTranslate(tx, animated);

  gameCards.forEach((c, i) => c.classList.toggle('active', i === currentIdx));
  dots.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
}

function goTo(idx) {
  currentIdx = Math.max(0, Math.min(gameCards.length - 1, idx));
  updateCarousel();
}

dots.forEach(d => {
  d.addEventListener('click', () => goTo(+d.dataset.idx));
});

// Drag
function posX(e) {
  return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
}

cardsEl.addEventListener('mousedown', e => {
  if (e.target.tagName === 'IMG') return;
  isDragging = true;
  startX = posX(e);
  cardsEl.style.transition = 'none';
});

cardsEl.addEventListener('touchstart', e => {
  isDragging = true;
  startX = posX(e);
  cardsEl.style.transition = 'none';
}, { passive: true });

function onMove(e) {
  if (!isDragging) return;
  if (e.cancelable) e.preventDefault();
  const diff = posX(e) - startX;
  currentTranslate = prevTranslate + diff;
  setTranslate(currentTranslate, false);
}

cardsEl.addEventListener('mousemove', onMove);
cardsEl.addEventListener('touchmove', onMove, { passive: false });

function onEnd() {
  if (!isDragging) return;
  isDragging = false;
  const moved = currentTranslate - prevTranslate;
  if (moved < -80 && currentIdx < gameCards.length - 1) currentIdx++;
  else if (moved > 80 && currentIdx > 0) currentIdx--;
  updateCarousel();
}

cardsEl.addEventListener('mouseup', onEnd);
cardsEl.addEventListener('mouseleave', onEnd);
cardsEl.addEventListener('touchend', onEnd);
cardsEl.addEventListener('contextmenu', e => e.preventDefault());

// Resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => updateCarousel(false), 200);
});

updateCarousel(false);

/* ===========================
   RAIN EFFECT
   =========================== */
(function () {
  const btn = document.getElementById('rain-btn');
  const container = document.getElementById('rain-container');
  if (!btn || !container) return;

  let raining = false, onCooldown = false;
  const RAIN_DUR = 2000, COOLDOWN = 3000, COUNT = 60;

  function spawnDrop() {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.left = Math.random() * 100 + 'vw';
    drop.style.animationDuration = (0.6 + Math.random() * 1.2) + 's';
    drop.style.animationDelay = (Math.random() * 1.8) + 's';
    drop.style.opacity = 0.7 + Math.random() * 0.3;
    const img = document.createElement('img');
    img.src = 'happymeal.png';
    img.draggable = false;
    drop.appendChild(img);
    container.appendChild(drop);
    drop.addEventListener('animationend', () => drop.remove());
  }

  btn.addEventListener('click', () => {
    if (raining || onCooldown) return;
    raining = true;
    btn.classList.add('active');
    for (let i = 0; i < COUNT; i++) spawnDrop();
    setTimeout(() => {
      raining = false;
      onCooldown = true;
      btn.classList.remove('active');
      btn.classList.add('cooldown');
      setTimeout(() => {
        onCooldown = false;
        btn.classList.remove('cooldown');
      }, COOLDOWN);
    }, RAIN_DUR);
  });
})();
