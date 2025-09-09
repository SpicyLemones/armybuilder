export interface Product {
  id: string;
  name: string;
  game: 'warhammer40k' | 'ageofsigmar';
  faction: string;
  category: string;
  points: number;
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
  // Warhammer 40k Products
  {
    id: "1",
    name: "Captain in Terminator Armour",
    game: "warhammer40k",
    faction: "Space Marines",
    category: "Characters",
    points: 95,
    retailers: [
      {
        store: "Games Workshop",
        price: 45.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 40.50,
        inStock: true,
        url: "https://amazon.com"
      },
      {
        store: "MiniatureMarket",
        price: 38.25,
        inStock: false,
        url: "https://miniaturemarket.com"
      },
      {
        store: "Dicehead Games",
        price: 36.00,
        inStock: true,
        url: "https://diceheadgames.com"
      }
    ]
  },
  {
    id: "2",
    name: "Intercessor Squad",
    game: "warhammer40k",
    faction: "Space Marines",
    category: "Battleline",
    points: 90,
    retailers: [
      {
        store: "Games Workshop",
        price: 65.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 58.50,
        inStock: true,
        url: "https://amazon.com"
      },
      {
        store: "MiniatureMarket",
        price: 55.25,
        inStock: false,
        url: "https://miniaturemarket.com"
      },
      {
        store: "Dicehead Games",
        price: 52.00,
        inStock: true,
        url: "https://diceheadgames.com"
      }
    ]
  },
  {
    id: "3",
    name: "Rhino",
    game: "warhammer40k",
    faction: "Space Marines",
    category: "Dedicated Transports",
    points: 75,
    retailers: [
      {
        store: "Games Workshop",
        price: 55.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 49.50,
        inStock: true,
        url: "https://amazon.com"
      },
      {
        store: "MiniatureMarket",
        price: 46.75,
        inStock: true,
        url: "https://miniaturemarket.com"
      }
    ]
  },
  {
    id: "4",
    name: "Redemptor Dreadnought",
    game: "warhammer40k",
    faction: "Space Marines",
    category: "Other",
    points: 175,
    retailers: [
      {
        store: "Games Workshop",
        price: 85.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 76.50,
        inStock: true,
        url: "https://amazon.com"
      },
      {
        store: "MiniatureMarket",
        price: 72.25,
        inStock: true,
        url: "https://miniaturemarket.com"
      }
    ]
  },
  {
    id: "5",
    name: "Big Mek with Shokk Attack Gun",
    game: "warhammer40k",
    faction: "Orks",
    category: "Characters",
    points: 125,
    retailers: [
      {
        store: "Games Workshop",
        price: 55.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 49.50,
        inStock: true,
        url: "https://amazon.com"
      }
    ]
  },
  {
    id: "6",
    name: "Ork Boyz",
    game: "warhammer40k",
    faction: "Orks",
    category: "Battleline",
    points: 80,
    retailers: [
      {
        store: "Games Workshop",
        price: 40.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 36.00,
        inStock: false,
        url: "https://amazon.com"
      },
      {
        store: "MiniatureMarket",
        price: 34.00,
        inStock: true,
        url: "https://miniaturemarket.com"
      }
    ]
  },
  {
    id: "7",
    name: "Overlord",
    game: "warhammer40k",
    faction: "Necrons",
    category: "Characters",
    points: 95,
    retailers: [
      {
        store: "Games Workshop",
        price: 40.00,
        inStock: false,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 36.00,
        inStock: true,
        url: "https://amazon.com"
      }
    ]
  },
  {
    id: "8",
    name: "Necron Warriors",
    game: "warhammer40k",
    faction: "Necrons", 
    category: "Battleline",
    points: 120,
    retailers: [
      {
        store: "Games Workshop",
        price: 60.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 54.00,
        inStock: true,
        url: "https://amazon.com"
      },
      {
        store: "MiniatureMarket",
        price: 51.00,
        inStock: true,
        url: "https://miniaturemarket.com"
      }
    ]
  },
  {
    id: "9",
    name: "Aegis Defence Line",
    game: "warhammer40k",
    faction: "Imperial",
    category: "Fortifications",
    points: 0,
    retailers: [
      {
        store: "Games Workshop",
        price: 45.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 40.50,
        inStock: true,
        url: "https://amazon.com"
      }
    ]
  },

  // Age of Sigmar Products
  {
    id: "10",
    name: "Lord-Arcanum on Gryph-Charger",
    game: "ageofsigmar",
    faction: "Stormcast Eternals",
    category: "Cavalry Heroes",
    points: 155,
    retailers: [
      {
        store: "Games Workshop",
        price: 50.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 45.00,
        inStock: true,
        url: "https://amazon.com"
      },
      {
        store: "MiniatureMarket",
        price: 42.50,
        inStock: false,
        url: "https://miniaturemarket.com"
      }
    ]
  },
  {
    id: "11",
    name: "Knight-Incantor",
    game: "ageofsigmar",
    faction: "Stormcast Eternals",
    category: "Infantry Heroes",
    points: 125,
    retailers: [
      {
        store: "Games Workshop",
        price: 35.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 31.50,
        inStock: true,
        url: "https://amazon.com"
      }
    ]
  },
  {
    id: "12",
    name: "Stardrake",
    game: "ageofsigmar",
    faction: "Stormcast Eternals",
    category: "Monster Heroes",
    points: 500,
    retailers: [
      {
        store: "Games Workshop",
        price: 150.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 135.00,
        inStock: false,
        url: "https://amazon.com"
      }
    ]
  },
  {
    id: "13",
    name: "Liberators",
    game: "ageofsigmar",
    faction: "Stormcast Eternals",
    category: "Infantry",
    points: 115,
    retailers: [
      {
        store: "Games Workshop",
        price: 60.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 54.00,
        inStock: true,
        url: "https://amazon.com"
      },
      {
        store: "MiniatureMarket",
        price: 51.00,
        inStock: true,
        url: "https://miniaturemarket.com"
      }
    ]
  },
  {
    id: "14",
    name: "Vanguard-Hunters",
    game: "ageofsigmar",
    faction: "Stormcast Eternals",
    category: "Cavalry",
    points: 110,
    retailers: [
      {
        store: "Games Workshop",
        price: 65.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 58.50,
        inStock: true,
        url: "https://amazon.com"
      }
    ]
  },
  {
    id: "15",
    name: "Celestar Ballista",
    game: "ageofsigmar",
    faction: "Stormcast Eternals",
    category: "War machine",
    points: 140,
    retailers: [
      {
        store: "Games Workshop",
        price: 45.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 40.50,
        inStock: false,
        url: "https://amazon.com"
      }
    ]
  },
  {
    id: "16",
    name: "Orruk Megaboss",
    game: "ageofsigmar",
    faction: "Ironjawz",
    category: "Infantry Heroes",
    points: 140,
    retailers: [
      {
        store: "Games Workshop",
        price: 40.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 36.00,
        inStock: true,
        url: "https://amazon.com"
      }
    ]
  },
  {
    id: "17",
    name: "Orruk Ardboys",
    game: "ageofsigmar",
    faction: "Ironjawz",
    category: "Infantry",
    points: 90,
    retailers: [
      {
        store: "Games Workshop",
        price: 50.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 45.00,
        inStock: false,
        url: "https://amazon.com"
      },
      {
        store: "MiniatureMarket",
        price: 42.50,
        inStock: true,
        url: "https://miniaturemarket.com"
      }
    ]
  },
  {
    id: "18",
    name: "Morghast Harbingers",
    game: "ageofsigmar",
    faction: "Ossiarch Bonereapers",
    category: "Monster",
    points: 210,
    retailers: [
      {
        store: "Games Workshop",
        price: 70.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 63.00,
        inStock: true,
        url: "https://amazon.com"
      }
    ]
  },
  {
    id: "19",
    name: "Bone Tithe Nexus",
    game: "ageofsigmar",
    faction: "Ossiarch Bonereapers",
    category: "Faction terrain",
    points: 0,
    retailers: [
      {
        store: "Games Workshop",
        price: 55.00,
        inStock: false,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 49.50,
        inStock: true,
        url: "https://amazon.com"
      }
    ]
  },
  {
    id: "20",
    name: "Purple Sun of Shyish",
    game: "ageofsigmar",
    faction: "Death",
    category: "Endless spell",
    points: 70,
    retailers: [
      {
        store: "Games Workshop",
        price: 30.00,
        inStock: true,
        url: "https://www.games-workshop.com"
      },
      {
        store: "Amazon",
        price: 27.00,
        inStock: true,
        url: "https://amazon.com"
      }
    ]
  }
];