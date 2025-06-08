// ========================== NEW POST PAGE FUNCTIONALITY ==========================

// Menu overlay functionality
const newPostMenuBtn = document.querySelector('.new-post-header-btn.menu');
const newPostMenuOverlay = document.querySelector('.new-post-menu-overlay');

if (newPostMenuBtn && newPostMenuOverlay) {
  newPostMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    newPostMenuOverlay.classList.add('show');
  });

  newPostMenuOverlay.addEventListener('click', function(e) {
    if (e.target === newPostMenuOverlay) {
      newPostMenuOverlay.classList.remove('show');
    }
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      newPostMenuOverlay.classList.remove('show');
    }
  });
}

// ========================== DYNAMIC EXTRAS CONFIGURATION ==========================

// Define menu types and their options
const menuTypes = {
  location: {
    getOptions: function() {
      // Get barangays from currently selected city
      return getBarangaysForCurrentCity();
    }
  },
  supplies: {
    options: ["PROVIDED", "REQUIRED"]
  },
  subject: {
    options: ["Math", "Science", "Computer", "Language", "Other"]
  },
  position: {
    options: ["In-Person", "Virtual"]
  },
  budget: {
    options: ["Cash-Advance", "Paid-After"]
  }
};

// Function to get barangays for currently selected city
function getBarangaysForCurrentCity() {
  // Get barangays from currently selected city
  const barangays = barangaysByCity[activeCity];
  if (barangays && barangays.length > 0) {
    return barangays;
  }
  
  // Return null if no barangays found - will trigger input field fallback
  return null;
}

// Function to check if city has barangay data
function cityHasBarangayData(city) {
  return barangaysByCity[city] && barangaysByCity[city].length > 0;
}

// Function to create fallback input field for cities without barangay data
function createBarangayInputFallback(fieldNumber) {
  const menuWrapper = document.querySelector(`#newPostExtrasItem${fieldNumber} .new-post-extras-menu-wrapper`);
  
  // Hide the dropdown menu
  document.getElementById(`newPostExtrasMenu${fieldNumber}`).style.display = 'none';
  
  // Create input field if it doesn't exist
  let inputField = document.getElementById(`newPostExtrasInput${fieldNumber}`);
  if (!inputField) {
    inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.id = `newPostExtrasInput${fieldNumber}`;
    inputField.className = 'new-post-extras-menu'; // Use same class as dropdown menus
    inputField.placeholder = 'Barangay / Area';
    inputField.maxLength = 15; // Add character limit of 15
    inputField.autocomplete = 'off'; // Disable autofill
    inputField.spellcheck = false; // Disable spellcheck
    
    // Check for mobile view
    const isMobile = window.innerWidth < 600;
    
    // Set dimensions and styling
    inputField.style.display = 'flex';
    inputField.style.alignItems = 'center';
    inputField.style.justifyContent = 'space-between';
    inputField.style.width = isMobile ? '128px' : '210px'; // Mobile/desktop width
    inputField.style.height = isMobile ? '25px' : '32px'; // Mobile/desktop height
    inputField.style.borderStyle = 'solid';
    inputField.style.borderWidth = '1px';
    inputField.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    inputField.style.backgroundColor = '#363F4F';
    inputField.style.borderRadius = '5px';
    inputField.style.color = '#fff';
    inputField.style.paddingLeft = isMobile ? '10px' : '12px'; // Mobile/desktop padding
    inputField.style.paddingRight = isMobile ? '10px' : '12px';
    inputField.style.fontSize = isMobile ? '15px' : '18px'; // Mobile/desktop font size
    inputField.style.fontWeight = '600';
    inputField.style.fontFamily = 'Arial, sans-serif';
    inputField.style.cursor = 'pointer';
    inputField.style.userSelect = 'none';
    inputField.style.webkitTapHighlightColor = 'transparent';
    
    // Add arrow element
    const arrow = document.createElement('span');
    arrow.className = 'arrow';
    arrow.innerHTML = '&#9660;';
    arrow.style.marginLeft = 'auto';
    arrow.style.fontSize = isMobile ? '1em' : '1.1em'; // Mobile/desktop arrow size
    arrow.style.color = '#d3d7e0';
    inputField.appendChild(arrow);
    
    // Add focus styles
    inputField.addEventListener('focus', function() {
      this.style.borderColor = '#fff';
      this.style.outline = 'none';
    });
    
    inputField.addEventListener('blur', function() {
      this.style.borderColor = 'rgba(255, 255, 255, 0.5)';
    });
    
    // Add placeholder styles
    inputField.addEventListener('input', function() {
      if (this.value === '') {
        this.style.color = 'rgba(255, 255, 255, 0.6)';
        this.style.fontWeight = '400';
      } else {
        this.style.color = '#fff';
        this.style.fontWeight = '600';
      }
    });
    
    menuWrapper.appendChild(inputField);
  }

  inputField.style.display = 'flex';
  
  // Update styles on window resize
  window.addEventListener('resize', function() {
    const isMobile = window.innerWidth < 600;
    inputField.style.width = isMobile ? '128px' : '210px';
    inputField.style.height = isMobile ? '25px' : '32px';
    inputField.style.paddingLeft = isMobile ? '10px' : '12px';
    inputField.style.paddingRight = isMobile ? '10px' : '12px';
    inputField.style.fontSize = isMobile ? '15px' : '18px';
    arrow.style.fontSize = isMobile ? '1em' : '1.1em';
  });
}

// Function to restore dropdown menu for cities with barangay data
function restoreBarangayDropdown(fieldNumber) {
  // Show the dropdown menu
  document.getElementById(`newPostExtrasMenu${fieldNumber}`).style.display = 'flex';
  
  // Hide input field if it exists
  const inputField = document.getElementById(`newPostExtrasInput${fieldNumber}`);
  if (inputField) {
    inputField.style.display = 'none';
  }
}

const extrasConfig = {
  hatod: {
    field1: { label: "Pickup at:", menuType: "location" },
    field2: { label: "Deliver to:", menuType: "location" }
  },
  hakot: {
    field1: { label: "Load at:", menuType: "location" },
    field2: { label: "Unload at:", menuType: "location" }
  },
  kompra: {
    field1: { label: "Shop at:", menuType: "location" },
    field2: { label: "Deliver to:", menuType: "location" }
  },
  luto: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  hugas: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  laba: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  limpyo: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  tindera: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  bantay: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  painter: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  carpenter: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  plumber: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  security: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  driver: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Location:", menuType: "location" }
  },
  tutor: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Subject:", menuType: "subject" }
  },
  clerical: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Position:", menuType: "position" }
  },
  builder: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  reception: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  nurse: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Position:", menuType: "position" }
  },
  doctor: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Position:", menuType: "position" }
  },
  lawyer: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Position:", menuType: "position" }
  },
  mechanic: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  electrician: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  },
  tailor: {
    field1: { label: "Location:", menuType: "location" },
    field2: { label: "Supplies:", menuType: "supplies" }
  }
};

// Job category dropdown functionality
const newPostServiceMenuBtn = document.querySelector('.new-post-servicemenu');
const newPostServiceMenuOverlay = document.querySelector('.new-post-servicemenu-overlay');

if (newPostServiceMenuBtn && newPostServiceMenuOverlay) {
  newPostServiceMenuBtn.addEventListener('click', () => {
    newPostServiceMenuOverlay.classList.toggle('show');
  });

  // Close service menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!newPostServiceMenuBtn.contains(e.target) && !newPostServiceMenuOverlay.contains(e.target)) {
      newPostServiceMenuOverlay.classList.remove('show');
    }
  });

  // Handle job category selection
  newPostServiceMenuOverlay.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
      e.preventDefault();
      const categoryValue = link.getAttribute('data-value');
      const categoryText = link.textContent.trim();
      document.querySelector('#selectedCategoryName').textContent = categoryText;
      newPostServiceMenuOverlay.classList.remove('show');
      
      // Store selected category
      window.selectedJobCategory = categoryValue;
      
      // Update extras based on selected category
      updateExtrasForCategory(categoryValue);
    }
  });
}

// Function to update extras based on selected category
function updateExtrasForCategory(category) {
  const extrasHeader = document.getElementById('newPostExtrasHeader');
  const extrasLabel1 = document.getElementById('newPostExtrasLabel1');
  const extrasLabel2 = document.getElementById('newPostExtrasLabel2');
  const extrasMenuLabel1 = document.getElementById('newPostExtrasMenuLabel1');
  const extrasMenuLabel2 = document.getElementById('newPostExtrasMenuLabel2');
  
  if (!extrasConfig[category]) {
    // Hide extras for categories that don't have configuration
    extrasHeader.style.display = 'none';
    return;
  }
  
  const config = extrasConfig[category];
  
  // Show extras header
  extrasHeader.style.display = 'block';
  
  // Update labels
  extrasLabel1.textContent = config.field1.label;
  extrasLabel2.textContent = config.field2.label;
  
  // Reset menu labels
  extrasMenuLabel1.textContent = 'Select Option';
  extrasMenuLabel2.textContent = 'Select Option';
  
  // Populate dropdown options based on menu type
  populateExtrasDropdownByType(1, config.field1.menuType);
  populateExtrasDropdownByType(2, config.field2.menuType);
  
  // Update job details section position
  updateJobDetailsSectionPosition();
}

// Function to populate extras dropdown based on menu type
function populateExtrasDropdownByType(fieldNumber, menuType) {
  const list = document.getElementById(`newPostExtrasMenuList${fieldNumber}`);
  if (!list) return;
  
  let options = [];
  
  // Get options based on menu type
  if (menuTypes[menuType]) {
    if (menuTypes[menuType].getOptions) {
      // Dynamic options (like location)
      options = menuTypes[menuType].getOptions();
      
      // Handle location fallback for cities without barangay data
      if (menuType === 'location' && options === null) {
        createBarangayInputFallback(fieldNumber);
        return;
      } else if (menuType === 'location') {
        restoreBarangayDropdown(fieldNumber);
      }
    } else {
      // Static options
      options = menuTypes[menuType].options;
    }
  }
  
  list.innerHTML = '';
  
  options.forEach(option => {
    const li = document.createElement('li');
    li.textContent = option;
    li.addEventListener('click', function() {
      document.getElementById(`newPostExtrasMenuLabel${fieldNumber}`).textContent = option;
      document.getElementById(`newPostExtrasMenuOverlay${fieldNumber}`).classList.remove('show');
    });
    list.appendChild(li);
  });
}

// Function to populate extras dropdown options (keeping for backward compatibility)
function populateExtrasDropdown(fieldNumber, options) {
  const list = document.getElementById(`newPostExtrasMenuList${fieldNumber}`);
  if (!list) return;
  
  list.innerHTML = '';
  
  options.forEach(option => {
    const li = document.createElement('li');
    li.textContent = option;
    li.addEventListener('click', function() {
      document.getElementById(`newPostExtrasMenuLabel${fieldNumber}`).textContent = option;
      document.getElementById(`newPostExtrasMenuOverlay${fieldNumber}`).classList.remove('show');
    });
    list.appendChild(li);
  });
}

// Extras dropdown event listeners
for (let i = 1; i <= 2; i++) {
  const extrasMenuBtn = document.getElementById(`newPostExtrasMenu${i}`);
  const extrasMenuOverlay = document.getElementById(`newPostExtrasMenuOverlay${i}`);
  
  if (extrasMenuBtn && extrasMenuOverlay) {
    extrasMenuBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      extrasMenuOverlay.classList.toggle('show');
    });

    // Close overlay when clicking outside
    document.addEventListener('click', function(e) {
      if (!extrasMenuBtn.contains(e.target) && !extrasMenuOverlay.contains(e.target)) {
        extrasMenuOverlay.classList.remove('show');
      }
    });
  }
}

// ========================== LOCATION DROPDOWN FUNCTIONALITY ==========================

// Region and city data (same as listing.js)
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

// Comprehensive Barangay Database
const barangaysByCity = {
  // CEBU PROVINCE
  "CEBU CITY": [
    "Adlaon", "Agsungot", "Apas", "Bacayan", "Banilad", "Binaliw", "Budla-an", "Buhisan", "Bulacao", "Busay", "Calamba", "Cambinocot", "Capitol Site", "Carreta", "Cogon Pardo", "Cogon Ramos", "Colon", "Day-as", "Duljo Fatima", "Ermita", "Guba", "Guadalupe", "Hipodromo", "Inayawan", "Kamagayan", "Kamputhaw", "Kasambagan", "Kinasang-an", "Labangon", "Lahug", "Lorega San Miguel", "Luz", "Mabini", "Mabolo", "Malubog", "Mambaling", "Pahina Central", "Pahina San Nicolas", "Pardo", "Pasil", "Pit-os", "Pulangbato", "Punta Princesa", "Pung-ol Sibugay", "Quiot", "Sambag I", "Sambag II", "San Antonio", "San Jose", "San Nicolas Proper", "San Roque", "Santa Cruz", "Santo Niño", "Sawang Calero", "Sinsin", "Sirao", "Suba", "Sudlon I", "Sudlon II", "Tabunan", "Tagba-o", "Talamban", "Taptap", "Tejero", "Tinago", "Tisa", "To-ong", "Zapatera"
  ],
  "Lapu-Lapu": [
    "Agus", "Babag", "Bankal", "Baring", "Basak", "Buaya", "Canjulao", "Caw-oy", "Caubian", "Gun-ob", "Ibo", "Looc", "Mactan", "Maribago", "Marigondon", "Pajac", "Pajo", "Poblacion", "Punta Engaño", "Pusok", "Sabang", "Santa Rosa", "Subabasbas", "Talima", "Tingo", "Tugbok"
  ],
  "Mandaue": [
    "Alang-alang", "Bakilid", "Banilad", "Basak", "Cabancalan", "Cambaro", "Canduman", "Casili", "Casuntingan", "Centro", "Cubacub", "Guizo", "Ibabao-Estancia", "Jagobiao", "Labogon", "Looc", "Maguikay", "Mantuyong", "Opao", "Pakna-an", "Pagsabungan", "San Jose", "Subangdaku", "Tabok", "Tawason", "Tipolo", "Umapad"
  ],
  "Talisay": [
    "Biasong", "Bulacao", "Cadulawan", "Camp Lapu-Lapu", "Candulawan", "Cansojong", "Dumlog", "Lagtang", "Lawaan I", "Lawaan II", "Lawaan III", "Linao", "Maghaway", "Manipis", "Mohon", "Poblacion", "Pooc", "San Isidro", "San Roque", "Tabunoc", "Tangke", "Tapul"
  ],
  "Minglanilla": [
    "Calajoan", "Cambulo", "Cuanos", "Guindaruhan", "Lipata", "Linao", "Pakigne", "Poblacion Ward I", "Poblacion Ward II", "Tunghaan", "Tungkil", "Tubod", "Vito"
  ],
  "Consolacion": [
    "Cabangahan", "Cansaga", "Casili", "Danlag", "Garing", "Jugan", "Lamac", "Lanipga", "Nangka", "Pitogo", "Poblacion Occidental", "Poblacion Oriental", "Pulpogan", "Sacsac", "Tayud", "Tilhaong", "Tolotolo", "Tugbongan"
  ],
  "Cordova": [
    "Alegria", "Bangbang", "Buagsong", "Catarman", "Day-as", "Gabi", "Gilutongan", "Ibabao", "Pilipog", "Poblacion"
  ],
  "Danao": [
    "Bayabas", "Binlod", "Cagat-lamac", "Cambanay", "Cambubho", "Cogon-cruz", "Danao", "Dungga", "Dunggoan", "Guinacot", "Guinsay", "Ibo", "Langosig", "Lawaan", "Licos", "Looc", "Magtagobtob", "Malapoc", "Mambalili", "Masaba", "Maslog", "Manlayag", "Nangka", "Oguis", "Pili", "Poblacion", "Sabang", "Sacsac", "Sandayong", "Santa Rosa", "Santican", "Sibayon", "Suba", "Taboc", "Tabok", "Togonon", "Tuburan"
  ],

  // BOHOL PROVINCE  
  "Tagbilaran City": [
    "Bool", "Booy", "Cabawan", "Cogon", "Dampas", "Dao", "Mansasa", "Poblacion I", "Poblacion II", "Poblacion III", "San Isidro", "Taloto", "Tiptip", "Ubujan"
  ],

  // LEYTE PROVINCE
  "Tacloban City": [
    "Abucay", "Apitong", "Bagacay", "Baras", "Bliss", "Buri", "Cabalawan", "Caibaan", "Camanchile", "Cancadarag", "Catagbacan", "Diit", "Downtown", "Fatima", "Guardia", "Humuya", "Lanzones", "Magsaysay", "Marasbaras", "New Kawayan", "Old Kawayan", "Palanog", "Pitogo", "Poblacion", "Rawis", "Sagkahan", "San Jose", "San Roque", "Santa Elena", "Santo Niño", "Suhi", "Tagpuro", "Tanghas", "V&G Subdivision", "Sto. Niño"
  ],
  "Ormoc City": [
    "Alegria", "Alta Vista", "Bagong Buhay", "Bantigue", "Barangay Poblacion", "Batuan", "Bato", "Bayog", "Biliboy", "Cabingtan", "Cabulihan", "Catmon", "Cogon Combado", "Concepcion", "Curva", "Danao", "Dolores", "Don Felipe Larrazabal", "Donghol", "Flores", "Gaas", "Green Valley", "Guintigui-an", "Hibunawon", "Ipil", "Labrador", "Lao", "Licuma", "Linao", "Luna", "Magaswi", "Mahayag", "Mahayahay", "Malbog", "Margen", "Mas-in", "Milagro", "Mim-osa", "Naungan", "Nichols", "Patag", "Pilar", "Puente", "Quezon Jr.", "Rufina", "Sabang Bao", "Salvacion", "San Isidro", "San Pablo", "Sibucao", "Simion", "Tambulilid", "Tongonan", "Tugbong", "Valencia", "Veloso"
  ],

  // DAVAO REGION
  "Davao City": [
    "Acacia", "Agdao", "Alambre", "Angalan", "Angliongto", "Aparicio", "Apo Sandawa", "Apokon", "Artiaga", "Atan-awe", "Badjao", "Bago Aplaya", "Bago Gallera", "Bago Oshiro", "Baguio", "Balamban", "Baracatan", "Barang", "Bato", "Binugao", "Bucana", "Buhangin", "Bunawan", "Cabantian", "Cadalian", "Cagayan de Oro", "Callawa", "Camansi", "Carmen", "Catalunan Grande", "Catalunan Pequeño", "Catigan", "Cawayan", "Centro", "Daliao", "Daliaon Plantation", "Dominga", "Eden", "Ecoland", "Fatima", "Gatungan", "Gov. Paciano Bangoy", "Gov. Generoso", "Guadalupe", "Gunong", "Hizon", "Ilang", "Indangan", "Kilate", "Lacson", "Lamanan", "Lampianao", "Langub", "Leon Garcia", "Lizada", "Los Amigos", "Lubogan", "Lumiad", "Ma-a", "Mabuhay", "Magsaysay", "Malabog", "Malamba", "Manambulan", "Mandug", "Manuel Guianga", "Marapangi", "Marilog", "Matina Aplaya", "Matina Crossing", "Matina Pangi", "Megkawayan", "Mintal", "Mudiang", "Mulig", "New Carmen", "New Valencia", "Obrero", "Pampanga", "Panacan", "Panalum", "Pangyan", "Paquibato", "Paradise Embac", "Poblacion", "Rafael Castillo", "Riverside", "Sabang", "Salapawan", "Salaysay", "Saloy", "San Antonio", "San Isidro", "Santo Tomas", "Sasa", "Sibulan", "Sirawan", "Suawan", "Subasta", "Sumimao", "Tacunan", "Tagakpan", "Tagurano", "Talandang", "Talomo", "Tamayong", "Tambobong", "Tapak", "Tawan-tawan", "Tibuloy", "Tibungco", "Tigatto", "Toril", "Tugbok", "Tule", "Tungkalan", "Ubalde", "Ula", "Vicente Hizon Sr.", "Waan", "Wangan", "Wilfredo Aquino"
  ],

  // METRO MANILA
  "Manila": [
    "Baseco Compound", "Binondo", "Ermita", "Intramuros", "Malate", "Paco", "Pandacan", "Port Area", "Quiapo", "Sampaloc", "San Andres", "San Miguel", "San Nicolas", "Santa Ana", "Santa Cruz", "Santa Mesa", "Tondo"
  ],
  "Quezon City": [
    "Alicia", "Amihan", "Apolonio Samson", "Aurora", "Baesa", "Bagong Lipunan ng Crame", "Bagong Pag-asa", "Bagong Silangan", "Bagumbayan", "Bagumbuhay", "Balingasa", "Balintawak", "Balong Bato", "Barangka", "Batasan Hills", "Botocan", "Bungad", "Camp Aguinaldo", "Central", "Claro", "Commonwealth", "Culiat", "Cubao", "Damayan", "Del Monte", "Diliman", "Don Manuel", "Dona Aurora", "Dona Imelda", "Dona Josefa", "Duyan-duyan", "E. Rodriguez", "East Kamias", "Escopa", "Fairview", "Galas", "Gulod", "Holy Spirit", "Horseshoe", "Immaculate Conception", "Kaligayahan", "Kalusugan", "Kamuning", "Katipunan", "Kaunlaran", "Kristong Hari", "Krus na Ligas", "Laging Handa", "Libis", "Lourdes", "Loyola Heights", "Lucban", "Maharlika", "Malaya", "Manresa", "Mariblo", "Marilag", "Masagana", "Masambong", "Matandang Balara", "Milagrosa", "N.S. Amoranto", "Nagkaisang Nayon", "Nayong Kanluran", "New Era", "North Fairview", "Novaliches Proper", "Obrero", "Old Balara", "Paang Bundok", "Pag-ibig sa Nayon", "Pagkakaisa", "Paligsahan", "Paltok", "Paraiso", "Pasong Putik Proper", "Pasong Tamo", "Payatas", "Phil-Am", "Pinagkaisahan", "Pinyahan", "Project 6", "Project 7", "Project 8", "Quirino 2-A", "Quirino 2-B", "Quirino 2-C", "Quirino 3-A", "Ramón Magsaysay", "Sacred Heart", "Salvacion", "San Antonio", "San Bartolome", "San Isidro", "San Jose", "San Martin de Porres", "San Roque", "San Vicente", "Sangandaan", "Santa Lucia", "Santa Monica", "Santa Teresita", "Santo Cristo", "Santo Domingo", "Santo Niño", "Santol", "Sauyo", "Sienna", "Silangan", "Socorro", "South Triangle", "St. Ignatius", "St. Peter", "Tagumpay", "Talayan", "Tatalon", "Teachers Village East", "Teachers Village West", "Ugong Norte", "Unang Sigaw", "UP Campus", "UP Village", "Valencia", "Vasra", "Veterans Village", "Villa Maria Clara", "West Kamias", "West Triangle", "White Plains"
  ]
};

let activeRegion = "CEBU";
let activeCity = "City/Town";

function renderRegionMenu() {
  const list = document.getElementById('newPostRegionMenuList');
  if (!list) return;
  
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
    list.appendChild(li);
  });
}

function renderCityMenu() {
  const list = document.getElementById('newPostCityMenuList');
  if (!list) return;
  
  list.innerHTML = '';
  const cities = citiesByRegion[activeRegion] || [];
  
  // Top item with arrow (current selection)
  const top = document.createElement('li');
  top.textContent = activeCity;
  top.className = 'active';
  const arrow = document.createElement('span');
  arrow.className = 'arrow';
  arrow.innerHTML = '&#9650;';
  top.appendChild(arrow);
  list.appendChild(top);
  
  // If activeCity is "City/Town", show all cities as options
  // If activeCity is an actual city, show other cities excluding the active one
  const citiesToShow = activeCity === "City/Town" ? cities : cities.filter(c => c !== activeCity);
  
  citiesToShow.forEach(city => {
    const li = document.createElement('li');
    li.textContent = city;
    list.appendChild(li);
  });
  
  // Dynamically set overlay width to fit longest city name
  setTimeout(() => {
    const overlay = document.getElementById('newPostCityMenuOverlay');
    if (!overlay) return;
    
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

// Dynamic font size adjustment for city menu label (copied from listing.js)
function updateCityMenuLabelFontSize() {
  const label = document.getElementById('newPostCityMenuLabel');
  const btn = document.querySelector('.new-post-city-menu');
  if (!label || !btn) return;
  
  // RESET inline style first to get original CSS font size
  label.style.fontSize = '';
  
  // Now get the actual CSS default font size
  const computed = window.getComputedStyle(label);
  let defaultFontSize = parseFloat(computed.fontSize);
  let fontSize = defaultFontSize;
  
  // Reduce font size until it fits or hits minimum
  while (label.scrollWidth > btn.clientWidth - 32 && fontSize > 12) {
    fontSize -= 1;
    label.style.fontSize = fontSize + 'px';
  }
}

// Initialize menus
function initializeLocationMenus() {
  renderRegionMenu();
  renderCityMenu();
  
  // Update labels
  const regionLabel = document.getElementById('newPostRegionMenuLabel');
  const cityLabel = document.getElementById('newPostCityMenuLabel');
  
  if (regionLabel) regionLabel.textContent = activeRegion;
  if (cityLabel) cityLabel.textContent = activeCity;
  
  setTimeout(updateCityMenuLabelFontSize, 0);
}

// Region menu event listeners
const regionMenuBtn = document.querySelector('.new-post-region-menu');
const regionMenuOverlay = document.getElementById('newPostRegionMenuOverlay');
let regionMenuOpen = false;

if (regionMenuBtn && regionMenuOverlay) {
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
      document.getElementById('newPostRegionMenuLabel').textContent = activeRegion;
      
      // When region changes, reset city to "City/Town" to force user selection
      activeCity = "City/Town";
      document.getElementById('newPostCityMenuLabel').textContent = activeCity;
      setTimeout(updateCityMenuLabelFontSize, 0);
      
      renderRegionMenu();
      renderCityMenu();
      regionMenuOverlay.classList.remove('show');
      regionMenuOpen = false;
    }
  });
}

// City menu event listeners
const cityMenuBtn = document.querySelector('.new-post-city-menu');
const cityMenuOverlay = document.getElementById('newPostCityMenuOverlay');
let cityMenuOpen = false;

if (cityMenuBtn && cityMenuOverlay) {
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
      document.getElementById('newPostCityMenuLabel').textContent = activeCity;
      setTimeout(updateCityMenuLabelFontSize, 0);
      renderCityMenu();
      cityMenuOverlay.classList.remove('show');
      cityMenuOpen = false;
      
      // Update location-based extras when city changes
      updateLocationExtrasForCityChange();
    }
  });
}

// ========================== TIME DROPDOWN FUNCTIONALITY ==========================

// Initialize time dropdown functionality
function initializeTimeDropdowns() {
  // Start time dropdown
  const startTimeBtn = document.getElementById('jobTimeStartInput');
  const startTimeOverlay = document.getElementById('jobTimeStartOverlay');
  const startTimeLabel = document.getElementById('jobTimeStartLabel');
  
  // End time dropdown
  const endTimeBtn = document.getElementById('jobTimeEndInput');
  const endTimeOverlay = document.getElementById('jobTimeEndOverlay');
  const endTimeLabel = document.getElementById('jobTimeEndLabel');
  
  let startTimeOpen = false;
  let endTimeOpen = false;
  
  // Move overlays to body to avoid clipping issues
  if (startTimeOverlay) {
    document.body.appendChild(startTimeOverlay);
  }
  if (endTimeOverlay) {
    document.body.appendChild(endTimeOverlay);
  }
  
  // Function to position overlay relative to button
  function positionOverlay(button, overlay) {
    const rect = button.getBoundingClientRect();
    overlay.style.position = 'fixed';
    overlay.style.top = (rect.bottom + 2) + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
  }
  
  // Start time dropdown events
  if (startTimeBtn && startTimeOverlay) {
    startTimeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Close end time if open
      if (endTimeOpen) {
        endTimeOverlay.classList.remove('show');
        endTimeOpen = false;
      }
      
      // Position and show overlay
      positionOverlay(startTimeBtn, startTimeOverlay);
      startTimeOverlay.classList.toggle('show');
      startTimeOpen = !startTimeOpen;
    });
    
    // Handle start time selection
    startTimeOverlay.addEventListener('click', function(e) {
      if (e.target.tagName === 'LI') {
        e.preventDefault();
        const selectedValue = e.target.getAttribute('data-value');
        const selectedText = e.target.textContent;
        startTimeLabel.textContent = selectedText;
        startTimeOverlay.classList.remove('show');
        startTimeOpen = false;
        
        // Remove active class from all options
        startTimeOverlay.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        // Add active class to selected option
        e.target.classList.add('active');
      }
    });
  }
  
  // End time dropdown events
  if (endTimeBtn && endTimeOverlay) {
    endTimeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Close start time if open
      if (startTimeOpen) {
        startTimeOverlay.classList.remove('show');
        startTimeOpen = false;
      }
      
      // Position and show overlay
      positionOverlay(endTimeBtn, endTimeOverlay);
      endTimeOverlay.classList.toggle('show');
      endTimeOpen = !endTimeOpen;
    });
    
    // Handle end time selection
    endTimeOverlay.addEventListener('click', function(e) {
      if (e.target.tagName === 'LI') {
        e.preventDefault();
        const selectedValue = e.target.getAttribute('data-value');
        const selectedText = e.target.textContent;
        endTimeLabel.textContent = selectedText;
        endTimeOverlay.classList.remove('show');
        endTimeOpen = false;
        
        // Remove active class from all options
        endTimeOverlay.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        // Add active class to selected option
        e.target.classList.add('active');
      }
    });
  }
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (startTimeOpen && startTimeBtn && startTimeOverlay && 
        !startTimeBtn.contains(e.target) && !startTimeOverlay.contains(e.target)) {
      startTimeOverlay.classList.remove('show');
      startTimeOpen = false;
    }
    
    if (endTimeOpen && endTimeBtn && endTimeOverlay && 
        !endTimeBtn.contains(e.target) && !endTimeOverlay.contains(e.target)) {
      endTimeOverlay.classList.remove('show');
      endTimeOpen = false;
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (startTimeOpen) {
        startTimeOverlay.classList.remove('show');
        startTimeOpen = false;
      }
      if (endTimeOpen) {
        endTimeOverlay.classList.remove('show');
        endTimeOpen = false;
      }
    }
  });
}

// Initialize AM/PM dropdown functionality
function initializeTimePeriodDropdowns() {
  
  // Start time period dropdown
  const startPeriodBtn = document.getElementById('jobTimeStartPeriod');
  const startPeriodOverlay = document.getElementById('jobTimeStartPeriodOverlay');
  const startPeriodLabel = document.getElementById('jobTimeStartPeriodLabel');
  
  // End time period dropdown
  const endPeriodBtn = document.getElementById('jobTimeEndPeriod');
  const endPeriodOverlay = document.getElementById('jobTimeEndPeriodOverlay');
  const endPeriodLabel = document.getElementById('jobTimeEndPeriodLabel');
  
  let startPeriodOpen = false;
  let endPeriodOpen = false;
  
  // Move overlays to body to avoid clipping issues
  if (startPeriodOverlay) {
    document.body.appendChild(startPeriodOverlay);
  }
  if (endPeriodOverlay) {
    document.body.appendChild(endPeriodOverlay);
  }
  
  // Function to position overlay relative to button
  function positionOverlay(button, overlay) {
    const rect = button.getBoundingClientRect();
    overlay.style.position = 'fixed';
    overlay.style.top = (rect.bottom + 2) + 'px';
    overlay.style.left = rect.left + 'px';
    overlay.style.width = rect.width + 'px';
  }
  
  // Start period dropdown events
  if (startPeriodBtn && startPeriodOverlay) {
    startPeriodBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Close end period if open
      if (endPeriodOpen) {
        endPeriodOverlay.classList.remove('show');
        endPeriodOpen = false;
      }
      
      // Position and show overlay
      positionOverlay(startPeriodBtn, startPeriodOverlay);
      startPeriodOverlay.classList.toggle('show');
      startPeriodOpen = !startPeriodOpen;
    });
    
    // Handle start period selection
    startPeriodOverlay.addEventListener('click', function(e) {
      if (e.target.tagName === 'LI') {
        e.preventDefault();
        const selectedValue = e.target.getAttribute('data-value');
        const selectedText = e.target.textContent;
        startPeriodLabel.textContent = selectedText;
        startPeriodOverlay.classList.remove('show');
        startPeriodOpen = false;
        
        // Remove active class from all options
        startPeriodOverlay.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        // Add active class to selected option
        e.target.classList.add('active');
      }
    });
  }
  
  // End period dropdown events
  if (endPeriodBtn && endPeriodOverlay) {
    endPeriodBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      // Close start period if open
      if (startPeriodOpen) {
        startPeriodOverlay.classList.remove('show');
        startPeriodOpen = false;
      }
      
      // Position and show overlay
      positionOverlay(endPeriodBtn, endPeriodOverlay);
      endPeriodOverlay.classList.toggle('show');
      endPeriodOpen = !endPeriodOpen;
    });
    
    // Handle end period selection
    endPeriodOverlay.addEventListener('click', function(e) {
      if (e.target.tagName === 'LI') {
        e.preventDefault();
        const selectedValue = e.target.getAttribute('data-value');
        const selectedText = e.target.textContent;
        endPeriodLabel.textContent = selectedText;
        endPeriodOverlay.classList.remove('show');
        endPeriodOpen = false;
        
        // Remove active class from all options
        endPeriodOverlay.querySelectorAll('li').forEach(li => li.classList.remove('active'));
        // Add active class to selected option
        e.target.classList.add('active');
      }
    });
  }
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', function(e) {
    if (startPeriodOpen && startPeriodBtn && startPeriodOverlay && 
        !startPeriodBtn.contains(e.target) && !startPeriodOverlay.contains(e.target)) {
      startPeriodOverlay.classList.remove('show');
      startPeriodOpen = false;
    }
    
    if (endPeriodOpen && endPeriodBtn && endPeriodOverlay && 
        !endPeriodBtn.contains(e.target) && !endPeriodOverlay.contains(e.target)) {
      endPeriodOverlay.classList.remove('show');
      endPeriodOpen = false;
    }
  });
  
  // Close on Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (startPeriodOpen) {
        startPeriodOverlay.classList.remove('show');
        startPeriodOpen = false;
      }
      if (endPeriodOpen) {
        endPeriodOverlay.classList.remove('show');
        endPeriodOpen = false;
      }
    }
  });
}

// ========================== PAYMENT OFFER FUNCTIONALITY ==========================

// Payment type dropdown functionality
let selectedPaymentType = "PER HOUR";

function initializePaymentDropdown() {
  const paymentTypeMenu = document.getElementById('paymentTypeMenu');
  const paymentTypeOverlay = document.getElementById('paymentTypeOverlay');
  const paymentTypeLabel = document.getElementById('paymentTypeLabel');
  const paymentTypeList = document.getElementById('paymentTypeList');

  if (!paymentTypeMenu || !paymentTypeOverlay || !paymentTypeLabel || !paymentTypeList) {
    return;
  }

  // Toggle dropdown on menu click
  paymentTypeMenu.addEventListener('click', function(e) {
    e.stopPropagation();
    paymentTypeOverlay.classList.toggle('show');
  });

  // Handle option selection
  paymentTypeList.addEventListener('click', function(e) {
    if (e.target.tagName === 'LI') {
      const value = e.target.getAttribute('data-value');
      selectedPaymentType = value;
      paymentTypeLabel.textContent = value;
      paymentTypeOverlay.classList.remove('show');
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (!paymentTypeMenu.contains(e.target)) {
      paymentTypeOverlay.classList.remove('show');
    }
  });

  // Close dropdown on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      paymentTypeOverlay.classList.remove('show');
    }
  });
}

// ========================== PHOTO UPLOAD FUNCTIONALITY ==========================

// Global variable to store processed image data
let processedJobPhoto = null;

function processImageTo500x281(file, callback) {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  img.onload = function() {
    // Target dimensions: 500px width, 16:9 ratio (281px height)
    const targetWidth = 500;
    const targetHeight = 281;
    
    // Calculate scaling to maintain aspect ratio while fitting in target dimensions
    const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
    const scaledWidth = img.width * scale;
    const scaledHeight = img.height * scale;
    
    // Calculate crop offsets to center the image
    const offsetX = (scaledWidth - targetWidth) / 2;
    const offsetY = (scaledHeight - targetHeight) / 2;
    
    // Set canvas dimensions
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    // Draw the scaled and cropped image
    ctx.drawImage(
      img, 
      -offsetX, -offsetY, 
      scaledWidth, scaledHeight
    );
    
    // Convert canvas to blob/data URL
    canvas.toBlob(function(blob) {
      const processedDataURL = canvas.toDataURL('image/jpeg', 0.9);
      
      // Store processed image data globally for future use
      processedJobPhoto = {
        blob: blob,
        dataURL: processedDataURL,
        width: targetWidth,
        height: targetHeight,
        originalFile: file
      };
      
      callback(processedDataURL);
    }, 'image/jpeg', 0.9);
  };
  
  // Load the image
  const reader = new FileReader();
  reader.onload = function(e) {
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function initializePhotoUpload() {
  const photoInput = document.getElementById('jobPhotoInput');
  const uploadArea = document.getElementById('photoUploadArea');
  const previewArea = document.getElementById('photoPreviewArea');
  const previewImage = document.getElementById('photoPreviewImage');
  const changeBtn = document.getElementById('photoChangeBtn');

  if (!photoInput || !uploadArea || !previewArea || !previewImage || !changeBtn) {
    return;
  }

  // Handle upload area click
  uploadArea.addEventListener('click', function() {
    photoInput.click();
  });

  // Handle change button click
  changeBtn.addEventListener('click', function() {
    photoInput.click();
  });

  // Handle file selection
  photoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    
    if (file && file.type.startsWith('image/')) {
      // Show loading state (optional enhancement)
      uploadArea.style.opacity = '0.5';
      
      // Process image to 500x281 dimensions
      processImageTo500x281(file, function(processedDataURL) {
        // Update preview with processed image
        previewImage.src = processedDataURL;
        
        // Add data attributes for future job preview page integration
        previewImage.setAttribute('data-job-photo-processed', 'true');
        previewImage.setAttribute('data-job-photo-width', '500');
        previewImage.setAttribute('data-job-photo-height', '281');
        
        // Switch from upload to preview state
        uploadArea.style.opacity = '1';
        uploadArea.style.display = 'none';
        previewArea.style.display = 'flex';
        
        console.log('Image processed successfully:', processedJobPhoto);
      });
    }
  });
}

// ========================== POST JOB BUTTON FUNCTIONALITY ==========================

function initializePostJobButton() {
  const postJobBtn = document.getElementById('postJobBtn');
  
  if (!postJobBtn) {
    return;
  }
  
  postJobBtn.addEventListener('click', function(e) {
    e.preventDefault();
    
    // Add visual feedback
    this.style.transform = 'translateY(2px)';
    setTimeout(() => {
      this.style.transform = '';
    }, 150);
    
    // Show preview overlay
    showPreviewOverlay();
  });
}

// ========================== PREVIEW OVERLAY FUNCTIONALITY ==========================

function showPreviewOverlay() {
  // Validate required fields first
  const validationResult = validateRequiredFields();
  if (!validationResult.isValid) {
    alert(validationResult.message);
    return;
  }
  
  const previewOverlay = document.getElementById('previewOverlay');
  if (!previewOverlay) return;
  
  // Populate preview data
  populatePreviewData();
  
  // Show overlay
  previewOverlay.style.display = 'flex';
  
  // Add event listeners for preview overlay
  initializePreviewOverlayEvents();
}

// ========================== FORM VALIDATION ==========================

function validateRequiredFields() {
  const errors = [];
  
  // Check job category selection
  if (!window.selectedJobCategory) {
    errors.push("• Please select a job type");
  }
  
  // Check location selection
  const region = document.getElementById('newPostRegionMenuLabel').textContent;
  const city = document.getElementById('newPostCityMenuLabel').textContent;
  if (region === 'CEBU' && city === 'City/Town') {
    errors.push("• Please select a city/town");
  }
  
  // Check job title
  const jobTitle = document.getElementById('jobTitleInput').value.trim();
  if (!jobTitle) {
    errors.push("• Please enter a job title");
  }
  
  // Check job date
  const jobDate = document.getElementById('jobDateInput').value;
  if (!jobDate) {
    errors.push("• Please select a job date");
  }
  
  // Check job time
  const startHour = document.getElementById('jobTimeStartLabel').textContent;
  const endHour = document.getElementById('jobTimeEndLabel').textContent;
  if (startHour === 'Hour' || endHour === 'Hour') {
    errors.push("• Please select start and end times");
  }
  
  // Check job description
  const description = document.getElementById('jobDetailsTextarea').value.trim();
  if (!description) {
    errors.push("• Please enter a job description");
  }
  
  // Check payment amount
  const paymentAmount = document.getElementById('paymentAmountInput').value;
  if (!paymentAmount || paymentAmount === '0') {
    errors.push("• Please enter a payment amount");
  }
  
  // Check category-specific extras if visible
  const extrasHeader = document.getElementById('newPostExtrasHeader');
  if (extrasHeader && extrasHeader.style.display !== 'none') {
    const value1 = document.getElementById('newPostExtrasMenuLabel1').textContent;
    const value2 = document.getElementById('newPostExtrasMenuLabel2').textContent;
    const input1 = document.getElementById('newPostExtrasInput1');
    const input2 = document.getElementById('newPostExtrasInput2');
    
    // Check field 1
    if (value1 === 'Select Option' && (!input1 || !input1.value.trim())) {
      const label1 = document.getElementById('newPostExtrasLabel1').textContent;
      errors.push(`• Please specify ${label1.toLowerCase()}`);
    }
    
    // Check field 2
    if (value2 === 'Select Option' && (!input2 || !input2.value.trim())) {
      const label2 = document.getElementById('newPostExtrasLabel2').textContent;
      errors.push(`• Please specify ${label2.toLowerCase()}`);
    }
  }
  
  // Return validation result
  if (errors.length > 0) {
    return {
      isValid: false,
      message: "Please complete the following required fields:\n\n" + errors.join("\n")
    };
  }
  
  return { isValid: true };
}

function populatePreviewData() {
  // Get form data
  const formData = getFormData();
  
  // Populate category
  const categoryElement = document.getElementById('previewCategory');
  categoryElement.textContent = formData.category || 'Job Type Not Selected';
  
  // Populate location
  const locationElement = document.getElementById('previewLocation');
  locationElement.textContent = `${formData.region}, ${formData.city}` || 'Location Not Selected';
  
  // Populate job title
  const titleElement = document.getElementById('previewJobTitle');
  titleElement.textContent = formData.jobTitle || 'Job Title Not Provided';
  
  // Populate photo
  const photoSection = document.getElementById('previewPhotoSection');
  const photoElement = document.getElementById('previewPhoto');
  if (formData.photo) {
    photoElement.src = formData.photo;
    photoSection.style.display = 'block';
  } else {
    photoSection.style.display = 'none';
  }
  
  // Populate date
  const dateElement = document.getElementById('previewDate');
  if (formData.jobDate) {
    // Parse date components to avoid timezone issues
    const [year, month, day] = formData.jobDate.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    dateElement.textContent = date.toLocaleDateString('en-US', options);
  } else {
    dateElement.textContent = 'Date Not Selected';
  }
  
  // Populate time
  const timeElement = document.getElementById('previewTime');
      if (formData.startTime && formData.endTime) {
      timeElement.textContent = `${formData.startTime} to ${formData.endTime}`;
  } else {
    timeElement.textContent = 'Time Not Selected';
  }
  
  // Populate extras
  const extrasRow = document.getElementById('previewExtrasRow');
  if (formData.extras && formData.extras.length > 0) {
    // Populate field 1
    if (formData.extras[0]) {
      const parts1 = formData.extras[0].split(':');
      if (parts1.length >= 2) {
        document.getElementById('previewExtrasLabel1').textContent = parts1[0].trim() + ':';
        document.getElementById('previewExtrasValue1').textContent = parts1[1].trim() || 'Not Specified';
      } else {
        document.getElementById('previewExtrasLabel1').textContent = 'FIELD 1:';
        document.getElementById('previewExtrasValue1').textContent = formData.extras[0];
      }
    }
    
    // Populate field 2
    if (formData.extras[1]) {
      const parts2 = formData.extras[1].split(':');
      if (parts2.length >= 2) {
        document.getElementById('previewExtrasLabel2').textContent = parts2[0].trim() + ':';
        document.getElementById('previewExtrasValue2').textContent = parts2[1].trim() || 'Not Specified';
      } else {
        document.getElementById('previewExtrasLabel2').textContent = 'FIELD 2:';
        document.getElementById('previewExtrasValue2').textContent = formData.extras[1];
      }
    }
    
    extrasRow.style.display = 'flex';
  } else {
    extrasRow.style.display = 'none';
  }
  
  // Populate description
  const descriptionElement = document.getElementById('previewDescription');
  descriptionElement.textContent = formData.description || 'No description provided';
  
  // Populate payment
  const paymentAmountElement = document.getElementById('previewPaymentAmount');
  const paymentRateElement = document.getElementById('previewPaymentRate');
  
  if (formData.paymentAmount) {
    paymentAmountElement.textContent = `₱${formData.paymentAmount}`;
  } else {
    paymentAmountElement.textContent = '₱0';
  }
  
  if (formData.paymentType) {
    paymentRateElement.textContent = formData.paymentType;
  } else {
    paymentRateElement.textContent = 'Per Hour';
  }
}

function getFormData() {
  const data = {};
  
  // Get selected category
  data.category = window.selectedJobCategory || null;
  
  // Get selected region and city
  data.region = document.getElementById('newPostRegionMenuLabel').textContent;
  data.city = document.getElementById('newPostCityMenuLabel').textContent;
  
  // Get job details
  data.jobTitle = document.getElementById('jobTitleInput').value.trim();
  data.jobDate = document.getElementById('jobDateInput').value;
  
  // Get time
  const startHour = document.getElementById('jobTimeStartLabel').textContent;
  const startPeriod = document.getElementById('jobTimeStartPeriodLabel').textContent;
  const endHour = document.getElementById('jobTimeEndLabel').textContent;
  const endPeriod = document.getElementById('jobTimeEndPeriodLabel').textContent;
  
  if (startHour !== 'Hour' && endHour !== 'Hour') {
    data.startTime = `${startHour}${startPeriod}`;
    data.endTime = `${endHour}${endPeriod}`;
  }
  
  // Get photo
  const photoPreview = document.getElementById('photoPreviewImage');
  if (photoPreview && photoPreview.src && !photoPreview.src.includes('data:,')) {
    data.photo = photoPreview.src;
  }
  
  // Get extras
  data.extras = [];
  const extrasHeader = document.getElementById('newPostExtrasHeader');
  if (extrasHeader && extrasHeader.style.display !== 'none') {
    // Get field 1
    const label1 = document.getElementById('newPostExtrasLabel1').textContent;
    const value1 = document.getElementById('newPostExtrasMenuLabel1').textContent;
    const input1 = document.getElementById('newPostExtrasInput1');
    
    if (value1 && value1 !== 'Select Option') {
      data.extras.push(`${label1} ${value1}`);
    } else if (input1 && input1.value.trim()) {
      data.extras.push(`${label1} ${input1.value.trim()}`);
    }
    
    // Get field 2
    const label2 = document.getElementById('newPostExtrasLabel2').textContent;
    const value2 = document.getElementById('newPostExtrasMenuLabel2').textContent;
    const input2 = document.getElementById('newPostExtrasInput2');
    
    if (value2 && value2 !== 'Select Option') {
      data.extras.push(`${label2} ${value2}`);
    } else if (input2 && input2.value.trim()) {
      data.extras.push(`${label2} ${input2.value.trim()}`);
    }
  }
  
  // Get description
  data.description = document.getElementById('jobDetailsTextarea').value.trim();
  
  // Get payment
  data.paymentType = document.getElementById('paymentTypeLabel').textContent;
  data.paymentAmount = document.getElementById('paymentAmountInput').value;
  
  return data;
}

function initializePreviewOverlayEvents() {
  const previewOverlay = document.getElementById('previewOverlay');
  const closeBtn = document.getElementById('previewCloseBtn');
  const editBtn = document.getElementById('previewEditBtn');
  const postBtn = document.getElementById('previewPostBtn');
  
  // Remove existing event listeners by cloning and replacing elements
  if (closeBtn && !closeBtn.dataset.listenerAdded) {
    closeBtn.addEventListener('click', function() {
      previewOverlay.style.display = 'none';
    });
    closeBtn.dataset.listenerAdded = 'true';
  }
  
  if (editBtn && !editBtn.dataset.listenerAdded) {
    editBtn.addEventListener('click', function() {
      previewOverlay.style.display = 'none';
    });
    editBtn.dataset.listenerAdded = 'true';
  }
  
  // Post job button - remove and re-add to prevent duplicates
  if (postBtn) {
    // Clone the button to remove all existing event listeners
    const newPostBtn = postBtn.cloneNode(true);
    postBtn.parentNode.replaceChild(newPostBtn, postBtn);
    
    // Add fresh event listener to the new button
    newPostBtn.addEventListener('click', function() {
      // Get form data
      const formData = getFormData();
      
      // Create the job post
      createJobPost(formData);
    });
  }
  
  // Background and escape listeners - only add once
  if (!previewOverlay.dataset.backgroundListenerAdded) {
    previewOverlay.addEventListener('click', function(e) {
      if (e.target === previewOverlay) {
        previewOverlay.style.display = 'none';
      }
    });
    previewOverlay.dataset.backgroundListenerAdded = 'true';
  }
  
  if (!document.dataset.escapeListenerAdded) {
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && previewOverlay.style.display === 'flex') {
        previewOverlay.style.display = 'none';
      }
    });
    document.dataset.escapeListenerAdded = 'true';
  }
}

// ========================== JOB CREATION FUNCTIONALITY ==========================

async function createJobPost(formData) {
  try {
    // Show loading state
    const previewOverlay = document.getElementById('previewOverlay');
    const postBtn = document.getElementById('previewPostBtn');
    const originalText = postBtn.textContent;
    postBtn.textContent = 'POSTING...';
    postBtn.disabled = true;
    
    // Get the next available job number for this category
    const jobNumber = getNextJobNumber(formData.category);
    
    // Create the job template file
    await createJobTemplate(formData, jobNumber);
    
    // Add job preview card to listing page
    await addJobPreviewCard(formData, jobNumber);
    
    // Store job data in localStorage
    storeJobData(formData, jobNumber);
    
    // Close preview overlay
    previewOverlay.style.display = 'none';
    
    // Show success message
    alert('Job posted successfully!');
    
    // Redirect to the appropriate listing page
    window.location.href = `${formData.category}.html`;
    
  } catch (error) {
    console.error('Error creating job post:', error);
    alert('Error posting job. Please try again.');
    
    // Reset button state
    const postBtn = document.getElementById('previewPostBtn');
    postBtn.textContent = 'POST JOB';
    postBtn.disabled = false;
  }
}

function getNextJobNumber(category) {
  // Get existing job numbers from localStorage
  const jobData = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  const categoryJobs = jobData[category] || [];
  
  // Find the highest job number and add 1
  let maxJobNumber = 0;
  categoryJobs.forEach(job => {
    const jobNumber = parseInt(job.jobNumber) || 0;
    if (jobNumber > maxJobNumber) {
      maxJobNumber = jobNumber;
    }
  });
  
  return maxJobNumber + 1;
}

function storeJobData(formData, jobNumber) {
  // Get existing data
  const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  
  // Initialize category array if it doesn't exist
  if (!allJobs[formData.category]) {
    allJobs[formData.category] = [];
  }
  
  // Create job object
  const jobObject = {
    jobNumber: jobNumber,
    ...formData,
    createdAt: new Date().toISOString()
  };
  
  // Add to category array
  allJobs[formData.category].push(jobObject);
  
  // Save back to localStorage
  localStorage.setItem('gisugoJobs', JSON.stringify(allJobs));
}

async function createJobTemplate(formData, jobNumber) {
  // Since we can't actually write files from JavaScript, we'll simulate this
  // In a real implementation, this would send data to a server
  
  // For now, we'll create a URL that points to the template
  const templateUrl = `public/jobs/${formData.category}/${formData.category}-job-2025-${jobNumber}.html`;
  
  // Store the template data in localStorage to simulate file creation
  const templateData = {
    category: formData.category,
    jobNumber: jobNumber,
    title: formData.jobTitle,
    description: formData.description,
    date: formData.jobDate,
    startTime: formData.startTime,
    endTime: formData.endTime,
    region: formData.region,
    city: formData.city,
    paymentAmount: formData.paymentAmount,
    paymentType: formData.paymentType,
    photo: formData.photo,
    extras: formData.extras,
    templateUrl: templateUrl
  };
  
  localStorage.setItem(`jobTemplate_${formData.category}_${jobNumber}`, JSON.stringify(templateData));
  
  return templateUrl;
}

async function addJobPreviewCard(formData, jobNumber) {
  // Get existing preview cards from localStorage
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  
  // Initialize category array if it doesn't exist
  if (!previewCards[formData.category]) {
    previewCards[formData.category] = [];
  }
  
  // Format date for display
  const date = new Date(formData.jobDate);
  const options = { month: 'short', day: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', options);
  
  // Format time for display
      const timeDisplay = `${formData.startTime} - ${formData.endTime}`;
  
  // Get first two extras for preview
  const extra1 = formData.extras && formData.extras[0] ? formData.extras[0] : '';
  const extra2 = formData.extras && formData.extras[1] ? formData.extras[1] : '';
  
  // Create preview card object
  const previewCard = {
    jobNumber: jobNumber,
    title: formData.jobTitle,
    extra1: extra1,
    extra2: extra2,
    price: `₱${formData.paymentAmount}`,
    rate: formData.paymentType,
    date: formattedDate,
    time: timeDisplay,
    photo: formData.photo || `public/mock/mock-${formData.category}-post${jobNumber}.jpg`,
    templateUrl: `dynamic-job.html?category=${formData.category}&jobNumber=${jobNumber}`,
    createdAt: new Date().toISOString()
  };
  
  // Add to category array (insert at beginning for newest first)
  previewCards[formData.category].unshift(previewCard);
  
  // Save back to localStorage
  localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
}

// ========================== PAYMENT AMOUNT VALIDATION ==========================

function initializePaymentValidation() {
  const paymentInput = document.getElementById('paymentAmountInput');
  
  if (!paymentInput) {
    return;
  }
  
  // Handle input changes (remove decimals, enforce max)
  paymentInput.addEventListener('input', function(e) {
    let value = e.target.value;
    
    // Remove any decimal points and everything after
    value = value.split('.')[0];
    
    // Convert to number and check max limit
    let numValue = parseInt(value) || 0;
    if (numValue > 9999) {
      numValue = 9999;
    }
    
    // Update the input value
    e.target.value = numValue === 0 ? '' : numValue;
  });
  
  // Prevent decimal point and other invalid characters from being typed
  paymentInput.addEventListener('keypress', function(e) {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return;
    }
    
    // Ensure that it's a number and stop the keypress if it's not
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
    
    // Check if adding this digit would exceed 9999
    const currentValue = e.target.value;
    const futureValue = currentValue + String.fromCharCode(e.keyCode);
    if (parseInt(futureValue) > 9999) {
      e.preventDefault();
    }
  });
  
  // Handle paste events
  paymentInput.addEventListener('paste', function(e) {
    setTimeout(() => {
      let value = e.target.value;
      value = value.split('.')[0]; // Remove decimals
      let numValue = parseInt(value) || 0;
      if (numValue > 9999) {
        numValue = 9999;
      }
      e.target.value = numValue === 0 ? '' : numValue;
    }, 1);
  });
}

// ========================== JOB TITLE CHARACTER COUNTER ==========================

function initializeJobTitleCharacterCounter() {
  const jobTitleInput = document.getElementById('jobTitleInput');
  const characterCounter = document.getElementById('jobTitleCounter');
  
  if (!jobTitleInput || !characterCounter) {
    return;
  }
  
  function updateCharacterCounter() {
    const currentLength = jobTitleInput.value.length;
    const remainingChars = 55 - currentLength;
    
    characterCounter.textContent = remainingChars;
    
    // Remove all classes first
    characterCounter.classList.remove('warning', 'danger');
    
    // Add appropriate class based on remaining characters
    if (remainingChars <= 5) {
      characterCounter.classList.add('danger');
    } else if (remainingChars <= 10) {
      characterCounter.classList.add('warning');
    }
  }
  
  // Update counter on input
  jobTitleInput.addEventListener('input', updateCharacterCounter);
  
  // Initial update
  updateCharacterCounter();
}

// ========================== MOBILE KEYBOARD CLOSE FUNCTIONALITY ==========================

function initializeMobileKeyboardClose() {
  const jobTitleInput = document.getElementById('jobTitleInput');
  const paymentAmountInput = document.getElementById('paymentAmountInput');
  
  // Close keyboard on Enter key for Job Title input
  if (jobTitleInput) {
    // Use capture phase to catch event before it bubbles
    jobTitleInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        // Force blur after a small delay to ensure keyboard closes
        setTimeout(() => {
          this.blur();
          // Focus on a non-input element to prevent jumping
          document.activeElement.blur();
        }, 10);
        
        return false;
      }
    }, true); // Use capture phase
    
    // Also prevent on keypress with capture
    jobTitleInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    }, true);
    
    // Additional safety - prevent on keyup
    jobTitleInput.addEventListener('keyup', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return false;
      }
    }, true);
  }
  
  // Close keyboard on Enter key for Payment Amount input
  if (paymentAmountInput) {
    paymentAmountInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        this.blur(); // Close mobile keyboard
      }
    });
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeLocationMenus();
  initializeTimeDropdowns(); // Add time dropdown initialization
  initializeTimePeriodDropdowns(); // Add AM/PM dropdown initialization for mobile
  initializePaymentDropdown(); // Add payment dropdown initialization
  initializePhotoUpload(); // Add photo upload initialization
  initializePostJobButton(); // Add post job button initialization
  initializePaymentValidation(); // Add payment amount validation
  initializeJobTitleCharacterCounter(); // Add job title character counter
  initializeMobileKeyboardClose(); // Add mobile keyboard close functionality
});

// Call updateCityMenuLabelFontSize on window resize
window.addEventListener('resize', updateCityMenuLabelFontSize);

// No longer need resize handling for positioning since everything is in document flow

// Function to update location-based extras when city changes
function updateLocationExtrasForCityChange() {
  // Check if extras are currently visible
  const extrasHeader = document.getElementById('newPostExtrasHeader');
  if (!extrasHeader || extrasHeader.style.display === 'none') {
    return; // No extras to update
  }
  
  // Get current category to determine which fields are location-based
  const currentCategory = window.selectedJobCategory;
  if (!currentCategory || !extrasConfig[currentCategory]) {
    return;
  }
  
  const config = extrasConfig[currentCategory];
  
  // Update field 1 if it's location-based
  if (config.field1.menuType === 'location') {
    document.getElementById('newPostExtrasMenuLabel1').textContent = 'Select Option';
    populateExtrasDropdownByType(1, 'location');
  }
  
  // Update field 2 if it's location-based
  if (config.field2.menuType === 'location') {
    document.getElementById('newPostExtrasMenuLabel2').textContent = 'Select Option';
    populateExtrasDropdownByType(2, 'location');
  }
}

// No longer need positioning function since everything is in normal document flow

// No longer need clipping function since no overlapping fixed elements 