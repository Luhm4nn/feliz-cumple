"use client";

import React from "react";
import { sounds } from "@/lib/sounds";
import { Utensils, Clock, Beer, Trophy } from "lucide-react";

export default function EventDetails() {
  const highlights = [
    {
      icon: <Utensils className="text-amber-400" size={26} />,
      badge: "BANQUETE DEL BARÓN",
      title: "Choripanes a la Parrilla",
      detail: "¡Choris calientes a las brasas de Dragón Infernal!",
      description:
        "La comida oficial de la victoria: choripanes épicos para recargar la barra de vida al 100%.",
      glowColor: "hover:border-amber-400/60 shadow-amber-500/10",
    },
    {
      icon: <Clock className="text-lol-blue" size={26} />,
      badge: "HORA DE DESPLIEGUE",
      title: "Estar a las 8:30 PM (20:30 hs)",
      detail: "Llegada puntual para armar el lobby de la fiesta",
      description:
        "No te quedes AFK en base. Arrancamos a las 20:30 hs para disfrutar la previa, la comida y el minijuego.",
      glowColor: "hover:border-lol-blue/60 shadow-cyan-500/10",
    },
    {
      icon: <Beer className="text-emerald-400" size={26} />,
      badge: "POCIONES LIBRES",
      title: "Llevar Bebidas quienes quieran",
      detail: "Health Potions, Mana & Elixires artesanales",
      description:
        "Traé tu bebida favorita (birra, fernet, tragos o gaseosas) para mantener tu maná al máximo toda la noche.",
      glowColor: "hover:border-emerald-400/60 shadow-emerald-500/10",
    },
    {
      icon: <Trophy className="text-purple-400" size={26} />,
      badge: "AFTER-PARTY / FENDY",
      title: "Torneo en Fendy (A Confirmar)",
      detail: "Raid nocturno al boliche tras destruir el Nexo",
      description:
        "Al terminar en Congreso 533, el escuadrón evalúa ir a tirar pasos y disputar el torneo de baile en Fendy.",
      glowColor: "hover:border-purple-400/60 shadow-purple-500/10",
    },
  ];

  return (
    <section id="evento" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Info General */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-lol-gold/15 border border-lol-gold/30 text-lol-gold text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <span>Información General de la Partida</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-beaufort gold-gradient-text uppercase">
          REGLAS, BANQUETE & AFTER
        </h2>
        <p className="text-gray-300 max-w-xl mx-auto text-sm mt-2">
          Todo lo que necesitás saber para la noche del Sábado 10 de Octubre en Congreso 533 (San Lorenzo).
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {highlights.map((item, idx) => (
          <div
            key={idx}
            onMouseEnter={() => sounds.playHover()}
            className={`hextech-card p-5 rounded-xl border border-lol-gold/30 transition-all duration-300 transform hover:-translate-y-1.5 shadow-lg flex flex-col justify-between ${item.glowColor}`}
          >
            <div className="hextech-corner hextech-corner-tl" />
            <div className="hextech-corner hextech-corner-tr" />
            <div className="hextech-corner hextech-corner-bl" />
            <div className="hextech-corner hextech-corner-br" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-lg bg-lol-navy border border-lol-gold/30 shadow-inner">
                  {item.icon}
                </div>
                <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-black/60 border border-lol-gold/20 text-lol-gold font-bold">
                  {item.badge}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white mb-1 leading-snug">
                {item.title}
              </h3>
              <div className="text-xs text-lol-gold-light font-semibold mb-2">
                {item.detail}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-lol-gold/15 flex items-center justify-between text-[11px] font-mono text-gray-500">
              <span>Sábado 10/10 • 20:30</span>
              <span className="text-lol-gold">✓ Requerido</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
