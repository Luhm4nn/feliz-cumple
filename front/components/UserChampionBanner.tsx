"use client";

import React, { useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { RefreshCw, Zap, Volume2, Shield, Box, ChevronUp, ChevronDown } from "lucide-react";
import { getChampionKit } from "@/lib/championSkills";
import Champion3DViewer from "@/components/Champion3DViewer";

interface UserChampionBannerProps {
  onChangeChampion: () => void;
}

export default function UserChampionBanner({
  onChangeChampion,
}: UserChampionBannerProps) {
  const { user } = useAuth();
  const [show3D, setShow3D] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [style3D, setStyle3D] = useState({
    transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
    mouseX: "50%",
    mouseY: "50%",
  });

  const championKit = getChampionKit(user?.championName, user?.championRole);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || show3D) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;

    const rotateY = ((x / rect.width) - 0.5) * 10;
    const rotateX = (0.5 - (y / rect.height)) * 10;

    setStyle3D({
      transform: `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`,
      mouseX: `${xPct.toFixed(1)}%`,
      mouseY: `${yPct.toFixed(1)}%`,
    });
  }, [show3D]);

  const handleMouseLeave = useCallback(() => {
    setStyle3D({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)",
      mouseX: "50%",
      mouseY: "50%",
    });
  }, []);

  if (!user || !user.championName) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 mb-10">
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={() => sounds.playHover()}
        style={{
          transform: show3D ? "none" : style3D.transform,
          ["--mouse-x" as any]: style3D.mouseX,
          ["--mouse-y" as any]: style3D.mouseY,
        }}
        className="holo-card hextech-card rounded-2xl overflow-hidden border border-lol-gold/50 shadow-glow-gold relative p-5 sm:p-6 flex flex-col gap-4 bg-gradient-to-r from-lol-navy via-lol-navy-black to-lol-navy preserve-3d transition-all duration-300"
      >
        <div className="holo-shine" />
        <div className="hextech-corner hextech-corner-tl" />
        <div className="hextech-corner hextech-corner-tr" />
        <div className="hextech-corner hextech-corner-bl" />
        <div className="hextech-corner hextech-corner-br" />

        {/* Main Banner Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4.5 translate-z-20">
            {user.championImage ? (
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-lol-gold shadow-glow-gold shrink-0">
                <img
                  src={user.championImage}
                  alt={user.championName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-lol-gold/20 flex items-center justify-center text-2xl text-lol-gold border-2 border-lol-gold shrink-0">
                ⚔️
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold uppercase">
                  ✓ Bloqueado Exclusivo para ti
                </span>
                {user.championRole && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lol-gold/15 border border-lol-gold/30 text-lol-gold font-semibold flex items-center gap-1">
                    <Shield size={10} />
                    <span>{user.championRole}</span>
                  </span>
                )}
              </div>

              <h3 className="text-xl sm:text-2xl font-black font-beaufort text-white leading-tight">
                {user.championName}{" "}
                <span className="text-xs font-mono text-lol-gold font-normal">({user.name})</span>
              </h3>

              <p className="text-xs text-gray-300 italic font-beaufort mt-0.5">
                "{championKit.quote}"
              </p>

              <div className="text-[11px] text-lol-blue mt-1">
                <Zap size={11} className="inline mr-1" />
                <strong>Especial en la fiesta:</strong> {championKit.partyPerk}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 translate-z-30 shrink-0">
            {/* Toggle Model View */}
            <button
              onClick={() => {
                sounds.playClick();
                setShow3D((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-bold transition-all shadow ${
                show3D
                  ? "bg-gradient-to-r from-lol-gold-dark to-lol-gold text-lol-navy-black border-lol-gold shadow-glow-gold"
                  : "bg-lol-navy hover:bg-lol-metal border-lol-gold/30 hover:border-lol-gold text-lol-gold-light"
              }`}
            >
              <Box size={14} />
              <span>{show3D ? "Ocultar modelo" : "Ver modelo"}</span>
              {show3D ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <button
              onClick={() => sounds.playChampionVoice(user.championName, championKit.soundType)}
              title="Escuchar voz oficial del campeón"
              className="p-2.5 rounded-lg bg-lol-navy hover:bg-lol-metal border border-lol-gold/30 hover:border-lol-gold text-lol-gold hover:text-white transition-all shadow"
            >
              <Volume2 size={16} />
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                onChangeChampion();
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-lol-navy hover:bg-lol-metal border border-lol-gold/30 hover:border-lol-gold text-lol-gold-light hover:text-white text-xs font-semibold transition-all shadow"
            >
              <RefreshCw size={13} />
              <span>Cambiar</span>
            </button>
          </div>
        </div>

        {/* Expandable Champion Model Stage */}
        {show3D && (
          <div className="mt-2 pt-4 border-t border-lol-gold/20 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-lol-gold uppercase tracking-wider font-bold">
                Modelo del Campeón • {user.championName}
              </span>
              <span className="text-[11px] text-gray-400">
                Gira con el mouse para inspeccionar
              </span>
            </div>

            <Champion3DViewer
              championName={user.championName}
              height={340}
              fallbackImage={user.championImage}
              autoRotate={true}
              interactive={true}
              className="border border-lol-gold/30 shadow-inner"
            />
          </div>
        )}
      </div>
    </div>
  );
}
