export interface ChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  tags: string[];
  roleEs: string;
  iconUrl: string;
  splashUrl: string;
  loadingUrl: string;
  isLocked?: boolean;
  lockedBy?: string | null;
}

export interface ChampionAbility {
  id: string;
  key: "P" | "Q" | "W" | "E" | "R";
  name: string;
  description: string;
  imageUrl: string;
}

export interface ChampionDetail extends ChampionSummary {
  lore: string;
  abilities: ChampionAbility[];
}

interface RawChampionSummary {
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  tags?: string[];
  image: {
    full: string;
  };
}

interface RawSpell {
  id: string;
  name: string;
  description: string;
  image: {
    full: string;
  };
}

interface RawChampionDetail extends RawChampionSummary {
  lore?: string;
  passive?: {
    name: string;
    description: string;
    image: {
      full: string;
    };
  };
  spells?: RawSpell[];
}

export const ROLE_TRANSLATIONS: Record<string, string> = {
  Fighter: "Luchador",
  Mage: "Mago",
  Assassin: "Asesino",
  Marksman: "Tirador",
  Support: "Soporte",
  Tank: "Tanque",
};

let cachedVersion: string | null = null;
let cachedChampions: ChampionSummary[] | null = null;
const championDetailCache = new Map<string, ChampionDetail>();

export async function getLatestDDragonVersion(): Promise<string> {
  if (cachedVersion) return cachedVersion;
  try {
    const res = await fetch("https://ddragon.leagueoflegends.com/api/versions.json");
    if (!res.ok) throw new Error("Failed to fetch Riot version");
    const versions = (await res.json()) as string[];
    cachedVersion = versions[0] || "16.19.1";
    return cachedVersion;
  } catch (err) {
    console.error("Error fetching version, using fallback:", err);
    return "16.19.1";
  }
}

export async function getAllChampions(): Promise<ChampionSummary[]> {
  if (cachedChampions) return cachedChampions;

  const version = await getLatestDDragonVersion();
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/es_ES/champion.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch champions");
    const json = (await res.json()) as { data: Record<string, RawChampionSummary> };
    const data = json.data;

    const list: ChampionSummary[] = Object.values(data).map((c) => {
      const primaryTag = c.tags && c.tags[0] ? c.tags[0] : "Fighter";
      const roleEs = ROLE_TRANSLATIONS[primaryTag] || primaryTag;

      return {
        id: c.id,
        key: c.key,
        name: c.name,
        title: c.title,
        blurb: c.blurb,
        tags: c.tags || ["Fighter"],
        roleEs,
        iconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${c.image.full}`,
        splashUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${c.id}_0.jpg`,
        loadingUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${c.id}_0.jpg`,
      };
    });

    list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    cachedChampions = list;
    return list;
  } catch (err) {
    console.error("Error fetching all champions:", err);
    return [];
  }
}

export async function getChampionDetails(championId: string): Promise<ChampionDetail | null> {
  if (championDetailCache.has(championId)) {
    return championDetailCache.get(championId)!;
  }

  const version = await getLatestDDragonVersion();
  const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/es_ES/champion/${championId}.json`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as { data: Record<string, RawChampionDetail> };
    const champ = json.data[championId];
    if (!champ) return null;

    const abilities: ChampionAbility[] = [];

    // Pasiva
    if (champ.passive) {
      abilities.push({
        id: `${championId}-P`,
        key: "P",
        name: champ.passive.name,
        description: champ.passive.description.replace(/<[^>]*>?/gm, ""),
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/passive/${champ.passive.image.full}`,
      });
    }

    // Spells: Q, W, E, R
    const spellKeys: Array<"Q" | "W" | "E" | "R"> = ["Q", "W", "E", "R"];
    if (champ.spells && Array.isArray(champ.spells)) {
      champ.spells.forEach((s, idx) => {
        abilities.push({
          id: s.id,
          key: spellKeys[idx] || "Q",
          name: s.name,
          description: s.description.replace(/<[^>]*>?/gm, ""),
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/spell/${s.image.full}`,
        });
      });
    }

    const primaryTag = champ.tags && champ.tags[0] ? champ.tags[0] : "Fighter";
    const roleEs = ROLE_TRANSLATIONS[primaryTag] || primaryTag;

    const detail: ChampionDetail = {
      id: champ.id,
      key: champ.key,
      name: champ.name,
      title: champ.title,
      blurb: champ.blurb,
      lore: champ.lore || champ.blurb,
      tags: champ.tags || ["Fighter"],
      roleEs,
      iconUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champ.image.full}`,
      splashUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.id}_0.jpg`,
      loadingUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champ.id}_0.jpg`,
      abilities,
    };

    championDetailCache.set(championId, detail);
    return detail;
  } catch (err) {
    console.error(`Error loading details for champion ${championId}:`, err);
    return null;
  }
}
