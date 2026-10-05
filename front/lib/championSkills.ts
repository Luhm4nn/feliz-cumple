// Definición de habilidades, pasivas, citas épicas y efectos por campeón para el Minijuego y la Web

export interface ChampionKit {
  championId: string;
  name: string;
  title: string;
  quote: string; // Frase icónica del campeón para la web
  partyPerk: string; // Efecto especial del campeón en la fiesta
  potionRecommendation: string; // Poción temática
  themeColor: string; // Color primario de aura
  soundType: "steel" | "arcane" | "rocket" | "shadow" | "light" | "earth" | "beast";
  passive: {
    name: string;
    description: string;
    type: "foxfire" | "windshield" | "speedfrenzy" | "nearmiss_bonus" | "magnet" | "granite_shield" | "stealth" | "generic";
  };
  active: {
    name: string;
    description: string;
    cooldownFrames: number; // Cooldown en frames (60fps)
    type: "dash_invuln" | "windwall" | "rocket_nuke" | "shadow_swap" | "laser_beam" | "unstoppable_slam" | "shroom_bomb" | "whirlwind";
  };
}

// Campeones con kits específicos ultra detallados
export const CHAMPION_KITS: Record<string, ChampionKit> = {
  Ahri: {
    championId: "Ahri",
    name: "Ahri",
    title: "La Mujer Zorro de Nueve Colas",
    quote: "¿Confías en mí? La magia de Jonia guiará nuestra noche.",
    partyPerk: "Orbes Espirituales: Encanto natural para que la música nunca decaiga.",
    potionRecommendation: "Brebaje del Alma de Jonia (Gin Tonic con frutos rojos)",
    themeColor: "#0ac8b9",
    soundType: "arcane",
    passive: {
      name: "Fuego Zorro Orbital",
      description: "3 orbes espirituales orbitan a Ahri y zappean automáticamente obstáculos cercanos.",
      type: "foxfire",
    },
    active: {
      name: "Impulso Espiritual",
      description: "Triple salto hacia adelante con invulnerabilidad temporal y ráfaga mística.",
      cooldownFrames: 280,
      type: "dash_invuln",
    },
  },
  Brand: {
    championId: "Brand",
    name: "Brand",
    title: "La Venganza Ardiente",
    quote: "Este cuerpo arde con el fuego de las Runas... ¡y prende el carbón de los choripanes!",
    partyPerk: "Fuego del Asador: Mantiene la parrilla al rojo vivo toda la noche.",
    potionRecommendation: "Poción Ígnea de Fuego Valyrio (Fernet con Coca)",
    themeColor: "#ff5722",
    soundType: "rocket",
    passive: {
      name: "Llamarada Volátil",
      description: "Los proyectiles destruidos generan chispas que queman obstáculos cercanos.",
      type: "speedfrenzy",
    },
    active: {
      name: "Pilar de Fuego",
      description: "Erupción colosal de fuego que incinera todo en un área y protege a los aliados.",
      cooldownFrames: 260,
      type: "laser_beam",
    },
  },
  Yasuo: {
    championId: "Yasuo",
    name: "Yasuo",
    title: "El Imperdonable",
    quote: "La muerte es como el viento, siempre a mi lado... ¡pero hoy hay choripanes!",
    partyPerk: "Muro de Viento al Asador: Desvía el humo del asado y protege el fernet.",
    potionRecommendation: "Té de Jonia con Saúco y Fernet Artesanal",
    themeColor: "#c8aa6e",
    soundType: "steel",
    passive: {
      name: "Camino del Vagabundo",
      description: "Genera un escudo de viento pasivo que absorbe automáticamente un impacto fatal.",
      type: "windshield",
    },
    active: {
      name: "Muro de Viento",
      description: "Despliega una pared de viento impenetrable que desintegra todos los proyectiles por 4s.",
      cooldownFrames: 320,
      type: "windwall",
    },
  },
  Jinx: {
    championId: "Jinx",
    name: "Jinx",
    title: "La Bala Perdida",
    quote: "¡Las reglas están hechas para romperse! ¡Como las piñatas o los nexos!",
    partyPerk: "Emoción Caótica: El boliche Fendy tiembla si Jinx activa su racha.",
    potionRecommendation: "Poción Eléctrica de Shimmer (Vodka con Energizante)",
    themeColor: "#e84057",
    soundType: "rocket",
    passive: {
      name: "¡A Toda Máquina!",
      description: "Al recolectar Poros y Porogalletas obtienes un 60% de velocidad y racha de puntos.",
      type: "speedfrenzy",
    },
    active: {
      name: "¡Supermegacohete Mortal!",
      description: "Dispara un cohete gigante que atraviesa toda la pantalla aniquilando amenazas.",
      cooldownFrames: 300,
      type: "rocket_nuke",
    },
  },
  Zed: {
    championId: "Zed",
    name: "Zed",
    title: "El Maestro de las Sombras",
    quote: "La sombra que no ves es la que te roba el último choripán.",
    partyPerk: "Clon de Sombras: Hace la fila de las bebidas en dos lugares a la vez.",
    potionRecommendation: "Elixir de las Sombras (Whisky con hielo tallado)",
    themeColor: "#a055ff",
    soundType: "shadow",
    passive: {
      name: "Desprecio por los Débiles",
      description: "Las esquivas rasantes (casi al rozar) otorgan triple puntuación y combo extra.",
      type: "nearmiss_bonus",
    },
    active: {
      name: "Sombra Viviente",
      description: "Teletransporte instantáneo dejando una sombra que absorbe coleccionables.",
      cooldownFrames: 240,
      type: "shadow_swap",
    },
  },
  Lux: {
    championId: "Lux",
    name: "Lux",
    title: "La Dama Luminosa",
    quote: "¡Demacia! Iluminemos la Grieta y la pista de Fendy con chispa pura.",
    partyPerk: "Prisma Festivo: Refleja las luces de la fiesta creando un aura de victoria.",
    potionRecommendation: "Limonada Solar con Cerveza Rubia Helada",
    themeColor: "#f0e6d2",
    soundType: "light",
    passive: {
      name: "Iluminación Solar",
      description: "Campo magnético luminoso que atrae automáticamente monedas y Poros hacia ti.",
      type: "magnet",
    },
    active: {
      name: "Chispa Final",
      description: "Canaliza un rayo láser celestial colosal que desintegra una columna completa.",
      cooldownFrames: 270,
      type: "laser_beam",
    },
  },
  Malphite: {
    championId: "Malphite",
    name: "Malphite",
    title: "El Fragmento del Monolito",
    quote: "¡Sólido como una roca! Ni cuatro choripanes me mueven.",
    partyPerk: "Monolito de la Resistencia: Aguanta toda la noche hasta que salga el sol.",
    potionRecommendation: "Cerveza Negra Imperial en Chopp Gigante",
    themeColor: "#785a28",
    soundType: "earth",
    passive: {
      name: "Escudo de Granito",
      description: "Comienza con 4 vidas en vez de 3 y su escudo de piedra regenera vida en racha.",
      type: "granite_shield",
    },
    active: {
      name: "Fuerza Imparable",
      description: "Carga imparable hacia arriba que arrasa con cualquier obstáculo en el camino.",
      cooldownFrames: 340,
      type: "unstoppable_slam",
    },
  },
  Teemo: {
    championId: "Teemo",
    name: "Teemo",
    title: "El Explorador Veloz",
    quote: "¡El tamaño no importa cuando se trata de la parrilla de Congreso 533!",
    partyPerk: "Radar de Hongos: Encuentra siempre el mejor lugar para sentarse.",
    potionRecommendation: "Sidra Espumante de Bandle con Manzana",
    themeColor: "#0ac8b9",
    soundType: "beast",
    passive: {
      name: "Camuflaje de Bandle",
      description: "Si te quedas quieto un breve instante eres inmune al daño de proyectiles.",
      type: "stealth",
    },
    active: {
      name: "Trampa de Hongos Nocivos",
      description: "Planta hongos venenosos que explotan al entrar en contacto con proyectiles enemigos.",
      cooldownFrames: 220,
      type: "shroom_bomb",
    },
  },
};

// Generador dinámico para cualquier campeón no listado explícitamente
export function getChampionKit(championId?: string | null, championRole?: string | null): ChampionKit {
  if (championId && CHAMPION_KITS[championId]) {
    return CHAMPION_KITS[championId];
  }

  const role = championRole || "Fighter";
  const name = championId || "Invocador";

  // Adapta inteligentemente según el rol oficial
  if (role.toLowerCase().includes("assassin") || role.toLowerCase().includes("asesin")) {
    return {
      championId: name,
      name,
      title: "Asesino de las Sombras",
      quote: "¡Un corte certero antes de que sirvan la comida!",
      partyPerk: "Reflejos de Asesino: El primero en agarrar el choripán recién salido.",
      potionRecommendation: "Poción de Sombra Helada con Ron",
      themeColor: "#a055ff",
      soundType: "shadow",
      passive: {
        name: "Instinto Asesino",
        description: "Bonificación de puntos doble al esquivar proyectiles a corta distancia.",
        type: "nearmiss_bonus",
      },
      active: {
        name: "Destello Letal",
        description: "Salto hacia adelante desintegrando proyectiles en la trayectoria.",
        cooldownFrames: 260,
        type: "dash_invuln",
      },
    };
  }

  if (role.toLowerCase().includes("mage") || role.toLowerCase().includes("mago")) {
    return {
      championId: name,
      name,
      title: "Canalizador Arcano",
      quote: "La magia de la Grieta se celebra con buena compañía y brindis.",
      partyPerk: "Aura Arcana: Atrae las mejores conversaciones de la noche.",
      potionRecommendation: "Poción de Maná Cristalina con Vodka Blue",
      themeColor: "#0ac8b9",
      soundType: "arcane",
      passive: {
        name: "Imán Arcano",
        description: "Atrae coleccionables cercanos gracias a tu resonancia mágica.",
        type: "magnet",
      },
      active: {
        name: "Onda Arcana",
        description: "Destruye todos los proyectiles en pantalla con un pulso de maná.",
        cooldownFrames: 280,
        type: "laser_beam",
      },
    };
  }

  if (role.toLowerCase().includes("tank") || role.toLowerCase().includes("tanque")) {
    return {
      championId: name,
      name,
      title: "Coloso Inquebrantable",
      quote: "¡Dejen que vengan los proyectiles, no daré ni un paso atrás!",
      partyPerk: "Resistencia Monolítica: Custodia la conservadora de bebidas toda la noche.",
      potionRecommendation: "Chopp de Birra Artesanal Doble Malta",
      themeColor: "#785a28",
      soundType: "earth",
      passive: {
        name: "Placas de Acero",
        description: "Cuentas con 4 vidas en el minijuego y mayor tolerancia a impactos.",
        type: "granite_shield",
      },
      active: {
        name: "Fortaleza Colosal",
        description: "Invulnerabilidad absoluta por 4 segundos destruyendo lo que toques.",
        cooldownFrames: 340,
        type: "unstoppable_slam",
      },
    };
  }

  if (role.toLowerCase().includes("marksman") || role.toLowerCase().includes("tirador")) {
    return {
      championId: name,
      name,
      title: "Tirador Implacable",
      quote: "¡Apunto directo al corazón de la fiesta!",
      partyPerk: "Puntería Precisa: Nunca derrama una gota al servir tragos.",
      potionRecommendation: "Poción Hiperbórea con Gin y Tónica",
      themeColor: "#e84057",
      soundType: "rocket",
      passive: {
        name: "Cadencia de Fuego",
        description: "Los coleccionables otorgan velocidad extra y racha de puntos.",
        type: "speedfrenzy",
      },
      active: {
        name: "Lluvia de Proyectiles",
        description: "Dispara ráfagas que limpian el camino de obstáculos.",
        cooldownFrames: 290,
        type: "rocket_nuke",
      },
    };
  }

  // Luchador / Soporte por defecto
  return {
    championId: name,
    name,
    title: "Gladiador de la Grieta",
    quote: "¡Por el cumpleañero y por la gloria de Congreso 533!",
    partyPerk: "Espíritu de Equipo: El alma de la previa y del torneo en Fendy.",
    potionRecommendation: "Poción Clásica de Vida (Cerveza Helada)",
    themeColor: "#c8aa6e",
    soundType: "steel",
    passive: {
      name: "Escudo del Batallón",
      description: "Escudo que absorbe el primer daño recibido en la partida.",
      type: "windshield",
    },
    active: {
      name: "Torbellino de Acero",
      description: "Giro arrollador que despeja amenazas en un amplio radio.",
      cooldownFrames: 300,
      type: "whirlwind",
    },
  };
}

// Mapa de IDs numéricos para los modelos 3D de la CDN de modelviewer.lol (Todos los campeones de LoL)
export const CHAMPION_MODEL_IDS: Record<string, number> = {
  aatrox: 266000,
  ahri: 103000,
  akali: 84000,
  akshan: 166000,
  alistar: 12000,
  ambessa: 799000,
  amumu: 32000,
  anivia: 34000,
  annie: 1000,
  aphelios: 523000,
  ashe: 22000,
  aurelionsol: 136000,
  aurora: 893000,
  azir: 268000,
  bard: 432000,
  belveth: 200000,
  blitzcrank: 53000,
  brand: 63000,
  braum: 201000,
  briar: 233000,
  caitlyn: 51000,
  camille: 164000,
  cassiopeia: 69000,
  chogath: 31000,
  corki: 42000,
  darius: 122000,
  diana: 131000,
  draven: 119000,
  drmundo: 36000,
  ekko: 245000,
  elise: 60000,
  evelynn: 28000,
  ezreal: 81000,
  fiddlesticks: 9000,
  fiora: 114000,
  fizz: 105000,
  galio: 3000,
  gangplank: 41000,
  garen: 86000,
  gnar: 150000,
  gragas: 79000,
  graves: 104000,
  gwen: 887000,
  hecarim: 120000,
  heimerdinger: 74000,
  hwei: 910000,
  illaoi: 420000,
  irelia: 39000,
  ivern: 427000,
  janna: 40000,
  jarvaniv: 59000,
  jax: 24000,
  jayce: 126000,
  jhin: 202000,
  jinx: 222000,
  kaisa: 145000,
  kalista: 429000,
  karma: 43000,
  karthus: 30000,
  kassadin: 38000,
  katarina: 55000,
  kayle: 10000,
  kayn: 141000,
  kennen: 85000,
  khazix: 121000,
  kindred: 203000,
  kled: 240000,
  kogmaw: 96000,
  ksante: 897000,
  leblanc: 7000,
  leesin: 64000,
  leona: 89000,
  lillia: 876000,
  lissandra: 127000,
  locke: 805000,
  lucian: 236000,
  lulu: 117000,
  lux: 99000,
  malphite: 54000,
  malzahar: 90000,
  maokai: 57000,
  masteryi: 11000,
  mel: 800000,
  milio: 902000,
  missfortune: 21000,
  monkeyking: 62000,
  wukong: 62000,
  mordekaiser: 82000,
  morgana: 25000,
  naafiri: 950000,
  nami: 267000,
  nasus: 75000,
  nautilus: 111000,
  neeko: 518000,
  nidalee: 76000,
  nilah: 895000,
  nocturne: 56000,
  nunu: 20000,
  nunuwillump: 20000,
  olaf: 2000,
  orianna: 61000,
  ornn: 516000,
  pantheon: 80000,
  poppy: 78000,
  pyke: 555000,
  qiyana: 246000,
  quinn: 133000,
  rakan: 497000,
  rammus: 33000,
  reksai: 421000,
  rell: 526000,
  renata: 888000,
  renataglasc: 888000,
  renekton: 58000,
  rengar: 107000,
  riven: 92000,
  rumble: 68000,
  ryze: 13000,
  samira: 360000,
  sejuani: 113000,
  senna: 235000,
  seraphine: 147000,
  sett: 875000,
  shaco: 35000,
  shen: 98000,
  shyvana: 102000,
  singed: 27000,
  sion: 14000,
  sivir: 15000,
  skarner: 72000,
  smolder: 901000,
  sona: 37000,
  soraka: 16000,
  swain: 50000,
  sylas: 517000,
  syndra: 134000,
  tahmkench: 223000,
  taliyah: 163000,
  talon: 91000,
  taric: 44000,
  teemo: 17000,
  thresh: 412000,
  tristana: 18000,
  trundle: 48000,
  tryndamere: 23000,
  twistedfate: 4000,
  twitch: 29000,
  udyr: 77000,
  urgot: 6000,
  varus: 110000,
  vayne: 67000,
  veigar: 45000,
  velkoz: 161000,
  vex: 711000,
  vi: 254000,
  viego: 234000,
  viktor: 112000,
  vladimir: 8000,
  volibear: 106000,
  warwick: 19000,
  xayah: 498000,
  xerath: 101000,
  xinzhao: 5000,
  yasuo: 157000,
  yone: 777000,
  yorick: 83000,
  yunara: 804000,
  yuumi: 350000,
  zaahen: 904000,
  zac: 154000,
  zed: 238000,
  zeri: 221000,
  ziggs: 115000,
  zilean: 26000,
  zoe: 142000,
  zyra: 143000,
};

// Obtiene la URL del modelo 3D optimizado (GLB comprimido) para el visor Three.js
export function getChampionModelUrl(
  championNameOrId?: string | null,
  championKey?: string | null
): string | null {
  if (!championNameOrId) return null;

  const alias = championNameOrId
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  let modelNum = championKey ? Number(championKey) * 1000 : null;

  if (!modelNum || isNaN(modelNum)) {
    modelNum = CHAMPION_MODEL_IDS[alias] || CHAMPION_MODEL_IDS[championNameOrId.toLowerCase()] || null;
  }

  if (!modelNum) {
    return null;
  }

  return `https://cdn.modelviewer.lol/lol/models/${alias}/${modelNum}/model-lite-compressed.wasm?c=1`;
}

