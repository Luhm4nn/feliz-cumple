"use client";

import React, { useState, useMemo } from "react";
import { ChampionSummary } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { Search, Lock, CheckCircle, Sparkles } from "lucide-react";
import ChampionDetailModal from "./ChampionDetailModal";

interface ChampionWithLock extends ChampionSummary {
  isLocked?: boolean;
  lockedBy?: string | null;
}

interface ChampionSelectProps {
  champions: ChampionWithLock[];
  onLockIn: (champion: ChampionSummary) => Promise<void>;
  onOpenAuth: () => void;
}

const ROLES = [
  { key: "ALL", label: "Todos los Roles" },
  { key: "Assassin", label: "Asesinos" },
  { key: "Fighter", label: "Luchadores" },
  { key: "Mage", label: "Magos" },
  { key: "Marksman", label: "Tiradores" },
  { key: "Support", label: "Soportes" },
  { key: "Tank", label: "Tanques" },
];

export default function ChampionSelect({
  champions,
  onLockIn,
  onOpenAuth,
}: ChampionSelectProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedChamp, setSelectedChamp] = useState<ChampionWithLock | null>(null);

  // Filtrado reactivo en tiempo real
  const filteredChampions = useMemo(() => {
    return champions.filter((champ) => {
      const matchesSearch =
        champ.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        champ.title.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole =
        selectedRole === "ALL" || (champ.tags && champ.tags.includes(selectedRole));

      return matchesSearch && matchesRole;
    });
  }, [champions, searchTerm, selectedRole]);

  const totalLocked = useMemo(() => {
    return champions.filter((c) => c.isLocked).length;
  }, [champions]);

  return (
    <section id="campeones" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lol-blue/15 border border-lol-blue/30 text-lol-blue text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Sparkles size={14} />
          <span>Fase de Selección • Regla de Oro</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold font-beaufort gold-gradient-text">
          ELIGE A TU CAMPEÓN
        </h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base mt-2">
          Cada invitado debe bloquear a un campeón único. Explora sus habilidades, splash arts oficiales y fija al tuyo antes de que otro invocador lo reserve.
        </p>

        {/* Counter Pill */}
        <div className="mt-4 flex items-center justify-center gap-4 text-xs font-mono text-gray-400">
          <span className="text-lol-gold-light">
            Total en la Grieta: <strong className="text-lol-gold">{champions.length}</strong>
          </span>
          <span>•</span>
          <span className="text-lol-blue">
            Bloqueados: <strong>{totalLocked}</strong>
          </span>
          <span>•</span>
          <span className="text-green-400">
            Disponibles: <strong>{champions.length - totalLocked}</strong>
          </span>
        </div>
      </div>

      {/* Search & Role Filters */}
      <div className="mb-8 space-y-4 max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-lol-gold"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o título de campeón (ej. Yasuo, Jinx, Ahri)..."
            className="w-full pl-11 pr-4 py-3 bg-lol-navy/90 border border-lol-gold/40 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-lol-blue focus:shadow-glow-blue transition-all"
          />
        </div>

        {/* Role Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {ROLES.map((role) => {
            const isActive = selectedRole === role.key;
            return (
              <button
                key={role.key}
                onClick={() => {
                  sounds.playClick();
                  setSelectedRole(role.key);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  isActive
                    ? "bg-lol-gold text-lol-navy-black border-lol-gold shadow-glow-gold"
                    : "bg-lol-navy text-gray-300 border-lol-gold/25 hover:border-lol-gold/60 hover:text-white"
                }`}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Champions Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {filteredChampions.map((champ) => {
          const isMyChamp = user?.championId === champ.id;
          const isLockedByOther =
            champ.isLocked && champ.lockedBy && champ.lockedBy !== user?.name;

          return (
            <div
              key={champ.id}
              onClick={() => {
                sounds.playHover();
                setSelectedChamp(champ);
              }}
              className={`hextech-card group cursor-pointer rounded-lg overflow-hidden border transition-all duration-200 transform hover:-translate-y-1 flex flex-col ${
                isMyChamp
                  ? "border-emerald-400 ring-2 ring-emerald-400 shadow-glow-gold"
                  : isLockedByOther
                  ? "border-lol-red/50 opacity-75 hover:opacity-100"
                  : "border-lol-gold/30 hover:border-lol-gold hover:shadow-glow-gold"
              }`}
            >
              {/* Champion Card Portrait */}
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-lol-navy">
                <img
                  src={champ.loadingUrl}
                  alt={champ.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-top filter brightness-95 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-lol-navy-black via-transparent to-black/30" />

                {/* Role badge top right */}
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/70 border border-lol-gold/30 text-lol-gold-light">
                    {champ.roleEs}
                  </span>
                </div>

                {/* Lock or Pick Status Badge */}
                {isMyChamp && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-emerald-600/90 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                    <CheckCircle size={10} />
                    <span>Tu Pick</span>
                  </div>
                )}
                {isLockedByOther && (
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-lol-red/90 text-white text-[10px] font-bold flex items-center gap-1 shadow">
                    <Lock size={10} />
                    <span className="truncate max-w-[80px]">{champ.lockedBy}</span>
                  </div>
                )}

                {/* Bottom Card Info */}
                <div className="absolute bottom-2 left-2 right-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-white group-hover:text-lol-gold transition-colors font-beaufort drop-shadow truncate">
                    {champ.name}
                  </h4>
                  <p className="text-[10px] text-gray-300 truncate capitalize italic">
                    {champ.title}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredChampions.length === 0 && (
        <div className="text-center py-12 text-gray-400 text-sm">
          No se encontró ningún campeón con ese criterio de búsqueda.
        </div>
      )}

      {/* Modal for Champion Details & Lock In */}
      {selectedChamp && (
        <ChampionDetailModal
          champion={selectedChamp}
          onClose={() => setSelectedChamp(null)}
          onLockIn={onLockIn}
          onOpenAuth={onOpenAuth}
        />
      )}
    </section>
  );
}
