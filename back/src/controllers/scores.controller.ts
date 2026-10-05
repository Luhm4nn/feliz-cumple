import { Request, Response } from "express";
import { prisma, isPrismaConfigured } from "../services/prisma";

interface InMemScore {
  id: string;
  score: number;
  championId: string;
  baronStolen: boolean;
  createdAt: string;
  player: {
    name: string;
    avatar: string | null;
    championName: string | null;
    championImage: string | null;
    championRole: string | null;
  };
}

const inMemoryScores: InMemScore[] = [];

export async function getScores(req: Request, res: Response) {
  try {
    if (isPrismaConfigured()) {
      try {
        const allScores = await prisma.minigameScore.findMany({
          orderBy: { score: "desc" },
          include: {
            guest: {
              select: {
                id: true,
                name: true,
                avatar: true,
                championName: true,
                championImage: true,
                championRole: true,
              },
            },
          },
        });

        // Agrupar para devolver estrictamente el MEJOR puntaje de cada jugador
        const seenGuests = new Set<string>();
        const uniqueScores: typeof allScores = [];

        for (const s of allScores) {
          const guestKey = s.guestId || s.guest.name;
          if (!seenGuests.has(guestKey)) {
            seenGuests.add(guestKey);
            uniqueScores.push(s);
            if (uniqueScores.length >= 10) break;
          }
        }

        return res.json({
          scores: uniqueScores.map((s) => ({
            id: s.id,
            score: s.score,
            championId: s.championId,
            baronStolen: s.baronStolen,
            createdAt: s.createdAt,
            player: {
              name: s.guest.name,
              avatar: s.guest.avatar,
              championName: s.guest.championName,
              championImage: s.guest.championImage,
              championRole: s.guest.championRole,
            },
          })),
        });
      } catch {
        // Fallback abajo
      }
    }

    const sorted = [...inMemoryScores].sort((a, b) => b.score - a.score);
    const seenMem = new Set<string>();
    const uniqueMem: InMemScore[] = [];

    for (const s of sorted) {
      const key = s.player.name || s.id;
      if (!seenMem.has(key)) {
        seenMem.add(key);
        uniqueMem.push(s);
        if (uniqueMem.length >= 10) break;
      }
    }

    return res.json({ scores: uniqueMem });
  } catch (err) {
    console.error("Error in getScores:", err);
    return res.status(500).json({ error: "Error al obtener puntuaciones" });
  }
}

export async function submitScore(req: Request, res: Response) {
  try {
    const { email, score, championId, baronStolen = false } = req.body;

    if (!email || score === undefined || !championId) {
      return res.status(400).json({ error: "Email, score y championId son requeridos" });
    }

    if (isPrismaConfigured()) {
      try {
        const guest = await prisma.guest.findUnique({
          where: { email },
        });

        if (!guest) {
          return res.status(404).json({
            error: "Debes registrar tu asistencia antes de guardar tu récord",
          });
        }

        const newScore = await prisma.minigameScore.create({
          data: {
            guestId: guest.id,
            score: Number(score),
            championId,
            baronStolen: Boolean(baronStolen),
          },
        });

        return res.json({ success: true, score: newScore });
      } catch {
        // Fallback abajo
      }
    }

    const scoreObj: InMemScore = {
      id: `score-${Date.now()}`,
      score: Number(score),
      championId,
      baronStolen: Boolean(baronStolen),
      createdAt: new Date().toISOString(),
      player: {
        name: email.split("@")[0] || "Invocador",
        avatar: null,
        championName: championId,
        championImage: null,
        championRole: "Luchador",
      },
    };
    inMemoryScores.push(scoreObj);
    return res.json({ success: true, score: scoreObj });
  } catch (err) {
    console.error("Error in submitScore:", err);
    return res.status(500).json({ error: "Error al guardar puntuación" });
  }
}
