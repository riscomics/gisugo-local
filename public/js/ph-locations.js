// ============================================================================
// PH_LOCATIONS -- shared nationwide region/city reference data
// ============================================================================
// Single source of truth for the Region -> City picker used by both listing.js
// (browse/filter category pages) and new-post2.js (gig posting form). Previously
// each file kept its own duplicated copy limited to 9 regions (Cebu/Bohol/Leyte/
// Masbate/Negros/Panay/Samar/Davao/Manila) -- expanded 2026-08-03 to nationwide
// coverage. See docs/V1_HARDENING_TASKLIST.md Track D for the full decision trail.
//
// IMPORTANT -- the original 9 keys/values are preserved BYTE-FOR-BYTE from the prior
// listing.js/new-post2.js data (same spelling, same casing, same entries, including
// pre-existing quirks like the "SanFernando" entry under CEBU having no space). Live
// Firestore gig documents already store region/city strings matching these exact
// values -- changing any of them would silently break filtering/display for existing
// gigs. Do not "clean up" the original 9 groups without a data migration.
//
// The other ~64 groups are new, generated from the official PSGC (Philippine
// Standard Geographic Code) data via open-admin-data/philippines-administrative-
// divisions (CC-BY-4.0, PSA-sourced,
// https://github.com/open-admin-data/philippines-administrative-divisions),
// NOT hand-typed, to avoid the accuracy risk of manually listing ~1,600 municipality
// names. Grouped by PROVINCE (not the stricter official 17-region tier) to match the
// granularity already established by the original 9 keys, which are themselves
// province/informal-multi-province groupings, not official regions -- e.g. "DAVAO" is
// the whole Davao Region's 5 provinces lumped together, "PANAY" is 5 Western Visayas
// provinces, but "CEBU"/"BOHOL" are single provinces. Switching to the strict official
// 17-region tier instead would have been a worse fit here: e.g. Cebu + Bohol + Negros
// Oriental + Siquijor would all collapse into one "Region VII" bucket, which is a
// regression from today's clean separate CEBU/BOHOL picks.
//
// Two pre-existing naming quirks carried forward as-is, NOT introduced by this change:
//   - "NEGROS" (original key) = Negros OCCIDENTAL only. The new "NEGROS ORIENTAL"
//     entry is the separate other province -- intentionally not merged/renamed so the
//     original live key is untouched.
//   - "SAMAR" (original key) = Samar/Western Samar only. "EASTERN SAMAR" and
//     "NORTHERN SAMAR" are separate new entries for the other 2 Eastern Visayas
//     provinces the original key never covered.
// Two single-city special geographic areas (Isabela City, Cotabato City -- both
// administratively distinct chartered cities, not regular province towns) were folded
// into their geographic neighbor (BASILAN, NORTH COTABATO respectively) instead of
// being their own top-level 1-city entries, to avoid cluttering the list.
// ============================================================================

const PH_LOCATIONS = {
  "CEBU": ["Alcantara", "Alcoy", "Alegria", "Aloguinsan", "Argao", "Asturias", "Badian", "Balamban", "Bantayan", "Barili", "Bogo", "Boljoon", "Borbon", "Carcar", "Carmen", "Catmon", "CEBU CITY", "Compostela", "Consolacion", "Cordova", "Daanbantayan", "Dalaguete", "Danao", "Dumanjug", "Ginatilan", "Lapu-Lapu", "Liloan", "Madridejos", "Malabuyoc", "Mandaue", "Medellin", "Minglanilla", "Moalboal", "Naga City", "Oslob", "Pilar", "Pinamungajan", "Poro", "Ronda", "Samboan", "SanFernando", "San Francisco", "San Remigio", "Santa Fe", "Santander", "Sibonga", "Sogod", "Tabogon", "Tabuelan", "Talisay", "Toledo City", "Tuburan", "Tudela"],
  "LEYTE": ["Tacloban City", "Ormoc City", "Baybay City", "Abuyog", "Alangalang", "Albuera", "Babatngon", "Barugo", "Bato", "Burauen", "Calubian", "Capoocan", "Carigara", "Dagami", "Dulag", "Hilongos", "Hindang", "Inopacan", "Isabel", "Jaro", "Javier", "Julita", "Kananga", "La Paz", "Leyte", "MacArthur", "Mahaplag", "Matag-ob", "Matalom", "Mayorga", "Merida", "Palo", "Palompon", "Pastrana", "San Isidro", "San Miguel", "Santa Fe", "Tabango", "Tabontabon", "Tanauan", "Tolosa", "Tunga", "Villaba*", "Maasin City", "Anahawan", "Bontoc", "Hinunangan", "Hinundayan", "Libagon", "Liloan", "Limasawa", "Macrohon", "Malitbog", "Pintuyan", "Saint Bernard", "San Francisco", "San Juan Kabalian", "San Ricardo", "Silago", "Sogod", "Tomas Oppus"],
  "BOHOL": ["Tagbilaran City", "Alburquerque", "Alicia", "Anda", "Antequera", "Baclayon", "Balilihan", "Batuan", "Bien Unido", "Bilar", "Buenavista", "Calape", "Candijay", "Carmen", "Catigbian", "Clarin", "Corella", "Cortes", "Dagohoy", "Danao", "Dauis", "Dimiao", "Duero", "Garcia Hernandez", "Guindulman", "Inabanga", "Jagna", "Jetafe", "Lila", "Loay", "Loboc", "Loon", "Mabini", "Maribojoc", "Panglao", "Pilar", "Pres. Carlos P. Garcia", "Sagbayan", "San Isidro", "San Miguel", "Sevilla", "Sierra Bullones", "Sikatuna", "Talibon", "Trinidad", "Tubigon", "Ubay", "Valencia"],
  "MASBATE": ["Masbate City", "Aroroy", "Baleno", "Balud", "Batuan", "Cataingan", "Cawayan", "Claveria", "Dimasalang", "Esperanza", "Mandaon", "Milagros", "Mobo", "Monreal", "Palanas", "Pio V. Corpuz", "Placer", "San Fernando", "San Jacinto", "San Pascual", "Uson"],
  "NEGROS": ["Bacolod City", "Bago City", "Binalbagan", "Cadiz City", "Calatrava", "Cauayan", "Enrique B. Magalona", "Escalante City", "Himamaylan City", "Hinigaran", "Hinoba-an", "Ilog", "Isabela", "Kabankalan City", "La Carlota City", "La Castellana", "Manapla", "Moises Padilla", "Murcia", "Pontevedra", "Pulupandan", "Sagay City", "Salvador Benedicto", "San Carlos City", "San Enrique", "Silay City", "Sipalay City", "Talisay City", "Toboso", "Valladolid", "Victorias City"],
  "PANAY": ["Altavas", "Balete", "Banga", "Batan", "Buruanga", "Ibajay", "Kalibo", "Lezo", "Libacao", "Madalag", "Makato", "Malay", "Malinao", "Nabas", "New Washington", "Numancia", "Tangalan", "Anini-y", "Barbaza", "Belison", "Bugasong", "Caluya", "Culasi", "Hamtic", "Laua-an", "Libertad", "Pandan", "Patnongon", "San Jose de Buenavista", "San Remigio", "Sebaste", "Sibalom", "Tibiao", "Tobias Fornier", "Valderrama", "Cuartero", "Dao", "Dumalag", "Dumarao", "Ivisan", "Jamindan", "Maayon", "Mambusao", "Panay", "Panitan", "Pilar", "Pontevedra", "President Roxas", "Roxas City", "Sapian", "Sigma", "Tapaz", "Ajuy", "Alimodian", "Anilao", "Badiangan", "Balasan", "Banate", "Barotac Nuevo", "Barotac Viejo", "Batad", "Bingawan", "Cabatuan", "Calinog", "Carles", "Concepcion", "Dingle", "Dueñas", "Dumangas", "Estancia", "Guimbal", "Igbaras", "Iloilo City", "Janiuay", "Lambunao", "Leganes", "Lemery", "Leon", "Maasin", "Miagao", "Mina", "New Lucena", "Oton", "Passi City", "Pavia", "Pototan", "San Dionisio", "San Enrique", "San Joaquin", "San Miguel", "San Rafael", "Santa Barbara", "Sara", "Tigbauan", "Tubungan", "Zarraga", "Buenavista", "Jordan", "Nueva Valencia", "San Lorenzo", "Sibunag"],
  "SAMAR": ["Catbalogan City", "Calbayog City", "Almagro", "Basey", "Calbiga", "Daram", "Gandara", "Hinabangan", "Jiabong", "Marabut", "Matuguinao", "Motiong", "Pagsanghan", "Paranas", "Pinabacdao", "San Jorge", "San Jose de Buan", "San Sebastian", "Santa Margarita", "Santa Rita", "Santo Niño", "Tagapul-an", "Talalora", "Tarangnan", "Villareal", "Zumarraga"],
  "DAVAO": ["Davao City", "Digos City", "Mati City", "Panabo City", "Samal City", "Tagum City", "Compostela", "Laak", "Mabini", "Maco", "Maragusan", "Mawab", "Monkayo", "Montevista", "Nabunturan", "New Bataan", "Pantukan", "Asuncion", "Braulio E. Dujali", "Carmen", "Kapalong", "New Corella", "San Isidro", "Santo Tomas", "Talaingod", "Bansalan", "Don Marcelino", "Hagonoy", "Jose Abad Santos", "Kiblawan", "Magsaysay", "Malalag", "Malita", "Matanao", "Don Marcelino", "Jose Abad Santos", "Malita", "Santa Maria", "Sulop", "Baganga", "Banaybanay", "Boston", "Caraga", "Cateel", "Governor Generoso", "Lupon", "Manay", "San Isidro", "Tarragona"],
  "MANILA": ["Manila", "Quezon City", "Caloocan", "Las Piñas", "Makati", "Malabon", "Mandaluyong", "Marikina", "Muntinlupa", "Navotas", "Parañaque", "Pasay", "Pasig", "Pateros", "San Juan", "Taguig", "Valenzuela"],
  "ILOCOS NORTE": ["Adams", "Bacarra", "Badoc", "Bangui", "Banna (Espiritu)", "Batac", "Burgos", "Carasi", "Currimao", "Dingras", "Dumalneg", "Laoag City", "Marcos", "Nueva Era", "Pagudpud", "Paoay", "Pasuquin", "Piddig", "Pinili", "San Nicolas", "Sarrat", "Solsona", "Vintar"],
  "ILOCOS SUR": ["Alilem", "Banayoyo", "Bantay", "Burgos", "Cabugao", "Candon", "Caoayan", "Cervantes", "Galimuyod", "Gregorio Del Pilar (Concepcion)", "Lidlidda", "Magsingal", "Nagbukel", "Narvacan", "Quirino (Angkaki)", "Salcedo (Baugen)", "San Emilio", "San Esteban", "San Ildefonso", "San Juan (Lapog)", "San Vicente", "Santa", "Santa Catalina", "Santa Cruz", "Santa Lucia", "Santa Maria", "Santiago", "Santo Domingo", "Sigay", "Sinait", "Sugpon", "Suyo", "Tagudin", "Vigan"],
  "LA UNION": ["Agoo", "Aringay", "Bacnotan", "Bagulin", "Balaoan", "Bangar", "Bauang", "Burgos", "Caba", "Luna", "Naguilian", "Pugo", "Rosario", "San Fernando", "San Gabriel", "San Juan", "Santo Tomas", "Santol", "Sudipen", "Tubao"],
  "PANGASINAN": ["Agno", "Aguilar", "Alaminos", "Alcala", "Anda", "Asingan", "Balungao", "Bani", "Basista", "Bautista", "Bayambang", "Binalonan", "Binmaley", "Bolinao", "Bugallon", "Burgos", "Calasiao", "Dagupan City", "Dasol", "Infanta", "Labrador", "Laoac", "Lingayen", "Mabini", "Malasiqui", "Manaoag", "Mangaldan", "Mangatarem", "Mapandan", "Natividad", "Pozorrubio", "Rosales", "San Carlos City", "San Fabian", "San Jacinto", "San Manuel", "San Nicolas", "San Quintin", "Santa Barbara", "Santa Maria", "Santo Tomas", "Sison", "Sual", "Tayug", "Umingan", "Urbiztondo", "Urdaneta", "Villasis"],
  "BATANES": ["Basco", "Itbayat", "Ivana", "Mahatao", "Sabtang", "Uyugan"],
  "CAGAYAN": ["Abulug", "Alcala", "Allacapan", "Amulung", "Aparri", "Baggao", "Ballesteros", "Buguey", "Calayan", "Camalaniugan", "Claveria", "Enrile", "Gattaran", "Gonzaga", "Iguig", "Lal-Lo", "Lasam", "Pamplona", "Peñablanca", "Piat", "Rizal", "Sanchez-Mira", "Santa Ana", "Santa Praxedes", "Santa Teresita", "Santo Niño (Faire)", "Solana", "Tuao", "Tuguegarao City"],
  "ISABELA": ["Alicia", "Angadanan", "Aurora", "Benito Soliven", "Burgos", "Cabagan", "Cabatuan", "Cauayan", "Cordon", "Delfin Albano (Magsaysay)", "Dinapigue", "Divilacan", "Echague", "Gamu", "Ilagan City", "Jones", "Luna", "Maconacon", "Mallig", "Naguilian", "Palanan", "Quezon", "Quirino", "Ramon", "Reina Mercedes", "Roxas", "San Agustin", "San Guillermo", "San Isidro", "San Manuel", "San Mariano", "San Mateo", "San Pablo", "Santa Maria", "Santiago", "Santo Tomas", "Tumauini"],
  "NUEVA VIZCAYA": ["Alfonso Castaneda", "Ambaguio", "Aritao", "Bagabag", "Bambang", "Bayombong", "Diadi", "Dupax Del Norte", "Dupax Del Sur", "Kasibu", "Kayapa", "Quezon", "Santa Fe", "Solano", "Villaverde"],
  "QUIRINO": ["Aglipay", "Cabarroguis", "Diffun", "Maddela", "Nagtipunan", "Saguday"],
  "BATAAN": ["Abucay", "Bagac", "Balanga", "Dinalupihan", "Hermosa", "Limay", "Mariveles", "Morong", "Orani", "Orion", "Pilar", "Samal"],
  "BULACAN": ["Angat", "Balagtas (Bigaa)", "Baliuag", "Bocaue", "Bulacan", "Bustos", "Calumpit", "Doña Remedios Trinidad", "Guiguinto", "Hagonoy", "Malolos", "Marilao", "Meycauayan", "Norzagaray", "Obando", "Pandi", "Paombong", "Plaridel", "Pulilan", "San Ildefonso", "San Jose Del Monte", "San Miguel", "San Rafael", "Santa Maria"],
  "NUEVA ECIJA": ["Aliaga", "Bongabon", "Cabanatuan City", "Cabiao", "Carranglan", "Cuyapo", "Gabaldon (Bitulok & Sabani)", "Gapan", "General Mamerto Natividad", "General Tinio (Papaya)", "Guimba", "Jaen", "Laur", "Licab", "Llanera", "Lupao", "Nampicuan", "Palayan City", "Pantabangan", "Peñaranda", "Quezon", "Rizal", "San Antonio", "San Isidro", "San Jose City", "San Leonardo", "Santa Rosa", "Santo Domingo", "Science City Of Muñoz", "Talavera", "Talugtug", "Zaragoza"],
  "PAMPANGA": ["Angeles City", "Apalit", "Arayat", "Bacolor", "Candaba", "Floridablanca", "Guagua", "Lubao", "Mabalacat City", "Macabebe", "Magalang", "Masantol", "Mexico", "Minalin", "Porac", "San Fernando", "San Luis", "San Simon", "Santa Ana", "Santa Rita", "Santo Tomas", "Sasmuan (Sexmoan)"],
  "TARLAC": ["Anao", "Bamban", "Camiling", "Capas", "Concepcion", "Gerona", "La Paz", "Mayantoc", "Moncada", "Paniqui", "Pura", "Ramos", "San Clemente", "San Jose", "San Manuel", "Santa Ignacia", "Tarlac", "Victoria"],
  "ZAMBALES": ["Botolan", "Cabangan", "Candelaria", "Castillejos", "Iba", "Masinloc", "Olongapo City", "Palauig", "San Antonio", "San Felipe", "San Marcelino", "San Narciso", "Santa Cruz", "Subic"],
  "AURORA": ["Baler", "Casiguran", "Dilasag", "Dinalungan", "Dingalan", "Dipaculao", "Maria Aurora", "San Luis"],
  "BATANGAS": ["Agoncillo", "Alitagtag", "Balayan", "Balete", "Batangas City", "Bauan", "Calaca", "Calatagan", "Cuenca", "Ibaan", "Laurel", "Lemery", "Lian", "Lipa City", "Lobo", "Mabini", "Malvar", "Mataasnakahoy", "Nasugbu", "Padre Garcia", "Rosario", "San Jose", "San Juan", "San Luis", "San Nicolas", "San Pascual", "Santa Teresita", "Santo Tomas", "Taal", "Talisay", "Tanauan", "Taysan", "Tingloy", "Tuy"],
  "CAVITE": ["Alfonso", "Amadeo", "Bacoor City", "Carmona", "Cavite City", "Dasmariñas", "Gen. Mariano Alvarez", "General Emilio Aguinaldo", "General Trias", "Imus City", "Indang", "Kawit", "Magallanes", "Maragondon", "Mendez (Mendez-Nuñez)", "Naic", "Noveleta", "Rosario", "Silang", "Tagaytay City", "Tanza", "Ternate", "Trece Martires City"],
  "LAGUNA": ["Alaminos", "Bay", "Biñan", "Cabuyao City", "Calamba", "Calauan", "Cavinti", "Famy", "Kalayaan", "Liliw", "Los Baños", "Luisiana", "Lumban", "Mabitac", "Magdalena", "Majayjay", "Nagcarlan", "Paete", "Pagsanjan", "Pakil", "Pangil", "Pila", "Rizal", "San Pablo City", "San Pedro", "Santa Cruz", "Santa Maria", "Santa Rosa", "Siniloan", "Victoria"],
  "QUEZON": ["Agdangan", "Alabat", "Atimonan", "Buenavista", "Burdeos", "Calauag", "Candelaria", "Catanauan", "Dolores", "General Luna", "General Nakar", "Guinayangan", "Gumaca", "Infanta", "Jomalig", "Lopez", "Lucban", "Lucena City", "Macalelon", "Mauban", "Mulanay", "Padre Burgos", "Pagbilao", "Panukulan", "Patnanungan", "Perez", "Pitogo", "Plaridel", "Polillo", "Quezon", "Real", "Sampaloc", "San Andres", "San Antonio", "San Francisco (Aurora)", "San Narciso", "Sariaya", "Tagkawayan", "Tayabas", "Tiaong", "Unisan"],
  "RIZAL": ["Angono", "Antipolo", "Baras", "Binangonan", "Cainta", "Cardona", "Jala-Jala", "Morong", "Pililla", "Rodriguez (Montalban)", "San Mateo", "Tanay", "Taytay", "Teresa"],
  "ALBAY": ["Bacacay", "Camalig", "Daraga (Locsin)", "Guinobatan", "Jovellar", "Legazpi City", "Libon", "Ligao", "Malilipot", "Malinao", "Manito", "Oas", "Pio Duran", "Polangui", "Rapu-Rapu", "Santo Domingo (Libog)", "Tabaco", "Tiwi"],
  "CAMARINES NORTE": ["Basud", "Capalonga", "Daet", "Jose Panganiban", "Labo", "Mercedes", "Paracale", "San Lorenzo Ruiz (Imelda)", "San Vicente", "Santa Elena", "Talisay", "Vinzons"],
  "CAMARINES SUR": ["Baao", "Balatan", "Bato", "Bombon", "Buhi", "Bula", "Cabusao", "Calabanga", "Camaligan", "Canaman", "Caramoan", "Del Gallego", "Gainza", "Garchitorena", "Goa", "Iriga City", "Lagonoy", "Libmanan", "Lupi", "Magarao", "Milaor", "Minalabac", "Nabua", "Naga City", "Ocampo", "Pamplona", "Pasacao", "Pili", "Presentacion (Parubcan)", "Ragay", "Sagñay", "San Fernando", "San Jose", "Sipocot", "Siruma", "Tigaon", "Tinambac"],
  "CATANDUANES": ["Bagamanoc", "Baras", "Bato", "Caramoran", "Gigmoto", "Pandan", "Panganiban (Payo)", "San Andres (Calolbon)", "San Miguel", "Viga", "Virac"],
  "SORSOGON": ["Barcelona", "Bulan", "Bulusan", "Casiguran", "Castilla", "Donsol", "Gubat", "Irosin", "Juban", "Magallanes", "Matnog", "Pilar", "Prieto Diaz", "Santa Magdalena", "Sorsogon"],
  "NEGROS ORIENTAL": ["Amlan (Ayuquitan)", "Ayungon", "Bacong", "Bais City", "Basay", "Bayawan (Tulong)", "Bindoy (Payabon)", "Canlaon City", "Dauin", "Dumaguete City", "Guihulngan", "Jimalalud", "La Libertad", "Mabinay", "Manjuyod", "Pamplona", "San Jose", "Santa Catalina", "Siaton", "Sibulan", "Tanjay", "Tayasan", "Valencia (Luzurriaga)", "Vallehermoso", "Zamboanguita"],
  "SIQUIJOR": ["Enrique Villanueva", "Larena", "Lazi", "Maria", "San Juan", "Siquijor"],
  "EASTERN SAMAR": ["Arteche", "Balangiga", "Balangkayan", "Borongan", "Can-Avid", "Dolores", "General Macarthur", "Giporlos", "Guiuan", "Hernani", "Jipapad", "Lawaan", "Llorente", "Maslog", "Maydolong", "Mercedes", "Oras", "Quinapondan", "Salcedo", "San Julian", "San Policarpo", "Sulat", "Taft"],
  "NORTHERN SAMAR": ["Allen", "Biri", "Bobon", "Capul", "Catarman", "Catubig", "Gamay", "Laoang", "Lapinig", "Las Navas", "Lavezares", "Lope De Vega", "Mapanas", "Mondragon", "Palapag", "Pambujan", "Rosario", "San Antonio", "San Isidro", "San Jose", "San Roque", "San Vicente", "Silvino Lobos", "Victoria"],
  "BILIRAN": ["Almeria", "Biliran", "Cabucgayan", "Caibiran", "Culaba", "Kawayan", "Maripipi", "Naval"],
  "ZAMBOANGA DEL NORTE": ["Bacungan (Leon T. Postigo)", "Baliguian", "Dapitan City", "Dipolog City", "Godod", "Gutalac", "Jose Dalman (Ponot)", "Kalawit", "Katipunan", "La Libertad", "Labason", "Liloy", "Manukan", "Mutia", "Piñan (New Piñan)", "Polanco", "Pres. Manuel A. Roxas", "Rizal", "Salug", "Sergio Osmeña Sr.", "Siayan", "Sibuco", "Sibutad", "Sindangan", "Siocon", "Sirawai", "Tampilisan"],
  "ZAMBOANGA DEL SUR": ["Aurora", "Bayog", "Dimataling", "Dinas", "Dumalinao", "Dumingag", "Guipos", "Josefina", "Kumalarang", "Labangan", "Lakewood", "Lapuyan", "Mahayag", "Margosatubig", "Midsalip", "Molave", "Pagadian City", "Pitogo", "Ramon Magsaysay (Liargo)", "San Miguel", "San Pablo", "Sominot (Don Mariano Marcos)", "Tabina", "Tambulig", "Tigbao", "Tukuran", "Vincenzo A. Sagun", "Zamboanga City"],
  "ZAMBOANGA SIBUGAY": ["Alicia", "Buug", "Diplahan", "Imelda", "Ipil", "Kabasalan", "Mabuhay", "Malangas", "Naga", "Olutanga", "Payao", "Roseller Lim", "Siay", "Talusan", "Titay", "Tungawan"],
  "BUKIDNON": ["Baungon", "Cabanglasan", "Damulog", "Dangcagan", "Don Carlos", "Impasug-Ong", "Kadingilan", "Kalilangan", "Kibawe", "Kitaotao", "Lantapan", "Libona", "Malaybalay", "Malitbog", "Manolo Fortich", "Maramag", "Pangantucan", "Quezon", "San Fernando", "Sumilao", "Talakag", "Valencia"],
  "CAMIGUIN": ["Catarman", "Guinsiliban", "Mahinog", "Mambajao", "Sagay"],
  "LANAO DEL NORTE": ["Bacolod", "Baloi", "Baroy", "Iligan City", "Kapatagan", "Kauswagan", "Kolambugan", "Lala", "Linamon", "Magsaysay", "Maigo", "Matungao", "Munai", "Nunungan", "Pantao Ragat", "Pantar", "Poona Piagapo", "Salvador", "Sapad", "Sultan Naga Dimaporo (Karomatan)", "Tagoloan", "Tangcal", "Tubod"],
  "MISAMIS OCCIDENTAL": ["Aloran", "Baliangao", "Bonifacio", "Calamba", "Clarin", "Concepcion", "Don Victoriano Chiongbian  (Don Mariano Marcos)", "Jimenez", "Lopez Jaena", "Oroquieta City", "Ozamiz City", "Panaon", "Plaridel", "Sapang Dalaga", "Sinacaban", "Tangub City", "Tudela"],
  "MISAMIS ORIENTAL": ["Alubijid", "Balingasag", "Balingoan", "Binuangan", "Cagayan de Oro City", "Claveria", "El Salvador", "Gingoog City", "Gitagum", "Initao", "Jasaan", "Kinoguitan", "Lagonglong", "Laguindingan", "Libertad", "Lugait", "Magsaysay (Linugos)", "Manticao", "Medina", "Naawan", "Opol", "Salay", "Sugbongcogon", "Tagoloan", "Talisayan", "Villanueva"],
  "NORTH COTABATO": ["Alamada", "Aleosan", "Antipas", "Arakan", "Banisilan", "Carmen", "Cotabato City", "Kabacan", "Kidapawan", "Libungan", "M'Lang", "Magpet", "Makilala", "Matalam", "Midsayap", "Pigkawayan", "Pikit", "President Roxas", "Tulunan"],
  "SOUTH COTABATO": ["Banga", "General Santos City (Dadiangas)", "Koronadal", "Lake Sebu", "Norala", "Polomolok", "Santo Niño", "Surallah", "T'Boli", "Tampakan", "Tantangan", "Tupi"],
  "SULTAN KUDARAT": ["Bagumbayan", "Columbio", "Esperanza", "Isulan", "Kalamansig", "Lambayong (Mariano Marcos)", "Lebak", "Lutayan", "Palimbang", "President Quirino", "Sen. Ninoy Aquino", "Tacurong"],
  "SARANGANI": ["Alabel", "Glan", "Kiamba", "Maasim", "Maitum", "Malapatan", "Malungon"],
  "ABRA": ["Bangued", "Boliney", "Bucay", "Bucloc", "Daguioman", "Danglas", "Dolores", "La Paz", "Lacub", "Lagangilang", "Lagayan", "Langiden", "Licuan-Baay (Licuan)", "Luba", "Malibcong", "Manabo", "Peñarrubia", "Pidigan", "Pilar", "Sallapadan", "San Isidro", "San Juan", "San Quintin", "Tayum", "Tineg", "Tubo", "Villaviciosa"],
  "BENGUET": ["Atok", "Baguio City", "Bakun", "Bokod", "Buguias", "Itogon", "Kabayan", "Kapangan", "Kibungan", "La Trinidad", "Mankayan", "Sablan", "Tuba", "Tublay"],
  "IFUGAO": ["Aguinaldo", "Alfonso Lista (Potia)", "Asipulo", "Banaue", "Hingyon", "Hungduan", "Kiangan", "Lagawe", "Lamut", "Mayoyao", "Tinoc"],
  "KALINGA": ["Balbalan", "Lubuagan", "Pasil", "Pinukpuk", "Rizal (Liwan)", "Tabuk", "Tanudan", "Tinglayan"],
  "MOUNTAIN PROVINCE": ["Barlig", "Bauko", "Besao", "Bontoc", "Natonin", "Paracelis", "Sabangan", "Sadanga", "Sagada", "Tadian"],
  "APAYAO": ["Calanasan (Bayag)", "Conner", "Flora", "Kabugao", "Luna", "Pudtol", "Santa Marcela"],
  "BASILAN": ["Akbar", "Al-Barka", "Hadji Mohammad Ajul", "Hadji Muhtamad", "Isabela", "Lamitan", "Lantawan", "Maluso", "Sumisip", "Tabuan-Lasa", "Tipo-Tipo", "Tuburan", "Ungkaya Pukan"],
  "LANAO DEL SUR": ["Bacolod-Kalawi (Bacolod Grande)", "Balabagan", "Balindong (Watu)", "Bayang", "Binidayan", "Buadiposo-Buntong", "Bubong", "Bumbaran", "Butig", "Calanogas", "Ditsaan-Ramain", "Ganassi", "Kapai", "Kapatagan", "Lumba-Bayabao (Maguing)", "Lumbaca-Unayan", "Lumbatan", "Lumbayanague", "Madalum", "Madamba", "Maguing", "Malabang", "Marantao", "Marawi City", "Marogong", "Masiu", "Mulondo", "Pagayawan (Tatarikan)", "Piagapo", "Picong (Sultan Gumander)", "Poona Bayabao (Gata)", "Pualas", "Saguiaran", "Sultan Dumalondong", "Tagoloan Ii", "Tamparan", "Taraka", "Tubaran", "Tugaya", "Wao"],
  "MAGUINDANAO": ["Ampatuan", "Barira", "Buldon", "Buluan", "Datu Abdullah Sangki", "Datu Anggal Midtimbang", "Datu Blah T. Sinsuat", "Datu Hoffer Ampatuan", "Datu Odin Sinsuat (Dinaig)", "Datu Paglas", "Datu Piang", "Datu Salibo", "Datu Saudi-Ampatuan", "Datu Unsay", "Gen. S.K. Pendatun", "Guindulungan", "Kabuntalan (Tumbao)", "Mamasapano", "Mangudadatu", "Matanog", "Northern Kabuntalan", "Pagagawan", "Pagalungan", "Paglat", "Pandag", "Parang", "Rajah Buayan", "Shariff Aguak (Maganoy)", "Shariff Saydona Mustapha", "South Upi", "Sultan Kudarat (Nuling)", "Sultan Mastura", "Sultan Sa Barongis (Lambayong)", "Talayan", "Talitay", "Upi"],
  "SULU": ["Hadji Panglima Tahil (Marunggas)", "Indanan", "Jolo", "Kalingalan Caluang", "Lugus", "Luuk", "Maimbung", "Old Panamao", "Omar", "Pandami", "Panglima Estino (New Panamao)", "Pangutaran", "Parang", "Pata", "Patikul", "Siasi", "Talipao", "Tapul", "Tongkil"],
  "TAWI-TAWI": ["Bongao", "Languyan", "Mapun (Cagayan De Tawi-Tawi)", "Panglima Sugala (Balimbing)", "Sapa-Sapa", "Sibutu", "Simunul", "Sitangkai", "South Ubian", "Tandubas", "Turtle Islands"],
  "AGUSAN DEL NORTE": ["Buenavista", "Butuan City", "Cabadbaran", "Carmen", "Jabonga", "Kitcharao", "Las Nieves", "Magallanes", "Nasipit", "Remedios T. Romualdez", "Santiago", "Tubay"],
  "AGUSAN DEL SUR": ["Bayugan", "Bunawan", "Esperanza", "La Paz", "Loreto", "Prosperidad", "Rosario", "San Francisco", "San Luis", "Santa Josefa", "Sibagat", "Talacogon", "Trento", "Veruela"],
  "SURIGAO DEL NORTE": ["Alegria", "Bacuag", "Burgos", "Claver", "Dapa", "Del Carmen", "General Luna", "Gigaquit", "Mainit", "Malimono", "Pilar", "Placer", "San Benito", "San Francisco (Anao-Aon)", "San Isidro", "Santa Monica (Sapao)", "Sison", "Socorro", "Surigao City", "Tagana-An", "Tubod"],
  "SURIGAO DEL SUR": ["Barobo", "Bayabas", "Bislig", "Cagwait", "Cantilan", "Carmen", "Carrascal", "Cortes", "Hinatuan", "Lanuza", "Lianga", "Lingig", "Madrid", "Marihatag", "San Agustin", "San Miguel", "Tagbina", "Tago", "Tandag"],
  "DINAGAT ISLANDS": ["Basilisa (Rizal)", "Cagdianao", "Dinagat", "Libjo (Albor)", "Loreto", "San Jose", "Tubajon"],
  "MARINDUQUE": ["Boac", "Buenavista", "Gasan", "Mogpog", "Santa Cruz", "Torrijos"],
  "OCCIDENTAL MINDORO": ["Abra De Ilog", "Calintaan", "Looc", "Lubang", "Magsaysay", "Mamburao", "Paluan", "Rizal", "Sablayan", "San Jose", "Santa Cruz"],
  "ORIENTAL MINDORO": ["Baco", "Bansud", "Bongabong", "Bulalacao (San Pedro)", "Calapan", "Gloria", "Mansalay", "Naujan", "Pinamalayan", "Pola", "Puerto Galera", "Roxas", "San Teodoro", "Socorro", "Victoria"],
  "PALAWAN": ["Aborlan", "Agutaya", "Araceli", "Balabac", "Bataraza", "Brooke'S Point", "Busuanga", "Cagayancillo", "Coron", "Culion", "Cuyo", "Dumaran", "El Nido (Bacuit)", "Kalayaan", "Linapacan", "Magsaysay", "Narra", "Puerto Princesa City", "Quezon", "Rizal (Marcos)", "Roxas", "San Vicente", "Sofronio Española", "Taytay"],
  "ROMBLON": ["Alcantara", "Banton", "Cajidiocan", "Calatrava", "Concepcion", "Corcuera", "Ferrol", "Looc", "Magdiwang", "Odiongan", "Romblon", "San Agustin", "San Andres", "San Fernando", "San Jose", "Santa Fe", "Santa Maria (Imelda)"]
};

// Preserves the original display order for the first 9 (existing/live) regions
// (Cebu, Leyte, Bohol, Masbate, Negros, Panay, Samar, Davao, Manila), then the ~64
// nationwide-expansion additions sorted alphabetically (2026-08-03, per user request --
// they were previously grouped by official region, north to south, which is harder to
// scan in a long picker list).
const PH_LOCATIONS_ORIGINAL_9_COUNT = 9;
const PH_LOCATIONS_REGION_ORDER = [
  ...Object.keys(PH_LOCATIONS).slice(0, PH_LOCATIONS_ORIGINAL_9_COUNT),
  ...Object.keys(PH_LOCATIONS).slice(PH_LOCATIONS_ORIGINAL_9_COUNT).sort()
];
