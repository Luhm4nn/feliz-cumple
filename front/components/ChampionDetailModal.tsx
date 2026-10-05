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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-lol-navy-black border border-lol-gold/50 rounded-xl shadow-glow-gold flex flex-col text-lol-gold-light">
        {/* Hextech corners */}
        <div className="hextech-corner hextech-corner-tl" />
        <div className="hextech-corner hextech-corner-tr" />
        <div className="hextech-corner hextech-corner-bl" />
        <div className="hextech-corner hextech-corner-br" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 text-gray-300 hover:text-white hover:bg-black/90 transition-all border border-lol-gold/30"
        >
          <X size={20} />
        </button>

        {/* Banner with Splash Art */}
        <div className="relative w-full h-64 sm:h-80 overflow-hidden bg-lol-navy">
          <img
            src={champion.splashUrl}
            alt={champion.name}
            className="w-full h-full object-cover object-top filter brightness-90 contrast-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lol-navy-black via-lol-navy-black/60 to-transparent" />

          {/* Champion Identity Over Splash */}
          <div className="absolute bottom-4 left-4 sm:left-8 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded bg-lol-gold/20 border border-lol-gold/40 text-lol-gold font-mono text-xs uppercase font-bold">
                  {champion.roleEs}
                </span>
                {isLockedByOther && (
                  <span className="px-2.5 py-0.5 rounded bg-lol-red/30 border border-lol-red text-red-200 text-xs font-bold flex items-center gap-1">
                    <Lock size={12} />
                    Bloqueado por {champion.lockedBy}
                  </span>
                )}
                {isLockedByMe && (
                  <span className="px-2.5 py-0.5 rounded bg-emerald-500/30 border border-emerald-400 text-emerald-200 text-xs font-bold flex items-center gap-1">
                    <CheckCircle size={12} />
                    ¡Tu Campeón Bloqueado!
                  </span>
                )}
              </div>
              <h2 className="text-3xl sm:text-5xl font-black font-beaufort text-white drop-shadow-lg uppercase tracking-wide">
                {champion.name}
              </h2>
              <p className="text-xs sm:text-sm text-lol-gold-light italic capitalize">
                {champion.title}
              </p>
            </div>

            {/* Lock In CTA Button in Header */}
            <div>
              {isLockedByOther ? (
                <div className="px-4 py-2.5 rounded bg-gray-800/80 border border-gray-600 text-gray-400 text-xs font-bold flex items-center gap-2">
                  <Lock size={16} />
                  <span>No disponible (Ya elegido)</span>
                </div>
              ) : isLockedByMe ? (
                <div className="px-5 py-2.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>Seleccionado para la partida</span>
                </div>
              ) : (
                <button
                  onClick={handleLockInClick}
                  disabled={isLocking}
                  className="px-6 py-3 rounded bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black font-extrabold text-sm uppercase tracking-wider border border-lol-gold shadow-glow-gold transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
                >
                  <Swords size={18} />
                  <span>{isLocking ? "Fijando..." : "BLOQUEAR CAMPEÓN (LOCK IN)"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body: Lore & Abilities */}
        <div className="p-4 sm:p-8 space-y-6">
          {/* Lore */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-lol-gold font-bold mb-2">
              Historia del Campeón
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed bg-lol-navy/40 p-4 rounded-lg border border-lol-gold/15">
              {detail?.lore || champion.blurb}
            </p>
          </div>

          {/* Abilities Showcase */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-lol-gold font-bold mb-3">
              Habilidades Oficiales
            </h3>

            {loading ? (
              <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
                Cargando habilidades desde la Grieta...
              </div>
            ) : detail?.abilities && detail.abilities.length > 0 ? (
              <div className="space-y-4">
                {/* Ability Icons Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  {detail.abilities.map((ability) => {
                    const isSelected = activeTab === ability.key;
                    return (
                      <button
                        key={ability.id}
                        onClick={() => {
                          sounds.playHover();
                          setActiveTab(ability.key);
                        }}
                        className={`relative group flex items-center gap-2 p-2 rounded-lg border transition-all ${
                          isSelected
                            ? "bg-lol-gold/20 border-lol-gold shadow-glow-gold"
                            : "bg-lol-navy border-lol-gold/20 hover:border-lol-gold/60"
                        }`}
                      >
                        <div className="w-10 h-10 relative rounded overflow-hidden border border-lol-gold/40">
                          <img
                            src={ability.imageUrl}
                            alt={ability.name}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-0 right-0 bg-black/80 text-[10px] font-mono font-bold px-1 text-lol-gold">
                            {ability.key}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-white pr-2 hidden sm:inline">
                          {ability.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Active Ability Card */}
                {activeAbility && (
                  <div className="p-4 rounded-lg bg-lol-navy/80 border border-lol-gold/30">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-0.5 rounded bg-lol-blue/20 text-lol-blue font-mono text-xs font-bold border border-lol-blue/40">
                        {activeAbility.key === "P" ? "PASIVA" : `TECLA [${activeAbility.key}]`}
                      </span>
                      <h4 className="text-base font-bold text-white">
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
          <div className="p-4 rounded-lg bg-lol-blue/10 border border-lol-blue/30 flex items-start gap-3 text-xs text-gray-300">
            <Zap size={20} className="text-lol-blue shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-lol-blue">Habilidad en el Minijuego: </span>
              Al seleccionar a {champion.name} ({champion.roleEs}), tu campeón tendrá la habilidad activa especial de clase en el minijuego de esquivar skillshots y robar el Barón.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
