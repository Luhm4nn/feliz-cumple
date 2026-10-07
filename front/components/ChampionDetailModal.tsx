"use client";

import React, { useState, useEffect } from "react";
import { ChampionSummary, ChampionDetail, getChampionDetails } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { X, Lock, CheckCircle, Zap, Swords } from "lucide-react";
import confetti from "canvas-confetti";
import { getChampionKit } from "@/lib/championSkills";

interface ChampionDetailModalProps {
  champion: (ChampionSummary & { isLocked?: boolean; lockedBy?: string | null }) | null;
  onClose: () => void;
  onLockIn: (champion: ChampionSummary) => Promise<void>;
  onOpenAuth: () => void;
}

export default function ChampionDetailModal({
  champion,
  onClose,
  onLockIn,
  onOpenAuth,
}: ChampionDetailModalProps) {
  const { user, isLoggedIn } = useAuth();
  const [detail, setDetail] = useState<ChampionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLocking, setIsLocking] = useState(false);
  const [activeTab, setActiveTab] = useState<"P" | "Q" | "W" | "E" | "R">("Q");

  useEffect(() => {
    if (!champion) return;
    setLoading(true);
    getChampionDetails(champion.id)
      .then((champ) => {
        if (champ) {
          setDetail(champ);
          if (champ.abilities?.length > 0) {
            setActiveTab(champ.abilities[1]?.key || "Q");
          }
        }
      })
      .catch((err) => console.error("Error loading champion detail:", err))
      .finally(() => setLoading(false));
  }, [champion]);

  if (!champion) return null;

  const isLockedByOther =
    champion.isLocked && champion.lockedBy && (!user || champion.lockedBy !== user.name);
  const isLockedByMe =
    user?.championId === champion.id || (champion.isLocked && champion.lockedBy === user?.name);

  const handleLockInClick = async () => {
    if (!isLoggedIn) {
      sounds.playClick();
      onOpenAuth();
      return;
    }

    if (isLockedByOther) return;

    try {
      setIsLocking(true);
      await onLockIn(champion);
      sounds.playLockIn();
      const kit = getChampionKit(champion.name, champion.roleEs);
      setTimeout(() => sounds.playChampionVoice(champion.name, kit.soundType), 400);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#C8AA6E", "#0AC8B9", "#F0E6D2"],
      });
      onClose();
    } catch (err: any) {
      alert(err.message || "Error al bloquear campeón");
    } finally {
      setIsLocking(false);
    }
  };

  const activeAbility = detail?.abilities?.find((a) => a.key === activeTab);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl h-[94vh] sm:h-auto sm:max-h-[90vh] bg-lol-navy-black border border-lol-gold/50 rounded-2xl shadow-glow-gold flex flex-col text-lol-gold-light overflow-hidden">
        {/* Hextech corners */}
        <div className="hextech-corner hextech-corner-tl" />
        <div className="hextech-corner hextech-corner-tr" />
        <div className="hextech-corner hextech-corner-bl" />
        <div className="hextech-corner hextech-corner-br" />

        {/* Close Button Top Right */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          aria-label="Cerrar modal"
          className="absolute top-3 right-3 z-30 p-2 sm:p-2.5 rounded-full bg-black/75 hover:bg-black text-gray-300 hover:text-white transition-all border border-lol-gold/40 shadow-lg active:scale-95"
        >
          <X size={18} />
        </button>

        {/* Scrollable Container (Banner + Content) */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
          {/* Banner with Splash Art */}
          <div className="relative w-full h-44 sm:h-64 md:h-72 overflow-hidden bg-lol-navy shrink-0">
            <img
              src={champion.splashUrl}
              alt={champion.name}
              className="w-full h-full object-cover object-top filter brightness-90 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-lol-navy-black via-lol-navy-black/60 to-transparent" />

            {/* Champion Identity Over Splash */}
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-6 right-12 sm:right-6">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                <span className="px-2 py-0.5 rounded bg-lol-gold/20 border border-lol-gold/40 text-lol-gold font-mono text-[10px] sm:text-xs uppercase font-bold">
                  {champion.roleEs}
                </span>
                {isLockedByOther && (
                  <span className="px-2 py-0.5 rounded bg-lol-red/30 border border-lol-red text-red-200 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                    <Lock size={11} />
                    <span>Bloqueado por {champion.lockedBy}</span>
                  </span>
                )}
                {isLockedByMe && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/30 border border-emerald-400 text-emerald-200 text-[10px] sm:text-xs font-bold flex items-center gap-1">
                    <CheckCircle size={11} />
                    <span>¡Tu Campeón Bloqueado!</span>
                  </span>
                )}
              </div>
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black font-beaufort text-white drop-shadow-lg uppercase tracking-wide leading-tight">
                {champion.name}
              </h2>
              <p className="text-[11px] sm:text-xs md:text-sm text-lol-gold-light italic capitalize truncate">
                {champion.title}
              </p>
            </div>
          </div>

          {/* Content Body: Lore & Abilities */}
          <div className="p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 pb-6">
            {/* Lore */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-lol-gold font-bold mb-1.5">
                Historia del Campeón
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-lol-navy/40 p-3 sm:p-4 rounded-lg border border-lol-gold/15">
                {detail?.lore || champion.blurb}
              </p>
            </div>

            {/* Abilities Showcase */}
            <div>
              <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-lol-gold font-bold mb-2.5">
                Habilidades Oficiales
              </h3>

              {loading ? (
                <div className="p-6 text-center text-xs text-gray-400 animate-pulse">
                  Cargando habilidades desde la Grieta...
                </div>
              ) : detail?.abilities && detail.abilities.length > 0 ? (
                <div className="space-y-3.5">
                  {/* Ability Icons Bar */}
                  <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
                    {detail.abilities.map((ability) => {
                      const isSelected = activeTab === ability.key;
                      return (
                        <button
                          key={ability.id}
                          onClick={() => {
                            sounds.playHover();
                            setActiveTab(ability.key);
                          }}
                          className={`relative group flex items-center gap-2 p-1.5 sm:p-2 rounded-lg border transition-all shrink-0 ${
                            isSelected
                              ? "bg-lol-gold/25 border-lol-gold shadow-glow-gold"
                              : "bg-lol-navy border-lol-gold/20 hover:border-lol-gold/60"
                          }`}
                        >
                          <div className="w-9 h-9 sm:w-10 sm:h-10 relative rounded overflow-hidden border border-lol-gold/40 shrink-0">
                            <img
                              src={ability.imageUrl}
                              alt={ability.name}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-0 right-0 bg-black/85 text-[10px] font-mono font-bold px-1 text-lol-gold leading-none py-0.5">
                              {ability.key}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-white pr-2 hidden md:inline">
                            {ability.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Ability Card */}
                  {activeAbility && (
                    <div className="p-3.5 sm:p-4 rounded-lg bg-lol-navy/80 border border-lol-gold/30">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="px-2 py-0.5 rounded bg-lol-blue/20 text-lol-blue font-mono text-[10px] sm:text-xs font-bold border border-lol-blue/40">
                          {activeAbility.key === "P" ? "PASIVA" : `TECLA [${activeAbility.key}]`}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white">
                          {activeAbility.name}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                        {activeAbility.description}
                      </p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Minigame Trait Notice */}
            <div className="p-3 sm:p-4 rounded-lg bg-lol-blue/10 border border-lol-blue/30 flex items-start gap-2.5 text-xs text-gray-300">
              <Zap size={18} className="text-lol-blue shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-lol-blue">Habilidad en el Minijuego: </span>
                Al seleccionar a {champion.name} ({champion.roleEs}), tu campeón tendrá su habilidad activa especial de clase en el minijuego de esquivar skillshots y robar el Barón.
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Footer Bar (ALWAYS visible on Mobile & Desktop) */}
        <div className="shrink-0 w-full p-3 sm:p-4 bg-lol-navy-black/95 backdrop-blur-md border-t border-lol-gold/35 flex items-center justify-between gap-2.5 z-20 shadow-2xl">
          {/* Champion mini thumbnail & info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full overflow-hidden border border-lol-gold shrink-0 bg-lol-navy">
              <img
                src={champion.iconUrl}
                alt={champion.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight">
                {champion.name}
              </div>
              <div className="text-[10px] sm:text-xs text-lol-gold font-mono truncate">
                {champion.roleEs}
              </div>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="hidden sm:inline-flex px-3.5 py-2.5 rounded-lg border border-lol-gold/30 hover:border-lol-gold bg-lol-navy text-xs font-semibold text-gray-300 hover:text-white transition-all"
            >
              Cerrar
            </button>

            {isLockedByOther ? (
              <div className="px-3.5 py-2.5 rounded-lg bg-gray-900/90 border border-lol-red/50 text-red-300 text-xs font-bold flex items-center gap-1.5 shadow">
                <Lock size={14} className="text-lol-red shrink-0" />
                <span className="truncate max-w-[140px] sm:max-w-none">
                  Elegido por {champion.lockedBy}
                </span>
              </div>
            ) : isLockedByMe ? (
              <div className="px-3.5 py-2.5 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow">
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                <span>Tu Campeón Actual</span>
              </div>
            ) : (
              <button
                onClick={handleLockInClick}
                disabled={isLocking}
                className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light active:scale-95 text-lol-navy-black font-black text-xs sm:text-sm uppercase tracking-wider border border-lol-gold shadow-glow-gold transition-all flex items-center justify-center gap-2"
              >
                <Swords size={16} className="shrink-0" />
                <span>
                  {isLocking ? "Fijando..." : `BLOQUEAR A ${champion.name.toUpperCase()}`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
