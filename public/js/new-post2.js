// ========================== NEW POST 2 - EXPERIMENTAL REDESIGN ==========================
// Modern, step-by-step job posting flow with admin dashboard-inspired UI

// ========================== MOBILE KEYBOARD HANDLING ==========================

function initializeMobileKeyboardHandling() {
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
  window.addEventListener('resize', function() {
    clearTimeout(window.resizeTimeout);
    window.resizeTimeout = setTimeout(detectKeyboardVisibility, 100);
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
        }, 50);
      }
    });
  }
  
  console.log('⌨️ Mobile keyboard handling initialized');
}

// ========================== STATE MANAGEMENT ==========================

const np2State = {
  currentStep: 1,
  selectedCategory: null,
  selectedRegion: 'CEBU',
  selectedCity: 'CEBU CITY',  // Default city for default region
  extras1Value: null,
  extras2Value: null,
  jobTitle: '',
  jobDate: '',
  startHour: null,
  startPeriod: 'AM',
  endHour: null,
  endPeriod: 'PM',
  photoFile: null,
  photoDataUrl: null,
  jobDescription: '',
  paymentType: 'Per Job',
  paymentAmount: '',
  // Edit/Relist mode tracking
  mode: 'new', // 'new', 'edit', or 'relist'
  editJobId: null,
  relistJobId: null,
  categoryLabel: '',
  categoryIcon: '',
  categoryColor: '',
  // Last posted job (for View Post button)
  lastPostedJobId: null,
  lastPostedJobNumber: null
};

// ========================== LOCATION DATA ==========================

const locationData = {
  "CEBU": [
    "Alcantara", "Alcoy", "Alegria", "Aloguinsan", "Argao", "Asturias", "Badian", "Balamban", "Bantayan", "Barili", "Bogo", "Boljoon", "Borbon", "Carcar", "Carmen", "Catmon", "CEBU CITY", "Compostela", "Consolacion", "Cordova", "Daanbantayan", "Dalaguete", "Danao", "Dumanjug", "Ginatilan", "Lapu-Lapu", "Liloan", "Madridejos", "Malabuyoc", "Mandaue", "Medellin", "Minglanilla", "Moalboal", "Naga City", "Oslob", "Pilar", "Pinamungajan", "Poro", "Ronda", "Samboan", "SanFernando", "San Francisco", "San Remigio", "Santa Fe", "Santander", "Sibonga", "Sogod", "Tabogon", "Tabuelan", "Talisay", "Toledo City", "Tuburan", "Tudela"
  ],
  "BOHOL": ["Tagbilaran City", "Alburquerque", "Alicia", "Anda", "Antequera", "Baclayon", "Balilihan", "Batuan", "Bien Unido", "Bilar", "Buenavista", "Calape", "Candijay", "Carmen", "Catigbian", "Clarin", "Corella", "Cortes", "Dagohoy", "Danao", "Dauis", "Dimiao", "Duero", "Garcia Hernandez", "Guindulman", "Inabanga", "Jagna", "Jetafe", "Lila", "Loay", "Loboc", "Loon", "Mabini", "Maribojoc", "Panglao", "Pilar", "Pres. Carlos P. Garcia", "Sagbayan", "San Isidro", "San Miguel", "Sevilla", "Sierra Bullones", "Sikatuna", "Talibon", "Trinidad", "Tubigon", "Ubay", "Valencia"],
  "LEYTE": [
    "Tacloban City", "Ormoc City", "Baybay City", "Abuyog", "Alangalang", "Albuera", "Babatngon", "Barugo", "Bato", "Burauen", "Calubian", "Capoocan", "Carigara", "Dagami", "Dulag", "Hilongos", "Hindang", "Inopacan", "Isabel", "Jaro", "Javier", "Julita", "Kananga", "La Paz", "Leyte", "MacArthur", "Mahaplag", "Matag-ob", "Matalom", "Mayorga", "Merida", "Palo", "Palompon", "Pastrana", "San Isidro", "San Miguel", "Santa Fe", "Tabango", "Tabontabon", "Tanauan", "Tolosa", "Tunga", "Villaba*", "Maasin City", "Anahawan", "Bontoc", "Hinunangan", "Hinundayan", "Libagon", "Liloan", "Limasawa", "Macrohon", "Malitbog", "Pintuyan", "Saint Bernard", "San Francisco", "San Juan Kabalian", "San Ricardo", "Silago", "Sogod", "Tomas Oppus"
  ],
  "MASBATE": ["Masbate City", "Aroroy", "Baleno", "Balud", "Batuan", "Cataingan", "Cawayan", "Claveria", "Dimasalang", "Esperanza", "Mandaon", "Milagros", "Mobo", "Monreal", "Palanas", "Pio V. Corpuz", "Placer", "San Fernando", "San Jacinto", "San Pascual", "Uson"],
  "NEGROS": ["Bacolod City", "Bago City", "Binalbagan", "Cadiz City", "Calatrava", "Cauayan", "Enrique B. Magalona", "Escalante City", "Himamaylan City", "Hinigaran", "Hinoba-an", "Ilog", "Isabela", "Kabankalan City", "La Carlota City", "La Castellana", "Manapla", "Moises Padilla", "Murcia", "Pontevedra", "Pulupandan", "Sagay City", "Salvador Benedicto", "San Carlos City", "San Enrique", "Silay City", "Sipalay City", "Talisay City", "Toboso", "Valladolid", "Victorias City"],
  "PANAY": [
    "Altavas", "Balete", "Banga", "Batan", "Buruanga", "Ibajay", "Kalibo", "Lezo", "Libacao", "Madalag", "Makato", "Malay", "Malinao", "Nabas", "New Washington", "Numancia", "Tangalan",
    "Anini-y", "Barbaza", "Belison", "Bugasong", "Caluya", "Culasi", "Hamtic", "Laua-an", "Libertad", "Pandan", "Patnongon", "San Jose de Buenavista", "San Remigio", "Sebaste", "Sibalom", "Tibiao", "Tobias Fornier", "Valderrama",
    "Cuartero", "Dao", "Dumalag", "Dumarao", "Ivisan", "Jamindan", "Maayon", "Mambusao", "Panay", "Panitan", "Pilar", "Pontevedra", "President Roxas", "Roxas City", "Sapian", "Sigma", "Tapaz",
    "Ajuy", "Alimodian", "Anilao", "Badiangan", "Balasan", "Banate", "Barotac Nuevo", "Barotac Viejo", "Batad", "Bingawan", "Cabatuan", "Calinog", "Carles", "Concepcion", "Dingle", "Dueñas", "Dumangas", "Estancia", "Guimbal", "Igbaras", "Iloilo City", "Janiuay", "Lambunao", "Leganes", "Lemery", "Leon", "Maasin", "Miagao", "Mina", "New Lucena", "Oton", "Passi City", "Pavia", "Pototan", "San Dionisio", "San Enrique", "San Joaquin", "San Miguel", "San Rafael", "Santa Barbara", "Sara", "Tigbauan", "Tubungan", "Zarraga",
    "Buenavista", "Jordan", "Nueva Valencia", "San Lorenzo", "Sibunag"
  ],
  "SAMAR": [
    "Catbalogan City", "Calbayog City", "Almagro", "Basey", "Calbiga", "Daram", "Gandara", "Hinabangan", "Jiabong", "Marabut", "Matuguinao", "Motiong", "Pagsanghan", "Paranas", "Pinabacdao", "San Jorge", "San Jose de Buan", "San Sebastian", "Santa Margarita", "Santa Rita", "Santo Niño", "Tagapul-an", "Talalora", "Tarangnan", "Villareal", "Zumarraga"
  ],
  "DAVAO": [
    "Davao City", "Digos City", "Mati City", "Panabo City", "Samal City", "Tagum City",
    "Compostela", "Laak", "Mabini", "Maco", "Maragusan", "Mawab", "Monkayo", "Montevista", "Nabunturan", "New Bataan", "Pantukan",
    "Asuncion", "Braulio E. Dujali", "Carmen", "Kapalong", "New Corella", "San Isidro", "Santo Tomas", "Talaingod",
    "Bansalan", "Don Marcelino", "Hagonoy", "Jose Abad Santos", "Kiblawan", "Magsaysay", "Malalag", "Malita", "Matanao",
    "Don Marcelino", "Jose Abad Santos", "Malita", "Santa Maria", "Sulop",
    "Baganga", "Banaybanay", "Boston", "Caraga", "Cateel", "Governor Generoso", "Lupon", "Manay", "San Isidro", "Tarragona"
  ],
  "MANILA": ["Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig", "Pateros", "San Juan", "Taguig", "Valenzuela"]
};

// Barangay data for major cities (simplified - can be expanded)
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
  "Consolation": [
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

// ========================== EXTRAS CONFIGURATION ==========================

const menuTypes = {
  location: {
    getOptions: function() {
      return getBarangaysForCurrentCity();
    }
  },
  supplies: {
    options: ["PROVIDED", "REQUIRED"]
  },
  subject: {
    getOptions: function() {
      if (np2State.selectedCategory === 'trainer') {
        return ["Strength", "Cardio", "Sports", "Therapy", "Dancing", "Martial Arts", "Yoga", "Other"];
      }
      return ["Math", "Science", "Computer", "Language", "Other"];
    }
  },
  position: {
    options: ["In-Person", "Virtual"]
  },
  budget: {
    options: ["Cash-Advance", "Paid-After"]
  }
};

const extrasConfig = {
  hatod: { field1: { label: "Pickup at:", menuType: "location" }, field2: { label: "Deliver to:", menuType: "location" } },
  hakot: { field1: { label: "Load at:", menuType: "location" }, field2: { label: "Unload at:", menuType: "location" } },
  kompra: { field1: { label: "Shop at:", menuType: "location" }, field2: { label: "Deliver to:", menuType: "location" } },
  luto: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  hugas: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  laba: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  limpyo: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  tindera: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  bantay: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  painter: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  carpenter: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  plumber: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  security: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  driver: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Location:", menuType: "location" } },
  tutor: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Subject:", menuType: "subject" } },
  clerical: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  builder: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  reception: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  nurse: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  doctor: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  lawyer: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  mechanic: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  electrician: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  tailor: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  trainer: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Subject:", menuType: "subject" } },
  staff: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  petcare: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  photographer: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  videographer: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  musician: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  creative: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  editor: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  artist: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  researcher: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  social: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  secretary: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  consultant: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  engineer: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  programmer: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  therapist: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  marketer: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  gardner: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  performer: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  massage: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  handyman: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  barber: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  waiter: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  chef: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Supplies:", menuType: "supplies" } },
  ittech: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } },
  realtor: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } }
};

// ========================== HELPER FUNCTIONS ==========================

function getBarangaysForCurrentCity() {
  if (!np2State.selectedCity) return null;
  const barangays = barangaysByCity[np2State.selectedCity];
  return (barangays && barangays.length > 0) ? barangays : null;
}

function convertTo24Hour(hour, period) {
  // Convert 12-hour format to 24-hour format
  let hour24 = parseInt(hour);
  if (period === 'PM' && hour24 !== 12) {
    hour24 += 12;
  } else if (period === 'AM' && hour24 === 12) {
    hour24 = 0;
  }
  return hour24;
}

// ========================== IMAGE PROCESSING ==========================

// Global variable to store processed image data
let processedJobPhoto = null;

function processImageWithSmartStorage(file, callback) {
  const img = new Image();
  const reader = new FileReader();
  
  img.onload = function() {
    // Calculate aspect ratios
    const originalRatio = img.width / img.height;
    const targetRatio = 16/9;
    const aspectDifference = Math.abs(originalRatio - targetRatio);
    const needsOriginal = aspectDifference > 0.3;
    
    console.log(`📐 Photo analysis:`, {
      dimensions: `${img.width}×${img.height}`,
      aspectRatio: originalRatio.toFixed(2),
      difference: aspectDifference.toFixed(2),
      needsOriginal: needsOriginal
    });
    
    // Always create cropped version (500×281 for page display)
    createCroppedVersion(img, function(croppedDataURL) {
      if (needsOriginal) {
        // Create compressed original (720px max width, maintain aspect ratio)
        createCompressedOriginal(img, function(originalDataURL) {
          // Store both versions
          processedJobPhoto = {
            cropped: croppedDataURL,
            original: originalDataURL,
            hasOriginal: true,
            originalFile: file,
            aspectRatio: originalRatio,
            dimensions: `${img.width}×${img.height}`
          };
          
          console.log('📸 Smart storage: DUAL versions created');
          callback(croppedDataURL);
          
          // ===== MEMORY CLEANUP =====
          cleanupImageProcessing(img, reader);
        });
      } else {
        // Store only cropped version
        processedJobPhoto = {
          cropped: croppedDataURL,
          hasOriginal: false,
          originalFile: file,
          aspectRatio: originalRatio,
          dimensions: `${img.width}×${img.height}`
        };
        
        console.log('📸 Smart storage: CROP only (close to 16:9)');
        callback(croppedDataURL);
        
        // ===== MEMORY CLEANUP =====
        cleanupImageProcessing(img, reader);
      }
    });
  };
  
  img.onerror = function() {
    console.error('Failed to load image for processing');
    callback(null);
    cleanupImageProcessing(img, reader);
  };
  
  // Load the image
  reader.onload = function(e) {
    img.src = e.target.result;
  };
  
  reader.onerror = function() {
    console.error('Failed to read image file');
    callback(null);
    cleanupImageProcessing(img, reader);
  };
  
  reader.readAsDataURL(file);
}

// Helper function to clean up memory after image processing
function cleanupImageProcessing(img, reader) {
  // Clear image source and handlers
  if (img) {
    img.src = '';
    img.onload = null;
    img.onerror = null;
  }
  
  // Clear FileReader
  if (reader) {
    try {
      reader.abort();
    } catch (e) {
      // Already completed, ignore
    }
    reader.onload = null;
    reader.onerror = null;
  }
  
  console.log('🧹 Memory cleaned up');
}

// Helper function to create cropped 16:9 version (500×281)
function createCroppedVersion(img, callback) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
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
  
  // Convert to data URL with 75% quality
  const croppedDataURL = canvas.toDataURL('image/jpeg', 0.75);
  
  // Clean up canvas
  canvas.width = 0;
  canvas.height = 0;
  
  callback(croppedDataURL);
}

// Helper function to create compressed original (max 720px width, maintain ratio)
function createCompressedOriginal(img, callback) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Calculate dimensions (max 720px width, maintain aspect ratio)
  const maxWidth = 720;
  let newWidth = img.width;
  let newHeight = img.height;
  
  if (img.width > maxWidth) {
    const scale = maxWidth / img.width;
    newWidth = maxWidth;
    newHeight = Math.round(img.height * scale);
  }
  
  // Set canvas dimensions
  canvas.width = newWidth;
  canvas.height = newHeight;
  
  // Draw the resized image (no cropping, maintain original aspect ratio)
  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  
  // Convert to data URL with 75% quality
  const originalDataURL = canvas.toDataURL('image/jpeg', 0.75);
  
  // Clean up canvas
  canvas.width = 0;
  canvas.height = 0;
  
  callback(originalDataURL);
}

function cityHasBarangayData(city) {
  return barangaysByCity[city] && barangaysByCity[city].length > 0;
}

function getCategoryDisplayName(category) {
  const categoryMap = {
    hatod: 'Hatod Jobs',
    hakot: 'Hakot Jobs',
    kompra: 'Kompra Jobs',
    luto: 'Luto Jobs',
    hugas: 'Hugas Jobs',
    laba: 'Laba Jobs',
    limpyo: 'Limpyo Jobs',
    tindera: 'Tindera Jobs',
    bantay: 'Bantay Jobs',
    trainer: 'Trainer Jobs',
    staff: 'Staff Jobs',
    reception: 'Reception Jobs',
    driver: 'Driver Jobs',
    security: 'Security Jobs',
    plumber: 'Plumber Jobs',
    builder: 'Builder Jobs',
    painter: 'Painter Jobs',
    carpenter: 'Carpenter Jobs',
    creative: 'Creative Jobs',
    editor: 'Editor Jobs',
    artist: 'Artist Jobs',
    petcare: 'Pet Care Jobs',
    researcher: 'Researcher Jobs',
    social: 'Social Jobs',
    photographer: 'Photographer Jobs',
    videographer: 'Videographer Jobs',
    musician: 'Musician Jobs',
    secretary: 'Secretary Jobs',
    tutor: 'Tutor Jobs',
    clerical: 'Clerical Jobs',
    nurse: 'Nurse Jobs',
    doctor: 'Doctor Jobs',
    lawyer: 'Lawyer Jobs',
    mechanic: 'Mechanic Jobs',
    electrician: 'Electrician Jobs',
    tailor: 'Tailor Jobs',
    consultant: 'Consultant Jobs',
    engineer: 'Engineer Jobs',
    programmer: 'Programmer Jobs',
    therapist: 'Therapist Jobs',
    marketer: 'Marketer Jobs'
  };
  return categoryMap[category] || category;
}

// ========================== UI HELPER FUNCTIONS ==========================

function showToast(message, type = 'info') {
  // Create toast element if it doesn't exist
  let toast = document.getElementById('np2-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'np2-toast';
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 16px 24px;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-size: 15px;
      font-weight: 500;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s ease;
      pointer-events: none;
    `;
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6';
  toast.style.pointerEvents = 'auto';
  
  // Show toast
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    toast.style.pointerEvents = 'none';
  }, 3000);
}

function updateProgressIndicator() {
  const steps = [1, 2, 3, 4];
  steps.forEach(step => {
    const circle = document.getElementById(`progressStep${step}`);
    const line = document.getElementById(`progressLine${step}`);
    
    if (step < np2State.currentStep) {
      circle.classList.add('completed');
      circle.classList.remove('active');
      if (line) line.classList.add('completed');
    } else if (step === np2State.currentStep) {
      circle.classList.add('active');
      circle.classList.remove('completed');
    } else {
      circle.classList.remove('active', 'completed');
      if (line) line.classList.remove('completed');
    }
  });
}

function showSection(step) {
  // Use requestAnimationFrame to batch DOM updates and prevent flickering
  requestAnimationFrame(() => {
    // Hide all sections
    const allSections = document.querySelectorAll('.np2-section');
    allSections.forEach(section => {
      section.style.display = 'none';
    });
    
    // Show current section
    const sections = {
      1: 'section-category',
      2: 'section-location',
      3: 'section-details',
      4: 'section-payment'
    };
    
    const sectionId = sections[step];
    const section = document.getElementById(sectionId);
    if (section) {
      section.style.display = 'block';
    }
    
    // Update buttons
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    const previewBtn = document.getElementById('previewBtn');
    
    if (step === 1) {
      backBtn.style.display = 'none';
      nextBtn.style.display = 'inline-flex';
      previewBtn.style.display = 'none';
    } else if (step === 4) {
      backBtn.style.display = 'inline-flex';
      nextBtn.style.display = 'none';
      previewBtn.style.display = 'inline-flex';
    } else {
      backBtn.style.display = 'inline-flex';
      nextBtn.style.display = 'inline-flex';
      previewBtn.style.display = 'none';
    }
    
    // Update progress indicators
    updateProgressIndicator();
    
    // Scroll to top of page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function validateCurrentStep() {
  switch (np2State.currentStep) {
    case 1:
      if (!np2State.selectedCategory) {
        showToast('Please select a job category', 'error');
        return false;
      }
      return true;
      
    case 2:
      if (!np2State.selectedRegion) {
        showToast('Please select a region', 'error');
        return false;
      }
      if (!np2State.selectedCity) {
        showToast('Please select a city', 'error');
        return false;
      }
      if (!np2State.extras1Value) {
        showToast('Please select the first option', 'error');
        return false;
      }
      if (!np2State.extras2Value) {
        showToast('Please select the second option', 'error');
        return false;
      }
      return true;
      
    case 3:
      if (!np2State.jobTitle.trim()) {
        showToast('Please enter a job title', 'error');
        return false;
      }
      // Validate title length (max 55 characters)
      if (np2State.jobTitle.length > 55) {
        showToast('Job title must be 55 characters or less', 'error');
        return false;
      }
      if (!np2State.jobDate) {
        showToast('Please select a job date', 'error');
        return false;
      }
      if (!np2State.startHour) {
        showToast('Please select start time', 'error');
        return false;
      }
      if (!np2State.endHour) {
        showToast('Please select end time', 'error');
        return false;
      }
      
      // Validate time range (end time must be after start time)
      const startHour24 = convertTo24Hour(parseInt(np2State.startHour), np2State.startPeriod);
      const endHour24 = convertTo24Hour(parseInt(np2State.endHour), np2State.endPeriod);
      if (endHour24 <= startHour24) {
        showToast('End time must be after start time', 'error');
        return false;
      }
      
      // Validate date+time is not in the past (using user's local timezone)
      const selectedDateParts = np2State.jobDate.split('-'); // "2025-11-21" -> ["2025", "11", "21"]
      const selectedDateTime = new Date(
        parseInt(selectedDateParts[0]), // year
        parseInt(selectedDateParts[1]) - 1, // month (0-indexed)
        parseInt(selectedDateParts[2]), // day
        startHour24, // hour
        0, // minutes
        0 // seconds
      );
      const now = new Date();
      if (selectedDateTime < now) {
        showToast('Job date and time cannot be in the past', 'error');
        return false;
      }
      if (!np2State.jobDescription.trim()) {
        showToast('Please enter a job description', 'error');
        return false;
      }
      // Validate description length
      if (np2State.jobDescription.length > 500) {
        showToast('Description must be 500 characters or less', 'error');
        return false;
      }
      return true;
      
    case 4:
      if (!np2State.paymentAmount || np2State.paymentAmount <= 0) {
        showToast('Please enter a payment amount', 'error');
        return false;
      }
      // Validate payment amount range
      const amount = parseFloat(np2State.paymentAmount);
      if (isNaN(amount)) {
        showToast('Please enter a valid payment amount', 'error');
        return false;
      }
      if (amount < 50) {
        showToast('Payment amount must be at least ₱50', 'error');
        return false;
      }
      if (amount > 100000) {
        showToast('Payment amount cannot exceed ₱100,000', 'error');
        return false;
      }
      return true;
      
    default:
      return true;
  }
}

// ========================== DROPDOWN SYSTEM ==========================

function initializeDropdowns() {
  // Map select elements to their overlay IDs
  const dropdownMappings = {
    'jobCategorySelect': 'jobCategoryOverlay',
    'regionSelect': 'regionOverlay',
    'citySelect': 'cityOverlay',
    'extrasField1Select': 'extrasField1Overlay',
    'extrasField2Select': 'extrasField2Overlay',
    'startHourSelect': 'startHourOverlay',
    'startPeriodSelect': 'startPeriodOverlay',
    'endHourSelect': 'endHourOverlay',
    'endPeriodSelect': 'endPeriodOverlay',
    'paymentTypeSelect': 'paymentTypeOverlay'
  };
  
  // Handle select clicks to open overlays
  document.querySelectorAll('.np2-select').forEach(select => {
    select.addEventListener('click', function(e) {
      e.stopPropagation();
      
      const overlayId = dropdownMappings[this.id];
      if (!overlayId) return;
      
      const overlay = document.getElementById(overlayId);
      if (overlay) {
        // Use requestAnimationFrame to prevent flickering
        requestAnimationFrame(() => {
          overlay.classList.add('show');
          this.classList.add('active');
        });
      }
    });
  });
  
  // Handle close button clicks
  document.querySelectorAll('.np2-dropdown-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
      const overlay = this.closest('.np2-dropdown-overlay');
      if (overlay) {
        overlay.classList.remove('show');
        // Remove active class from all selects
        document.querySelectorAll('.np2-select.active').forEach(s => s.classList.remove('active'));
      }
    });
  });
  
  // Handle clicking on overlay backdrop to close
  document.querySelectorAll('.np2-dropdown-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('show');
        document.querySelectorAll('.np2-select.active').forEach(s => s.classList.remove('active'));
      }
    });
  });
}

function populateDropdown(dropdownId, options, selectedValue = null) {
  const dropdown = document.getElementById(dropdownId);
  if (!dropdown) return;
  
  dropdown.innerHTML = '';
  
  if (Array.isArray(options)) {
    options.forEach(option => {
      const div = document.createElement('div');
      div.className = 'np2-dropdown-option';
      div.dataset.value = option;
      div.textContent = option;
      if (option === selectedValue) {
        div.classList.add('selected');
      }
      dropdown.appendChild(div);
    });
  }
}

// ========================== JOB CATEGORY ==========================

function initializeJobCategory() {
  const categorySelect = document.getElementById('jobCategorySelect');
  const categoryDropdown = document.getElementById('jobCategoryDropdown');
  const categoryValue = document.getElementById('jobCategoryValue');
  const searchInput = document.getElementById('categorySearchInput');
  
  // Handle category card clicks
  categoryDropdown.addEventListener('click', function(e) {
    const card = e.target.closest('.np2-category-card');
    if (card) {
      const value = card.dataset.value;
      const label = card.querySelector('.np2-category-label').textContent;
      const icon = card.dataset.icon;
      const color = card.dataset.color;
      
      console.log('📦 Category selected:', value, '(' + label + ')');
      
      np2State.selectedCategory = value;
      np2State.categoryLabel = label;
      np2State.categoryIcon = icon;
      np2State.categoryColor = color;
      
      categoryValue.textContent = label;
      categoryValue.classList.remove('placeholder');
      
      // Update headers for all steps
      updateCategoryHeaders(label);
      
      // Update icon display for step 2
      updateCategoryIconDisplay(icon, color);
      
      // Close overlay instead of dropdown
      const overlay = document.getElementById('jobCategoryOverlay');
      if (overlay) overlay.classList.remove('show');
      categorySelect.classList.remove('active');
      
      console.log('✅ State updated. Current category:', np2State.selectedCategory);
      
      // Update extras for this category
      updateExtrasForCategory(value);
    }
  });
  
  // Search functionality
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const cards = categoryDropdown.querySelectorAll('.np2-category-card');
      
      cards.forEach(card => {
        const label = card.querySelector('.np2-category-label').textContent.toLowerCase();
        const value = card.dataset.value.toLowerCase();
        if (label.includes(searchTerm) || value.includes(searchTerm)) {
          card.classList.remove('hidden');
        } else {
          card.classList.add('hidden');
        }
      });
    });
  }
}

// Helper function to update category headers
function updateCategoryHeaders(label) {
  const header2 = document.getElementById('headerCategory2');
  const header3 = document.getElementById('headerCategory3');
  const header4 = document.getElementById('headerCategory4');
  
  const displayText = `(${label})`;
  
  if (header2) header2.textContent = displayText;
  if (header3) header3.textContent = displayText;
  if (header4) header4.textContent = displayText;
  
  console.log('📋 Updated category headers:', displayText);
}

// Helper function to update category icon display
function updateCategoryIconDisplay(icon, color) {
  const iconDisplay = document.getElementById('categoryIconDisplay');
  const iconLarge = document.getElementById('categoryIconLarge');
  
  if (iconDisplay && iconLarge) {
    iconLarge.textContent = icon;
    iconLarge.style.filter = `drop-shadow(0 0 20px ${color})`;
    iconDisplay.style.display = 'flex';
    console.log('✨ Updated category icon:', icon);
  }
}

// ========================== LOCATION (REGION & CITY) ==========================

function initializeRegion() {
  const regionSelect = document.getElementById('regionSelect');
  const regionDropdown = document.getElementById('regionDropdown');
  const regionValue = document.getElementById('regionValue');
  
  // Populate regions
  const regions = Object.keys(locationData);
  populateDropdown('regionDropdown', regions, np2State.selectedRegion);
  
  // Handle region selection
  regionDropdown.addEventListener('click', function(e) {
    const option = e.target.closest('.np2-dropdown-option');
    if (option) {
      const value = option.dataset.value;
      np2State.selectedRegion = value;
      regionValue.textContent = value;
      regionValue.classList.remove('placeholder');
      
      // Close overlay
      const overlay = document.getElementById('regionOverlay');
      if (overlay) overlay.classList.remove('show');
      regionSelect.classList.remove('active');
      
      // Update cities
      updateCityOptions();
      
      // Set default city based on region
      const defaultCities = {
        'CEBU': 'CEBU CITY',
        'BOHOL': 'Tagbilaran City',
        'LEYTE': 'Tacloban City',
        'MASBATE': 'Masbate City',
        'NEGROS': 'Bacolod City',
        'PANAY': 'Iloilo City',
        'SAMAR': 'Catbalogan City',
        'SIQUIJOR': 'Siquijor',
        'BILIRAN': 'Naval',
        'CAMIGUIN': 'Mambajao',
        'DINAGAT': 'San Jose',
        'SOUTHERN LEYTE': 'Maasin City',
        'DAVAO': 'Davao City',
        'MANILA': 'Manila'
      };
      
      const defaultCity = defaultCities[value];
      
      if (defaultCity) {
        // Use generic handler to update city AND extras/barangays
        handleCityChange(defaultCity);
      } else {
        // No default city - reset
        np2State.selectedCity = null;
        np2State.extras1Value = null;
        np2State.extras2Value = null;
        const cityValueElement = document.getElementById('cityValue');
        if (cityValueElement) {
          cityValueElement.textContent = 'Select city...';
          cityValueElement.classList.add('placeholder');
        }
      }
    }
  });
}

function initializeCity() {
  const citySelect = document.getElementById('citySelect');
  const cityDropdown = document.getElementById('cityDropdown');
  const cityValue = document.getElementById('cityValue');
  
  // Handle city selection
  cityDropdown.addEventListener('click', function(e) {
    const option = e.target.closest('.np2-dropdown-option');
    if (option) {
      const value = option.dataset.value;
      
      // Close overlay
      const overlay = document.getElementById('cityOverlay');
      if (overlay) overlay.classList.remove('show');
      citySelect.classList.remove('active');
      
      // Use generic handler to update city AND extras/barangays
      handleCityChange(value);
    }
  });
}

function updateCityOptions() {
  const cities = locationData[np2State.selectedRegion] || [];
  populateDropdown('cityDropdown', cities);
}

// Generic function to handle city changes (manual or automatic)
function handleCityChange(city) {
  if (!city) return;
  
  console.log('🏙️ City changed to:', city);
  
  // Update state
  np2State.selectedCity = city;
  
  // Update UI
  const cityValueElement = document.getElementById('cityValue');
  if (cityValueElement) {
    cityValueElement.textContent = city;
    cityValueElement.classList.remove('placeholder');
  }
  
  // Clear extras state
  np2State.extras1Value = null;
  np2State.extras2Value = null;
  
  // Update extras for current category (this will refresh barangays if applicable)
  if (np2State.selectedCategory) {
    updateExtrasForCategory(np2State.selectedCategory);
    console.log('✅ Updated extras/barangays for city:', city);
  }
}

// ========================== EXTRAS SYSTEM ==========================

function updateExtrasForCategory(category) {
  const config = extrasConfig[category];
  if (!config) {
    document.getElementById('extrasContainer').style.display = 'none';
    return;
  }
  
  document.getElementById('extrasContainer').style.display = 'block';
  
  // Update Field 1
  updateExtrasField(1, config.field1);
  
  // Update Field 2
  updateExtrasField(2, config.field2);
}

function updateExtrasField(fieldNumber, fieldConfig) {
  const container = document.getElementById(`extrasField${fieldNumber}Container`);
  const label = document.getElementById(`extrasField${fieldNumber}Label`);
  const select = document.getElementById(`extrasField${fieldNumber}Select`);
  const value = document.getElementById(`extrasField${fieldNumber}Value`);
  const dropdown = document.getElementById(`extrasField${fieldNumber}Dropdown`);
  const input = document.getElementById(`extrasField${fieldNumber}Input`);
  
  if (!container || !label || !select || !value || !dropdown) return;
  
  // Update label
  label.innerHTML = fieldConfig.label + '<span class="np2-required">*</span>';
  
  // Get menu type config
  const menuTypeConfig = menuTypes[fieldConfig.menuType];
  if (!menuTypeConfig) return;
  
  // Get options
  let options = null;
  if (menuTypeConfig.getOptions) {
    options = menuTypeConfig.getOptions();
  } else if (menuTypeConfig.options) {
    options = menuTypeConfig.options;
  }
  
  // Check if this is a location field and city doesn't have barangay data
  if (fieldConfig.menuType === 'location' && !options && np2State.selectedCity) {
    // Show input field instead of dropdown
    select.style.display = 'none';
    if (input) {
      input.style.display = 'block';
      input.placeholder = 'Enter barangay/area...';
    }
    return;
  }
  
  // Show dropdown, hide input
  select.style.display = 'flex';
  if (input) {
    input.style.display = 'none';
  }
  
  // Populate dropdown
  if (options) {
    dropdown.innerHTML = '';
    options.forEach(option => {
      const div = document.createElement('div');
      div.className = 'np2-dropdown-option';
      div.dataset.value = option;
      div.textContent = option;
      dropdown.appendChild(div);
    });
    
    // Reset value
    value.textContent = 'Select option...';
    value.classList.add('placeholder');
    
    // Clear state
    if (fieldNumber === 1) np2State.extras1Value = null;
    if (fieldNumber === 2) np2State.extras2Value = null;
  }
}

function initializeExtras() {
  // Handle extras dropdown clicks
  [1, 2].forEach(fieldNumber => {
    const dropdown = document.getElementById(`extrasField${fieldNumber}Dropdown`);
    const value = document.getElementById(`extrasField${fieldNumber}Value`);
    const select = document.getElementById(`extrasField${fieldNumber}Select`);
    const input = document.getElementById(`extrasField${fieldNumber}Input`);
    
    if (dropdown) {
      dropdown.addEventListener('click', function(e) {
        const option = e.target.closest('.np2-dropdown-option');
        if (option) {
          const optionValue = option.dataset.value;
          value.textContent = optionValue;
          value.classList.remove('placeholder');
          
          // Close overlay
          const overlayId = `extrasField${fieldNumber}Overlay`;
          const overlay = document.getElementById(overlayId);
          if (overlay) overlay.classList.remove('show');
          select.classList.remove('active');
          
          // Update state
          if (fieldNumber === 1) np2State.extras1Value = optionValue;
          if (fieldNumber === 2) np2State.extras2Value = optionValue;
        }
      });
    }
    
    // Handle input field changes
    if (input) {
      input.addEventListener('input', function() {
        if (fieldNumber === 1) np2State.extras1Value = this.value;
        if (fieldNumber === 2) np2State.extras2Value = this.value;
      });
    }
  });
}

// ========================== JOB DETAILS ==========================

function initializeJobDetails() {
  const titleInput = document.getElementById('jobTitleInput');
  const titleCharCount = document.getElementById('titleCharCount');
  const dateInput = document.getElementById('jobDateInput');
  const descriptionTextarea = document.getElementById('jobDescriptionTextarea');
  
  // Title input with character counter
  if (titleInput && titleCharCount) {
    titleInput.addEventListener('input', function() {
      np2State.jobTitle = this.value;
      titleCharCount.textContent = this.value.length;
    });
  }
  
  // Date input
  if (dateInput) {
    dateInput.addEventListener('change', function() {
      np2State.jobDate = this.value;
    });
  }
  
  // Description textarea
  if (descriptionTextarea) {
    descriptionTextarea.addEventListener('input', function() {
      np2State.jobDescription = this.value;
    });
  }
  
  // Initialize time selectors
  initializeTimeSelectors();
  
  // Initialize photo upload
  initializePhotoUpload();
  
  // Initialize textarea auto-scroll for mobile
  initializeTextareaAutoScroll();
}

function initializeTimeSelectors() {
  // Start Hour
  const startHourDropdown = document.getElementById('startHourDropdown');
  const startHourValue = document.getElementById('startHourValue');
  const startHourSelect = document.getElementById('startHourSelect');
  
  if (startHourDropdown) {
    startHourDropdown.addEventListener('click', function(e) {
      const option = e.target.closest('.np2-dropdown-option');
      if (option) {
        const value = option.dataset.value;
        np2State.startHour = value;
        startHourValue.textContent = value;
        startHourValue.classList.remove('placeholder');
        
        // Close overlay
        const overlay = document.getElementById('startHourOverlay');
        if (overlay) overlay.classList.remove('show');
        startHourSelect.classList.remove('active');
      }
    });
  }
  
  // Start Period
  const startPeriodDropdown = document.getElementById('startPeriodDropdown');
  const startPeriodValue = document.getElementById('startPeriodValue');
  const startPeriodSelect = document.getElementById('startPeriodSelect');
  
  if (startPeriodDropdown) {
    startPeriodDropdown.addEventListener('click', function(e) {
      const option = e.target.closest('.np2-dropdown-option');
      if (option) {
        const value = option.dataset.value;
        np2State.startPeriod = value;
        startPeriodValue.textContent = value;
        
        // Close overlay
        const overlay = document.getElementById('startPeriodOverlay');
        if (overlay) overlay.classList.remove('show');
        startPeriodSelect.classList.remove('active');
      }
    });
  }
  
  // End Hour
  const endHourDropdown = document.getElementById('endHourDropdown');
  const endHourValue = document.getElementById('endHourValue');
  const endHourSelect = document.getElementById('endHourSelect');
  
  if (endHourDropdown) {
    endHourDropdown.addEventListener('click', function(e) {
      const option = e.target.closest('.np2-dropdown-option');
      if (option) {
        const value = option.dataset.value;
        np2State.endHour = value;
        endHourValue.textContent = value;
        endHourValue.classList.remove('placeholder');
        
        // Close overlay
        const overlay = document.getElementById('endHourOverlay');
        if (overlay) overlay.classList.remove('show');
        endHourSelect.classList.remove('active');
      }
    });
  }
  
  // End Period
  const endPeriodDropdown = document.getElementById('endPeriodDropdown');
  const endPeriodValue = document.getElementById('endPeriodValue');
  const endPeriodSelect = document.getElementById('endPeriodSelect');
  
  if (endPeriodDropdown) {
    endPeriodDropdown.addEventListener('click', function(e) {
      const option = e.target.closest('.np2-dropdown-option');
      if (option) {
        const value = option.dataset.value;
        np2State.endPeriod = value;
        endPeriodValue.textContent = value;
        
        // Close overlay
        const overlay = document.getElementById('endPeriodOverlay');
        if (overlay) overlay.classList.remove('show');
        endPeriodSelect.classList.remove('active');
      }
    });
  }
}

function initializePhotoUpload() {
  const photoInput = document.getElementById('jobPhotoInput');
  const uploadArea = document.getElementById('photoUploadArea');
  const preview = document.getElementById('photoPreview');
  const previewImage = document.getElementById('photoPreviewImage');
  const removeBtn = document.getElementById('photoRemoveBtn');
  
  if (uploadArea) {
    uploadArea.addEventListener('click', function() {
      photoInput.click();
    });
  }
  
  if (photoInput) {
    photoInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast('Image size must be less than 5MB', 'error');
          return;
        }
        
        // Process image with compression and 16:9 cropping
        processImageWithSmartStorage(file, function(processedDataURL) {
          np2State.photoFile = file;
          np2State.photoDataUrl = processedDataURL; // Store cropped version for preview
          
          // CSS-only flicker fix: prep image first, then swap display
          previewImage.onload = function() {
            uploadArea.style.display = 'none';
            preview.style.display = 'block';
          };
          previewImage.src = processedDataURL;
          
          console.log('📸 Photo uploaded and processed successfully');
        });
      }
    });
  }
  
  if (removeBtn) {
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      np2State.photoFile = null;
      np2State.photoDataUrl = null;
      processedJobPhoto = null; // Clear processed photo data
      previewImage.src = '';
      photoInput.value = '';
      preview.style.display = 'none';
      uploadArea.style.display = 'block';
    });
  }
}

// Initialize textarea auto-scroll on mobile
function initializeTextareaAutoScroll() {
  const textarea = document.getElementById('jobDescriptionTextarea');
  if (textarea) {
    textarea.addEventListener('focus', function() {
      // Only on mobile devices (viewport width <= 600px)
      if (window.innerWidth <= 600) {
        setTimeout(() => {
          this.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300); // Delay to allow keyboard to appear
      }
    });
  }
}

// ========================== PAYMENT ==========================

function initializePayment() {
  const perJobOption = document.getElementById('paymentPerJob');
  const perHourOption = document.getElementById('paymentPerHour');
  const amountInput = document.getElementById('paymentAmountInput');
  
  // Payment type graphic selector
  if (perJobOption) {
    perJobOption.addEventListener('click', function() {
      np2State.paymentType = 'Per Job';
      perJobOption.classList.add('active');
      if (perHourOption) perHourOption.classList.remove('active');
      console.log('💼 Payment type: Per Job');
    });
  }
  
  if (perHourOption) {
    perHourOption.addEventListener('click', function() {
      np2State.paymentType = 'Per Hour';
      perHourOption.classList.add('active');
      if (perJobOption) perJobOption.classList.remove('active');
      console.log('⏱️ Payment type: Per Hour');
    });
  }
  
  // Payment amount input
  if (amountInput) {
    amountInput.addEventListener('input', function() {
      np2State.paymentAmount = this.value;
    });
    
    // Close mobile keyboard on Enter key
    amountInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.keyCode === 13) {
        e.preventDefault();
        this.blur(); // Close mobile keyboard
      }
    });
  }
}

// ========================== NAVIGATION ==========================

function initializeNavigation() {
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const previewBtn = document.getElementById('previewBtn');
  
  console.log('🔧 Initializing navigation...');
  console.log('Back button:', backBtn);
  console.log('Next button:', nextBtn);
  console.log('Preview button:', previewBtn);
  
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      console.log('⬅️ Back button clicked');
      if (np2State.currentStep > 1) {
        np2State.currentStep--;
        showSection(np2State.currentStep);
        window.scrollTo(0, 0);
      }
    });
  } else {
    console.warn('⚠️ Back button not found!');
  }
  
  if (nextBtn) {
    console.log('✅ Continue button found, adding click listener...');
    nextBtn.addEventListener('click', function(e) {
      console.log('🔵 ========== CONTINUE BUTTON CLICKED ==========');
      console.log('Event:', e);
      console.log('Current step:', np2State.currentStep);
      console.log('Selected category:', np2State.selectedCategory);
      console.log('Full state:', JSON.stringify(np2State, null, 2));
      
      const validationResult = validateCurrentStep();
      console.log('Validation result:', validationResult);
      
      if (validationResult) {
        console.log('✅ Validation passed! Moving to next step...');
        if (np2State.currentStep < 4) {
          np2State.currentStep++;
          console.log('New step:', np2State.currentStep);
          showSection(np2State.currentStep);
          window.scrollTo(0, 0);
        }
      } else {
        console.log('❌ Validation failed');
      }
    });
    console.log('✅ Click listener attached to Continue button');
  } else {
    console.error('❌ Continue button NOT FOUND! ID: nextBtn');
  }
  
  if (previewBtn) {
    previewBtn.addEventListener('click', function() {
      if (validateCurrentStep()) {
        showPreview();
      }
    });
  }
}

// ========================== PREVIEW OVERLAY ==========================

function showPreview() {
  const overlay = document.getElementById('previewOverlay');
  
  // Update preview content
  document.getElementById('previewCategory').textContent = getCategoryDisplayName(np2State.selectedCategory);
  document.getElementById('previewLocation').textContent = `${np2State.selectedCity}, ${np2State.selectedRegion}`;
  document.getElementById('previewTitle').textContent = np2State.jobTitle;
  
  // Photo
  const photoContainer = document.getElementById('previewPhotoContainer');
  const photo = document.getElementById('previewPhoto');
  if (np2State.photoDataUrl) {
    photo.src = np2State.photoDataUrl;
    photoContainer.style.display = 'block';
  } else {
    photoContainer.style.display = 'none';
  }
  
  // Date
  // Parse date in local timezone (avoid UTC conversion)
  const [year, month, day] = np2State.jobDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  document.getElementById('previewDate').textContent = dateStr;
  
  // Time
  document.getElementById('previewTime').textContent = `${np2State.startHour}${np2State.startPeriod} - ${np2State.endHour}${np2State.endPeriod}`;
  
  // Extras
  const config = extrasConfig[np2State.selectedCategory];
  if (config) {
    const extras1Container = document.getElementById('previewExtras1Container');
    const extras2Container = document.getElementById('previewExtras2Container');
    
    if (np2State.extras1Value) {
      document.getElementById('previewExtras1Label').textContent = config.field1.label.toUpperCase();
      document.getElementById('previewExtras1Value').textContent = np2State.extras1Value;
      extras1Container.style.display = 'block';
    }
    
    if (np2State.extras2Value) {
      document.getElementById('previewExtras2Label').textContent = config.field2.label.toUpperCase();
      document.getElementById('previewExtras2Value').textContent = np2State.extras2Value;
      extras2Container.style.display = 'block';
    }
  }
  
  // Description
  document.getElementById('previewDescription').textContent = np2State.jobDescription;
  
  // Payment
  document.getElementById('previewPaymentAmount').textContent = `₱${np2State.paymentAmount}`;
  document.getElementById('previewPaymentType').textContent = np2State.paymentType;
  
  // Show overlay
  overlay.classList.add('show');
}

function initializePreviewOverlay() {
  const overlay = document.getElementById('previewOverlay');
  const closeBtn = document.getElementById('previewCloseBtn');
  const editBtn = document.getElementById('previewEditBtn');
  const postBtn = document.getElementById('previewPostBtn');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      overlay.classList.remove('show');
      overlay.classList.remove('active'); // Support both classes
    });
  }
  
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      overlay.classList.remove('show');
      overlay.classList.remove('active'); // Support both classes
    });
  }
  
  if (postBtn) {
    postBtn.addEventListener('click', function() {
      postJob();
    });
  }
  
  // Close on overlay click
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) {
      overlay.classList.remove('show');
      overlay.classList.remove('active'); // Support both classes
    }
  });
}

// ========================== POST JOB ==========================

async function postJob() {
  // Show loading modal
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (loadingText) loadingText.textContent = 'POSTING GIG...';
  if (loadingOverlay) {
    loadingOverlay.classList.add('show');
  }
  
  // Generate job number from timestamp
  const jobNumber = Date.now();
  
  // Create job object matching new-post.js format EXACTLY
  // Get extras config to build "Label: Value" format
  const config = extrasConfig[np2State.selectedCategory];
  const extras = [];
  if (config && np2State.extras1Value) {
    extras.push(`${config.field1.label} ${np2State.extras1Value}`);
  }
  if (config && np2State.extras2Value) {
    extras.push(`${config.field2.label} ${np2State.extras2Value}`);
  }
  
  // Get current user
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  if (!currentUser) {
    alert('Please log in to post a gig.');
    return;
  }
  
  // Prepare poster info
  const posterName = currentUser.displayName || 'Anonymous';
  const posterThumbnail = currentUser.photoURL || null;
  
  // Create initial job object WITHOUT photo (to get Firestore jobId first)
  const jobData = {
    posterId: currentUser.uid,
    posterName: posterName,
    posterThumbnail: posterThumbnail,
    title: np2State.jobTitle,
    description: np2State.jobDescription,
    category: np2State.selectedCategory,
    thumbnail: null, // Will be updated after photo upload
    jobDate: np2State.jobDate,
    dateNeeded: np2State.jobDate,
    startTime: `${np2State.startHour} ${np2State.startPeriod}`,
    endTime: `${np2State.endHour} ${np2State.endPeriod}`,
    priceOffer: np2State.paymentAmount,
    paymentAmount: np2State.paymentAmount,
    paymentType: np2State.paymentType, // Keep "Per Job" or "Per Hour" format
    region: np2State.selectedRegion,
    city: np2State.selectedCity,
    extras: extras, // Now with labels: "Location: Marigondon"
    status: 'active',
    applicationCount: 0,
    applicationIds: [],
    datePosted: new Date().toISOString(),
    jobPageUrl: `${np2State.selectedCategory}.html`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Add relist metadata if in relist mode
  if (np2State.mode === 'relist' && np2State.relistJobId) {
    jobData.originalJobId = np2State.relistJobId;
    jobData.relistedFrom = np2State.relistJobId;
    jobData.relistedAt = new Date().toISOString();
    console.log('📋 RELIST MODE: Adding metadata for original job:', np2State.relistJobId);
  }
  
  // Save job using DataService pattern - CLEAN SEPARATION
  const useFirebase = typeof DataService !== 'undefined' && DataService.useFirebase();
  console.log(`📊 Saving job in ${useFirebase ? 'FIREBASE' : 'MOCK'} mode`);
  console.log('📝 Job category:', np2State.selectedCategory);
  
  try {
    // ══════════════════════════════════════════════════════════════
    // FIREBASE MODE - Save ONLY to Firestore
    // ══════════════════════════════════════════════════════════════
    if (useFirebase) {
      console.log('🔥 FIREBASE MODE: Saving job to Firestore...');
      
      // Check if user is authenticated
      const user = await DataService.waitForAuth();
      if (!user) {
        alert('Please log in to post a job');
        window.location.href = 'login.html?redirect=new-post2.html';
        return;
      }
      
      let result;
      
      // EDIT MODE: Update existing job
      if (np2State.mode === 'edit' && np2State.editJobId) {
        if (typeof updateJob !== 'function') {
          throw new Error('updateJob function not available');
        }
        console.log('✏️ EDIT MODE: Updating existing job:', np2State.editJobId);
        result = await updateJob(np2State.editJobId, jobData);
      } 
      // NEW or RELIST MODE: Create new job
      else {
        if (typeof createJob !== 'function') {
          throw new Error('createJob function not available');
        }
        console.log('📝 NEW/RELIST MODE: Creating new job (without photo)');
        result = await createJob(jobData);
        
        // Now upload photo with the real jobId
        if (result.success && result.jobId) {
          const hasPhoto = processedJobPhoto || np2State.photoDataUrl;
          const useFirebaseStorage = typeof uploadJobPhoto === 'function' && typeof getFirebaseStorage === 'function' && getFirebaseStorage();
          
          if (hasPhoto && useFirebaseStorage) {
            console.log('📤 Uploading photo with jobId:', result.jobId);
            
            try {
              // Convert data URL to File object
              let photoFile = np2State.photoFile;
              
              if (!photoFile && np2State.photoDataUrl) {
                const response = await fetch(np2State.photoDataUrl);
                const blob = await response.blob();
                photoFile = new File([blob], `job_photo_${result.jobId}.jpg`, { type: 'image/jpeg' });
              }
              
              // Upload to Firebase Storage with REAL jobId
              const uploadResult = await uploadJobPhoto(result.jobId, photoFile, currentUser.uid);
              
              if (uploadResult.success) {
                console.log('✅ Photo uploaded:', uploadResult.url);
                
                // Update job with photo URL (direct Firestore update to avoid overwriting other fields)
                if (typeof getFirestore === 'function') {
                  const db = getFirestore();
                  await db.collection('jobs').doc(result.jobId).update({
                    thumbnail: uploadResult.url,
                    lastModified: firebase.firestore.FieldValue.serverTimestamp()
                  });
                  console.log('✅ Job updated with photo URL');
                }
              } else {
                console.error('❌ Photo upload failed:', uploadResult.errors);
                // Job was created but photo failed - user can edit later to add photo
                alert('Gig created, but photo upload failed. You can edit the gig to add a photo.');
              }
            } catch (photoError) {
              console.error('❌ Photo upload error:', photoError);
              alert('Gig created, but photo upload failed. You can edit the gig to add a photo.');
            }
          }
        }
      }
      
      if (result.success) {
        console.log('✅ Job saved to Firebase with ID:', result.jobId);
        
        // Store the posted job ID for View Post button
        np2State.lastPostedJobId = result.jobId;
        np2State.lastPostedJobNumber = jobNumber;
        
        // Hide loading modal
        if (loadingOverlay) {
          loadingOverlay.classList.remove('show');
        }
        
        // Close preview overlay and show success
        document.getElementById('previewOverlay').classList.remove('show');
        showSuccessOverlay();
        return;
      } else {
        throw new Error(result.message || 'Failed to save job to Firebase');
      }
    }
    
    // ══════════════════════════════════════════════════════════════
    // MOCK MODE - Save ONLY to localStorage
    // ══════════════════════════════════════════════════════════════
    console.log('🧪 MOCK MODE: Saving job to localStorage...');
    
    // Add mock photo data for offline mode
    if (processedJobPhoto) {
      jobData.thumbnail = processedJobPhoto.cropped;
      jobData.originalPhoto = processedJobPhoto.hasOriginal ? processedJobPhoto.original : processedJobPhoto.cropped;
    } else if (np2State.photoDataUrl) {
      jobData.thumbnail = np2State.photoDataUrl;
      jobData.originalPhoto = np2State.photoDataUrl;
    }
    
    // Add mock jobId for localStorage
    jobData.jobId = `${np2State.selectedCategory}_job_2025_${jobNumber}`;
    jobData.jobNumber = jobNumber;
    
    let allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
    console.log('📝 Existing jobs:', allJobs);
    
    if (!allJobs[np2State.selectedCategory]) {
      allJobs[np2State.selectedCategory] = [];
      console.log('📝 Created new category array');
    }
    
    if (np2State.mode === 'edit') {
      // EDIT MODE: Update existing job
      const jobIndex = allJobs[np2State.selectedCategory].findIndex(j => j.jobId === np2State.editJobId);
      if (jobIndex !== -1) {
        // Preserve original creation data
        jobData.datePosted = allJobs[np2State.selectedCategory][jobIndex].datePosted;
        jobData.createdAt = allJobs[np2State.selectedCategory][jobIndex].createdAt;
        jobData.applicationCount = allJobs[np2State.selectedCategory][jobIndex].applicationCount || 0;
        jobData.applicationIds = allJobs[np2State.selectedCategory][jobIndex].applicationIds || [];
        
        allJobs[np2State.selectedCategory][jobIndex] = jobData;
        console.log('✏️ Job updated at index:', jobIndex);
      } else {
        console.error('❌ Job not found for editing:', np2State.editJobId);
        throw new Error('Job not found for editing');
      }
    } else {
      // NEW or RELIST MODE: Add new job
      allJobs[np2State.selectedCategory].push(jobData);
      console.log('📝 Job added to array. Total jobs in category:', allJobs[np2State.selectedCategory].length);
    }
    
    // Try to save
    try {
      localStorage.setItem('gisugoJobs', JSON.stringify(allJobs));
      console.log('✅ Job saved to localStorage successfully!');
    } catch (quotaError) {
      // If quota exceeded, clean up old jobs and try again
      console.warn('⚠️ localStorage quota exceeded, cleaning up old jobs...');
      
      // Keep only the 10 most recent jobs per category
      Object.keys(allJobs).forEach(category => {
        if (allJobs[category].length > 10) {
          allJobs[category] = allJobs[category]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10);
        }
      });
      
      // Try saving again
      localStorage.setItem('gisugoJobs', JSON.stringify(allJobs));
      console.log('✅ Job saved after cleanup!');
    }
    
    // CRITICAL: Also save to jobPreviewCards for listing pages
    saveToJobPreviewCards(job);
    
    // Store the posted job info for View Post button
    np2State.lastPostedJobId = job.jobId;
    np2State.lastPostedJobNumber = jobNumber;
    
    // Hide loading modal
    if (loadingOverlay) {
      loadingOverlay.classList.remove('show');
    }
    
    // Close preview overlay
    document.getElementById('previewOverlay').classList.remove('show');
    
    // Show success overlay
    showSuccessOverlay();
  } catch (error) {
    console.error('❌ Error saving job:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
    
    // Hide loading modal on error
    if (loadingOverlay) {
      loadingOverlay.classList.remove('show');
    }
    
    alert(`Failed to post job: ${error.message}\n\nTry clearing old jobs from localStorage.`);
    showToast('Failed to post job. Please try again.', 'error');
  }
}

// Save job to jobPreviewCards format for listing pages
function saveToJobPreviewCards(job) {
  try {
    const previewCards = JSON.parse(localStorage.getItem('jobPreviewCards') || '{}');
    
    if (!previewCards[job.category]) {
      previewCards[job.category] = [];
    }
    
    // Format date to match new-post.js format (e.g., "Nov 21")
    const date = new Date(job.jobDate);
    const options = { month: 'short', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-US', options);
    
    // extras already in "Label: Value" format from postJob()
    const extra1 = job.extras && job.extras[0] ? job.extras[0] : '';
    const extra2 = job.extras && job.extras[1] ? job.extras[1] : '';
    
    // MATCH EXACT FORMAT FROM new-post.js line 2905-2919
    const previewCard = {
      jobNumber: job.jobNumber,
      title: job.title,
      extra1: extra1, // "Location: Marigondon"
      extra2: extra2, // "Subject: Korean"
      price: `₱${job.paymentAmount}`,
      rate: job.paymentType,
      date: formattedDate,
      time: `${job.startTime} - ${job.endTime}`,
      photo: job.thumbnail, // base64 or mock path
      templateUrl: `dynamic-job.html?category=${job.category}&jobNumber=${job.jobNumber}`,
      region: job.region,
      city: job.city,
      createdAt: new Date().toISOString()
    };
    
    // Add to beginning (newest first)
    previewCards[job.category].unshift(previewCard);
    localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
    console.log('✅ Job preview card saved for listing page:', previewCard);
  } catch (error) {
    console.error('❌ Error saving job preview card:', error);
  }
}

function showSuccessOverlay() {
  const overlay = document.getElementById('successOverlay');
  const locationText = document.getElementById('successLocation');
  
  locationText.textContent = `Your job is now live and visible to workers in ${np2State.selectedCity}, ${np2State.selectedRegion}.`;
  
  overlay.classList.add('show');
  
  // Trigger confetti animation
  triggerConfetti();
}

// Confetti Animation
function triggerConfetti() {
  const duration = 2000;
  const particleCount = 80;
  const colors = ['#10b981', '#4CAF50', '#2ecc71', '#27ae60', '#3d8b40', '#fbbf24', '#f59e0b'];
  
  // Center point (middle of screen)
  const originX = window.innerWidth / 2;
  const originY = window.innerHeight / 2;

  // Create burst of confetti from center point
  for (let i = 0; i < particleCount; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti-particle';
    
    // Random angle and velocity for explosion effect
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const velocity = Math.random() * 300 + 200;
    const size = Math.random() * 10 + 5;
    
    // Calculate final position
    const deltaX = Math.cos(angle) * velocity;
    const deltaY = Math.sin(angle) * velocity - 100; // Bias upward
    
    confetti.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      left: ${originX}px;
      top: ${originY}px;
      opacity: 1;
      border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
      transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg);
      z-index: 10001;
      pointer-events: none;
      transition: all ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
    `;
    
    document.body.appendChild(confetti);
    
    // Trigger explosion animation
    setTimeout(() => {
      confetti.style.transform = `
        translate(${deltaX}px, ${deltaY}px) 
        rotate(${Math.random() * 720}deg) 
        scale(0.5)
      `;
      confetti.style.opacity = '0';
    }, 50);
    
    // Remove after animation
    setTimeout(() => confetti.remove(), duration + 100);
  }
}

function initializeSuccessOverlay() {
  const overlay = document.getElementById('successOverlay');
  const gigsManagerBtn = document.getElementById('goToGigsManagerBtn');
  const viewJobBtn = document.getElementById('viewJobPostBtn');
  const gotItBtn = document.getElementById('gotItBtn');
  
  if (gigsManagerBtn) {
    gigsManagerBtn.addEventListener('click', function() {
      window.location.href = 'jobs.html';
    });
  }
  
  if (viewJobBtn) {
    viewJobBtn.addEventListener('click', function() {
      // Navigate to the specific job detail page
      try {
        // PRIORITY 1: Use lastPostedJobId if available (Firebase mode)
        if (np2State.lastPostedJobId && np2State.lastPostedJobNumber) {
          console.log('📍 Navigating to Firebase job:', np2State.lastPostedJobId);
          window.location.href = `dynamic-job.html?jobId=${np2State.lastPostedJobId}&category=${np2State.selectedCategory}`;
          return;
        }
        
        // PRIORITY 2: Fall back to localStorage (Mock mode)
        const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
        const categoryJobs = allJobs[np2State.selectedCategory] || [];
        
        // Get the most recently posted job
        let targetJob;
        if (np2State.mode === 'edit' && np2State.editJobId) {
          targetJob = categoryJobs.find(j => j.jobId === np2State.editJobId);
        } else {
          targetJob = categoryJobs[categoryJobs.length - 1];
        }
        
        if (targetJob && targetJob.jobNumber) {
          console.log('📍 Navigating to localStorage job:', targetJob.jobNumber);
          window.location.href = `dynamic-job.html?category=${np2State.selectedCategory}&jobNumber=${targetJob.jobNumber}`;
        } else {
          console.warn('Job not found, redirecting to category page');
          window.location.href = `${np2State.selectedCategory}.html`;
        }
      } catch (error) {
        console.error('Error navigating to job post:', error);
        window.location.href = np2State.selectedCategory ? `${np2State.selectedCategory}.html` : 'jobs.html';
      }
    });
  }
  
  if (gotItBtn) {
    gotItBtn.addEventListener('click', function() {
      overlay.classList.remove('show');
      // Navigate to the category page
      if (np2State.selectedCategory) {
        window.location.href = `${np2State.selectedCategory}.html`;
      } else {
        // Reset form and go back to step 1
        resetForm();
      }
    });
  }
}

function resetForm() {
  // Reset state
  np2State.currentStep = 1;
  np2State.selectedCategory = null;
  np2State.selectedRegion = 'CEBU';
  np2State.selectedCity = null;
  np2State.extras1Value = null;
  np2State.extras2Value = null;
  np2State.jobTitle = '';
  np2State.jobDate = '';
  np2State.startHour = null;
  np2State.startPeriod = 'AM';
  np2State.endHour = null;
  np2State.endPeriod = 'PM';
  np2State.photoFile = null;
  np2State.photoDataUrl = null;
  np2State.jobDescription = '';
  np2State.paymentType = 'Per Job';
  np2State.paymentAmount = '';
  
  // Reset UI
  document.getElementById('jobCategoryValue').textContent = 'Select job category...';
  document.getElementById('jobCategoryValue').classList.add('placeholder');
  document.getElementById('cityValue').textContent = 'Select city...';
  document.getElementById('cityValue').classList.add('placeholder');
  document.getElementById('jobTitleInput').value = '';
  document.getElementById('titleCharCount').textContent = '0';
  document.getElementById('jobDateInput').value = '';
  document.getElementById('jobDescriptionTextarea').value = '';
  document.getElementById('paymentAmountInput').value = '';
  
  // Reset photo
  document.getElementById('photoPreview').style.display = 'none';
  document.getElementById('photoUploadArea').style.display = 'block';
  
  // Show first section
  showSection(1);
  window.scrollTo(0, 0);
}

// ========================== EDIT/RELIST MODE HANDLING ==========================

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
    np2State.mode = 'edit';
    np2State.editJobId = editJobId;
    handleEditMode(editJobId, category);
  } else if (relistJobId && category) {
    console.log(`🔄 RELIST mode detected: jobId=${relistJobId}, category=${category}`);
    np2State.mode = 'relist';
    np2State.relistJobId = relistJobId;
    handleRelistMode(relistJobId, category);
  } else {
    console.log('ℹ️ No edit/relist parameters found - normal new post mode');
  }
}

async function handleEditMode(jobId, category) {
  try {
    console.log('🔍 EDIT MODE - Loading job:', { jobId, category });
    
    // Show loading overlay immediately with custom text
    const loadingOverlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    if (loadingText) loadingText.textContent = 'LOADING GIG...';
    if (loadingOverlay) loadingOverlay.classList.add('show');
    
    // Hide multi-step UI immediately to prevent flash
    const progressContainer = document.querySelector('.np2-progress-container');
    const sections = document.querySelectorAll('.np2-section');
    const navButtons = document.querySelector('.np2-nav-buttons');
    if (progressContainer) progressContainer.style.display = 'none';
    if (sections) sections.forEach(section => section.style.display = 'none');
    if (navButtons) navButtons.style.display = 'none';
    
    // Update page title
    const headerTitle = document.getElementById('newPostTitle') || document.querySelector('.np2-header-title');
    if (headerTitle) headerTitle.textContent = 'EDIT POST';
    
    // Try Firebase first (if in Firebase mode)
    if (typeof DataService !== 'undefined' && DataService.useFirebase() && typeof getJobById === 'function') {
      console.log('🔥 Loading job from Firebase for editing:', jobId);
      
      try {
        const firebaseJob = await getJobById(jobId);
        console.log('📋 Firebase getJobById result:', firebaseJob);
        
        if (firebaseJob) {
          console.log('✅ Firebase job loaded successfully');
          
          // Normalize Firebase data to match expected format
          // IMPORTANT: Use Firebase category, not URL parameter
          let actualCategory = firebaseJob.category || '';
          
          // If category is missing or invalid, try to infer from jobPageUrl
          if (!actualCategory || actualCategory === 'unknown') {
            if (firebaseJob.jobPageUrl) {
              const match = firebaseJob.jobPageUrl.match(/category=([^&]+)/);
              if (match && match[1] !== 'unknown') {
                actualCategory = match[1];
                console.log(`📍 Inferred category from jobPageUrl: ${actualCategory}`);
              }
            }
            // Fallback to URL parameter only if still empty
            if (!actualCategory || actualCategory === 'unknown') {
              actualCategory = category;
            }
          }
          const jobData = {
            jobId: firebaseJob.id || jobId,
            category: actualCategory,
            title: firebaseJob.title,
            region: firebaseJob.region,
            city: firebaseJob.city,
            jobDate: firebaseJob.scheduledDate ? 
              (firebaseJob.scheduledDate.toDate ? 
                (() => {
                  const d = firebaseJob.scheduledDate.toDate();
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`; // Local timezone YYYY-MM-DD
                })() : 
                firebaseJob.scheduledDate) 
              : null,
            startTime: firebaseJob.startTime,
            endTime: firebaseJob.endTime,
            priceOffer: firebaseJob.priceOffer,
            paymentAmount: firebaseJob.priceOffer,
            paymentType: firebaseJob.paymentType,
            extras: firebaseJob.extras || [],
            description: firebaseJob.description,
            thumbnail: firebaseJob.thumbnail
          };
          
          console.log('📝 Normalized job data (category from Firebase):', { category: actualCategory });
          
          console.log('📝 Normalized job data:', jobData);
          // Use category from Firebase data, not URL parameter
          populateFormWithJobData(jobData, actualCategory, 'edit');
          
          // Hide loading overlay after form is populated
          if (loadingOverlay) {
            setTimeout(() => loadingOverlay.classList.remove('show'), 300);
          }
          return;
        } else {
          console.warn('⚠️ Firebase returned null for jobId:', jobId);
        }
      } catch (fbError) {
        console.error('❌ Firebase load failed:', fbError);
      }
    } else {
      console.log('📦 Using localStorage mode (Firebase not available or dev mode ON)');
    }
    
    // Fallback: Load job data from localStorage
    console.log('📦 Trying localStorage fallback...');
    const jobData = getActiveJobData(jobId);
    console.log('📋 localStorage result:', jobData);
    
    if (!jobData || jobData === 'FIREBASE_PENDING') {
      console.error(`❌ Active job not found in any source: ${jobId}`);
      if (loadingOverlay) loadingOverlay.classList.remove('show');
      showToast('Job not found. Redirecting to new post...', 'error');
      return;
    }
    
    console.log(`✅ Loading job data for editing:`, jobData);
    // Use category from job data, not URL parameter
    populateFormWithJobData(jobData, jobData.category || category, 'edit');
    
    // Hide loading overlay
    if (loadingOverlay) {
      setTimeout(() => loadingOverlay.classList.remove('show'), 300);
    }
    
  } catch (error) {
    console.error(`❌ Error loading job for editing:`, error);
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) loadingOverlay.classList.remove('show');
    showToast('Error loading job data. Please try again.', 'error');
  }
}

async function handleRelistMode(jobId, category) {
  try {
    // Update page title
    const headerTitle = document.getElementById('newPostTitle') || document.querySelector('.np2-header-title');
    if (headerTitle) headerTitle.textContent = 'RELIST GIG';
    
    // Try Firebase first (if in Firebase mode)
    if (typeof DataService !== 'undefined' && DataService.useFirebase() && typeof getJobById === 'function') {
      console.log('🔥 Loading job from Firebase for relisting:', jobId);
      
      try {
        const firebaseJob = await getJobById(jobId);
        if (firebaseJob) {
          console.log('📋 Firebase job loaded:', firebaseJob);
          
          // Normalize Firebase data to match expected format
          const jobData = {
            jobId: firebaseJob.id || jobId,
            category: firebaseJob.category || category,
            title: firebaseJob.title,
            jobDate: firebaseJob.scheduledDate ? 
              (firebaseJob.scheduledDate.toDate ? 
                (() => {
                  const d = firebaseJob.scheduledDate.toDate();
                  const year = d.getFullYear();
                  const month = String(d.getMonth() + 1).padStart(2, '0');
                  const day = String(d.getDate()).padStart(2, '0');
                  return `${year}-${month}-${day}`; // Local timezone YYYY-MM-DD
                })() : 
                firebaseJob.scheduledDate) 
              : null,
            startTime: firebaseJob.startTime,
            endTime: firebaseJob.endTime,
            priceOffer: firebaseJob.priceOffer,
            paymentType: firebaseJob.paymentType,
            region: firebaseJob.region,
            city: firebaseJob.city,
            extras: firebaseJob.extras || [],
            description: firebaseJob.description,
            thumbnail: firebaseJob.thumbnail
          };
          
          populateFormWithJobData(jobData, category, 'relist');
          return;
        }
      } catch (fbError) {
        console.warn('⚠️ Firebase load failed, trying localStorage:', fbError);
      }
    }
    
    // Fallback: Load job data from completed jobs in localStorage
    const jobData = getCompletedJobData(jobId);
    if (!jobData || jobData === 'FIREBASE_PENDING') {
      console.error(`❌ Completed job not found: ${jobId}`);
      showToast('Job not found. Redirecting to new post...', 'error');
      return;
    }
    
    console.log(`📋 Loading completed job data for relisting:`, jobData);
    const actualCategory = jobData.category || category;
    console.log(`📂 Using category: ${actualCategory}`);
    
    populateFormWithJobData(jobData, actualCategory, 'relist');
    
  } catch (error) {
    console.error(`❌ Error loading job for relisting:`, error);
    showToast('Error loading job data. Please try again.', 'error');
  }
}

function getActiveJobData(jobId) {
  try {
    // PRIORITY 1: Try Firebase first (if in Firebase mode)
    if (typeof DataService !== 'undefined' && DataService.useFirebase() && typeof getJobById === 'function') {
      console.log('🔥 Fetching active job from Firebase:', jobId);
      // This will be handled async in handleEditMode
      return 'FIREBASE_PENDING';
    }
    
    // PRIORITY 2: Try localStorage (Mock mode)
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
    
    console.log('❌ Job not found in localStorage:', jobId);
    return null;
  } catch (error) {
    console.error('Error loading active job data:', error);
    return null;
  }
}

function getCompletedJobData(jobId) {
  try {
    // PRIORITY 1: Try Firebase first (if in Firebase mode)
    if (typeof DataService !== 'undefined' && DataService.useFirebase() && typeof getJobById === 'function') {
      console.log('🔥 Fetching completed job from Firebase:', jobId);
      // This will be handled async in handleRelistMode
      return 'FIREBASE_PENDING';
    }
    
    // PRIORITY 2: Try localStorage
    const allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
    
    // Search through all categories
    for (const category in allJobs) {
      const categoryJobs = allJobs[category] || [];
      const job = categoryJobs.find(j => j.jobId === jobId && j.status === 'completed');
      if (job) {
        console.log('📋 Found completed job in localStorage:', job);
        return {
          ...job,
          category: category
        };
      }
    }
    
    console.log('❌ Completed job not found:', jobId);
    return null;
  } catch (error) {
    console.error('Error loading completed job data:', error);
    return null;
  }
}

// ========== EDIT MODE: SINGLE PAGE FORM ==========
function showEditForm(jobData, category) {
  console.log('🎨 Showing edit form with data:', jobData);
  
  // Update page title
  const headerTitle = document.querySelector('.uniform-header-title');
  if (headerTitle) headerTitle.textContent = 'Edit Gig Post';
  
  // Hide multi-step UI
  document.querySelector('.np2-progress-container').style.display = 'none';
  document.querySelectorAll('.np2-section').forEach(section => section.style.display = 'none');
  document.querySelector('.np2-nav-buttons').style.display = 'none';
  
  // Show edit form
  const editContainer = document.getElementById('editModeContainer');
  if (!editContainer) {
    console.error('❌ Edit container not found');
    return;
  }
  editContainer.style.display = 'block';
  
  // Category mapping
  const categoryCards = {
    'hatod': { label: 'Hatod (Delivery/Transport)', icon: '🏍️' },
    'hakot': { label: 'Hakot (Moving/Hauling)', icon: '🚚' },
    'kompra': { label: 'Kompra (Shopping)', icon: '🛒' },
    'luto': { label: 'Luto (Cooking)', icon: '🍳' },
    'hugas': { label: 'Hugas (Dishwashing)', icon: '🍽️' },
    'laba': { label: 'Laba (Laundry)', icon: '👕' },
    'limpyo': { label: 'Limpyo (Cleaning)', icon: '🧹' },
    'tindera': { label: 'Tindera (Store Help)', icon: '🏪' },
    'bantay': { label: 'Bantay (Babysitting/Caregiving)', icon: '👶' },
    'painter': { label: 'Painter', icon: '🎨' },
    'carpenter': { label: 'Carpenter', icon: '🔨' },
    'plumber': { label: 'Plumber', icon: '🔧' },
    'security': { label: 'Security', icon: '🛡️' },
    'driver': { label: 'Driver', icon: '🚗' },
    'tutor': { label: 'Tutor', icon: '📚' },
    'nurse': { label: 'Nurse', icon: '💉' },
    'doctor': { label: 'Doctor', icon: '⚕️' },
    'lawyer': { label: 'Lawyer', icon: '⚖️' },
    'mechanic': { label: 'Mechanic', icon: '🔩' },
    'electrician': { label: 'Electrician', icon: '⚡' },
    'tailor': { label: 'Tailor', icon: '✂️' },
    'accountant': { label: 'Accountant', icon: '💼' }
  };
  
  // Populate category (read-only)
  const categoryInfo = categoryCards[category] || { label: category, icon: '' };
  document.getElementById('editCategoryDisplay').textContent = `${categoryInfo.icon} ${categoryInfo.label}`;
  
  // Save to state
  np2State.selectedCategory = category;
  np2State.selectedRegion = jobData.region || 'CEBU';
  np2State.selectedCity = jobData.city || 'CEBU CITY';
  
  console.log('💾 Saved to state:', { 
    category: np2State.selectedCategory, 
    region: np2State.selectedRegion, 
    city: np2State.selectedCity 
  });
  
  // Populate location (read-only)
  const locationText = `${jobData.region || 'Unknown Region'} - ${jobData.city || 'Unknown City'}`;
  document.getElementById('editLocationDisplay').textContent = locationText;
  
  // Populate title
  const editTitleInput = document.getElementById('editTitleInput');
  const editTitleCharCount = document.getElementById('editTitleCharCount');
  editTitleInput.value = jobData.title || '';
  
  // Initialize character counter
  if (editTitleCharCount) {
    editTitleCharCount.textContent = editTitleInput.value.length;
  }
  
  // Add input listener for character counter
  editTitleInput.addEventListener('input', function() {
    if (editTitleCharCount) {
      editTitleCharCount.textContent = this.value.length;
    }
  });
  
  // Populate date
  document.getElementById('editDateInput').value = jobData.jobDate || '';
  
  // Populate time (custom dropdowns)
  if (jobData.startTime) {
    const [startHour, startPeriod] = jobData.startTime.split(' ');
    const startHourDisplay = document.querySelector('#editStartHourDropdown .np2-edit-dropdown-display');
    const startPeriodDisplay = document.querySelector('#editStartPeriodDropdown .np2-edit-dropdown-display');
    if (startHourDisplay && startHour) {
      startHourDisplay.setAttribute('data-value', startHour);
      startHourDisplay.textContent = startHour;
    }
    if (startPeriodDisplay && startPeriod) {
      startPeriodDisplay.setAttribute('data-value', startPeriod);
      startPeriodDisplay.textContent = startPeriod;
    }
  }
  if (jobData.endTime) {
    const [endHour, endPeriod] = jobData.endTime.split(' ');
    const endHourDisplay = document.querySelector('#editEndHourDropdown .np2-edit-dropdown-display');
    const endPeriodDisplay = document.querySelector('#editEndPeriodDropdown .np2-edit-dropdown-display');
    if (endHourDisplay && endHour) {
      endHourDisplay.setAttribute('data-value', endHour);
      endHourDisplay.textContent = endHour;
    }
    if (endPeriodDisplay && endPeriod) {
      endPeriodDisplay.setAttribute('data-value', endPeriod);
      endPeriodDisplay.textContent = endPeriod;
    }
  }
  
  // Populate extras (if any)
  if (jobData.extras && Array.isArray(jobData.extras) && jobData.extras.length > 0) {
    if (jobData.extras[0]) {
      const extras1Group = document.getElementById('editExtras1Group');
      const extras1Input = document.getElementById('editExtras1Input');
      const extras1Label = document.getElementById('editExtras1Label');
      if (extras1Group && extras1Input) {
        extras1Group.style.display = 'flex';
        extras1Input.value = jobData.extras[0];
        if (extras1Label) extras1Label.textContent = 'Location Details';
      }
    }
    if (jobData.extras[1]) {
      const extras2Group = document.getElementById('editExtras2Group');
      const extras2Input = document.getElementById('editExtras2Input');
      const extras2Label = document.getElementById('editExtras2Label');
      if (extras2Group && extras2Input) {
        extras2Group.style.display = 'flex';
        extras2Input.value = jobData.extras[1];
        if (extras2Label) extras2Label.textContent = 'Additional Info';
      }
    }
  }
  
  // Populate description
  document.getElementById('editDescriptionInput').value = jobData.description || '';
  
  // Populate photo
  const photoImage = document.getElementById('editPhotoImage');
  if (jobData.thumbnail) {
    photoImage.src = jobData.thumbnail;
    photoImage.style.display = 'block';
    // Save original thumbnail to state
    np2State.photoDataUrl = jobData.thumbnail;
  } else {
    photoImage.style.display = 'none';
    np2State.photoDataUrl = null;
  }
  
  // Populate payment (custom dropdown)
  const paymentTypeDisplay = document.querySelector('#editPaymentTypeDropdown .np2-edit-dropdown-display');
  const paymentType = jobData.paymentType || 'Per Job';
  if (paymentTypeDisplay) {
    paymentTypeDisplay.setAttribute('data-value', paymentType);
    paymentTypeDisplay.textContent = paymentType;
  }
  document.getElementById('editPaymentAmountInput').value = jobData.paymentAmount || jobData.priceOffer || '';
  
  // Wire up buttons
  initializeEditFormButtons(jobData, category);
  
  // Initialize custom dropdowns
  initializeEditDropdowns();
}

// ========== EDIT MODE: MEMORY LEAK PREVENTION ==========
// Store cleanup functions
let editDropdownCleanup = null;
let editButtonCleanup = null;

// Master cleanup function for edit mode
function cleanupEditMode() {
  console.log('🧹 Cleaning up edit mode resources');
  if (editDropdownCleanup) {
    editDropdownCleanup();
    editDropdownCleanup = null;
  }
  if (editButtonCleanup) {
    editButtonCleanup();
    editButtonCleanup = null;
  }
}

function initializeEditDropdowns() {
  console.log('🎨 Initializing edit form custom dropdowns');
  
  // Clean up previous listeners if any
  if (editDropdownCleanup) {
    editDropdownCleanup();
  }
  
  const overlay = document.getElementById('editDropdownOverlay');
  const menu = document.getElementById('editDropdownMenu');
  let activeDropdown = null;
  
  // Array to store all event listeners for cleanup
  const listeners = [];
  
  // Dropdown configurations
  const dropdownConfigs = {
    editStartHourDropdown: {
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      placeholder: 'Start'
    },
    editStartPeriodDropdown: {
      options: ['AM', 'PM']
    },
    editEndHourDropdown: {
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
      placeholder: 'End'
    },
    editEndPeriodDropdown: {
      options: ['AM', 'PM']
    },
    editPaymentTypeDropdown: {
      options: ['Per Job', 'Per Hour']
    }
  };
  
  // Initialize each dropdown
  Object.keys(dropdownConfigs).forEach(dropdownId => {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    const display = dropdown.querySelector('.np2-edit-dropdown-display');
    const config = dropdownConfigs[dropdownId];
    
    const clickHandler = (e) => {
      e.stopPropagation();
      openDropdown(dropdown, config);
    };
    
    display.addEventListener('click', clickHandler);
    listeners.push({ element: display, event: 'click', handler: clickHandler });
  });
  
  function openDropdown(dropdown, config) {
    activeDropdown = dropdown;
    const display = dropdown.querySelector('.np2-edit-dropdown-display');
    const currentValue = display.getAttribute('data-value');
    
    // Clear menu
    menu.innerHTML = '';
    
    // Add options
    config.options.forEach(option => {
      const optionEl = document.createElement('div');
      optionEl.className = 'np2-edit-dropdown-option';
      if (option === currentValue) {
        optionEl.classList.add('selected');
      }
      optionEl.textContent = option;
      optionEl.addEventListener('click', () => {
        selectOption(dropdown, option, config);
      });
      menu.appendChild(optionEl);
    });
    
    // Show overlay
    dropdown.classList.add('active');
    overlay.classList.add('show');
  }
  
  function selectOption(dropdown, value, config) {
    const display = dropdown.querySelector('.np2-edit-dropdown-display');
    display.setAttribute('data-value', value);
    display.textContent = value;
    closeDropdown();
  }
  
  function closeDropdown() {
    if (activeDropdown) {
      activeDropdown.classList.remove('active');
      activeDropdown = null;
    }
    overlay.classList.remove('show');
  }
  
  // Close on overlay click
  const overlayClickHandler = (e) => {
    if (e.target === overlay) {
      closeDropdown();
    }
  };
  overlay.addEventListener('click', overlayClickHandler);
  listeners.push({ element: overlay, event: 'click', handler: overlayClickHandler });
  
  // Close on escape key
  const escapeHandler = (e) => {
    if (e.key === 'Escape' && activeDropdown) {
      closeDropdown();
    }
  };
  document.addEventListener('keydown', escapeHandler);
  listeners.push({ element: document, event: 'keydown', handler: escapeHandler });
  
  // Store cleanup function
  editDropdownCleanup = () => {
    console.log('🧹 Cleaning up edit dropdown listeners');
    listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    listeners.length = 0; // Clear array
  };
}

function initializeEditFormButtons(jobData, category) {
  console.log('🔘 Initializing edit form buttons for jobId:', jobData.jobId);
  
  // Clean up previous handlers
  if (editButtonCleanup) {
    editButtonCleanup();
  }
  
  // Cancel button
  const cancelBtn = document.getElementById('editCancelBtn');
  console.log('Cancel button found:', !!cancelBtn);
  const cancelHandler = () => {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      cleanupEditMode();
      window.location.href = 'jobs.html?tab=listings';
    }
  };
  if (cancelBtn) {
    // Remove old listener if exists (using onclick pattern is safe from duplicates)
    cancelBtn.onclick = cancelHandler;
  }
  
  // Update button
  const updateBtn = document.getElementById('editUpdateBtn');
  console.log('Update button found:', !!updateBtn);
  const updateHandler = () => {
    console.log('🔵 Update button clicked!');
    handleEditFormSubmit(jobData.jobId, category);
  };
  if (updateBtn) {
    updateBtn.onclick = updateHandler;
  } else {
    console.error('❌ Update button NOT found in DOM');
  }
  
  // Store cleanup (onclick doesn't need removal but tracking for consistency)
  editButtonCleanup = () => {
    console.log('🧹 Cleaning up edit button handlers');
    if (cancelBtn) cancelBtn.onclick = null;
    if (updateBtn) updateBtn.onclick = null;
  };
  
  // Change photo button
  const changePhotoBtn = document.getElementById('editChangePhotoBtn');
  const photoInput = document.getElementById('editPhotoInput');
  const photoChangeHandler = () => photoInput.click();
  const photoInputHandler = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('editPhotoImage').src = event.target.result;
        document.getElementById('editPhotoImage').style.display = 'block';
        np2State.photoFile = file;
        np2State.photoDataUrl = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };
  
  if (changePhotoBtn && photoInput) {
    changePhotoBtn.onclick = photoChangeHandler;
    photoInput.onchange = photoInputHandler;
    
    // Add to cleanup
    const oldCleanup = editButtonCleanup;
    editButtonCleanup = () => {
      console.log('🧹 Cleaning up edit button and photo handlers');
      if (cancelBtn) cancelBtn.onclick = null;
      if (updateBtn) updateBtn.onclick = null;
      if (changePhotoBtn) changePhotoBtn.onclick = null;
      if (photoInput) photoInput.onchange = null;
    };
  }
}

async function handleEditFormSubmit(jobId, category) {
  console.log('📤 handleEditFormSubmit called with:', { jobId, category });
  console.log('📤 Submitting edit form for job:', jobId);
  
  // Show loading IMMEDIATELY before any processing
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingText = document.getElementById('loadingText');
  if (loadingText) loadingText.textContent = 'PROCESSING...';
  if (loadingOverlay) loadingOverlay.classList.add('show');
  
  // Allow UI to update before heavy processing
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Collect form data (from custom dropdowns)
  const title = document.getElementById('editTitleInput').value.trim();
  const date = document.getElementById('editDateInput').value;
  const startHour = document.querySelector('#editStartHourDropdown .np2-edit-dropdown-display').getAttribute('data-value');
  const startPeriod = document.querySelector('#editStartPeriodDropdown .np2-edit-dropdown-display').getAttribute('data-value');
  const endHour = document.querySelector('#editEndHourDropdown .np2-edit-dropdown-display').getAttribute('data-value');
  const endPeriod = document.querySelector('#editEndPeriodDropdown .np2-edit-dropdown-display').getAttribute('data-value');
  const description = document.getElementById('editDescriptionInput').value.trim();
  const paymentType = document.querySelector('#editPaymentTypeDropdown .np2-edit-dropdown-display').getAttribute('data-value');
  const paymentAmount = document.getElementById('editPaymentAmountInput').value;
  
  console.log('📋 Form data collected:', {
    title, date, startHour, startPeriod, endHour, endPeriod,
    description: description.substring(0, 50) + '...',
    paymentType, paymentAmount
  });
  
  // Validate required fields
  if (!title || !date || !startHour || !endHour || !description || !paymentAmount) {
    console.warn('⚠️ Validation failed - missing required fields');
    if (loadingOverlay) loadingOverlay.classList.remove('show');
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  console.log('✅ Validation passed');
  
  // Get location from state (set during showEditForm)
  const region = np2State.selectedRegion || 'CEBU';
  const city = np2State.selectedCity || 'CEBU CITY';
  
  // Build updated job object
  const updatedJob = {
    title,
    region,
    city,
    category, // Include category
    jobDate: date,
    startTime: `${startHour} ${startPeriod}`,
    endTime: `${endHour} ${endPeriod}`,
    description,
    paymentType,
    paymentAmount: parseInt(paymentAmount),
    priceOffer: parseInt(paymentAmount),
    lastModified: new Date().toISOString()
  };
  
  // Include photo (original or new) - upload to Firebase Storage if available
  if (np2State.photoDataUrl) {
    const useFirebaseStorage = typeof uploadJobPhoto === 'function' && typeof getFirebaseStorage === 'function' && getFirebaseStorage();
    
    if (useFirebaseStorage && np2State.photoFile) {
      console.log('📤 Uploading updated photo to Firebase Storage...');
      
      try {
        // ═══════════════════════════════════════════════════════════════
        // GET OLD PHOTO URL (for deletion after update succeeds)
        // ═══════════════════════════════════════════════════════════════
        if (typeof getJobById === 'function') {
          const existingJob = await getJobById(jobId);
          if (existingJob && existingJob.thumbnail) {
            np2State.oldGigPhotoUrl = existingJob.thumbnail; // Store for later deletion
          }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // UPLOAD NEW PHOTO FIRST (don't delete old yet)
        // ═══════════════════════════════════════════════════════════════
        const uploadResult = await uploadJobPhoto(jobId, np2State.photoFile);
        
        if (!uploadResult.success) {
          console.error('❌ Storage upload failed:', uploadResult.errors);
          showToast('Failed to upload photo', 'error');
          return; // Abort - old photo still intact
        }
        
        updatedJob.thumbnail = uploadResult.url; // Firebase Storage URL
        console.log('✅ Updated photo uploaded to Storage:', uploadResult.url);
        
      } catch (error) {
        console.error('❌ Error uploading photo:', error);
        showToast('Failed to upload photo. Please try again.', 'error');
        return;
      }
    } else {
      // Use base64 if offline mode or photo wasn't changed
      updatedJob.thumbnail = np2State.photoDataUrl;
    }
  }
  
  // Include extras if they exist
  const extras = [];
  const extras1 = document.getElementById('editExtras1Input')?.value;
  const extras2 = document.getElementById('editExtras2Input')?.value;
  if (extras1) extras.push(extras1);
  if (extras2) extras.push(extras2);
  if (extras.length > 0) {
    updatedJob.extras = extras;
  }
  
  console.log('📦 Updated job data:', updatedJob);
  
  // Hide loading and show preview
  if (loadingOverlay) loadingOverlay.classList.remove('show');
  showEditPreview(updatedJob, category, jobId);
}

function showEditPreview(updatedJob, category, jobId) {
  console.log('🎬 showEditPreview called with:', { updatedJob, category, jobId });
  
  // Populate preview overlay with updated data
  const previewCategory = document.getElementById('previewCategory');
  const previewLocation = document.getElementById('previewLocation');
  const previewTitle = document.getElementById('previewTitle');
  
  console.log('Preview elements found:', {
    previewCategory: !!previewCategory,
    previewLocation: !!previewLocation,
    previewTitle: !!previewTitle
  });
  
  if (previewCategory) previewCategory.textContent = category.toUpperCase();
  if (previewLocation) previewLocation.textContent = `${updatedJob.region || 'CEBU'} - ${updatedJob.city || 'CEBU CITY'}`;
  if (previewTitle) previewTitle.textContent = updatedJob.title;
  
  // Format date for preview (parse in local timezone)
  if (updatedJob.jobDate) {
    let dateObj;
    if (updatedJob.jobDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Parse YYYY-MM-DD in local timezone
      const [year, month, day] = updatedJob.jobDate.split('-').map(Number);
      dateObj = new Date(year, month - 1, day);
    } else {
      dateObj = new Date(updatedJob.jobDate);
    }
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    document.getElementById('previewDate').textContent = dateObj.toLocaleDateString('en-US', options);
  }
  
  document.getElementById('previewTime').textContent = `${updatedJob.startTime} - ${updatedJob.endTime}`;
  document.getElementById('previewDescription').textContent = updatedJob.description;
  document.getElementById('previewPaymentAmount').textContent = `₱${updatedJob.paymentAmount}`;
  document.getElementById('previewPaymentType').textContent = updatedJob.paymentType;
  
  // Photo
  if (updatedJob.thumbnail) {
    const previewPhoto = document.getElementById('previewPhoto');
    const previewPhotoContainer = document.getElementById('previewPhotoContainer');
    if (previewPhoto) previewPhoto.src = updatedJob.thumbnail;
    if (previewPhotoContainer) previewPhotoContainer.style.display = 'block';
  }
  
  // Show preview overlay
  const previewOverlay = document.getElementById('previewOverlay');
  console.log('📺 Preview overlay element:', previewOverlay);
  console.log('📺 Attempting to show preview overlay...');
  
  if (previewOverlay) {
    previewOverlay.classList.add('active');
    console.log('✅ Preview overlay active class added');
    console.log('📺 Preview overlay classes:', previewOverlay.className);
  } else {
    console.error('❌ Preview overlay element NOT FOUND');
  }
  
  // Wire up post button to actually update
  const postJobBtn = document.getElementById('previewPostBtn'); // Correct ID
  console.log('🔘 Post Job button found:', !!postJobBtn);
  if (postJobBtn) {
    postJobBtn.onclick = async () => {
      console.log('🔵 Preview Post button clicked - updating job...');
      // Hide preview, show loading
      document.getElementById('previewOverlay').classList.remove('active');
      const loadingOverlay = document.getElementById('loadingOverlay');
      const loadingText = document.getElementById('loadingText');
      if (loadingText) loadingText.textContent = 'UPDATING GIG...';
      if (loadingOverlay) loadingOverlay.classList.add('show');
      
      // Update job
      const useFirebase = DataService.useFirebase();
      console.log('🔥 Using Firebase for update:', useFirebase);
      console.log('📦 Job data being sent to updateJob:', updatedJob);
      
      if (useFirebase && typeof updateJob === 'function') {
        const result = await updateJob(jobId, updatedJob);
        console.log('📥 Update result:', result);
        if (loadingOverlay) loadingOverlay.classList.remove('show');
        
        if (result.success) {
          console.log('✅ Job updated successfully in Firebase');
          
          // ═══════════════════════════════════════════════════════════════
          // DELETE OLD PHOTO (LAST - after Firestore update succeeds)
          // ═══════════════════════════════════════════════════════════════
          if (np2State.oldGigPhotoUrl && np2State.oldGigPhotoUrl.includes('firebasestorage')) {
            if (typeof deletePhotoFromStorageUrl === 'function') {
              console.log('🗑️ Deleting old gig photo...');
              const deleteResult = await deletePhotoFromStorageUrl(np2State.oldGigPhotoUrl);
              
              if (deleteResult.success) {
                console.log('✅ Old gig photo cleaned up');
              } else {
                console.error('⚠️ Old photo deletion failed (orphaned):', deleteResult.message);
                // TODO: Track orphan in Firestore
              }
            }
            // Clear the stored URL
            np2State.oldGigPhotoUrl = null;
          }
          
          showSuccessOverlay();
        } else {
          console.error('❌ Job update failed:', result.message);
          showToast('Failed to update job: ' + result.message, 'error');
          // TODO: If we uploaded new photo but Firestore failed, track as orphan
        }
      } else {
        // localStorage fallback
        const jobs = JSON.parse(localStorage.getItem('activeJobs') || '[]');
        const jobIndex = jobs.findIndex(j => j.jobId === jobId);
        if (jobIndex !== -1) {
          jobs[jobIndex] = { ...jobs[jobIndex], ...updatedJob };
          localStorage.setItem('activeJobs', JSON.stringify(jobs));
          if (loadingOverlay) loadingOverlay.classList.remove('show');
          showSuccessOverlay();
        } else {
          if (loadingOverlay) loadingOverlay.classList.remove('show');
          showToast('Job not found in localStorage', 'error');
        }
      }
    };
  }
}

function populateFormWithJobData(jobData, category, mode) {
  console.log(`📝 Populating form with job data (mode: ${mode}):`, jobData);
  
  // Set mode and IDs
  np2State.mode = mode;
  if (mode === 'edit') {
    np2State.editJobId = jobData.jobId;
    // Show edit form, hide multi-step
    showEditForm(jobData, category);
    return; // Exit early, edit form handles everything
  } else if (mode === 'relist') {
    np2State.relistJobId = jobData.jobId;
  }
  
  // Set category
  np2State.selectedCategory = category;
  
  // Find category details
  const categoryCards = {
    'hatod': { label: 'Hatod', icon: 'motorcycle', color: '#3498db' },
    'hakot': { label: 'Hakot', icon: 'truck', color: '#e74c3c' },
    'kompra': { label: 'Kompra', icon: 'shopping_cart', color: '#2ecc71' },
    'luto': { label: 'Luto', icon: 'restaurant', color: '#f39c12' },
    'hugas': { label: 'Hugas', icon: 'cleaning_services', color: '#9b59b6' },
    'laba': { label: 'Laba', icon: 'local_laundry_service', color: '#1abc9c' },
    'limpyo': { label: 'Limpyo', icon: 'home', color: '#16a085' },
    'tindera': { label: 'Tindera', icon: 'store', color: '#d35400' },
    'bantay': { label: 'Bantay', icon: 'person', color: '#c0392b' },
    'painter': { label: 'Painter', icon: 'format_paint', color: '#8e44ad' },
    'carpenter': { label: 'Carpenter', icon: 'construction', color: '#d35400' },
    'plumber': { label: 'Plumber', icon: 'plumbing', color: '#3498db' },
    'security': { label: 'Security', icon: 'security', color: '#34495e' },
    'driver': { label: 'Driver', icon: 'directions_car', color: '#7f8c8d' },
    'tutor': { label: 'Tutor', icon: 'school', color: '#2980b9' },
    'nurse': { label: 'Nurse', icon: 'local_hospital', color: '#e74c3c' },
    'doctor': { label: 'Doctor', icon: 'medical_services', color: '#c0392b' },
    'lawyer': { label: 'Lawyer', icon: 'gavel', color: '#34495e' },
    'mechanic': { label: 'Mechanic', icon: 'build', color: '#7f8c8d' },
    'electrician': { label: 'Electrician', icon: 'electrical_services', color: '#f39c12' },
    'tailor': { label: 'Tailor', icon: 'content_cut', color: '#9b59b6' },
    'accountant': { label: 'Accountant', icon: 'account_balance', color: '#27ae60' }
  };
  
  if (categoryCards[category]) {
    np2State.categoryLabel = categoryCards[category].label;
    np2State.categoryIcon = categoryCards[category].icon;
    np2State.categoryColor = categoryCards[category].color;
    updateCategoryHeaders();
  }
  
  // Set location data
  if (jobData.region) np2State.selectedRegion = jobData.region;
  if (jobData.city) {
    np2State.selectedCity = jobData.city;
    handleCityChange(jobData.city);
  }
  
  // Set job details
  if (jobData.title) {
    np2State.jobTitle = jobData.title;
    const titleInput = document.getElementById('jobTitleInput');
    if (titleInput) titleInput.value = jobData.title;
  }
  
  if (jobData.description) {
    np2State.jobDescription = jobData.description;
    const descInput = document.getElementById('jobDescriptionTextarea');
    if (descInput) {
      descInput.value = jobData.description;
    }
  }
  
  if (jobData.jobDate || jobData.dateNeeded) {
    np2State.jobDate = jobData.jobDate || jobData.dateNeeded;
    const dateInput = document.getElementById('jobDateInput');
    if (dateInput) dateInput.value = np2State.jobDate;
  }
  
  // Set time data
  if (jobData.startTime) {
    const timeParts = jobData.startTime.split(' ');
    np2State.startHour = timeParts[0];
    np2State.startPeriod = timeParts[1];
  }
  
  if (jobData.endTime) {
    const timeParts = jobData.endTime.split(' ');
    np2State.endHour = timeParts[0];
    np2State.endPeriod = timeParts[1];
  }
  
  // Set payment data
  if (jobData.paymentType) np2State.paymentType = jobData.paymentType;
  if (jobData.paymentAmount || jobData.priceOffer) {
    np2State.paymentAmount = jobData.paymentAmount || jobData.priceOffer;
    const amountInput = document.getElementById('paymentAmountInput');
    if (amountInput) amountInput.value = np2State.paymentAmount;
  }
  
  // Set extras
  if (jobData.extras && Array.isArray(jobData.extras)) {
    jobData.extras.forEach((extra, index) => {
      if (index === 0) {
        const parts = extra.split(' ');
        np2State.extras1Value = parts.slice(1).join(' '); // Remove label, keep value
      } else if (index === 1) {
        const parts = extra.split(' ');
        np2State.extras2Value = parts.slice(1).join(' '); // Remove label, keep value
      }
    });
  }
  
  // Set photo (for both edit and relist modes)
  if ((mode === 'edit' || mode === 'relist') && jobData.thumbnail) {
    np2State.photoDataUrl = jobData.thumbnail;
    const previewImage = document.getElementById('photoPreviewImage');
    const uploadArea = document.getElementById('photoUploadArea');
    const preview = document.getElementById('photoPreview');
    if (previewImage && preview && uploadArea) {
      previewImage.src = jobData.thumbnail;
      uploadArea.style.display = 'none';
      preview.style.display = 'block';
    }
    
    // Recreate processedJobPhoto object (edit mode only - relist will fetch and re-upload)
    if (mode === 'edit' && jobData.originalPhoto) {
      processedJobPhoto = {
        cropped: jobData.thumbnail,
        original: jobData.originalPhoto,
        hasOriginal: true
      };
    }
  }
  
  console.log('✅ Form populated with job data:', np2State);
  showToast(mode === 'edit' ? 'Job loaded for editing' : 'Job loaded for relisting', 'success');
}

// ========================== INITIALIZATION ==========================

// ===== DISCLAIMER LANGUAGE TABS =====
function initializeDisclaimerLangTabs() {
  const tabContainer = document.getElementById('beforeContinueLangTabs');
  const placeholder = document.getElementById('beforeContinuePlaceholder');
  const englishContent = document.getElementById('beforeContinueEnglish');
  const bisayaContent = document.getElementById('beforeContinueBisaya');
  const tagalogContent = document.getElementById('beforeContinueTagalog');
  const nextBtn = document.getElementById('nextBtn');
  
  if (!tabContainer) {
    console.warn('⚠️ Disclaimer language tabs not found');
    return;
  }
  
  const tabs = tabContainer.querySelectorAll('.np2-lang-tab');
  const contentMap = {
    english: englishContent,
    bisaya: bisayaContent,
    tagalog: tagalogContent
  };
  
  // Track if disclaimer has been read (persists during session)
  let disclaimerRead = false;
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const lang = tab.dataset.lang;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Hide placeholder
      if (placeholder) {
        placeholder.classList.add('hidden');
      }
      
      // Show selected content, hide others
      Object.entries(contentMap).forEach(([key, content]) => {
        if (content) {
          content.style.display = key === lang ? 'flex' : 'none';
        }
      });
      
      // Enable Continue button (only on step 1)
      disclaimerRead = true;
      if (nextBtn && np2State.currentStep === 1) {
        nextBtn.disabled = false;
      }
      
      console.log(`📖 Disclaimer language selected: ${lang}`);
    });
  });
  
  // Store reference to check later
  window.np2DisclaimerRead = () => disclaimerRead;
  
  console.log('🌐 Disclaimer language tabs initialized');
}

// ===== SUCCESS OVERLAY LANGUAGE TABS =====
function initializeSuccessLangTabs() {
  const tabContainer = document.getElementById('successLangTabs');
  const englishContent = document.getElementById('successEnglish');
  const bisayaContent = document.getElementById('successBisaya');
  const tagalogContent = document.getElementById('successTagalog');
  
  if (!tabContainer) {
    console.warn('⚠️ Success language tabs not found');
    return;
  }
  
  const tabs = tabContainer.querySelectorAll('.np2-lang-tab');
  const contentMap = {
    english: englishContent,
    bisaya: bisayaContent,
    tagalog: tagalogContent
  };
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const lang = tab.dataset.lang;
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show selected content, hide others
      Object.entries(contentMap).forEach(([key, content]) => {
        if (content) {
          content.style.display = key === lang ? 'block' : 'none';
        }
      });
      
      console.log(`📖 Success overlay language selected: ${lang}`);
    });
  });
  
  console.log('🌐 Success language tabs initialized');
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 ========== NEW POST 2 LOADING ==========');
  console.log('Current URL:', window.location.href);
  console.log('Initial state:', JSON.stringify(np2State, null, 2));
  
  // FIRST: Check for edit/relist parameters
  handleUrlParameters();
  
  // Initialize all components
  console.log('📌 Initializing dropdowns...');
  initializeDropdowns();
  console.log('📌 Initializing job category...');
  initializeJobCategory();
  console.log('📌 Initializing region...');
  initializeRegion();
  console.log('📌 Initializing city...');
  initializeCity();
  
  // Initialize default city's barangays/extras if a category is already selected
  // This ensures CEBU CITY's barangays load on page load
  if (np2State.selectedCity && np2State.selectedCategory) {
    console.log('📌 Loading initial barangays for:', np2State.selectedCity);
    updateExtrasForCategory(np2State.selectedCategory);
  }
  
  console.log('📌 Initializing extras...');
  initializeExtras();
  console.log('📌 Initializing job details...');
  initializeJobDetails();
  console.log('📌 Initializing payment...');
  initializePayment();
  console.log('📌 Initializing navigation...');
  initializeNavigation();
  console.log('📌 Initializing preview overlay...');
  initializePreviewOverlay();
  console.log('📌 Initializing success overlay...');
  initializeSuccessOverlay();
  console.log('📌 Initializing mobile keyboard handling...');
  initializeMobileKeyboardHandling();
  console.log('📌 Initializing disclaimer language tabs...');
  initializeDisclaimerLangTabs();
  console.log('📌 Initializing success language tabs...');
  initializeSuccessLangTabs();
  
  // Show first section
  console.log('📌 Showing section 1...');
  showSection(1);
  
  // Initialize city options for default region (CEBU)
  console.log('📌 Updating city options...');
  updateCityOptions();
  
  console.log('✅ ========== NEW POST 2 FULLY LOADED ==========');
  
  // Cleanup on page unload to prevent memory leaks
  window.addEventListener('beforeunload', () => {
    cleanupEditMode();
  });
});

