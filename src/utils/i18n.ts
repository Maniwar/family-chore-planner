// Internationalization (i18n) system for English, Tagalog, and Ilokano

export type SupportedLanguage = 'en' | 'tl' | 'ilo';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flagEmoji: string;
  region: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flagEmoji: '🇺🇸',
    region: 'Default',
  },
  {
    code: 'tl',
    name: 'Tagalog',
    nativeName: 'Wikang Tagalog',
    flagEmoji: '🇵🇭',
    region: 'Pilipinas',
  },
  {
    code: 'ilo',
    name: 'Ilokano',
    nativeName: 'Ti Pagsasao nga Ilokano',
    flagEmoji: '🌴',
    region: 'Akin-amianan a Luzon',
  },
];

export const translations = {
  en: {
    // App header
    appTitle: 'Family Chore Hub',
    momsCommand: "Mom's Command",
    appSubtitle: 'Schedule, assign, quality-grade, and track household chores',
    momAdmin: '👩 Mom Admin',
    kidChecklist: '👦 Kid Checklist',
    momMode: 'Mom Mode',
    kidView: 'Kid View',
    toInspect: 'to Inspect',
    aiAutoAssign: 'AI Auto-Assign',
    googleCalendar: 'Google Calendar',
    newChore: 'New Chore',
    printSchedule: 'Print Schedule',
    wholeFamily: 'Whole Family',
    familyView: 'Family View:',
    soundOn: 'Sound On',
    soundMuted: 'Sound Muted',

    // Navigation Tabs
    tabToday: "Today's Chores",
    tabWeekly: 'Weekly Schedule',
    tabInspect: "Mom's Inspection",
    tabLibrary: 'Chore Library',
    tabMembers: 'Family Helpers',
    tabRewards: 'Rewards Catalog',
    tabReports: 'Print & Reports',
    tabCalendar: 'Google Calendar',

    // Chore card
    markDone: 'Done',
    fixedSubmit: 'Fixed! Submit for Review',
    awaitingMom: "Awaiting Mom's Inspection",
    inspectAndGrade: 'Inspect & Grade',
    pass5Star: 'Pass (5⭐)',
    inspectedApproved: 'Inspected & Approved',
    editGradePoints: 'Edit Grade / Points',
    momRequestedRedo: 'Mom requested a touch-up',
    qualityChecklist: 'Quality Checklist',
    pts: 'pts',
    estimatedTime: 'Est. Time',
    quickApproveTitle: 'Quick approve with 5 Stars',
    cardAssignedTo: 'Assigned to',

    // Categories
    catKitchen: 'Kitchen',
    catLivingRoom: 'Living Room',
    catBedrooms: 'Bedrooms',
    catBathrooms: 'Bathrooms',
    catYardOutdoor: 'Yard & Outdoor',
    catLaundry: 'Laundry',
    catPets: 'Pets',
    catDailyRoutine: 'Daily Routine',
    catGeneral: 'General',

    // Time of day
    todMorning: 'Morning',
    todAfternoon: 'Afternoon',
    todEvening: 'Evening',
    todBedtime: 'Bedtime',
    todAnytime: 'Anytime',

    // Daily View
    todayScheduleFor: "Today's Schedule for",
    allChoresDoneToday: 'All Chores Completed for Today! 🎉',
    allChoresDoneSubtitle: 'Fantastic teamwork! Every room is sparkling clean and inspected.',
    noChoresFound: 'No chores found for this filter.',
    addCustomChore: 'Add a custom chore or use AI Auto-Assign to populate the schedule.',
    quickBatchApprove: 'Quick Approve All Done',
    workloadChart: 'Workload Chart',
    filterCategory: 'Category',
    filterAllCategories: 'All Categories',
    filterTimeOfDay: 'Time of Day',
    filterAllTimes: 'All Times',
    filterStatus: 'Status',
    filterAllStatuses: 'All Statuses',
    searchChoresPlaceholder: 'Search chore title or room...',
    groupByTime: 'Time',
    groupByCategory: 'Room',
    groupByMember: 'Helper',

    // Weekly View
    weeklyOverview: '7-Day Family Chore Matrix',
    weeklySubtitle: 'Click any day or task to inspect workload balance',
    jumpToToday: 'Jump to Today',
    balancedScore: 'Balanced',

    // Inspection
    inspectionTitle: "Mom's Quality Inspection Queue",
    inspectionSubtitle: 'Review submitted chores, verify checklists, and award stars & points',
    noInspectionsWaiting: 'No chores waiting for inspection! ✨',
    noInspectionsSubtitle: 'All submitted chores have been graded and approved.',
    batchApproveAll: 'Batch Approve All (5⭐)',

    // Rewards
    rewardsTitle: 'Family Rewards Catalog',
    rewardsSubtitle: 'Earn points by doing quality chores and redeem for fun privileges & treats!',
    currentBalance: 'Current Points Balance:',
    claimReward: 'Claim Reward',
    claimed: 'Claimed',
    notEnoughPoints: 'Need more points',
    addNewReward: 'Add New Reward',
    pendingClaims: 'Pending Approval Claims',
    approveReward: 'Approve & Deliver',
    delivered: 'Delivered',

    // Praise & Encouragements
    praiseAwesome: 'Awesome work!',
    praiseApproved: 'Approved! Points and stars awarded!',
    praisePassed5: 'Passed with 5 Stars!',
    praiseBatchApproved: 'Batch approved all chores!',
    praiseClaimed: 'Reward request sent to Mom!',
  },

  tl: {
    // App header
    appTitle: 'Sentro ng Gawaing-Bahay',
    momsCommand: 'Utos ni Nanay',
    appSubtitle: 'Mag-iskedyul, magtalaga, magmarka ng kalidad, at subaybayan ang mga gawaing-bahay',
    momAdmin: '👩 Nanay Admin',
    kidChecklist: '👦 Listahan ng Bata',
    momMode: 'Modo ni Nanay',
    kidView: 'Tingin ng Bata',
    toInspect: 'susuriin',
    aiAutoAssign: 'AI Auto-Italaga',
    googleCalendar: 'Google Calendar',
    newChore: 'Bagong Gawain',
    printSchedule: 'I-print ang Iskedyul',
    wholeFamily: 'Buong Pamilya',
    familyView: 'Tingnan ang Pamilya:',
    soundOn: 'May Tunog',
    soundMuted: 'Naka-mute',

    // Navigation Tabs
    tabToday: 'Mga Gawain Ngayon',
    tabWeekly: 'Lingguhang Iskedyul',
    tabInspect: 'Pagsusuri ni Nanay',
    tabLibrary: 'Aklatan ng Gawain',
    tabMembers: 'Mga Katulong sa Bahay',
    tabRewards: 'Katalogo ng Premyo',
    tabReports: 'Ulat at Pag-print',
    tabCalendar: 'Google Calendar',

    // Chore card
    markDone: 'Tapos na',
    fixedSubmit: 'Naayos na! Isumite para Suriin',
    awaitingMom: 'Naghihintay ng Pagsusuri ni Nanay',
    inspectAndGrade: 'Suriin at Bigyan ng Grado',
    pass5Star: 'Pasa (5⭐)',
    inspectedApproved: 'Nasuri at Naaprubahan',
    editGradePoints: 'Baguhin ang Grado / Puntos',
    momRequestedRedo: 'Humiling si Nanay na ayusin muli',
    qualityChecklist: 'Listahan ng Kalidad',
    pts: 'puntos',
    estimatedTime: 'Tantiang Oras',
    quickApproveTitle: 'Mabilisang pag-apruba na may 5 Bituin',
    cardAssignedTo: 'Nakatoka kay',

    // Categories
    catKitchen: 'Kusina',
    catLivingRoom: 'Sala',
    catBedrooms: 'Mga Kuwarto',
    catBathrooms: 'Mga Banyo',
    catYardOutdoor: 'Bakuran at Labas',
    catLaundry: 'Labahan',
    catPets: 'Mga Alagang Hayop',
    catDailyRoutine: 'Pang-araw-araw na Routine',
    catGeneral: 'Pangkalahatan',

    // Time of day
    todMorning: 'Umaga',
    todAfternoon: 'Hapon',
    todEvening: 'Gabi',
    todBedtime: 'Bago Matulog',
    todAnytime: 'Kahit Kailan',

    // Daily View
    todayScheduleFor: 'Iskedyul Ngayong Araw para kay',
    allChoresDoneToday: 'Lahat ng Gawain ay Tapos na Ngayong Araw! 🎉',
    allChoresDoneSubtitle: 'Napakagaling na pagtutulungan! Malinis at nasuri na ang bawat sulok.',
    noChoresFound: 'Walang nahanap na gawain para sa filter na ito.',
    addCustomChore: 'Magdagdag ng sariling gawain o gamitin ang AI para magtalaga.',
    quickBatchApprove: 'Mabilisang Aprubahan Lahat ng Tapos',
    workloadChart: 'Tsart ng Trabaho',
    filterCategory: 'Kategorya',
    filterAllCategories: 'Lahat ng Kategorya',
    filterTimeOfDay: 'Oras ng Araw',
    filterAllTimes: 'Lahat ng Oras',
    filterStatus: 'Katayuan',
    filterAllStatuses: 'Lahat ng Katayuan',
    searchChoresPlaceholder: 'Maghanap ng gawain o kuwarto...',
    groupByTime: 'Oras',
    groupByCategory: 'Kuwarto',
    groupByMember: 'Katulong',

    // Weekly View
    weeklyOverview: '7-Araw na Matris ng Gawaing-Bahay',
    weeklySubtitle: 'Pindutin ang kahit anong araw o gawain para makita ang balanse ng trabaho',
    jumpToToday: 'Pumunta sa Ngayon',
    balancedScore: 'Balansado',

    // Inspection
    inspectionTitle: 'Pila ng Pagsusuri ng Kalidad ni Nanay',
    inspectionSubtitle: 'Suriin ang mga natapos na gawain, i-tsek ang listahan, at magbigay ng bituin at puntos',
    noInspectionsWaiting: 'Walang gawaing naghihintay ng pagsusuri! ✨',
    noInspectionsSubtitle: 'Lahat ng naisumiteng gawain ay nagraduhan at naaprubahan na.',
    batchApproveAll: 'Aprubahan Lahat nang Sabay (5⭐)',

    // Rewards
    rewardsTitle: 'Katalogo ng mga Premyo ng Pamilya',
    rewardsSubtitle: 'Mag-ipon ng puntos sa paggawa ng maayos na gawain at ipalit sa magagandang premyo!',
    currentBalance: 'Kasalukuyang Balanse ng Puntos:',
    claimReward: 'Kunin ang Premyo',
    claimed: 'Nakuha na',
    notEnoughPoints: 'Kulang pa ang puntos',
    addNewReward: 'Magdagdag ng Bagong Premyo',
    pendingClaims: 'Mga Kahilingang Naghihintay ng Pag-apruba',
    approveReward: 'Aprubahan at Ibigay',
    delivered: 'Naibigay na',

    // Praise & Encouragements
    praiseAwesome: 'Napakagaling!',
    praiseApproved: 'Naaprubahan! May karagdagang puntos at bituin!',
    praisePassed5: 'Pumasa nang may 5 Bituin!',
    praiseBatchApproved: 'Naaprubahan lahat ng sabay-sabay!',
    praiseClaimed: 'Naipadala na ang kahilingan ng premyo kay Nanay!',
  },

  ilo: {
    // App header
    appTitle: 'Sentro ti Trabaho iti Balay',
    momsCommand: 'Bilbilin ni Nanang',
    appSubtitle: 'Iskedyul, itrabaho, markaan ti kalidad, ken subaybayan dagiti trabaho iti balay',
    momAdmin: '👩 Nanang Admin',
    kidChecklist: '👦 Listaan ti Ubing',
    momMode: 'Modo ni Nanang',
    kidView: 'Kita ti Ubing',
    toInspect: 'ti kitaen',
    aiAutoAssign: 'AI Nainsiriban a Panangitrabaho',
    googleCalendar: 'Google Calendar',
    newChore: 'Baro a Trabaho',
    printSchedule: 'I-print ti Iskedyul',
    wholeFamily: 'Intero a Pamilia',
    familyView: 'Kita ti Pamilia:',
    soundOn: 'Adda Uni',
    soundMuted: 'Awan Uni',

    // Navigation Tabs
    tabToday: 'Trabaho Ita nga Aldaw',
    tabWeekly: 'Lawas a Pagorasan',
    tabInspect: 'Panangsukimat ni Nanang',
    tabLibrary: 'Bulsek dagiti Trabaho',
    tabMembers: 'Katulongan ti Pamilia',
    tabRewards: 'Katalogo ti Gunggona',
    tabReports: 'Pakdaar ken Pag-print',
    tabCalendar: 'Google Calendar',

    // Chore card
    markDone: 'Nalpasen',
    fixedSubmit: 'Natarimaan! Isumite tapno Matarimaan',
    awaitingMom: 'Agur-uray ti Pananginspeksion ni Nanang',
    inspectAndGrade: 'Sukimaten ken Gradoan',
    pass5Star: 'Nalpasen (5⭐)',
    inspectedApproved: 'Nasukimat ken Naaprubaran',
    editGradePoints: 'Sukatan ti Grado / Puntos',
    momRequestedRedo: 'Kiniddaw ni Nanang a tarimaan manen',
    qualityChecklist: 'Listaan ti Kalidad',
    pts: 'puntos',
    estimatedTime: 'Karkulo nga Oras',
    quickApproveTitle: 'Naparpartak a panangaprobar nga addaan 5 Bituin',
    cardAssignedTo: 'Naitrabaho ken',

    // Categories
    catKitchen: 'Kusina',
    catLivingRoom: 'Salas',
    catBedrooms: 'Dagiti Kuarto / Siled',
    catBathrooms: 'Dagiti Banyo',
    catYardOutdoor: 'Paraangan ken Arubayan',
    catLaundry: 'Paglabaan',
    catPets: 'Dagiti Taraken',
    catDailyRoutine: 'Inaldaw a Trabaho',
    catGeneral: 'Sapasap',

    // Time of day
    todMorning: 'Bigat',
    todAfternoon: 'Malem',
    todEvening: 'Rabi',
    todBedtime: 'Sakbay a Maturog',
    todAnytime: 'Uray Kaano',

    // Daily View
    todayScheduleFor: 'Iskedyul Ita nga Aldaw para ken',
    allChoresDoneToday: 'Nalpas Amin a Trabaho Ita nga Aldaw! 🎉',
    allChoresDoneSubtitle: 'Naglaing a panagtutinnulong! Nadalus ken nasukimaten amin a siled.',
    noChoresFound: 'Awan masarakan a trabaho para iti daytoy a filter.',
    addCustomChore: 'Manginayon ti baro a trabaho wenno usaren ti AI a mangitrabaho.',
    quickBatchApprove: 'Aprobaran Amin a Nalpas',
    workloadChart: 'Tsart ti Trabaho',
    filterCategory: 'Kategoria',
    filterAllCategories: 'Amin a Kategoria',
    filterTimeOfDay: 'Oras ti Aldaw',
    filterAllTimes: 'Amin nga Oras',
    filterStatus: 'Kasasaad',
    filterAllStatuses: 'Amin a Kasasaad',
    searchChoresPlaceholder: 'Agbirok ti trabaho wenno kuarto...',
    groupByTime: 'Oras',
    groupByCategory: 'Kuarto',
    groupByMember: 'Katulongan',

    // Weekly View
    weeklyOverview: '7-Aldaw a Matris ti Trabaho iti Balay',
    weeklySubtitle: 'Pinduten ti uray ania nga aldaw tapno makita ti balanse ti trabaho',
    jumpToToday: 'Mapan iti Ita',
    balancedScore: 'Balansado',

    // Inspection
    inspectionTitle: 'Pila ti Pananginspeksion ti Kalidad ni Nanang',
    inspectionSubtitle: 'Sukimaten dagiti nalpas a trabaho, tsek-an ti listaan, ken mangted iti bituin ken puntos',
    noInspectionsWaiting: 'Awan trabaho nga agur-uray ti pananginspeksion! ✨',
    noInspectionsSubtitle: 'Amin a naisumite a trabaho ket nagradoan ken naaprubaranen.',
    batchApproveAll: 'Aprobaran Amin a Sagka-maysa (5⭐)',

    // Rewards
    rewardsTitle: 'Katalogo dagiti Gunggona ti Pamilia',
    rewardsSubtitle: 'Agurnong ti puntos babaen ti naannayas a panagtrabaho ken isukat iti nasayaat a gunggona!',
    currentBalance: 'Agtama a Balanse ti Puntos:',
    claimReward: 'Alaen ti Gunggona',
    claimed: 'Naalan',
    notEnoughPoints: 'Kurang pay ti puntos',
    addNewReward: 'Manginayon ti Baro a Gunggona',
    pendingClaims: 'Dagiti Kiddaw nga Agur-uray ti Panangaprobar',
    approveReward: 'Aprobaran ken Ited',
    delivered: 'Naiteden',

    // Praise & Encouragements
    praiseAwesome: 'Naglaingka unay!',
    praiseApproved: 'Naaprubaran! Adda kanayonan a puntos ken bituin!',
    praisePassed5: 'Pimmasa nga addaan 5 Bituin!',
    praiseBatchApproved: 'Naaprubaran amin a sagka-maysa!',
    praiseClaimed: 'Naitulod ti kiddaw ti gunggona ken Nanang!',
  },
};

export function getTranslation(lang?: string) {
  if (!lang || !translations[lang as SupportedLanguage]) {
    return translations.en;
  }
  return translations[lang as SupportedLanguage];
}

export function getCategoryTranslation(cat: string, lang?: string): string {
  const t = getTranslation(lang);
  switch (cat) {
    case 'Kitchen': return t.catKitchen;
    case 'Living Room': return t.catLivingRoom;
    case 'Bedrooms': return t.catBedrooms;
    case 'Bathrooms': return t.catBathrooms;
    case 'Yard & Outdoor': return t.catYardOutdoor;
    case 'Laundry': return t.catLaundry;
    case 'Pets': return t.catPets;
    case 'Daily Routine': return t.catDailyRoutine;
    default: return cat;
  }
}
