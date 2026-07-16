/* ==============================
   ONE-TIME LOADING SCREEN
   ============================== */
(function () {
  const SESSION_KEY = 'skyline_has_loaded';
  const loader      = document.getElementById('skyline-loader');
  if (!loader) return;

  if (sessionStorage.getItem(SESSION_KEY)) {
    loader.style.display = 'none';
    return;
  }
  sessionStorage.setItem(SESSION_KEY, '1');

  const bar    = document.getElementById('slBarFill');
  const status = document.getElementById('slStatus');

  const steps = [
    { pct: 20,  label: 'Loading assets…',       delay: 300  },
    { pct: 50,  label: 'Connecting to Roblox…', delay: 900  },
    { pct: 78,  label: 'Almost there…',         delay: 1500 },
    { pct: 100, label: 'Welcome!',              delay: 2000 },
  ];

  steps.forEach(({ pct, label, delay }) => {
    setTimeout(() => {
      if (bar)    bar.style.width    = pct + '%';
      if (status) status.textContent = label;
    }, delay);
  });

  const MIN_MS = 2500;
  const start  = Date.now();

  function dismiss() {
    loader.classList.add('sl-hidden');
    setTimeout(() => { loader.style.display = 'none'; }, 700);
  }

  function schedDismiss() {
    setTimeout(dismiss, Math.max(0, MIN_MS - (Date.now() - start)));
  }

  if (document.readyState === 'complete') schedDismiss();
  else window.addEventListener('load', schedDismiss, { once: true });
})();

/* ==============================
   SITE BANNER (dismissible, 1x per site load)
   ============================== */
(function () {
  const KEY    = 'skyline_banner_dismissed';
  const banner = document.getElementById('siteBanner');
  const closeBtn = document.getElementById('siteBannerClose');
  if (!banner) return;

  // Already dismissed this session (site load) — hide instantly, no animation
  if (sessionStorage.getItem(KEY)) {
    banner.style.display = 'none';
    return;
  }

  closeBtn?.addEventListener('click', () => {
    banner.classList.add('site-banner-hidden');
    sessionStorage.setItem(KEY, '1');
    setTimeout(() => { banner.style.display = 'none'; }, 350);
  });
})();

/* ==========================================================
   PARTICLES BACKGROUND
   ========================================================== */
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  let W, H;

  /* ── Shaders ── */
  const vertSrc = `
    attribute vec3 position;
    attribute vec4 random;
    attribute vec3 color;

    uniform mat4 modelMatrix;
    uniform mat4 viewMatrix;
    uniform mat4 projectionMatrix;
    uniform float uTime;
    uniform float uSpread;
    uniform float uBaseSize;
    uniform float uSizeRandomness;

    varying vec4 vRandom;
    varying vec3 vColor;

    void main() {
      vRandom = random;
      vColor  = color;

      vec3 pos = position * uSpread;
      pos.z *= 10.0;

      vec4 mPos = modelMatrix * vec4(pos, 1.0);
      float t = uTime;
      mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
      mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
      mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);

      vec4 mvPos = viewMatrix * mPos;

      if (uSizeRandomness == 0.0) {
        gl_PointSize = uBaseSize;
      } else {
        gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / length(mvPos.xyz);
      }

      gl_Position = projectionMatrix * mvPos;
    }
  `;

  const fragSrc = `
    precision highp float;

    uniform float uTime;
    uniform float uAlphaParticles;
    varying vec4 vRandom;
    varying vec3 vColor;

    void main() {
      vec2 uv = gl_PointCoord.xy;
      float d = length(uv - vec2(0.5));

      if (uAlphaParticles < 0.5) {
        if (d > 0.5) discard;
        gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
      } else {
        float circle = smoothstep(0.5, 0.4, d) * 0.8;
        gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
      }
    }
  `;

  /* ── Compile & link ── */
  function mkShader(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, mkShader(gl.VERTEX_SHADER,   vertSrc));
  gl.attachShader(prog, mkShader(gl.FRAGMENT_SHADER, fragSrc));
  gl.linkProgram(prog);
  gl.useProgram(prog);

  /* ── Particle data ── */
  const COUNT     = 200;
  const positions = new Float32Array(COUNT * 3);
  const randoms   = new Float32Array(COUNT * 4);
  const colors    = new Float32Array(COUNT * 3);

  for (let i = 0; i < COUNT; i++) {
    let x, y, z, len;
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      z = Math.random() * 2 - 1;
      len = x*x + y*y + z*z;
    } while (len > 1 || len === 0);
    const r = Math.cbrt(Math.random());
    positions.set([x*r, y*r, z*r], i * 3);
    randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
    colors.set([1, 1, 1], i * 3);
  }

  function mkBuf(data) {
    const b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    return b;
  }
  function bindAttr(buf, name, size) {
    const loc = gl.getAttribLocation(prog, name);
    if (loc < 0) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }

  bindAttr(mkBuf(positions), 'position', 3);
  bindAttr(mkBuf(randoms),   'random',   4);
  bindAttr(mkBuf(colors),    'color',    3);

  /* ── Uniforms ── */
  const uLoc = {
    time:       gl.getUniformLocation(prog, 'uTime'),
    spread:     gl.getUniformLocation(prog, 'uSpread'),
    baseSize:   gl.getUniformLocation(prog, 'uBaseSize'),
    sizeRand:   gl.getUniformLocation(prog, 'uSizeRandomness'),
    alpha:      gl.getUniformLocation(prog, 'uAlphaParticles'),
    model:      gl.getUniformLocation(prog, 'modelMatrix'),
    view:       gl.getUniformLocation(prog, 'viewMatrix'),
    projection: gl.getUniformLocation(prog, 'projectionMatrix'),
  };

  gl.uniform1f(uLoc.spread,   10);
  gl.uniform1f(uLoc.baseSize, 100);
  gl.uniform1f(uLoc.sizeRand, 1);
  gl.uniform1f(uLoc.alpha,    0);

  /* ── Mouse / touch tracking ── */
  const HOVER_FACTOR = 1;
  const mouse  = { x: 0, y: 0 };   // raw normalised target  (-1 → +1)
  const smooth = { x: 0, y: 0 };   // lerped value used each frame
  const LERP   = 0.06;

  window.addEventListener('mousemove', e => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  window.addEventListener('touchmove', e => {
    if (!e.touches.length) return;
    mouse.x =  (e.touches[0].clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -((e.touches[0].clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  window.addEventListener('mouseleave', () => { mouse.x = 0; mouse.y = 0; }, { passive: true });

  /* ── mat4 helpers (column-major) ── */
  const norm  = v => { const l = Math.hypot(...v); return v.map(n => n / l); };
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const dot   = (a, b) => a.reduce((s, n, i) => s + n * b[i], 0);

  function lookAt(eye, center, up) {
    const z = norm(eye.map((n, i) => n - center[i]));
    const x = norm(cross(up, z));
    const y = cross(z, x);
    return new Float32Array([
      x[0], y[0], z[0], 0,
      x[1], y[1], z[1], 0,
      x[2], y[2], z[2], 0,
      -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
    ]);
  }

  function perspective(fovDeg, aspect, near, far) {
    const f  = 1 / Math.tan(fovDeg * Math.PI / 360);
    const nf = 1 / (near - far);
    const m  = new Float32Array(16);
    m[0]  = f / aspect;
    m[5]  = f;
    m[10] = (far + near) * nf;
    m[11] = -1;
    m[14] = 2 * far * near * nf;
    return m;
  }

  function translate(tx, ty, tz) {
    return new Float32Array([
      1,  0,  0,  0,
      0,  1,  0,  0,
      0,  0,  1,  0,
      tx, ty, tz, 1,
    ]);
  }

  function rotX(a) {
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
  }
  function rotY(a) {
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
  }
  function rotZ(a) {
    const [c, s] = [Math.cos(a), Math.sin(a)];
    return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
  }

  function mul(a, b) {
    const m = new Float32Array(16);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[i + k*4] * b[k + j*4];
        m[i + j*4] = s;
      }
    return m;
  }

  /* ── Fixed view matrix ── */
  const viewMat = lookAt([0, 0, 20], [0, 0, 0], [0, 1, 0]);

  /* ── Resize ── */
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    gl.viewport(0, 0, W, H);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  /* ── Animation loop ── */
  const SPEED  = 0.1;
  let lastTime = performance.now();
  let elapsed  = 0;
  let rZ       = 0;

  function frame(t) {
    requestAnimationFrame(frame);

    const delta = t - lastTime;
    lastTime = t;
    elapsed += delta * SPEED;

    /* Smooth mouse follow */
    smooth.x += (mouse.x - smooth.x) * LERP;
    smooth.y += (mouse.y - smooth.y) * LERP;

    /* Rotation */
    const rXv = Math.sin(elapsed * 0.0002) * 0.1;
    const rYv = Math.cos(elapsed * 0.0005) * 0.15;
    rZ += 0.01 * SPEED;

    /*
     * Replicates React component:
     *   particles.position.x = -mouseX * hoverFactor
     *   particles.position.y = -mouseY * hoverFactor
     * Applied as a translation on top of the rotation.
     */
    const T        = translate(-smooth.x * HOVER_FACTOR, -smooth.y * HOVER_FACTOR, 0);
    const R        = mul(mul(rotX(rXv), rotY(rYv)), rotZ(rZ));
    const modelMat = mul(T, R);
    const projMat  = perspective(15, W / H, 0.1, 1000);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.uniform1f(uLoc.time, elapsed * 0.001);
    gl.uniformMatrix4fv(uLoc.model,      false, modelMat);
    gl.uniformMatrix4fv(uLoc.view,       false, viewMat);
    gl.uniformMatrix4fv(uLoc.projection, false, projMat);

    gl.drawArrays(gl.POINTS, 0, COUNT);
  }

  requestAnimationFrame(frame);
})();


/* ==========================================================
   NAVBAR SCROLL
   ========================================================== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20), { passive: true });

/* ==========================================================
   MOBILE MENU
   ========================================================== */
const mobileBtn    = document.getElementById('mobileMenuBtn');
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

/* ==========================================================
   ROBLOX API
   ========================================================== */
const API          = 'https://skyline-roblox-api.bschofield987.workers.dev';
const UNIVERSE_IDS = ['8581899016', '7201268162', '9533030530'];
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

/* ── Index page cards ── */
async function loadIndexGames() {
  const cards = document.querySelectorAll('.game-card[data-universe-id]');
  if (!cards.length) return;

  let totalPlaying = 0, totalVisits = 0;
  const loadedGames = [];

  for (const card of cards) {
    try {
      const res = await fetch(`${API}?universeId=${card.dataset.universeId}`);
      const d   = await res.json();

      const ccu = d.playing ?? d.ccu ?? d.playerCount ?? 0;
      const vis = d.visits ?? d.totalVisits ?? d.placeVisits ?? 0;
      totalPlaying += ccu;
      totalVisits  += vis;

      const thumb = card.querySelector('.game-thumb');
      if (thumb) setThumb(thumb, d.thumbnail);

      const nameEl = card.querySelector('.game-name');
      if (nameEl && d.name) nameEl.textContent = d.name;

      const descEl = card.querySelector('.game-desc');
      if (descEl) descEl.textContent = truncate(d.description, 100);

      const authorEl = card.querySelector('.author-name');
      const badge    = card.querySelector('.verified-badge');
      if (authorEl && d.creator) authorEl.textContent = d.creator;
      if (badge) badge.style.display = isVerified(d) ? 'inline-block' : 'none';

      const ccuEl = card.querySelector('.ccu');
      const visEl = card.querySelector('.visits');
      if (ccuEl) ccuEl.textContent = fmt(ccu);
      if (visEl) visEl.textContent = fmt(vis);

      const btn = card.querySelector('.card-play-btn');
      if (btn && d.placeId) btn.onclick = () => window.open(`https://www.roblox.com/games/${d.placeId}`, '_blank');

      loadedGames.push({
        name: d.name || 'Unknown Game',
        description: d.description,
        thumbnail: d.thumbnail,
        placeId: d.placeId,
        ccu, visits: vis,
      });
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

  initFeaturedHero(loadedGames);
}

/* ── Featured hero (rotating top-3-by-visits showcase) ── */
function initFeaturedHero(games) {
  const wrap = document.getElementById('fhWrap');
  if (!wrap || !games.length) return;

  const top3 = [...games].sort((a, b) => b.visits - a.visits).slice(0, 3);

  /* Two stacked background layers so we can crossfade between thumbnails */
  const bgA = document.getElementById('fhBg');
  const bgB = document.createElement('div');
  bgB.className = 'fh-bg';
  bgA.parentElement.insertBefore(bgB, bgA);
  let currentBg = bgA, nextBg = bgB;

  const nameEl  = document.getElementById('fhName');
  const descEl  = document.getElementById('fhDesc');
  const ccuEl   = document.getElementById('fhCcu');
  const visEl   = document.getElementById('fhVisits');
  const playBtn = document.getElementById('fhPlayBtn');
  const dotsEl  = document.getElementById('fhDots');

  top3.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'fh-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => { stop(); show(i); start(); });
    dotsEl.appendChild(dot);
  });

  let idx = 0, timer = null;

  function show(i) {
    idx = i;
    const g = top3[i];

    nextBg.style.backgroundImage = `url('${g.thumbnail || 'placeholderimg.png'}')`;
    nextBg.classList.add('fh-bg-active');
    currentBg.classList.remove('fh-bg-active');
    [currentBg, nextBg] = [nextBg, currentBg];

    nameEl.textContent = g.name;
    descEl.textContent = truncate(g.description, 140);
    ccuEl.textContent  = fmt(g.ccu);
    visEl.textContent  = fmt(g.visits);
    playBtn.onclick = g.placeId
      ? () => window.open(`https://www.roblox.com/games/${g.placeId}`, '_blank')
      : null;

    dotsEl.querySelectorAll('.fh-dot').forEach((d, di) => d.classList.toggle('active', di === i));
  }

  function start() {
    timer = setInterval(() => show((idx + 1) % top3.length), 6000);
  }
  function stop() { clearInterval(timer); }

  show(0);
  start();
}

/* ── Carousel ── */
function initCarousel() {
  const cardsEl   = document.querySelector('.cards');
  const gameCards = document.querySelectorAll('.game-card');
  const cdots     = document.querySelectorAll('.cdot');
  const prevBtn   = document.getElementById('carouselPrev');
  const nextBtn   = document.getElementById('carouselNext');
  if (!cardsEl || !gameCards.length) return;

  const GAP = 28, PAD = 40; // GAP updated to match new card spacing
  let idx = 1, dragging = false, startX = 0, prevTx = 0, curTx = 0;

  function cardW() { return gameCards[0]?.offsetWidth || 0; }

  function setPos(x, animated = true) {
    cardsEl.style.transition = animated ? 'transform .5s cubic-bezier(.4,0,.2,1)' : 'none';
    cardsEl.style.transform  = `translateX(${x}px)`;
  }

  function update(animated = true) {
    const w = cardW(), stride = w + GAP;
    const tx = cardsEl.parentElement.offsetWidth / 2 - PAD - idx * stride - w / 2;
    prevTx = curTx = tx;
    setPos(tx, animated);
    gameCards.forEach((c, i) => c.classList.toggle('active', i === idx));
    cdots.forEach((d, i) => d.classList.toggle('active', i === idx));
    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === gameCards.length - 1;
  }

  function goTo(i) { idx = Math.max(0, Math.min(gameCards.length - 1, i)); update(); }

  cdots.forEach(d => d.addEventListener('click', () => goTo(+d.dataset.idx)));
  prevBtn?.addEventListener('click', () => goTo(idx - 1));
  nextBtn?.addEventListener('click', () => goTo(idx + 1));

  // ...rest of the function (drag handlers) stays exactly the same

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
    if      (moved < -thresh && idx < gameCards.length - 1) idx++;
    else if (moved >  thresh && idx > 0)                    idx--;
    update();
  }
  cardsEl.addEventListener('mouseup',    onEnd);
  cardsEl.addEventListener('mouseleave', onEnd);
  cardsEl.addEventListener('touchend',   onEnd);
  cardsEl.addEventListener('contextmenu', e => e.preventDefault());

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => update(false), 200);
  });

  update(false);
}

/* ── Tilt cards ── */
function initTiltCards() {
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const x  = e.clientX - r.left, y = e.clientY - r.top;
      const rx = (y - r.height / 2) / r.height * -8;
      const ry = (x - r.width  / 2) / r.width  *  8;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
      const shine = card.querySelector('.tilt-shine');
      if (shine) {
        shine.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.08) 0%, transparent 65%)`;
        shine.style.opacity = '1';
      }
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      const shine = card.querySelector('.tilt-shine');
      if (shine) shine.style.opacity = '0';
    });
  });
}

/* ── Games page (/games) ── */
function initGamesPage() {
  const grid = document.getElementById('gpGrid');
  if (!grid) return;

  let gameData = [];

  function buildCard(d) {
    const card = document.createElement('div');
    card.className = 'game-card';
    card.innerHTML = `
      <div class="card-img-wrap">
        <img class="game-thumb${!d.thumbnail ? ' thumb-placeholder' : ''}"
             src="${d.thumbnail || 'placeholderimg.png'}" alt="${d.name || 'Game'}" loading="lazy"
             onerror="this.src='placeholderimg.png';this.classList.add('thumb-placeholder');">
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
        <button class="card-play-btn btn btn-primary btn-block"${d.placeId ? ` onclick="window.open('https://www.roblox.com/games/${d.placeId}','_blank')"` : ''}>
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
    if (f === 'popular') {
      data = data.filter(d => d.visits > 1000000);
      if (!data.length) data = [...gameData].sort((a, b) => b.visits - a.visits);
    } else if (f === 'live') {
      data = data.filter(d => d.ccu > 0);
    }
    const s = document.getElementById('gp-sort')?.value;
    if (s === 'visits')  data.sort((a, b) => b.visits - a.visits);
    if (s === 'playing') data.sort((a, b) => b.ccu    - a.ccu);
    renderGrid(data);
  }

  async function loadAllGames() {
    showSkeletons();
    gameData = [];
    let totalPlaying = 0, totalVisits = 0;

    const results = await Promise.all(UNIVERSE_IDS.map(async id => {
      try {
        const res = await fetch(`${API}?universeId=${id}`);
        const d   = await res.json();
        d.universeId = id;
        d.ccu    = d.playing ?? d.ccu ?? d.playerCount ?? 0;
        d.visits = d.visits ?? d.totalVisits ?? d.placeVisits ?? 0;
        totalPlaying += d.ccu;
        totalVisits  += d.visits;
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

/* ── Boot ── */
loadIndexGames();
initCarousel();
initTiltCards();
initGamesPage();

/* ==============================
   SCROLL ANIMATIONS
   ============================== */
(function () {

  /* ── Assign animation classes to elements ── */
  function tagElements() {

    /* Helper: add classes only when element exists */
    function tag(selector, animClass, extras) {
      document.querySelectorAll(selector).forEach((el, i) => {
        el.classList.add('sa', animClass);
        if (extras) extras.forEach(c => el.classList.add(c));
      });
    }

    /* ── INDEX PAGE ── */

    /* Section titles */
    tag('.section-title',  'sa-blur',    ['sa-slow']);
    tag('.section-sub',    'sa-fade-up', ['sa-delay-1']);
    tag('.section-note',   'sa-fade-up', ['sa-delay-2']);

    /* Live stat badges row */
    document.querySelectorAll('.stats-row .stat-badge').forEach((el, i) => {
      el.classList.add('sa', 'sa-zoom-up', `sa-delay-${i + 1}`);
    });

    /* Home page carousel — animate the wrapper as one unit so the
       carousel's own active/inactive scale logic is never touched */
    tag('.cards-scroll-wrap', 'sa-fade-up', ['sa-slow']);

    /* Carousel dots */
    tag('.carousel-dots', 'sa-fade-up', ['sa-delay-1']);

    /* Explore All button */
    tag('.explore-btn-wrap', 'sa-zoom', ['sa-delay-2']);

    /* About — mission / vision tilt cards */
    document.querySelectorAll('.tilt-card').forEach((el, i) => {
      el.classList.add('sa', i % 2 === 0 ? 'sa-fade-left' : 'sa-fade-right', 'sa-slow');
    });

    /* Stats strip items */
    document.querySelectorAll('.strip-item').forEach((el, i) => {
      el.classList.add('sa', 'sa-zoom-up', `sa-delay-${i + 1}`);
    });

    /* Feature grid cards */
    document.querySelectorAll('.feature-card').forEach((el, i) => {
      el.classList.add('sa', 'sa-flip-x', `sa-delay-${(i % 3) + 1}`);
    });

    /* ── GAMES PAGE ── */

    /* Page hero text */
    tag('.games-page-hero .hero-h1', 'sa-blur',    ['sa-slow']);
    tag('.games-page-hero .hero-sub', 'sa-fade-up', ['sa-delay-1']);
    tag('.games-page-hero .stats-row', 'sa-fade-up', ['sa-delay-2']);

    /* Toolbar */
    tag('.gp-toolbar', 'sa-fade-down', ['sa-delay-1']);

    /* Grid cards — stagger in rows of 3 */
    document.querySelectorAll('.gp-grid .game-card').forEach((el, i) => {
      el.classList.add('sa', 'sa-zoom-up', `sa-delay-${(i % 3) + 1}`);
    });

    tag('.gp-note', 'sa-fade-up', ['sa-delay-2']);
  }

  /* ── Intersection Observer ── */
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('sa-in');
          /* Un-observe once played — no replay on scroll back up */
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,      /* fire when 12 % of element is visible */
      rootMargin: '0px 0px -40px 0px',  /* trigger slightly before fully visible */
    }
  );

  /* ── Wire up ── */
  function init() {
    tagElements();
    document.querySelectorAll('.sa').forEach(el => observer.observe(el));
  }

  /* Run after DOM + any dynamic card injection settles */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 60));
  } else {
    setTimeout(init, 60);
  }

  /*
   * Games page loads cards asynchronously via initGamesPage().
   * We re-scan the grid once it's populated so dynamically
   * injected cards also get animations.
   */
  const gpGrid = document.getElementById('gpGrid');
  if (gpGrid) {
    const gridObserver = new MutationObserver(() => {
      gpGrid.querySelectorAll('.game-card:not(.sa)').forEach((el, i) => {
        el.classList.add('sa', 'sa-zoom-up', `sa-delay-${(i % 3) + 1}`);
        observer.observe(el);
      });
    });
    gridObserver.observe(gpGrid, { childList: true });
  }

})();
