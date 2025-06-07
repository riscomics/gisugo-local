// Service Menu Overlay
const serviceMenuBtn = document.getElementById('jobcatServiceMenuBtn');
const serviceMenuOverlay = document.getElementById('jobcatServiceMenuOverlay');

serviceMenuBtn.addEventListener('click', () => {
  serviceMenuOverlay.classList.toggle('show');
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

// Region menu overlay logic
const regionMenuBtn = document.getElementById('locationRegion');
const regionMenuOverlay = document.getElementById('regionMenuOverlay');
let regionMenuOpen = false;
regionMenuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  regionMenuOverlay.classList.toggle('show');
  regionMenuOpen = regionMenuOverlay.classList.contains('show');
});
// Close overlay when clicking outside
document.addEventListener('click', function(e) {
  if (regionMenuOpen && !regionMenuBtn.contains(e.target) && !regionMenuOverlay.contains(e.target)) {
    regionMenuOverlay.classList.remove('show');
    regionMenuOpen = false;
  }
});
// Select region
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
  }
});

// City menu overlay logic
const cityMenuBtn = document.getElementById('locationCity');
const cityMenuOverlay = document.getElementById('cityMenuOverlay');
let cityMenuOpen = false;
cityMenuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  cityMenuOverlay.classList.toggle('show');
  cityMenuOpen = cityMenuOverlay.classList.contains('show');
  if (cityMenuOpen) renderCityMenu();
});
// Close overlay when clicking outside
document.addEventListener('click', function(e) {
  if (cityMenuOpen && !cityMenuBtn.contains(e.target) && !cityMenuOverlay.contains(e.target)) {
    cityMenuOverlay.classList.remove('show');
    cityMenuOpen = false;
  }
});
// Select city
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

// Pay menu overlay logic
const payMenuBtn = document.getElementById('payMenu');
const payMenuOverlay = document.getElementById('payMenuOverlay');
let payMenuOpen = false;
payMenuBtn.addEventListener('click', function(e) {
  e.stopPropagation();
  payMenuOverlay.classList.toggle('show');
  payMenuOpen = payMenuOverlay.classList.contains('show');
});
// Close overlay when clicking outside
document.addEventListener('click', function(e) {
  if (payMenuOpen && !payMenuBtn.contains(e.target) && !payMenuOverlay.contains(e.target)) {
    payMenuOverlay.classList.remove('show');
    payMenuOpen = false;
  }
});
// Select pay type
payMenuOverlay.addEventListener('click', function(e) {
  if (e.target.tagName === 'LI') {
    activePay = e.target.textContent.replace(/▲/, '').trim();
    document.getElementById('payMenuLabel').textContent = activePay;
    renderPayMenu();
    payMenuOverlay.classList.remove('show');
    payMenuOpen = false;
    // Here you would trigger the job listing filter logic based on activePay, activeRegion, and activeCity
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
  
  // Create and insert dynamic job preview cards first (newest on top)
  categoryCards.forEach(cardData => {
    const jobCard = createJobPreviewCard(cardData);
    headerSpacer.parentNode.insertBefore(jobCard, headerSpacer.nextSibling);
  });
  
  // Load static template jobs (these appear below dynamic jobs)
  loadStaticTemplateCards(currentCategory, headerSpacer);
}

function loadStaticTemplateCards(category, headerSpacer) {
  const staticJobsData = getStaticJobsData();
  
  // Get static jobs for this category
  const categoryJobs = staticJobsData[category] || [];
  
  // Insert static job cards after any dynamic jobs
  categoryJobs.forEach(jobData => {
    const jobCard = createJobPreviewCard(jobData);
    headerSpacer.parentNode.appendChild(jobCard);
  });
}

function getStaticJobsData() {
  const staticJobs = {
    hatod: [
      {
        title: "Hatod rice bags from warehouse to restaurant",
        price: "₱150",
        rate: "Per Job",
        date: "Aug 15",
        time: "9AM-11AM",
        photo: "public/mock/mock-hatod-post1.jpg",
        templateUrl: "public/jobs/hatod/hatod-job-2025-1.html",
        extra1: "LOAD AT: Guadalupe",
        extra2: "DELIVERY AT: Lahug"
      },
      {
        title: "Hatod medicine from pharmacy to senior citizen",
        price: "₱80",
        rate: "Per Job",
        date: "Aug 16",
        time: "2PM-4PM",
        photo: "public/mock/mock-hatod-post2.jpg",
        templateUrl: "public/jobs/hatod/hatod-job-2025-2.html",
        extra1: "LOAD AT: Colon Street",
        extra2: "DELIVERY AT: Talamban"
      },
      {
        title: "Hatod flowers for anniversary surprise",
        price: "₱120",
        rate: "Per Job",
        date: "Aug 17",
        time: "11AM-1PM",
        photo: "public/mock/mock-hatod-post3.jpg",
        templateUrl: "public/jobs/hatod/hatod-job-2025-3.html",
        extra1: "LOAD AT: Ayala Center",
        extra2: "DELIVERY AT: Capitol Site"
      },
      {
        title: "Hatod legal documents to law office",
        price: "₱100",
        rate: "Per Job",
        date: "Aug 18",
        time: "8AM-10AM",
        photo: "public/mock/mock-hatod-post4.jpg",
        templateUrl: "public/jobs/hatod/hatod-job-2025-4.html",
        extra1: "LOAD AT: Banilad",
        extra2: "DELIVERY AT: Fuente Circle"
      },
      {
        title: "Hatod birthday cake for surprise party",
        price: "₱200",
        rate: "Per Job",
        date: "Aug 19",
        time: "4PM-6PM",
        photo: "public/mock/mock-hatod-post5.jpg",
        templateUrl: "public/jobs/hatod/hatod-job-2025-5.html",
        extra1: "LOAD AT: IT Park",
        extra2: "DELIVERY AT: Mabolo"
      },
      {
        title: "Hatod laptop from repair shop to customer",
        price: "₱180",
        rate: "Per Job",
        date: "Aug 20",
        time: "10AM-12PM",
        photo: "public/mock/mock-hatod-post6.jpg",
        templateUrl: "public/jobs/hatod/hatod-job-2025-6.html",
        extra1: "LOAD AT: JY Square",
        extra2: "DELIVERY AT: Kasambagan"
      },
      {
        title: "Hatod groceries to elderly neighbor",
        price: "₱90",
        rate: "Per Job",
        date: "Aug 21",
        time: "1PM-3PM",
        photo: "public/mock/mock-hatod-post7.jpg",
        templateUrl: "public/jobs/hatod/hatod-job-2025-7.html",
        extra1: "LOAD AT: SM City Cebu",
        extra2: "DELIVERY AT: Balamban"
      }
    ],
    hakot: [
      {
        title: "Hakot old furniture and appliances from apartment",
        price: "₱300",
        rate: "Per Job",
        date: "Aug 22",
        time: "8AM-10AM",
        photo: "public/mock/mock-hakot-post1.jpg",
        templateUrl: "public/jobs/hakot/hakot-job-2025-1.html",
        extra1: "LOAD AT: Lahug",
        extra2: "UNLOAD AT: Mandaue"
      },
      {
        title: "Hakot construction debris from renovation site",
        price: "₱500",
        rate: "Per Job",
        date: "Aug 23",
        time: "1PM-4PM",
        photo: "public/mock/mock-hakot-post2.jpg",
        templateUrl: "public/jobs/hakot/hakot-job-2025-2.html",
        extra1: "LOAD AT: Capitol Site",
        extra2: "UNLOAD AT: Talisay"
      },
      {
        title: "Hakot garden waste and fallen branches",
        price: "₱250",
        rate: "Per Job",
        date: "Aug 24",
        time: "9AM-11AM",
        photo: "public/mock/mock-hakot-post3.jpg",
        templateUrl: "public/jobs/hakot/hakot-job-2025-3.html",
        extra1: "LOAD AT: Banilad",
        extra2: "UNLOAD AT: Banilad"
      },
      {
        title: "Hakot office equipment and old documents",
        price: "₱400",
        rate: "Per Job",
        date: "Aug 25",
        time: "10AM-12PM",
        photo: "public/mock/mock-hakot-post4.jpg",
        templateUrl: "public/jobs/hakot/hakot-job-2025-4.html",
        extra1: "LOAD AT: IT Park",
        extra2: "UNLOAD AT: IT Park"
      },
      {
        title: "Hakot household junk after spring cleaning",
        price: "₱350",
        rate: "Per Job",
        date: "Aug 26",
        time: "2PM-5PM",
        photo: "public/mock/mock-hakot-post5.jpg",
        templateUrl: "public/jobs/hakot/hakot-job-2025-5.html",
        extra1: "LOAD AT: Mabolo",
        extra2: "UNLOAD AT: Mabolo"
      },
      {
        title: "Hakot damaged goods from flooded warehouse",
        price: "₱600",
        rate: "Per Job",
        date: "Aug 27",
        time: "7AM-11AM",
        photo: "public/mock/mock-hakot-post6.jpg",
        templateUrl: "public/jobs/hakot/hakot-job-2025-6.html",
        extra1: "LOAD AT: Mandaue",
        extra2: "UNLOAD AT: Lapu-Lapu"
      },
      {
        title: "Hakot broken concrete and tiles from driveway",
        price: "₱450",
        rate: "Per Job",
        date: "Aug 28",
        time: "6AM-9AM",
        photo: "public/mock/mock-hakot-post7.jpg",
        templateUrl: "public/jobs/hakot/hakot-job-2025-7.html",
        extra1: "LOAD AT: Talamban",
        extra2: "UNLOAD AT: Talamban"
      }
    ],
    kompra: [
      {
        title: "Kompra weekly groceries for elderly couple",
        price: "₱200",
        rate: "Per Job",
        date: "Aug 22",
        time: "10AM-12PM",
        photo: "public/mock/mock-kompra-post1.jpg",
        templateUrl: "public/jobs/kompra/kompra-job-2025-1.html",
        extra1: "SHOP AT: SM City Cebu",
        extra2: "DELIVERY AT: Guadalupe"
      },
      {
        title: "Kompra ingredients for restaurant opening",
        price: "₱500",
        rate: "Per Job",
        date: "Aug 23",
        time: "6AM-8AM",
        photo: "public/mock/mock-kompra-post2.jpg",
        templateUrl: "public/jobs/kompra/kompra-job-2025-2.html",
        extra1: "SHOP AT: Carbon Market",
        extra2: "DELIVERY AT: Colon Street"
      },
      {
        title: "Kompra baby supplies for new parent",
        price: "₱150",
        rate: "Per Job",
        date: "Aug 24",
        time: "3PM-5PM",
        photo: "public/mock/mock-kompra-post3.jpg",
        templateUrl: "public/jobs/kompra/kompra-job-2025-3.html",
        extra1: "SHOP AT: Robinsons Galleria",
        extra2: "DELIVERY AT: Lahug"
      },
      {
        title: "Kompra party supplies for birthday celebration",
        price: "₱250",
        rate: "Per Job",
        date: "Aug 25",
        time: "11AM-1PM",
        photo: "public/mock/mock-kompra-post4.jpg",
        templateUrl: "public/jobs/kompra/kompra-job-2025-4.html",
        extra1: "SHOP AT: Ayala Center Cebu",
        extra2: "DELIVERY AT: Capitol Site"
      },
      {
        title: "Kompra office supplies for startup company",
        price: "₱300",
        rate: "Per Job",
        date: "Aug 26",
        time: "9AM-11AM",
        photo: "public/mock/mock-kompra-post5.jpg",
        templateUrl: "public/jobs/kompra/kompra-job-2025-5.html",
        extra1: "SHOP AT: National Book Store",
        extra2: "DELIVERY AT: IT Park"
      },
      {
        title: "Kompra medicine and health supplements",
        price: "₱100",
        rate: "Per Job",
        date: "Aug 27",
        time: "4PM-6PM",
        photo: "public/mock/mock-kompra-post6.jpg",
        templateUrl: "public/jobs/kompra/kompra-job-2025-6.html",
        extra1: "SHOP AT: Mercury Drug",
        extra2: "DELIVERY AT: Banilad"
      },
      {
        title: "Kompra specialty ingredients for cooking class",
        price: "₱350",
        rate: "Per Job",
        date: "Aug 28",
        time: "7AM-9AM",
        photo: "public/mock/mock-kompra-post7.jpg",
        templateUrl: "public/jobs/kompra/kompra-job-2025-7.html",
        extra1: "SHOP AT: Landers Superstore",
        extra2: "DELIVERY AT: Mabolo"
      }
    ],
    limpyo: [
      {
        title: "Limpyo house after family reunion party",
        price: "₱400",
        rate: "Per Job",
        date: "Aug 22",
        time: "8AM-12PM",
        photo: "public/mock/mock-limpyo-post1.jpg",
        templateUrl: "public/jobs/limpyo/limpyo-job-2025-1.html",
        extra1: "LOCATION: Lahug",
        extra2: "SUPPLIES: Provided"
      },
      {
        title: "Limpyo office space before new tenants",
        price: "₱600",
        rate: "Per Job",
        date: "Aug 23",
        time: "6AM-10AM",
        photo: "public/mock/mock-limpyo-post2.jpg",
        templateUrl: "public/jobs/limpyo/limpyo-job-2025-2.html",
        extra1: "LOCATION: IT Park",
        extra2: "SUPPLIES: Required"
      },
      {
        title: "Limpyo apartment after renovation work",
        price: "₱500",
        rate: "Per Job",
        date: "Aug 24",
        time: "1PM-5PM",
        photo: "public/mock/mock-limpyo-post3.jpg",
        templateUrl: "public/jobs/limpyo/limpyo-job-2025-3.html",
        extra1: "LOCATION: Capitol Site",
        extra2: "SUPPLIES: Provided"
      },
      {
        title: "Limpyo restaurant kitchen deep cleaning",
        price: "₱800",
        rate: "Per Job",
        date: "Aug 25",
        time: "10PM-2AM",
        photo: "public/mock/mock-limpyo-post4.jpg",
        templateUrl: "public/jobs/limpyo/limpyo-job-2025-4.html",
        extra1: "LOCATION: Ayala Center",
        extra2: "SUPPLIES: Required"
      },
      {
        title: "Limpyo elderly home weekly maintenance",
        price: "₱300",
        rate: "Per Job",
        date: "Aug 26",
        time: "9AM-1PM",
        photo: "public/mock/mock-limpyo-post5.jpg",
        templateUrl: "public/jobs/limpyo/limpyo-job-2025-5.html",
        extra1: "LOCATION: Guadalupe",
        extra2: "SUPPLIES: Provided"
      },
      {
        title: "Limpyo warehouse after inventory clear-out",
        price: "₱1000",
        rate: "Per Job",
        date: "Aug 27",
        time: "5AM-9AM",
        photo: "public/mock/mock-limpyo-post6.jpg",
        templateUrl: "public/jobs/limpyo/limpyo-job-2025-6.html",
        extra1: "LOCATION: Mandaue",
        extra2: "SUPPLIES: Required"
      },
      {
        title: "Limpyo condo unit for new tenant move-in",
        price: "₱350",
        rate: "Per Job",
        date: "Aug 28",
        time: "2PM-6PM",
        photo: "public/mock/mock-limpyo-post7.jpg",
        templateUrl: "public/jobs/limpyo/limpyo-job-2025-7.html",
        extra1: "LOCATION: Banilad",
        extra2: "SUPPLIES: Provided"
      }
    ],
    carpintero: [],
    driver: [],
    electrician: [],
    gardener: [],
    kuryente: [],
    laundrywoman: [],
    luthier: [],
    mason: [],
    painter: [],
    plomero: [],
    security: [],
    sewing: [],
    sisidlan: [],
    taga_bantay: [],
    taga_linis: [],
    taga_plantsa: [],
    trabahador: [],
    tutor: [],
    welder: []
  };
  
  return staticJobs;
}

function createJobPreviewCard(cardData) {
  const cardElement = document.createElement('a');
  cardElement.href = cardData.templateUrl;
  cardElement.className = 'job-preview-card';
  
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
  // Temporarily clear any stored job preview cards to show only static jobs
  localStorage.removeItem('jobPreviewCards');
  
  loadJobPreviewCards();
  // Apply truncation after cards are loaded
  setTimeout(truncateBarangayNames, 50);
});
