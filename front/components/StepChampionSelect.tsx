"use client";

import React, { useState, useMemo } from "react";
import { ChampionSummary } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { Search, Lock, LogOut, ArrowLeft } from "lucide-react";
import ChampionDetailModal from "./ChampionDetailModal";

interface StepChampionSelectProps {
  champions: ChampionSummary[];
  onLockIn: (champion: ChampionSummary) => Promise<void>;
  onBackToLogin: () => void;
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

export default function StepChampionSelect({
  champions,
  onLockIn,
  onBackToLogin,
}: StepChampionSelectProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedChamp, setSelectedChamp] = useState<ChampionSummary | null>(null);

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
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col justify-between">
      {/* Top Bar with user info & logout */}
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-lol-gold/25">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-lol-navy border border-lol-gold flex items-center justify-center text-sm font-bold text-lol-gold">
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xs text-gray-400 font-mono">Invocador Activo</div>
            <div className="text-sm font-bold text-white">{user?.name}</div>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onBackToLogin();
          }}
          className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-lol-gold transition-all px-3 py-1.5 rounded-lg border border-lol-gold/30 hover:border-lol-gold bg-lol-navy/70 shadow"
        >
          {user?.championId ? (
            <>
              <ArrowLeft size={14} />
              <span>Volver al Inicio</span>
            </>
          ) : (
            <>
              <LogOut size={14} />
              <span>Cambiar Invocador</span>
            </>
          )}
        </button>
      </div>

      {/* Main Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-lol-blue/15 border border-lol-blue/30 text-lol-blue text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <span>{user?.championId ? "Fase de Selección • Cambio de Campeón" : "Paso 2 • Bloqueo de Campeón Exclusivo"}</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold font-beaufort gold-gradient-text uppercase">
          {user?.championId ? "CAMBIA TU CAMPEÓN" : "ELIGE A TU CAMPEÓN"}
        </h2>
        <p className="text-gray-300 max-w-xl mx-auto text-xs sm:text-sm mt-2">
          {user?.championId
            ? `Tu campeón actual es ${user.championName}. Puedes cambiarlo por cualquier otro que no esté bloqueado con candado rojo.`
            : `¡Hola ${user?.name}! Cada invitado debe reservar un campeón único para la partida del 10/10/2026. Haz clic en tu favorito para ver sus habilidades y bloquearlo.`}
        </p>

        {/* Counter Pill */}
        <div className="mt-4 flex items-center justify-center gap-3 text-xs font-mono text-gray-400">
          <span className="text-lol-gold-light">
            Total en la Grieta: <strong className="text-lol-gold">{champions.length}</strong>
          </span>
          <span>•</span>
          <span className="text-lol-blue">
            Ya Bloqueados: <strong>{totalLocked}</strong>
          </span>
          <span>•</span>
          <span className="text-green-400">
            Disponibles: <strong>{champions.length - totalLocked}</strong>
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4 max-w-4xl mx-auto w-full">
        {/* Search */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-lol-gold"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o título (ej. Jinx, Yasuo, Ahri, Lee Sin)..."
            className="w-full pl-11 pr-4 py-3 bg-lol-navy/90 border border-lol-gold/40 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-lol-blue focus:shadow-glow-blue transition-all"
          />
        </div>

        {/* Roles */}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mb-12">
        {filteredChampions.map((champ) => {
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
                isLockedByOther
                  ? "border-lol-red/50 opacity-70 hover:opacity-100"
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

                {/* Locked Status Badge */}
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

      {/* Champion Detail & Lock In Modal */}
      {selectedChamp && (
        <ChampionDetailModal
          champion={selectedChamp}
          onClose={() => setSelectedChamp(null)}
          onLockIn={async (champ) => {
            await onLockIn(champ);
            setSelectedChamp(null);
          }}
          onOpenAuth={() => {}}
        />
      )}
    </div>
  );
}
