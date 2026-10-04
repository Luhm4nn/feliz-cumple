"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { RefreshCw } from "lucide-react";

interface UserChampionBannerProps {
  onChangeChampion: () => void;
}

export default function UserChampionBanner({
  onChangeChampion,
}: UserChampionBannerProps) {
  const { user } = useAuth();

  if (!user || !user.championName) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 mb-12">
      <div className="hextech-card rounded-2xl overflow-hidden border border-lol-gold/50 shadow-glow-gold relative p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 bg-gradient-to-r from-lol-navy via-lol-navy-black to-lol-navy">
        <div className="hextech-corner hextech-corner-tl" />
        <div className="hextech-corner hextech-corner-tr" />
        <div className="hextech-corner hextech-corner-bl" />
        <div className="hextech-corner hextech-corner-br" />

        <div className="flex items-center gap-4">
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
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-300 font-bold uppercase">
                ✓ Bloqueado para ti
              </span>
              {user.championRole && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-lol-gold/15 border border-lol-gold/30 text-lol-gold">
                  {user.championRole}
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-beaufort text-white leading-tight">
              {user.championName}
            </h3>
            <p className="text-xs text-lol-gold-light italic">
              Invocador: <strong>{user.name}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onChangeChampion();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-lol-navy border border-lol-gold/30 hover:border-lol-gold text-lol-gold-light hover:text-white text-xs font-semibold transition-all shadow"
        >
          <RefreshCw size={14} />
          <span>Cambiar mi campeón</span>
        </button>
      </div>
    </div>
  );
}
