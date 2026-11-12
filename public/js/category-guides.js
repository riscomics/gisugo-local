// Shared Category Guides & Post Wizard Copy (synced with gisugo-native/src/data/categoryGuides.ts)
(function (window) {
  'use strict';

const POST_EXTRAS = {
  hatod: { field1: { label: 'Pickup at:', menuType: 'location' }, field2: { label: 'Deliver to:', menuType: 'location' } },
  hakot: { field1: { label: 'Load at:', menuType: 'location' }, field2: { label: 'Unload at:', menuType: 'location' } },
  kompra: { field1: { label: 'Shop at:', menuType: 'location' }, field2: { label: 'Deliver to:', menuType: 'location' } },
  luto: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  hugas: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  laba: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  limpyo: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  tindera: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  bantay: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  painter: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  carpenter: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  plumber: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  security: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  driver: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Location:', menuType: 'location' } },
  tutor: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Subject:', menuType: 'subject' } },
  clerical: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  builder: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  reception: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  nurse: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  doctor: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  lawyer: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  mechanic: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  electrician: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  tailor: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  trainer: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Subject:', menuType: 'subject' } },
  staff: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  petcare: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  photographer: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  videographer: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  musician: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  creative: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  editor: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  artist: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  researcher: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  social: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  secretary: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  consultant: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  engineer: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  programmer: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  therapist: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  marketer: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  gardner: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  performer: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  massage: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  handyman: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  barber: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  waiter: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  chef: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  ittech: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  realtor: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  solicitor: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  aircon: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
  tourguide: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  pila: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  accountant: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  architect: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Position:', menuType: 'position' } },
  landscaper: { field1: { label: 'Location:', menuType: 'location' }, field2: { label: 'Supplies:', menuType: 'supplies' } },
};



const POST_UI_COPY = {
  english: {
    stepLabels: ['Category', 'Location', 'Details', 'Payment'],
    beforeContinueTitle: 'Before You Continue',
    selectCategoryTitle: 'Select Gig Category',
    selectCategorySub: 'Choose the type of work you need help with',
    selectCategoryPlaceholder: 'Select gig category...',
    locationDetailsTitle: 'Location Details',
    locationDetailsSub: 'Where will this gig take place?',
    regionLabel: 'Region',
    regionPlaceholder: 'Select region...',
    cityLabel: 'City/Municipality',
    cityPlaceholder: 'Select city...',
    selectOptionPlaceholder: 'Select option...',
    barangayPlaceholder: 'Barangay name or general area',
    gigDetailsTitle: 'Gig Details',
    gigDetailsSub: 'Provide information about the gig',
    gigTitleLabel: 'Gig Title',
    gigDateLabel: 'Gig Date',
    startTimeLabel: 'Start Time',
    endTimeLabel: 'End Time',
    gigPhotoLabel: 'Gig Photo (Optional)',
    clickPhotoText: 'Add Optional Photo here if available',
    relistPhotoText: 'Add Optional Photo here if available',
    changePhotoText: 'Change Photo',
    photoSubText: '',
    hourPlaceholder: 'Hour',
    detailedDescriptionLabel: 'Detailed Description',
    doneTypingText: 'Done ✓',
    paymentOfferTitle: 'Payment Offer',
    paymentOfferSub: 'How much will you pay for this work?',
    gigUseTypeLabel: 'Gig Use Type',
    personalLabel: 'Personal',
    businessLabel: 'Business',
    amountLabel: 'Amount',
    backBtn: '← Back',
    continueBtn: 'Continue →',
    previewBtn: 'Preview Gig Post',
    cancelBtn: 'Cancel',
    updateBtn: 'UPDATE',
    relistBtn: 'RELIST GIG',
    editGigTitle: 'Edit Your Gig Post',
    editGigSub: 'Update the details below',
    relistGigTitle: 'Relist Your Gig Post',
    relistGigSub: 'Review details to relist your gig',
    categoryLabel: 'Category',
    locationLabel: 'Location',
    searchCategoriesPlaceholder: 'Search categories...',
    selectRegionModalTitle: 'Select Region',
    selectCityModalTitle: 'Select City/Municipality',
    selectOptionModalTitle: 'Select Option',
    selectDateModalTitle: 'Select Date',
    selectHourModalTitle: 'Select Hour',
    selectPeriodModalTitle: 'Select Period',
    previewModalTitle: 'Gig Preview',
    previewEditBtn: 'Edit',
    previewPostBtn: 'Post Gig',
    extraLabels: {
      'Pickup at:': 'Pickup at:',
      'Deliver to:': 'Deliver to:',
      'Load at:': 'Load at:',
      'Unload at:': 'Unload at:',
      'Shop at:': 'Shop at:',
      'Location:': 'Location:',
      'Supplies:': 'Supplies:',
      'Subject:': 'Subject:',
      'Position:': 'Position:',
    },
  },
  bisaya: {
    stepLabels: ['Kategorya', 'Lokasyon', 'Detalye', 'Bayad'],
    beforeContinueTitle: 'Sa Dili Pa Mopadayon',
    selectCategoryTitle: 'Pilia ang Gig Category',
    selectCategorySub: 'Pilia ang klase sa trabaho nga kinahanglan nimo og tabang',
    selectCategoryPlaceholder: 'Pilia ang kategorya sa gig...',
    locationDetailsTitle: 'Detalye sa Lokasyon',
    locationDetailsSub: 'Asa kini nga gig mahitabo?',
    regionLabel: 'Rehiyon',
    regionPlaceholder: 'Pilia ang rehiyon...',
    cityLabel: 'Siyudad/Munisipyo',
    cityPlaceholder: 'Pilia ang siyudad...',
    selectOptionPlaceholder: 'Pilia ang opsyon...',
    barangayPlaceholder: 'Ngalan sa barangay o dapit',
    gigDetailsTitle: 'Detalye sa Gig',
    gigDetailsSub: 'Ihatag ang impormasyon bahin sa gig',
    gigTitleLabel: 'Titulo sa Gig',
    gigDateLabel: 'Petsa sa Gig',
    startTimeLabel: 'Oras Magsugod',
    endTimeLabel: 'Oras Mahuman',
    gigPhotoLabel: 'Litrato sa Gig (Opsyonal)',
    clickPhotoText: 'Pagbutang og Opsyonal nga Litrato kung naa',
    relistPhotoText: 'Pagbutang og Opsyonal nga Litrato kung naa',
    changePhotoText: 'Ilisi ang Litrato',
    photoSubText: '',
    hourPlaceholder: 'Oras',
    detailedDescriptionLabel: 'Detalyado nga Deskripsyon',
    doneTypingText: 'Human na ✓',
    paymentOfferTitle: 'Tanyag nga Bayad',
    paymentOfferSub: 'Pila ang imong ibayad para niini nga trabaho?',
    gigUseTypeLabel: 'Klase sa Paggamit',
    personalLabel: 'Personal',
    businessLabel: 'Negosyo',
    amountLabel: 'Kantidad',
    backBtn: '← Balik',
    continueBtn: 'Padayon →',
    previewBtn: 'Tan-awa ang Gig Post',
    cancelBtn: 'Kanselahon',
    updateBtn: 'I-UPDATE',
    relistBtn: 'I-RELIST ANG GIG',
    editGigTitle: 'Usba ang Imong Gig Post',
    editGigSub: 'I-update ang mga detalye sa ubos',
    relistGigTitle: 'I-relist ang Imong Gig Post',
    relistGigSub: 'Ribyuha ang mga detalye sa imong gig',
    categoryLabel: 'Kategorya',
    locationLabel: 'Lokasyon',
    searchCategoriesPlaceholder: 'Pangitaa ang kategorya...',
    selectRegionModalTitle: 'Pilia ang Rehiyon',
    selectCityModalTitle: 'Pilia ang Siyudad/Munisipyo',
    selectOptionModalTitle: 'Pilia ang Opsyon',
    selectDateModalTitle: 'Pilia ang Petsa',
    selectHourModalTitle: 'Pilia ang Oras',
    selectPeriodModalTitle: 'Pilia ang AM/PM',
    previewModalTitle: 'Preview sa Gig',
    previewEditBtn: 'Usba',
    previewPostBtn: 'I-post ang Gig',
    extraLabels: {
      'Pickup at:': 'Kuhaon sa:',
      'Deliver to:': 'Ihatod sa:',
      'Load at:': 'Ikarga sa:',
      'Unload at:': 'Idiskarga sa:',
      'Shop at:': 'Mamamalit sa:',
      'Location:': 'Lokasyon:',
      'Supplies:': 'Gamit/Supplies:',
      'Subject:': 'Subject/Hilig:',
      'Position:': 'Paagi sa Trabaho:',
    },
  },
  tagalog: {
    stepLabels: ['Kategorya', 'Lokasyon', 'Detalye', 'Bayad'],
    beforeContinueTitle: 'Bago Magpatuloy',
    selectCategoryTitle: 'Pumili ng Gig Category',
    selectCategorySub: 'Piliin ang uri ng trabaho na kailangan mo ng tulong',
    selectCategoryPlaceholder: 'Pumili ng kategorya ng gig...',
    locationDetailsTitle: 'Detalye ng Lokasyon',
    locationDetailsSub: 'Saan gaganapin ang gig na ito?',
    regionLabel: 'Rehiyon',
    regionPlaceholder: 'Pumili ng rehiyon...',
    cityLabel: 'Lungsod/Bayan',
    cityPlaceholder: 'Pumili ng lungsod...',
    selectOptionPlaceholder: 'Pumili ng opsyon...',
    barangayPlaceholder: 'Pangalan ng barangay o lugar',
    gigDetailsTitle: 'Detalye ng Gig',
    gigDetailsSub: 'Magbigay ng impormasyon tungkol sa gig',
    gigTitleLabel: 'Pamagat ng Gig',
    gigDateLabel: 'Petsa ng Gig',
    startTimeLabel: 'Oras ng Simula',
    endTimeLabel: 'Oras ng Tapos',
    gigPhotoLabel: 'Larawan ng Gig (Opsyonal)',
    clickPhotoText: 'Maglagay ng Opsyonal na Larawan kung meron',
    relistPhotoText: 'Maglagay ng Opsyonal na Larawan kung meron',
    changePhotoText: 'Palitan ang Larawan',
    photoSubText: '',
    hourPlaceholder: 'Oras',
    detailedDescriptionLabel: 'Detalyadong Deskripsyon',
    doneTypingText: 'Tapos na ✓',
    paymentOfferTitle: 'Alok na Bayad',
    paymentOfferSub: 'Magkano ang ibabayad mo para sa trabahong ito?',
    gigUseTypeLabel: 'Uri ng Paggamit',
    personalLabel: 'Personal',
    businessLabel: 'Negosyo',
    amountLabel: 'Halaga',
    backBtn: '← Bumalik',
    continueBtn: 'Magpatuloy →',
    previewBtn: 'I-preview ang Gig Post',
    cancelBtn: 'Kanselahin',
    updateBtn: 'I-UPDATE',
    relistBtn: 'I-RELIST ANG GIG',
    editGigTitle: 'I-edit ang Iyong Gig Post',
    editGigSub: 'I-update ang mga detalye sa ibaba',
    relistGigTitle: 'I-relist ang Iyong Gig Post',
    relistGigSub: 'Suriin ang mga detalye ng iyong gig',
    categoryLabel: 'Kategorya',
    locationLabel: 'Lokasyon',
    searchCategoriesPlaceholder: 'Maghanap ng kategorya...',
    selectRegionModalTitle: 'Pumili ng Rehiyon',
    selectCityModalTitle: 'Pumili ng Lungsod/Bayan',
    selectOptionModalTitle: 'Pumili ng Opsyon',
    selectDateModalTitle: 'Pumili ng Petsa',
    selectHourModalTitle: 'Pumili ng Oras',
    selectPeriodModalTitle: 'Pumili ng AM/PM',
    previewModalTitle: 'Preview ng Gig',
    previewEditBtn: 'Baguhin',
    previewPostBtn: 'I-post ang Gig',
    extraLabels: {
      'Pickup at:': 'Kukunin sa:',
      'Deliver to:': 'Ihahatid sa:',
      'Load at:': 'Ikakarga sa:',
      'Unload at:': 'Ibaba sa:',
      'Shop at:': 'Mamimili sa:',
      'Location:': 'Lokasyon:',
      'Supplies:': 'Gamit/Supplies:',
      'Subject:': 'Subject/Paksa:',
      'Position:': 'Paraan ng Trabaho:',
    },
  },
};

function translateExtraLabel(rawLabel, lang) {
  return POST_UI_COPY[lang]?.extraLabels[rawLabel] || rawLabel;
}

const PRIVACY_NOTE = {
  english:
    '🔒 Privacy: Do NOT write your exact house/street address here — share it only with the worker you hire. Discuss all other instructions when interviewing Gig worker applicants.',
  bisaya:
    '🔒 Privacy: AYAW isulat ang eksaktong adres sa balay/kalsada dinhi — ihatag lang kini sa worker nga imong ma-hire. Saboti ang tanang ubang instruksyon sa pag-interview sa mga Gig worker applicants.',
  tagalog:
    '🔒 Privacy: HUWAG ilagay ang eksaktong address ng bahay/kalye dito — ibigay lang ito sa worker na ma-hire mo. Pag-usapan ang lahat ng ibang instruksyon kapag nag-interview ng mga Gig worker applicants.',
};

const TRAVEL_TIP = {
  english: '🚌 Include worker travel cost in your Gig Price.',
  bisaya: '🚌 I-apil ang pamasahe sa worker sa imong Gig Price.',
  tagalog: '🚌 Isama ang pamasahe ng worker sa iyong Gig Price.',
};

/**
 * Concise (<= 35 chars) category-specific title placeholders for all 57 categories
 * so a Plumber never sees a Cleaning example and a Lawyer never sees a Store Helper example.
 */
const CATEGORY_TITLE_EXAMPLES = {
  // Hero & Transport
  kompra: {
    english: 'e.g., Buy seafood at Taboan Market',
    bisaya: 'pananglitan: Mamalit sa Taboan',
    tagalog: 'hal., Mamili sa Taboan Market',
  },
  hatod: {
    english: 'e.g., Deliver parcel to Mandaue',
    bisaya: 'pananglitan: Ihatod sa Mandaue',
    tagalog: 'hal., Ihatid ang kahon sa Mandaue',
  },
  hakot: {
    english: 'e.g., Move sofa & boxes to Mabolo',
    bisaya: 'pananglitan: Hakot sa sofa ug box',
    tagalog: 'hal., Hakot ng sofa at mga kahon',
  },
  solicitor: {
    english: 'e.g., Distribute flyers in IT Park',
    bisaya: 'pananglitan: Flyers sa IT Park',
    tagalog: 'hal., Mamigay ng flyers sa IT Park',
  },
  driver: {
    english: 'e.g., Driver for 6-hour city trip',
    bisaya: 'pananglitan: Driver sa 6 ka oras',
    tagalog: 'hal., Driver sa 6-oras na biyahe',
  },
  pila: {
    english: 'e.g., Hold line at government desk',
    bisaya: 'pananglitan: Pila sa opisina',
    tagalog: 'hal., Pumila sa opisina o bangko',
  },
  tourguide: {
    english: 'e.g., Half-day Cebu city tour guide',
    bisaya: 'pananglitan: Tour guide sa Cebu',
    tagalog: 'hal., Half-day tour guide sa Cebu',
  },

  // Home & Personal Services (Supplies)
  limpyo: {
    english: 'e.g., 3-hour condo general cleaning',
    bisaya: 'pananglitan: 3-oras nga limpyo',
    tagalog: 'hal., 3-oras na condo cleaning',
  },
  luto: {
    english: 'e.g., Cook dinner for family of 6',
    bisaya: 'pananglitan: Magluto og panihapon',
    tagalog: 'hal., Magluto ng hapunan',
  },
  hugas: {
    english: 'e.g., Dishwashing after home party',
    bisaya: 'pananglitan: Maghugas human party',
    tagalog: 'hal., Maghugas ng pinggan sa party',
  },
  laba: {
    english: 'e.g., Handwash & fold 2 baskets',
    bisaya: 'pananglitan: Maglaba ug magpilo',
    tagalog: 'hal., Maglaba at magtiklop',
  },
  barber: {
    english: 'e.g., Home haircut for 2 adults',
    bisaya: 'pananglitan: Home service tupi',
    tagalog: 'hal., Home service na gupit',
  },
  massage: {
    english: 'e.g., 90-min home full-body massage',
    bisaya: 'pananglitan: 90-min home massage',
    tagalog: 'hal., 90-min home body massage',
  },
  petcare: {
    english: 'e.g., Walk & feed 2 dogs today',
    bisaya: 'pananglitan: Bantay ug pakaon iro',
    tagalog: 'hal., Maglakad at magpakain ng aso',
  },
  bantay: {
    english: 'e.g., Day companion for senior',
    bisaya: 'pananglitan: Bantay sa balay',
    tagalog: 'hal., Kasama at bantay sa bahay',
  },

  // Maintenance, Trades & Construction (Supplies)
  plumber: {
    english: 'e.g., Fix leaking kitchen sink pipe',
    bisaya: 'pananglitan: Ayohon ang gripo',
    tagalog: 'hal., Ayusin ang tumutulong tubo',
  },
  handyman: {
    english: 'e.g., Mount TV & fix door hinge',
    bisaya: 'pananglitan: Taod TV ug pultahan',
    tagalog: 'hal., Ikabit ang TV at pinto',
  },
  gardner: {
    english: 'e.g., Trim lawn & clear backyard',
    bisaya: 'pananglitan: Limpyo sa garden',
    tagalog: 'hal., Magtabas ng damo sa bakuran',
  },
  landscaper: {
    english: 'e.g., Front yard garden setup',
    bisaya: 'pananglitan: Pag-ayos sa garden',
    tagalog: 'hal., Pag-aayos ng garden sa harap',
  },
  electrician: {
    english: 'e.g., Replace 3 wall outlets & lamp',
    bisaya: 'pananglitan: Ilis sa saksakan',
    tagalog: 'hal., Palitan ang outlet at ilaw',
  },
  mechanic: {
    english: 'e.g., Car battery & brake checkup',
    bisaya: 'pananglitan: Checkup sa sakyanan',
    tagalog: 'hal., Checkup ng preno at baterya',
  },
  aircon: {
    english: 'e.g., Clean 2 split-type aircons',
    bisaya: 'pananglitan: Limpyo sa 2 ka aircon',
    tagalog: 'hal., Linisin ang 2 split aircon',
  },
  builder: {
    english: 'e.g., Repair concrete wall & tiles',
    bisaya: 'pananglitan: Ayohon ang pader',
    tagalog: 'hal., Ayusin ang pader at tiles',
  },
  carpenter: {
    english: 'e.g., Build wooden pantry shelves',
    bisaya: 'pananglitan: Himo og kabinet',
    tagalog: 'hal., Gumawa ng kahoy na istante',
  },
  painter: {
    english: 'e.g., Repaint bedroom walls',
    bisaya: 'pananglitan: Pintal sa kwarto',
    tagalog: 'hal., Pinturahan ang kwarto',
  },

  // Retail, Events & Media (Supplies)
  tindera: {
    english: 'e.g., Tend pop-up booth for 6 hours',
    bisaya: 'pananglitan: Bantay sa tindahan',
    tagalog: 'hal., Magbantay ng booth o tindahan',
  },
  reception: {
    english: 'e.g., Front desk guest check-in',
    bisaya: 'pananglitan: Front desk sa event',
    tagalog: 'hal., Front desk sa event',
  },
  waiter: {
    english: 'e.g., Serve food at birthday dinner',
    bisaya: 'pananglitan: Server sa birthday',
    tagalog: 'hal., Server sa birthday dinner',
  },
  security: {
    english: 'e.g., Evening event gate watch',
    bisaya: 'pananglitan: Bantay sa event gate',
    tagalog: 'hal., Bantay sa gate ng event',
  },
  chef: {
    english: 'e.g., Private chef for 10 guests',
    bisaya: 'pananglitan: Chef para sa 10 bisita',
    tagalog: 'hal., Chef para sa 10 bisita',
  },
  staff: {
    english: 'e.g., Event setup & errands helper',
    bisaya: 'pananglitan: Katabang sa event',
    tagalog: 'hal., Katulong sa pag-setup',
  },
  photographer: {
    english: 'e.g., 2-hour birthday photo shoot',
    bisaya: 'pananglitan: Photographer sa party',
    tagalog: 'hal., Photographer sa birthday',
  },
  videographer: {
    english: 'e.g., Film 3-hour store launch',
    bisaya: 'pananglitan: Videographer sa event',
    tagalog: 'hal., Videographer sa store launch',
  },
  musician: {
    english: 'e.g., Acoustic guitarist for dinner',
    bisaya: 'pananglitan: Gitarista sa event',
    tagalog: 'hal., Gitarista para sa dinner',
  },
  tailor: {
    english: 'e.g., Hem 3 pairs of slacks',
    bisaya: 'pananglitan: Tahion ug putlan',
    tagalog: 'hal., Magpabawas ng 3 pantalon',
  },

  // Tutoring & Training (Subject)
  tutor: {
    english: 'e.g., 2-hour high school Math tutor',
    bisaya: 'pananglitan: 2-oras nga Math tutor',
    tagalog: 'hal., 2-oras na Math tutor',
  },
  trainer: {
    english: 'e.g., 1-on-1 strength gym session',
    bisaya: 'pananglitan: 1-on-1 fitness coach',
    tagalog: 'hal., 1-on-1 fitness coach',
  },

  // Office, Creative & Professional (Position)
  clerical: {
    english: 'e.g., Encode receipts into Excel',
    bisaya: 'pananglitan: Encode sa mga resibo',
    tagalog: 'hal., Mag-encode ng mga resibo',
  },
  secretary: {
    english: 'e.g., Organize files & schedule',
    bisaya: 'pananglitan: Ayos sa dokumento',
    tagalog: 'hal., Ayusin ang files at schedule',
  },
  ittech: {
    english: 'e.g., Setup office Wi-Fi & printer',
    bisaya: 'pananglitan: Setup Wi-Fi ug printer',
    tagalog: 'hal., I-setup ang Wi-Fi at printer',
  },
  researcher: {
    english: 'e.g., Local supplier price survey',
    bisaya: 'pananglitan: Survey sa mga presyo',
    tagalog: 'hal., Mag-research ng suppliers',
  },
  accountant: {
    english: 'e.g., Monthly bookkeeping & BIR',
    bisaya: 'pananglitan: Bookkeeping ug BIR',
    tagalog: 'hal., Bookkeeping at BIR filing',
  },
  marketer: {
    english: 'e.g., Local promo campaign plan',
    bisaya: 'pananglitan: Plano sa marketing',
    tagalog: 'hal., Plano para sa promo campaign',
  },
  realtor: {
    english: 'e.g., Assist condo viewing today',
    bisaya: 'pananglitan: Assist condo viewing',
    tagalog: 'hal., Tulong sa condo viewing',
  },
  editor: {
    english: 'e.g., Edit 3 short social reels',
    bisaya: 'pananglitan: Edit og 3 ka reels',
    tagalog: 'hal., Mag-edit ng 3 short reels',
  },
  artist: {
    english: 'e.g., Custom wall mural sketch',
    bisaya: 'pananglitan: Dibuho o portrait',
    tagalog: 'hal., Gumuhit ng custom artwork',
  },
  performer: {
    english: 'e.g., Host / performer for party',
    bisaya: 'pananglitan: Host o performer',
    tagalog: 'hal., Host o performer sa party',
  },
  creative: {
    english: 'e.g., Design flyer & menu layout',
    bisaya: 'pananglitan: Design sa flyer/menu',
    tagalog: 'hal., Disenyo ng flyer at menu',
  },
  social: {
    english: 'e.g., Manage page & shoot content',
    bisaya: 'pananglitan: Social media content',
    tagalog: 'hal., Gawa ng social media content',
  },
  doctor: {
    english: 'e.g., Home medical checkup',
    bisaya: 'pananglitan: Konsulta sa doktor',
    tagalog: 'hal., Konsultasyon sa doktor',
  },
  nurse: {
    english: 'e.g., Home wound care & vitals',
    bisaya: 'pananglitan: Home nurse duty',
    tagalog: 'hal., Home nurse para sa pasyente',
  },
  lawyer: {
    english: 'e.g., Contract review consultation',
    bisaya: 'pananglitan: Konsulta sa abogado',
    tagalog: 'hal., Konsultasyon sa kontrata',
  },
  consultant: {
    english: 'e.g., 1-hour business consultation',
    bisaya: 'pananglitan: Business consultation',
    tagalog: 'hal., 1-oras na business consult',
  },
  therapist: {
    english: 'e.g., Home physical therapy session',
    bisaya: 'pananglitan: Physical therapy',
    tagalog: 'hal., Home physical therapy',
  },
  programmer: {
    english: 'e.g., Fix website checkout bug',
    bisaya: 'pananglitan: Ayohon ang website',
    tagalog: 'hal., Ayusin ang bug sa website',
  },
  engineer: {
    english: 'e.g., Site inspection & estimate',
    bisaya: 'pananglitan: Inpeksyon sa site',
    tagalog: 'hal., Site inspection at estimate',
  },
  architect: {
    english: 'e.g., Room renovation floor plan',
    bisaya: 'pananglitan: Plano sa renovation',
    tagalog: 'hal., Floor plan para sa renovation',
  },
};

const GROUP_TEMPLATES = {
  kompra: {
    english: {
      titlePlaceholder: 'e.g., Buy seafood at Taboan Market',
      titleTip: '💡 Name the store or market and delivery area—not your shopping list.',
      descriptionPlaceholder: `Describe all the items you want the worker to shop for.\n\nYou will approve the purchase on a live video call with the worker at the store and send payment via GCash that includes Items total + Gig price before the worker can complete the shopping and delivery to you.\n\n${PRIVACY_NOTE.english}`,
      priceGuide: {
        headline: '🛒 Gig Price = Travel Shopping & Delivery only.\nItem(s) purchase cost is separate.',
        body: 'This is how much you agree to pay the worker to travel and report to you on a live video call at the store. If you approve the purchase, you will send payment to the worker via GCash that includes Items total + Gig price, and the worker will complete the shopping and deliver to you.',
        travelTip: TRAVEL_TIP.english,
        callout:
          '💵 50% Travel Shopping rule: If the worker has already traveled to the store and started the live shopping, even if you decide to cancel the purchase, you must mark the Gig Completed and pay the worker half the Gig Price to cover their Travel service.',
      },
      gigDetailPayNote:
        'How Live Shopping works (if you are Hired):\n• Travel to the store/shop/marketplace.\n• Find the item(s) the customer wants.\n• Contact customer on Video Call via Viber or WhatsApp.\n• Customer approves item and price.\n• Customer sends you payment for total of Items + Gig Price via GCash.\n• You deliver the item(s) to the customer.\n\n⚠️ If customer does not buy once Shopping starts:\n• Customer must pay you 50% of the Gig price for travel.\n• Customer should still mark the Gig completed.',
      disclaimerRuleTitle: '🛒 Gig Price = Travel Shopping & Delivery only.\nItem(s) purchase cost is separate.',
      disclaimerRuleBody:
        'How Live Shopping works (when you Hire):\n• Worker travels to the store/shop/marketplace.\n• Worker finds the item(s) you want.\n• Worker contacts you on Video Call via Viber or WhatsApp.\n• You approve the item(s) and price.\n• You send payment to the worker for total of Items + Gig Price via GCash.\n• Worker delivers the item(s) to you.\n\n⚠️ If you do not buy once Live Shopping starts:\n• You must pay the worker 50% of the Gig price for travel.\n• You must still mark the Gig completed.\n• If payment is not sent, the worker can resign from the Gig and report non-payment.',
      workerDisclaimerRuleTitle: '🛒 Gig Price = Travel Shopping & Delivery only.\nItem(s) purchase cost is separate.',
      workerDisclaimerRuleBody:
        'How Live Shopping works (if you are Hired):\n• Travel to the store/shop/marketplace.\n• Find the item(s) the customer wants.\n• Contact customer on Video Call via Viber or WhatsApp.\n• Customer approves item and price.\n• Customer sends you payment for total of Items + Gig Price via GCash.\n• You deliver the item(s) to the customer.\n\n⚠️ If customer does not buy once Shopping starts:\n• Customer must pay you 50% of the Gig price for travel.\n• Customer should still mark the Gig completed.\n• If Customer refuses to pay, you can resign from Gig and report non-payment.',
    },
    bisaya: {
      titlePlaceholder: 'pananglitan: Mamalit sa Taboan',
      titleTip: '💡 Isulat ang tindahan o merkado—ayaw ang listahan sa palitonon.',
      descriptionPlaceholder: `Ilista o ipasabot ang tanang items nga gusto nimong ipapalit sa worker.\n\nImong aprubahan ang palitonon pinaagi sa live video call uban sa worker didto sa tindahan ug ipadala ang bayad sa GCash nga naglakip sa Items total + Gig price sa dili pa tiwason sa worker ang pagpamalit ug paghatod kanimo.\n\n${PRIVACY_NOTE.bisaya}`,
      priceGuide: {
        headline: '🛒 Gig Price = Biyahe, Kompra ug Hatod ra.\nBayad sa palitonon lahi.',
        body: 'Mao kini ang imong ibayad sa worker sa pag-adto ug pag-report kanimo sa live video call sa tindahan. Kung aprubahan nimo ang palitonon, ipadala nimo sa GCash ang Items total + Gig price, ug tiwason sa worker ang pagpamalit ug ihatod kanimo.',
        travelTip: TRAVEL_TIP.bisaya,
        callout:
          '💵 50% Travel Shopping rule: Kung nakaabot na ang worker sa tindahan ug nagsugod na ang live shopping, bisan kung mopili ka nga i-cancel ang pagpalit, kinahanglan nimong i-mark ang Gig nga Completed ug bayran ang worker og katunga (50%) sa Gig Price para sa iyang pagbiyahe.',
      },
      gigDetailPayNote:
        'Unsaon paglihok sa Live Shopping (kung ma-Hire ka):\n• Adto sa tindahan/shop/merkado.\n• Pangitaa ang item(s) nga gusto sa customer.\n• Kontaka ang customer sa Video Call pinaagi sa Viber o WhatsApp.\n• Aprubahan sa customer ang item ug presyo.\n• Ipadala sa customer ang bayad para sa total sa Items + Gig Price pinaagi sa GCash.\n• Imong ihatod ang item(s) ngadto sa customer.\n\n⚠️ Kung dili mopalit human magsugod ang Kompra:\n• Kinahanglan bayran ka sa customer og 50% sa Gig price para sa biyahe.\n• Kinahanglan gihapon i-mark sa customer ang Gig nga completed.',
      disclaimerRuleTitle: '🛒 Gig Price = Biyahe, Kompra ug Hatod ra.\nBayad sa palitonon lahi.',
      disclaimerRuleBody:
        'Unsaon paglihok sa Live Shopping (kung mo-Hire ka):\n• Moadto ang worker sa tindahan/shop/merkado.\n• Pangitaon sa worker ang item(s) nga imong gusto.\n• Kontakon ka sa worker sa Video Call pinaagi sa Viber o WhatsApp.\n• Imong aprubahan ang item(s) ug presyo.\n• Ipadala nimo sa worker ang bayad para sa total sa Items + Gig Price pinaagi sa GCash.\n• Ihatod sa worker ang item(s) kanimo.\n\n⚠️ Kung dili ka mopalit human magsugod ang Kompra:\n• Kinahanglan bayran nimo ang worker og 50% sa Gig price para sa biyahe.\n• Kinahanglan gihapon nimong i-mark ang Gig nga completed.\n• Kung dili ipadala ang bayad, pwede mo-resign ang worker sa Gig ug i-report ang dili pagbayad.',
      workerDisclaimerRuleTitle: '🛒 Gig Price = Biyahe, Kompra ug Hatod ra.\nBayad sa palitonon lahi.',
      workerDisclaimerRuleBody:
        'Unsaon paglihok sa Live Shopping (kung ma-Hire ka):\n• Adto sa tindahan/shop/merkado.\n• Pangitaa ang item(s) nga gusto sa customer.\n• Kontaka ang customer sa Video Call pinaagi sa Viber o WhatsApp.\n• Aprubahan sa customer ang item ug presyo.\n• Ipadala sa customer ang bayad para sa total sa Items + Gig Price pinaagi sa GCash.\n• Imong ihatod ang item(s) ngadto sa customer.\n\n⚠️ Kung dili mopalit human magsugod ang Kompra:\n• Kinahanglan bayran ka sa customer og 50% sa Gig price para sa biyahe.\n• Kinahanglan gihapon i-mark sa customer ang Gig nga completed.\n• Kung magdumili sa pagbayad ang Customer, pwede ka mo-resign sa Gig ug i-report ang dili pagbayad.',
    },
    tagalog: {
      titlePlaceholder: 'hal., Mamili sa Taboan Market',
      titleTip: '💡 Ilagay ang tindahan o palengke—huwag ang listahan ng bibilhin.',
      descriptionPlaceholder: `Ilarawan ang lahat ng items na gusto mong ipabili sa worker.\n\nAaprubahan mo ang bibilhin sa live video call kasama ang worker sa tindahan at ipapadala ang bayad sa GCash na kasama ang Items total + Gig price bago tapusin ng worker ang pamimili at paghahatid sa iyo.\n\n${PRIVACY_NOTE.tagalog}`,
      priceGuide: {
        headline: '🛒 Gig Price = Biyahe, Pamimili at Hatid lang.\nHiwalay ang bayad sa items.',
        body: 'Ito ang halagang ibabayad mo sa worker sa pagpunta at pag-report sa iyo sa live video call sa tindahan. Kapag inaprubahan mo ang bibilhin, ipapadala mo sa GCash ang Items total + Gig price, at tatapusin ng worker ang pamimili at ihahatid sa iyo.',
        travelTip: TRAVEL_TIP.tagalog,
        callout:
          '💵 50% Travel Shopping rule: Kapag nakarating na ang worker sa tindahan at nagsimula na ang live shopping, kahit magpasya kang i-cancel ang pagbili, kailangan mong i-mark ang Gig bilang Completed at bayaran ang worker ng kalahati (50%) ng Gig Price para sa kanyang biyahe.',
      },
      gigDetailPayNote:
        'Paano gumagana ang Live Shopping (kapag Hired ka):\n• Pumunta sa tindahan/shop/palengke.\n• Hanapin ang item(s) na gusto ng customer.\n• Kontakin ang customer sa Video Call via Viber o WhatsApp.\n• Aaprubahan ng customer ang item at presyo.\n• Ipapadala sa iyo ng customer ang bayad para sa total ng Items + Gig Price via GCash.\n• Ihahatid mo ang item(s) sa customer.\n\n⚠️ Kung hindi bumili pagkasimula ng Shopping:\n• Dapat bayaran ka ng customer ng 50% ng Gig price para sa biyahe.\n• Dapat pa ring i-mark ng customer ang Gig bilang completed.',
      disclaimerRuleTitle: '🛒 Gig Price = Biyahe, Pamimili at Hatid lang.\nHiwalay ang bayad sa items.',
      disclaimerRuleBody:
        'Paano gumagana ang Live Shopping (kapag nag-Hire ka):\n• Pupunta ang worker sa tindahan/shop/palengke.\n• Hahanapin ng worker ang item(s) na gusto mo.\n• Kokontakin ka ng worker sa Video Call via Viber o WhatsApp.\n• Aaprubahan mo ang item(s) at presyo.\n• Ipapadala mo sa worker ang bayad para sa total ng Items + Gig Price via GCash.\n• Ihahatid ng worker ang item(s) sa iyo.\n\n⚠️ Kung hindi ka bumili pagkasimula ng Shopping:\n• Dapat mong bayaran ang worker ng 50% ng Gig price para sa biyahe.\n• Dapat mo pa ring i-mark ang Gig bilang completed.\n• Kapag hindi ipinadala ang bayad, maaaring mag-resign ang worker sa Gig at i-report ang hindi pagbabayad.',
      workerDisclaimerRuleTitle: '🛒 Gig Price = Biyahe, Pamimili at Hatid lang.\nHiwalay ang bayad sa items.',
      workerDisclaimerRuleBody:
        'Paano gumagana ang Live Shopping (kapag Hired ka):\n• Pumunta sa tindahan/shop/palengke.\n• Hanapin ang item(s) na gusto ng customer.\n• Kontakin ang customer sa Video Call via Viber o WhatsApp.\n• Aaprubahan ng customer ang item at presyo.\n• Ipapadala sa iyo ng customer ang bayad para sa total ng Items + Gig Price via GCash.\n• Ihahatid mo ang item(s) sa customer.\n\n⚠️ Kung hindi bumili pagkasimula ng Shopping:\n• Dapat bayaran ka ng customer ng 50% ng Gig price para sa biyahe.\n• Dapat pa ring i-mark ng customer ang Gig bilang completed.\n• Kapag tumangging magbayad ang Customer, maaari kang mag-resign sa Gig at i-report ang hindi pagbabayad.',
    },
  },
  hatod: {
    english: {
      titlePlaceholder: 'e.g., Deliver parcel to Mandaue',
      titleTip: '💡 State what is being delivered and the general pickup-to-dropoff area.',
      descriptionPlaceholder: `Describe the item size, weight, required vehicle (motorcycle, car, van), and any handling instructions.\n\n${PRIVACY_NOTE.english}`,
      priceGuide: {
        headline: '📦 Gig Price = Pickup & Delivery services only.',
        body: 'The worker gets paid for picking up and delivering the item. Make sure to include parking or toll costs (if any) in your Gig Price.',
        travelTip: TRAVEL_TIP.english,
      },
      gigDetailPayNote:
        'How this Gig works (if you are Hired):\n• Contact customer at the Pickup location.\n• Verify item(s) before transporting.\n• Send photo/video of item(s) at delivery location.\n• Customer pays you the Gig Price via GCash.\n• Customer marks gig completed.',
      disclaimerRuleTitle: '📦 Gig Price = Pickup & Delivery services only.',
      disclaimerRuleBody:
        'The worker gets paid for the pickup and delivery service described. Confirm any extra toll or parking costs with the worker before starting.',
      workerDisclaimerRuleTitle: '📦 Gig Price = Pickup & Delivery services only.',
      workerDisclaimerRuleBody:
        'You get paid for the pickup and delivery service described. Confirm any extra toll or parking costs with the customer before starting.',
    },
    bisaya: {
      titlePlaceholder: 'pananglitan: Ihatod sa Mandaue',
      titleTip: '💡 Isulti unsay ihatod ug ang dapit gikan sa pagkuha padulong hatdan.',
      descriptionPlaceholder: `Ipasabot ang gidak-on ug gibug-aton sa ipahatod, unsang sakyanan ang kinahanglan (motor, awto, van), ug pag-amping sa item.\n\n${PRIVACY_NOTE.bisaya}`,
      priceGuide: {
        headline: '📦 Gig Price = Serbisyo sa Pagkuha ug Paghatod ra.',
        body: 'Ang worker bayran sa pagkuha ug paghatod sa item. Siguroha nga apil na sa imong Gig Price ang gasto sa parking o toll (kung naa).',
        travelTip: TRAVEL_TIP.bisaya,
      },
      gigDetailPayNote:
        'Ang worker bayran sa pagkuha ug paghatod sa item sumala sa nakasulat.',
      disclaimerRuleTitle: '📦 Gig Price = Serbisyo sa Pagkuha ug Paghatod ra.',
      disclaimerRuleBody:
        'Ang worker bayran sa serbisyo sa pagkuha ug paghatod nga gihulagway. Kumpirmaha daan sa worker kung naay dugang gasto sa parking o toll sa dili pa magsugod.',
      workerDisclaimerRuleTitle: '📦 Gig Price = Serbisyo sa Pagkuha ug Paghatod ra.',
      workerDisclaimerRuleBody:
        'Bayran ka sa serbisyo sa pagkuha ug paghatod nga gihulagway. Kumpirmaha daan sa customer kung naay dugang gasto sa parking o toll sa dili pa magsugod.',
    },
    tagalog: {
      titlePlaceholder: 'hal., Ihatid ang kahon sa Mandaue',
      titleTip: '💡 Banggitin kung ano ang ihahatid at ang lugar ng pickup at dropoff.',
      descriptionPlaceholder: `Ilarawan ang laki at bigat ng ipapahatid, anong sasakyan ang kailangan (motor, kotse, van), at tamang pag-iingat.\n\n${PRIVACY_NOTE.tagalog}`,
      priceGuide: {
        headline: '📦 Gig Price = Serbisyo sa Pickup at Hatid lang.',
        body: 'Ang worker ay babayaran sa pagkuha at paghahatid ng item. Siguraduhing kasama na sa iyong Gig Price ang gastos sa parking o toll (kung meron).',
        travelTip: TRAVEL_TIP.tagalog,
      },
      gigDetailPayNote:
        'Ang worker ay babayaran sa pagkuha at paghahatid ng item ayon sa nakasaad.',
      disclaimerRuleTitle: '📦 Gig Price = Serbisyo sa Pickup at Hatid lang.',
      disclaimerRuleBody:
        'Ang worker ay babayaran sa serbisyo ng pickup at delivery na nakasaad. Kumpirmahin muna sa worker kung may dagdag na gastos sa parking o toll bago magsimula.',
      workerDisclaimerRuleTitle: '📦 Gig Price = Serbisyo sa Pickup at Hatid lang.',
      workerDisclaimerRuleBody:
        'Babayaran ka sa serbisyo ng pickup at delivery na nakasaad. Kumpirmahin muna sa customer kung may dagdag na gastos sa parking o toll bago magsimula.',
    },
  },
  hakot: {
    english: {
      titlePlaceholder: 'e.g., Move sofa & boxes to Mabolo',
      titleTip: '💡 Mention the main items to move and the general route.',
      descriptionPlaceholder: `Describe the furniture/boxes to haul, floor levels (stairs or elevator), whether a truck/van or extra helper is needed, and loading conditions.\n\n${PRIVACY_NOTE.english}`,
      priceGuide: {
        headline: '🚚 Gig Price = Loading, Hauling & Unloading only.',
        body: 'The worker gets paid for loading, transporting, and unloading the items.',
        travelTip: TRAVEL_TIP.english,
      },
      gigDetailPayNote:
        'How this Gig works (if you are Hired):\n• Arrive at the Load location.\n• Load items for transport.\n• Travel to Unload location and unload.\n• Take photos/videos of delivery.\n• Customer pays you Gig Price via GCash.\n• Customer marks the Gig completed.',
      disclaimerRuleTitle: '🚚 Gig Price = Loading, Hauling & Unloading only.',
      disclaimerRuleBody:
        'The worker gets paid for loading, hauling, and unloading as described in the gig post. Confirm stairs, heavy items, and vehicle requirements with the worker before starting work.',
      workerDisclaimerRuleTitle: '🚚 Gig Price = Loading, Hauling & Unloading only.',
      workerDisclaimerRuleBody:
        'You get paid for loading, hauling, and unloading as described in the gig post. Confirm stairs, heavy items, and vehicle requirements with the customer before starting work.',
    },
    bisaya: {
      titlePlaceholder: 'pananglitan: Hakot sa sofa ug box',
      titleTip: '💡 Isulti ang dagkong gamit nga hakoton ug ang dapit.',
      descriptionPlaceholder: `Ipasabot ang mga gamit nga hakoton, kung naay hagdan o elevator, kinahanglan ba og multicab/truck o dugang katabang.\n\n${PRIVACY_NOTE.bisaya}`,
      priceGuide: {
        headline: '🚚 Gig Price = Serbisyo sa Karga ug Paghakot ra.',
        body: 'Ang worker bayran sa pagkarga, pagbiyahe, ug pagdiskarga sa mga gamit.',
        travelTip: TRAVEL_TIP.bisaya,
      },
      gigDetailPayNote:
        'Ang worker bayran sa pagkarga, paghakot, ug pagdiskarga sa mga gamit sumala sa nakasulat.',
      disclaimerRuleTitle: '🚚 Gig Price = Serbisyo sa Karga ug Paghakot ra.',
      disclaimerRuleBody:
        'Ang worker bayran sa pagkarga, paghakot, ug pagdiskarga sumala sa gig post. Kumpirmaha daan sa worker ang hagdan, gibug-aton sa gamit, ug sakyanan sa dili pa magsugod.',
      workerDisclaimerRuleTitle: '🚚 Gig Price = Serbisyo sa Karga ug Paghakot ra.',
      workerDisclaimerRuleBody:
        'Bayran ka sa pagkarga, paghakot, ug pagdiskarga sumala sa gig post. Kumpirmaha daan sa customer ang hagdan, gibug-aton sa gamit, ug sakyanan sa dili pa magsugod.',
    },
    tagalog: {
      titlePlaceholder: 'hal., Hakot ng sofa at mga kahon',
      titleTip: '💡 Banggitin ang mga gamit na hahakutin at ang lugar.',
      descriptionPlaceholder: `Ilarawan ang mga gamit na hahakutin, kung may hagdan o elevator, at kung kailangan ng truck/van o dagdag na katulong.\n\n${PRIVACY_NOTE.tagalog}`,
      priceGuide: {
        headline: '🚚 Gig Price = Serbisyo sa Karga at Paghakot lang.',
        body: 'Ang worker ay babayaran sa pagkarga, pagbiyahe, at pagbaba ng mga gamit.',
        travelTip: TRAVEL_TIP.tagalog,
      },
      gigDetailPayNote:
        'Ang worker ay babayaran sa pagkarga, paghakot, at pagbaba ng mga gamit na nakasaad.',
      disclaimerRuleTitle: '🚚 Gig Price = Serbisyo sa Karga at Paghakot lang.',
      disclaimerRuleBody:
        'Ang worker ay babayaran sa pagkarga, paghakot, at pagbaba ng gamit ayon sa gig post. Kumpirmahin muna sa worker ang hagdan, bigat ng gamit, at sasakyan bago magsimula.',
      workerDisclaimerRuleTitle: '🚚 Gig Price = Serbisyo sa Karga at Paghakot lang.',
      workerDisclaimerRuleBody:
        'Babayaran ka sa pagkarga, paghakot, at pagbaba ng gamit ayon sa gig post. Kumpirmahin muna sa customer ang hagdan, bigat ng gamit, at sasakyan bago magsimula.',
    },
  },
  solicitor: {
    english: {
      titlePlaceholder: 'e.g., Distribute flyers in IT Park',
      titleTip: '💡 Name the target district or business area and the outreach task.',
      descriptionPlaceholder: `Describe the outreach goal (flyer distribution, business mapping, or store introductions), target count/hours, and any photo or location proof required.\n\n${PRIVACY_NOTE.english}`,
      priceGuide: {
        headline: '📣 Gig Price = Field Surveys and Marketing only.',
        body: 'The worker gets paid for completing the assigned route or stop quota. Any printed flyers or sample materials are provided by the customer.',
        travelTip: TRAVEL_TIP.english,
      },
      gigDetailPayNote:
        'How this Gig works (if you are Hired):\n• Pickup from customer if marketing materials are provided.\n• Travel to targeted location area.\n• Perform Survey or Sales instructions.\n• Report to customer when outreach is complete.\n• Customer sends payment via GCash.\n• Customer marks gig completed.',
      disclaimerRuleTitle: '📣 Gig Price = Field Surveys and Marketing only.',
      disclaimerRuleBody:
        'The worker gets paid for completing the outreach route, mapping, or introductions described. Any printed flyers or sample materials are provided by you (the customer).',
      workerDisclaimerRuleTitle: '📣 Gig Price = Field Surveys and Marketing only.',
      workerDisclaimerRuleBody:
        'You get paid for completing the outreach route, mapping, or introductions described. Any printed flyers or sample materials are provided by the customer.',
    },
    bisaya: {
      titlePlaceholder: 'pananglitan: Flyers sa IT Park',
      titleTip: '💡 Isulti ang target nga dapit ug ang klase sa field work.',
      descriptionPlaceholder: `Ipasabot ang buluhaton (pagpanghatag og flyers, business mapping, o pagpaila sa tindahan), pila ka lugar ang adtoon, ug litrato nga ebidensya.\n\n${PRIVACY_NOTE.bisaya}`,
      priceGuide: {
        headline: '📣 Gig Price = Field Surveys ug Marketing ra.',
        body: 'Ang worker bayran sa paghuman sa ruta o quota nga gisabotan. Ang mga flyers o materyales ihatag sa customer.',
        travelTip: TRAVEL_TIP.bisaya,
      },
      gigDetailPayNote:
        'Ang worker bayran sa paghuman sa field outreach o ruta nga gisabotan. Ang flyers o materyales gikan sa customer.',
      disclaimerRuleTitle: '📣 Gig Price = Field Surveys ug Marketing ra.',
      disclaimerRuleBody:
        'Ang worker bayran sa paghuman sa field outreach, mapping, o pagpaila nga gisabotan. Ang mga flyers o sample nga materyales ihatag nimo (ang customer).',
      workerDisclaimerRuleTitle: '📣 Gig Price = Field Surveys ug Marketing ra.',
      workerDisclaimerRuleBody:
        'Bayran ka sa paghuman sa field outreach, mapping, o pagpaila nga gisabotan. Ang mga flyers o sample nga materyales ihatag sa customer.',
    },
    tagalog: {
      titlePlaceholder: 'hal., Mamigay ng flyers sa IT Park',
      titleTip: '💡 Ilagay ang target na lugar at ang uri ng field work.',
      descriptionPlaceholder: `Ipaliwanag ang gawain (pamimigay ng flyers, business mapping, o pagpapakilala sa tindahan), bilang ng pupuntahan, at kailangang larawan.\n\n${PRIVACY_NOTE.tagalog}`,
      priceGuide: {
        headline: '📣 Gig Price = Field Surveys at Marketing lang.',
        body: 'Ang worker ay babayaran sa pagtapos ng ruta o quota. Ang mga flyers o materyales ay sagot ng customer.',
        travelTip: TRAVEL_TIP.tagalog,
      },
      gigDetailPayNote:
        'Ang worker ay babayaran sa pagtapos ng field outreach o ruta na napagkasunduan. Ang mga flyers o materyales ay mula sa customer.',
      disclaimerRuleTitle: '📣 Gig Price = Field Surveys at Marketing lang.',
      disclaimerRuleBody:
        'Ang worker ay babayaran sa pagtapos ng field outreach, mapping, o pagpapakilala na nakasaad. Ang anumang flyers o sample materials ay ibibigay mo (ang customer).',
      workerDisclaimerRuleTitle: '📣 Gig Price = Field Surveys at Marketing lang.',
      workerDisclaimerRuleBody:
        'Babayaran ka sa pagtapos ng field outreach, mapping, o pagpapakilala na nakasaad. Ang anumang flyers o sample materials ay ibibigay ng customer.',
    },
  },
  supplies_service: {
    english: {
      titlePlaceholder: 'e.g., 3-hour condo general cleaning',
      titleTip: '💡 Summarize the service needed and approximate size or duration.',
      descriptionPlaceholder: `Describe the scope of work, rooms/areas or items involved, and what tools or supplies the worker should bring (matching your Supplies Provided/Required selection).\n\n${PRIVACY_NOTE.english}`,
      priceGuide: {
        headline: '🛠️ Gig Price = Labor & Service only.',
        body: 'The worker gets paid for the work itself. If replacement parts, ingredients, or consumable supplies must be bought, pay those item costs separately.',
        travelTip: TRAVEL_TIP.english,
      },
      gigDetailPayNote:
        'How this Gig works (if you are Hired):\n• Check above if Supplies are PROVIDED or REQUIRED.\n• Never buy supplies for the customer with your money.\n• Travel to location to be serviced.\n• Complete the service per instructions.\n• Send photo/video of your work to customer.\n• Customer sends payment via GCash.\n• Customer marks gig completed.',
      disclaimerRuleTitle: '🛠️ Gig Price = Labor & Service only.',
      disclaimerRuleBody:
        'The worker gets paid for their labor and service. Confirm whether tools/supplies are provided by you or by the worker. Never ask the worker to purchase materials or parts.',
      workerDisclaimerRuleTitle: '🛠️ Gig Price = Labor & Service only.',
      workerDisclaimerRuleBody:
        'You get paid for your labor and service. Confirm whether tools/supplies are provided by the customer or brought by you. Never front your own money to purchase materials or parts for the customer.',
    },
    bisaya: {
      titlePlaceholder: 'pananglitan: 3-oras nga limpyo',
      titleTip: '💡 Isulti ang serbisyo nga kinahanglan ug gibana-bana nga oras.',
      descriptionPlaceholder: `Ipasabot ang buhaton nga trabaho, gidak-on sa lugar o gamit, ug kung unsang gamit/supplies ang dad-on sa worker.\n\n${PRIVACY_NOTE.bisaya}`,
      priceGuide: {
        headline: '🛠️ Gig Price = Serbisyo ug Trabaho ra.',
        body: 'Ang worker bayran para sa iyang trabaho. Kung naay palitonon nga piyesa, sangkap, o materyales, bayri kini og lahi.',
        travelTip: TRAVEL_TIP.bisaya,
      },
      gigDetailPayNote:
        'Ang worker bayran para sa iyang trabaho ug serbisyo. Tan-awa ang Supplies sa ibabaw kung PROVIDED ba sa customer o REQUIRED dad-on sa worker.',
      disclaimerRuleTitle: '🛠️ Gig Price = Serbisyo ug Trabaho ra.',
      disclaimerRuleBody:
        'Ang worker bayran para sa iyang trabaho ug serbisyo. Kumpirmaha kung ang gamit/supplies gikan ba nimo o sa worker. Ayaw sugoa ang worker nga mopalit o mag-abono og materyales o piyesa.',
      workerDisclaimerRuleTitle: '🛠️ Gig Price = Serbisyo ug Trabaho ra.',
      workerDisclaimerRuleBody:
        'Bayran ka para sa imong trabaho ug serbisyo. Kumpirmaha kung ang gamit/supplies gikan ba sa customer o imong dad-on. Ayaw pag-abono og kaugalingong kwarta aron ipalit og materyales o piyesa.',
    },
    tagalog: {
      titlePlaceholder: 'hal., 3-oras na condo cleaning',
      titleTip: '💡 Banggitin ang serbisyong kailangan at tinatayang oras o laki.',
      descriptionPlaceholder: `Ipaliwanag ang lawak ng trabaho, mga bahagi o gamit na gagawin, at kung anong tools o supplies ang dadalhin ng worker.\n\n${PRIVACY_NOTE.tagalog}`,
      priceGuide: {
        headline: '🛠️ Gig Price = Labor at Serbisyo lang.',
        body: 'Ang worker ay babayaran para sa kanyang trabaho. Kung may bibilhing piyesa, sangkap, o materyales, bayaran ang item cost nang hiwalay.',
        travelTip: TRAVEL_TIP.tagalog,
      },
      gigDetailPayNote:
        'Ang worker ay babayaran para sa kanyang labor at serbisyo. Tingnan ang Supplies field sa itaas kung PROVIDED ng customer o REQUIRED dalhin ng worker.',
      disclaimerRuleTitle: '🛠️ Gig Price = Labor at Serbisyo lang.',
      disclaimerRuleBody:
        'Ang worker ay babayaran para sa kanyang labor at serbisyo. Kumpirmahin kung ang gamit/supplies ay mula sa iyo o sa worker. Huwag utusan ang worker na bumili o mag-abono ng materyales o piyesa.',
      workerDisclaimerRuleTitle: '🛠️ Gig Price = Labor at Serbisyo lang.',
      workerDisclaimerRuleBody:
        'Babayaran ka para sa iyong labor at serbisyo. Kumpirmahin kung ang gamit/supplies ay mula sa customer o dadalhin mo. Huwag mag-abono ng sariling pera para bumili ng materyales o piyesa.',
    },
  },
  position_service: {
    english: {
      titlePlaceholder: 'e.g., Half-day store inventory',
      titleTip: '💡 State the role or consultation needed and approximate duration.',
      descriptionPlaceholder: `Describe the tasks, deliverables, or consultation topics, whether the work is In-Person or Virtual, and any equipment or qualifications needed.\n\n${PRIVACY_NOTE.english}`,
      priceGuide: {
        headline: '💼 Gig Price = Role & Session services only.',
        body: 'The worker gets paid for the session, shift, or work described. Any third-party filing, printing, or official costs are paid separately by the customer.',
        travelTip: TRAVEL_TIP.english,
      },
      gigDetailPayNote:
        'How this Gig works (if you are Hired):\n• Check above if Position is IN-PERSON or VIRTUAL.\n• Travel to location if required.\n• Complete the service per instructions.\n• Send photo/video of your work to customer.\n• Customer sends payment via GCash.\n• Customer marks gig completed.',
      disclaimerRuleTitle: '💼 Gig Price = Role & Session services only.',
      disclaimerRuleBody:
        'The worker gets paid for the shift, consultation, or services described. Confirm with the worker whether the session is In-Person or Virtual and clarify expected work before starting.',
      workerDisclaimerRuleTitle: '💼 Gig Price = Role & Session services only.',
      workerDisclaimerRuleBody:
        'You get paid for the shift, consultation, or services described. Confirm with the customer whether the session is In-Person or Virtual and clarify expected work before starting.',
    },
    bisaya: {
      titlePlaceholder: 'pananglitan: Katabang sa tindahan',
      titleTip: '💡 Isulti ang trabaho o konsultasyon nga kinahanglan ug ang oras.',
      descriptionPlaceholder: `Ipasabot ang mga buluhaton o output nga gikinahanglan, In-Person ba o Virtual, ug ang qualifications nga imong gipangita.\n\n${PRIVACY_NOTE.bisaya}`,
      priceGuide: {
        headline: '💼 Gig Price = Serbisyo sa Role o Sesyon ra.',
        body: 'Ang worker bayran para sa oras, konsultasyon, o trabaho nga nasabotan. Ang ubang gasto sama sa printing o filing sagot sa customer.',
        travelTip: TRAVEL_TIP.bisaya,
      },
      gigDetailPayNote:
        'Ang worker bayran para sa shift, konsultasyon, o output nga gihulagway. Tan-awa ang Position sa ibabaw kung In-Person o Virtual.',
      disclaimerRuleTitle: '💼 Gig Price = Serbisyo sa Role o Sesyon ra.',
      disclaimerRuleBody:
        'Ang worker bayran sa shift, konsultasyon, o serbisyo nga gisabotan. Kumpirmaha sa worker kung In-Person o Virtual ug klaroha ang buhaton sa dili pa magsugod.',
      workerDisclaimerRuleTitle: '💼 Gig Price = Serbisyo sa Role o Sesyon ra.',
      workerDisclaimerRuleBody:
        'Bayran ka sa shift, konsultasyon, o serbisyo nga gisabotan. Kumpirmaha sa customer kung In-Person o Virtual ug klaroha ang buhaton sa dili pa magsugod.',
    },
    tagalog: {
      titlePlaceholder: 'hal., Katulong sa opisina',
      titleTip: '💡 Ilagay ang tungkulin o konsultasyong kailangan at ang oras.',
      descriptionPlaceholder: `Ipaliwanag ang mga gawain o output na kailangan, kung In-Person o Virtual, at ang kailangang kagamitan o karanasan.\n\n${PRIVACY_NOTE.tagalog}`,
      priceGuide: {
        headline: '💼 Gig Price = Serbisyo sa Role o Sesyon lang.',
        body: 'Ang worker ay babayaran para sa shift, konsultasyon, o trabahong napagkasunduan. Ang ibang gastusin gaya ng printing o filing ay sagot ng customer.',
        travelTip: TRAVEL_TIP.tagalog,
      },
      gigDetailPayNote:
        'Ang worker ay babayaran para sa shift, konsultasyon, o output na nakasaad. Tingnan ang Position sa itaas kung In-Person o Virtual.',
      disclaimerRuleTitle: '💼 Gig Price = Serbisyo sa Role o Sesyon lang.',
      disclaimerRuleBody:
        'Ang worker ay babayaran sa shift, konsultasyon, o serbisyong nakasaad. Kumpirmahin sa worker kung In-Person o Virtual at linawin ang inaasahang gawain bago magsimula.',
      workerDisclaimerRuleTitle: '💼 Gig Price = Serbisyo sa Role o Sesyon lang.',
      workerDisclaimerRuleBody:
        'Babayaran ka sa shift, konsultasyon, o serbisyong nakasaad. Kumpirmahin sa customer kung In-Person o Virtual at linawin ang inaasahang gawain bago magsimula.',
    },
  },
  subject_service: {
    english: {
      titlePlaceholder: 'e.g., 2-hour high school Math tutor',
      titleTip: '💡 Mention the subject or training focus and session length.',
      descriptionPlaceholder: `Describe the student/client level, specific topics or workout goals, whether the session is in-person or online, and any materials needed.\n\n${PRIVACY_NOTE.english}`,
      priceGuide: {
        headline: '📚 Gig Price = Tutoring & Coaching services only.',
        body: 'The worker gets paid for the scheduled session. Materials or venue rentals (if any) are covered separately by the customer.',
        travelTip: TRAVEL_TIP.english,
      },
      gigDetailPayNote:
        'How this Gig works (if you are Hired):\n• Check above for SUBJECT category.\n• Verify number of hours required.\n• Complete duration of session.\n• Customer sends payment via GCash.\n• Customer marks gig completed.',
      disclaimerRuleTitle: '📚 Gig Price = Tutoring & Coaching services only.',
      disclaimerRuleBody:
        'The worker gets paid for the scheduled session. Confirm the session location (or online link) and any venue/entry costs with the worker before starting.',
      workerDisclaimerRuleTitle: '📚 Gig Price = Tutoring & Coaching services only.',
      workerDisclaimerRuleBody:
        'You get paid for the scheduled session. Confirm the session location (or online link) and any venue/entry costs with the customer before starting.',
    },
    bisaya: {
      titlePlaceholder: 'pananglitan: 2-oras nga Math tutor',
      titleTip: '💡 Isulti ang subject o training ug pila ka oras ang sesyon.',
      descriptionPlaceholder: `Ipasabot ang lebel sa tudloan, ang mga topic o tumong sa training, ug kung kinahanglan ba og libro o gamit.\n\n${PRIVACY_NOTE.bisaya}`,
      priceGuide: {
        headline: '📚 Gig Price = Sesyon sa Pagtudlo o Training ra.',
        body: 'Ang worker bayran para sa sesyon. Ang mga materyales o abang sa venue (kung naa) lahi nga saguton sa customer.',
        travelTip: TRAVEL_TIP.bisaya,
      },
      gigDetailPayNote:
        'Ang worker bayran para sa sesyon nga gihulagway. Tan-awa ang Subject sa ibabaw para sa pokus sa sesyon.',
      disclaimerRuleTitle: '📚 Gig Price = Sesyon sa Pagtudlo o Training ra.',
      disclaimerRuleBody:
        'Ang worker bayran sa naka-schedule nga sesyon. Kumpirmaha sa worker ang lugar (o online link) ug bisan unsang gasto sa venue sa dili pa magsugod.',
      workerDisclaimerRuleTitle: '📚 Gig Price = Sesyon sa Pagtudlo o Training ra.',
      workerDisclaimerRuleBody:
        'Bayran ka sa naka-schedule nga sesyon. Kumpirmaha sa customer ang lugar (o online link) ug bisan unsang gasto sa venue sa dili pa magsugod.',
    },
    tagalog: {
      titlePlaceholder: 'hal., 2-oras na Math tutor',
      titleTip: '💡 Banggitin ang subject o training at haba ng sesyon.',
      descriptionPlaceholder: `Ipaliwanag ang antas ng tuturuan, mga paksa o layunin sa training, at kung may kailangang dalhing materyales.\n\n${PRIVACY_NOTE.tagalog}`,
      priceGuide: {
        headline: '📚 Gig Price = Sesyon ng Pagtuturo/Training lang.',
        body: 'Ang worker ay babayaran para sa naka-schedule na sesyon. Ang materyales o bayad sa venue (kung meron) ay hiwalay na sasagutin ng customer.',
        travelTip: TRAVEL_TIP.tagalog,
      },
      gigDetailPayNote:
        'Ang worker ay babayaran para sa sesyon na nakasaad. Tingnan ang Subject field sa itaas para sa pokus ng sesyon.',
      disclaimerRuleTitle: '📚 Gig Price = Sesyon ng Pagtuturo/Training lang.',
      disclaimerRuleBody:
        'Ang worker ay babayaran sa naka-schedule na sesyon. Kumpirmahin sa worker ang lugar (o online link) at anumang gastos sa venue bago magsimula.',
      workerDisclaimerRuleTitle: '📚 Gig Price = Sesyon ng Pagtuturo/Training lang.',
      workerDisclaimerRuleBody:
        'Babayaran ka sa naka-schedule na sesyon. Kumpirmahin sa customer ang lugar (o online link) at anumang gastos sa venue bago magsimula.',
    },
  },
  driver: {
    english: {
      titlePlaceholder: 'e.g., Driver for 6-hour city trip',
      titleTip: '💡 State the driving route/schedule and whether a vehicle is provided.',
      descriptionPlaceholder: `Specify whether the worker is driving your vehicle or bringing their own, transmission type (automatic/manual), route details, and how fuel/tolls/parking costs are handled.\n\n${PRIVACY_NOTE.english}`,
      priceGuide: {
        headline: '🚗 Gig Price = Driving services only.',
        body: 'The worker gets paid for driving during the scheduled trip or hours. State in your description whether fuel, toll, and parking costs are included in Gig Price or paid separately by the customer.',
        travelTip: TRAVEL_TIP.english,
      },
      gigDetailPayNote:
        'How this Gig works (if you are Hired):\n• Travel to customer Pickup location.\n• Verify to customer a valid driver’s license.\n• If driving your own car:\n  ◦ Show customer your car registration & insurance.\n• If driving the customer’s car:\n  ◦ Verify customer’s registration & insurance.\n• Complete the scheduled driving trip.\n• Customer sends payment via GCash.\n• Customer marks gig completed.',
      disclaimerRuleTitle: '🚗 Gig Price = Driving services only.',
      disclaimerRuleBody:
        'The worker gets paid for the driving service described. Verify a valid driver’s license and confirm fuel, toll, and parking cost arrangements with the worker before starting the trip.',
      workerDisclaimerRuleTitle: '🚗 Gig Price = Driving services only.',
      workerDisclaimerRuleBody:
        'You get paid for the driving service described. Bring a valid driver’s license and confirm fuel, toll, and parking cost arrangements with the customer before starting the trip.',
    },
    bisaya: {
      titlePlaceholder: 'pananglitan: Driver sa 6 ka oras',
      titleTip: '💡 Isulti ang rota ug kung imoha ba ang sakyanan o sa driver.',
      descriptionPlaceholder: `Ipasabot kung sakyanan ba nimo ang dad-on o sa driver, automatic o manual, ang rota, ug kinsa ang mobayad sa krudo, parking, ug toll.\n\n${PRIVACY_NOTE.bisaya}`,
      priceGuide: {
        headline: '🚗 Gig Price = Serbisyo sa Pag-drive ra.',
        body: 'Ang worker bayran sa pag-drive sa nasabotan nga biyahe o oras. Ibutang sa deskripsyon kung ang gasto sa krudo, toll, ug parking apil na ba sa Gig Price o lahi nga bayran sa customer.',
        travelTip: TRAVEL_TIP.bisaya,
      },
      gigDetailPayNote:
        'Ang worker bayran sa pag-drive sa nasabotan nga oras o biyahe.',
      disclaimerRuleTitle: '🚗 Gig Price = Serbisyo sa Pag-drive ra.',
      disclaimerRuleBody:
        'Ang worker bayran sa serbisyo sa pag-drive. Tan-awa ang lisensya sa driver ug saboti daan ang gasto sa krudo, toll, ug parking sa dili pa mobiyahe.',
      workerDisclaimerRuleTitle: '🚗 Gig Price = Serbisyo sa Pag-drive ra.',
      workerDisclaimerRuleBody:
        'Bayran ka sa serbisyo sa pag-drive. Pagdala og balido nga driver’s license ug kumpirmaha sa customer ang gasto sa krudo, toll, ug parking sa dili pa mobiyahe.',
    },
    tagalog: {
      titlePlaceholder: 'hal., Driver sa 6-oras na biyahe',
      titleTip: '💡 Banggitin ang ruta at kung sasakyan mo o ng driver ang gagamitin.',
      descriptionPlaceholder: `Ilagay kung sasakyan mo o ng driver ang gagamitin, automatic o manual, ruta ng biyahe, at paano ang bayad sa gas, toll, at parking.\n\n${PRIVACY_NOTE.tagalog}`,
      priceGuide: {
        headline: '🚗 Gig Price = Serbisyo sa Pagmamaneho lang.',
        body: 'Ang worker ay babayaran sa serbisyo ng pagmamaneho. Ilagay sa deskripsyon kung ang gastos sa gas, toll, at parking ay kasama na sa Gig Price o hiwalay na babayaran ng customer.',
        travelTip: TRAVEL_TIP.tagalog,
      },
      gigDetailPayNote:
        'Ang worker ay babayaran sa serbisyo ng pagmamaneho sa napagkasunduang biyahe o oras.',
      disclaimerRuleTitle: '🚗 Gig Price = Serbisyo sa Pagmamaneho lang.',
      disclaimerRuleBody:
        'Ang worker ay babayaran sa serbisyo ng pagmamaneho. Suriin ang lisensya ng driver at kumpirmahin ang usapan sa gastos sa gas, toll, at parking bago bumiyahe.',
      workerDisclaimerRuleTitle: '🚗 Gig Price = Serbisyo sa Pagmamaneho lang.',
      workerDisclaimerRuleBody:
        'Babayaran ka sa serbisyo ng pagmamaneho. Magdala ng valid driver’s license at kumpirmahin sa customer ang usapan sa gastos sa gas, toll, at parking bago bumiyahe.',
    },
  },
};

function resolveGroupKey(categoryId) {
  const id = String(categoryId || '').trim().toLowerCase();
  if (id === 'kompra') return 'kompra';
  if (id === 'hatod') return 'hatod';
  if (id === 'hakot') return 'hakot';
  if (id === 'solicitor') return 'solicitor';
  if (id === 'driver') return 'driver';
  const ext = POST_EXTRAS[id];
  if (ext?.field2.menuType === 'subject') return 'subject_service';
  if (ext?.field2.menuType === 'position') return 'position_service';
  return 'supplies_service';
}

const CATEGORY_GUIDES = Object.keys(POST_EXTRAS).reduce(
  (acc, categoryId) => {
    const groupKey = resolveGroupKey(categoryId);
    const base = GROUP_TEMPLATES[groupKey];
    const specificTitle = CATEGORY_TITLE_EXAMPLES[categoryId];
    acc[categoryId] = specificTitle
      ? {
          english: { ...base.english, titlePlaceholder: specificTitle.english },
          bisaya: { ...base.bisaya, titlePlaceholder: specificTitle.bisaya },
          tagalog: { ...base.tagalog, titlePlaceholder: specificTitle.tagalog },
        }
      : base;
    return acc;
  },
  {}
);

function getCategoryGuide(categoryId, lang = 'english') {
  const safeLang = lang === 'bisaya' || lang === 'tagalog' ? lang : 'english';
  const key = String(categoryId || '').trim().toLowerCase();
  const entry = CATEGORY_GUIDES[key] || GROUP_TEMPLATES.supplies_service;
  return entry[safeLang] || entry.english;
}



function escapeGuideHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStructuredGuideHtml(text, options) {
  const opts = options || {};
  const isPayNote = !!opts.isPayNote;
  const lines = String(text || '').split('\n');
  let html = '';
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) {
      html += '<div style="height:6px;"></div>';
      continue;
    }
    if (trimmed.startsWith('◦')) {
      const content = escapeGuideHtml(trimmed.replace(/^◦\s*/, ''));
      html += '<div style="display:flex;align-items:flex-start;padding-left:20px;gap:7px;margin-bottom:3px;">'
        + '<span style="color:#93c5fd;font-size:13.5px;line-height:20px;font-weight:700;flex-shrink:0;">◦</span>'
        + '<span style="color:#e2e8f0;font-size:13.5px;line-height:20px;flex:1;">' + content + '</span>'
        + '</div>';
      continue;
    }
    if (trimmed.startsWith('•')) {
      const content = escapeGuideHtml(trimmed.replace(/^•\s*/, ''));
      const dotColor = isPayNote ? '#34d399' : '#7dd3fc';
      html += '<div style="display:flex;align-items:flex-start;padding-left:4px;gap:7px;margin-bottom:3px;">'
        + '<span style="color:' + dotColor + ';font-size:14px;line-height:20px;font-weight:800;flex-shrink:0;">•</span>'
        + '<span style="color:#e2e8f0;font-size:13.5px;line-height:20px;flex:1;">' + content + '</span>'
        + '</div>';
      continue;
    }
    const isCaution = trimmed.startsWith('⚠️');
    const headColor = isCaution ? '#fde68a' : (isPayNote ? '#a7f3d0' : '#f8fafc');
    html += '<div style="font-weight:700;color:' + headColor + ';font-size:13.5px;line-height:20px;margin-bottom:3px;">'
      + escapeGuideHtml(trimmed)
      + '</div>';
  }
  return html;
}

function renderCategoryRuleBoxHtml(categoryId, lang, role) {
  const guide = getCategoryGuide(categoryId, lang);
  if (!guide) return '';
  const isWorker = role === 'worker';
  const title = (isWorker && guide.workerDisclaimerRuleTitle) ? guide.workerDisclaimerRuleTitle : guide.disclaimerRuleTitle;
  const bodyText = (isWorker && guide.workerDisclaimerRuleBody) ? guide.workerDisclaimerRuleBody : guide.disclaimerRuleBody;
  if (!title && !bodyText) return '';
  const titleHtml = String(title || '')
    .split('\n')
    .map((line) => escapeGuideHtml(line.trim()))
    .filter(Boolean)
    .join('<br>');
  return '<div class="gisugo-category-rule-box" style="margin-top:14px;padding:12px 14px;background:rgba(15,23,42,0.78);border:1px solid rgba(56,189,248,0.35);border-radius:12px;">'
    + (titleHtml ? '<div style="color:#7dd3fc;font-weight:800;font-size:0.92rem;line-height:1.38;margin-bottom:8px;">' + titleHtml + '</div>' : '')
    + '<div>' + renderStructuredGuideHtml(bodyText, { isPayNote: false }) + '</div>'
    + '</div>';
}

window.GisugoCategoryGuides = {
  POST_EXTRAS,
  POST_UI_COPY,
  PRIVACY_NOTE,
  TRAVEL_TIP,
  CATEGORY_TITLE_EXAMPLES,
  GROUP_TEMPLATES,
  CATEGORY_GUIDES,
  translateExtraLabel,
  getCategoryGuide,
  renderStructuredGuideHtml,
  renderCategoryRuleBoxHtml
};

})(window);
