// ============================================================================
// 🔥 FIREBASE MIGRATION NOTES - FILE HEADER
// ============================================================================
// When migrating to Firebase backend, add these imports at the top:
// 
// import { initializeApp } from 'firebase/app';
// import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
// import { firebaseConfig } from './firebase-config.js';
// 
// const app = initializeApp(firebaseConfig);
// const db = getFirestore(app);
//
// Then update filterAndSortJobs() function to async (search for "FIREBASE MIGRATION POINT" below)
// ============================================================================

const LISTING_CSS_VERSION = '20260208u';
const listingCssLinks = document.querySelectorAll('link[rel="stylesheet"][href*="public/css/listing.css"]');
listingCssLinks.forEach(link => {
  const href = link.getAttribute('href') || '';
  const baseHref = href.split('?')[0];
  link.setAttribute('href', `${baseHref}?v=${LISTING_CSS_VERSION}`);
});

function normalizeHeaderButtons() {
  const headerButtons = document.querySelectorAll('.jobcat-headerbuttons .jobcat-headerbutton');
  headerButtons.forEach(button => {
    if (button.id) return;
    const img = button.querySelector('img');
    if (!img) return;
    const alt = (img.getAttribute('alt') || '').toLowerCase();
    const src = (img.getAttribute('src') || '').toLowerCase();
    if (alt === 'post' || src.includes('post')) {
      button.id = 'postBtn';
    } else if (alt === 'search' || src.includes('search')) {
      button.id = 'searchBtn';
    }
  });
}

// POST BUTTON AUTH CHECK (with zombie user detection)
function handlePostButtonClick(e) {
  e.preventDefault();
  e.stopPropagation();

  // Wait for Firebase to be available
  setTimeout(function() {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      window.location.href = 'login.html';
      return;
    }

    const auth = firebase.auth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      window.location.href = 'login.html';
      return;
    }

    // Check if user has profile in Firestore (prevent zombie users)
    if (typeof checkUserHasProfile === 'function') {
      checkUserHasProfile(currentUser.uid).then(function(result) {
        if (result.hasProfile) {
          window.location.href = 'new-post2.html';
        } else {
          // Zombie user - redirect to complete profile
          window.location.href = 'sign-up.html';
        }
      }).catch(function(error) {
        console.error('Profile check failed:', error);
        window.location.href = 'login.html';
      });
    } else {
      // Fallback: no profile check available
      window.location.href = 'new-post2.html';
    }
  }, 50);

  return false;
}

function attachPostButtonHandler() {
  const postBtn = document.getElementById('postBtn');
  if (!postBtn || postBtn.dataset.postBound === 'true') return;
  if (!postBtn.getAttribute('onclick')) {
    postBtn.addEventListener('click', handlePostButtonClick);
  }
  postBtn.dataset.postBound = 'true';
}

window.handlePostButtonClick = handlePostButtonClick;
normalizeHeaderButtons();
attachPostButtonHandler();
// Service Menu Overlay
const serviceMenuBtn = document.getElementById('jobcatServiceMenuBtn');
const serviceMenuOverlay = document.getElementById('jobcatServiceMenuOverlay');

serviceMenuBtn.addEventListener('click', () => {
  serviceMenuOverlay.classList.toggle('show');
  
  // Auto-resize text when overlay is shown
  setTimeout(() => {
    if (serviceMenuOverlay.classList.contains('show')) {
      autoResizeJobcatOverlay();
    }
  }, 50);
});

// Close service menu when clicking outside
document.addEventListener('click', (e) => {
  if (!serviceMenuBtn.contains(e.target) && !serviceMenuOverlay.contains(e.target)) {
    serviceMenuOverlay.classList.remove('show');
  }
});

// Mobile Menu Overlay
const menuBtn = document.querySelector('.jobcat-menu-btn');
const menuOverlay = document.getElementById('jobcatMenuOverlay');

menuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  menuOverlay.classList.add('show');
});

menuOverlay.addEventListener('click', function(e) {
  if (e.target === menuOverlay) {
    menuOverlay.classList.remove('show');
  }
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    menuOverlay.classList.remove('show');
  }
});

// Dynamic region, city, and pay type selection
const regions = ["CEBU", "BOHOL", "LEYTE", "MASBATE", "NEGROS", "PANAY", "SAMAR", "DAVAO", "MANILA"];
const citiesByRegion = {
  "CEBU": [
    "Alcantara", "Alcoy", "Alegria", "Aloguinsan", "Argao", "Asturias", "Badian", "Balamban", "Bantayan", "Barili", "Bogo", "Boljoon", "Borbon", "Carcar", "Carmen", "Catmon", "CEBU CITY", "Compostela", "Consolacion", "Cordova", "Daanbantayan", "Dalaguete", "Danao", "Dumanjug", "Ginatilan", "Lapu-Lapu", "Liloan", "Madridejos", "Malabuyoc", "Mandaue", "Medellin", "Minglanilla", "Moalboal", "Naga City", "Oslob", "Pilar", "Pinamungajan", "Poro", "Ronda", "Samboan", "SanFernando", "San Francisco", "San Remigio", "Santa Fe", "Santander", "Sibonga", "Sogod", "Tabogon", "Tabuelan", "Talisay", "Toledo City", "Tuburan", "Tudela"
  ],
  "LEYTE": [
    "Tacloban City", "Ormoc City", "Baybay City", "Abuyog", "Alangalang", "Albuera", "Babatngon", "Barugo", "Bato", "Burauen", "Calubian", "Capoocan", "Carigara", "Dagami", "Dulag", "Hilongos", "Hindang", "Inopacan", "Isabel", "Jaro", "Javier", "Julita", "Kananga", "La Paz", "Leyte", "MacArthur", "Mahaplag", "Matag-ob", "Matalom", "Mayorga", "Merida", "Palo", "Palompon", "Pastrana", "San Isidro", "San Miguel", "Santa Fe", "Tabango", "Tabontabon", "Tanauan", "Tolosa", "Tunga", "Villaba*", "Maasin City", "Anahawan", "Bontoc", "Hinunangan", "Hinundayan", "Libagon", "Liloan", "Limasawa", "Macrohon", "Malitbog", "Pintuyan", "Saint Bernard", "San Francisco", "San Juan Kabalian", "San Ricardo", "Silago", "Sogod", "Tomas Oppus"
  ],
  "BOHOL": ["Tagbilaran City", "Alburquerque", "Alicia", "Anda", "Antequera", "Baclayon", "Balilihan", "Batuan", "Bien Unido", "Bilar", "Buenavista", "Calape", "Candijay", "Carmen", "Catigbian", "Clarin", "Corella", "Cortes", "Dagohoy", "Danao", "Dauis", "Dimiao", "Duero", "Garcia Hernandez", "Guindulman", "Inabanga", "Jagna", "Jetafe", "Lila", "Loay", "Loboc", "Loon", "Mabini", "Maribojoc", "Panglao", "Pilar", "Pres. Carlos P. Garcia", "Sagbayan", "San Isidro", "San Miguel", "Sevilla", "Sierra Bullones", "Sikatuna", "Talibon", "Trinidad", "Tubigon", "Ubay", "Valencia"],
  "MASBATE": ["Masbate City", "Aroroy", "Baleno", "Balud", "Batuan", "Cataingan", "Cawayan", "Claveria", "Dimasalang", "Esperanza", "Mandaon", "Milagros", "Mobo", "Monreal", "Palanas", "Pio V. Corpuz", "Placer", "San Fernando", "San Jacinto", "San Pascual", "Uson"],
  "NEGROS": ["Bacolod City", "Bago City", "Binalbagan", "Cadiz City", "Calatrava", "Cauayan", "Enrique B. Magalona", "Escalante City", "Himamaylan City", "Hinigaran", "Hinoba-an", "Ilog", "Isabela", "Kabankalan City", "La Carlota City", "La Castellana", "Manapla", "Moises Padilla", "Murcia", "Pontevedra", "Pulupandan", "Sagay City", "Salvador Benedicto", "San Carlos City", "San Enrique", "Silay City", "Sipalay City", "Talisay City", "Toboso", "Valladolid", "Victorias City"],
  "PANAY": [
    // AKLAN (17 municipalities)
    "Altavas", "Balete", "Banga", "Batan", "Buruanga", "Ibajay", "Kalibo", "Lezo", "Libacao", "Madalag", "Makato", "Malay", "Malinao", "Nabas", "New Washington", "Numancia", "Tangalan",
    // ANTIQUE (18 municipalities)
    "Anini-y", "Barbaza", "Belison", "Bugasong", "Caluya", "Culasi", "Hamtic", "Laua-an", "Libertad", "Pandan", "Patnongon", "San Jose de Buenavista", "San Remigio", "Sebaste", "Sibalom", "Tibiao", "Tobias Fornier", "Valderrama",
    // CAPIZ (16 municipalities + 1 city)
    "Cuartero", "Dao", "Dumalag", "Dumarao", "Ivisan", "Jamindan", "Maayon", "Mambusao", "Panay", "Panitan", "Pilar", "Pontevedra", "President Roxas", "Roxas City", "Sapian", "Sigma", "Tapaz",
    // ILOILO (42 municipalities + 2 cities)
    "Ajuy", "Alimodian", "Anilao", "Badiangan", "Balasan", "Banate", "Barotac Nuevo", "Barotac Viejo", "Batad", "Bingawan", "Cabatuan", "Calinog", "Carles", "Concepcion", "Dingle", "Dueñas", "Dumangas", "Estancia", "Guimbal", "Igbaras", "Iloilo City", "Janiuay", "Lambunao", "Leganes", "Lemery", "Leon", "Maasin", "Miagao", "Mina", "New Lucena", "Oton", "Passi City", "Pavia", "Pototan", "San Dionisio", "San Enrique", "San Joaquin", "San Miguel", "San Rafael", "Santa Barbara", "Sara", "Tigbauan", "Tubungan", "Zarraga",
    // GUIMARAS (5 municipalities)
    "Buenavista", "Jordan", "Nueva Valencia", "San Lorenzo", "Sibunag"
  ],
  "SAMAR": [
    // 2 Component Cities
    "Catbalogan City", "Calbayog City",
    // 24 Municipalities
    "Almagro", "Basey", "Calbiga", "Daram", "Gandara", "Hinabangan", "Jiabong", "Marabut", "Matuguinao", "Motiong", "Pagsanghan", "Paranas", "Pinabacdao", "San Jorge", "San Jose de Buan", "San Sebastian", "Santa Margarita", "Santa Rita", "Santo Niño", "Tagapul-an", "Talalora", "Tarangnan", "Villareal", "Zumarraga"
  ],
  "DAVAO": [
    // 6 Cities (1 HUC + 5 Component Cities)
    "Davao City", "Digos City", "Mati City", "Panabo City", "Samal City", "Tagum City",
    // 43 Municipalities from all 5 provinces
    // Davao de Oro (11 municipalities)
    "Compostela", "Laak", "Mabini", "Maco", "Maragusan", "Mawab", "Monkayo", "Montevista", "Nabunturan", "New Bataan", "Pantukan",
    // Davao del Norte (8 municipalities)  
    "Asuncion", "Braulio E. Dujali", "Carmen", "Kapalong", "New Corella", "San Isidro", "Santo Tomas", "Talaingod",
    // Davao del Sur (9 municipalities)
    "Bansalan", "Don Marcelino", "Hagonoy", "Jose Abad Santos", "Kiblawan", "Magsaysay", "Malalag", "Malita", "Matanao",
    // Davao Occidental (5 municipalities)
    "Don Marcelino", "Jose Abad Santos", "Malita", "Santa Maria", "Sulop",
    // Davao Oriental (10 municipalities)
    "Baganga", "Banaybanay", "Boston", "Caraga", "Cateel", "Governor Generoso", "Lupon", "Manay", "San Isidro", "Tarragona"
  ],
  "MANILA": ["Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig", "Pateros", "San Juan", "Taguig", "Valenzuela"]
};
const payTypes = ["PAY TYPE", "PER HOUR", "PER JOB"];
let activeRegion = "CEBU";
let activeCity = "CEBU CITY";
let activePay = "PAY TYPE";

function renderRegionMenu() {
  const list = document.getElementById('regionMenuList');
  if (!list) return; // V2 gaming filter mode
  list.innerHTML = '';
  // Top item with arrow
  const top = document.createElement('li');
  top.textContent = activeRegion;
  top.className = 'active';
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.innerHTML = '&#9650;';
  top.appendChild(arrow);
  list.appendChild(top);
  // Other regions
  regions.filter(r => r !== activeRegion).forEach(region => {
    const li = document.createElement('li');
    li.textContent = region;
    if (region === activeRegion) li.className = 'active';
    list.appendChild(li);
  });
}

function renderCityMenu() {
  const list = document.getElementById('cityMenuList');
  if (!list) return; // V2 gaming filter mode
  list.innerHTML = '';
  const cities = citiesByRegion[activeRegion] || [];
  // Top item with arrow
  const top = document.createElement('li');
  top.textContent = activeCity;
  top.className = 'active';
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.innerHTML = '&#9650;';
  top.appendChild(arrow);
  list.appendChild(top);
  // Other cities
  cities.filter(c => c !== activeCity).forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    if (city === activeCity) li.className = 'active';
    list.appendChild(li);
  });
  // Dynamically set overlay width to fit longest city name
  setTimeout(() => {
    const overlay = document.getElementById('cityMenuOverlay');
    let maxWidth = 0;
    list.querySelectorAll('li').forEach(li => {
      // Create a temporary span to measure width
      const span = document.createElement('span');
      span.style.visibility = 'hidden';
      span.style.position = 'absolute';
      span.style.fontSize = window.getComputedStyle(li).fontSize;
      span.style.fontFamily = window.getComputedStyle(li).fontFamily;
      span.style.fontWeight = window.getComputedStyle(li).fontWeight;
      span.textContent = li.textContent.replace('▲', '').trim();
      document.body.appendChild(span);
      maxWidth = Math.max(maxWidth, span.offsetWidth);
      document.body.removeChild(span);
    });
    // Add padding (20px left+right)
    overlay.style.width = (maxWidth + 28) + 'px';
  }, 0);
}

function renderPayMenu() {
  const list = document.getElementById('payMenuList');
  if (!list) return; // V2 gaming filter mode
  list.innerHTML = '';
  // Top item with arrow
  const top = document.createElement('li');
  top.textContent = activePay;
  top.className = 'active';
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.innerHTML = '&#9650;';
  top.appendChild(arrow);
  list.appendChild(top);
  // Other pay types (always show all except the active one at the top)
  payTypes.filter(p => p !== activePay).forEach(pay => {
    const li = document.createElement('li');
    li.textContent = pay;
    if (pay === activePay) li.className = 'active';
    list.appendChild(li);
  });
}

// Initial render
renderRegionMenu();
renderCityMenu();
renderPayMenu();
// Update label (V1 only)
const regionLabel = document.getElementById('regionMenuLabel');
const cityLabel = document.getElementById('cityMenuLabel');
const payLabel = document.getElementById('payMenuLabel');
if (regionLabel) regionLabel.textContent = activeRegion;
if (cityLabel) cityLabel.textContent = activeCity;
if (payLabel) payLabel.textContent = activePay;
if (typeof updateCityMenuLabelFontSize === 'function') {
  setTimeout(updateCityMenuLabelFontSize, 0);
}

// ========================================
// OLD FUNCTION - DISABLED (No longer needed with gaming filter)
// ========================================
/*
function closeAllDropdowns() {
  document.getElementById('regionMenuOverlay').classList.remove('show');
  document.getElementById('cityMenuOverlay').classList.remove('show');
  document.getElementById('payMenuOverlay').classList.remove('show');
  regionMenuOpen = false;
  cityMenuOpen = false;
  payMenuOpen = false;
}
*/

// ========================================
// OLD REGION/CITY PICKER CODE - DISABLED (Gaming Filter Now Handles This)
// ========================================
// This old code conflicts with the new gaming filter panel system
// All listing pages now use the gaming filter panel (added at end of file)
// Keeping this commented out in case we need to revert
/*
const regionMenuBtn = document.getElementById('locationRegion');
const regionMenuOverlay = document.getElementById('regionMenuOverlay');
const regionPickerModal = document.getElementById('regionPickerOverlay');
const regionPickerList = document.getElementById('regionPickerList');
const regionPickerCloseBtn = document.getElementById('regionPickerCloseBtn');
let regionMenuOpen = false;

function populateRegionPicker() {
  regionPickerList.innerHTML = '';
  regions.forEach(region => {
    const item = document.createElement('div');
    item.className = 'region-picker-item';
    if (region === activeRegion) {
      item.classList.add('active');
    }
    item.textContent = region;
    regionPickerList.appendChild(item);
  });
}

if (regionMenuBtn) {
  regionMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeAllDropdowns();
    populateRegionPicker();
    regionPickerModal.style.display = 'flex';
  });
}

function closeRegionPicker() {
  regionPickerModal.style.display = 'none';
}

regionPickerCloseBtn.addEventListener('click', closeRegionPicker);

regionPickerModal.addEventListener('click', function(e) {
  if (e.target === regionPickerModal) {
    closeRegionPicker();
  }
});

regionPickerList.addEventListener('click', function(e) {
  if (e.target.classList.contains('region-picker-item')) {
    activeRegion = e.target.textContent.trim();
    document.getElementById('regionMenuLabel').textContent = activeRegion;
    const cities = citiesByRegion[activeRegion] || [];
    activeCity = cities[0] || '';
    document.getElementById('cityMenuLabel').textContent = activeCity;
    setTimeout(updateCityMenuLabelFontSize, 0);
    renderRegionMenu();
    renderCityMenu();
    closeRegionPicker();
    filterAndSortJobs();
  }
});

document.addEventListener('click', function(e) {
  if (regionMenuOpen && !regionMenuBtn.contains(e.target) && !regionMenuOverlay.contains(e.target)) {
    regionMenuOverlay.classList.remove('show');
    regionMenuOpen = false;
  }
});

if (regionMenuOverlay) {
  regionMenuOverlay.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
      activeRegion = e.target.textContent.replace(/▲/, '').trim();
      const regionLabel = document.getElementById('regionMenuLabel');
      if (regionLabel) regionLabel.textContent = activeRegion;
      const cities = citiesByRegion[activeRegion] || [];
      activeCity = cities[0] || '';
      const cityLabel = document.getElementById('cityMenuLabel');
      if (cityLabel) cityLabel.textContent = activeCity;
      if (typeof updateCityMenuLabelFontSize === 'function') {
        setTimeout(updateCityMenuLabelFontSize, 0);
      }
      renderRegionMenu();
      renderCityMenu();
      regionMenuOverlay.classList.remove('show');
      regionMenuOpen = false;
      filterAndSortJobs();
    }
  });
}
*/ 
// END OLD CODE

// City menu overlay logic - UPDATED TO USE CENTERED MODAL
// ========================================
// OLD CITY & PAY PICKER CODE - DISABLED (Gaming Filter Now Handles This)
// ========================================
/*
const cityMenuBtn = document.getElementById('locationCity');
const cityMenuOverlay = document.getElementById('cityMenuOverlay');
const cityPickerModal = document.getElementById('cityPickerOverlay');
const cityPickerList = document.getElementById('cityPickerList');
const cityPickerCloseBtn = document.getElementById('cityPickerCloseBtn');
let cityMenuOpen = false;

function populateCityPicker() {
  cityPickerList.innerHTML = '';
  const cities = citiesByRegion[activeRegion] || [];
  cities.forEach(city => {
    const item = document.createElement('div');
    item.className = 'city-picker-item';
    if (city === activeCity) {
      item.classList.add('active');
    }
    item.textContent = city;
    cityPickerList.appendChild(item);
  });
}

if (cityMenuBtn) {
  cityMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeAllDropdowns();
    populateCityPicker();
    cityPickerModal.style.display = 'flex';
  });
}

function closeCityPicker() {
  cityPickerModal.style.display = 'none';
}

cityPickerCloseBtn.addEventListener('click', closeCityPicker);

cityPickerModal.addEventListener('click', function(e) {
  if (e.target === cityPickerModal) {
    closeCityPicker();
  }
});

cityPickerList.addEventListener('click', function(e) {
  if (e.target.classList.contains('city-picker-item')) {
    activeCity = e.target.textContent.trim();
    document.getElementById('cityMenuLabel').textContent = activeCity;
    setTimeout(updateCityMenuLabelFontSize, 0);
    renderCityMenu();
    closeCityPicker();
    filterAndSortJobs();
  }
});

document.addEventListener('click', function(e) {
  if (cityMenuOpen && !cityMenuBtn.contains(e.target) && !cityMenuOverlay.contains(e.target)) {
    cityMenuOverlay.classList.remove('show');
    cityMenuOpen = false;
  }
});

if (cityMenuOverlay) {
  cityMenuOverlay.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
      activeCity = e.target.textContent.replace(/▲/, '').trim();
      const cityLabel = document.getElementById('cityMenuLabel');
      if (cityLabel) cityLabel.textContent = activeCity;
      if (typeof updateCityMenuLabelFontSize === 'function') {
        setTimeout(updateCityMenuLabelFontSize, 0);
      }
      renderCityMenu();
      cityMenuOverlay.classList.remove('show');
      cityMenuOpen = false;
    }
  });
}

const payMenuBtn = document.getElementById('payMenu');
const payMenuOverlay = document.getElementById('payMenuOverlay');
const payPickerModal = document.getElementById('payPickerOverlay');
const payPickerList = document.getElementById('payPickerList');
const payPickerCloseBtn = document.getElementById('payPickerCloseBtn');
let payMenuOpen = false;

function populatePayPicker() {
  payPickerList.innerHTML = '';
  payTypes.forEach(payType => {
    const item = document.createElement('div');
    item.className = 'pay-picker-item';
    if (payType === activePay) {
      item.classList.add('active');
    }
    item.textContent = payType;
    payPickerList.appendChild(item);
  });
}

if (payMenuBtn) {
  payMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    closeAllDropdowns();
    populatePayPicker();
    payPickerModal.style.display = 'flex';
  });
}

function closePayPicker() {
  payPickerModal.style.display = 'none';
}

payPickerCloseBtn.addEventListener('click', closePayPicker);

payPickerModal.addEventListener('click', function(e) {
  if (e.target === payPickerModal) {
    closePayPicker();
  }
});

payPickerList.addEventListener('click', function(e) {
  if (e.target.classList.contains('pay-picker-item')) {
    activePay = e.target.textContent.trim();
    document.getElementById('payMenuLabel').textContent = activePay;
    renderPayMenu();
    closePayPicker();
    filterAndSortJobs();
  }
});

document.addEventListener('click', function(e) {
  if (payMenuOpen && !payMenuBtn.contains(e.target) && !payMenuOverlay.contains(e.target)) {
    payMenuOverlay.classList.remove('show');
    payMenuOpen = false;
  }
});

if (payMenuOverlay) {
  payMenuOverlay.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
      activePay = e.target.textContent.replace(/▲/, '').trim();
      const payLabel = document.getElementById('payMenuLabel');
      if (payLabel) payLabel.textContent = activePay;
      renderPayMenu();
      payMenuOverlay.classList.remove('show');
      payMenuOpen = false;
      filterAndSortJobs();
    }
  });
}

function updateCityMenuLabelFontSize() {
  const label = document.getElementById('cityMenuLabel');
  const btn = document.getElementById('locationCity');
  if (!label || !btn) return;
  const computed = window.getComputedStyle(label);
  let defaultFontSize = parseFloat(computed.fontSize);
  let fontSize = defaultFontSize;
  label.style.fontSize = fontSize + 'px';
  while (label.scrollWidth > btn.clientWidth - 32 && fontSize > 12) {
    fontSize -= 1;
    label.style.fontSize = fontSize + 'px';
  }
}

window.addEventListener('resize', updateCityMenuLabelFontSize);
*/ 
// END OLD CODE

// Helper function to parse job date and time into comparable timestamp
function parseJobDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  
  try {
    let dateObj;
    
    // Handle different date formats:
    // 1. ISO format: "2026-01-10" (from localStorage)
    // 2. Display format with year: "Jan 10, 2026" (from normalized Firebase)
    // 3. Old format: "Jun 11" (backward compatibility)
    
    if (dateStr.includes('-') && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      // ISO format: "2026-01-10"
      dateObj = new Date(dateStr);
    } else if (dateStr.includes(',')) {
      // Display format: "Jan 10, 2026"
      dateObj = new Date(dateStr);
    } else {
      // Old format: "Jun 11" - add current year
      const currentYear = new Date().getFullYear();
      dateObj = new Date(`${dateStr} ${currentYear}`);
    }
    
    // Check if date parsing failed
    if (isNaN(dateObj.getTime())) {
      console.warn('Date parsing failed for:', dateStr);
      return null;
    }
    
    // Parse start time from strings like "10AM - 12PM" or "8 AM - 10 AM"
    const timeMatch = timeStr.match(/(\d+)\s*(AM|PM)/i);
    if (!timeMatch) {
      return dateObj.getTime();
    }
    
    const hour = parseInt(timeMatch[1]);
    const isPM = timeMatch[2].toUpperCase() === 'PM';
    
    // Convert to 24-hour format
    let hour24 = hour;
    if (isPM && hour !== 12) hour24 += 12;
    if (!isPM && hour === 12) hour24 = 0;
    
    dateObj.setHours(hour24, 0, 0, 0);
    return dateObj.getTime();
  } catch (e) {
    console.warn('Error parsing date/time:', dateStr, timeStr, e);
    return null;
  }
}

// Helper function to parse job end time from time string
function parseJobEndTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  
  try {
    let dateObj;
    
    // Handle different date formats (same as parseJobDateTime)
    if (dateStr.includes('-') && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      // ISO format: "2026-01-10"
      dateObj = new Date(dateStr);
    } else if (dateStr.includes(',')) {
      // Display format: "Jan 10, 2026"
      dateObj = new Date(dateStr);
    } else {
      // Old format: "Jun 11" - add current year
      const currentYear = new Date().getFullYear();
      dateObj = new Date(`${dateStr} ${currentYear}`);
    }
    
    // Check if date parsing failed
    if (isNaN(dateObj.getTime())) {
      console.warn('Date parsing failed for end time:', dateStr);
      return null;
    }
    
    // Parse end time from strings like "10AM - 12PM" or "8 AM - 10 AM"
    // Look for the time after the dash
    const endTimeMatch = timeStr.match(/-\s*(\d+)\s*(AM|PM)/i);
    if (!endTimeMatch) {
      return null;
    }
    
    const hour = parseInt(endTimeMatch[1]);
    const isPM = endTimeMatch[2].toUpperCase() === 'PM';
    
    // Convert to 24-hour format
    let hour24 = hour;
    if (isPM && hour !== 12) hour24 += 12;
    if (!isPM && hour === 12) hour24 = 0;
    
    dateObj.setHours(hour24, 0, 0, 0);
    return dateObj.getTime();
  } catch (e) {
    console.warn('Error parsing end date/time:', dateStr, timeStr, e);
    return null;
  }
}

// Ensure there is a shared empty-state placeholder on listing pages
function ensureListingEmptyState(headerSpacer) {
  if (!headerSpacer || !headerSpacer.parentNode) return null;
  let emptyState = document.getElementById('listingEmptyState');
  if (emptyState) return emptyState;

  emptyState = document.createElement('div');
  emptyState.id = 'listingEmptyState';
  emptyState.className = 'listing-empty-state';
  emptyState.innerHTML = `
    <img class="listing-empty-graphic" src="public/images/Gisugo-emblem.png" alt="GISUGO logo">
    <div class="listing-empty-title">NO GIGS YET</div>
    <div class="listing-empty-subtitle">Be the first to Post<br>Or check again Later</div>
  `;

  headerSpacer.parentNode.insertBefore(emptyState, headerSpacer.nextSibling);
  return emptyState;
}

function setListingEmptyStateVisible(isVisible, headerSpacer) {
  const emptyState = ensureListingEmptyState(headerSpacer);
  if (!emptyState) return;
  emptyState.classList.toggle('is-visible', isVisible);
}

// Filter and sort jobs based on selected criteria
async function filterAndSortJobs() {
  const currentCategory = getCurrentCategory();
  const headerSpacer = document.querySelector('.jobcat-header-spacer');
  
  if (!headerSpacer) {
    console.error('Header spacer not found');
    return;
  }
  
  // Hide empty state while loading new results
  setListingEmptyStateVisible(false, headerSpacer);

  // Show loading modal
  const loadingOverlay = document.getElementById('loadingOverlay');
  if (loadingOverlay) {
    loadingOverlay.classList.add('show');
  }
  
  // ⚠️ CRITICAL: Wrap everything in try-finally to ensure loading hides
  try {
  
  // Clear existing job cards
  const existingCards = document.querySelectorAll('.job-preview-card');
  existingCards.forEach(card => card.remove());
  
  // ============================================================================
  // 🔥 FIREBASE INTEGRATED - DATA FETCHING
  // ============================================================================
  // Attempts to load from Firebase first, falls back to localStorage if offline
  
  let categoryCards = [];
  
  // Helper function to normalize Firebase data to UI format
  function _normalizeFirebaseJob(firebaseJob) {
    // Parse full date with year
    const date = firebaseJob.scheduledDate ? 
      (firebaseJob.scheduledDate.toDate ? firebaseJob.scheduledDate.toDate() : new Date(firebaseJob.scheduledDate)) 
      : null;
    
    // Format for display (with year for clarity)
    const formattedDate = date ? 
      date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 
      'TBD';
    
    // Format time
    const timeDisplay = `${firebaseJob.startTime || 'TBD'} - ${firebaseJob.endTime || 'TBD'}`;
    return {
      id: firebaseJob.id,
      jobNumber: firebaseJob.id,  // Use document ID, not jobId field
      category: firebaseJob.category,
      title: firebaseJob.title,
      photo: firebaseJob.thumbnail || 'public/images/placeholder.jpg',
      extra1: firebaseJob.extras?.[0] || '',
      extra2: firebaseJob.extras?.[1] || '',
      price: `₱${firebaseJob.priceOffer || '0'}`,
      rate: firebaseJob.paymentType,
      date: formattedDate,
      time: timeDisplay,
      region: firebaseJob.region,
      city: firebaseJob.city,
      status: firebaseJob.status,
      templateUrl: firebaseJob.jobPageUrl || `dynamic-job.html?category=${firebaseJob.category}&jobNumber=${firebaseJob.id}`,  // Use document ID
      createdAt: firebaseJob.datePosted?.toDate?.()?.toISOString() || new Date().toISOString(),
      // Store full date object for sorting and expiration checking
      fullDate: date,
      scheduledTimestamp: date ? date.getTime() : 0
    };
  }

  // Try Firebase first if available AND dev mode is OFF
  const shouldUseFirebase = typeof APP_CONFIG !== 'undefined' 
    ? APP_CONFIG.useFirebaseData() 
    : (!localStorage.getItem('gisugo_dev_mode') || localStorage.getItem('gisugo_dev_mode') === 'false');
  
  if (shouldUseFirebase && typeof getJobsByCategory === 'function' && typeof isFirebaseOnline === 'function' && isFirebaseOnline()) {
    try {
      console.log('🔥 Loading jobs from Firebase for category:', currentCategory);
      
      const filters = {
        region: activeRegion,
        payType: activePay !== 'PAY TYPE' ? activePay : null
      };
      
      const rawJobs = await getJobsByCategory(currentCategory, filters);
      categoryCards = rawJobs.map(job => _normalizeFirebaseJob(job));
      console.log(`✅ Firebase: Found ${categoryCards.length} jobs (normalized for UI)`);
      
      // Filter out expired gigs (past end time)
      const now = new Date().getTime();
      const beforeFilter = categoryCards.length;
      categoryCards = categoryCards.filter(job => {
        if (!job.fullDate) return true; // Keep jobs without dates (TBD)
        
        // Parse end time to get full expiration timestamp
        const endTime = parseJobEndTime(job.date, job.time);
        
        // If no end time, use start of day after job date as expiration
        const expirationTime = endTime || (job.scheduledTimestamp + (24 * 60 * 60 * 1000));
        
        return expirationTime >= now; // Only show future or current gigs
      });
      console.log(`🗑️  Filtered out ${beforeFilter - categoryCards.length} expired gigs`);
      
    } catch (error) {
      console.error('❌ Firebase error, falling back to localStorage:', error);
      // Fall through to localStorage below
    }
  }
  
  // Fallback to localStorage if Firebase didn't return data OR dev mode is ON
  if (categoryCards.length === 0) {
    const devMode = typeof APP_CONFIG !== 'undefined' ? APP_CONFIG.devMode : (localStorage.getItem('gisugo_dev_mode') === 'true');
    if (devMode) {
      console.log('🎮 Dev Mode ON - Loading mock jobs from localStorage');
    } else {
      console.log('📦 Loading jobs from localStorage (Firebase returned no data)');
    }
    const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
    categoryCards = previewCards[currentCategory] || [];
    
    // Filter out expired gigs from localStorage too
    const now = new Date().getTime();
    const beforeFilter = categoryCards.length;
    categoryCards = categoryCards.filter(job => {
      if (!job.date || job.date === 'TBD') return true; // Keep jobs without dates
      
      // Parse end time to get full expiration timestamp
      const endTime = parseJobEndTime(job.date, job.time);
      
      // If we have end time, use it; otherwise use start time
      const expirationTime = endTime || parseJobDateTime(job.date, job.time);
      
      if (!expirationTime) return true; // Keep if we can't parse
      
      return expirationTime >= now; // Only show future or current gigs
    });
    
    if (beforeFilter > categoryCards.length) {
      console.log(`🗑️  Filtered out ${beforeFilter - categoryCards.length} expired gigs from localStorage`);
    }
  }
  
  // ============================================================================
  // ✅ FIREBASE-READY - FILTERING LOGIC (Keep this section as-is)
  // ============================================================================
  // This filtering logic will work with both mock data and Firebase data.
  // If you add region filter to Firebase query above, you can remove the region filter here.
  // Pay type filter should stay here unless you create a compound index in Firestore.
  
  // Filter jobs based on selected region and pay type
  let filteredJobs = categoryCards;
  
  // Filter by region (client-side - remove this if region is in Firebase query)
  filteredJobs = filteredJobs.filter(job => {
    // If no region data in job, include it (for backwards compatibility)
    if (!job.region) return true;
    return job.region === activeRegion;
  });
  
  // Filter by pay type (keep this client-side for Firebase to avoid compound index complexity)
  if (activePay !== 'PAY TYPE') {
    filteredJobs = filteredJobs.filter(job => {
      const jobRate = (job.rate || '').toUpperCase();
      const filterRate = activePay.toUpperCase();
      return jobRate === filterRate;
    });
  }
  
  // ============================================================================
  // ✅ FIREBASE-READY - SORTING LOGIC (Keep this section as-is)
  // ============================================================================
  // This sorting logic works with both mock data and Firebase data.
  // You could optionally move sorting to Firebase with orderBy(), but client-side
  // sorting gives you more flexibility for complex multi-field sorting.
  
  // Sort jobs by earliest job schedule date/time, then by earliest end time
  filteredJobs.sort((a, b) => {
    // Convert job date and time to comparable format
    const dateTimeA = parseJobDateTime(a.date, a.time);
    const dateTimeB = parseJobDateTime(b.date, b.time);
    
    // Sort by earliest job date/time first
    if (dateTimeA && dateTimeB) {
      const timeDiff = dateTimeA - dateTimeB;
      
      // If start times are the same, sort by end time (earliest end time first)
      if (timeDiff === 0) {
        const endTimeA = parseJobEndTime(a.date, a.time);
        const endTimeB = parseJobEndTime(b.date, b.time);
        
        if (endTimeA && endTimeB) {
          return endTimeA - endTimeB; // Earliest end time first
        }
      }
      
      return timeDiff; // Earliest start time first
    }
    
    // Fallback: if date parsing fails, sort by creation time
    const createdA = new Date(a.createdAt || 0).getTime();
    const createdB = new Date(b.createdAt || 0).getTime();
    return createdB - createdA; // Newest created first
  });
  
  
  // ============================================================================
  // ✅ FIREBASE-READY - RENDERING LOGIC (Keep this section as-is)
  // ============================================================================
  // This rendering logic works perfectly with both mock data and Firebase data.
  // No changes needed during Firebase migration.
  
  // Create and insert filtered job cards in reverse order to get correct display order
  let previousPayType = null;
  let consecutiveCount = 0;
  
  filteredJobs.reverse().forEach((cardData) => {
    const currentPayType = cardData.rate || 'Per Hour';
    
    // Track consecutive cards of same pay type for subtle variations
    if (currentPayType === previousPayType) {
      consecutiveCount++;
    } else {
      consecutiveCount = 0;
      previousPayType = currentPayType;
    }
    
    const jobCard = createJobPreviewCard(cardData, currentPayType, consecutiveCount);
    headerSpacer.parentNode.insertBefore(jobCard, headerSpacer.nextSibling);
  });

  // Show empty state when no gigs are available
  setListingEmptyStateVisible(filteredJobs.length === 0, headerSpacer);
  
  // Apply truncation after cards are loaded
  const truncateTimer = setTimeout(truncateBarangayNames, 50);
  if (window._listingCleanup) {
    window._listingCleanup.registerTimer(truncateTimer);
  }
  
  } catch (unexpectedError) {
    // ⚠️ CRITICAL: Catch any unexpected errors
    console.error('❌ Unexpected error in filterAndSortJobs:', unexpectedError);
    // Show error state to user
    const headerSpacer = document.querySelector('.header-spacer');
    if (headerSpacer) {
      setListingEmptyStateVisible(true, headerSpacer);
      const emptyState = document.getElementById('listingEmptyState');
      if (emptyState) {
        emptyState.innerHTML = `
          <div class="empty-state-icon">❌</div>
          <div class="empty-state-text">Failed to load jobs. Please refresh the page.</div>
        `;
      }
    }
  } finally {
    // ⚠️ CRITICAL: ALWAYS hide loading modal, even if errors occur
    if (loadingOverlay) {
      loadingOverlay.classList.remove('show');
      console.log('✅ Loading overlay hidden');
    }
  }
}

// Function to truncate barangay names in job preview cards to prevent layout issues on small screens
function truncateBarangayNames() {
  const maxLength = 10;
  
  // Find all job preview extra elements
  const extraElements = document.querySelectorAll('.job-preview-extra1, .job-preview-extra2');
  
  extraElements.forEach(element => {
    // Get the span (label) and the text content after it
    const span = element.querySelector('span');
    if (span) {
      // Get all text content after the span
      let textAfterSpan = '';
      let node = span.nextSibling;
      
      while (node) {
        if (node.nodeType === Node.TEXT_NODE) {
          textAfterSpan += node.textContent;
        }
        node = node.nextSibling;
      }
      
      // Remove leading/trailing whitespace and extract barangay name
      const cleanText = textAfterSpan.trim();
      
      if (cleanText.length > maxLength) {
        // Truncate without ellipsis
        const truncatedText = cleanText.substring(0, maxLength);
        
        // Remove all text nodes after the span
        node = span.nextSibling;
        while (node) {
          const nextNode = node.nextSibling;
          if (node.nodeType === Node.TEXT_NODE) {
            node.parentNode.removeChild(node);
          }
          node = nextNode;
        }
        
        // Add the truncated text (no ellipsis)
        const textNode = document.createTextNode(' ' + truncatedText);
        span.parentNode.appendChild(textNode);
      }
    }
  });
}

// Call the function when the page loads with multiple triggers for better compatibility
document.addEventListener('DOMContentLoaded', truncateBarangayNames);

// Backup execution after a delay to catch any late-loading content
const backupTruncateTimer = setTimeout(truncateBarangayNames, 100);
if (window._listingCleanup) {
  window._listingCleanup.registerTimer(backupTruncateTimer);
}

// Also call on window load as a final backup
window.addEventListener('load', truncateBarangayNames);

// ========================== JOB PREVIEW CARDS LOADING ==========================

function getCurrentCategory() {
  // Get category from page title or URL
  const title = document.title;
  const categoryMatch = title.match(/(\w+) Service/);
  if (categoryMatch) {
    const category = categoryMatch[1].toLowerCase();
    return category === 'realtor' ? 'planner' : category;
  }
  
  // Fallback: get from URL
  const url = window.location.pathname;
  const filename = url.substring(url.lastIndexOf('/') + 1);
  const category = filename.replace('.html', '');
  return category === 'realtor' ? 'planner' : category;
}

// ============================================================================
// 🔥 FIREBASE DATA STRUCTURE MAPPING
// ============================================================================
// Expected Firestore document structure for gig cards:
// {
//   id: string,                    // Auto-generated Firestore doc ID
//   jobNumber: string,             // Custom job number (e.g., "JOB-HATOD-001")
//   category: string,              // Job category (e.g., "Hatod", "Hakot")
//   title: string,                 // Job title/description
//   photo: string,                 // Image URL (Firebase Storage path)
//   extra1: string,                // "Label: Value" format (e.g., "Location: Cebu City")
//   extra2: string,                // "Label: Value" format (e.g., "Vehicle: Motorcycle")
//   price: string,                 // Payment amount (e.g., "₱500", "₱150")
//   rate: string,                  // Payment rate type (e.g., "Per Job", "Per Hour")
//   date: string,                  // Job date (e.g., "Nov 22", "Dec 5")
//   time: string,                  // Job time (e.g., "10 AM - 12 PM", "2-5 PM")
//   region: string,                // Region (e.g., "CEBU", "MANILA")
//   city: string,                  // City (e.g., "CEBU CITY", "LAPU-LAPU")
//   status: string,                // Job status (e.g., "active", "filled", "expired")
//   postedBy: string,              // User ID who posted the gig
//   postedAt: Timestamp,           // Firebase Timestamp of creation
//   templateUrl: string            // Link to detailed job page
// }
// ============================================================================

function createJobPreviewCard(cardData, payType = 'Per Hour', consecutiveCount = 0) {
  const cardElement = document.createElement('a');
  cardElement.href = cardData.templateUrl || '#';
  
  // ============================================================================
  // 🔥 FIREBASE DATA ATTRIBUTES FOR TRACKING & ANALYTICS
  // ============================================================================
  // These data attributes enable Firebase Analytics tracking, easy DOM queries,
  // and future feature implementations (favorites, saved jobs, etc.)
  // ============================================================================
  cardElement.setAttribute('data-job-id', cardData.id || '');
  cardElement.setAttribute('data-job-number', cardData.jobNumber || '');
  cardElement.setAttribute('data-job-category', cardData.category || '');
  cardElement.setAttribute('data-job-region', cardData.region || '');
  cardElement.setAttribute('data-job-city', cardData.city || '');
  cardElement.setAttribute('data-job-pay-type', cardData.rate || '');
  cardElement.setAttribute('data-job-status', cardData.status || 'active');
  
  // For search functionality - store searchable text
  cardElement.setAttribute('data-job-title', cardData.title || '');
  cardElement.setAttribute('data-job-description', cardData.title || ''); // Can be expanded
  
  // Determine background class based on pay type and consecutive count
  let bgClass;
  if (payType === 'Per Hour') {
    bgClass = consecutiveCount % 2 === 0 ? 'pay-per-hour' : 'pay-per-hour-alt';
  } else {
    bgClass = consecutiveCount % 2 === 0 ? 'pay-per-job' : 'pay-per-job-alt';
  }
  
  cardElement.className = `job-preview-card ${bgClass}`;
  
  // Parse extras to get labels and values
  const extra1Parts = cardData.extra1 ? cardData.extra1.split(':') : ['', ''];
  const extra2Parts = cardData.extra2 ? cardData.extra2.split(':') : ['', ''];
  
  const extra1Label = extra1Parts[0] ? extra1Parts[0].trim() : '';
  const extra1Value = extra1Parts[1] ? extra1Parts[1].trim() : '';
  const extra2Label = extra2Parts[0] ? extra2Parts[0].trim() : '';
  const extra2Value = extra2Parts[1] ? extra2Parts[1].trim() : '';
  
  // Format rate badge text and icon
  const rateIcon = payType === 'Per Hour' ? '⏰' : '💰';
  const rateText = cardData.rate || payType;
  
  // TITLE-FIRST LAYOUT: Title spans full width, content below
  cardElement.innerHTML = `
    <h3 class="card-title">${cardData.title || 'Untitled Job'}</h3>
    <div class="card-body">
      <div class="card-thumbnail">
        <img src="${cardData.photo || 'images/placeholder.jpg'}" alt="${cardData.title || 'Job preview'}" loading="lazy">
    </div>
      <div class="card-content-box">
        <div class="card-top-section">
          <div class="card-extras-column">
            <div class="card-extra">
              <span class="extra-label">${extra1Label}</span>
              <span class="extra-value">${extra1Value}</span>
      </div>
            <div class="card-extra">
              <span class="extra-label">${extra2Label}</span>
              <span class="extra-value">${extra2Value}</span>
    </div>
      </div>
          <div class="payment-amount">${cardData.price || '₱0'}</div>
        </div>
        <div class="card-bottom-row">
          <div class="card-datetime">
            <span class="footer-date">📅 ${cardData.date || 'TBD'}</span>
            <span class="footer-time">⏰ ${cardData.time || 'TBD'}</span>
          </div>
          <div class="payment-badge">${rateIcon} ${rateText}</div>
        </div>
      </div>
    </div>
  `;
  
  
  // ============================================================================
  // 🔥 MEMORY LEAK PREVENTION: Clean card references
  // ============================================================================
  // Store weak reference to enable garbage collection when card is removed
  if (!window._cardRegistry) {
    window._cardRegistry = new WeakMap();
  }
  window._cardRegistry.set(cardElement, {
    id: cardData.id,
    createdAt: Date.now()
  });
  
  return cardElement;
}

// Load job preview cards when page loads
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🔥 Listing page loaded with Firebase integration');
  
  // Apply filtering and sorting - now async for Firebase support
  await filterAndSortJobs();
  
  const truncateTimer = setTimeout(() => {
    truncateBarangayNames();
  }, 50);
  if (window._listingCleanup) {
    window._listingCleanup.registerTimer(truncateTimer);
  }
  
  // Initialize jobcat overlay auto-resize
  initJobcatOverlayAutoResize();
  
  // Initialize jobcat button auto-resize
  initJobcatButtonAutoResize();
});

// Auto-fit resizing function for jobcat overlay text
function autoResizeJobcatOverlay() {
    const overlay = document.querySelector('.jobcat-servicemenu-overlay');
    if (!overlay) return;
    
    const links = overlay.querySelectorAll('a');
    if (links.length === 0) return;
    
    // Get overlay dimensions
    const overlayRect = overlay.getBoundingClientRect();
    const overlayWidth = overlayRect.width;
    const overlayHeight = overlayRect.height;
    
    // Calculate available width based on viewport size
    const paddingBuffer = window.innerWidth <= 360 ? 25 : 30; // Reduced buffer for larger screens
    const availableWidth = overlayWidth - paddingBuffer; 
    const availableHeightPerItem = (overlayHeight - 36) / links.length;
    
    // Set minimum font sizes based on viewport - much more aggressive for larger screens
    let minFontSize;
    let maxFontSize;
    
    if (window.innerWidth <= 320) {
        minFontSize = 23; // Back to what worked fine in Chrome/Samsung
        maxFontSize = Math.min(availableHeightPerItem * 0.8, 25);
    } else if (window.innerWidth <= 360) {
        minFontSize = 25; // Match the size that works well at 361px+
        maxFontSize = Math.min(availableHeightPerItem * 0.8, 27);
    } else if (window.innerWidth <= 412) {
        minFontSize = 26; // Much larger for 361-412px range specifically
        maxFontSize = Math.min(availableHeightPerItem * 0.8, 28);
    } else if (window.innerWidth <= 480) {
        minFontSize = 24; // Still large for 413-480px
        maxFontSize = Math.min(availableHeightPerItem * 0.8, 28);
    } else if (window.innerWidth <= 600) {
        minFontSize = 26; // Even larger for 481-600px
        maxFontSize = Math.min(availableHeightPerItem * 0.8, 30);
    } else {
        minFontSize = 28; // Large readable text for desktop
        maxFontSize = Math.min(availableHeightPerItem * 0.8, 32);
    }
    
    let optimalFontSize = minFontSize;
    
    // Binary search for optimal font size, but don't go below minimum
    let minSize = minFontSize;
    let maxSize = maxFontSize;
    
    while (maxSize - minSize > 0.3) {
        const testSize = (minSize + maxSize) / 2;
        
        // Test if this size fits for all links
        let allFit = true;
        
        for (let link of links) {
            // Create temporary element to measure text width
            const tempSpan = document.createElement('span');
            tempSpan.style.cssText = `
                position: absolute;
                visibility: hidden;
                white-space: nowrap;
                font-size: ${testSize}px;
                font-weight: 700;
                font-family: arial, sans-serif;
                padding: 4px 0 4px 8px;
            `;
            tempSpan.textContent = link.textContent;
            document.body.appendChild(tempSpan);
            
            const textWidth = tempSpan.getBoundingClientRect().width;
            document.body.removeChild(tempSpan);
            
            if (textWidth > availableWidth) {
                allFit = false;
                break;
            }
        }
        
        if (allFit) {
            optimalFontSize = testSize;
            minSize = testSize;
        } else {
            maxSize = testSize;
        }
    }
    
    // Ensure we never go below the minimum readable size
    optimalFontSize = Math.max(optimalFontSize, minFontSize);
    
    // Apply the optimal font size and ensure no truncation
    links.forEach(link => {
        link.style.setProperty('font-size', `${optimalFontSize}px`, 'important');
        link.style.setProperty('line-height', '1.2', 'important');
        // Ensure no truncation occurs
        link.style.setProperty('white-space', 'normal', 'important'); // Allow wrapping if needed
        link.style.setProperty('overflow', 'visible', 'important'); // No hidden overflow
        link.style.setProperty('text-overflow', 'unset', 'important'); // No ellipsis
        link.style.setProperty('word-break', 'break-word', 'important'); // Break long words if necessary
        link.style.setProperty('max-width', 'none', 'important'); // Remove any width constraints
    });
    
    console.log(`Auto-resized jobcat overlay text to ${optimalFontSize}px for viewport ${window.innerWidth}px (min: ${minFontSize}px, available width: ${availableWidth}px)`);
}

// Debounced resize handler
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        autoResizeJobcatOverlay();
    }, 150);
}

// Initialize auto-resize when overlay is shown
function initJobcatOverlayAutoResize() {
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    // Initial resize if overlay is already visible
    const overlay = document.querySelector('.jobcat-servicemenu-overlay');
    if (overlay && overlay.classList.contains('show')) {
        autoResizeJobcatOverlay();
    }
}

// Auto-fit resizing function for jobcat dropdown button text
function autoResizeJobcatButton() {
    const serviceNameDiv = document.querySelector('.jobcat-servicename div:first-child');
    if (!serviceNameDiv) return;
    
    const serviceMenu = document.querySelector('.jobcat-servicemenu');
    if (!serviceMenu) return;
    
    // Get button dimensions
    const buttonRect = serviceMenu.getBoundingClientRect();
    const buttonWidth = buttonRect.width;
    
    // Calculate available width (accounting for dropdown arrow and padding)
    const arrowWidth = 20; // Space for dropdown arrow
    const paddingBuffer = 16; // Left/right padding
    const availableWidth = buttonWidth - arrowWidth - paddingBuffer;
    
    // Set minimum font sizes based on viewport
    let minFontSize;
    let maxFontSize;
    
    if (window.innerWidth <= 320) {
        minFontSize = 16;
        maxFontSize = 24;
    } else if (window.innerWidth <= 360) {
        minFontSize = 18;
        maxFontSize = 26;
    } else if (window.innerWidth <= 480) {
        minFontSize = 20;
        maxFontSize = 28;
    } else {
        minFontSize = 22;
        maxFontSize = 32;
    }
    
    let optimalFontSize = minFontSize;
    
    // Binary search for optimal font size
    let minSize = minFontSize;
    let maxSize = maxFontSize;
    
    while (maxSize - minSize > 0.3) {
        const testSize = (minSize + maxSize) / 2;
        
        // Create temporary element to measure text width
        const tempSpan = document.createElement('span');
        tempSpan.style.cssText = `
            position: absolute;
            visibility: hidden;
            white-space: nowrap;
            font-size: ${testSize}px;
            font-weight: bold;
            font-family: Arial, Helvetica, sans-serif;
        `;
        tempSpan.textContent = serviceNameDiv.textContent;
        document.body.appendChild(tempSpan);
        
        const textWidth = tempSpan.getBoundingClientRect().width;
        document.body.removeChild(tempSpan);
        
        if (textWidth <= availableWidth) {
            optimalFontSize = testSize;
            minSize = testSize;
        } else {
            maxSize = testSize;
        }
    }
    
    // Ensure we never go below the minimum readable size
    optimalFontSize = Math.max(optimalFontSize, minFontSize);
    
    // Apply the optimal font size
    serviceNameDiv.style.setProperty('font-size', `${optimalFontSize}px`, 'important');
    serviceNameDiv.style.setProperty('white-space', 'nowrap', 'important');
    serviceNameDiv.style.setProperty('overflow', 'hidden', 'important');
    
    console.log(`Auto-resized jobcat button text to ${optimalFontSize}px for "${serviceNameDiv.textContent}" at viewport ${window.innerWidth}px`);
}

// Initialize jobcat button auto-resize
function initJobcatButtonAutoResize() {
    // Resize on window resize
    window.addEventListener('resize', () => {
        clearTimeout(window.buttonResizeTimeout);
        window.buttonResizeTimeout = setTimeout(() => {
            autoResizeJobcatButton();
        }, 150);
    });
    
    // Resize when button text changes (when different job categories are selected)
    const observer = new MutationObserver(() => {
        setTimeout(autoResizeJobcatButton, 50);
    });
    
    const serviceNameDiv = document.querySelector('.jobcat-servicename div:first-child');
    if (serviceNameDiv) {
        observer.observe(serviceNameDiv, { childList: true, subtree: true, characterData: true });
        // Initial resize
        setTimeout(autoResizeJobcatButton, 100);
    }
}

// ========================================
// 🎨 HEADER ICONS REPLACEMENT (PNG → EMOJI)
// ========================================
(function() {
  console.log('🎨 Replacing header icons...');
  
  // Map of PNG paths to emoji characters
  const iconMap = {
    'Post.png': '✏️',
    'search.png': '🔍',
    'menu.png': '📋'
  };
  
  // Replace all header button images with emojis
  const headerButtons = document.querySelectorAll('.jobcat-headerbuttons .jobcat-headerbutton');
  headerButtons.forEach(button => {
    const img = button.querySelector('img');
    if (img) {
      const src = img.getAttribute('src');
      const iconName = src.substring(src.lastIndexOf('/') + 1);
      if (iconMap[iconName]) {
        // POST BUTTON: Auth check handled by inline onclick in HTML
        // (No JavaScript listener needed here)
        
        // Replace the icon
        const emojiDiv = document.createElement('div');
        emojiDiv.className = 'jobcat-icon-emoji';
        emojiDiv.textContent = iconMap[iconName];
        img.parentElement.replaceChild(emojiDiv, img);
        console.log('✓ Replaced', iconName, 'with', iconMap[iconName]);
      }
    }
  });
  
  console.log('✅ Header icons replaced');
})();

// ========================================
// 🔍 SEARCH FUNCTIONALITY (SHARED)
// ========================================
(function() {
  console.log('🔍 Search Script Loading...');
  
  // Dynamically create and inject search bar into header
  const headerElement = document.querySelector('.jobcat-header');
  if (headerElement) {
    const searchBarHTML = `
      <div class="search-bar-container" id="searchBarContainer">
        <button class="search-bar-close" id="searchCloseBtn">&times;</button>
        <input type="text" class="search-bar-input" id="searchInput" placeholder="Search jobs..." autocomplete="off">
        <span class="search-bar-icon">🔍</span>
      </div>
    `;
    headerElement.insertAdjacentHTML('beforeend', searchBarHTML);
    console.log('✓ Search bar injected into header');
  } else {
    console.error('❌ Header element not found, search bar not injected');
  }
  
  const searchBtn = document.getElementById('searchBtn');
  const searchBarContainer = document.getElementById('searchBarContainer');
  const searchCloseBtn = document.getElementById('searchCloseBtn');
  const searchInput = document.getElementById('searchInput');
  
  let searchTimeout = null;
  let allJobCards = []; // Will store references to all job preview cards on the page
  
  // Collect all job cards on page load (called after Firebase loads jobs)
  function collectJobCards() {
    // ========================================
    // 🔥 FIREBASE MIGRATION NOTE:
    // Call this function after Firebase populates the job cards
    // Example: After rendering jobs from Firestore, run collectJobCards()
    // ========================================
    allJobCards = Array.from(document.querySelectorAll('.job-card, .job-preview-card, [data-job-id]'));
    console.log('🔍 Collected', allJobCards.length, 'job cards for searching');
  }
  
  // Get current job category from page
  function getCurrentCategory() {
    // Extract from URL filename (e.g., hatod.html → Hatod)
    const path = window.location.pathname;
    const filename = path.split('/').pop().replace('.html', '');
    return filename.charAt(0).toUpperCase() + filename.slice(1);
  }
  
  // Get selected region from gaming filter panel
  function getSelectedRegion() {
    const regionDisplay = document.getElementById('filterDisplayRegion');
    return regionDisplay ? regionDisplay.textContent : 'CEBU';
  }
  
  // Get selected city from gaming filter panel
  function getSelectedCity() {
    const cityDisplay = document.getElementById('filterDisplayCity');
    return cityDisplay ? cityDisplay.textContent : 'CEBU CITY';
  }
  
  // Open search bar
  if (searchBtn && searchBarContainer) {
    searchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      searchBarContainer.classList.add('show');
      collectJobCards(); // Refresh job cards list
      const focusTimer = setTimeout(() => {
        if (searchInput) searchInput.focus();
      }, 400); // Wait for animation
      if (window._listingCleanup) {
        window._listingCleanup.registerTimer(focusTimer);
      }
      console.log('🔍 Search opened for category:', getCurrentCategory(), 'region:', getSelectedRegion());
    });
  }
  
  // Close search bar
  function closeSearch() {
    if (searchBarContainer) {
      searchBarContainer.classList.remove('show');
    }
    if (searchInput) {
      searchInput.value = '';
    }
    // Restore all cards (important!)
    showAllCards();
    console.log('🔍 Search closed, all cards restored');
  }
  
  if (searchCloseBtn) {
    searchCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSearch();
    });
  }
  
  // Close search on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchBarContainer && searchBarContainer.classList.contains('show')) {
      closeSearch();
    }
  });
  
  // Close search when clicking outside the search bar
  document.addEventListener('click', (e) => {
    if (searchBarContainer && searchBarContainer.classList.contains('show')) {
      // Check if click is outside the search bar container and not on the search button
      if (!searchBarContainer.contains(e.target) && !searchBtn.contains(e.target)) {
        closeSearch();
      }
    }
  });
  
  // Search input handler (debounced)
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      // Clear previous timeout
      if (searchTimeout) clearTimeout(searchTimeout);
      
      if (!query) {
        showAllCards();
        return;
      }
      
      // Debounce search by 300ms
      searchTimeout = setTimeout(() => {
        performSearch(query);
      }, 300);
    });
  }
  
  // Show all cards (reset search filter)
  function showAllCards() {
    console.log('🔍 Restoring all', allJobCards.length, 'cards');
    
    // Simple: just show all cards
    allJobCards.forEach(card => {
      card.style.display = '';
    });
    
    // ========================================
    // 🔥 FIREBASE MIGRATION NOTE:
    // If you want to filter by category/region even when not searching,
    // uncomment and implement the filtering logic here.
    // For now, this just shows all cards when search is closed.
    // ========================================
  }
  
  // Perform search by filtering visible cards
  function performSearch(query) {
    const lowerQuery = query.toLowerCase();
    
    console.log('🔍 Searching for:', query, 'across', allJobCards.length, 'cards');
    
    if (allJobCards.length === 0) {
      console.warn('⚠️ No job cards found. Search will not work until Firebase loads jobs.');
      return;
    }
    
    let shownCount = 0;
    
    allJobCards.forEach(card => {
      // Get searchable text from the card
      // ========================================
      // 🔥 FIREBASE MIGRATION NOTE:
      // Adjust selectors based on your actual job card HTML structure
      // Common selectors: .job-title, .job-category, .job-location, data-* attributes
      // ========================================
      
      // Get all text content from the card
      const cardText = card.textContent.toLowerCase();
      
      // Also try specific selectors
      const titleEl = card.querySelector('.job-title, .preview-title, [data-job-title]');
      const locationEl = card.querySelector('.job-location, .preview-location, [data-job-location]');
      const descEl = card.querySelector('.job-description, .preview-description, [data-job-description]');
      
      const title = titleEl ? titleEl.textContent.toLowerCase() : '';
      const location = locationEl ? locationEl.textContent.toLowerCase() : '';
      const description = descEl ? descEl.textContent.toLowerCase() : '';
      
      // Search across all text
      const matchesSearch = cardText.includes(lowerQuery) ||
                           title.includes(lowerQuery) ||
                           location.includes(lowerQuery) ||
                           description.includes(lowerQuery);
      
      // Show/hide card
      if (matchesSearch) {
        card.style.display = '';
        shownCount++;
      } else {
        card.style.display = 'none';
      }
    });
    
    console.log('🔍 Showing', shownCount, 'of', allJobCards.length, 'cards');
  }
  
  console.log('✅ Search script initialized');
})();

// ========================================
// 🎮 GAMING FILTER PANEL (SHARED)
// ========================================
(function() {
  console.log('🎮 Gaming Filter Script Loading...');
  
  const gamingFilterPanel = document.getElementById('gamingFilterPanel');
  const gamingFilterBar = document.getElementById('gamingFilterBar'); // Footer bar (clickable)
  const filterDisplay = document.getElementById('filterDisplay'); // Display container
  const filterDisplayRegion = document.getElementById('filterDisplayRegion');
  const filterDisplayCity = document.getElementById('filterDisplayCity');
  const filterDisplayPay = document.getElementById('filterDisplayPay');
  const filterArrow = document.getElementById('filterArrow'); // Arrow
  const regionButton = document.getElementById('regionButton');
  const cityButton = document.getElementById('cityButton');
  const regionModalOverlay = document.getElementById('regionPickerOverlay');
  const cityModalOverlay = document.getElementById('cityPickerOverlay');
  const regionModalClose = document.getElementById('regionPickerCloseBtn');
  const cityModalClose = document.getElementById('cityPickerCloseBtn');
  const regionList = document.getElementById('regionPickerList');
  const cityList = document.getElementById('cityPickerList');
  const payOptionJob = document.getElementById('payOptionJob');
  const payOptionHour = document.getElementById('payOptionHour');
  
  let selectedRegion = 'CEBU';
  let selectedCity = 'CEBU CITY';
  let selectedPayType = null; // Default to no filter (show all)

  // Default cities for each region
  const defaultCities = {
    'CEBU': 'CEBU CITY',
    'BOHOL': 'Tagbilaran City',
    'LEYTE': 'Tacloban City',
    'MASBATE': 'Masbate City',
    'NEGROS': 'Bacolod City',
    'PANAY': 'Iloilo City',
    'SAMAR': 'Catbalogan City',
    'DAVAO': 'Davao City',
    'MANILA': 'Manila'
  };

  // Populate region picker list
  function populateRegions() {
    const regionData = ['CEBU', 'BOHOL', 'LEYTE', 'MASBATE', 'NEGROS', 'PANAY', 'SAMAR', 'DAVAO', 'MANILA'];
    if (regionList) {
      regionList.innerHTML = regionData.map(region => 
        `<div class="region-picker-item" data-value="${region}">${region.charAt(0) + region.slice(1).toLowerCase()}</div>`
      ).join('');
      
      // Add click handlers to region items
      regionList.querySelectorAll('.region-picker-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent gaming filter panel from closing
          
          selectedRegion = item.getAttribute('data-value');
          if (regionButton) regionButton.textContent = item.textContent;
          
          // Update global filter variables
          activeRegion = selectedRegion;
          
          // Close the region modal
          regionModalOverlay.classList.remove('show');
          
          // Populate cities for the new region
          populateCities(selectedRegion);
          
          // Set default city for this region
          selectedCity = defaultCities[selectedRegion] || citiesByRegion[selectedRegion][0] || '';
          activeCity = selectedCity;
          if (cityButton) cityButton.textContent = selectedCity;
          
          updateFilterDisplay();
          
          // Re-filter jobs with new region
          filterAndSortJobs();
          console.log('🎮 Region changed to:', selectedRegion, '- Jobs re-filtered');
        });
      });
    }
  }

  // Populate cities modal based on selected region
  function populateCities(region) {
    const cities = citiesByRegion[region] || [];
    if (cityList) {
      cityList.innerHTML = cities.map(city => 
        `<div class="city-picker-item" data-value="${city}">${city}</div>`
      ).join('');
      
      // Add click handlers to city items
      cityList.querySelectorAll('.city-picker-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent gaming filter panel from closing
          
          selectedCity = item.getAttribute('data-value');
          activeCity = selectedCity;
          if (cityButton) cityButton.textContent = selectedCity;
          cityModalOverlay.classList.remove('show');
          updateFilterDisplay();
          
          // Re-filter jobs with new city
          filterAndSortJobs();
          console.log('🎮 City changed to:', selectedCity, '- Jobs re-filtered');
        });
      });
    }
  }

  // Initialize with CEBU cities
  populateRegions();
  populateCities('CEBU');
  
  // Update display text in footer bar
  function updateFilterDisplay() {
    if (filterDisplayRegion) filterDisplayRegion.textContent = selectedRegion;
    if (filterDisplayCity) filterDisplayCity.textContent = selectedCity;
    let payTypeText = 'SELECT';
    if (selectedPayType === 'per-job') payTypeText = 'PER JOB';
    else if (selectedPayType === 'per-hour') payTypeText = 'PER HOUR';
    if (filterDisplayPay) filterDisplayPay.textContent = payTypeText;
  }
  
  // Region button click - open modal (prevent panel from closing)
  if (regionButton) {
    regionButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent any parent click handlers
      regionModalOverlay.classList.add('show');
    });
  }
  
  // City button click - open modal (prevent panel from closing)
  if (cityButton) {
    cityButton.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent any parent click handlers
      cityModalOverlay.classList.add('show');
    });
  }
  
  // Close region modal
  if (regionModalClose) {
    regionModalClose.addEventListener('click', (e) => {
      e.stopPropagation();
      regionModalOverlay.classList.remove('show');
    });
  }
  
  // Close city modal
  if (cityModalClose) {
    cityModalClose.addEventListener('click', (e) => {
      e.stopPropagation();
      cityModalOverlay.classList.remove('show');
    });
  }
  
  // Close modals on overlay click (but keep gaming filter panel open)
  if (regionModalOverlay) {
    regionModalOverlay.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === regionModalOverlay) {
        regionModalOverlay.classList.remove('show');
      }
    });
  }
  
  if (cityModalOverlay) {
    cityModalOverlay.addEventListener('click', (e) => {
      e.stopPropagation();
      if (e.target === cityModalOverlay) {
        cityModalOverlay.classList.remove('show');
      }
    });
  }
  
  // Pay type icon selection handlers
  if (payOptionJob) {
    payOptionJob.addEventListener('click', () => {
      if (selectedPayType === 'per-job') {
        // Clicking again deselects (show all)
        selectedPayType = null;
        activePay = 'PAY TYPE';
        payOptionJob.classList.remove('active');
        console.log('💰 Pay type deselected: Showing all jobs');
      } else {
        // Select per-job
        selectedPayType = 'per-job';
        activePay = 'PER JOB';
        payOptionJob.classList.add('active');
        if (payOptionHour) payOptionHour.classList.remove('active');
        console.log('💰 Pay type selected: Per Job - Jobs re-filtered');
      }
      updateFilterDisplay();
      filterAndSortJobs();
    });
  }
  
  if (payOptionHour) {
    payOptionHour.addEventListener('click', () => {
      if (selectedPayType === 'per-hour') {
        // Clicking again deselects (show all)
        selectedPayType = null;
        activePay = 'PAY TYPE';
        payOptionHour.classList.remove('active');
        console.log('⏰ Pay type deselected: Showing all jobs');
      } else {
        // Select per-hour
        selectedPayType = 'per-hour';
        activePay = 'PER HOUR';
        payOptionHour.classList.add('active');
        if (payOptionJob) payOptionJob.classList.remove('active');
        console.log('⏰ Pay type selected: Per Hour - Jobs re-filtered');
      }
      updateFilterDisplay();
      filterAndSortJobs();
    });
  }
  
  // Initialize display on load
  updateFilterDisplay();

  // Toggle panel expansion when clicking footer bar
  if (gamingFilterBar && gamingFilterPanel) {
    console.log('✅ Filter bar found, attaching click listener');
    gamingFilterBar.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event from bubbling
      console.log('🖱️ Filter bar clicked!');
      
      const isExpanded = gamingFilterPanel.classList.contains('expanded');
      
      if (isExpanded) {
        // Closing: Add closing class, wait for animation, then remove expanded
        console.log('📦 Panel closing with animation...');
        gamingFilterPanel.classList.add('closing');
        gamingFilterPanel.classList.remove('expanded');
        
        setTimeout(() => {
          gamingFilterPanel.classList.remove('closing');
          console.log('📦 Panel collapsed');
        }, 350); // Match CSS animation duration (0.35s)
        
        document.body.style.overflow = '';
      } else {
        // Opening: Just add expanded class
        console.log('📦 Panel expanding...');
        gamingFilterPanel.classList.add('expanded');
        document.body.style.overflow = 'hidden';
      }
    });
    
    // Close panel when clicking backdrop (but not when modals are open)
    document.addEventListener('click', (e) => {
      if (gamingFilterPanel.classList.contains('expanded')) {
        // Don't close if clicking inside the panel
        const isClickInsidePanel = gamingFilterPanel.contains(e.target);
        
        // Don't close if clicking on region or city modals
        const isClickOnRegionModal = regionModalOverlay && regionModalOverlay.contains(e.target);
        const isClickOnCityModal = cityModalOverlay && cityModalOverlay.contains(e.target);
        
        if (!isClickInsidePanel && !isClickOnRegionModal && !isClickOnCityModal) {
          console.log('🖱️ Clicked outside panel, collapsing with animation...');
          gamingFilterPanel.classList.add('closing');
          gamingFilterPanel.classList.remove('expanded');
          
          setTimeout(() => {
            gamingFilterPanel.classList.remove('closing');
            console.log('📦 Panel collapsed');
          }, 350); // Match CSS animation duration (0.35s)
          
          document.body.style.overflow = '';
        }
      }
    });
  } else {
    console.error('❌ Elements not found:', {
      gamingFilterBar: !!gamingFilterBar,
      gamingFilterPanel: !!gamingFilterPanel
    });
  }
})();

// ========================================
// 📋 JOB CATEGORY DROPDOWN MENU (All Listing Pages)
// ========================================
(function() {
  const serviceMenuOverlay = document.getElementById('jobcatServiceMenuOverlay');
  if (!serviceMenuOverlay) {
    console.log('No job category overlay found');
    return;
  }

  // Check if it has the old <ul> structure (needs replacement) or new modal structure (already good)
  const hasOldStructure = serviceMenuOverlay.querySelector('ul') !== null;
  const hasNewStructure = serviceMenuOverlay.querySelector('.jobcat-modal-container') !== null;

  if (hasNewStructure) {
    console.log('✓ Job category menu already has new structure (hardcoded in HTML)');
    return;
  }

  if (!hasOldStructure) {
    console.log('⚠️ Unknown job category menu structure');
    return;
  }

  // Job categories with emojis and page names
  const jobCategories = [
    // BASIC HELPER SECTION
    { emoji: '🧹', label: 'Limpyo', page: 'limpyo.html', section: 'basic' },
    { emoji: '📦', label: 'Hakot', page: 'hakot.html', section: 'basic' },
    { emoji: '🚗', label: 'Hatod', page: 'hatod.html', section: 'basic' },
    { emoji: '🍽️', label: 'Hugas', page: 'hugas.html', section: 'basic' },
    { emoji: '🍳', label: 'Luto', page: 'luto.html', section: 'basic' },
    { emoji: '👕', label: 'Laba', page: 'laba.html', section: 'basic' },
    { emoji: '🛒', label: 'Kompra', page: 'kompra.html', section: 'basic' },
    { emoji: '🏪', label: 'Tindera', page: 'tindera.html', section: 'basic' },
    { emoji: '👁️', label: 'Bantay', page: 'bantay.html', section: 'basic' },
    { emoji: '💁🏻‍♂️', label: 'Waiter', page: 'waiter.html', section: 'basic' },
    { emoji: '🙋🏻', label: 'Staff', page: 'staff.html', section: 'basic' },
    { emoji: '👩‍💼👨‍💼', label: 'Reception', page: 'reception.html', section: 'basic' },
    
    // SKILLED WORKER SECTION
    { emoji: '🏋️', label: 'Trainer', page: 'trainer.html', section: 'skilled' },
    { emoji: '🚕', label: 'Driver', page: 'driver.html', section: 'skilled' },
    { emoji: '👮🏻', label: 'Security', page: 'security.html', section: 'skilled' },
    { emoji: '💇🏻', label: 'Barber', page: 'barber.html', section: 'skilled' },
    { emoji: '👨🏻‍🔧', label: 'Handyman', page: 'handyman.html', section: 'skilled' },
    { emoji: '👷🏻', label: 'Builder', page: 'builder.html', section: 'skilled' },
    { emoji: '🖌️', label: 'Painter', page: 'painter.html', section: 'skilled' },
    { emoji: '👩🏻‍🌾', label: 'Gardner', page: 'gardner.html', section: 'skilled' },
    { emoji: '💆🏻‍♀️', label: 'Massager', page: 'massage.html', section: 'skilled' },
    { emoji: '🐾', label: 'Pet Care', page: 'petcare.html', section: 'skilled' },
    { emoji: '📱', label: 'Social', page: 'social.html', section: 'skilled' },
    { emoji: '💡', label: 'Creative', page: 'creative.html', section: 'skilled' },
    { emoji: '🖼️', label: 'Artist', page: 'artist.html', section: 'skilled' },
    { emoji: '🎵', label: 'Musician', page: 'musician.html', section: 'skilled' },
    { emoji: '💃🏻', label: 'Performer', page: 'performer.html', section: 'skilled' },
    { emoji: '📷', label: 'Photographer', page: 'photographer.html', section: 'skilled' },
    { emoji: '🎥', label: 'Videographer', page: 'videographer.html', section: 'skilled' },
    { emoji: '🎬', label: 'Editor', page: 'editor.html', section: 'skilled' },
    { emoji: '📋', label: 'Secretary', page: 'secretary.html', section: 'skilled' },
    { emoji: '📚', label: 'Tutor', page: 'tutor.html', section: 'skilled' },
    { emoji: '🗂️', label: 'Clerical', page: 'clerical.html', section: 'skilled' },
    
    // PROFESSIONAL SECTION
    { emoji: '❤️‍🩹', label: 'Nurse', page: 'nurse.html', section: 'professional' },
    { emoji: '🧑🏻‍⚕️', label: 'Doctor', page: 'doctor.html', section: 'professional' },
    { emoji: '⚖️', label: 'Lawyer', page: 'lawyer.html', section: 'professional' },
    { emoji: '🔩', label: 'Mechanic', page: 'mechanic.html', section: 'professional' },
    { emoji: '⚡', label: 'Electrician', page: 'electrician.html', section: 'professional' },
    { emoji: '🚰', label: 'Plumber', page: 'plumber.html', section: 'professional' },
    { emoji: '🔨', label: 'Carpenter', page: 'carpenter.html', section: 'professional' },
    { emoji: '🔍', label: 'Researcher', page: 'researcher.html', section: 'professional' },
    { emoji: '🧵', label: 'Tailor', page: 'tailor.html', section: 'professional' },
    { emoji: '👩🏻‍🍳', label: 'Chef', page: 'chef.html', section: 'professional' },
    { emoji: '🧘🏻', label: 'Therapist', page: 'therapist.html', section: 'professional' },
    { emoji: '🏡', label: 'Realtor', page: 'realtor.html', section: 'professional' },
    { emoji: '🧮', label: 'Accountant', page: 'accountant.html', section: 'professional' },
    { emoji: '💼', label: 'Consultant', page: 'consultant.html', section: 'professional' },
    { emoji: '🛜', label: 'IT Tech', page: 'ittech.html', section: 'professional' },
    { emoji: '💻', label: 'Programmer', page: 'programmer.html', section: 'professional' },
    { emoji: '⚙️', label: 'Engineer', page: 'engineer.html', section: 'professional' },
    { emoji: '📊', label: 'Marketer', page: 'marketer.html', section: 'professional' }
  ];

  // Get current page to mark active
  const currentPage = window.location.pathname.split('/').pop();

  // Group by section
  const sections = {
    basic: { title: 'Basic Helper', items: [] },
    skilled: { title: 'Skilled Worker', items: [] },
    professional: { title: 'Professional', items: [] }
  };

  jobCategories.forEach(cat => {
    sections[cat.section].items.push(cat);
  });

  // Generate the new modal structure HTML
  let bodyHTML = '';
  Object.values(sections).forEach(section => {
    bodyHTML += `<div class="jobcat-section-divider">${section.title}</div>`;
    bodyHTML += '<div class="jobcat-category-grid">';
    section.items.forEach(cat => {
      const activeClass = currentPage === cat.page ? ' active' : '';
      bodyHTML += `
        <a href="${cat.page}" class="jobcat-category-card${activeClass}">
          <div class="jobcat-category-icon">${cat.emoji}</div>
          <div class="jobcat-category-label">${cat.label}</div>
        </a>
      `;
    });
    bodyHTML += '</div>';
  });

  // Replace entire overlay content with new modal structure
  serviceMenuOverlay.innerHTML = `
    <div class="jobcat-modal-container">
      <div class="jobcat-modal-header">
        <div class="jobcat-modal-title">Select Job Category</div>
        <div class="jobcat-modal-close" id="jobcatModalClose">×</div>
      </div>
      <div class="jobcat-modal-body">
        ${bodyHTML}
      </div>
    </div>
  `;

  // Re-attach close button listener
  const closeBtn = document.getElementById('jobcatModalClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      serviceMenuOverlay.classList.remove('show');
    });
  }

  console.log('✓ Job category menu upgraded to new modal structure');
})();

// ========================================
// 🔤 AUTO-RESIZE JOB CATEGORY BUTTON TEXT
// ========================================
(function() {
  const serviceNameContainer = document.querySelector('.jobcat-servicename');
  if (!serviceNameContainer) return;

  const textDiv = serviceNameContainer.querySelector('div:first-child');
  if (!textDiv) return;

  function autoResizeJobCategoryText() {
    const text = textDiv.textContent.trim();
    const totalLength = text.length; // Includes space between words
    
    // Reset to default first by removing inline style
    serviceNameContainer.style.removeProperty('font-size');
    
    // If combined text > 13 characters, start downsizing
    if (totalLength > 13) {
      // Get the computed default font size from CSS
      const computedStyle = window.getComputedStyle(serviceNameContainer);
      const defaultFontSize = parseFloat(computedStyle.fontSize);
      
      // Calculate reduction: very aggressive for long text
      // 10% reduction per character over 13
      const overage = totalLength - 13;
      const reductionPerChar = 0.10; // 10% per character (very aggressive)
      const scaleFactor = 1 - (overage * reductionPerChar);
      
      // Apply minimum font size cap (don't go below 40% of default)
      const minScale = 0.40;
      const finalScale = Math.max(scaleFactor, minScale);
      const newFontSize = defaultFontSize * finalScale;
      
      // Use setProperty with 'important' to override CSS !important rules
      serviceNameContainer.style.setProperty('font-size', newFontSize + 'px', 'important');
      console.log(`📏 "${text}" (${totalLength} chars) → ${newFontSize.toFixed(1)}px (reduced ${((1-finalScale)*100).toFixed(0)}%)`);
    }
  }

  // Run on page load
  autoResizeJobCategoryText();

  // Run on window resize
  window.addEventListener('resize', autoResizeJobCategoryText);

  // Observe text changes (in case it's dynamically updated)
  const observer = new MutationObserver(autoResizeJobCategoryText);
  observer.observe(textDiv, { childList: true, characterData: true, subtree: true });

  console.log('✓ Job category text auto-resize initialized');
})();

// ============================================================================
// 🧹 MEMORY LEAK PREVENTION & CLEANUP
// ============================================================================
// This section handles proper cleanup of event listeners, observers, and timers
// to prevent memory leaks, especially important for single-page apps or
// when users navigate between listing pages frequently.
// ============================================================================

(function() {
  // Store all event listeners and observers for cleanup
  const cleanupRegistry = {
    listeners: [],
    observers: [],
    timers: []
  };

  // Track event listeners for removal
  function registerListener(element, event, handler, options) {
    element.addEventListener(event, handler, options);
    cleanupRegistry.listeners.push({ element, event, handler, options });
  }

  // Track observers for disconnection
  function registerObserver(observer) {
    cleanupRegistry.observers.push(observer);
  }

  // Track timers for clearing
  function registerTimer(timerId, type = 'timeout') {
    cleanupRegistry.timers.push({ timerId, type });
  }

  // Cleanup function to remove all tracked resources
  function cleanup() {
    console.log('🧹 Starting memory cleanup...');
    
    // Remove all event listeners
    cleanupRegistry.listeners.forEach(({ element, event, handler, options }) => {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(event, handler, options);
      }
    });
    console.log(`  ✓ Removed ${cleanupRegistry.listeners.length} event listeners`);
    
    // Disconnect all observers
    cleanupRegistry.observers.forEach(observer => {
      if (observer && typeof observer.disconnect === 'function') {
        observer.disconnect();
      }
    });
    console.log(`  ✓ Disconnected ${cleanupRegistry.observers.length} observers`);
    
    // Clear all timers
    cleanupRegistry.timers.forEach(({ timerId, type }) => {
      if (type === 'timeout') {
        clearTimeout(timerId);
      } else if (type === 'interval') {
        clearInterval(timerId);
      }
    });
    console.log(`  ✓ Cleared ${cleanupRegistry.timers.length} timers`);
    
    // Clear registry
    cleanupRegistry.listeners = [];
    cleanupRegistry.observers = [];
    cleanupRegistry.timers = [];
    
    // Clear card registry (WeakMap will auto-cleanup when cards are removed)
    if (window._cardRegistry) {
      console.log('  ✓ Card registry cleared (WeakMap)');
    }
    
    console.log('✓ Memory cleanup complete');
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', cleanup);
  
  // Cleanup on visibility change (when tab is hidden for extended period)
  let hiddenTimer;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Clean up after 5 minutes of being hidden
      hiddenTimer = setTimeout(() => {
        cleanup();
        console.log('🧹 Auto-cleanup triggered after 5 minutes of inactivity');
      }, 5 * 60 * 1000);
    } else {
      // Cancel cleanup if page becomes visible again
      clearTimeout(hiddenTimer);
    }
  });

  // Expose cleanup utilities globally for other modules
  window._listingCleanup = {
    registerListener,
    registerObserver,
    registerTimer,
    cleanup
  };

  console.log('✓ Memory leak prevention system initialized');
})();

// ============================================================================
// 🔥 PERFORMANCE OPTIMIZATION: Lazy Loading Images
// ============================================================================
// Ensure images are only loaded when they enter the viewport
// ============================================================================

(function() {
  // Check if browser supports IntersectionObserver
  if (!('IntersectionObserver' in window)) {
    console.log('⚠️ IntersectionObserver not supported, images will load immediately');
    return;
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px 0px', // Start loading 50px before entering viewport
    threshold: 0.01
  });

  // Observe all job card images
  function observeJobImages() {
    const jobImages = document.querySelectorAll('.card-thumbnail img[data-src]');
    jobImages.forEach(img => imageObserver.observe(img));
    console.log(`🖼️ Observing ${jobImages.length} images for lazy loading`);
  }

  // Initial observation
  const observeTimer = setTimeout(observeJobImages, 100);
  if (window._listingCleanup) {
    window._listingCleanup.registerTimer(observeTimer);
  }

  // Re-observe when new cards are added (e.g., after filtering)
  const cardsContainer = document.querySelector('.sortmenus');
  if (cardsContainer) {
    const containerObserver = new MutationObserver(() => {
      observeJobImages();
    });
    containerObserver.observe(cardsContainer, { childList: true, subtree: true });
    
    // Register observer for cleanup
    if (window._listingCleanup) {
      window._listingCleanup.registerObserver(containerObserver);
    }
  }

  // Register image observer for cleanup
  if (window._listingCleanup) {
    window._listingCleanup.registerObserver(imageObserver);
  }

  console.log('✓ Lazy loading images initialized');
})();

// ============================================================================
// 🔥 FIREBASE MIGRATION CHECKLIST
// ============================================================================
// When migrating to Firebase, update the following:
//
// 1. Import Firebase modules:
//    import { initializeApp } from 'firebase/app';
//    import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
//    import { getStorage, ref, getDownloadURL } from 'firebase/storage';
//
// 2. Initialize Firebase in a separate config file (firebase-config.js)
//
// 3. Update filterAndSortJobs() to be async and fetch from Firestore:
//    - Replace localStorage.getItem() with Firebase queries
//    - Add loading state UI (spinner/skeleton cards)
//    - Implement error handling for network failures
//    - Add pagination for large result sets
//
// 4. Update createJobPreviewCard() to handle Firebase Storage URLs:
//    - Replace static photo paths with getDownloadURL() calls
//    - Add fallback placeholder images
//
// 5. Implement real-time updates (optional):
//    - Use onSnapshot() instead of getDocs() for live data
//    - Add listener cleanup in memory leak prevention section
//
// 6. Add Firebase Analytics tracking:
//    - Track card clicks
//    - Track search queries
//    - Track filter usage
//
// 7. Security Rules (Firestore):
//    - Ensure gigs collection has proper read permissions
//    - Implement rate limiting for search queries
//
// For detailed implementation examples, see comments in filterAndSortJobs()
// and createJobPreviewCard() functions above.
// ============================================================================
