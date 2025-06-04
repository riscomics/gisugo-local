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
        // Truncate and add ellipsis
        const truncatedText = cleanText.substring(0, maxLength) + '...';
        
        // Remove all text nodes after the span
        node = span.nextSibling;
        while (node) {
          const nextNode = node.nextSibling;
          if (node.nodeType === Node.TEXT_NODE) {
            node.parentNode.removeChild(node);
          }
          node = nextNode;
        }
        
        // Add the truncated text
        const textNode = document.createTextNode(' ' + truncatedText);
        span.parentNode.appendChild(textNode);
      }
    }
  });
}

// Call the function when the page loads
document.addEventListener('DOMContentLoaded', truncateBarangayNames);
