"use client";

import React, { useState } from "react";
import { sounds } from "@/lib/sounds";
import { Users, Trophy, RefreshCw, MessageCircle } from "lucide-react";
import { GuestItem } from "@/lib/api";

interface LobbyListProps {
  guests: GuestItem[];
  onRefresh: () => Promise<void>;
}

export default function LobbyList({ guests, onRefresh }: LobbyListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    sounds.playClick();
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const attendingGuests = guests.filter((g) => g.rsvpStatus === "ATTENDING");
  const tentativeGuests = guests.filter((g) => g.rsvpStatus === "TENTATIVE");

  return (
    <section id="invocadores" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lol-gold/15 border border-lol-gold/30 text-lol-gold text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Users size={14} />
            <span>Escuadrón Confirmado</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-beaufort gold-gradient-text">
            EL MURO DE INVOCADORES
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Conoce a tus compañeros de equipo y los campeones que ya están bloqueados para la fiesta.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-lol-navy hover:bg-lol-metal border border-lol-gold/30 hover:border-lol-gold text-lol-gold-light text-xs font-semibold rounded-lg transition-all"
        >
          <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
          <span>Actualizar Escuadrón</span>
        </button>
      </div>

      {/* Guest Summary Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <div className="p-4 rounded-lg bg-lol-navy/80 border border-emerald-500/40 text-center">
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {attendingGuests.length}
          </div>
          <div className="text-xs text-gray-400">Confirmados (A la batalla)</div>
        </div>
        <div className="p-4 rounded-lg bg-lol-navy/80 border border-amber-500/40 text-center">
          <div className="text-2xl font-bold font-mono text-amber-400">
            {tentativeGuests.length}
          </div>
          <div className="text-xs text-gray-400">En Base (Duda)</div>
        </div>
        <div className="p-4 rounded-lg bg-lol-navy/80 border border-lol-gold/40 text-center col-span-2 sm:col-span-1">
          <div className="text-2xl font-bold font-mono text-lol-gold">
            {guests.filter((g) => g.championId).length}
          </div>
          <div className="text-xs text-gray-400">Campeones Bloqueados</div>
        </div>
      </div>

      {/* Guest Cards Grid */}
      {guests.length === 0 ? (
        <div className="hextech-card p-12 text-center rounded-xl border border-lol-gold/20 text-gray-400 text-sm">
          <p>Aún no hay invocadores registrados en la Grieta.</p>
          <p className="text-xs text-lol-gold mt-2">¡Sé el primero en bloquear tu campeón y confirmar asistencia arriba!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {guests.map((guest) => {
            const bestScore = guest.scores?.[0]?.score;
            return (
              <div
                key={guest.id}
                onMouseEnter={() => sounds.playHover()}
                className="hextech-card rounded-xl overflow-hidden border border-lol-gold/30 hover:border-lol-gold transition-all duration-300 shadow-md flex flex-col justify-between"
              >
                <div className="hextech-corner hextech-corner-tl" />
                <div className="hextech-corner hextech-corner-tr" />
                <div className="hextech-corner hextech-corner-bl" />
                <div className="hextech-corner hextech-corner-br" />

                {/* Card Top: Champion Banner or Placeholder */}
                <div className="relative h-28 bg-lol-navy overflow-hidden">
                  {guest.championImage ? (
                    <img
                      src={guest.championImage}
                      alt={guest.championName || "Campeón"}
                      className="w-full h-full object-cover object-top filter brightness-85"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-lol-navy-dark via-lol-navy to-lol-metal flex items-center justify-center text-lol-gold/30 font-mono text-xs">
                      [Sin Campeón Bloqueado]
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-lol-navy-black via-lol-navy-black/40 to-transparent" />

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        guest.rsvpStatus === "ATTENDING"
                          ? "bg-emerald-900/90 border border-emerald-500 text-emerald-200"
                          : guest.rsvpStatus === "TENTATIVE"
                          ? "bg-amber-900/90 border border-amber-500 text-amber-200"
                          : "bg-red-900/90 border border-red-500 text-red-200"
                      }`}
                    >
                      {guest.rsvpStatus === "ATTENDING"
                        ? "¡Confirmado!"
                        : guest.rsvpStatus === "TENTATIVE"
                        ? "En Duda"
                        : "AFK"}
                    </span>
                  </div>

                  {/* Role badge */}
                  {guest.championRole && (
                    <div className="absolute bottom-2 right-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 border border-lol-gold/40 text-lol-gold">
                        {guest.championRole}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* User and Champion Identity */}
                    <div className="flex items-center gap-3 mb-3">
                      {guest.avatar ? (
                        <img
                          src={guest.avatar}
                          alt={guest.name}
                          className="w-10 h-10 rounded-full border border-lol-gold object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-lol-gold/20 flex items-center justify-center text-sm font-bold text-lol-gold border border-lol-gold shrink-0">
                          {guest.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h4 className="text-base font-bold text-white leading-tight">
                          {guest.name}
                        </h4>
                        <div className="text-xs text-lol-gold-light">
                          {guest.championName ? (
                            <span>Bloqueó a: <strong className="text-lol-gold">{guest.championName}</strong></span>
                          ) : (
                            <span className="text-gray-500 italic">Eligiendo campeón...</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Message / Dedication */}
                    {guest.message && (
                      <div className="p-2.5 rounded bg-lol-navy-black/80 border border-lol-gold/15 text-xs text-gray-300 italic mb-3 flex items-start gap-2">
                        <MessageCircle size={14} className="text-lol-blue shrink-0 mt-0.5" />
                        <span>"{guest.message}"</span>
                      </div>
                    )}

                    {/* Diet / Drink */}
                    {guest.dietaryNotes && (
                      <div className="text-[11px] text-gray-400 mb-2">
                        🧪 <span>{guest.dietaryNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer: Minigame Best Score */}
                  {bestScore !== undefined && bestScore > 0 && (
                    <div className="pt-2 mt-2 border-t border-lol-gold/15 flex items-center justify-between text-xs font-mono text-lol-blue">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Trophy size={13} className="text-lol-gold" />
                        Récord Grieta:
                      </span>
                      <strong className="text-lol-gold">{bestScore.toLocaleString()} pts</strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
