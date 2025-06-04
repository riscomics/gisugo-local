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
    field1: { label: "PICKUP AT:", menuType: "location" },
    field2: { label: "DELIVER TO:", menuType: "location" }
  },
  hakot: {
    field1: { label: "LOAD AT:", menuType: "location" },
    field2: { label: "UNLOAD AT:", menuType: "location" }
  },
  kompra: {
    field1: { label: "SHOP AT:", menuType: "location" },
    field2: { label: "DELIVER TO:", menuType: "location" }
  },
  luto: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  hugas: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  laba: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  limpyo: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  tindera: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  bantay: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  painter: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  carpenter: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  plumber: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  security: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  driver: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  tutor: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUBJECT:", menuType: "subject" }
  },
  nurse: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "POSITION:", menuType: "position" }
  },
  doctor: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "POSITION:", menuType: "position" }
  },
  lawyer: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "POSITION:", menuType: "position" }
  },
  mechanic: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  electrician: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
  },
  tailor: {
    field1: { label: "LOCATION:", menuType: "location" },
    field2: { label: "SUPPLIES:", menuType: "supplies" }
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
  const borderline = document.getElementById('newPostMenusBorderline');
  const isMobile = window.innerWidth <= 600;
  
  if (!extrasConfig[category]) {
    // Hide extras for categories that don't have configuration
    extrasHeader.style.display = 'none';
    
    // Position borderline below location header only
    if (borderline) {
      borderline.style.position = 'fixed';
      if (isMobile) {
        borderline.style.top = '263px'; // Below mobile location header (lowered by 15%)
      } else {
        borderline.style.top = '354px'; // Below desktop location header
      }
      borderline.style.zIndex = '96';
    }
    return;
  }
  
  const config = extrasConfig[category];
  
  // Show extras header
  extrasHeader.style.display = 'block';
  
  // Position borderline below extras header
  if (borderline) {
    borderline.style.position = 'fixed';
    if (isMobile) {
      borderline.style.top = '354px'; // Below mobile location + extras headers (lowered by 15%)
    } else {
      borderline.style.top = '448px'; // Below desktop location + extras headers (lowered by 20%)
    }
    borderline.style.zIndex = '95';
  }
  
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeLocationMenus();
  
  // Initialize borderline position (default: below location header only)
  const borderline = document.getElementById('newPostMenusBorderline');
  if (borderline) {
    borderline.style.position = 'fixed';
    borderline.style.width = '100%';
    borderline.style.left = '0';
    
    // Check if mobile
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
      borderline.style.top = '263px'; // Below mobile location header only (lowered by 15%)
    } else {
      borderline.style.top = '354px'; // Below desktop location header only (lowered by 20%)
    }
    borderline.style.zIndex = '96';
  }
  
  // Initialize job details section position
  updateJobDetailsSectionPosition();
});

// Call updateCityMenuLabelFontSize on window resize
window.addEventListener('resize', updateCityMenuLabelFontSize);

// Handle window resize for borderline positioning
window.addEventListener('resize', function() {
  const borderline = document.getElementById('newPostMenusBorderline');
  const extrasHeader = document.getElementById('newPostExtrasHeader');
  if (!borderline) return;
  
  const isMobile = window.innerWidth <= 600;
  const extrasVisible = extrasHeader && extrasHeader.style.display !== 'none';
  
  if (extrasVisible) {
    // Borderline below both headers
    if (isMobile) {
      borderline.style.top = '354px';
    } else {
      borderline.style.top = '448px';
    }
  } else {
    // Borderline below location header only
    if (isMobile) {
      borderline.style.top = '263px';
    } else {
      borderline.style.top = '354px';
    }
  }
  
  // Update job details section position
  updateJobDetailsSectionPosition();
});

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

// Function to update job details section position based on borderline
function updateJobDetailsSectionPosition() {
  const jobDetailsSection = document.querySelector('.new-post-job-details-section');
  const extrasHeader = document.getElementById('newPostExtrasHeader');
  if (!jobDetailsSection) return;
  
  const isMobile = window.innerWidth <= 600;
  const extrasVisible = extrasHeader && extrasHeader.style.display !== 'none';
  
  if (extrasVisible) {
    // Position below borderline when extras are visible
    if (isMobile) {
      jobDetailsSection.style.top = '380px'; // Below mobile borderline + extras
    } else {
      jobDetailsSection.style.top = '480px'; // Below desktop borderline + extras
    }
  } else {
    // Position below borderline when only location is visible
    if (isMobile) {
      jobDetailsSection.style.top = '290px'; // Below mobile borderline + location only
    } else {
      jobDetailsSection.style.top = '380px'; // Below desktop borderline + location only
    }
  }
} 