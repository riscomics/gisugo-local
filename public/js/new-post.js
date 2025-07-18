// ========================== NEW POST PAGE FUNCTIONALITY ==========================

// Keyboard handling for Chrome Android mobile browser
function initializeKeyboardHandling() {
  let initialViewportHeight = window.innerHeight;
  let keyboardVisible = false;
  let focusedElement = null;
  
  // Detect keyboard visibility by monitoring viewport height changes
  function detectKeyboardVisibility() {
    const currentViewportHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentViewportHeight;
    
    // Keyboard is considered visible if viewport height decreased by more than 150px
    const newKeyboardVisible = heightDifference > 150;
    
    if (newKeyboardVisible !== keyboardVisible) {
      keyboardVisible = newKeyboardVisible;
      
      if (keyboardVisible && focusedElement) {
        // Keyboard appeared - scroll focused element into view
        setTimeout(() => {
          scrollElementIntoView(focusedElement);
        }, 100); // Small delay to ensure keyboard animation is complete
      }
    }
  }
  
  // Scroll element into view with proper positioning
  function scrollElementIntoView(element) {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const keyboardHeight = initialViewportHeight - viewportHeight;
    
    // Calculate if element is covered by keyboard
    const elementBottom = rect.bottom;
    const availableHeight = viewportHeight - keyboardHeight;
    
    if (elementBottom > availableHeight) {
      // Element is covered by keyboard - scroll it into view
      const scrollAmount = elementBottom - availableHeight + 20; // 20px buffer
      window.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });
    }
  }
  
  // Track focused elements
  document.addEventListener('focusin', function(e) {
    focusedElement = e.target;
    
    // If keyboard is already visible, scroll immediately
    if (keyboardVisible) {
      setTimeout(() => {
        scrollElementIntoView(focusedElement);
      }, 50);
    }
  });
  
  // Handle input focus events specifically
  const inputElements = document.querySelectorAll('input, textarea');
  inputElements.forEach(input => {
    input.addEventListener('focus', function() {
      focusedElement = this;
      
      // For Chrome Android, also check if we need to scroll on focus
      setTimeout(() => {
        if (window.innerHeight < initialViewportHeight) {
          keyboardVisible = true;
          scrollElementIntoView(this);
        }
      }, 300); // Longer delay for Chrome Android
    });
  });
  
  // Monitor viewport height changes
  let resizeTimeout;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(detectKeyboardVisibility, 100);
  });
  
  // Update initial height on orientation change
  window.addEventListener('orientationchange', function() {
    setTimeout(() => {
      initialViewportHeight = window.innerHeight;
      keyboardVisible = false;
    }, 500);
  });
  
  // Handle virtual keyboard events (for better Chrome Android support)
  if ('virtualKeyboard' in navigator) {
    navigator.virtualKeyboard.addEventListener('geometrychange', function() {
      const keyboardHeight = navigator.virtualKeyboard.boundingRect.height;
      keyboardVisible = keyboardHeight > 0;
      
      if (keyboardVisible && focusedElement) {
        setTimeout(() => {
          scrollElementIntoView(focusedElement);
        }, 100);
      }
    });
  }
  
  // Fallback for older Chrome versions
  document.addEventListener('touchstart', function() {
    // Reset keyboard state on touch
    initialViewportHeight = window.innerHeight;
  });
}

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
    inputField.style.width = isMobile ? '140px' : '170px'; // BACK TO LARGER WIDTH - barangay fields should be WIDER
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
    inputField.style.width = isMobile ? '140px' : '170px'; // BACK TO LARGER WIDTH - barangay fields should be WIDER
    inputField.style.height = isMobile ? '25px' : '32px';
    inputField.style.paddingLeft = isMobile ? '10px' : '12px';
    inputField.style.paddingRight = isMobile ? '10px' : '12px';
    inputField.style.fontSize = isMobile ? '15px' : '18px';
    
    // Find arrow element within the input field
    const arrow = inputField.querySelector('.arrow');
    if (arrow) {
    arrow.style.fontSize = isMobile ? '1em' : '1.1em';
    }
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

// Function to update job details section position after extras changes
function updateJobDetailsSectionPosition() {
  // This function adjusts layout when extras section is shown/hidden
  // Currently a placeholder - can be expanded for specific positioning needs
  console.log('📐 Updating job details section position');
  
  // Potential implementations:
  // - Adjust margins/padding of job details section
  // - Trigger layout recalculation for mobile keyboard
  // - Update spacer heights for scrolling
}

// Extras dropdown event listeners - DISABLED FOR NEW MODAL SYSTEM
// OLD CODE COMMENTED OUT - New modal system handles Extras dropdowns now
/*
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
*/

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
    let calculatedWidth = maxWidth + 28;
    
    // Constrain width for small viewports (320px-359px range)
    if (window.innerWidth >= 321 && window.innerWidth <= 359) {
      const maxAllowedWidth = Math.min(135, window.innerWidth * 0.30); // Match CSS clamp(115px, 30vw, 135px)
      calculatedWidth = Math.min(calculatedWidth, maxAllowedWidth);
    } else if (window.innerWidth <= 320) {
      const maxAllowedWidth = Math.min(145, window.innerWidth * 0.34); // Match CSS clamp(115px, 34vw, 145px)
      calculatedWidth = Math.min(calculatedWidth, maxAllowedWidth);
    }
    
    overlay.style.width = calculatedWidth + 'px';
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

// Region menu event listeners - UPDATED TO USE CENTERED MODAL
// Wrap in DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', function() {
const regionMenuBtn = document.querySelector('.new-post-region-menu');
const regionMenuOverlay = document.getElementById('newPostRegionMenuOverlay');
  const regionPickerModal = document.getElementById('newPostRegionPickerOverlay');
  const regionPickerList = document.getElementById('newPostRegionPickerList');
  const regionPickerCloseBtn = document.getElementById('newPostRegionPickerCloseBtn');
let regionMenuOpen = false;

  // Debug logging
  console.log('Region elements found:', {
    regionMenuBtn,
    regionPickerModal,
    regionPickerList,
    regionPickerCloseBtn
  });

// Populate region picker modal
function populateNewPostRegionPicker() {
  if (!regionPickerList) return;
  regionPickerList.innerHTML = '';
  regions.forEach(region => {
    const item = document.createElement('div');
    item.className = 'new-post-region-picker-item';
    if (region === activeRegion) {
      item.classList.add('active');
    }
    item.textContent = region;
    regionPickerList.appendChild(item);
  });
}

// Region button click - show modal instead of small dropdown
if (regionMenuBtn && regionPickerModal) {
  console.log('Adding click listener to region button');
  regionMenuBtn.addEventListener('click', function(e) {
    console.log('Region button clicked!');
    e.stopPropagation();
    populateNewPostRegionPicker();
    regionPickerModal.style.display = 'flex';
    console.log('Region modal should now be visible');
  });
} else {
  console.log('Missing elements for region modal:', { regionMenuBtn, regionPickerModal });
}

// Close modal functions
function closeNewPostRegionPicker() {
  if (regionPickerModal) {
    regionPickerModal.style.display = 'none';
  }
}

// Close button click
if (regionPickerCloseBtn) {
  regionPickerCloseBtn.addEventListener('click', closeNewPostRegionPicker);
}

// Backdrop click to close
if (regionPickerModal) {
  regionPickerModal.addEventListener('click', function(e) {
    if (e.target === regionPickerModal) {
      closeNewPostRegionPicker();
    }
  });
}

// Select region from modal
if (regionPickerList) {
  regionPickerList.addEventListener('click', function(e) {
    if (e.target.classList.contains('new-post-region-picker-item')) {
      activeRegion = e.target.textContent.trim();
      document.getElementById('newPostRegionMenuLabel').textContent = activeRegion;
      
      // When region changes, reset city to "City/Town" to force user selection
      activeCity = "City/Town";
      document.getElementById('newPostCityMenuLabel').textContent = activeCity;
      setTimeout(updateCityMenuLabelFontSize, 0);
      
      renderRegionMenu();
      renderCityMenu();
      closeNewPostRegionPicker();
    }
  });
}

// Keep original small dropdown as backup (but it won't be triggered by the main button anymore)
if (regionMenuBtn && regionMenuOverlay) {
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

}); // End DOMContentLoaded for Region modal

// City menu event listeners - UPDATED TO USE CENTERED MODAL
// Wrap in DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', function() {
const cityMenuBtn = document.querySelector('.new-post-city-menu');
  const cityMenuBtnById = document.getElementById('newPostLocationCity');
  const cityMenuOverlay = document.getElementById('newPostCityMenuOverlay');
  const cityPickerModal = document.getElementById('newPostCityPickerOverlay');
  const cityPickerList = document.getElementById('newPostCityPickerList');
  const cityPickerCloseBtn = document.getElementById('newPostCityPickerCloseBtn');
  let cityMenuOpen = false;

  // Debug logging
  console.log('City elements found:', {
    cityMenuBtn,
    cityMenuBtnById,
    cityPickerModal,
    cityPickerList,
    cityPickerCloseBtn
  });

  // Use the button that was actually found
  const actualCityBtn = cityMenuBtn || cityMenuBtnById;

  // Populate city picker modal
  function populateNewPostCityPicker() {
    console.log('populateNewPostCityPicker called');
    if (!cityPickerList) {
      console.log('ERROR: cityPickerList not found!');
      return;
    }
    
    cityPickerList.innerHTML = '';
    console.log('Cleared city picker list');
    
    // Get cities for current region
    const regionCities = citiesByRegion[activeRegion] || [];
    console.log('regionCities array:', regionCities, 'length:', regionCities.length);
    
    regionCities.forEach((city, index) => {
      const item = document.createElement('div');
      item.className = 'new-post-city-picker-item';
      if (city === activeCity) {
        item.classList.add('active');
      }
      item.textContent = city;
      cityPickerList.appendChild(item);
      console.log(`Added city ${index + 1}:`, city);
    });
    
    console.log('City picker population complete. Total items:', cityPickerList.children.length);
  }

  // City button click - show modal instead of small dropdown
  if (actualCityBtn && cityPickerModal) {
    console.log('Adding click listener to city button');
    actualCityBtn.addEventListener('click', function(e) {
      console.log('City button clicked!');
      e.stopPropagation();
      
      console.log('Current activeRegion:', activeRegion);
      console.log('Available cities object:', citiesByRegion);
      console.log('Cities for current region:', citiesByRegion[activeRegion]);
      
      populateNewPostCityPicker();
      
      console.log('City list populated, now showing modal...');
      cityPickerModal.style.display = 'flex';
      console.log('Modal display set to flex');
      console.log('Modal visibility check:', {
        display: cityPickerModal.style.display,
        offsetHeight: cityPickerModal.offsetHeight,
        offsetWidth: cityPickerModal.offsetWidth
      });
    });
  } else {
    console.log('Missing elements for city modal:', { actualCityBtn, cityPickerModal });
  }

  // Close modal functions
  function closeNewPostCityPicker() {
    if (cityPickerModal) {
      cityPickerModal.style.display = 'none';
    }
  }

  // Close button click
  if (cityPickerCloseBtn) {
    cityPickerCloseBtn.addEventListener('click', closeNewPostCityPicker);
  }

  // Backdrop click to close
  if (cityPickerModal) {
    cityPickerModal.addEventListener('click', function(e) {
      if (e.target === cityPickerModal) {
        closeNewPostCityPicker();
      }
    });
  }

  // Select city from modal
  if (cityPickerList) {
    cityPickerList.addEventListener('click', function(e) {
      if (e.target.classList.contains('new-post-city-picker-item')) {
        activeCity = e.target.textContent.trim();
        document.getElementById('newPostCityMenuLabel').textContent = activeCity;
        
        renderCityMenu();
        closeNewPostCityPicker();
        setTimeout(updateCityMenuLabelFontSize, 0);
        
        // Update location-based extras when city changes
        updateLocationExtrasForCityChange();
      }
    });
  }

  // Keep original small dropdown as backup (but it won't be triggered by the main button anymore)
  if (actualCityBtn && cityMenuOverlay) {
    // Close overlay when clicking outside
    document.addEventListener('click', function(e) {
      if (cityMenuOpen && !actualCityBtn.contains(e.target) && !cityMenuOverlay.contains(e.target)) {
        cityMenuOverlay.classList.remove('show');
        cityMenuOpen = false;
      }
    });

    // Select city from original dropdown (backup)
    cityMenuOverlay.addEventListener('click', function(e) {
      if (e.target.tagName === 'LI') {
        activeCity = e.target.textContent.replace(/▲/, '').trim();
        document.getElementById('newPostCityMenuLabel').textContent = activeCity;
        renderCityMenu();
        cityMenuOverlay.classList.remove('show');
        cityMenuOpen = false;
        setTimeout(updateCityMenuLabelFontSize, 0);
      }
    });
  }

}); // End DOMContentLoaded for City modal

// Payment Type menu event listeners - UPDATED TO USE CENTERED MODAL
// Wrap in DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', function() {
  const paymentMenuBtn = document.getElementById('paymentTypeMenu');
  const paymentMenuOverlay = document.getElementById('paymentTypeOverlay');
  const paymentPickerModal = document.getElementById('newPostPaymentPickerOverlay');
  const paymentPickerList = document.getElementById('newPostPaymentPickerList');
  const paymentPickerCloseBtn = document.getElementById('newPostPaymentPickerCloseBtn');
  let paymentMenuOpen = false;

  // Debug logging
  console.log('Payment elements found:', {
    paymentMenuBtn,
    paymentPickerModal,
    paymentPickerList,
    paymentPickerCloseBtn
  });

  // Get current payment type
  function getCurrentPaymentType() {
    const paymentLabel = document.getElementById('paymentTypeLabel');
    return paymentLabel ? paymentLabel.textContent.trim() : 'Per Job';
  }

  // Populate payment picker modal
  function populateNewPostPaymentPicker() {
    console.log('populateNewPostPaymentPicker called');
    if (!paymentPickerList) {
      console.log('ERROR: paymentPickerList not found!');
      return;
    }
    
    const currentPaymentType = getCurrentPaymentType();
    console.log('Current payment type:', currentPaymentType);
    
    // Update active state for payment items
    const paymentItems = paymentPickerList.querySelectorAll('.new-post-payment-picker-item');
    paymentItems.forEach(item => {
      if (item.textContent.trim() === currentPaymentType) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    console.log('Payment picker population complete. Total items:', paymentItems.length);
  }

  // Payment button click - show modal instead of small dropdown
  if (paymentMenuBtn && paymentPickerModal) {
    console.log('Adding click listener to payment button');
    paymentMenuBtn.addEventListener('click', function(e) {
      console.log('Payment button clicked!');
      e.stopPropagation();
      
      populateNewPostPaymentPicker();
      
      console.log('Payment list populated, now showing modal...');
      paymentPickerModal.style.display = 'flex';
      console.log('Payment modal should now be visible');
    });
  } else {
    console.log('Missing elements for payment modal:', { paymentMenuBtn, paymentPickerModal });
  }

  // Close modal functions
  function closeNewPostPaymentPicker() {
    if (paymentPickerModal) {
      paymentPickerModal.style.display = 'none';
    }
  }

  // Close button click
  if (paymentPickerCloseBtn) {
    paymentPickerCloseBtn.addEventListener('click', closeNewPostPaymentPicker);
  }

  // Backdrop click to close
  if (paymentPickerModal) {
    paymentPickerModal.addEventListener('click', function(e) {
      if (e.target === paymentPickerModal) {
        closeNewPostPaymentPicker();
      }
    });
  }

  // Select payment type from modal
  if (paymentPickerList) {
    paymentPickerList.addEventListener('click', function(e) {
      if (e.target.classList.contains('new-post-payment-picker-item')) {
        const selectedType = e.target.getAttribute('data-value');
        console.log('Payment type selected:', selectedType);
        
        // Update the payment type label
        document.getElementById('paymentTypeLabel').textContent = selectedType;
        
        closeNewPostPaymentPicker();
      }
    });
  }

  // Keep original small dropdown as backup (but it won't be triggered by the main button anymore)
  if (paymentMenuBtn && paymentMenuOverlay) {
    // Close overlay when clicking outside
    document.addEventListener('click', function(e) {
      if (paymentMenuOpen && !paymentMenuBtn.contains(e.target) && !paymentMenuOverlay.contains(e.target)) {
        paymentMenuOverlay.classList.remove('show');
        paymentMenuOpen = false;
      }
    });

    // Select payment type from original dropdown (backup)
    paymentMenuOverlay.addEventListener('click', function(e) {
      if (e.target.tagName === 'LI') {
        const selectedType = e.target.getAttribute('data-value');
        document.getElementById('paymentTypeLabel').textContent = selectedType;
        paymentMenuOverlay.classList.remove('show');
        paymentMenuOpen = false;
      }
    });
  }

}); // End DOMContentLoaded for Payment modal

// Extras menu event listeners - UPDATED TO USE CENTERED MODAL
// Wrap in DOMContentLoaded to ensure elements exist
document.addEventListener('DOMContentLoaded', function() {
  // Setup modals for both extras fields (1 and 2)
  for (let fieldNumber = 1; fieldNumber <= 2; fieldNumber++) {
    const extrasMenuBtn = document.getElementById(`newPostExtrasMenu${fieldNumber}`);
    const extrasMenuOverlay = document.getElementById(`newPostExtrasMenuOverlay${fieldNumber}`);
    const extrasPickerModal = document.getElementById(`newPostExtrasPickerOverlay${fieldNumber}`);
    const extrasPickerList = document.getElementById(`newPostExtrasPickerList${fieldNumber}`);
    const extrasPickerCloseBtn = document.getElementById(`newPostExtrasPickerCloseBtn${fieldNumber}`);
    const extrasPickerTitle = document.getElementById(`newPostExtrasPickerTitle${fieldNumber}`);

    // Debug logging
    console.log(`Extras field ${fieldNumber} elements found:`, {
      extrasMenuBtn,
      extrasPickerModal,
      extrasPickerList,
      extrasPickerCloseBtn,
      extrasPickerTitle
    });

    // Populate extras picker modal - PRESERVING ALL EXISTING LOGIC
    function populateNewPostExtrasPicker(fieldNumber) {
      console.log(`populateNewPostExtrasPicker called for field ${fieldNumber}`);
      const modal = document.getElementById(`newPostExtrasPickerOverlay${fieldNumber}`);
      const list = document.getElementById(`newPostExtrasPickerList${fieldNumber}`);
      const title = document.getElementById(`newPostExtrasPickerTitle${fieldNumber}`);
      
      if (!list || !title) {
        console.log(`ERROR: Extras picker elements not found for field ${fieldNumber}`);
        return;
      }

      // Get current category and config (SAME LOGIC AS ORIGINAL)
      const currentCategory = window.selectedJobCategory;
      if (!currentCategory || !extrasConfig[currentCategory]) {
        console.log('No category selected or config not found');
        return;
      }

      const config = extrasConfig[currentCategory];
      const fieldConfig = fieldNumber === 1 ? config.field1 : config.field2;
      
      if (!fieldConfig) {
        console.log(`No config found for field ${fieldNumber}`);
        return;
      }

      // Update modal title with field label
      title.textContent = fieldConfig.label;

      // Get options using EXISTING LOGIC from populateExtrasDropdownByType
      let options = [];
      const menuType = fieldConfig.menuType;
      
      if (menuTypes[menuType]) {
        if (menuTypes[menuType].getOptions) {
          // Dynamic options (like location)
          options = menuTypes[menuType].getOptions();
          
          // Handle location fallback for cities without barangay data (PRESERVE EXISTING LOGIC)
          if (menuType === 'location' && options === null) {
            console.log(`No barangay data for ${activeCity}, modal not applicable`);
            return; // Don't show modal, let existing fallback input handle this
          }
        } else {
          // Static options
          options = menuTypes[menuType].options;
        }
      }

      console.log(`Field ${fieldNumber} options:`, options);

      // Clear and populate list
      list.innerHTML = '';
      
      // Get current selection for active highlighting
      const currentLabel = document.getElementById(`newPostExtrasMenuLabel${fieldNumber}`);
      const currentValue = currentLabel ? currentLabel.textContent.trim() : '';

      options.forEach(option => {
        const item = document.createElement('div');
        item.className = 'new-post-extras-picker-item';
        item.textContent = option;
        
        // Highlight if this is the current selection
        if (option === currentValue) {
          item.classList.add('active');
        }
        
        list.appendChild(item);
        console.log(`Added option: ${option}`);
      });

      // Add compact class for modals with only 2 options (like Supplies)
      const modalElement = modal.querySelector('.new-post-extras-picker-modal');
      if (modalElement) {
        if (options.length <= 2) {
          modalElement.classList.add('compact');
          console.log(`Added compact class for ${options.length} options`);
        } else {
          modalElement.classList.remove('compact');
          console.log(`Removed compact class for ${options.length} options`);
        }
      }

      console.log(`Extras picker population complete for field ${fieldNumber}. Total items:`, list.children.length);
    }

    // Extras button click - show modal instead of small dropdown (ONLY FOR DROPDOWN TYPES)
    if (extrasMenuBtn && extrasPickerModal) {
      console.log(`Adding click listener to extras button ${fieldNumber}`);
      extrasMenuBtn.addEventListener('click', function(e) {
        console.log(`Extras field ${fieldNumber} button clicked!`);
        e.stopPropagation();
        
        // Check if this field should use modal (only for dropdown types, not text inputs)
        const currentCategory = window.selectedJobCategory;
        if (!currentCategory || !extrasConfig[currentCategory]) {
          console.log('No category selected, ignoring click');
          return;
        }

        const config = extrasConfig[currentCategory];
        const fieldConfig = fieldNumber === 1 ? config.field1 : config.field2;
        
        // Check if this is a location field that should use text input fallback
        if (fieldConfig.menuType === 'location') {
          const options = menuTypes.location.getOptions();
          if (options === null) {
            console.log('Location field needs text input fallback, not showing modal');
            return; // Let existing text input fallback handle this
          }
        }
        
        populateNewPostExtrasPicker(fieldNumber);
        extrasPickerModal.style.display = 'flex';
        console.log(`Extras modal ${fieldNumber} should now be visible`);
      });
    } else {
      console.log(`Missing elements for extras modal ${fieldNumber}:`, { extrasMenuBtn, extrasPickerModal });
    }

    // Close modal functions
    function closeNewPostExtrasPicker(fieldNumber) {
      const modal = document.getElementById(`newPostExtrasPickerOverlay${fieldNumber}`);
      if (modal) {
        modal.style.display = 'none';
      }
    }

    // Close button click
    if (extrasPickerCloseBtn) {
      extrasPickerCloseBtn.addEventListener('click', () => closeNewPostExtrasPicker(fieldNumber));
    }

    // Backdrop click to close
    if (extrasPickerModal) {
      extrasPickerModal.addEventListener('click', function(e) {
        if (e.target === extrasPickerModal) {
          closeNewPostExtrasPicker(fieldNumber);
        }
      });
    }

    // Select option from modal - PRESERVE ALL EXISTING LOGIC
    if (extrasPickerList) {
      extrasPickerList.addEventListener('click', function(e) {
        if (e.target.classList.contains('new-post-extras-picker-item')) {
          const selectedOption = e.target.textContent.trim();
          console.log(`Extras field ${fieldNumber} option selected:`, selectedOption);
          
          // Update label using EXACT SAME LOGIC as original
          document.getElementById(`newPostExtrasMenuLabel${fieldNumber}`).textContent = selectedOption;
          
          // Close modal
          closeNewPostExtrasPicker(fieldNumber);
        }
      });
    }
  }

}); // End DOMContentLoaded for Extras modal

// City menu event listeners - DISABLED FOR NEW MODAL SYSTEM
// OLD CODE COMMENTED OUT - New modal system handles City dropdown now
/*
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
*/

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

// Payment type dropdown functionality - DISABLED FOR NEW MODAL SYSTEM
// OLD CODE COMMENTED OUT - New modal system handles Payment dropdown now
/*
let selectedPaymentType = "Per Hour";

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
*/

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
  console.log('🔧 Initializing main post job button...');
  
  const postJobBtn = document.getElementById('postJobBtn');
  
  console.log('🔍 Main post job button check:', {
    element: !!postJobBtn,
    id: postJobBtn?.id,
    class: postJobBtn?.className,
    text: postJobBtn?.textContent,
    visible: postJobBtn ? window.getComputedStyle(postJobBtn).display !== 'none' : false
  });
  
  if (!postJobBtn) {
    console.error('❌ Main post job button not found! Checking available buttons...');
    const allButtons = Array.from(document.querySelectorAll('button'));
    console.log('🔍 Available buttons:', allButtons.map(btn => ({
      id: btn.id,
      class: btn.className,
      text: btn.textContent.trim()
    })));
    return;
  }
  
  postJobBtn.addEventListener('click', function(e) {
    console.log('🔥 MAIN PREVIEW POST BUTTON CLICKED');
    console.log('🔍 Event details:', e);
    
    e.preventDefault();
    
    // Add visual feedback
    this.style.transform = 'translateY(2px)';
    setTimeout(() => {
      this.style.transform = '';
    }, 150);
    
    // Show preview overlay
    console.log('🔄 Calling showPreviewOverlay()...');
    showPreviewOverlay();
  });
  
  console.log('✅ Main post job button initialized successfully');
}

// ========================== PREVIEW OVERLAY FUNCTIONALITY ==========================

function showPreviewOverlay() {
  // Validate required fields first
  const validationResult = validateRequiredFields();
  if (!validationResult.isValid) {
    // Show validation errors as a more visible overlay instead of alert
    showValidationOverlay(validationResult.message);
    return;
  }
  
  const previewOverlay = document.getElementById('previewOverlay');
  if (!previewOverlay) return;
  
  // Populate preview data
  populatePreviewData();
  
  // Reset button state
  const postBtn = document.getElementById('previewPostBtn');
  if (postBtn) {
    postBtn.textContent = 'POST JOB';
    postBtn.disabled = false;
  }
  
  // Show overlay
  previewOverlay.style.display = 'flex';
  
  // Add event listeners for preview overlay
  initializePreviewOverlayEvents();
}

function hidePreviewOverlay() {
  console.log('🔄 Hiding preview overlay...');
  
  const previewOverlay = document.getElementById('previewOverlay');
  if (previewOverlay) {
    previewOverlay.style.display = 'none';
    console.log('✅ Preview overlay hidden');
  }
}

// ========================== VALIDATION OVERLAY ==========================

function showValidationOverlay(message) {
  // Create a temporary validation overlay
  let validationOverlay = document.getElementById('validationOverlay');
  if (!validationOverlay) {
    validationOverlay = document.createElement('div');
    validationOverlay.id = 'validationOverlay';
    validationOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
      <div style="font-size: 18px; font-weight: 600; color: #d32f2f; margin-bottom: 16px;">
        ⚠️ Required Fields Missing
      </div>
      <div style="font-size: 14px; line-height: 1.6; color: #333; white-space: pre-line; margin-bottom: 20px;">
        ${message}
      </div>
      <button id="validationOkBtn" style="
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 12px 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        width: 100%;
      ">Got It</button>
    `;
    
    validationOverlay.appendChild(modal);
    document.body.appendChild(validationOverlay);
    
    // Add click event to close button
    document.getElementById('validationOkBtn').addEventListener('click', function() {
      document.body.removeChild(validationOverlay);
    });
    
    // Close on background click
    validationOverlay.addEventListener('click', function(e) {
      if (e.target === validationOverlay) {
        document.body.removeChild(validationOverlay);
      }
    });
  } else {
    // Update existing overlay
    validationOverlay.querySelector('div:last-child').textContent = message;
    validationOverlay.style.display = 'flex';
  }
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
  console.log('📝 Starting form data collection...');
  const data = {};
  
  try {
  // Get selected category
  data.category = window.selectedJobCategory || null;
    console.log('📝 Category:', data.category);
    
    if (!data.category) {
      throw new Error('No job category selected');
    }
  
  // Get selected region and city
    const regionElement = document.getElementById('newPostRegionMenuLabel');
    const cityElement = document.getElementById('newPostCityMenuLabel');
    
    if (!regionElement || !cityElement) {
      throw new Error('Location elements not found');
    }
    
    data.region = regionElement.textContent;
    data.city = cityElement.textContent;
    console.log('📝 Location:', `${data.region}, ${data.city}`);
  
  // Get job details
    const titleInput = document.getElementById('jobTitleInput');
    const dateInput = document.getElementById('jobDateInput');
    
    if (!titleInput || !dateInput) {
      throw new Error('Required input elements not found');
    }
    
    data.jobTitle = titleInput.value.trim();
    data.jobDate = dateInput.value;
    console.log('📝 Job details:', { title: data.jobTitle, date: data.jobDate });
    
    if (!data.jobTitle) {
      throw new Error('Job title is required');
    }
    
    if (!data.jobDate) {
      throw new Error('Job date is required');
    }
  
  // Get time
    const startHourElement = document.getElementById('jobTimeStartLabel');
    const startPeriodElement = document.getElementById('jobTimeStartPeriodLabel');
    const endHourElement = document.getElementById('jobTimeEndLabel');
    const endPeriodElement = document.getElementById('jobTimeEndPeriodLabel');
    
    if (!startHourElement || !startPeriodElement || !endHourElement || !endPeriodElement) {
      throw new Error('Time elements not found');
    }
    
    const startHour = startHourElement.textContent;
    const startPeriod = startPeriodElement.textContent;
    const endHour = endHourElement.textContent;
    const endPeriod = endPeriodElement.textContent;
  
  if (startHour !== 'Hour' && endHour !== 'Hour') {
      data.startTime = `${startHour} ${startPeriod}`;
      data.endTime = `${endHour} ${endPeriod}`;
      console.log('📝 Time:', `${data.startTime} - ${data.endTime}`);
    } else {
      throw new Error('Start and end times are required');
  }
  
  // Get photo
  const photoPreview = document.getElementById('photoPreviewImage');
  if (photoPreview && photoPreview.src && !photoPreview.src.includes('data:,')) {
    data.photo = photoPreview.src;
      console.log('📝 Photo:', 'Image included');
    } else {
      console.log('📝 Photo:', 'No image');
  }
  
  // Get extras
  data.extras = [];
  const extrasHeader = document.getElementById('newPostExtrasHeader');
  if (extrasHeader && extrasHeader.style.display !== 'none') {
    // Get field 1
      const label1Element = document.getElementById('newPostExtrasLabel1');
      const value1Element = document.getElementById('newPostExtrasMenuLabel1');
    const input1 = document.getElementById('newPostExtrasInput1');
      
      if (label1Element && value1Element) {
        const label1 = label1Element.textContent;
        const value1 = value1Element.textContent;
    
    if (value1 && value1 !== 'Select Option') {
      data.extras.push(`${label1} ${value1}`);
    } else if (input1 && input1.value.trim()) {
      data.extras.push(`${label1} ${input1.value.trim()}`);
        }
    }
    
    // Get field 2
      const label2Element = document.getElementById('newPostExtrasLabel2');
      const value2Element = document.getElementById('newPostExtrasMenuLabel2');
    const input2 = document.getElementById('newPostExtrasInput2');
      
      if (label2Element && value2Element) {
        const label2 = label2Element.textContent;
        const value2 = value2Element.textContent;
    
    if (value2 && value2 !== 'Select Option') {
      data.extras.push(`${label2} ${value2}`);
    } else if (input2 && input2.value.trim()) {
      data.extras.push(`${label2} ${input2.value.trim()}`);
    }
  }
    }
    console.log('📝 Extras:', data.extras);
  
  // Get description
    const descriptionElement = document.getElementById('jobDetailsTextarea');
    if (!descriptionElement) {
      throw new Error('Description element not found');
    }
    
    data.description = descriptionElement.value.trim();
    console.log('📝 Description:', data.description ? 'Provided' : 'Empty');
    
    if (!data.description) {
      throw new Error('Job description is required');
    }
  
  // Get payment
    const paymentTypeElement = document.getElementById('paymentTypeLabel');
    const paymentAmountElement = document.getElementById('paymentAmountInput');
    
    if (!paymentTypeElement || !paymentAmountElement) {
      throw new Error('Payment elements not found');
    }
    
    data.paymentType = paymentTypeElement.textContent;
    data.paymentAmount = paymentAmountElement.value;
    console.log('📝 Payment:', `₱${data.paymentAmount} ${data.paymentType}`);
    
    if (!data.paymentAmount || data.paymentAmount === '0') {
      throw new Error('Payment amount is required');
    }
    
    console.log('✅ Form data collection completed successfully');
    console.log('📝 Complete form data:', data);
  
  return data;
    
  } catch (error) {
    console.error('❌ Error collecting form data:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    // Show user-friendly error
    showValidationOverlay(`Form Error: ${error.message}\n\nPlease check all required fields are filled out correctly.`);
    
    return null;
  }
}

function initializePreviewOverlayEvents() {
  console.log('🔧 Initializing preview overlay events...');
  
  const previewOverlay = document.getElementById('previewOverlay');
  const closeBtn = document.getElementById('previewCloseBtn');
  const editBtn = document.getElementById('previewEditBtn');
  const postBtn = document.getElementById('previewPostBtn');
  
  console.log('🔍 Element check:', {
    previewOverlay: !!previewOverlay,
    closeBtn: !!closeBtn,
    editBtn: !!editBtn,
    postBtn: !!postBtn,
    postBtnId: postBtn?.id,
    postBtnClass: postBtn?.className,
    listenerAlreadyAdded: postBtn?.dataset?.listenerAdded
  });
  
  // Enhanced POST JOB button with comprehensive error handling
  if (postBtn && !postBtn.dataset.listenerAdded) {
    console.log('🔗 Setting up enhanced POST JOB button click handler...');
    
    postBtn.addEventListener('click', async function(e) {
      console.log('🔥 POST JOB BUTTON CLICKED - Starting submission process');
      
      // Prevent all default behaviors
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      try {
        console.log('📝 Getting form data...');
        const formData = getFormData();
        
        if (!formData) {
          console.error('❌ Form data is null or undefined');
          throw new Error('Unable to retrieve form data');
        }
        
        console.log('✅ Form data retrieved successfully:', {
          category: formData.category,
          title: formData.jobTitle,
          hasDescription: !!formData.description,
          paymentAmount: formData.paymentAmount,
          hasDate: !!formData.jobDate,
          hasTime: !!(formData.startTime && formData.endTime)
        });
        
        console.log('🚀 Calling createJobPostWithData...');
        await createJobPostWithData(formData);
        
        console.log('🎉 Job creation process completed successfully!');
        
      } catch (error) {
        console.error('❌ ERROR in POST JOB submission:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Reset button state
        this.textContent = 'POST JOB';
        this.disabled = false;
        
        // Show error to user
        showValidationOverlay(`Error posting job: ${error.message}\n\nPlease try again. If the problem persists, refresh the page.`);
      }
      
      return false;
    });
    
    postBtn.dataset.listenerAdded = 'true';
    console.log('✅ POST JOB button event listener added successfully');
  }
  
  // Other button handlers remain the same
  if (closeBtn && !closeBtn.dataset.listenerAdded) {
    closeBtn.addEventListener('click', function() {
      console.log('🔄 Preview close button clicked');
      hidePreviewOverlay();
    });
    closeBtn.dataset.listenerAdded = 'true';
  }
  
  if (editBtn && !editBtn.dataset.listenerAdded) {
    editBtn.addEventListener('click', function() {
      console.log('🔄 Preview edit button clicked - returning to form');
      
      // Hide the preview overlay
      hidePreviewOverlay();
      
      // Scroll back to the top of the form so user can continue editing
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Optional: Focus on the first form field for better UX
      setTimeout(() => {
        const firstField = document.getElementById('jobTitleInput');
        if (firstField) {
          firstField.focus();
          console.log('✅ Focused on job title field for continued editing');
      }
      }, 300); // Small delay to ensure smooth scroll completes
      
      console.log('✅ Returned to form for editing');
    });
    editBtn.dataset.listenerAdded = 'true';
  }
  
  console.log('✅ Preview overlay events initialization completed');
}

// Removed unnecessary createJobPost wrapper - now calling createJobPostWithData directly

// ========================== JOB CREATION FUNCTIONALITY ==========================

async function createJobPostWithData(formData) {
  console.log('🚀 createJobPostWithData function called with data:', formData);
  
  const postBtn = document.getElementById('previewPostBtn');
  const previewOverlay = document.getElementById('previewOverlay');
  
  console.log('🔍 Button and overlay elements:', {
    postBtn: !!postBtn,
    previewOverlay: !!previewOverlay,
    postBtnText: postBtn?.textContent,
    postBtnDisabled: postBtn?.disabled
  });
  
  // Determine operation mode from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const editJobId = urlParams.get('edit');
  const relistJobId = urlParams.get('relist');
  const mode = editJobId ? 'edit' : (relistJobId ? 'relist' : 'new');
  
  console.log('🎯 Operation mode determined:', {
    mode,
    editJobId,
    relistJobId,
    urlParams: Array.from(urlParams.entries())
  });
  
  try {
    // Show loading state with mode-specific text
    if (postBtn) {
      const loadingText = mode === 'edit' ? 'UPDATING...' : (mode === 'relist' ? 'RELISTING...' : 'POSTING...');
      console.log(`🔄 Setting button to loading state: ${loadingText}`);
      postBtn.textContent = loadingText;
      postBtn.disabled = true;
    }
    
    let jobNumber;
    let jobId;
    
    if (mode === 'edit') {
      console.log('📝 EDIT MODE: Starting edit process...');
      
      // EDIT MODE: Update existing job
      jobId = editJobId;
      console.log('🔍 Getting job number for edit jobId:', jobId);
      jobNumber = await getJobNumberFromId(editJobId);
      console.log('✅ Job number retrieved:', jobNumber);
      
      // Firebase Implementation for EDIT:
      // await updateJobDocument(editJobId, formData);
      
      console.log('🔄 Updating job template...');
      await updateJobTemplate(formData, jobNumber, editJobId);
      console.log('✅ Job template updated');
      
      console.log('🔄 Updating job preview card...');
      await updateJobPreviewCard(formData, jobNumber, editJobId);
      console.log('✅ Job preview card updated');
      
      console.log('🔄 Updating stored job data...');
      updateStoredJobData(formData, jobNumber, editJobId);
      console.log('✅ Stored job data updated');
      
    } else if (mode === 'relist') {
      console.log('🔄 RELIST MODE: Starting relist process...');
      
      // RELIST MODE: Create new job from completed job
      console.log('🔍 Getting next job number for category:', formData.category);
      jobNumber = getNextJobNumber(formData.category);
      jobId = `${formData.category}_job_2025_${jobNumber}`;
      console.log('✅ New job ID generated:', jobId, 'with job number:', jobNumber);
      
      // FIXED: Get original completed job data to preserve thumbnail
      console.log('🔍 Getting original completed job data for thumbnail preservation...');
      const originalJobData = await getCompletedJobData(relistJobId);
      if (originalJobData && originalJobData.thumbnail) {
        formData.originalThumbnail = originalJobData.thumbnail;
        console.log('✅ Original thumbnail preserved:', originalJobData.thumbnail);
      } else {
        console.log('⚠️ No original thumbnail found for completed job:', relistJobId);
      }
      
      // Firebase Implementation for RELIST:
      // const originalJobId = relistJobId;
      // const newJobDoc = await createJobFromTemplate(originalJobId, formData);
      // await updateCompletedJobStatus(originalJobId, { relistedAs: newJobDoc.id });
      
      console.log('🔄 Creating job template...');
      await createJobTemplate(formData, jobNumber);
      console.log('✅ Job template created');
      
      console.log('🔄 Adding job preview card...');
      await addJobPreviewCard(formData, jobNumber);
      console.log('✅ Job preview card added');
      
      console.log('🔄 Storing job data...');
      storeJobData(formData, jobNumber);
      console.log('✅ Job data stored');
      
    } else {
      console.log('🆕 NEW MODE: Starting new job creation process...');
      
      // NEW MODE: Create completely new job
      console.log('🔍 Getting next job number for category:', formData.category);
      jobNumber = getNextJobNumber(formData.category);
      jobId = `${formData.category}_job_2025_${jobNumber}`;
      console.log('✅ New job ID generated:', jobId, 'with job number:', jobNumber);
      
      // Firebase Implementation for NEW:
      // const newJobDoc = await createNewJobDocument(formData);
      
      console.log('🔄 Creating job template...');
      await createJobTemplate(formData, jobNumber);
      console.log('✅ Job template created');
      
      console.log('🔄 Adding job preview card...');
      await addJobPreviewCard(formData, jobNumber);
      console.log('✅ Job preview card added');
      
      console.log('🔄 Storing job data...');
      storeJobData(formData, jobNumber);
      console.log('✅ Job data stored');
    }
    
    // Close preview overlay
    console.log('🔄 Closing preview overlay...');
    if (previewOverlay) {
      previewOverlay.style.display = 'none';
      console.log('✅ Preview overlay closed');
    }
    
    // Reset button state before showing success overlay
    if (postBtn) {
      const resetText = mode === 'edit' ? 'UPDATE JOB' : 'POST JOB';
      console.log(`🔄 Resetting button state: ${resetText}`);
      postBtn.textContent = resetText;
      postBtn.disabled = false;
    }
    
    // Show appropriate success overlay based on mode
    console.log(`🎉 Determining overlay to show - mode: ${mode}`);
    if (mode === 'edit') {
      console.log('🎉 MODIFY detected - showing job updated overlay');
      showJobUpdatedOverlay(formData);
    } else if (mode === 'relist') {
      console.log('🎉 RELIST detected - showing job relisted overlay');
      showJobRelistedOverlay(formData);
    } else {
      console.log('🎉 NEW POST detected - showing job posted overlay');
      showJobPostedOverlay(formData);
    }
    
    console.log('🎉 createJobPostWithData function completed successfully!');
    
  } catch (error) {
    console.error(`❌ Error ${mode}ing job post:`, error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      formData,
      mode,
      jobNumber,
      jobId
    });
    
    // Reset button state
    if (postBtn) {
      const resetText = mode === 'edit' ? 'UPDATE JOB' : 'POST JOB';
      console.log(`🔄 Resetting button state after error: ${resetText}`);
      postBtn.textContent = resetText;
      postBtn.disabled = false;
    }
    
    // Show error overlay with mode-specific message
    const errorMessage = mode === 'edit' 
      ? 'Error updating job. Please try again.\n\nIf the problem persists, please refresh the page and try again.'
      : mode === 'relist'
      ? 'Error relisting job. Please try again.\n\nIf the problem persists, please refresh the page and try again.'
      : 'Error posting job. Please try again.\n\nIf the problem persists, please refresh the page and try again.';
    
    console.log('🔄 Showing error overlay...');
    showValidationOverlay(errorMessage + '\n\nError details: ' + error.message);
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
  
  // FIXED: Create job object with proper field mapping to match mock data structure
  const jobObject = {
    jobId: `${formData.category}_job_2025_${jobNumber}`,  // Proper jobId format
    jobNumber: jobNumber,
    posterId: 'user_peter_ang_001',  // Current user ID - matches jobs.js CURRENT_USER_ID
    posterName: 'Peter J. Ang',      // Current user name
    
    // Map form data to correct field names (same as updateStoredJobData)
    title: formData.jobTitle,           // Form: jobTitle → Mock: title
    description: formData.description,
    category: formData.category,
    thumbnail: formData.photo || formData.originalThumbnail || `public/mock/mock-${formData.category}-post${jobNumber}.jpg`,
    jobDate: formData.jobDate,
    dateNeeded: formData.jobDate,       // Backend field name
    startTime: formData.startTime,
    endTime: formData.endTime,
    priceOffer: formData.paymentAmount, // Remove ₱ symbol for form population
    paymentAmount: formData.paymentAmount, // Backend field name
    paymentType: formData.paymentType,
    region: formData.region,
    city: formData.city,
    extras: formData.extras || [],
    
    // Required mock data fields
    status: 'active',
    applicationCount: 0,
    applicationIds: [],
    datePosted: new Date().toISOString(),
    jobPageUrl: `${formData.category}.html`,
    
    // Timestamps
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
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
    photo: formData.photo || formData.originalThumbnail || `public/mock/mock-${formData.category}-post${jobNumber}.jpg`,
    templateUrl: `dynamic-job.html?category=${formData.category}&jobNumber=${jobNumber}`,
    region: formData.region,
    city: formData.city,
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
  initializeKeyboardHandling(); // Add keyboard handling for Chrome Android
  initializeLocationMenus();
  initializeTimeDropdowns(); // Add time dropdown initialization
  initializeTimePeriodDropdowns(); // Add AM/PM dropdown initialization for mobile
  // initializePaymentDropdown(); // DISABLED - New modal system handles payment dropdown
  initializePhotoUpload(); // Add photo upload initialization
  initializePostJobButton(); // Add post job button initialization
  initializePaymentValidation(); // Add payment amount validation
  initializeJobTitleCharacterCounter(); // Add job title character counter
  initializeMobileKeyboardClose(); // Add mobile keyboard close functionality
  
  // Handle URL parameters for EDIT and RELIST modes
  handleUrlParameters();
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

// ========================== JOB POSTED OVERLAY ==========================

function showJobPostedOverlay(formData) {
  const overlay = document.getElementById('jobPostedOverlay');
  if (!overlay) return;

  // Prevent background scroll
  document.body.style.overflow = 'hidden';
  
  // Scroll window to top before showing overlay
  window.scrollTo(0, 0);
  
  // Show overlay
  overlay.style.display = 'block';
    overlay.classList.add('show');

  // Force scroll to top for overlay and modal (fix stubborn mobile browsers)
  overlay.scrollTop = 0;
  const modal = overlay.querySelector('.job-posted-modal');
  if (modal) modal.scrollTop = 0;

  // Repeat after a short delay to defeat browser quirks
  setTimeout(() => {
    window.scrollTo(0, 0);
    overlay.scrollTop = 0;
    if (modal) modal.scrollTop = 0;
  }, 50);
  
  // ...existing code for populating overlay content and setting up events...
  initializeJobPostedOverlayEvents(formData);
}

// Patch closeJobPostedOverlay to restore body scroll
function closeJobPostedOverlay() {
  const overlay = document.getElementById('jobPostedOverlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlay.classList.remove('show');
  }
  document.body.style.overflow = '';
}

function initializeJobPostedOverlayEvents(formData) {
  const goToMessagesBtn = document.getElementById('goToMessagesBtn');
  const viewJobPostBtn = document.getElementById('viewJobPostBtn');
  const gotItBtn = document.getElementById('jobPostedGotItBtn');
  
  // Go to Messages button (placeholder for future Messages page)
  goToMessagesBtn.addEventListener('click', function() {
    closeJobPostedOverlay();
    // TODO: Redirect to Messages page when created
    alert('Messages page coming soon! For now, redirecting to job listing.');
    window.location.href = `${formData.category}.html`;
  });
  
  // View Job Post button
  viewJobPostBtn.addEventListener('click', function() {
    closeJobPostedOverlay();
    // Get the job number from localStorage to construct URL
    const jobData = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
    const categoryJobs = jobData[formData.category] || [];
    const latestJob = categoryJobs[categoryJobs.length - 1]; // Get the latest job posted
    
    if (latestJob) {
      window.location.href = `dynamic-job.html?category=${formData.category}&jobNumber=${latestJob.jobNumber}`;
    } else {
      window.location.href = `${formData.category}.html`;
    }
  });
  
  // Got It button
  gotItBtn.addEventListener('click', function() {
    closeJobPostedOverlay();
    window.location.href = `${formData.category}.html`;
  });
  
  // Close overlay when clicking outside
  const overlay = document.getElementById('jobPostedOverlay');
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      closeJobPostedOverlay();
      window.location.href = `${formData.category}.html`;
    }
  });
}

// ========================== URL PARAMETER HANDLING FOR EDIT/RELIST MODES ==========================

function handleUrlParameters() {
  const urlParams = new URLSearchParams(window.location.search);
  const editJobId = urlParams.get('edit');
  const relistJobId = urlParams.get('relist');
  const category = urlParams.get('category');
  
  console.log('🔍 URL Parameters:', { 
    editJobId, 
    relistJobId, 
    category, 
    fullUrl: window.location.href 
  });
  
  if (editJobId && category) {
    console.log(`📝 EDIT mode detected: jobId=${editJobId}, category=${category}`);
    handleEditMode(editJobId, category);
  } else if (relistJobId && category) {
    console.log(`🔄 RELIST mode detected: jobId=${relistJobId}, category=${category}`);
    handleRelistMode(relistJobId, category);
  } else {
    console.log('ℹ️ No edit/relist parameters found - normal new post mode');
  }
}

async function handleEditMode(jobId, category) {
  try {
    // Update page title
    document.getElementById('newPostTitle').textContent = 'EDIT POST';
    
    // Load job data from active listings
    const jobData = await getActiveJobData(jobId);
    if (!jobData) {
      console.error(`❌ Active job not found: ${jobId}`);
      showValidationOverlay('Job not found. Redirecting to new post...');
      return;
    }
    
    console.log(`📋 Loading job data for editing:`, jobData);
    await populateFormWithJobData(jobData, category, 'edit');
    
  } catch (error) {
    console.error(`❌ Error loading job for editing:`, error);
    showValidationOverlay('Error loading job data. Please try again.');
  }
}

async function handleRelistMode(jobId, category) {
  try {
    // Update page title
    document.getElementById('newPostTitle').textContent = 'RELIST JOB';
    
    // Load job data from completed jobs
    const jobData = await getCompletedJobData(jobId);
    if (!jobData) {
      console.error(`❌ Completed job not found: ${jobId}`);
      showValidationOverlay('Job not found. Redirecting to new post...');
      return;
    }
    
    console.log(`📋 Loading completed job data for relisting:`, jobData);
    
    // CRITICAL FIX: Use jobData.category instead of URL category parameter
    // The URL category might be 'null' or incorrect, but jobData.category is from the actual job
    const actualCategory = jobData.category || category;
    console.log(`📂 Using category from job data: ${actualCategory} (URL had: ${category})`);
    
    await populateFormWithJobData(jobData, actualCategory, 'relist');
    
    // Track RELIST mode for analytics (Firebase Integration)
    // await trackJobAction('relist_initiated', { 
    //   originalJobId: jobId, 
    //   category: actualCategory, 
    //   timestamp: Date.now() 
    // });
    
  } catch (error) {
    console.error(`❌ Error loading job for relisting:`, error);
    showValidationOverlay('Error loading job data. Please try again.');
  }
}

async function getActiveJobData(jobId) {
  // Access active job data from JobsDataService
  // In Firebase: db.collection('jobs').doc(jobId).get()
  
  try {
    // Check if JobsDataService is available (from jobs.js)
    if (typeof JobsDataService !== 'undefined') {
      console.log('🔍 Using JobsDataService to find active job:', jobId);
      
      // Ensure data is available (initialize if needed)
      JobsDataService.initialize();
      
      const job = await JobsDataService.getJobById(jobId);
      if (job) {
        console.log('✅ Found job in JobsDataService:', job);
        return {
          ...job,
          category: job.category,
          description: job.description || '', // Add description field
          priceOffer: job.priceOffer || '', // Add price field
          dateNeeded: job.jobDate, // Map jobDate to dateNeeded
          region: 'CEBU', // Default region
          city: 'Cebu City' // Default city
        };
      }
    }
    
    // Fallback: Try localStorage method for jobs posted through new-post form
    const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
    
    // Search through all categories for the job
    for (const category in allJobs) {
      const categoryJobs = allJobs[category] || [];
      const job = categoryJobs.find(j => j.jobId === jobId);
      if (job) {
        console.log('📋 Found job in localStorage:', job);
        return {
          ...job,
          category: category
        };
      }
    }
    
    console.log('❌ Job not found in any data source:', jobId);
    console.log('🔍 Available job IDs in JobsDataService:', 
      typeof JobsDataService !== 'undefined' ? 
        JobsDataService.initialize().map(j => j.jobId) : 
        'JobsDataService not available'
    );
    return null;
  } catch (error) {
    console.error('Error loading active job data:', error);
    return null;
  }
}

async function getCompletedJobData(jobId) {
  // Access completed job data OR hiring job data for RELIST functionality
  // In Firebase: db.collection('completedJobs').doc(jobId).get() OR db.collection('hiredJobs').doc(jobId).get()
  
  try {
    // First, try to find in completed jobs
    if (typeof getCompletedJobs !== 'undefined') {
      console.log('🔍 Using getCompletedJobs to find completed job:', jobId);
      const completedJobs = await getCompletedJobs();
      const job = completedJobs.find(j => j.jobId === jobId);
      
      if (job) {
        console.log('📋 Found completed job:', job);
        return {
          ...job,
          // Map completed job fields to form fields if needed
          jobId: job.jobId,
          title: job.title,
          description: job.description || '',
          priceOffer: job.priceOffer,
          startTime: job.startTime,
          endTime: job.endTime,
          dateNeeded: job.jobDate, // Map jobDate to dateNeeded
          category: job.category,
          region: 'CEBU', // Default region
          city: 'Cebu City', // Default city - could be enhanced with actual location data
          thumbnail: job.thumbnail, // FIXED: Preserve original photo from completed job
        };
      }
    }
    
    // If not found in completed jobs, try hiring jobs (for RELIST from Hiring tab)
    if (typeof JobsDataService !== 'undefined') {
      console.log('🔍 Using JobsDataService to find hiring job:', jobId);
      const hiredJobs = await JobsDataService.getAllHiredJobs();
      const job = hiredJobs.find(j => j.jobId === jobId);
      
      if (job) {
        console.log('📋 Found hiring job for RELIST:', job);
        return {
          ...job,
          // Map hiring job fields to form fields
          jobId: job.jobId,
          title: job.title,
          description: job.description || '',
          priceOffer: job.priceOffer || job.paymentAmount,
          paymentAmount: job.priceOffer || job.paymentAmount,
          startTime: job.startTime,
          endTime: job.endTime,
          dateNeeded: job.jobDate, // Map jobDate to dateNeeded
          category: job.category,
          region: 'CEBU', // Default region
          city: 'Cebu City', // Default city
          thumbnail: job.thumbnail, // Preserve original photo from hiring job
        };
      }
    }
    
    // Fallback: Try localStorage method 
    const completedJobs = JSON.parse(localStorage.getItem('gisugoCompletedJobs') || '[]');
    const job = completedJobs.find(j => j.jobId === jobId);
    
    if (job) {
      console.log('📋 Found completed job in localStorage:', job);
      return {
        ...job,
        dateNeeded: job.jobDate,
        category: job.category,
        region: 'CEBU',
        city: 'Cebu City',
        thumbnail: job.thumbnail, // FIXED: Preserve original photo from completed job
      };
    }
    
    console.log('❌ Completed job not found in any data source:', jobId);
    return null;
  } catch (error) {
    console.error('Error loading completed job data:', error);
    return null;
  }
}

async function populateFormWithJobData(jobData, category, mode) {
  console.log(`📝 Populating form with job data (${mode} mode):`, jobData);
  
  // Set category first
  await setCategoryAndUpdateForm(category);
  
  // Wait a bit for category-specific elements to render
  setTimeout(() => {
    // Populate basic fields
    populateBasicFields(jobData, mode);
    
    // Populate time fields (clear for relist mode)
    populateTimeFields(jobData, mode);
    
    // Populate location and extras
    populateLocationAndExtras(jobData);
    
    console.log(`✅ Form populated successfully (${mode} mode)`);
  }, 100);
}

function populateBasicFields(jobData, mode) {
  console.log('📝 Starting basic fields population for', mode, 'mode');
  console.log('📝 Basic fields data:', {
    title: jobData.title,
    paymentAmount: jobData.paymentAmount,
    priceOffer: jobData.priceOffer,
    description: jobData.description
  });
  
  // Job title
  const titleInput = document.getElementById('jobTitleInput');
  if (titleInput && jobData.title) {
    titleInput.value = jobData.title;
    // Trigger character counter update
    titleInput.dispatchEvent(new Event('input'));
    console.log('📝 ✅ Set job title to:', jobData.title);
  } else if (!titleInput) {
    console.warn('📝 ❌ Title input element not found');
  } else {
    console.log('📝 ⚠️ No title data found');
  }
  
  // Job description (correct field ID)
  const descriptionInput = document.getElementById('jobDetailsTextarea');
  if (descriptionInput && jobData.description) {
    descriptionInput.value = jobData.description;
    // Trigger character counter update if it exists
    descriptionInput.dispatchEvent(new Event('input'));
    console.log('📝 ✅ Set description to:', jobData.description.substring(0, 50) + '...');
  } else if (!descriptionInput) {
    console.warn('📝 ❌ Description textarea element not found');
  } else {
    console.log('📝 ⚠️ No description data found');
  }
  
  // Payment amount
  const paymentInput = document.getElementById('paymentAmountInput');
  const paymentValue = jobData.paymentAmount || jobData.priceOffer;
  if (paymentInput && paymentValue) {
    // Remove currency symbol if present and handle both string and number types
    const amount = typeof paymentValue === 'string' ? paymentValue.replace('₱', '').trim() : paymentValue.toString();
    paymentInput.value = amount;
    // Trigger validation update
    paymentInput.dispatchEvent(new Event('input'));
    console.log('📝 ✅ Set payment amount to:', amount, '(from', paymentValue, ')');
  } else if (!paymentInput) {
    console.warn('📝 ❌ Payment input element not found');
  } else {
    console.log('📝 ⚠️ No payment value found');
  }
  
  // Set payment type to default "Per Hour" (avoiding "Total Amount" contamination)
  const paymentTypeLabel = document.getElementById('paymentTypeLabel');
  if (paymentTypeLabel) {
    paymentTypeLabel.textContent = 'Per Hour';
    console.log('📝 ✅ Set payment type to default: Per Hour (avoiding field contamination)');
  }
  
  console.log(`📝 Basic fields population completed for ${mode} mode`);
}

function populateTimeFields(jobData, mode) {
  if (mode === 'relist') {
    // For RELIST mode, clear date and time fields so user can set new schedule
    clearDateAndTimeFields();
    
    console.log(`🕐 Date and time fields cleared for relist mode`);
  } else {
    // For EDIT mode, populate existing time values
    const dateInput = document.getElementById('jobDateInput');
    if (dateInput && (jobData.dateNeeded || jobData.jobDate)) {
      dateInput.value = jobData.dateNeeded || jobData.jobDate;
    }
    
    // Populate time dropdowns if time data exists
    if (jobData.startTime) {
      populateTimeDropdown('Start', jobData.startTime);
    }
    if (jobData.endTime) {
      populateTimeDropdown('End', jobData.endTime);
    }
    
    console.log(`🕐 Time fields populated for edit mode`);
  }
}

function clearDateAndTimeFields() {
  // Clear date input
  const dateInput = document.getElementById('jobDateInput');
  if (dateInput) {
    dateInput.value = '';
  }
  
  // Reset time dropdowns to default placeholders
  const startTimeLabel = document.getElementById('jobTimeStartLabel');
  const endTimeLabel = document.getElementById('jobTimeEndLabel');
  const startPeriodLabel = document.getElementById('jobTimeStartPeriodLabel');
  const endPeriodLabel = document.getElementById('jobTimeEndPeriodLabel');
  
  if (startTimeLabel) startTimeLabel.textContent = 'Hour';
  if (endTimeLabel) endTimeLabel.textContent = 'Hour';
  if (startPeriodLabel) startPeriodLabel.textContent = 'AM';
  if (endPeriodLabel) endPeriodLabel.textContent = 'AM';
  
  // Clear any hidden time input values (for backend integration)
  const startTimeInput = document.getElementById('startTimeInput');
  const endTimeInput = document.getElementById('endTimeInput');
  if (startTimeInput) startTimeInput.value = '';
  if (endTimeInput) endTimeInput.value = '';
  
  // Reset form validation state for time fields
  const timeFieldsContainer = document.querySelector('.time-section');
  if (timeFieldsContainer) {
    timeFieldsContainer.classList.remove('error', 'valid');
  }
}

function populateTimeDropdown(timeType, timeValue) {
  // Parse time like "8:00 AM" or "2:30 PM"
  const timeParts = timeValue.match(/(\d+):?(\d+)?\s*(AM|PM)/i);
  if (timeParts) {
    const hour = timeParts[1];
    const period = timeParts[3].toUpperCase();
    
    const hourLabel = document.getElementById(`jobTime${timeType}Label`);
    const periodLabel = document.getElementById(`jobTime${timeType}PeriodLabel`);
    
    if (hourLabel) hourLabel.textContent = hour;
    if (periodLabel) periodLabel.textContent = period;
  }
}

function populateLocationAndExtras(jobData) {
  console.log('📍 Starting simplified location population (CORE FIELDS ONLY)');
  console.log('📍 Mock data limited to: Job Title, Date/Time, Details, Rate/Price');
  
  // Set region and city if available - basic location info only
  if (jobData.region) {
    const regionLabel = document.getElementById('newPostRegionMenuLabel');
    if (regionLabel) {
      regionLabel.textContent = jobData.region;
      console.log(`📍 ✅ Set region to: ${jobData.region}`);
    }
  }
  
  if (jobData.city) {
    const cityLabel = document.getElementById('newPostCityMenuLabel');
    if (cityLabel) {
      // Instead of showing the actual city name (which creates confusion), 
      // keep the default placeholder to force user to make a proper selection
      cityLabel.textContent = 'City/Town';
      console.log(`📍 ⚠️ City dropdown reset to placeholder - user must select: ${jobData.city}`);
      console.log(`📍 ℹ️ This prevents dropdown display issues where city shows but isn't actually selected`);
      
      // Don't set activeCity to avoid form state confusion
      // window.activeCity = jobData.city;
    }
  }
  
  // 🚫 SKIP EXTRAS AND PAYMENT TYPE - Let user select appropriate values
  // This prevents field contamination where mock data doesn't match category templates
  console.log('📍 ⚠️ SKIPPING extras and payment type population to prevent field contamination');
  console.log('📍 ℹ️ User will need to manually select category-appropriate values');
  
  console.log(`📍 Simplified location population completed`);
}

async function setCategoryAndUpdateForm(category) {
  // Set the category dropdown
  const categoryNameElement = document.getElementById('selectedCategoryName');
  if (categoryNameElement) {
    // Convert category to display name
    const displayName = category.charAt(0).toUpperCase() + category.slice(1) + ' Jobs';
    categoryNameElement.textContent = displayName;
  }
  
  // Store selected category globally
  window.selectedJobCategory = category;
  
  // Update extras configuration for this category
  updateExtrasForCategory(category);
  
  console.log(`📂 Category set to: ${category}`);
}

// ========================== MODE-SPECIFIC HELPER FUNCTIONS ==========================

async function getJobNumberFromId(jobId) {
  // Extract job number from jobId format: "category_job_2025_X"
  const parts = jobId.split('_');
  return parseInt(parts[parts.length - 1]) || 1;
  
  // Firebase Implementation:
  // const jobDoc = await db.collection('jobs').doc(jobId).get();
  // return jobDoc.data().jobNumber;
}

async function updateJobTemplate(formData, jobNumber, jobId) {
  // Update existing template data in localStorage
  const templateKey = `jobTemplate_${formData.category}_${jobNumber}`;
  const existingTemplate = JSON.parse(localStorage.getItem(templateKey) || '{}');
  
  const updatedTemplate = {
    ...existingTemplate,
    title: formData.jobTitle,
    description: formData.description,
    date: formData.jobDate,
    startTime: formData.startTime,
    endTime: formData.endTime,
    paymentAmount: formData.paymentAmount,
    paymentType: formData.paymentType,
    photo: formData.photo,
    extras: formData.extras,
    updatedAt: new Date().toISOString()
  };
  
  localStorage.setItem(templateKey, JSON.stringify(updatedTemplate));
  
  // Firebase Implementation:
  // await db.collection('jobs').doc(jobId).update({
  //   title: formData.jobTitle,
  //   description: formData.description,
  //   scheduledDate: formData.jobDate,
  //   startTime: formData.startTime,
  //   endTime: formData.endTime,
  //   paymentAmount: formData.paymentAmount,
  //   photo: formData.photo,
  //   extras: formData.extras,
  //   updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  // });
}

async function updateJobPreviewCard(formData, jobNumber, jobId) {
  // Update existing preview card in localStorage
  const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
  const categoryCards = previewCards[formData.category] || [];
  
  console.log('🔍 Updating preview card:', {
    formData: formData,
    jobNumber: jobNumber,
    jobId: jobId,
    categoryCards: categoryCards.length
  });
  
  // Find and update the specific card by jobNumber OR by matching title/data
  let cardIndex = categoryCards.findIndex(card => card.jobNumber === jobNumber);
  
  // If not found by jobNumber, try to find by title match (fallback)
  if (cardIndex === -1) {
    // Look for existing card with similar data (fallback matching)
    const existingTitles = categoryCards.map(c => c.title);
    console.log('🔍 Existing card titles:', existingTitles);
    console.log('🔍 Looking for title:', formData.jobTitle);
  }
  
  if (cardIndex !== -1) {
    const date = new Date(formData.jobDate);
    const options = { month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    const timeDisplay = `${formData.startTime} - ${formData.endTime}`;
    
    const originalCard = categoryCards[cardIndex];
    console.log('🔍 Original preview card:', originalCard);
    
    categoryCards[cardIndex] = {
      ...originalCard, // Keep existing data
      title: formData.jobTitle,
      extra1: formData.extras && formData.extras[0] ? formData.extras[0] : '',
      extra2: formData.extras && formData.extras[1] ? formData.extras[1] : '',
      price: `₱${formData.paymentAmount}`,
      rate: formData.paymentType,
      date: formattedDate,
      time: timeDisplay,
      photo: formData.photo || originalCard.photo,
      updatedAt: new Date().toISOString()
    };
    
    console.log('✅ Preview card updated:', categoryCards[cardIndex]);
    localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
    console.log('✅ Preview card data saved to localStorage');
  } else {
    console.error('❌ Preview card not found for update:', { 
      jobNumber, 
      jobId,
      availableCards: categoryCards.map(c => ({ jobNumber: c.jobNumber, title: c.title }))
    });
  }
  
  // Firebase Implementation:
  // await db.collection('jobPreviews').doc(jobId).update({
  //   title: formData.jobTitle,
  //   paymentAmount: formData.paymentAmount,
  //   scheduledDate: formData.jobDate,
  //   startTime: formData.startTime,
  //   endTime: formData.endTime,
  //   extras: formData.extras,
  //   updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  // });
}

function updateStoredJobData(formData, jobNumber, jobId) {
  // Update existing job data in localStorage
  const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  const categoryJobs = allJobs[formData.category] || [];
  
  console.log('🔍 Updating stored job data:', {
    formData: formData,
    jobNumber: jobNumber, 
    jobId: jobId,
    categoryJobs: categoryJobs.length
  });
  
  // Find and update the specific job by jobId (not jobNumber as mock data uses jobId)
  const jobIndex = categoryJobs.findIndex(job => job.jobId === jobId);
  console.log('🔍 Job index found:', jobIndex);
  
  if (jobIndex !== -1) {
    // Job exists in localStorage - update it
    const originalJob = categoryJobs[jobIndex];
    console.log('🔍 Original job data (from localStorage):', originalJob);
    
    // FIXED: Properly map form fields to mock data structure
    const updatedJob = {
      ...originalJob, // Keep existing data (posterId, posterName, status, etc.)
      
      // Map form data to correct field names
      title: formData.jobTitle,           // Form: jobTitle → Mock: title
      description: formData.description,
      category: formData.category,
      thumbnail: formData.photo || originalJob.thumbnail,  // Keep original if no new photo
      jobDate: formData.jobDate,
      dateNeeded: formData.jobDate,       // Backend field name
      startTime: formData.startTime,
      endTime: formData.endTime,
      priceOffer: formData.paymentAmount, // Remove ₱ symbol for form population
      paymentAmount: formData.paymentAmount, // Backend field name
      paymentType: formData.paymentType,
      region: formData.region,
      city: formData.city,
      extras: formData.extras || [],
      
      // Preserve critical existing fields
      jobId: jobId,
      jobNumber: jobNumber,
      posterId: originalJob.posterId,     // Keep original poster info
      posterName: originalJob.posterName,
      status: originalJob.status || 'active',
      applicationCount: originalJob.applicationCount || 0,
      applicationIds: originalJob.applicationIds || [],
      datePosted: originalJob.datePosted,
      jobPageUrl: originalJob.jobPageUrl || `${formData.category}.html`,
      
      // Update timestamp
      updatedAt: new Date().toISOString()
    };
    
    categoryJobs[jobIndex] = updatedJob;
    console.log('✅ Job data updated with proper field mapping:', categoryJobs[jobIndex]);
  } else {
    // Job doesn't exist in localStorage yet (it's a mock job) - create localStorage version
    console.log('🆕 Job not found in localStorage - this is a mock job being modified for first time');
    
    // Get original mock job data from jobs.js to preserve critical fields
    let originalMockJob = null;
    try {
      // Access the mock data from the global JobsDataService if available
      if (window.JobsDataService) {
        const mockJobs = window.JobsDataService._generateInitialData();
        originalMockJob = mockJobs.find(job => job.jobId === jobId);
      }
    } catch (error) {
      console.log('⚠️ Could not access mock data directly:', error);
    }
    
    // Create new job entry for localStorage with mock job data preserved
    const newJob = {
      // Use original mock data as base if available
      ...(originalMockJob || {}),
      
      // Map form data to correct field names (override mock data)
      title: formData.jobTitle,           // Form: jobTitle → Mock: title
      description: formData.description,
      category: formData.category,
      thumbnail: formData.photo || (originalMockJob ? originalMockJob.thumbnail : ''),
      jobDate: formData.jobDate,
      dateNeeded: formData.jobDate,       // Backend field name
      startTime: formData.startTime,
      endTime: formData.endTime,
      priceOffer: formData.paymentAmount, // Remove ₱ symbol for form population
      paymentAmount: formData.paymentAmount, // Backend field name
      paymentType: formData.paymentType,
      region: formData.region,
      city: formData.city,
      extras: formData.extras || [],
      
      // Ensure critical fields are present
      jobId: jobId,
      jobNumber: jobNumber,
      posterId: originalMockJob ? originalMockJob.posterId : 'user_peter_ang_001',
      posterName: originalMockJob ? originalMockJob.posterName : 'Peter J. Ang',
      status: originalMockJob ? originalMockJob.status : 'active',
      applicationCount: originalMockJob ? originalMockJob.applicationCount : 0,
      applicationIds: originalMockJob ? originalMockJob.applicationIds : [],
      datePosted: originalMockJob ? originalMockJob.datePosted : new Date().toISOString(),
      jobPageUrl: originalMockJob ? originalMockJob.jobPageUrl : `${formData.category}.html`,
      
      // Update timestamp
      updatedAt: new Date().toISOString()
    };
    
    categoryJobs.push(newJob);
    console.log('✅ Mock job converted to localStorage job:', newJob);
  }
  
  // Save the updated data back to localStorage
  allJobs[formData.category] = categoryJobs;
  localStorage.setItem('gisugoJobs', JSON.stringify(allJobs));
  console.log('✅ Job data saved to localStorage');
  
  // Firebase Implementation:
  // await db.collection('jobs').doc(jobId).update({
  //   ...formData,
  //   updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  // });
}

function showJobUpdatedOverlay(formData) {
  console.log('🎉 Showing job updated overlay (MODIFY)');
  console.log('🔍 Form data for overlay:', formData);
  
  // Show success overlay for updated job
  const overlay = document.getElementById('jobPostedOverlay');
  console.log('🔍 Overlay element found:', !!overlay);
  
  if (overlay) {
    // Update overlay content for update mode - use correct selectors
    const title = overlay.querySelector('.job-posted-title');
    const subtitle = overlay.querySelector('.job-posted-subtitle');
    
    console.log('🔍 Title element found:', !!title);
    console.log('🔍 Subtitle element found:', !!subtitle);
    console.log('🔍 Title element classes:', title ? Array.from(title.classList) : 'N/A');
    console.log('🔍 Subtitle element classes:', subtitle ? Array.from(subtitle.classList) : 'N/A');
    
    if (title) {
      title.textContent = '✏️ Job Modified Successfully!';
      console.log('✅ Title updated to:', title.textContent);
    } else {
      console.error('❌ Title element not found with selector: .job-posted-title');
    }
    
    if (subtitle) {
      subtitle.textContent = `Your job "${formData.jobTitle}" has been successfully modified and is now updated.`;
      console.log('✅ Subtitle updated to:', subtitle.textContent);
    } else {
      console.error('❌ Subtitle element not found with selector: .job-posted-subtitle');
    }
    
    // AGGRESSIVE mobile overlay fix - force visibility on all devices
    overlay.style.display = 'flex !important';
    overlay.style.visibility = 'visible !important';
    overlay.style.opacity = '1 !important';
    overlay.style.zIndex = '999999 !important';  // Even higher z-index for mobile
    overlay.style.position = 'fixed !important';
    overlay.style.top = '0 !important';
    overlay.style.left = '0 !important';
    overlay.style.width = '100vw !important';
    overlay.style.height = '100vh !important';
    overlay.style.alignItems = 'center !important';
    overlay.style.justifyContent = 'center !important';
    overlay.style.backdropFilter = 'blur(8px)';
    
    // Apply !important styles programmatically for better mobile compatibility
    overlay.setAttribute('style', `
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      z-index: 999999 !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      align-items: center !important;
      justify-content: center !important;
      backdrop-filter: blur(8px) !important;
      background: rgba(0, 0, 0, 0.8) !important;
    `);
    
    // Force a reflow to ensure styles are applied
    overlay.offsetHeight;
    
    console.log('✅ Job updated overlay displayed and fully visible');
    console.log('🔍 Overlay computed styles:', {
      display: window.getComputedStyle(overlay).display,
      visibility: window.getComputedStyle(overlay).visibility,
      opacity: window.getComputedStyle(overlay).opacity,
      zIndex: window.getComputedStyle(overlay).zIndex,
      position: window.getComputedStyle(overlay).position
    });
    
    // Scroll to top to ensure overlay is visible
    window.scrollTo(0, 0);
    
    // Initialize navigation events for updated job
    initializeJobUpdatedOverlayEvents(formData);
    
    // No auto-redirect - user must click OK button
  } else {
    console.error('❌ Job posted overlay element not found - checking DOM...');
    console.log('🔍 Available overlays in DOM:', Array.from(document.querySelectorAll('[id*="overlay"]')).map(el => el.id));
    console.log('🔍 Available elements with "job-posted" class:', Array.from(document.querySelectorAll('[class*="job-posted"]')).map(el => ({id: el.id, classes: Array.from(el.classList)})));
  }
}

function showJobRelistedOverlay(formData) {
  console.log('🎉 Showing job relisted overlay');
  console.log('🔍 Form data for RELIST overlay:', formData);
  
  // Show success overlay for relisted job
  const overlay = document.getElementById('jobPostedOverlay');
  if (overlay) {
    // Update overlay content for relist mode - use correct selectors
    const title = overlay.querySelector('.job-posted-title');
    const subtitle = overlay.querySelector('.job-posted-subtitle');
    
    if (title) title.textContent = '🔄 Job Relisted Successfully!';
    if (subtitle) subtitle.textContent = `Your job "${formData.jobTitle}" has been successfully relisted and is now active.`;
    
    // AGGRESSIVE mobile overlay fix - force visibility on all devices  
    overlay.setAttribute('style', `
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
      z-index: 999999 !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      align-items: center !important;
      justify-content: center !important;
      backdrop-filter: blur(8px) !important;
      background: rgba(0, 0, 0, 0.8) !important;
    `);
    
    console.log('✅ Job relisted overlay displayed');
    
    // Initialize navigation events for relisted job
    initializeJobRelistedOverlayEvents(formData);
    
    // No auto-redirect - user must click OK button
  } else {
    console.error('❌ Job posted overlay element not found');
  }
}

// Navigation events for updated job overlay
function initializeJobUpdatedOverlayEvents(formData) {
  const goToMessagesBtn = document.getElementById('goToMessagesBtn');
  const viewJobPostBtn = document.getElementById('viewJobPostBtn');
  const gotItBtn = document.getElementById('jobPostedGotItBtn');
  const overlay = document.getElementById('jobPostedOverlay');
  
  // Remove any existing listeners to prevent duplicates
  const newGoToMessagesBtn = goToMessagesBtn.cloneNode(true);
  const newViewJobPostBtn = viewJobPostBtn.cloneNode(true);
  const newGotItBtn = gotItBtn.cloneNode(true);
  
  goToMessagesBtn.parentNode.replaceChild(newGoToMessagesBtn, goToMessagesBtn);
  viewJobPostBtn.parentNode.replaceChild(newViewJobPostBtn, viewJobPostBtn);
  gotItBtn.parentNode.replaceChild(newGotItBtn, gotItBtn);
  
  // Add new event listeners - Navigate back to Jobs > Listings tab for MODIFY with forced refresh
  newGoToMessagesBtn.addEventListener('click', function() {
    console.log('🔄 Navigating back to Jobs > Listings tab after MODIFY with refresh');
    closeJobPostedOverlay();
    window.location.href = `jobs.html?refresh=${Date.now()}&tab=listings`;
  });
  
  newViewJobPostBtn.addEventListener('click', function() {
    console.log('🔄 Navigating back to Jobs > Listings tab after MODIFY with refresh');
    closeJobPostedOverlay();
    window.location.href = `jobs.html?refresh=${Date.now()}&tab=listings`;
  });
  
  newGotItBtn.addEventListener('click', function() {
    console.log('🔄 Navigating back to Jobs > Listings tab after MODIFY with refresh');
    closeJobPostedOverlay();
    window.location.href = `jobs.html?refresh=${Date.now()}&tab=listings`;
  });
  
  // Close overlay when clicking outside and redirect
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      console.log('🔄 Navigating back to Jobs > Listings tab after MODIFY with refresh');
      closeJobPostedOverlay();
      window.location.href = `jobs.html?refresh=${Date.now()}&tab=listings`;
    }
  });
}

// Navigation events for relisted job overlay
function initializeJobRelistedOverlayEvents(formData) {
  console.log('🔗 Initializing RELIST overlay events for category:', formData.category);
  
  const goToMessagesBtn = document.getElementById('goToMessagesBtn');
  const viewJobPostBtn = document.getElementById('viewJobPostBtn');
  const gotItBtn = document.getElementById('jobPostedGotItBtn');
  const overlay = document.getElementById('jobPostedOverlay');
  
  // Remove any existing listeners to prevent duplicates
  const newGoToMessagesBtn = goToMessagesBtn.cloneNode(true);
  const newViewJobPostBtn = viewJobPostBtn.cloneNode(true);
  const newGotItBtn = gotItBtn.cloneNode(true);
  
  goToMessagesBtn.parentNode.replaceChild(newGoToMessagesBtn, goToMessagesBtn);
  viewJobPostBtn.parentNode.replaceChild(newViewJobPostBtn, viewJobPostBtn);
  gotItBtn.parentNode.replaceChild(newGotItBtn, gotItBtn);
  
  // Determine category page URL
  const categoryPage = `${formData.category}.html`;
  console.log(`🎯 RELIST redirects will go to: ${categoryPage}`);
  
  // Add new event listeners - Navigate to CATEGORY PAGE for RELIST with forced refresh
  newGoToMessagesBtn.addEventListener('click', function() {
    const categoryPageWithRefresh = `${categoryPage}?refresh=${Date.now()}`;
    console.log(`🔄 Navigating to category page after RELIST with refresh: ${categoryPageWithRefresh}`);
    closeJobPostedOverlay();
    window.location.href = categoryPageWithRefresh;
  });
  
  newViewJobPostBtn.addEventListener('click', function() {
    const categoryPageWithRefresh = `${categoryPage}?refresh=${Date.now()}`;
    console.log(`🔄 Navigating to category page after RELIST with refresh: ${categoryPageWithRefresh}`);
    closeJobPostedOverlay();
    window.location.href = categoryPageWithRefresh;
  });
  
  newGotItBtn.addEventListener('click', function() {
    const categoryPageWithRefresh = `${categoryPage}?refresh=${Date.now()}`;
    console.log(`🔄 Navigating to category page after RELIST with refresh: ${categoryPageWithRefresh}`);
    closeJobPostedOverlay();
    window.location.href = categoryPageWithRefresh;
  });
  
  // Close overlay when clicking outside and redirect
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      const categoryPageWithRefresh = `${categoryPage}?refresh=${Date.now()}`;
      console.log(`🔄 Navigating to category page after RELIST with refresh: ${categoryPageWithRefresh}`);
      closeJobPostedOverlay();
      window.location.href = categoryPageWithRefresh;
    }
  });
}

// --- JOB DATA VALIDATION AND CLEANUP (ISOLATED TO NEW-POST) ---
function isValidJob(job) {
  return (
    job &&
    typeof job.jobNumber === 'number' &&
    job.jobNumber > 0 &&
    typeof job.jobId === 'string' &&
    job.jobId.length > 0 &&
    typeof job.title === 'string' &&
    job.title.length > 0 &&
    typeof job.category === 'string' &&
    job.category.length > 0
    // Add more required fields as needed
  );
}

function cleanUpJobsData() {
  console.log('🧹 Starting job data cleanup...');
  
  const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  let cleaned = false;
  let totalJobs = 0;
  let removedJobs = 0;
  
  Object.keys(allJobs).forEach(category => {
    const before = allJobs[category].length;
    totalJobs += before;
    
    // More lenient filtering - only remove completely corrupted entries
    allJobs[category] = allJobs[category].filter(job => {
      // Keep job if it has basic structure
      if (!job || typeof job !== 'object') {
        removedJobs++;
        return false;
      }
      
      // Keep job if it has at least a title or jobId
      if ((!job.title || job.title.length === 0) && 
          (!job.jobId || job.jobId.length === 0)) {
        removedJobs++;
        return false;
      }
      
      return true;
    });
    
    if (allJobs[category].length !== before) {
      cleaned = true;
      console.log(`🧹 Cleaned ${category}: ${before} → ${allJobs[category].length} jobs`);
    }
  });
  
  if (cleaned) {
    localStorage.setItem('gisugoJobs', JSON.stringify(allJobs));
    console.log(`🧹 Cleanup complete: ${removedJobs} corrupted jobs removed from ${totalJobs} total`);
    alert(`Job data cleaned! ${removedJobs} corrupted jobs removed from ${totalJobs} total jobs.`);
  } else {
    console.log('🧹 No corrupted jobs found. Data is clean.');
    alert('No corrupted jobs found. Data is clean.');
  }
}

// Patch getNextJobNumber to skip invalid jobs
function getNextJobNumber(category) {
  const jobData = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  const categoryJobs = (jobData[category] || []).filter(isValidJob);
  let maxJobNumber = 0;
  categoryJobs.forEach(job => {
    const jobNumber = parseInt(job.jobNumber, 10);
    if (Number.isInteger(jobNumber) && jobNumber > 0) {
      if (jobNumber > maxJobNumber) {
        maxJobNumber = jobNumber;
      }
    }
  });
  return maxJobNumber + 1;
}

// Patch storeJobData to validate before saving
function storeJobData(formData, jobNumber) {
  const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  if (!allJobs[formData.category]) {
    allJobs[formData.category] = [];
  }
  const jobObject = {
    jobId: `${formData.category}_job_2025_${jobNumber}`,
    jobNumber: jobNumber,
    posterId: 'user_peter_ang_001',
    posterName: 'Peter J. Ang',
    title: formData.jobTitle,
    description: formData.description,
    category: formData.category,
    thumbnail: formData.photo || formData.originalThumbnail || `public/mock/mock-${formData.category}-post${jobNumber}.jpg`,
    jobDate: formData.jobDate,
    dateNeeded: formData.jobDate,
    startTime: formData.startTime,
    endTime: formData.endTime,
    priceOffer: formData.paymentAmount,
    paymentAmount: formData.paymentAmount,
    paymentType: formData.paymentType,
    region: formData.region,
    city: formData.city,
    extras: formData.extras || [],
    status: 'active',
    applicationCount: 0,
    applicationIds: [],
    datePosted: new Date().toISOString(),
    jobPageUrl: `${formData.category}.html`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  if (isValidJob(jobObject)) {
    allJobs[formData.category].push(jobObject);
    localStorage.setItem('gisugoJobs', JSON.stringify(allJobs));
  } else {
    alert('Error: Attempted to save invalid job data. Job not saved.');
  }
}

// --- DEBUG PANEL BUTTON FOR CLEANUP ---
window.addEventListener('DOMContentLoaded', function() {
  const debugPanel = document.getElementById('debugPanel');
  if (debugPanel) {
    const cleanBtn = document.createElement('button');
    cleanBtn.textContent = 'CLEANUP JOB DATA';
    cleanBtn.style.background = '#f87171';
    cleanBtn.style.color = 'white';
    cleanBtn.style.border = 'none';
    cleanBtn.style.padding = '8px 16px';
    cleanBtn.style.borderRadius = '4px';
    cleanBtn.style.cursor = 'pointer';
    cleanBtn.style.marginLeft = '10px';
    cleanBtn.onclick = cleanUpJobsData;
    debugPanel.querySelector('div').appendChild(cleanBtn);
  }
});

// --- JOB DATA RECOVERY FUNCTION ---
function recoverJobsData() {
  console.log('🔄 Starting job data recovery...');
  
  // First, let's see what's currently in localStorage
  console.log('📊 Current localStorage contents:');
  const allKeys = Object.keys(localStorage);
  console.log('All localStorage keys:', allKeys);
  
  // Show current gisugoJobs data
  const currentJobs = localStorage.getItem('gisugoJobs');
  console.log('Current gisugoJobs data:', currentJobs);
  
  if (currentJobs) {
    try {
      const parsed = JSON.parse(currentJobs);
      console.log('Parsed gisugoJobs:', parsed);
      console.log('Categories found:', Object.keys(parsed));
      Object.keys(parsed).forEach(category => {
        console.log(`${category}: ${parsed[category].length} jobs`);
      });
    } catch (e) {
      console.log('Error parsing gisugoJobs:', e);
    }
  }
  
  // Look for any other potential job data
  const jobKeys = allKeys.filter(key => 
    key.includes('job') || 
    key.includes('gisugo') || 
    key.includes('Jobs') ||
    key.includes('Job') ||
    key.includes('post') ||
    key.includes('listing')
  );
  
  console.log('🔍 Found potential job data keys:', jobKeys);
  
  let recoveredJobs = {};
  let totalRecovered = 0;
  
  jobKeys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      console.log(`🔍 Checking key "${key}":`, data ? data.substring(0, 200) + '...' : 'null');
      
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          // Check if this looks like job data
          if (Array.isArray(parsed)) {
            // Array of jobs
            console.log(`📋 Found array in ${key} with ${parsed.length} items`);
            const validJobs = parsed.filter(job => 
              job && typeof job === 'object' && 
              (job.title || job.jobId || job.category)
            );
            if (validJobs.length > 0) {
              recoveredJobs[key] = validJobs;
              totalRecovered += validJobs.length;
              console.log(`🔄 Recovered ${validJobs.length} jobs from ${key}`);
            }
          } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Object with categories
            console.log(`📋 Found object in ${key} with keys:`, Object.keys(parsed));
            Object.keys(parsed).forEach(category => {
              if (Array.isArray(parsed[category])) {
                console.log(`📋 Category ${category} has ${parsed[category].length} items`);
                const validJobs = parsed[category].filter(job => 
                  job && typeof job === 'object' && 
                  (job.title || job.jobId || job.category)
                );
                if (validJobs.length > 0) {
                  if (!recoveredJobs[category]) recoveredJobs[category] = [];
                  recoveredJobs[category].push(...validJobs);
                  totalRecovered += validJobs.length;
                  console.log(`🔄 Recovered ${validJobs.length} jobs from ${key}.${category}`);
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not parse ${key}:`, error.message);
    }
  });
  
  console.log('📊 Recovery summary:');
  console.log('- Total keys checked:', jobKeys.length);
  console.log('- Jobs recovered:', totalRecovered);
  console.log('- Recovered data structure:', recoveredJobs);
  
  if (totalRecovered > 0) {
    // Merge with existing data
    const existingJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
    Object.keys(recoveredJobs).forEach(category => {
      if (!existingJobs[category]) existingJobs[category] = [];
      existingJobs[category].push(...recoveredJobs[category]);
    });
    
    localStorage.setItem('gisugoJobs', JSON.stringify(existingJobs));
    console.log(`🔄 Recovery complete: ${totalRecovered} jobs restored`);
    alert(`Job data recovered! ${totalRecovered} jobs restored. Check console for details.`);
  } else {
    console.log('🔄 No recoverable job data found');
    alert('No recoverable job data found. Check console for details.');
  }
}

// --- DEBUG PANEL BUTTON FOR CLEANUP ---
window.addEventListener('DOMContentLoaded', function() {
  const debugPanel = document.getElementById('debugPanel');
  if (debugPanel) {
    const cleanBtn = document.createElement('button');
    cleanBtn.textContent = 'CLEANUP JOB DATA';
    cleanBtn.style.background = '#f87171';
    cleanBtn.style.color = 'white';
    cleanBtn.style.border = 'none';
    cleanBtn.style.padding = '8px 16px';
    cleanBtn.style.borderRadius = '4px';
    cleanBtn.style.cursor = 'pointer';
    cleanBtn.style.marginLeft = '10px';
    cleanBtn.onclick = cleanUpJobsData;
    debugPanel.querySelector('div').appendChild(cleanBtn);
    
    const recoverBtn = document.createElement('button');
    recoverBtn.textContent = 'RECOVER JOBS';
    recoverBtn.style.background = '#10b981';
    recoverBtn.style.color = 'white';
    recoverBtn.style.border = 'none';
    recoverBtn.style.padding = '8px 16px';
    recoverBtn.style.borderRadius = '4px';
    recoverBtn.style.cursor = 'pointer';
    recoverBtn.style.marginLeft = '10px';
    recoverBtn.onclick = recoverJobsData;
    debugPanel.querySelector('div').appendChild(recoverBtn);
  }
});

// --- MANUAL JOB DATA RESTORATION ---
function restoreSampleJobs() {
  console.log('🔧 Restoring sample job data...');
  
  const sampleJobs = {
    "hakot": [
      {
        "jobId": "hakot_job_2025_1",
        "jobNumber": 1,
        "posterId": "user_peter_ang_001",
        "posterName": "Peter J. Ang",
        "title": "Need help moving furniture",
        "description": "Moving from apartment to new house. Need help with heavy furniture.",
        "category": "hakot",
        "thumbnail": "public/mock/mock-hakot-post1.jpg",
        "jobDate": "2025-01-15",
        "dateNeeded": "2025-01-15",
        "startTime": "09:00",
        "endTime": "17:00",
        "priceOffer": "1500",
        "paymentAmount": "1500",
        "paymentType": "offer",
        "region": "Metro Manila",
        "city": "Quezon City",
        "extras": ["Heavy lifting", "Truck needed"],
        "status": "active",
        "applicationCount": 0,
        "applicationIds": [],
        "datePosted": "2025-01-10T08:00:00.000Z",
        "jobPageUrl": "hakot.html",
        "createdAt": "2025-01-10T08:00:00.000Z",
        "updatedAt": "2025-01-10T08:00:00.000Z"
      },
      {
        "jobId": "hakot_job_2025_2",
        "jobNumber": 2,
        "posterId": "user_peter_ang_001",
        "posterName": "Peter J. Ang",
        "title": "Office equipment transport",
        "description": "Moving office equipment to new location. Need careful handling.",
        "category": "hakot",
        "thumbnail": "public/mock/mock-hakot-post2.jpg",
        "jobDate": "2025-01-20",
        "dateNeeded": "2025-01-20",
        "startTime": "10:00",
        "endTime": "16:00",
        "priceOffer": "2000",
        "paymentAmount": "2000",
        "paymentType": "offer",
        "region": "Metro Manila",
        "city": "Makati",
        "extras": ["Careful handling", "Insurance"],
        "status": "active",
        "applicationCount": 0,
        "applicationIds": [],
        "datePosted": "2025-01-12T09:00:00.000Z",
        "jobPageUrl": "hakot.html",
        "createdAt": "2025-01-12T09:00:00.000Z",
        "updatedAt": "2025-01-12T09:00:00.000Z"
      }
    ],
    "limpyo": [
      {
        "jobId": "limpyo_job_2025_1",
        "jobNumber": 1,
        "posterId": "user_peter_ang_001",
        "posterName": "Peter J. Ang",
        "title": "Deep cleaning needed",
        "description": "Need thorough cleaning of 3-bedroom house. Includes kitchen and bathrooms.",
        "category": "limpyo",
        "thumbnail": "public/mock/mock-limpyo-post1.jpg",
        "jobDate": "2025-01-18",
        "dateNeeded": "2025-01-18",
        "startTime": "08:00",
        "endTime": "14:00",
        "priceOffer": "1200",
        "paymentAmount": "1200",
        "paymentType": "offer",
        "region": "Metro Manila",
        "city": "Manila",
        "extras": ["Deep cleaning", "Eco-friendly products"],
        "status": "active",
        "applicationCount": 0,
        "applicationIds": [],
        "datePosted": "2025-01-14T07:00:00.000Z",
        "jobPageUrl": "limpyo.html",
        "createdAt": "2025-01-14T07:00:00.000Z",
        "updatedAt": "2025-01-14T07:00:00.000Z"
      }
    ]
  };
  
  localStorage.setItem('gisugoJobs', JSON.stringify(sampleJobs));
  console.log('🔧 Sample jobs restored:', sampleJobs);
  alert('Sample job data restored! Check hakot and limpyo categories.');
}

// --- DEBUG PANEL BUTTON FOR CLEANUP ---
window.addEventListener('DOMContentLoaded', function() {
  const debugPanel = document.getElementById('debugPanel');
  if (debugPanel) {
    const cleanBtn = document.createElement('button');
    cleanBtn.textContent = 'CLEANUP JOB DATA';
    cleanBtn.style.background = '#f87171';
    cleanBtn.style.color = 'white';
    cleanBtn.style.border = 'none';
    cleanBtn.style.padding = '8px 16px';
    cleanBtn.style.borderRadius = '4px';
    cleanBtn.style.cursor = 'pointer';
    cleanBtn.style.marginLeft = '10px';
    cleanBtn.onclick = cleanUpJobsData;
    debugPanel.querySelector('div').appendChild(cleanBtn);
    
    const recoverBtn = document.createElement('button');
    recoverBtn.textContent = 'RECOVER JOBS';
    recoverBtn.style.background = '#10b981';
    recoverBtn.style.color = 'white';
    recoverBtn.style.border = 'none';
    recoverBtn.style.padding = '8px 16px';
    recoverBtn.style.borderRadius = '4px';
    recoverBtn.style.cursor = 'pointer';
    recoverBtn.style.marginLeft = '10px';
    recoverBtn.onclick = recoverJobsData;
    debugPanel.querySelector('div').appendChild(recoverBtn);
    
    const restoreBtn = document.createElement('button');
    restoreBtn.textContent = 'RESTORE SAMPLES';
    restoreBtn.style.background = '#3b82f6';
    restoreBtn.style.color = 'white';
    restoreBtn.style.border = 'none';
    restoreBtn.style.padding = '8px 16px';
    restoreBtn.style.borderRadius = '4px';
    restoreBtn.style.cursor = 'pointer';
    restoreBtn.style.marginLeft = '10px';
    restoreBtn.onclick = restoreSampleJobs;
    debugPanel.querySelector('div').appendChild(restoreBtn);
    
    const removeDuplicatesBtn = document.createElement('button');
    removeDuplicatesBtn.textContent = 'REMOVE DUPLICATES';
    removeDuplicatesBtn.style.background = '#f59e0b';
    removeDuplicatesBtn.style.color = 'white';
    removeDuplicatesBtn.style.border = 'none';
    removeDuplicatesBtn.style.padding = '8px 16px';
    removeDuplicatesBtn.style.borderRadius = '4px';
    removeDuplicatesBtn.style.cursor = 'pointer';
    removeDuplicatesBtn.style.marginLeft = '10px';
    removeDuplicatesBtn.onclick = removeDuplicateJobs;
    debugPanel.querySelector('div').appendChild(removeDuplicatesBtn);
  }
});

// --- REMOVE DUPLICATE JOBS ---
function removeDuplicateJobs() {
  console.log('🧹 Removing duplicate jobs...');
  
  const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
  let totalRemoved = 0;
  
  Object.keys(allJobs).forEach(category => {
    const before = allJobs[category].length;
    
    // Remove duplicates based on jobId
    const seen = new Set();
    allJobs[category] = allJobs[category].filter(job => {
      if (!job.jobId) return true; // Keep jobs without jobId for now
      
      if (seen.has(job.jobId)) {
        totalRemoved++;
        return false;
      }
      
      seen.add(job.jobId);
      return true;
    });
    
    const after = allJobs[category].length;
    if (before !== after) {
      console.log(`🧹 Removed ${before - after} duplicates from ${category}`);
    }
  });
  
  localStorage.setItem('gisugoJobs', JSON.stringify(allJobs));
  console.log(`🧹 Duplicate removal complete: ${totalRemoved} duplicates removed`);
  alert(`Duplicate removal complete! ${totalRemoved} duplicate jobs removed.`);
}

// --- FIXED JOB DATA RECOVERY FUNCTION ---
function recoverJobsData() {
  console.log('🔄 Starting job data recovery...');
  
  // First, let's see what's currently in localStorage
  console.log('📊 Current localStorage contents:');
  const allKeys = Object.keys(localStorage);
  console.log('All localStorage keys:', allKeys);
  
  // Show current gisugoJobs data
  const currentJobs = localStorage.getItem('gisugoJobs');
  console.log('Current gisugoJobs data:', currentJobs);
  
  if (currentJobs) {
    try {
      const parsed = JSON.parse(currentJobs);
      console.log('Parsed gisugoJobs:', parsed);
      console.log('Categories found:', Object.keys(parsed));
      Object.keys(parsed).forEach(category => {
        console.log(`${category}: ${parsed[category].length} jobs`);
      });
    } catch (e) {
      console.log('Error parsing gisugoJobs:', e);
    }
  }
  
  // Get existing job IDs to avoid duplicates
  const existingJobIds = new Set();
  if (currentJobs) {
    try {
      const parsed = JSON.parse(currentJobs);
      Object.keys(parsed).forEach(category => {
        parsed[category].forEach(job => {
          if (job.jobId) existingJobIds.add(job.jobId);
        });
      });
    } catch (e) {
      console.log('Error parsing existing jobs:', e);
    }
  }
  
  console.log('Existing job IDs:', Array.from(existingJobIds));
  
  // Look for any other potential job data
  const jobKeys = allKeys.filter(key => 
    key.includes('job') || 
    key.includes('gisugo') || 
    key.includes('Jobs') ||
    key.includes('Job') ||
    key.includes('post') ||
    key.includes('listing')
  );
  
  console.log('🔍 Found potential job data keys:', jobKeys);
  
  let recoveredJobs = {};
  let totalRecovered = 0;
  
  jobKeys.forEach(key => {
    try {
      const data = localStorage.getItem(key);
      console.log(`🔍 Checking key "${key}":`, data ? data.substring(0, 200) + '...' : 'null');
      
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed && typeof parsed === 'object') {
          // Check if this looks like job data
          if (Array.isArray(parsed)) {
            // Array of jobs
            console.log(`📋 Found array in ${key} with ${parsed.length} items`);
            const validJobs = parsed.filter(job => 
              job && typeof job === 'object' && 
              (job.title || job.jobId || job.category) &&
              !existingJobIds.has(job.jobId) // Only recover jobs not already present
            );
            if (validJobs.length > 0) {
              recoveredJobs[key] = validJobs;
              totalRecovered += validJobs.length;
              console.log(`🔄 Recovered ${validJobs.length} jobs from ${key}`);
            }
          } else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Object with categories
            console.log(`📋 Found object in ${key} with keys:`, Object.keys(parsed));
            Object.keys(parsed).forEach(category => {
              if (Array.isArray(parsed[category])) {
                console.log(`📋 Category ${category} has ${parsed[category].length} items`);
                const validJobs = parsed[category].filter(job => 
                  job && typeof job === 'object' && 
                  (job.title || job.jobId || job.category) &&
                  !existingJobIds.has(job.jobId) // Only recover jobs not already present
                );
                if (validJobs.length > 0) {
                  if (!recoveredJobs[category]) recoveredJobs[category] = [];
                  recoveredJobs[category].push(...validJobs);
                  totalRecovered += validJobs.length;
                  console.log(`🔄 Recovered ${validJobs.length} jobs from ${key}.${category}`);
                }
              }
            });
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ Could not parse ${key}:`, error.message);
    }
  });
  
  console.log('📊 Recovery summary:');
  console.log('- Total keys checked:', jobKeys.length);
  console.log('- Jobs recovered:', totalRecovered);
  console.log('- Recovered data structure:', recoveredJobs);
  
  if (totalRecovered > 0) {
    // Merge with existing data
    const existingJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
    Object.keys(recoveredJobs).forEach(category => {
      if (!existingJobs[category]) existingJobs[category] = [];
      existingJobs[category].push(...recoveredJobs[category]);
    });
    
    localStorage.setItem('gisugoJobs', JSON.stringify(existingJobs));
    console.log(`🔄 Recovery complete: ${totalRecovered} jobs restored`);
    alert(`Job data recovered! ${totalRecovered} jobs restored. Check console for details.`);
  } else {
    console.log('🔄 No recoverable job data found');
    alert('No recoverable job data found. Check console for details.');
  }
}

// Hour & AM/PM Picker Modal Logic
function initializeHourAndAmPmPickerModals() {
  // Job Start Hour
  const hourFieldStart = document.getElementById('jobTimeStartInput');
  const hourLabelStart = document.getElementById('jobTimeStartLabel');
  const modalStart = document.getElementById('hourPickerOverlay');
  const closeBtnStart = document.getElementById('hourPickerCloseBtn');
  const hourButtonsStart = modalStart.querySelectorAll('.hour-picker-item');

  // Job End Hour
  const hourFieldEnd = document.getElementById('jobTimeEndInput');
  const hourLabelEnd = document.getElementById('jobTimeEndLabel');
  const modalEnd = document.getElementById('hourPickerOverlayEnd');
  const closeBtnEnd = document.getElementById('hourPickerCloseBtnEnd');
  const hourButtonsEnd = modalEnd.querySelectorAll('.hour-picker-item');

  // AM/PM Picker (shared)
  const ampmModal = document.getElementById('ampmPickerOverlay');
  const ampmCloseBtn = document.getElementById('ampmPickerCloseBtn');
  const ampmButtons = ampmModal.querySelectorAll('.ampm-picker-item');
  let ampmTarget = null; // 'start' or 'end'
  const ampmFieldStart = document.getElementById('jobTimeStartPeriod');
  const ampmLabelStart = document.getElementById('jobTimeStartPeriodLabel');
  const ampmFieldEnd = document.getElementById('jobTimeEndPeriod');
  const ampmLabelEnd = document.getElementById('jobTimeEndPeriodLabel');

  // --- Job Start Hour ---
  if (hourFieldStart && modalStart) {
    hourFieldStart.addEventListener('click', function(e) {
      e.preventDefault();
      modalStart.style.display = 'flex';
    });
    closeBtnStart.addEventListener('click', function() {
      modalStart.style.display = 'none';
    });
    modalStart.addEventListener('click', function(e) {
      if (e.target === modalStart) modalStart.style.display = 'none';
    });
    hourButtonsStart.forEach(btn => {
      btn.addEventListener('click', function() {
        hourLabelStart.textContent = this.textContent;
        modalStart.style.display = 'none';
      });
    });
  }

  // --- Job End Hour ---
  if (hourFieldEnd && modalEnd) {
    hourFieldEnd.addEventListener('click', function(e) {
      e.preventDefault();
      modalEnd.style.display = 'flex';
    });
    closeBtnEnd.addEventListener('click', function() {
      modalEnd.style.display = 'none';
    });
    modalEnd.addEventListener('click', function(e) {
      if (e.target === modalEnd) modalEnd.style.display = 'none';
    });
    hourButtonsEnd.forEach(btn => {
      btn.addEventListener('click', function() {
        hourLabelEnd.textContent = this.textContent;
        modalEnd.style.display = 'none';
      });
    });
  }

  // --- AM/PM Picker (shared) ---
  function openAmPmModal(target) {
    ampmTarget = target;
    ampmModal.style.display = 'flex';
  }
  function closeAmPmModal() {
    ampmModal.style.display = 'none';
    ampmTarget = null;
  }
  if (ampmFieldStart && ampmModal) {
    ampmFieldStart.addEventListener('click', function(e) {
      e.preventDefault();
      openAmPmModal('start');
    });
  }
  if (ampmFieldEnd && ampmModal) {
    ampmFieldEnd.addEventListener('click', function(e) {
      e.preventDefault();
      openAmPmModal('end');
    });
  }
  ampmCloseBtn.addEventListener('click', closeAmPmModal);
  ampmModal.addEventListener('click', function(e) {
    if (e.target === ampmModal) closeAmPmModal();
  });
  ampmButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      if (ampmTarget === 'start') {
        ampmLabelStart.textContent = this.textContent;
      } else if (ampmTarget === 'end') {
        ampmLabelEnd.textContent = this.textContent;
      }
      closeAmPmModal();
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  initializeHourAndAmPmPickerModals();
});