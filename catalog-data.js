export const COLORS = {
  paper: '#FBFBF8',
  soft: '#F5F6F7',
  ink: '#1F2937',
  red: '#E64236',
  teal: '#0D9488',
  nintendo: '#E64236',
  playstation: '#00439C',
  multi: '#15803D',
  retro: '#B45309',
  inventory: '#121218',
  gold: '#FFC700'
};

export const RETRO_PLATFORMS = new Set([
  'Nintendo Entertainment System', 'Super Nintendo Entertainment System', 'Nintendo 64',
  'Game Boy', 'Game Boy Color', 'Game Boy Advance', 'Nintendo GameCube',
  'PlayStation', 'PlayStation 2', 'PlayStation Portable',
  'Sega Master System', 'Sega Mega Drive/Genesis', 'Sega Saturn', 'Dreamcast',
  'Neo Geo', 'Arcade'
]);

export const franchiseThemes = {
  'resident-evil': { title: 'Resident Evil', style: 'horror-condensed', accent: '#8D1A1A', focus: 'center 30%' },
  'the-legend-of-zelda': { title: 'The Legend of Zelda', style: 'fantasy', accent: '#315B42', focus: 'center 38%' },
  'super-mario': { title: 'Super Mario', style: 'playful-heavy', accent: '#D9322A', focus: 'center' },
  'sonic-the-hedgehog': { title: 'Sonic', style: 'playful-heavy', accent: '#1459C7', focus: 'center' },
  'final-fantasy': { title: 'Final Fantasy', style: 'elegant-serif', accent: '#444A6A', focus: 'center' },
  'god-of-war': { title: 'God of War', style: 'cinematic', accent: '#6D2C27', focus: 'center' },
  'grand-theft-auto': { title: 'Grand Theft Auto', style: 'urban-condensed', accent: '#335C43', focus: 'center' }
};

export const directorySections = [
  {
    id: 'nintendo', title: 'Nintendo', subtitle: 'NES · SNES · N64 · GC · Wii · Wii U · Switch · Switch 2', color: COLORS.nintendo,
    brandText: 'Nintendo', icon: null,
    franchises: [
      ['Super Mario', 'super-mario'], ['The Legend of Zelda', 'the-legend-of-zelda'], ['Pokémon', 'pokemon'], ['Metroid', 'metroid'],
      ['Kirby', 'kirby'], ['Donkey Kong', 'donkey-kong'], ['Animal Crossing', 'animal-crossing'], ['Fire Emblem', 'fire-emblem'],
      ['Splatoon', 'splatoon'], ['Pikmin', 'pikmin']
    ]
  },
  {
    id: 'playstation', title: 'PlayStation', subtitle: 'PS1 · PS2 · PS3 · PS4 · PS5 · PSP · PS Vita', color: COLORS.playstation,
    brandText: 'PlayStation', icon: null,
    franchises: [
      ['God of War', 'god-of-war'], ['The Last of Us', 'the-last-of-us'], ['Gran Turismo', 'gran-turismo'], ['Ratchet & Clank', 'ratchet-and-clank'],
      ['Horizon', 'horizon'], ['Ghost of Tsushima', 'ghost-of-tsushima'], ['Spider-Man', 'marvels-spider-man'], ['Uncharted', 'uncharted'],
      ['Astro Bot', 'astro-bot'], ['Bloodborne', 'bloodborne']
    ]
  },
  {
    id: 'multi', title: 'Multiplataforma', subtitle: 'PlayStation · Nintendo · Xbox · PC', color: COLORS.multi,
    brandText: 'MULTI', icon: '/assets/icons/multiplatform.svg',
    franchises: [
      ['Resident Evil', 'resident-evil'], ['Grand Theft Auto', 'grand-theft-auto'], ['Call of Duty', 'call-of-duty'], ['Mortal Kombat', 'mortal-kombat'],
      ["Assassin's Creed", 'assassins-creed'], ['Final Fantasy', 'final-fantasy'], ['Monster Hunter', 'monster-hunter'], ['Sonic', 'sonic-the-hedgehog']
    ]
  },
  {
    id: 'retro', title: 'Catálogo Retrô', subtitle: '8-bit · 16-bit · 32/64-bit e gerações clássicas', color: COLORS.retro,
    brandText: 'RETRÔ', icon: '/assets/icons/retro.svg', retroSlice: true,
    franchises: [
      ['Resident Evil', 'resident-evil'], ['Sonic', 'sonic-the-hedgehog'], ['The Legend of Zelda', 'the-legend-of-zelda'], ['Final Fantasy', 'final-fantasy'],
      ['Castlevania', 'castlevania'], ['Silent Hill', 'silent-hill'], ['Super Mario', 'super-mario']
    ]
  }
];

// Curadoria local: relações conceituais que não devem depender cegamente da taxonomia de uma API.
// `retro` pertence ao lançamento/registro, nunca à franquia inteira.
export const gameSeeds = [
  { slug:'resident-evil-1996', name:'Resident Evil', year:1996, franchise:'resident-evil', lineage:'original', retro:true, platforms:['PlayStation'], igdbQuery:'Resident Evil' },
  { slug:'resident-evil-2002', name:'Resident Evil', year:2002, franchise:'resident-evil', lineage:'remake', retro:true, platforms:['Nintendo GameCube'], igdbQuery:'Resident Evil' },
  { slug:'resident-evil-2-1998', name:'Resident Evil 2', year:1998, franchise:'resident-evil', lineage:'original', retro:true, platforms:['PlayStation'], igdbQuery:'Resident Evil 2' },
  { slug:'resident-evil-2-2019', name:'Resident Evil 2', year:2019, franchise:'resident-evil', lineage:'remake', retro:false, platforms:['PlayStation 4','Xbox One','PC'], igdbQuery:'Resident Evil 2' },
  { slug:'resident-evil-3-1999', name:'Resident Evil 3: Nemesis', year:1999, franchise:'resident-evil', lineage:'original', retro:true, platforms:['PlayStation'], igdbQuery:'Resident Evil 3: Nemesis' },
  { slug:'resident-evil-3-2020', name:'Resident Evil 3', year:2020, franchise:'resident-evil', lineage:'remake', retro:false, platforms:['PlayStation 4','Xbox One','PC'], igdbQuery:'Resident Evil 3' },
  { slug:'resident-evil-4-2005', name:'Resident Evil 4', year:2005, franchise:'resident-evil', lineage:'original', retro:true, platforms:['Nintendo GameCube','PlayStation 2'], igdbQuery:'Resident Evil 4' },
  { slug:'resident-evil-4-2023', name:'Resident Evil 4', year:2023, franchise:'resident-evil', lineage:'remake', retro:false, platforms:['PlayStation 4','PlayStation 5','Xbox Series X|S','PC'], igdbQuery:'Resident Evil 4' },
  { slug:'ocarina-of-time-1998', name:'The Legend of Zelda: Ocarina of Time', year:1998, franchise:'the-legend-of-zelda', lineage:'original', retro:true, platforms:['Nintendo 64'], igdbQuery:'The Legend of Zelda: Ocarina of Time' },
  { slug:'links-awakening-1993', name:"The Legend of Zelda: Link's Awakening", year:1993, franchise:'the-legend-of-zelda', lineage:'original', retro:true, platforms:['Game Boy'], igdbQuery:"The Legend of Zelda: Link's Awakening" },
  { slug:'links-awakening-2019', name:"The Legend of Zelda: Link's Awakening", year:2019, franchise:'the-legend-of-zelda', lineage:'remake', retro:false, platforms:['Nintendo Switch'], igdbQuery:"The Legend of Zelda: Link's Awakening" },
  { slug:'final-fantasy-vii-1997', name:'Final Fantasy VII', year:1997, franchise:'final-fantasy', lineage:'original', retro:true, platforms:['PlayStation'], igdbQuery:'Final Fantasy VII' },
  { slug:'final-fantasy-vii-remake-2020', name:'Final Fantasy VII Remake', year:2020, franchise:'final-fantasy', lineage:'remake', retro:false, platforms:['PlayStation 4'], igdbQuery:'Final Fantasy VII Remake' },
  { slug:'sonic-the-hedgehog-1991', name:'Sonic the Hedgehog', year:1991, franchise:'sonic-the-hedgehog', lineage:'original', retro:true, platforms:['Sega Mega Drive/Genesis'], igdbQuery:'Sonic the Hedgehog' },
  { slug:'god-of-war-2018', name:'God of War', year:2018, franchise:'god-of-war', lineage:'original', retro:false, platforms:['PlayStation 4','PC'], igdbQuery:'God of War' }
];

export const lineageLabels = {
  original: 'Original', remake: 'Remake', remaster: 'Remaster', port: 'Port', edition: 'Edição'
};

export const featuredGameSlugs = [
  'resident-evil-4-2023', 'ocarina-of-time-1998', 'god-of-war-2018', 'sonic-the-hedgehog-1991'
];

export function getGameSeed(slug) { return gameSeeds.find(game => game.slug === slug) || null; }
export function getFranchiseSeed(slug) { return gameSeeds.filter(game => game.franchise === slug); }
export function getFranchiseTheme(slug) { return franchiseThemes[slug] || { title: slug.replaceAll('-', ' '), style:'default', accent: COLORS.red, focus:'center' }; }

export function getContextCount(franchiseSlug, sectionId) {
  const games = getFranchiseSeed(franchiseSlug);
  if (!games.length) return null;
  return sectionId === 'retro' ? games.filter(g => g.retro).length : games.length;
}
