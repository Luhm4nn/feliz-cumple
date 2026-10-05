import { Request, Response } from "express";
import { getAllChampions, getChampionDetails } from "../services/riot";
import { prisma, isPrismaConfigured } from "../services/prisma";
import { inMemoryGuests } from "./rsvp.controller";

export async function getChampions(req: Request, res: Response) {
  try {
    const champions = await getAllChampions();

    const lockedMap: Record<string, string> = {};
    if (isPrismaConfigured()) {
      try {
        const guestsWithChampions = await prisma.guest.findMany({
          where: {
            championId: { not: null },
          },
          select: {
            championId: true,
            name: true,
            email: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
        });

        const seenEmails = new Set<string>();
        guestsWithChampions.forEach((g) => {
          const normEmail = (g.email || "").trim().toLowerCase();
          if (normEmail) {
            if (seenEmails.has(normEmail)) return; // Ignorar registros anteriores de la misma persona
            seenEmails.add(normEmail);
          }
          if (g.championId) {
            lockedMap[g.championId] = g.name;
          }
        });
      } catch (dbError) {
        console.warn("Base de datos no disponible aún para verificar bloqueo:", dbError);
      }
    }

    // Fallback con memoria temporal si la BD no arrojó bloqueos
    if (Object.keys(lockedMap).length === 0 && inMemoryGuests.length > 0) {
      const seenEmails = new Set<string>();
      [...inMemoryGuests].reverse().forEach((g) => {
        const normEmail = (g.email || "").trim().toLowerCase();
        if (normEmail) {
          if (seenEmails.has(normEmail)) return;
          seenEmails.add(normEmail);
        }
        if (g.championId) {
          lockedMap[g.championId] = g.name;
        }
      });
    }

    const result = champions.map((c) => ({
      ...c,
      isLocked: Boolean(lockedMap[c.id]),
      lockedBy: lockedMap[c.id] || null,
    }));

    return res.json({
      champions: result,
      total: result.length,
      lockedCount: Object.keys(lockedMap).length,
    });
  } catch (error) {
    console.error("Error in getChampions:", error);
    return res.status(500).json({ error: "Error al cargar los campeones" });
  }
}

export async function getChampionById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Champion ID requerido" });
    }
    const champId = Array.isArray(id) ? id[0] : id;
    const detail = await getChampionDetails(champId);
    if (!detail) {
      return res.status(404).json({ error: "Campeón no encontrado" });
    }

    return res.json({ champion: detail });
  } catch (error) {
    console.error("Error in getChampionById:", error);
    return res.status(500).json({ error: "Error al obtener detalles del campeón" });
  }
}
