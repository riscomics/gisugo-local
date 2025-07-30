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
// Update label
document.getElementById('regionMenuLabel').textContent = activeRegion;
document.getElementById('cityMenuLabel').textContent = activeCity;
document.getElementById('payMenuLabel').textContent = activePay;
setTimeout(updateCityMenuLabelFontSize, 0);

// Function to close all dropdown overlays
function closeAllDropdowns() {
  document.getElementById('regionMenuOverlay').classList.remove('show');
  document.getElementById('cityMenuOverlay').classList.remove('show');
  document.getElementById('payMenuOverlay').classList.remove('show');
  regionMenuOpen = false;
  cityMenuOpen = false;
  payMenuOpen = false;
}

// Region menu overlay logic - UPDATED TO USE CENTERED MODAL
const regionMenuBtn = document.getElementById('locationRegion');
const regionMenuOverlay = document.getElementById('regionMenuOverlay');
const regionPickerModal = document.getElementById('regionPickerOverlay');
const regionPickerList = document.getElementById('regionPickerList');
const regionPickerCloseBtn = document.getElementById('regionPickerCloseBtn');
let regionMenuOpen = false;

// Populate region picker modal
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

// Region button click - show modal instead of small dropdown
regionMenuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  closeAllDropdowns();
  populateRegionPicker();
  regionPickerModal.style.display = 'flex';
});

// Close modal functions
function closeRegionPicker() {
  regionPickerModal.style.display = 'none';
}

// Close button click
regionPickerCloseBtn.addEventListener('click', closeRegionPicker);

// Backdrop click to close
regionPickerModal.addEventListener('click', function(e) {
  if (e.target === regionPickerModal) {
    closeRegionPicker();
  }
});

// Select region from modal
regionPickerList.addEventListener('click', function(e) {
  if (e.target.classList.contains('region-picker-item')) {
    activeRegion = e.target.textContent.trim();
    document.getElementById('regionMenuLabel').textContent = activeRegion;
    // When region changes, reset city to first city in region
    const cities = citiesByRegion[activeRegion] || [];
    activeCity = cities[0] || '';
    document.getElementById('cityMenuLabel').textContent = activeCity;
    setTimeout(updateCityMenuLabelFontSize, 0);
    renderRegionMenu();
    renderCityMenu();
    closeRegionPicker();
    // Trigger job filtering and sorting based on selected region
    filterAndSortJobs();
  }
});

// Keep original small dropdown as backup (but it won't be triggered by the main button anymore)
// Close overlay when clicking outside
document.addEventListener('click', function(e) {
  if (regionMenuOpen && !regionMenuBtn.contains(e.target) && !regionMenuOverlay.contains(e.target)) {
    regionMenuOverlay.classList.remove('show');
    regionMenuOpen = false;
  }
});
// Select region from original dropdown (backup)
regionMenuOverlay.addEventListener('click', function(e) {
  if (e.target.tagName === 'LI') {
    activeRegion = e.target.textContent.replace(/▲/, '').trim();
    document.getElementById('regionMenuLabel').textContent = activeRegion;
    // When region changes, reset city to first city in region
    const cities = citiesByRegion[activeRegion] || [];
    activeCity = cities[0] || '';
    document.getElementById('cityMenuLabel').textContent = activeCity;
    setTimeout(updateCityMenuLabelFontSize, 0);
    renderRegionMenu();
    renderCityMenu();
    regionMenuOverlay.classList.remove('show');
    regionMenuOpen = false;
    // Trigger job filtering and sorting based on selected region
    filterAndSortJobs();
  }
});

// City menu overlay logic - UPDATED TO USE CENTERED MODAL
const cityMenuBtn = document.getElementById('locationCity');
const cityMenuOverlay = document.getElementById('cityMenuOverlay');
const cityPickerModal = document.getElementById('cityPickerOverlay');
const cityPickerList = document.getElementById('cityPickerList');
const cityPickerCloseBtn = document.getElementById('cityPickerCloseBtn');
let cityMenuOpen = false;

// Populate city picker modal
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

// City button click - show modal instead of small dropdown
cityMenuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  closeAllDropdowns();
  populateCityPicker();
  cityPickerModal.style.display = 'flex';
});

// Close modal functions
function closeCityPicker() {
  cityPickerModal.style.display = 'none';
}

// Close button click
cityPickerCloseBtn.addEventListener('click', closeCityPicker);

// Backdrop click to close
cityPickerModal.addEventListener('click', function(e) {
  if (e.target === cityPickerModal) {
    closeCityPicker();
  }
});

// Select city from modal
cityPickerList.addEventListener('click', function(e) {
  if (e.target.classList.contains('city-picker-item')) {
    activeCity = e.target.textContent.trim();
    document.getElementById('cityMenuLabel').textContent = activeCity;
    setTimeout(updateCityMenuLabelFontSize, 0);
    renderCityMenu();
    closeCityPicker();
    // Trigger job filtering and sorting based on selected city
    filterAndSortJobs();
  }
});

// Keep original small dropdown as backup (but it won't be triggered by the main button anymore)
// Close overlay when clicking outside
document.addEventListener('click', function(e) {
  if (cityMenuOpen && !cityMenuBtn.contains(e.target) && !cityMenuOverlay.contains(e.target)) {
    cityMenuOverlay.classList.remove('show');
    cityMenuOpen = false;
  }
});
// Select city from original dropdown (backup)
cityMenuOverlay.addEventListener('click', function(e) {
  if (e.target.tagName === 'LI') {
    activeCity = e.target.textContent.replace(/▲/, '').trim();
    document.getElementById('cityMenuLabel').textContent = activeCity;
    setTimeout(updateCityMenuLabelFontSize, 0);
    renderCityMenu();
    cityMenuOverlay.classList.remove('show');
    cityMenuOpen = false;
  }
});

// Pay menu overlay logic - UPDATED TO USE CENTERED MODAL
const payMenuBtn = document.getElementById('payMenu');
const payMenuOverlay = document.getElementById('payMenuOverlay');
const payPickerModal = document.getElementById('payPickerOverlay');
const payPickerList = document.getElementById('payPickerList');
const payPickerCloseBtn = document.getElementById('payPickerCloseBtn');
let payMenuOpen = false;

// Populate pay picker modal
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

// Pay button click - show modal instead of small dropdown
payMenuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  closeAllDropdowns();
  populatePayPicker();
  payPickerModal.style.display = 'flex';
});

// Close modal functions
function closePayPicker() {
  payPickerModal.style.display = 'none';
}

// Close button click
payPickerCloseBtn.addEventListener('click', closePayPicker);

// Backdrop click to close
payPickerModal.addEventListener('click', function(e) {
  if (e.target === payPickerModal) {
    closePayPicker();
  }
});

// Select pay type from modal
payPickerList.addEventListener('click', function(e) {
  if (e.target.classList.contains('pay-picker-item')) {
    activePay = e.target.textContent.trim();
    document.getElementById('payMenuLabel').textContent = activePay;
    renderPayMenu();
    closePayPicker();
    // Trigger job filtering and sorting based on selected pay type
    filterAndSortJobs();
  }
});

// Keep original small dropdown as backup (but it won't be triggered by the main button anymore)
// Close overlay when clicking outside
document.addEventListener('click', function(e) {
  if (payMenuOpen && !payMenuBtn.contains(e.target) && !payMenuOverlay.contains(e.target)) {
    payMenuOverlay.classList.remove('show');
    payMenuOpen = false;
  }
});
// Select pay type from original dropdown (backup)
payMenuOverlay.addEventListener('click', function(e) {
  if (e.target.tagName === 'LI') {
    activePay = e.target.textContent.replace(/▲/, '').trim();
    document.getElementById('payMenuLabel').textContent = activePay;
    renderPayMenu();
    payMenuOverlay.classList.remove('show');
    payMenuOpen = false;
    // Trigger job filtering and sorting based on selected pay type
    filterAndSortJobs();
  }
});

function updateCityMenuLabelFontSize() {
  const label = document.getElementById('cityMenuLabel');
  const btn = document.getElementById('locationCity');
  if (!label || !btn) return;
  // Get the computed/default font size
  const computed = window.getComputedStyle(label);
  let defaultFontSize = parseFloat(computed.fontSize);
  let fontSize = defaultFontSize;
  label.style.fontSize = fontSize + 'px';
  // Reduce font size until it fits or hits minimum
  while (label.scrollWidth > btn.clientWidth - 32 && fontSize > 12) {
    fontSize -= 1;
    label.style.fontSize = fontSize + 'px';
  }
}

// Call updateCityMenuLabelFontSize on window resize
window.addEventListener('resize', updateCityMenuLabelFontSize);

// Helper function to parse job date and time into comparable timestamp
function parseJobDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  
  try {
    // Parse date like "Jun 11" or "Jun 14" 
    const currentYear = new Date().getFullYear();
    const fullDateStr = `${dateStr} ${currentYear}`;
    const dateObj = new Date(fullDateStr);
    
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
    // Parse date like "Jun 11" or "Jun 14" 
    const currentYear = new Date().getFullYear();
    const fullDateStr = `${dateStr} ${currentYear}`;
    const dateObj = new Date(fullDateStr);
    
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

// Filter and sort jobs based on selected criteria
function filterAndSortJobs() {
  const currentCategory = getCurrentCategory();
  const headerSpacer = document.querySelector('.jobcat-header-spacer');
  
  if (!headerSpacer) {
    console.error('Header spacer not found');
    return;
  }
  
  // Clear existing job cards
  const existingCards = document.querySelectorAll('.job-preview-card');
  existingCards.forEach(card => card.remove());
  
  // Get dynamic job preview cards from localStorage only
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  const categoryCards = previewCards[currentCategory] || [];
  

  
  // Filter jobs based on selected region and pay type
  let filteredJobs = categoryCards;
  
  // Filter by region
  filteredJobs = filteredJobs.filter(job => {
    // If no region data in job, include it (for backwards compatibility)
    if (!job.region) return true;
    return job.region === activeRegion;
  });
  
  // Filter by pay type
  if (activePay !== 'PAY TYPE') {
    filteredJobs = filteredJobs.filter(job => {
      const jobRate = (job.rate || '').toUpperCase();
      const filterRate = activePay.toUpperCase();
      return jobRate === filterRate;
    });
  }
  
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
  
  // Apply truncation after cards are loaded
  setTimeout(truncateBarangayNames, 50);
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
setTimeout(truncateBarangayNames, 100);

// Also call on window load as a final backup
window.addEventListener('load', truncateBarangayNames);

// ========================== JOB PREVIEW CARDS LOADING ==========================

function getCurrentCategory() {
  // Get category from page title or URL
  const title = document.title;
  const categoryMatch = title.match(/(\w+) Service/);
  if (categoryMatch) {
    return categoryMatch[1].toLowerCase();
  }
  
  // Fallback: get from URL
  const url = window.location.pathname;
  const filename = url.substring(url.lastIndexOf('/') + 1);
  return filename.replace('.html', '');
}

function loadJobPreviewCards() {
  const currentCategory = getCurrentCategory();
  
  // Get dynamic job preview cards from localStorage
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  const categoryCards = previewCards[currentCategory] || [];
  
  // Find the insertion point (after the header spacer)
  const headerSpacer = document.querySelector('.jobcat-header-spacer');
  if (!headerSpacer) {
    console.error('Header spacer not found');
    return;
  }
  
  // Sort by earliest job schedule date/time, then by earliest end time
  const sortedCards = categoryCards.sort((a, b) => {
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
  
  // Create and insert dynamic job preview cards in reverse order to get correct display order
  let prevPayType = null;
  let consecCount = 0;
  
  sortedCards.reverse().forEach((cardData) => {
    const currPayType = cardData.rate || 'Per Hour';
    
    // Track consecutive cards of same pay type for subtle variations
    if (currPayType === prevPayType) {
      consecCount++;
    } else {
      consecCount = 0;
      prevPayType = currPayType;
    }
    
    const jobCard = createJobPreviewCard(cardData, currPayType, consecCount);
    headerSpacer.parentNode.insertBefore(jobCard, headerSpacer.nextSibling);
  });
}





function createJobPreviewCard(cardData, payType = 'Per Hour', consecutiveCount = 0) {
  const cardElement = document.createElement('a');
  cardElement.href = cardData.templateUrl;
  
  // Determine background class based on pay type and consecutive count
  let bgClass;
  if (payType === 'Per Hour') {
    // Use green tones for Per Hour jobs
    bgClass = consecutiveCount % 2 === 0 ? 'pay-per-hour' : 'pay-per-hour-alt';
  } else {
    // Use blue-gray tones for Per Job jobs
    bgClass = consecutiveCount % 2 === 0 ? 'pay-per-job' : 'pay-per-job-alt';
  }
  
  cardElement.className = `job-preview-card ${bgClass}`;
  
  // Parse extras to get labels and values
  const extra1Parts = cardData.extra1 ? cardData.extra1.split(':') : ['', ''];
  const extra2Parts = cardData.extra2 ? cardData.extra2.split(':') : ['', ''];
  
  const extra1Label = extra1Parts[0] ? extra1Parts[0].trim() + ':' : '';
  const extra1Value = extra1Parts[1] ? extra1Parts[1].trim() : '';
  const extra2Label = extra2Parts[0] ? extra2Parts[0].trim() + ':' : '';
  const extra2Value = extra2Parts[1] ? extra2Parts[1].trim() : '';
  
  cardElement.innerHTML = `
    <div class="job-preview-img">
      <img src="${cardData.photo}" alt="Job preview image">
    </div>
    <div class="job-preview-content">
      <div class="job-preview-title">${cardData.title}</div>
      <div class="job-preview-extras">
        ${extra1Label ? `<div class="job-preview-extra1"><span class="job-preview-extra-label1">${extra1Label}</span> ${extra1Value}</div>` : ''}
        ${extra2Label ? `<div class="job-preview-extra2"><span class="job-preview-extra-label2">${extra2Label}</span> ${extra2Value}</div>` : ''}
      </div>
    </div>
    <div class="job-preview-infoboxes">
      <div class="job-preview-infobox1">
        <div class="job-preview-price">${cardData.price}</div>
        <div class="job-preview-rate">${cardData.rate}</div>
      </div>
      <div class="job-preview-infobox2">
        <div class="job-preview-date">${cardData.date}</div>
        <div class="job-preview-time">${cardData.time}</div>
      </div>
    </div>
  `;
  
  return cardElement;
}

// Load job preview cards when page loads
document.addEventListener('DOMContentLoaded', function() {
  
  loadJobPreviewCards();
  // Apply initial sorting after cards are loaded
  setTimeout(() => {
    filterAndSortJobs();
    truncateBarangayNames();
  }, 100);
  
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
