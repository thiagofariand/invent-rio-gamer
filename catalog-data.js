/* ============================================================
   INVENTÁRIO GAMER — catalog-data.js (v0.96)
   Dados estáticos do catálogo. Não contém preços.
   - catalog: títulos, apelidos e plataformas (edite aqui para ampliar)
   - collections: anos e slugs usados nas listas Tenho/Quero (v0.95)
   - digitalCatalog: links digitais já verificados por você
   - trendingNow: destaques manuais (fonte + data em cada item)
   Para ligar catálogo real (API/banco) no futuro, basta substituir
   este arquivo por uma chamada que devolva a mesma estrutura.
   ============================================================ */
window.INV_DATA=(function(){
const trendingNow=[
  {title:'Grand Theft Auto VI',tag:'PRÉ-VENDA',copy:'Lançamento em 19/11/2026 para PS5 e Xbox Series X|S; pré-venda já aberta.',query:'grand theft auto vi',digital:'https://store.rockstargames.com/pt-BR/game/buy-gta-vi'},
  {title:"Marvel's Wolverine",tag:'LANÇAMENTO',copy:'Lançado em 15/09/2026 para PS5.',query:'marvel wolverine ps5',digital:'https://www.playstation.com/pt-br/games/marvels-wolverine/'},
  {title:'The Legend of Zelda: Ocarina of Time',tag:'REMAKE',copy:'Remake para Nintendo Switch 2 com lançamento em 05/11/2026.',query:'ocarina of time switch 2',digital:'https://www.nintendo.com/pt-br/store/products/the-legend-of-zelda-ocarina-of-time-switch-2/'},
  {title:"Fire Emblem: Fortune's Weave",tag:'NOVO',copy:'Lançado em 17/09/2026 para Nintendo Switch 2.',query:'fire emblem fortunes weave',digital:'https://www.nintendo.com/pt-br/store/products/fire-emblem-fortunes-weave-switch-2/'}
];

const franchiseDirectory={
  Nintendo:['Mario','The Legend of Zelda','Pokémon','Metroid','Kirby','Donkey Kong','Animal Crossing','Fire Emblem','Splatoon','Pikmin'],
  PlayStation:['God of War','The Last of Us','Gran Turismo','Ratchet & Clank','Horizon','Ghost of Tsushima','Marvel Spider-Man','Uncharted','Astro Bot','Bloodborne'],
  Multi:['Sonic','Call of Duty','Mortal Kombat',"Assassin's Creed",'Resident Evil','Final Fantasy','Grand Theft Auto','Street Fighter','Monster Hunter','Tomb Raider','Silent Hill']
};

const collections={
  zelda:{name:'The Legend of Zelda',short:'Zelda',icon:'✦',items:[
    {slug:'the-legend-of-zelda',title:'The Legend of Zelda',year:1986,platforms:['NES']},
    {slug:'a-link-to-the-past',title:'The Legend of Zelda: A Link to the Past',year:1991,platforms:['SNES','Game Boy Advance']},
    {slug:'ocarina-of-time',title:'The Legend of Zelda: Ocarina of Time',year:1998,platforms:['Nintendo 64','3DS']},
    {slug:'majoras-mask',title:"The Legend of Zelda: Majora's Mask",year:2000,platforms:['Nintendo 64','3DS']},
    {slug:'the-wind-waker',title:'The Legend of Zelda: The Wind Waker',year:2002,platforms:['GameCube','Wii U']},
    {slug:'twilight-princess',title:'The Legend of Zelda: Twilight Princess',year:2006,platforms:['GameCube','Wii','Wii U']},
    {slug:'skyward-sword',title:'The Legend of Zelda: Skyward Sword',year:2011,platforms:['Wii','Switch']},
    {slug:'links-awakening',title:"The Legend of Zelda: Link's Awakening",year:1993,platforms:['Game Boy','Game Boy Color','Switch']},
    {slug:'breath-of-the-wild',title:'The Legend of Zelda: Breath of the Wild',year:2017,platforms:['Wii U','Switch']},
    {slug:'tears-of-the-kingdom',title:'The Legend of Zelda: Tears of the Kingdom',year:2023,platforms:['Switch']}
  ]},
  cod:{name:'Call of Duty',short:'Call of Duty',icon:'◎',items:[
    {slug:'cod4-modern-warfare',title:'Call of Duty 4: Modern Warfare',year:2007,platforms:['PS3']},
    {slug:'world-at-war',title:'Call of Duty: World at War',year:2008,platforms:['PS3']},
    {slug:'modern-warfare-2',title:'Call of Duty: Modern Warfare 2',year:2009,platforms:['PS3']},
    {slug:'black-ops',title:'Call of Duty: Black Ops',year:2010,platforms:['PS3']},
    {slug:'modern-warfare-3',title:'Call of Duty: Modern Warfare 3',year:2011,platforms:['PS3']},
    {slug:'black-ops-ii',title:'Call of Duty: Black Ops II',year:2012,platforms:['PS3']},
    {slug:'ghosts',title:'Call of Duty: Ghosts',year:2013,platforms:['PS3','PS4']},
    {slug:'wwii',title:'Call of Duty: WWII',year:2017,platforms:['PS4']},
    {slug:'modern-warfare-2019',title:'Call of Duty: Modern Warfare',year:2019,platforms:['PS4']},
    {slug:'black-ops-6',title:'Call of Duty: Black Ops 6',year:2024,platforms:['PS4','PS5']}
  ]},
  gta:{name:'Grand Theft Auto',short:'GTA',icon:'▣',items:[
    {slug:'gta-iii',title:'Grand Theft Auto III',year:2001,platforms:['PS2']},
    {slug:'vice-city',title:'Grand Theft Auto: Vice City',year:2002,platforms:['PS2']},
    {slug:'san-andreas',title:'Grand Theft Auto: San Andreas',year:2004,platforms:['PS2']},
    {slug:'liberty-city-stories',title:'Grand Theft Auto: Liberty City Stories',year:2005,platforms:['PSP','PS2']},
    {slug:'vice-city-stories',title:'Grand Theft Auto: Vice City Stories',year:2006,platforms:['PSP','PS2']},
    {slug:'gta-iv',title:'Grand Theft Auto IV',year:2008,platforms:['PS3']},
    {slug:'chinatown-wars',title:'Grand Theft Auto: Chinatown Wars',year:2009,platforms:['PSP']},
    {slug:'gta-v',title:'Grand Theft Auto V',year:2013,platforms:['PS3','PS4','PS5']}
  ]},
  godofwar:{name:'God of War',short:'God of War',icon:'Ω',items:[
    {slug:'god-of-war-2005',title:'God of War',year:2005,platforms:['PS2']},
    {slug:'god-of-war-ii',title:'God of War II',year:2007,platforms:['PS2']},
    {slug:'chains-of-olympus',title:'God of War: Chains of Olympus',year:2008,platforms:['PSP']},
    {slug:'god-of-war-iii',title:'God of War III',year:2010,platforms:['PS3','PS4']},
    {slug:'ghost-of-sparta',title:'God of War: Ghost of Sparta',year:2010,platforms:['PSP']},
    {slug:'ascension',title:'God of War: Ascension',year:2013,platforms:['PS3']},
    {slug:'god-of-war-2018',title:'God of War',year:2018,platforms:['PS4']},
    {slug:'ragnarok',title:'God of War Ragnarök',year:2022,platforms:['PS4','PS5']}
  ]},
  residentevil:{name:'Resident Evil',short:'Resident Evil',icon:'☣',items:[
    {slug:'resident-evil',title:'Resident Evil',year:1996,platforms:['PS1']},
    {slug:'resident-evil-2',title:'Resident Evil 2',year:1998,platforms:['PS1']},
    {slug:'resident-evil-3',title:'Resident Evil 3: Nemesis',year:1999,platforms:['PS1']},
    {slug:'code-veronica-x',title:'Resident Evil Code: Veronica X',year:2001,platforms:['PS2']},
    {slug:'resident-evil-4',title:'Resident Evil 4',year:2005,platforms:['PS2','GameCube','Wii','PS4']},
    {slug:'resident-evil-5',title:'Resident Evil 5',year:2009,platforms:['PS3','PS4']},
    {slug:'resident-evil-6',title:'Resident Evil 6',year:2012,platforms:['PS3','PS4']},
    {slug:'resident-evil-7',title:'Resident Evil 7 biohazard',year:2017,platforms:['PS4','PS5']},
    {slug:'resident-evil-village',title:'Resident Evil Village',year:2021,platforms:['PS4','PS5']},
    {slug:'resident-evil-4-remake',title:'Resident Evil 4 (2023)',year:2023,platforms:['PS4','PS5']}
  ]},
  sonic:{name:'Sonic the Hedgehog',short:'Sonic',icon:'◉',items:[
    {slug:'sonic-1',title:'Sonic the Hedgehog',year:1991,platforms:['Mega Drive / Genesis','Master System','Game Gear']},
    {slug:'sonic-2',title:'Sonic the Hedgehog 2',year:1992,platforms:['Mega Drive / Genesis','Master System','Game Gear']},
    {slug:'sonic-3',title:'Sonic the Hedgehog 3',year:1994,platforms:['Mega Drive / Genesis']},
    {slug:'sonic-and-knuckles',title:'Sonic & Knuckles',year:1994,platforms:['Mega Drive / Genesis']},
    {slug:'sonic-adventure',title:'Sonic Adventure',year:1998,platforms:['Dreamcast','GameCube']},
    {slug:'sonic-adventure-2',title:'Sonic Adventure 2',year:2001,platforms:['Dreamcast','GameCube']},
    {slug:'sonic-heroes',title:'Sonic Heroes',year:2003,platforms:['GameCube','PS2']},
    {slug:'sonic-unleashed',title:'Sonic Unleashed',year:2008,platforms:['Wii','PS2','PS3']},
    {slug:'sonic-mania-plus',title:'Sonic Mania Plus',year:2018,platforms:['Switch','PS4']},
    {slug:'sonic-frontiers',title:'Sonic Frontiers',year:2022,platforms:['Switch','PS4','PS5']}
  ]}
};

const catalog=[
{franchise:'Call of Duty',title:'Call of Duty 4: Modern Warfare',aliases:['cod4','modern warfare 2007'],variants:[['PlayStation','PS3']]},
{franchise:'Call of Duty',title:'Call of Duty: World at War',aliases:['world at war','cod waw'],variants:[['PlayStation','PS3']]},
{franchise:'Call of Duty',title:'Call of Duty: Modern Warfare 2',aliases:['mw2','modern warfare 2'],variants:[['PlayStation','PS3']]},
{franchise:'Call of Duty',title:'Call of Duty: Black Ops',aliases:['black ops','bo1'],variants:[['PlayStation','PS3']]},
{franchise:'Call of Duty',title:'Call of Duty: Modern Warfare 3',aliases:['mw3','modern warfare 3'],variants:[['PlayStation','PS3']]},
{franchise:'Call of Duty',title:'Call of Duty: Black Ops II',aliases:['black ops 2','bo2'],variants:[['PlayStation','PS3']]},
{franchise:'Call of Duty',title:'Call of Duty: Ghosts',aliases:['cod ghosts'],variants:[['PlayStation','PS3'],['PlayStation','PS4']]},
{franchise:'Call of Duty',title:'Call of Duty: WWII',aliases:['cod wwii','call of duty ww2'],variants:[['PlayStation','PS4']]},
{franchise:'Call of Duty',title:'Call of Duty: Modern Warfare',aliases:['modern warfare 2019','mw 2019'],variants:[['PlayStation','PS4']]},
{franchise:'Call of Duty',title:'Call of Duty: Black Ops 6',aliases:['black ops 6','bo6'],variants:[['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:'Grand Theft Auto',title:'Grand Theft Auto III',aliases:['gta 3','gta iii'],variants:[['PlayStation','PS2']]},
{franchise:'Grand Theft Auto',title:'Grand Theft Auto: Vice City',aliases:['gta vice city','vice city'],variants:[['PlayStation','PS2']]},
{franchise:'Grand Theft Auto',title:'Grand Theft Auto: San Andreas',aliases:['gta san andreas','san andreas'],variants:[['PlayStation','PS2']]},
{franchise:'Grand Theft Auto',title:'Grand Theft Auto: Liberty City Stories',aliases:['gta liberty city stories','lcs'],variants:[['PlayStation','PSP'],['PlayStation','PS2']]},
{franchise:'Grand Theft Auto',title:'Grand Theft Auto: Vice City Stories',aliases:['gta vice city stories','vcs'],variants:[['PlayStation','PSP'],['PlayStation','PS2']]},
{franchise:'Grand Theft Auto',title:'Grand Theft Auto IV',aliases:['gta 4','gta iv'],variants:[['PlayStation','PS3']]},
{franchise:'Grand Theft Auto',title:'Grand Theft Auto: Chinatown Wars',aliases:['gta chinatown wars'],variants:[['PlayStation','PSP']]},
{franchise:'Grand Theft Auto',title:'Grand Theft Auto V',aliases:['gta 5','gta v'],variants:[['PlayStation','PS3'],['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:'God of War',title:'God of War',aliases:['god of war 1','gow 1','god of war 2005'],variants:[['PlayStation','PS2']]},
{franchise:'God of War',title:'God of War II',aliases:['god of war 2','gow 2'],variants:[['PlayStation','PS2']]},
{franchise:'God of War',title:'God of War: Chains of Olympus',aliases:['chains of olympus'],variants:[['PlayStation','PSP']]},
{franchise:'God of War',title:'God of War III',aliases:['god of war 3','gow 3'],variants:[['PlayStation','PS3'],['PlayStation','PS4']]},
{franchise:'God of War',title:'God of War: Ghost of Sparta',aliases:['ghost of sparta'],variants:[['PlayStation','PSP']]},
{franchise:'God of War',title:'God of War: Ascension',aliases:['gow ascension'],variants:[['PlayStation','PS3']]},
{franchise:'God of War',title:'God of War (2018)',aliases:['god of war 2018','gow 2018'],variants:[['PlayStation','PS4']]},
{franchise:'God of War',title:'God of War Ragnarök',aliases:['god of war ragnarok','gow ragnarok'],variants:[['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:'Resident Evil',title:'Resident Evil',aliases:['resident evil 1','re1'],variants:[['PlayStation','PS1']]},
{franchise:'Resident Evil',title:'Resident Evil 2',aliases:['re2'],variants:[['PlayStation','PS1']]},
{franchise:'Resident Evil',title:'Resident Evil 3: Nemesis',aliases:['resident evil 3','re3 nemesis'],variants:[['PlayStation','PS1']]},
{franchise:'Resident Evil',title:'Resident Evil Code: Veronica X',aliases:['code veronica x','resident evil code veronica'],variants:[['PlayStation','PS2']]},
{franchise:'Resident Evil',title:'Resident Evil 4',aliases:['re4','resident evil four'],variants:[['PlayStation','PS2'],['Nintendo','GameCube'],['Nintendo','Wii'],['PlayStation','PS4']]},
{franchise:'Resident Evil',title:'Resident Evil 5',aliases:['re5'],variants:[['PlayStation','PS3'],['PlayStation','PS4']]},
{franchise:'Resident Evil',title:'Resident Evil 6',aliases:['re6'],variants:[['PlayStation','PS3'],['PlayStation','PS4']]},
{franchise:'Resident Evil',title:'Resident Evil 7 biohazard',aliases:['resident evil 7','re7','biohazard 7'],variants:[['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:'Resident Evil',title:'Resident Evil Village',aliases:['resident evil 8','re8','village'],variants:[['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:'Resident Evil',title:'Resident Evil 4 (2023)',aliases:['resident evil 4 remake','re4 remake'],variants:[['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:'The Legend of Zelda',title:'The Legend of Zelda',aliases:['zelda 1','zelda nes'],variants:[['Nintendo','NES']]},
{franchise:'The Legend of Zelda',title:'The Legend of Zelda: A Link to the Past',aliases:['a link to the past','alttp'],variants:[['Nintendo','SNES'],['Nintendo','Game Boy Advance']]},
{franchise:'The Legend of Zelda',title:'The Legend of Zelda: Ocarina of Time',aliases:['ocarina of time','oot','zelda oot'],variants:[['Nintendo','Nintendo 64'],['Nintendo','3DS']]},
{franchise:'The Legend of Zelda',title:"The Legend of Zelda: Majora's Mask",aliases:['majoras mask','majora mask'],variants:[['Nintendo','Nintendo 64'],['Nintendo','3DS']]},
{franchise:'The Legend of Zelda',title:'The Legend of Zelda: The Wind Waker',aliases:['wind waker','zelda wind waker'],variants:[['Nintendo','GameCube'],['Nintendo','Wii U']]},
{franchise:'The Legend of Zelda',title:'The Legend of Zelda: Twilight Princess',aliases:['twilight princess','zelda tp'],variants:[['Nintendo','GameCube'],['Nintendo','Wii'],['Nintendo','Wii U']]},
{franchise:'The Legend of Zelda',title:'The Legend of Zelda: Skyward Sword',aliases:['skyward sword','zelda ss'],variants:[['Nintendo','Wii'],['Nintendo','Switch']]},
{franchise:'The Legend of Zelda',title:"The Legend of Zelda: Link's Awakening",aliases:['links awakening','link awakening'],variants:[['Nintendo','Game Boy'],['Nintendo','Game Boy Color'],['Nintendo','Switch']]},
{franchise:'The Legend of Zelda',title:'The Legend of Zelda: Breath of the Wild',aliases:['breath of the wild','botw'],variants:[['Nintendo','Wii U'],['Nintendo','Switch']]},
{franchise:'The Legend of Zelda',title:'The Legend of Zelda: Tears of the Kingdom',aliases:['tears of the kingdom','totk'],variants:[['Nintendo','Switch']]},
{franchise:'Sonic',title:'Sonic the Hedgehog',aliases:['sonic 1','sonic the hedgehog 1'],variants:[['SEGA','Mega Drive / Genesis'],['SEGA','Master System'],['SEGA','Game Gear']]},
{franchise:'Sonic',title:'Sonic the Hedgehog 2',aliases:['sonic 2'],variants:[['SEGA','Mega Drive / Genesis'],['SEGA','Master System'],['SEGA','Game Gear']]},
{franchise:'Sonic',title:'Sonic the Hedgehog 3',aliases:['sonic 3'],variants:[['SEGA','Mega Drive / Genesis']]},
{franchise:'Sonic',title:'Sonic & Knuckles',aliases:['sonic and knuckles'],variants:[['SEGA','Mega Drive / Genesis']]},
{franchise:'Sonic',title:'Sonic CD',aliases:['sonic the hedgehog cd'],variants:[['SEGA','Sega CD / Mega-CD']]},
{franchise:'Sonic',title:'Sonic 3D Blast',aliases:['sonic 3d','sonic 3d flickies island'],variants:[['SEGA','Mega Drive / Genesis'],['SEGA','Saturn']]},
{franchise:'Sonic',title:'Sonic R',aliases:[],variants:[['SEGA','Saturn']]},
{franchise:'Sonic',title:'Sonic Adventure',aliases:['sonic adventure dx'],variants:[['SEGA','Dreamcast'],['Nintendo','GameCube']]},
{franchise:'Sonic',title:'Sonic Adventure 2',aliases:['sonic adventure 2 battle','sa2'],variants:[['SEGA','Dreamcast'],['Nintendo','GameCube']]},
{franchise:'Sonic',title:'Sonic Heroes',aliases:[],variants:[['Nintendo','GameCube'],['PlayStation','PS2']]},
{franchise:'Sonic',title:'Sonic Unleashed',aliases:[],variants:[['Nintendo','Wii'],['PlayStation','PS2'],['PlayStation','PS3']]},
{franchise:'Sonic',title:'Sonic Generations',aliases:[],variants:[['Nintendo','3DS'],['PlayStation','PS3']]},
{franchise:'Sonic',title:'Sonic Mania Plus',aliases:['sonic mania'],variants:[['Nintendo','Switch'],['PlayStation','PS4']]},
{franchise:'Sonic',title:'Sonic Frontiers',aliases:[],variants:[['Nintendo','Switch'],['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:'Sonic',title:'Sonic Superstars',aliases:[],variants:[['Nintendo','Switch'],['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:'Sonic',title:'Sonic X Shadow Generations',aliases:['sonic x shadow','sonic shadow generations'],variants:[['Nintendo','Switch'],['PlayStation','PS4'],['PlayStation','PS5']]},

{franchise:'Mortal Kombat',title:'Mortal Kombat',aliases:['mortal kombat 1 classic','mk1 classic'],variants:[['Nintendo','SNES'],['SEGA','Mega Drive / Genesis'],['SEGA','Master System'],['SEGA','Game Gear']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat II',aliases:['mortal kombat 2','mk2'],variants:[['Nintendo','SNES'],['SEGA','Mega Drive / Genesis'],['SEGA','Game Gear']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat 3',aliases:['mk3'],variants:[['Nintendo','SNES'],['SEGA','Mega Drive / Genesis']]},
{franchise:'Mortal Kombat',title:'Ultimate Mortal Kombat 3',aliases:['umk3','ultimate mk3'],variants:[['Nintendo','SNES'],['SEGA','Mega Drive / Genesis'],['SEGA','Saturn']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat Trilogy',aliases:['mk trilogy'],variants:[['Nintendo','Nintendo 64'],['PlayStation','PS1']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat 4',aliases:['mk4'],variants:[['Nintendo','Nintendo 64'],['PlayStation','PS1']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat: Deadly Alliance',aliases:['deadly alliance','mk deadly alliance'],variants:[['Nintendo','GameCube'],['PlayStation','PS2']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat: Deception',aliases:['deception','mk deception'],variants:[['Nintendo','GameCube'],['PlayStation','PS2']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat: Armageddon',aliases:['armageddon','mk armageddon'],variants:[['Nintendo','Wii'],['PlayStation','PS2']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat (2011)',aliases:['mortal kombat 9','mk9','mortal kombat 2011'],variants:[['PlayStation','PS3'],['PlayStation','PS Vita']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat X',aliases:['mkx','mortal kombat 10'],variants:[['PlayStation','PS4']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat 11',aliases:['mk11'],variants:[['Nintendo','Switch'],['PlayStation','PS4']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat 11 Ultimate',aliases:['mk11 ultimate'],variants:[['Nintendo','Switch'],['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:'Mortal Kombat',title:'Mortal Kombat 1',aliases:['mk1','mortal kombat one'],variants:[['Nintendo','Switch'],['PlayStation','PS5']]},

{franchise:"Assassin's Creed",title:"Assassin's Creed",aliases:['assassins creed 1','ac1'],variants:[['PlayStation','PS3']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed II",aliases:['assassins creed 2','ac2'],variants:[['PlayStation','PS3']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed: Brotherhood",aliases:['ac brotherhood','assassins creed brotherhood'],variants:[['PlayStation','PS3']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed: Revelations",aliases:['ac revelations','assassins creed revelations'],variants:[['PlayStation','PS3']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed III",aliases:['assassins creed 3','ac3'],variants:[['PlayStation','PS3'],['Nintendo','Wii U']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed IV: Black Flag",aliases:['assassins creed 4 black flag','ac black flag','black flag'],variants:[['PlayStation','PS3'],['PlayStation','PS4'],['Nintendo','Wii U']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed Rogue",aliases:['ac rogue','assassins creed rogue'],variants:[['PlayStation','PS3']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed Unity",aliases:['ac unity','assassins creed unity'],variants:[['PlayStation','PS4']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed Syndicate",aliases:['ac syndicate','assassins creed syndicate'],variants:[['PlayStation','PS4']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed Origins",aliases:['ac origins','assassins creed origins'],variants:[['PlayStation','PS4']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed Odyssey",aliases:['ac odyssey','assassins creed odyssey'],variants:[['PlayStation','PS4']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed III Remastered",aliases:['ac3 remastered','assassins creed 3 remastered'],variants:[['Nintendo','Switch'],['PlayStation','PS4']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed: The Rebel Collection",aliases:['rebel collection','ac rebel collection','ac black flag switch','black flag switch'],variants:[['Nintendo','Switch']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed: The Ezio Collection",aliases:['ezio collection','ac ezio collection'],variants:[['Nintendo','Switch'],['PlayStation','PS4']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed Valhalla",aliases:['ac valhalla','assassins creed valhalla'],variants:[['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed Mirage",aliases:['ac mirage','assassins creed mirage'],variants:[['PlayStation','PS4'],['PlayStation','PS5']]},
{franchise:"Assassin's Creed",title:"Assassin's Creed Shadows",aliases:['ac shadows','assassins creed shadows'],variants:[['PlayStation','PS5']]}
];

const digitalCatalog={
  'Mortal Kombat 1':{label:'Digital disponível',platform:'PC • Steam',store:'Nuuvem',url:'https://www.nuuvem.com/br-pt/item/mortal-kombat-1'},
  'Sonic X Shadow Generations':{label:'Digital disponível',platform:'PC • Steam',store:'Nuuvem',url:'https://www.nuuvem.com/br-en/item/sonic-x-shadow-generations'},
  "Assassin's Creed Origins":{label:'Digital disponível',platform:'PC • Ubisoft Connect',store:'Nuuvem',url:'https://www.nuuvem.com/br-pt/item/assassins-creed-origins'},
  "Assassin's Creed Valhalla":{label:'Digital disponível',platform:'PC • Ubisoft Connect',store:'Nuuvem',url:'https://www.nuuvem.com/br-pt/item/assassins-creed-valhalla'}
};

const platformAliases=[
{platform:'Mega Drive / Genesis',aliases:['mega drive','megadrive','genesis','sega genesis']},
{platform:'Master System',aliases:['master system']},{platform:'Game Gear',aliases:['game gear']},{platform:'Sega CD / Mega-CD',aliases:['sega cd','mega cd','mega-cd']},{platform:'Saturn',aliases:['saturn','sega saturn']},{platform:'Dreamcast',aliases:['dreamcast']},
{platform:'NES',aliases:['nes','nintendo entertainment system']},{platform:'SNES',aliases:['snes','super nintendo']},{platform:'Game Boy',aliases:['game boy','gameboy']},{platform:'Game Boy Color',aliases:['game boy color','gbc']},{platform:'Game Boy Advance',aliases:['game boy advance','gba']},{platform:'Nintendo 64',aliases:['nintendo 64','n64']},{platform:'GameCube',aliases:['gamecube','game cube','gc']},{platform:'Wii U',aliases:['wii u','wiiu']},{platform:'Wii',aliases:['wii']},{platform:'Switch',aliases:['nintendo switch','switch']},{platform:'3DS',aliases:['3ds','nintendo 3ds']},
{platform:'PSP',aliases:['psp','playstation portable']},{platform:'PS Vita',aliases:['ps vita','vita']},{platform:'PS5',aliases:['ps5','playstation 5']},{platform:'PS4',aliases:['ps4','playstation 4']},{platform:'PS3',aliases:['ps3','playstation 3']},{platform:'PS2',aliases:['ps2','playstation 2']},{platform:'PS1',aliases:['ps1','psx','playstation 1']}
].sort((a,b)=>Math.max(...b.aliases.map(x=>x.length))-Math.max(...a.aliases.map(x=>x.length)));

/* Plataformas consideradas "retrô" (atalho Retrogamer da home). */
const retroPlatforms=['NES','SNES','Game Boy','Game Boy Color','Game Boy Advance','Nintendo 64','GameCube','Master System','Mega Drive / Genesis','Game Gear','Sega CD / Mega-CD','Saturn','Dreamcast','PS1','PS2'];

/* Plataformas em que faz sentido oferecer o bloco "Digital" (lojas atuais). */
const digitalPlatforms=['Switch','PS4','PS5'];

/* Metadados extras dos destaques (slug da página de tema, nome curto e universo). */
const trendMeta={
  'Grand Theft Auto VI':{slug:'gta-vi',short:'GTA VI',universe:'grand-theft-auto'},
  "Marvel's Wolverine":{slug:'marvels-wolverine',short:'Wolverine',universe:null},
  'The Legend of Zelda: Ocarina of Time':{slug:'ocarina-of-time-remake',short:'Ocarina of Time',universe:'the-legend-of-zelda'},
  "Fire Emblem: Fortune's Weave":{slug:'fire-emblem-fortunes-weave',short:'Fire Emblem',universe:'fire-emblem'}
};
trendingNow.forEach(t=>Object.assign(t,trendMeta[t.title]||{slug:t.title.toLowerCase().replace(/[^a-z0-9]+/g,'-'),short:t.title,universe:null}));

/* Categorias de merch/colecionáveis/fan-made (usadas nos atalhos de busca reais). */
const merchCategories=[
  {key:'acessorios',label:'Acessórios',hint:'Controles, suportes e periféricos'},
  {key:'colecionaveis',label:'Colecionáveis',hint:'Amiibo, figures e livros'},
  {key:'merch',label:'Merch e decoração',hint:'Quadros, placas e luminárias'},
  {key:'fanmade',label:'Fan-made',hint:'Artesanais e impressão 3D, sem licença confirmada'}
];
const merchTypes={
  amiibo:{cat:'colecionaveis',label:'Amiibo',term:'amiibo'},
  figure:{cat:'colecionaveis',label:'Figures e estátuas',term:'action figure'},
  livro:{cat:'colecionaveis',label:'Livros e guias',term:'livro guia oficial'},
  controle:{cat:'acessorios',label:'Controles e periféricos',term:'controle'},
  decoracao:{cat:'merch',label:'Decoração',term:'decoração'},
  artesanal:{cat:'fanmade',label:'Artesanais',term:'artesanal'},
  impressao3d:{cat:'fanmade',label:'Impressão 3D',term:'impressão 3d'}
};

/* Assets visuais canônicos.
   Preencher depois com imagens oficiais/licenciadas sem mudar os componentes:
   visualAssets.games[slug] = {hero:'https://...', cover:'https://...', merch:'https://...', fanmade:'https://...'}
   visualAssets.themes[slug] = {...}
   visualAssets.universes[slug] = {hero:'https://...'}
*/
const visualAssets={games:{},themes:{},universes:{}};

const trendingUpdated='21/09/2026'; /* data da curadoria manual dos destaques */

return {version:'Beta1-Claudinho-QuietLuxury',trendingUpdated,trendingNow,franchiseDirectory,collections,catalog,digitalCatalog,platformAliases,retroPlatforms,digitalPlatforms,merchCategories,merchTypes,visualAssets};
})();
