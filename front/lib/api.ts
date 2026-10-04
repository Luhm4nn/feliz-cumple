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

export interface GuestItem {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  rsvpStatus: "ATTENDING" | "TENTATIVE" | "DECLINED";
  dietaryNotes?: string | null;
  message?: string | null;
  championId?: string | null;
  championName?: string | null;
  championTitle?: string | null;
  championRole?: string | null;
  championImage?: string | null;
  scores?: Array<{ score: number }>;
}

export interface ScoreItem {
  id: string;
  score: number;
  championId: string;
  baronStolen: boolean;
  createdAt: string;
  player: {
    name: string;
    avatar?: string | null;
    championName?: string | null;
    championImage?: string | null;
    championRole?: string | null;
  };
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000/api";

export async function getChampions(): Promise<{
  champions: ChampionSummary[];
  total: number;
  lockedCount: number;
}> {
  const res = await fetch(`${API_BASE}/champions`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener campeones");
  return res.json();
}

export async function getChampionDetails(id: string): Promise<ChampionDetail | null> {
  const res = await fetch(`${API_BASE}/champions/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.champion;
}

export async function getGuests(): Promise<GuestItem[]> {
  const res = await fetch(`${API_BASE}/rsvp`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener invitados");
  const data = await res.json();
  return data.guests || [];
}

export async function submitRsvp(payload: Partial<GuestItem>): Promise<{
  success: boolean;
  message: string;
  guest: GuestItem;
}> {
  const res = await fetch(`${API_BASE}/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Error al procesar la confirmación");
  }
  return data;
}

export async function getScores(): Promise<ScoreItem[]> {
  const res = await fetch(`${API_BASE}/scores`, { cache: "no-store" });
  if (!res.ok) throw new Error("Error al obtener puntuaciones");
  const data = await res.json();
  return data.scores || [];
}

export async function submitScore(payload: {
  email: string;
  score: number;
  championId: string;
  baronStolen: boolean;
}): Promise<{ success: boolean; score: any }> {
  const res = await fetch(`${API_BASE}/scores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Error al registrar puntuación");
  }
  return data;
}
