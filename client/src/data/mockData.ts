// Auto-generated file from /export

export interface Product {
  id: string;
  name: string;
  game: string;
  faction: string;
  category: string;
  points: number;
  image: string; // 🔥 added image field
  retailers: {
    store: string;
    price: number;
    inStock: boolean;
    url: string;
  }[];
}

export const gameCategories = {
  warhammer40k: [
    'Characters',
    'Battleline', 
    'Dedicated Transports',
    'Other',
    'Fortifications'
  ],
  ageofsigmar: [
    'Cavalry Heroes',
    'Infantry Heroes', 
    'Monster Heroes',
    'Cavalry',
    'Infantry',
    'Monster',
    'War machine',
    'Regiment of Renown',
    'Faction terrain',
    'Endless spell'
  ]
};

export const mockProducts: Product[] = [
  {
    id: "1",
    name: "Necrons Immortals",
    game: "warhammer40k",
    faction: "Necrons",
    category: "",
    points: 0,
    image: "https://www.warhammer.com/app/resources/catalog/product/920x950/99120110057_NECImmortalsLead.jpg?fm=webp&w=670&h=691",
    retailers: [
      {
        store: "War For Less",
        price: 52.5,
        inStock: false,
        url: "https://www.warforless.com.au/necrons-immortals-2020"
      }
    ]
  },
  {
    id: "2",
    name: "Infernus Squad",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "3",
    name: "Terminator Squad",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "4",
    name: "Primaris Crusader Squad",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: [
      {
        store: "War For Less",
        price: 78.8,
        inStock: false,
        url: "https://www.warforless.com.au/black-templars-primaris-crusader-squad"
      }
    ]
  },
  {
    id: "5",
    name: "Chaos Space Marines: Chosen",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: [
      {
        store: "War For Less",
        price: 78.8,
        inStock: false,
        url: "https://www.warforless.com.au/chaos-space-marines-chosen"
      }
    ]
  },
  {
    id: "6",
    name: "Slaves to Darkness: Chaos Chosen",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "7",
    name: "Cadian Shock Troops",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "8",
    name: "Clawlord on Gnaw-beast",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "9",
    name: "Arch-Warlock",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "10",
    name: "Clawlord",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "11",
    name: "Deathmaster",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "12",
    name: "Grey Seer",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "13",
    name: "Krittok Foulblade",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "14",
    name: "Master Moulder",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "15",
    name: "Warlock Bombardier",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "16",
    name: "Warlock Engineer",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "17",
    name: "Warlock Galvaneer",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "18",
    name: "Lord Skreech Verminking",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "19",
    name: "Thanquol on Boneripper",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "20",
    name: "Verminlord Corruptor",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "21",
    name: "Verminlord Deceiver",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "22",
    name: "Verminlord Warbringer",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "23",
    name: "Verminlord Warpseer",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "24",
    name: "Vizzik Skour, Prophet of the Horned Rat",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "25",
    name: "Grey Seer on Screaming Bell",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "26",
    name: "Plague Priest on Plague Furnace",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "27",
    name: "Acolyte Globadiers",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "28",
    name: "Clanrats",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "29",
    name: "Night Runners",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "30",
    name: "Plague Monks",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "31",
    name: "Plaguepack",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "32",
    name: "Rat Ogors",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "33",
    name: "Ratling Gun",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "34",
    name: "Stormfiends",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "35",
    name: "Stormvermin",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "36",
    name: "Warpfire Thrower",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "37",
    name: "Warplock Jezzails",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "38",
    name: "Warpvolt Scourgers",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "39",
    name: "Brood Terror",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "40",
    name: "Hell Pit Abomination",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "41",
    name: "Doom-Flayers",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "42",
    name: "Doomwheel",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "43",
    name: "Plagueclaw",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "44",
    name: "Ratling Warpblaster",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "45",
    name: "Warp Lightning Cannon",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "46",
    name: "Warp-Grinder",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  },
  {
    id: "47",
    name: "Gnawhole",
    game: "",
    faction: "",
    category: "",
    points: 0,
    image: "",
    retailers: []
  }
];
