// ✅ CATEGORY CONFIG COMES FROM config.js

let currentPage = 1;
let currentQuery = CATEGORY_CONFIG.nature.query;
let currentSource = CATEGORY_CONFIG.nature.source;
let activeCategory = 'nature';
let isLoading = false;

// DOM elements
const elements = {
  grid: document.getElementById('wallpaperGrid'),
  loadMoreBtn: document.getElementById('loadMore'),
  searchBox: document.getElementById('searchBox'),
  searchBtn: document.getElementById('searchBtn'),
  lightbox: document.getElementById('lightbox'),
  modalImg: document.getElementById('modal-image'),
  downloadFullBtn: document.getElementById('download-full'),
  viewFullBtn: document.getElementById('view-full'),
  categoryLinks: document.querySelectorAll('.category-link'),
  themeToggle: document.getElementById('themeToggle')
};

document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
  applySavedTheme();
  await loadWallpapers();
  setupEventListeners();
}

async function loadWallpapers(append = false) {
  if (isLoading) return;
  isLoading = true;

  try {
    const wallpapers = await fetchWallpapers(currentQuery, currentPage);
    displayWallpapers(wallpapers, append);
  } catch (err) {
    console.error("Error loading wallpapers:", err);
  } finally {
    isLoading = false;
  }
}

async function fetchWallpapers(query, page = 1) {
  if (currentSource === 'wallhaven') {
    return fetchWallhavenWallpapers(query, page);
  }
  return fetchPexelsWallpapers(query, page);
}

async function fetchPexelsWallpapers(query, page) {
  const response = await fetch(
    `${APIS.PEXELS.URL}search?query=${encodeURIComponent(query)}&page=${page}&per_page=15`,
    { headers: { Authorization: APIS.PEXELS.KEY } }
  );

  if (!response.ok) throw new Error("Pexels API failed");

  const data = await response.json();
  return data.photos.map(photo => ({
    src: {
      original: photo.src.original,
      small: photo.src.medium
    },
    photographer: photo.photographer,
    platform: 'Pexels'
  }));
}

async function fetchWallhavenWallpapers(query, page) {
  const url = `${APIS.WALLHAVEN.URL}q=${encodeURIComponent(query)}&page=${page}&purity=100&categories=111&sorting=random`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Wallhaven API failed");

  const data = await response.json();
  return data.data.map(img => ({
    src: {
      original: img.path,
      small: img.thumbs.small
    },
    photographer: 'Unknown',
    platform: 'Wallhaven'
  }));
}

function displayWallpapers(photos, append = false) {
  if (!photos || photos.length === 0) {
    elements.grid.innerHTML = '<div class="error">No wallpapers found.</div>';
    return;
  }

  if (!append) elements.grid.innerHTML = '';

  const fragment = document.createDocumentFragment();
  photos.forEach(photo => fragment.appendChild(createWallpaperCard(photo)));
  elements.grid.appendChild(fragment);
}

function createWallpaperCard(photo) {
  const card = document.createElement('div');
  card.className = 'wallpaper-card';
  card.innerHTML = `
    <img src="${photo.src.small}" alt="Wallpaper" class="wallpaper-img" data-original="${photo.src.original}">
    <div class="overlay">
      <button class="view-btn">👁</button>
      <button class="download-btn">⬇️</button>
    </div>
  `;

  // View button
  card.querySelector('.view-btn').addEventListener('click', () => {
    elements.modalImg.src = photo.src.original;
    elements.viewFullBtn.onclick = () => window.open(photo.src.original, "_blank");
    elements.downloadFullBtn.onclick = () => downloadWallpaper(photo.src.original);
    elements.lightbox.style.display = 'flex';
  });

  // Download
  card.querySelector('.download-btn').addEventListener('click', () => {
    downloadWallpaper(photo.src.original);
  });

  return card;
}

function downloadWallpaper(url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = `wallpaper-${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
function setupEventListeners() {
  // Search button
  elements.searchBtn.addEventListener('click', () => {
    const query = elements.searchBox.value.trim();
    if (query !== '') {
      currentQuery = query;
      currentSource = 'pexels';
      currentPage = 1;
      loadWallpapers(false);
    }
  });

  // Enter key for search
  elements.searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = elements.searchBox.value.trim();
      if (query !== '') {
        currentQuery = query;
        currentSource = 'pexels';
        currentPage = 1;
        loadWallpapers(false);
      }
    }
  });

  // Category switching
  elements.categoryLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      const category = link.dataset.category;

      if (CATEGORY_CONFIG[category]) {
        activeCategory = category;
        currentQuery = CATEGORY_CONFIG[category].query;
        currentSource = CATEGORY_CONFIG[category].source;
        currentPage = 1;

        document.querySelector('.category-link.active')?.classList.remove('active');
        link.classList.add('active');

        await loadWallpapers(false); // always refresh
      }
    });
  });

  // Load More
  elements.loadMoreBtn.addEventListener('click', () => {
    currentPage++;
    loadWallpapers(true);
  });

  // Infinite scroll
  window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
      currentPage++;
      loadWallpapers(true);
    }
  });

  // Lightbox close
  document.querySelector('.close-btn').addEventListener('click', () => {
    elements.lightbox.style.display = 'none';
  });

  // Theme toggle
  elements.themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

function applySavedTheme() {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  }
}
