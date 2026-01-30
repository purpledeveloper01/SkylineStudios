/* =========================
   MAINTENANCE MODE CHECK
   ========================= */

fetch(
  "https://raw.githubusercontent.com/purpledeveloper01/SkylineStudios/main/maintenance.json?ts=" + Date.now()
)
  .then(res => res.json())
  .then(data => {
    if (data.maintenance === true) {
      document.getElementById("maintenance-overlay").hidden = false;
      document.body.style.overflow = "hidden";
      throw new Error("Maintenance mode active"); // stop rest of JS
    }
  })
  .catch(() => {});

// Stars - append to #stars container instead of body
const starsContainer = document.getElementById("stars");
for (let i = 0; i < 70; i++) {
  const s = document.createElement("span");
  s.style.left = Math.random() * 100 + "vw";
  s.style.animationDuration = Math.random() * 30 + 20 + "s";
  starsContainer.appendChild(s);
}

// Mobile menu toggle functionality
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', function() {
    // Placeholder for mobile menu functionality
    // You can add a mobile menu drawer/overlay here
    alert('Mobile menu - Add your mobile navigation drawer here');
  });
}

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    
    // Skip if it's just "#" (home link)
    if (targetId === '#') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      return;
    }
    
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Roblox API (Cloudflare Worker)
const API = "https://skyline-roblox-api.bschofield987.workers.dev";

let totalPlaying = 0;
let totalVisits = 0;

// List of verified creators (add creator names here)
const verifiedCreators = [
  "Secret Base Community",
  "Prismplay Experiment",
  "Crazy Real Games",
  // Add more verified creator names here
];

// Format numbers with K, M, B abbreviations
function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

// Truncate text to specified length
function truncateText(text, maxLength) {
  if (!text) return "No description available";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

async function loadGames() {
  totalPlaying = 0;
  totalVisits = 0;

  const cards = document.querySelectorAll(".game-card");

  for (const card of cards) {
    const id = card.dataset.universeId;
    
    try {
      const res = await fetch(`${API}?universeId=${id}`);
      const data = await res.json();

      console.log(`Game ${id} FULL data:`, data); // Debug log

      // Update thumbnail
      const thumb = card.querySelector(".game-thumb");
      if (thumb && data.thumbnail) {
        thumb.src = data.thumbnail;
      }

      // Update game name
      const nameEl = card.querySelector(".game-name");
      if (nameEl && data.name) {
        nameEl.textContent = data.name;
      }

      // Update description with 100 character limit
      const descEl = card.querySelector(".game-desc");
      if (descEl) {
        descEl.textContent = truncateText(data.description, 100);
      }

      // Update developer/creator name and verified badge
      const authorNameEl = card.querySelector(".author-name");
      const verifiedBadge = card.querySelector(".verified-badge");
      
      if (authorNameEl && data.creator) {
        authorNameEl.textContent = data.creator;
      }
      
      // Show/hide verified badge based on verification status
      if (verifiedBadge && data.creator) {
        // Check if creator is in the verified list OR if API says verified
        const isVerifiedByAPI = data.isVerified === true || data.hasVerifiedBadge === true || data.verified === true;
        const isVerifiedInList = verifiedCreators.includes(data.creator);
        const isVerified = isVerifiedByAPI || isVerifiedInList;
        
        console.log(`Game ${id} - Creator: ${data.creator}, Verified:`, isVerified); // Debug log
        
        if (isVerified) {
          verifiedBadge.style.display = "inline-block";
        } else {
          verifiedBadge.style.display = "none";
        }
      }

      // Update stats in overlay with formatted numbers
      const ccuEl = card.querySelector(".ccu");
      const visitsEl = card.querySelector(".visits");
      
      // Try multiple possible field names for CCU
      const ccuValue = data.playing ?? data.ccu ?? data.playerCount ?? data.activePlayers ?? 0;
      const visitsValue = data.visits ?? data.totalVisits ?? data.placeVisits ?? 0;
      
      console.log(`Game ${id} - CCU value:`, ccuValue, 'Visits value:', visitsValue); // Debug log
      console.log(`Game ${id} - Available fields:`, Object.keys(data)); // Show all available fields
      
      if (ccuEl) {
        ccuEl.textContent = formatNumber(ccuValue);
        if (typeof ccuValue === 'number') {
          totalPlaying += ccuValue;
        }
      }
      
      if (visitsEl) {
        visitsEl.textContent = formatNumber(visitsValue);
        if (typeof visitsValue === 'number') {
          totalVisits += visitsValue;
        }
      }

      // Update play button
      const playBtn = card.querySelector(".play-btn");
      if (playBtn && data.placeId) {
        playBtn.onclick = () => {
          window.open(`https://www.roblox.com/games/${data.placeId}`, "_blank");
        };
      }
    } catch (error) {
      console.error(`Error loading game ${id}:`, error);
    }
  }

  // Update total stats with formatted numbers
  const totalPlayingEl = document.getElementById("total-playing");
  const totalVisitsEl = document.getElementById("total-visits");
  
  console.log('Total Playing:', totalPlaying, 'Total Visits:', totalVisits); // Debug log
  
  if (totalPlayingEl) {
    totalPlayingEl.textContent = formatNumber(totalPlaying);
  }
  
  if (totalVisitsEl) {
    totalVisitsEl.textContent = formatNumber(totalVisits);
  }
}

// Carousel functionality
const cardsEl = document.querySelector(".cards");
const gameCards = document.querySelectorAll(".game-card");

let currentIndex = 1; // Start with second card (index 1) in center
let isDragging = false;
let startX = 0;
let currentTranslate = 0;
let prevTranslate = 0;

// Initialize - set middle card as active
function initCarousel() {
  // Start with second card if there are at least 2 cards
  if (gameCards.length > 1) {
    currentIndex = 1;
  } else {
    currentIndex = 0;
  }
  updateCarousel();
  updateActiveCard();
}

function updateCarousel() {
  const cardWidth = 380 + 32; // card width + gap
  const carousel = cardsEl.parentElement;
  const containerWidth = carousel.offsetWidth;
  
  // Calculate offset to center the active card
  const centerOffset = containerWidth / 2 - cardWidth / 2;
  const translateX = centerOffset - (currentIndex * cardWidth);
  
  currentTranslate = translateX;
  prevTranslate = translateX;
  cardsEl.style.transform = `translateX(${translateX}px)`;
}

function updateActiveCard() {
  gameCards.forEach((card, index) => {
    if (index === currentIndex) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
}

// Touch/Mouse drag functionality
function getPositionX(event) {
  return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX;
}

function dragStart(event) {
  // Don't start drag if clicking on an image
  if (event.target.tagName === 'IMG') {
    return;
  }
  
  isDragging = true;
  startX = getPositionX(event);
  cardsEl.style.cursor = 'grabbing';
  cardsEl.style.transition = 'none';
}

function drag(event) {
  if (!isDragging) return;
  
  event.preventDefault(); // Prevent image dragging
  
  const currentX = getPositionX(event);
  const diff = currentX - startX;
  currentTranslate = prevTranslate + diff;
  
  cardsEl.style.transform = `translateX(${currentTranslate}px)`;
}

function dragEnd() {
  if (!isDragging) return;
  
  isDragging = false;
  cardsEl.style.cursor = 'grab';
  cardsEl.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  
  const movedBy = currentTranslate - prevTranslate;
  const cardWidth = 380 + 32;
  
  // Determine if we should move to next/prev card
  if (movedBy < -100 && currentIndex < gameCards.length - 1) {
    currentIndex++;
  } else if (movedBy > 100 && currentIndex > 0) {
    currentIndex--;
  }
  
  updateCarousel();
  updateActiveCard();
}

// Add event listeners for dragging
if (cardsEl) {
  // Mouse events
  cardsEl.addEventListener('mousedown', dragStart);
  cardsEl.addEventListener('mousemove', drag);
  cardsEl.addEventListener('mouseup', dragEnd);
  cardsEl.addEventListener('mouseleave', dragEnd);
  
  // Touch events
  cardsEl.addEventListener('touchstart', dragStart);
  cardsEl.addEventListener('touchmove', drag);
  cardsEl.addEventListener('touchend', dragEnd);
  
  // Prevent context menu on long press
  cardsEl.addEventListener('contextmenu', (e) => e.preventDefault());
}

// Update on window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    updateCarousel();
  }, 250);
});

// Initialize carousel
initCarousel();

// Load games on page load ONLY
loadGames();

// REMOVED: Auto-refresh interval to prevent rate limiting
// The page will only load data when refreshed by the user
