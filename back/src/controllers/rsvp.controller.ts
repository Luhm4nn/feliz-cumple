import { Request, Response } from "express";
import { prisma, isPrismaConfigured } from "../services/prisma";

interface GuestRecord {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  rsvpStatus: string;
  dietaryNotes: string | null;
  message: string | null;
  championId: string | null;
  championName: string | null;
  championTitle: string | null;
  championRole: string | null;
  championImage: string | null;
  scores: Array<{ score: number }>;
  createdAt: string | Date;
  updatedAt: string | Date;
}

const inMemoryGuests: GuestRecord[] = [];

export async function getGuests(req: Request, res: Response) {
  try {
    if (isPrismaConfigured()) {
      try {
        const guests = await prisma.guest.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            scores: {
              orderBy: { score: "desc" },
              take: 1,
            },
          },
        });
        return res.json({ guests, source: "database" });
      } catch (dbErr) {
        console.warn("Base de datos no disponible, usando memoria temporal:", dbErr);
      }
    }
    return res.json({ guests: inMemoryGuests, source: "memory" });
  } catch (err) {
    console.error("Error in getGuests:", err);
    return res.status(500).json({ error: "Error al obtener invitados" });
  }
}

export async function submitRsvp(req: Request, res: Response) {
  try {
    const {
      email,
      name,
      avatar,
      rsvpStatus = "PENDING",
      dietaryNotes,
      message,
      championId,
      championName,
      championTitle,
      championRole,
      championImage,
    } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: "El email y el nombre son requeridos" });
    }

    // Regla crucial: Si seleccionó un campeón, verificar que sea ÚNICO por persona
    if (championId) {
      if (isPrismaConfigured()) {
        try {
          const existingLock = await prisma.guest.findFirst({
            where: {
              championId: championId,
              email: { not: email },
            },
          });

          if (existingLock) {
            return res.status(409).json({
              error: `¡${championName || "Este campeón"} ya fue bloqueado por ${existingLock.name}! Cada invocador debe elegir un campeón único para el equipo.`,
              lockedBy: existingLock.name,
            });
          }
        } catch {
          // Fallback a memoria si la conexión falla
        }
      } else {
        const memLock = inMemoryGuests.find(
          (g) => g.championId === championId && g.email !== email
        );
        if (memLock) {
          return res.status(409).json({
            error: `¡${championName || "Este campeón"} ya fue bloqueado por ${memLock.name}! Cada invocador debe elegir un campeón único para el equipo.`,
            lockedBy: memLock.name,
          });
        }
      }
    }

    let guest;
    if (isPrismaConfigured()) {
      try {
        guest = await prisma.guest.upsert({
          where: { email },
          update: {
            name,
            avatar: avatar || undefined,
            rsvpStatus,
            dietaryNotes: dietaryNotes || null,
            message: message || null,
            championId: championId || null,
            championName: championName || null,
            championTitle: championTitle || null,
            championRole: championRole || null,
            championImage: championImage || null,
          },
          create: {
            email,
            name,
            avatar: avatar || null,
            rsvpStatus,
            dietaryNotes: dietaryNotes || null,
            message: message || null,
            championId: championId || null,
            championName: championName || null,
            championTitle: championTitle || null,
            championRole: championRole || null,
            championImage: championImage || null,
          },
        });
      } catch (upsertErr) {
        console.warn("DB Upsert falló, guardando en memoria:", upsertErr);
      }
    }

    if (!guest) {
      const existingIdx = inMemoryGuests.findIndex((g) => g.email === email);
      const guestData: GuestRecord = {
        id: `guest-${Date.now()}`,
        email,
        name,
        avatar: avatar || null,
        rsvpStatus,
        dietaryNotes: dietaryNotes || null,
        message: message || null,
        championId: championId || null,
        championName: championName || null,
        championTitle: championTitle || null,
        championRole: championRole || null,
        championImage: championImage || null,
        scores: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        inMemoryGuests[existingIdx] = guestData;
      } else {
        inMemoryGuests.push(guestData);
      }
      guest = guestData;
    }

    return res.json({
      success: true,
      message: "¡Invocación confirmada exitosamente!",
      guest,
    });
  } catch (error) {
    console.error("Error in submitRsvp:", error);
    return res.status(500).json({ error: "Error al procesar la confirmación" });
  }
}
