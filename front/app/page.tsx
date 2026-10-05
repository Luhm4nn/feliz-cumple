"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import HeroCountdown from "@/components/HeroCountdown";
import EventDetails from "@/components/EventDetails";
import Minigame from "@/components/Minigame";
import Leaderboard from "@/components/Leaderboard";
import RsvpForm from "@/components/RsvpForm";
import LobbyList from "@/components/LobbyList";
import LocationMap from "@/components/LocationMap";
import StepLogin from "@/components/StepLogin";
import StepChampionSelect from "@/components/StepChampionSelect";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import {
  ChampionSummary,
  GuestItem,
  getChampions,
  getGuests,
  submitRsvp,
} from "@/lib/api";

export default function Home() {
  const { user, isLoggedIn, isLoading, updateGuestData, logout } = useAuth();
  const [champions, setChampions] = useState<ChampionSummary[]>([]);
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [isChangingChampion, setIsChangingChampion] = useState(false);
  const [leaderboardKey, setLeaderboardKey] = useState(0);

  // Cargar lista de campeones con su estado de bloqueo
  const fetchChampions = useCallback(async () => {
    try {
      const data = await getChampions();
      setChampions(data.champions || []);
    } catch (err) {
      console.error("Error fetching champions:", err);
    }
  }, []);

  // Cargar invitados confirmados
  const fetchGuests = useCallback(async () => {
    try {
      const data = await getGuests();
      setGuests(data);
    } catch (err) {
      console.error("Error fetching guests:", err);
    }
  }, []);

  useEffect(() => {
    fetchChampions();
    fetchGuests();
  }, [fetchChampions, fetchGuests]);

  // Si el usuario acaba de iniciar sesión, verificar si ya tenía un campeón guardado en la BD
  useEffect(() => {
    if (user?.email && guests.length > 0) {
      const foundInDb = guests.find((g) => g.email === user.email);
      if (foundInDb?.championId && foundInDb.championId !== user.championId) {
        updateGuestData({
          championId: foundInDb.championId,
          championName: foundInDb.championName,
          championTitle: foundInDb.championTitle,
          championRole: foundInDb.championRole,
          championImage: foundInDb.championImage,
          rsvpStatus: foundInDb.rsvpStatus,
          message: foundInDb.message,
          dietaryNotes: foundInDb.dietaryNotes,
        });
      }
    }
  }, [user?.email, guests, updateGuestData, user?.championId]);

  // Bloquear campeón para el usuario actual (Regla de oro: único por persona)
  const handleLockIn = async (champion: ChampionSummary) => {
    if (!user) return;

    await submitRsvp({
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      rsvpStatus: user.rsvpStatus || "PENDING",
      dietaryNotes: user.dietaryNotes || null,
      message: user.message || null,
      championId: champion.id,
      championName: champion.name,
      championTitle: champion.title,
      championRole: champion.roleEs,
      championImage: champion.iconUrl,
    });

    updateGuestData({
      championId: champion.id,
      championName: champion.name,
      championTitle: champion.title,
      championRole: champion.roleEs,
      championImage: champion.iconUrl,
    });

    setIsChangingChampion(false);
    await fetchChampions();
    await fetchGuests();
  };

  const handleStartChangeChampion = async () => {
    sounds.playClick();
    await fetchChampions();
    await fetchGuests();
    setIsChangingChampion(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-lol-navy-black text-lol-gold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-lol-gold border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-xs uppercase tracking-widest">
            Entrando a la Grieta...
          </span>
        </div>
      </div>
    );
  }

  // PASO 1: Si no está autenticado, solicitar nombre y login
  if (!isLoggedIn || !user) {
    return <StepLogin onSuccess={fetchGuests} />;
  }

  // PASO 2: Si está autenticado pero aún no tiene campeón (o eligió cambiarlo), pantalla de selección de campeón
  if (!user.championId || isChangingChampion) {
    return (
      <StepChampionSelect
        champions={champions}
        onLockIn={handleLockIn}
        onBackToLogin={() => {
          if (isChangingChampion && user.championId) {
            setIsChangingChampion(false);
          } else {
            logout();
          }
        }}
      />
    );
  }

  // PASO 3: Pantalla Principal Limpia con la información del evento, invitados confirmados y minijuego
  return (
    <main className="min-h-screen relative text-lol-gold-light selection:bg-lol-gold selection:text-black">
      {/* Hextech Navbar */}
      <Navbar
        onOpenAuth={handleStartChangeChampion}
        onChangeChampion={handleStartChangeChampion}
      />

      {/* Hero con cuenta regresiva en vivo al 10/10/2026 */}
      <HeroCountdown />

      {/* Detalles del Evento: Fecha, horario, lugar, banquete */}
      <EventDetails />

      {/* Formulario de Asistencia (RSVP): Pociones, menú y dedicatoria */}
      <RsvpForm
        onRsvpSuccess={() => {
          fetchGuests();
          fetchChampions();
        }}
        onOpenAuth={() => setIsChangingChampion(true)}
      />

      {/* El Muro de los Invocadores: Muestra a los demás amigos con sus campeones y mensajes */}
      <LobbyList guests={guests} onRefresh={fetchGuests} />

      {/* Minijuego de la Grieta: Baron Steal & Dodge con tu campeón */}
      <Minigame
        onScoreSaved={() => setLeaderboardKey((prev) => prev + 1)}
        onOpenAuth={() => {}}
      />

      {/* Ranking de puntuaciones */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <Leaderboard refreshTrigger={leaderboardKey} />
      </section>

      {/* Ubicación y Mapa interactivo a Congreso 533 */}
      <LocationMap />

      {/* Footer */}
      <footer className="py-12 border-t border-lol-gold/20 bg-lol-navy-black/90 text-center text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="text-lol-gold font-bold">
            ⚔️ ¡Nos vemos el Sábado 10 de Octubre de 2026 en Congreso 533, San Lorenzo! ⚔️
          </p>
          <p>
            Inspirado en League of Legends & Riot Games. Datos y artes extraídos vía Riot Data Dragon API.
          </p>
          <p className="text-[10px] text-gray-600">
            © 2026 Invocador Cumpleañero • Que la gloria te acompañe en la Grieta.
          </p>
        </div>
      </footer>
    </main>
  );
}
