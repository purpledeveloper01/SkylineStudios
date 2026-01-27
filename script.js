/* ===============================
   STARS BACKGROUND
================================ */
const starsContainer = document.getElementById("stars");

if (starsContainer) {
  for (let i = 0; i < 70; i++) {
    const star = document.createElement("span");
    star.style.left = `${Math.random() * 100}vw`;
    star.style.animationDuration = `${Math.random() * 30 + 20}s`;
    starsContainer.appendChild(star);
  }
}

/* ===============================
   MOBILE MENU (PLACEHOLDER)
================================ */
const mobileMenuBtn = document.getElementById("mobileMenuBtn");

mobileMenuBtn?.addEventListener("click", () => {
  alert("Mobile menu – add your drawer here");
});

/* ===============================
   SMOOTH SCROLL
================================ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener("click", e => {
    const targetId = link.getAttribute("href");
    if (!targetId) return;

    e.preventDefault();

    if (targetId === "#") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const target = document.querySelector(targetId);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

/* ===============================
   UTILITIES
================================ */
const verifiedCreators = [
  "Secret Base Community",
  "Prismplay Experiment",
  "Crazy Real Games"
];

const formatNumber = num => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return String(num);
};

const truncateText = (text, max = 100) =>
  text && text.length > max ? `${text.slice(0, max)}...` : text || "No description available";

/* ===============================
   ROBLOX API
================================ */
async function fetchGameData(universeId) {
  const [gameRes, thumbRes] = await Promise.all([
    fetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
    fetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&size=512x512&format=Png&isCircular=false`)
  ]);

  const gameJson = await gameRes.json();
  const thumbJson = await thumbRes.json();

  const game = gameJson.data?.[0];
  if (!game) throw new Error("Game not found");

  let creator = "Unknown Creator";
  let isVerified = false;

  try {
    if (game.creator?.type === "Group") {
      const res = await fetch(`https://groups.roblox.com/v1/groups/${game.creator.id}`);
      const data = await res.json();
      creator = data.name ?? creator;
      isVerified = Boolean(data.hasVerifiedBadge);
    }

    if (game.creator?.type === "User") {
      const res = await fetch(`https://users.roblox.com/v1/users/${game.creator.id}`);
      const data = await res.json();
      creator = data.name ?? data.displayName ?? creator;
      isVerified = Boolean(data.hasVerifiedBadge);
    }
  } catch {
    // Non-fatal
  }

  return {
    name: game.name,
    description: game.description,
    visits: game.visits ?? 0,
    playing: game.playing ?? 0,
    thumbnail: thumbJson.data?.[0]?.imageUrl ?? "",
    placeId: game.rootPlaceId,
    creator,
    isVerified
  };
}

/* ===============================
   LOAD GAMES
================================ */
async function loadGames() {
  const cards = [...document.querySelectorAll(".game-card")];
  if (!cards.length) return;

  let totalPlaying = 0;
  let totalVisits = 0;

  const results = await Promise.allSettled(
    cards.map(card => fetchGameData(card.dataset.universeId))
  );

  results.forEach((result, index) => {
    if (result.status !== "fulfilled") return;

    const data = result.value;
    const card = cards[index];

    card.querySelector(".game-thumb")?.setAttribute("src", data.thumbnail);
    card.querySelector(".game-name").textContent = data.name;
    card.querySelector(".game-desc").textContent = truncateText(data.description);

    const authorEl = card.querySelector(".author-name");
    const badgeEl = card.querySelector(".verified-badge");

    if (authorEl) authorEl.textContent = data.creator;

    const verified =
      data.isVerified || verifiedCreators.includes(data.creator);

    if (badgeEl) badgeEl.style.display = verified ? "inline-block" : "none";

    card.querySelector(".ccu").textContent = formatNumber(data.playing);
    card.querySelector(".visits").textContent = formatNumber(data.visits);

    totalPlaying += data.playing;
    totalVisits += data.visits;

    const playBtn = card.querySelector(".play-btn");
    if (playBtn && data.placeId) {
      playBtn.onclick = () =>
        window.open(`https://www.roblox.com/games/${data.placeId}`, "_blank");
    }
  });

  document.getElementById("total-playing").textContent = formatNumber(totalPlaying);
  document.getElementById("total-visits").textContent = formatNumber(totalVisits);
}

/* ===============================
   CAROUSEL
================================ */
const cardsEl = document.querySelector(".cards");
const gameCards = [...document.querySelectorAll(".game-card")];

let currentIndex = Math.min(1, gameCards.length - 1);
let isDragging = false;
let startX = 0;
let prevTranslate = 0;

const getCardWidth = () =>
  gameCards[0]?.getBoundingClientRect().width + 32 || 400;

function updateCarousel() {
  if (!cardsEl) return;

  const container = cardsEl.parentElement;
  const centerOffset = container.offsetWidth / 2 - getCardWidth() / 2;
  const translateX = centerOffset - currentIndex * getCardWidth();

  prevTranslate = translateX;
  cardsEl.style.transform = `translateX(${translateX}px)`;

  gameCards.forEach((c, i) =>
    c.classList.toggle("active", i === currentIndex)
  );
}

function getX(e) {
  return e.touches ? e.touches[0].clientX : e.pageX;
}

function dragStart(e) {
  if (["IMG", "BUTTON", "A"].includes(e.target.tagName)) return;
  isDragging = true;
  startX = getX(e);
  cardsEl.style.transition = "none";
}

function dragMove(e) {
  if (!isDragging) return;
  const diff = getX(e) - startX;
  cardsEl.style.transform = `translateX(${prevTranslate + diff}px)`;
}

function dragEnd(e) {
  if (!isDragging) return;
  isDragging = false;

  const moved = getX(e) - startX;
  if (moved < -100 && currentIndex < gameCards.length - 1) currentIndex++;
  if (moved > 100 && currentIndex > 0) currentIndex--;

  cardsEl.style.transition = "transform 0.4s ease";
  updateCarousel();
}

cardsEl?.addEventListener("mousedown", dragStart);
cardsEl?.addEventListener("mousemove", dragMove);
cardsEl?.addEventListener("mouseup", dragEnd);
cardsEl?.addEventListener("mouseleave", dragEnd);
cardsEl?.addEventListener("touchstart", dragStart);
cardsEl?.addEventListener("touchmove", dragMove);
cardsEl?.addEventListener("touchend", dragEnd);

window.addEventListener("resize", updateCarousel);

/* ===============================
   INIT
================================ */
updateCarousel();
loadGames();
