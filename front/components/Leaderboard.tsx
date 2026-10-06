"use client";

import React, { useState, useEffect } from "react";
import { sounds } from "@/lib/sounds";
import { Trophy, Medal, Crown, Flame, Swords, RefreshCw } from "lucide-react";
import { getScores, ScoreItem } from "@/lib/api";

interface LeaderboardProps {
  refreshTrigger?: number;
}

export default function Leaderboard({ refreshTrigger = 0 }: LeaderboardProps) {
  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScores = async () => {
    try {
      setLoading(true);
      const data = await getScores();
      // Asegurar que quede únicamente el mejor récord por jugador
      const seen = new Set<string>();
      const unique = data.filter((s) => {
        const key = s.player?.name || s.id;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setScores(unique);
    } catch (e) {
      console.error("Error loading scores:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScores();
  }, [refreshTrigger]);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-400/50 text-amber-300 font-bold text-xs tracking-wider font-beaufort shadow-glow-gold">
          <Crown size={15} className="text-amber-300 shrink-0" />
          <span>CHALLENGER #1</span>
        </div>
      );
    }
    if (index === 1) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-400/15 border border-slate-300/40 text-slate-200 font-bold text-xs tracking-wider font-beaufort">
          <Medal size={14} className="shrink-0" />
          <span>GRAN MAESTRO #2</span>
        </div>
      );
    }
    if (index === 2) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-700/20 border border-amber-600/40 text-amber-500 font-bold text-xs tracking-wider font-beaufort">
          <Medal size={14} className="shrink-0" />
          <span>MAESTRO #3</span>
        </div>
      );
    }
    return (
      <span className="font-mono text-xs font-bold text-gray-400 px-2 py-1">
        #{index + 1}
      </span>
    );
  };

  return (
    <div className="hextech-card rounded-xl p-6 border border-lol-gold/40 shadow-glow-gold relative">
      <div className="hextech-corner hextech-corner-tl" />
      <div className="hextech-corner hextech-corner-tr" />
      <div className="hextech-corner hextech-corner-bl" />
      <div className="hextech-corner hextech-corner-br" />

      <div className="flex items-center justify-between mb-6 pb-4 border-b border-lol-gold/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-lol-navy text-lol-gold border border-lol-gold/40">
            <Trophy size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold font-beaufort gold-gradient-text uppercase">
              Ranking de la Grieta
            </h3>
            <p className="text-xs text-gray-400">
              Mejor récord por jugador en el minijuego de Congreso 533
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            fetchScores();
          }}
          title="Actualizar tabla"
          className="p-2 rounded bg-lol-navy border border-lol-gold/30 hover:border-lol-gold text-lol-gold-light transition-all"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 animate-pulse">
          Consultando a los árbitros de la Grieta...
        </div>
      ) : scores.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400">
          Aún no hay puntuaciones registradas. ¡Sé el primero en jugar y marcar el récord!
        </div>
      ) : (
        <div className="space-y-2.5">
          {scores.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                idx === 0
                  ? "bg-gradient-to-r from-lol-gold/15 to-transparent border-lol-gold shadow-glow-gold"
                  : idx < 3
                  ? "bg-lol-navy/70 border-lol-gold/30"
                  : "bg-lol-navy/40 border-lol-gold/15"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="shrink-0 flex items-center justify-center min-w-[36px] sm:min-w-[130px]">
                  {getRankBadge(idx)}
                </div>

                {item.player.championImage ? (
                  <img
                    src={item.player.championImage}
                    alt={item.player.championName || "Campeón"}
                    className="w-9 h-9 rounded-full object-cover border border-lol-gold"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-lol-gold/20 flex items-center justify-center text-xs text-lol-gold border border-lol-gold/40">
                    <Swords size={16} />
                  </div>
                )}

                <div>
                  <div className="text-sm font-bold text-white leading-tight flex items-center gap-2">
                    <span>{item.player.name}</span>
                    {item.baronStolen && (
                      <span className="px-1.5 py-0.2 rounded bg-purple-900/80 border border-purple-400 text-purple-200 text-[10px] font-mono flex items-center gap-0.5">
                        <Flame size={10} />
                        Baron Steal
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-lol-gold-light">
                    {item.player.championName || item.championId}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base sm:text-lg font-black font-mono text-lol-gold">
                  {item.score.toLocaleString()}
                </div>
                <div className="text-[10px] text-gray-400">puntos</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
