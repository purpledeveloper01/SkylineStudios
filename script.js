// Stars - append to #stars container instead of body
const starsContainer = document.getElementById("stars");
for (let i = 0; i < 70; i++) {
  const s = document.createElement("span");
  s.style.left = Math.random() * 100 + "vw";
  s.style.animationDuration = Math.random() * 30 + 20 + "s";
  starsContainer.appendChild(s);
}

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

// Carousel (now disabled for grid layout, but keeping for compatibility)
const cardsEl = document.querySelector(".cards");
const leftArrow = document.querySelector(".arrow.left");
const rightArrow = document.querySelector(".arrow.right");
let index = 0;

function updateCarousel() {
  // Disabled for grid layout
  if (leftArrow) {
    leftArrow.style.display = 'none';
  }
  if (rightArrow) {
    rightArrow.style.display = 'none';
  }
}

// Initial carousel state
updateCarousel();

// Load games on page load ONLY
loadGames();

// REMOVED: Auto-refresh interval to prevent rate limiting
// The page will only load data when refreshed by the user