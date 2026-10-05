"use client";

import React, { useState, useMemo } from "react";
import { sounds } from "@/lib/sounds";
import { Users, Trophy, RefreshCw, MessageSquare, Beer, Shield, Box, LayoutGrid } from "lucide-react";
import { GuestItem } from "@/lib/api";
import { getChampionKit } from "@/lib/championSkills";
import Champion3DViewer from "@/components/Champion3DViewer";
import Squad3DStage from "@/components/Squad3DStage";

interface LobbyListProps {
  guests: GuestItem[];
  onRefresh: () => Promise<void>;
}

// Tarjeta con Modelo 3D del Campeón en Vivo
function Summoner3DLiveCard({ guest }: { guest: GuestItem }) {
  const bestScore = guest.scores?.[0]?.score;
  const championKit = getChampionKit(guest.championName, guest.championRole);

  return (
    <div
      onMouseEnter={() => sounds.playHover()}
      className="hextech-card rounded-2xl overflow-hidden border border-lol-gold/40 hover:border-lol-gold shadow-lg hover:shadow-glow-gold-lg transition-all duration-300 flex flex-col justify-between relative group"
    >
      <div className="hextech-corner hextech-corner-tl" />
      <div className="hextech-corner hextech-corner-tr" />
      <div className="hextech-corner hextech-corner-bl" />
      <div className="hextech-corner hextech-corner-br" />

      {/* Top Header: Invocador & Status */}
      <div className="p-3.5 sm:p-4 bg-lol-navy/90 border-b border-lol-gold/20 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {guest.avatar ? (
            <img
              src={guest.avatar}
              alt={guest.name}
              className="w-9 h-9 rounded-full border border-lol-gold object-cover shadow"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-lol-gold/20 flex items-center justify-center text-sm font-bold text-lol-gold border border-lol-gold">
              {guest.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white leading-tight">
              {guest.name}
            </h3>
            <span className="text-[11px] text-lol-gold font-mono">
              {guest.championName || "Eligiendo..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-extrabold uppercase shadow ${
              guest.rsvpStatus === "ATTENDING"
                ? "bg-emerald-950/90 border border-emerald-400 text-emerald-300"
                : guest.rsvpStatus === "TENTATIVE"
                ? "bg-amber-950/90 border border-amber-400 text-amber-300"
                : "bg-red-950/90 border border-red-400 text-red-300"
            }`}
          >
            {guest.rsvpStatus === "ATTENDING"
              ? "✓ Confirmo"
              : guest.rsvpStatus === "TENTATIVE"
              ? "⏳ En Veremos"
              : "💀 No va"}
          </span>
        </div>
      </div>

      {/* 3D Champion Model Viewer Box */}
      <div className="relative w-full bg-lol-navy-black/90 flex items-center justify-center overflow-hidden border-b border-lol-gold/15">
        {guest.championName ? (
          <Champion3DViewer
            championName={guest.championName}
            height={320}
            fallbackImage={guest.championImage}
            autoRotate={true}
            interactive={true}
          />
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500 font-mono text-xs">
            <span>[Sin Campeón Bloqueado]</span>
          </div>
        )}

        {/* Role Pill & Audio */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-2">
          {guest.championRole && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 border border-lol-gold/40 text-lol-gold-light font-bold flex items-center gap-1 shadow">
              <Shield size={11} className="text-lol-gold" />
              <span>{guest.championRole}</span>
            </span>
          )}

          <button
            onClick={() => sounds.playChampionVoice(guest.championName, championKit.soundType)}
            title="Escuchar voz oficial del campeón"
            className="p-1.5 rounded-full bg-black/70 hover:bg-black/95 border border-lol-gold/40 text-lol-gold hover:text-white transition-all text-xs shadow"
          >
            🔊
          </button>
        </div>
      </div>

      {/* Card Details: Dedication & Drinks */}
      <div className="p-3.5 sm:p-4 bg-lol-navy/40 flex-1 flex flex-col justify-between">
        <div>
          {guest.message && (
            <div className="mb-2.5 p-2.5 rounded-lg bg-lol-navy-black/90 border border-lol-gold/15 text-xs text-gray-200 italic flex items-start gap-2 shadow-inner">
              <MessageSquare size={13} className="text-lol-blue shrink-0 mt-0.5" />
              <span className="line-clamp-2">"{guest.message}"</span>
            </div>
          )}

          {guest.dietaryNotes && (
            <div className="mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-lol-navy/70 border border-lol-gold/15 text-[11px] text-gray-300">
              <Beer size={12} className="text-emerald-400 shrink-0" />
              <span className="truncate max-w-[220px]">{guest.dietaryNotes}</span>
            </div>
          )}
        </div>

        {bestScore !== undefined && bestScore > 0 && (
          <div className="pt-2 mt-1 border-t border-lol-gold/15 flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1 text-gray-400 text-[11px]">
              <Trophy size={13} className="text-lol-gold" />
              Récord Barón:
            </span>
            <span className="text-lol-gold font-bold">
              {bestScore.toLocaleString()} pts
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LobbyList({ guests, onRefresh }: LobbyListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ATTENDING" | "TENTATIVE" | "DECLINED">("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"3D" | "GRID">("3D");

  const handleRefresh = async () => {
    sounds.playClick();
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  // Deduplicar rigurosamente los invitados por email (o ID) para que cada invocador tenga únicamente su campeón más reciente
  const uniqueGuests = useMemo(() => {
    const map = new Map<string, GuestItem>();
    for (const g of guests) {
      const key = (g.email ? g.email.trim().toLowerCase() : g.id);
      if (key && !map.has(key)) {
        map.set(key, g);
      }
    }
    return Array.from(map.values());
  }, [guests]);

  const attendingGuests = useMemo(() => uniqueGuests.filter((g) => g.rsvpStatus === "ATTENDING"), [uniqueGuests]);
  const tentativeGuests = useMemo(() => uniqueGuests.filter((g) => g.rsvpStatus === "TENTATIVE"), [uniqueGuests]);
  const declinedGuests = useMemo(() => uniqueGuests.filter((g) => g.rsvpStatus === "DECLINED"), [uniqueGuests]);
  const lockedChampionsCount = useMemo(() => uniqueGuests.filter((g) => g.championId).length, [uniqueGuests]);

  const filteredGuests = useMemo(() => {
    return uniqueGuests.filter((g) => {
      const matchStatus =
        statusFilter === "ALL" || g.rsvpStatus === statusFilter;
      const matchRole =
        roleFilter === "ALL" || (g.championRole && g.championRole.toLowerCase().includes(roleFilter.toLowerCase()));
      return matchStatus && matchRole;
    });
  }, [uniqueGuests, statusFilter, roleFilter]);

  // Firma única de la alineación para forzar la sincronización exacta del escenario 3D
  const squadSignature = useMemo(() => {
    return filteredGuests
      .filter((g) => Boolean(g.championName))
      .map((g) => `${(g.email || g.id).toLowerCase()}_${g.championName}_${g.rsvpStatus}`)
      .sort()
      .join("|");
  }, [filteredGuests]);

  return (
    <section id="invocadores" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
      {/* Ambient background runes */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-lol-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-lol-gold/5 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lol-gold/15 border border-lol-gold/30 text-lol-gold text-xs font-mono font-bold uppercase tracking-wider mb-2">
            <Users size={14} />
            <span>Escuadrón en la Grieta</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-beaufort gold-gradient-text uppercase">
            EL MURO DE INVOCADORES
          </h2>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl">
            Alineación en tiempo real: Mirá a tus compañeros con sus campeones y animaciones oficiales.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Toggle View Mode */}
          <div className="flex items-center bg-lol-navy-black p-1 rounded-lg border border-lol-gold/30">
            <button
              onClick={() => {
                sounds.playClick();
                setViewMode("3D");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === "3D"
                  ? "bg-gradient-to-r from-lol-gold-dark to-lol-gold text-lol-navy-black shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Box size={14} />
              <span>Escenario</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setViewMode("GRID");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === "GRID"
                  ? "bg-lol-gold text-lol-navy-black shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Fichas</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-lol-navy hover:bg-lol-metal border border-lol-gold/40 hover:border-lol-gold text-lol-gold-light text-xs font-bold rounded-lg transition-all shadow"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* Squad Stats Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="p-3.5 rounded-xl bg-lol-navy/85 border border-emerald-500/40 text-center shadow-lg">
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
            {attendingGuests.length}
          </div>
          <div className="text-[11px] text-gray-300 font-medium mt-0.5">
            🟢 Confirmados
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-lol-navy/85 border border-amber-500/40 text-center shadow-lg">
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-400">
            {tentativeGuests.length}
          </div>
          <div className="text-[11px] text-gray-300 font-medium mt-0.5">
            🟡 En Veremos
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-lol-navy/85 border border-red-500/40 text-center shadow-lg">
          <div className="text-xl sm:text-2xl font-black font-mono text-red-400">
            {declinedGuests.length}
          </div>
          <div className="text-[11px] text-gray-300 font-medium mt-0.5">
            🔴 No van (AFK)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-lol-navy/85 border border-lol-gold/40 text-center shadow-lg">
          <div className="text-xl sm:text-2xl font-black font-mono text-lol-gold">
            {lockedChampionsCount}
          </div>
          <div className="text-[11px] text-gray-300 font-medium mt-0.5">
            ⚔️ Campeones
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-4 border-b border-lol-gold/20">
        <div className="flex items-center gap-1.5 bg-lol-navy-black p-1 rounded-lg border border-lol-gold/30">
          {[
            { key: "ALL", label: "Todos" },
            { key: "ATTENDING", label: "🟢 Confirmados" },
            { key: "TENTATIVE", label: "🟡 En Veremos" },
            { key: "DECLINED", label: "🔴 No Van" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                sounds.playClick();
                setStatusFilter(tab.key as any);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                statusFilter === tab.key
                  ? "bg-lol-gold text-lol-navy-black shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-mono text-gray-400 hidden sm:inline mr-1">
            Rol:
          </span>
          {["ALL", "Asesino", "Luchador", "Mago", "Tirador", "Tanque", "Soporte"].map((r) => (
            <button
              key={r}
              onClick={() => {
                sounds.playClick();
                setRoleFilter(r);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                roleFilter === r
                  ? "bg-lol-blue/20 border-lol-blue text-lol-blue"
                  : "bg-lol-navy border-lol-gold/20 text-gray-400 hover:text-white"
              }`}
            >
              {r === "ALL" ? "Todos los Roles" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Guests Main Content */}
      {filteredGuests.length === 0 ? (
        <div className="hextech-card p-12 text-center rounded-2xl border border-lol-gold/30 text-gray-300">
          <p className="text-base font-semibold">No se encontraron invocadores con los filtros seleccionados.</p>
          <p className="text-xs text-lol-gold mt-1">¡Sé el primero en confirmar asistencia y bloquear a tu campeón!</p>
        </div>
      ) : viewMode === "3D" ? (
        <div className="space-y-8">
          {/* Escena 3D Unificada con todos los campeones juntos (sincronizada reactivamente con squadSignature) */}
          <Squad3DStage key={squadSignature} guests={filteredGuests} />

          {/* Ficha Resumen del Escuadrón & Bebidas */}
          <div className="hextech-card rounded-2xl p-5 sm:p-6 border border-lol-gold/30 bg-lol-navy-black/80">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-lol-gold/20">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-lol-gold" />
                <h3 className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wider font-beaufort">
                  Ficha de Invocadores & Bebidas
                </h3>
              </div>
              <span className="text-xs font-mono text-gray-400">
                {filteredGuests.length} Invocadores en lista
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredGuests.map((guest) => {
                const kit = getChampionKit(guest.championName, guest.championRole);
                const bestScore = guest.scores?.[0]?.score;
                return (
                  <div
                    key={guest.id}
                    className="p-3 sm:p-3.5 rounded-xl bg-lol-navy/70 border border-lol-gold/20 hover:border-lol-gold/50 transition-all flex items-center justify-between gap-3 shadow"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {guest.avatar ? (
                        <img
                          src={guest.avatar}
                          alt={guest.name}
                          className="w-10 h-10 rounded-full border border-lol-gold object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-lol-gold/20 flex items-center justify-center text-xs font-bold text-lol-gold border border-lol-gold shrink-0">
                          {guest.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {guest.name}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-extrabold uppercase shrink-0 ${
                              guest.rsvpStatus === "ATTENDING"
                                ? "bg-emerald-950/80 border border-emerald-500/50 text-emerald-300"
                                : guest.rsvpStatus === "TENTATIVE"
                                ? "bg-amber-950/80 border border-amber-500/50 text-amber-300"
                                : "bg-red-950/80 border border-red-500/50 text-red-300"
                            }`}
                          >
                            {guest.rsvpStatus === "ATTENDING"
                              ? "✓ Confirmo"
                              : guest.rsvpStatus === "TENTATIVE"
                              ? "⏳ En Veremos"
                              : "💀 No va"}
                          </span>
                        </div>

                        <div className="text-xs text-lol-gold font-mono flex items-center gap-1.5 mt-0.5 truncate">
                          <span>⚔️ {guest.championName || "Eligiendo..."}</span>
                          {guest.championRole && (
                            <span className="text-[10px] text-gray-400">({guest.championRole})</span>
                          )}
                        </div>

                        {guest.dietaryNotes && (
                          <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1 truncate">
                            <Beer size={11} className="shrink-0" />
                            <span className="truncate">Lleva: {guest.dietaryNotes}</span>
                          </div>
                        )}

                        {guest.message && (
                          <div className="text-[11px] text-gray-300 italic flex items-center gap-1 mt-0.5 truncate">
                            <MessageSquare size={11} className="text-lol-blue shrink-0" />
                            <span className="truncate">"{guest.message}"</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {bestScore !== undefined && bestScore > 0 && (
                        <span className="text-[11px] font-mono text-lol-gold font-bold flex items-center gap-1">
                          <Trophy size={11} />
                          {bestScore.toLocaleString()}
                        </span>
                      )}
                      <button
                        onClick={() => sounds.playChampionVoice(guest.championName, kit.soundType)}
                        title="Escuchar voz oficial del campeón"
                        className="p-1.5 rounded bg-black/60 hover:bg-black/90 border border-lol-gold/30 text-lol-gold hover:text-white text-xs transition-all"
                      >
                        🔊
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuests.map((guest) => (
            <Summoner3DLiveCard key={guest.id} guest={guest} />
          ))}
        </div>
      )}
    </section>
  );
}
