import { Request, Response } from "express";
import { getAllChampions, getChampionDetails } from "../services/riot";
import { prisma, isPrismaConfigured } from "../services/prisma";

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
          },
        });

        guestsWithChampions.forEach((g) => {
          if (g.championId) {
            lockedMap[g.championId] = g.name;
          }
        });
      } catch (dbError) {
        console.warn("Base de datos no disponible aún para verificar bloqueo:", dbError);
      }
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
