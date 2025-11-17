// ========================== NEW POST 2 - EXPERIMENTAL REDESIGN ==========================
// Modern, step-by-step job posting flow with admin dashboard-inspired UI

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
  paymentAmount: ''
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
  marketer: { field1: { label: "Location:", menuType: "location" }, field2: { label: "Position:", menuType: "position" } }
};

// ========================== HELPER FUNCTIONS ==========================

function getBarangaysForCurrentCity() {
  if (!np2State.selectedCity) return null;
  const barangays = barangaysByCity[np2State.selectedCity];
  return (barangays && barangays.length > 0) ? barangays : null;
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
    `;
    document.body.appendChild(toast);
  }
  
  toast.textContent = message;
  toast.style.background = type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6';
  
  // Show toast
  setTimeout(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  }, 10);
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
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
      if (!np2State.jobDescription.trim()) {
        showToast('Please enter a job description', 'error');
        return false;
      }
      return true;
      
    case 4:
      if (!np2State.paymentAmount || np2State.paymentAmount <= 0) {
        showToast('Please enter a payment amount', 'error');
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
        
        const reader = new FileReader();
        reader.onload = function(event) {
          np2State.photoFile = file;
          np2State.photoDataUrl = event.target.result;
          
          // MOBILE FIX: Use visibility instead of display to prevent layout reflow
          previewImage.style.opacity = '0';
          previewImage.src = event.target.result;
          
          previewImage.onload = function() {
            // Swap visibility in single frame to prevent flicker
            uploadArea.style.display = 'none';
            preview.style.display = 'block';
            // Force reflow
            preview.offsetHeight;
            // Fade in
            previewImage.style.opacity = '1';
          };
        };
        reader.readAsDataURL(file);
      }
    });
  }
  
  if (removeBtn) {
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      np2State.photoFile = null;
      np2State.photoDataUrl = null;
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
  const date = new Date(np2State.jobDate);
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
    });
  }
  
  if (editBtn) {
    editBtn.addEventListener('click', function() {
      overlay.classList.remove('show');
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
    }
  });
}

// ========================== POST JOB ==========================

function postJob() {
  // Generate job number from timestamp
  const jobNumber = Date.now();
  
  // Create job object matching new-post.js format EXACTLY
  // CRITICAL: DO NOT save photoDataUrl (base64) to localStorage - it's too large!
  // Use mock path instead to prevent quota exceeded errors on mobile
  const job = {
    jobId: `${np2State.selectedCategory}_job_2025_${jobNumber}`,
    jobNumber: jobNumber,
    posterId: 'user_peter_ang_001',
    posterName: 'Peter J. Ang',
    title: np2State.jobTitle,
    description: np2State.jobDescription,
    category: np2State.selectedCategory,
    thumbnail: `public/mock/mock-${np2State.selectedCategory}-post${jobNumber}.jpg`, // Always use mock path
    originalPhoto: null, // Don't store base64 images in localStorage
    jobDate: np2State.jobDate,
    dateNeeded: np2State.jobDate,
    startTime: `${np2State.startHour} ${np2State.startPeriod}`,
    endTime: `${np2State.endHour} ${np2State.endPeriod}`,
    priceOffer: np2State.paymentAmount,
    paymentAmount: np2State.paymentAmount,
    paymentType: np2State.paymentType, // Keep "Per Job" or "Per Hour" format
    region: np2State.selectedRegion,
    city: np2State.selectedCity,
    extras: [np2State.extras1Value, np2State.extras2Value].filter(Boolean), // Remove null values
    status: 'active',
    applicationCount: 0,
    applicationIds: [],
    datePosted: new Date().toISOString(),
    jobPageUrl: `${np2State.selectedCategory}.html`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Save to localStorage
  try {
    console.log('📝 Attempting to save job:', job);
    console.log('📝 Job category:', np2State.selectedCategory);
    
    let allJobs = JSON.parse(localStorage.getItem('gisugoJobs') || '{}');
    console.log('📝 Existing jobs:', allJobs);
    
    if (!allJobs[np2State.selectedCategory]) {
      allJobs[np2State.selectedCategory] = [];
      console.log('📝 Created new category array');
    }
    
    // Add new job
    allJobs[np2State.selectedCategory].push(job);
    console.log('📝 Job added to array. Total jobs in category:', allJobs[np2State.selectedCategory].length);
    
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
    
    // Close preview overlay
    document.getElementById('previewOverlay').classList.remove('show');
    
    // Show success overlay
    showSuccessOverlay();
  } catch (error) {
    console.error('❌ Error saving job:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Stack trace:', error.stack);
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
    
    // Extract extras as separate fields (listing.js expects extra1, extra2)
    const extra1 = job.extras && job.extras[0] ? job.extras[0] : '';
    const extra2 = job.extras && job.extras[1] ? job.extras[1] : '';
    
    // CRITICAL: Match exact field names from new-post.js
    const previewCard = {
      jobNumber: job.jobNumber,
      title: job.title,
      extra1: extra1,
      extra2: extra2,
      price: `₱${job.paymentAmount}`, // Must include ₱ symbol
      rate: job.paymentType,
      date: formattedDate, // Formatted like "Nov 21"
      time: `${job.startTime} - ${job.endTime}`,
      photo: job.thumbnail, // Use 'photo' not 'thumbnail'
      templateUrl: `dynamic-job.html?category=${job.category}&jobNumber=${job.jobNumber}`,
      region: job.region,
      city: job.city,
      createdAt: new Date().toISOString()
    };
    
    // Add to beginning (newest first, matching new-post.js behavior)
    previewCards[job.category].unshift(previewCard);
    localStorage.setItem('jobPreviewCards', JSON.stringify(previewCards));
    console.log('✅ Job preview card saved for listing page:', previewCard);
  } catch (error) {
    console.error('❌ Error saving job preview card:', error);
    // Don't throw error - this is supplementary data
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
      // Navigate to the category page (e.g., hatod.html, limpyo.html)
      if (np2State.selectedCategory) {
        window.location.href = `${np2State.selectedCategory}.html`;
      } else {
        window.location.href = 'jobs.html';
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

// ========================== INITIALIZATION ==========================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 ========== NEW POST 2 LOADING ==========');
  console.log('Current URL:', window.location.href);
  console.log('Initial state:', JSON.stringify(np2State, null, 2));
  
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
  
  // Show first section
  console.log('📌 Showing section 1...');
  showSection(1);
  
  // Initialize city options for default region (CEBU)
  console.log('📌 Updating city options...');
  updateCityOptions();
  
  console.log('✅ ========== NEW POST 2 FULLY LOADED ==========');
});

