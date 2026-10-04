"use client";

import React, { useState, useEffect } from "react";
import { sounds } from "@/lib/sounds";
import { Calendar, MapPin, Swords, Sparkles, Trophy } from "lucide-react";

export default function HeroCountdown() {
  // Fecha del cumpleaños: Sábado 10 de Octubre de 2026 a las 20:30 hs
  const targetDate = new Date("2026-10-10T20:30:00-03:00").getTime();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <section
      id="inicio"
      className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden"
    >
      {/* Decorative Runes & Glows */}
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-lol-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-80 h-80 bg-lol-gold/15 rounded-full blur-3xl pointer-events-none" />

      {/* Hextech Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-lol-navy/80 border border-lol-gold/50 shadow-glow-gold mb-6 animate-pulse-glow">
        <Sparkles size={16} className="text-lol-gold" />
        <span className="text-xs uppercase font-mono font-bold tracking-[0.2em] text-lol-gold-light">
          Invocación Legendaria • Edición 2026
        </span>
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-4 font-beaufort">
        <span className="block text-white drop-shadow-md">MI CUMPLEAÑOS EN</span>
        <span className="gold-gradient-text block mt-1">LA GRIETA DEL INVOCADOR</span>
      </h1>

      {/* Subtitle / Venue & Date */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-sm sm:text-base text-gray-300 max-w-2xl mx-auto mb-10">
        <div className="flex items-center gap-2 bg-lol-navy/60 px-3 py-1.5 rounded border border-lol-gold/20">
          <Calendar size={18} className="text-lol-blue" />
          <span className="font-semibold text-lol-gold-light">Sábado 10 de Octubre de 2026</span>
        </div>
        <div className="flex items-center gap-2 bg-lol-navy/60 px-3 py-1.5 rounded border border-lol-gold/20">
          <MapPin size={18} className="text-lol-red" />
          <span className="font-semibold text-lol-gold-light">Congreso 533, San Lorenzo</span>
        </div>
      </div>

      {/* Countdown Timer Cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-xl w-full mb-12">
        {[
          { label: "DÍAS", value: timeLeft.days },
          { label: "HORAS", value: timeLeft.hours },
          { label: "MINUTOS", value: timeLeft.minutes },
          { label: "SEGUNDOS", value: timeLeft.seconds },
        ].map((unit, index) => (
          <div
            key={index}
            className="hextech-card p-3 sm:p-5 rounded-lg border border-lol-gold/40 flex flex-col items-center justify-center shadow-lg"
          >
            <div className="hextech-corner hextech-corner-tl" />
            <div className="hextech-corner hextech-corner-tr" />
            <div className="hextech-corner hextech-corner-bl" />
            <div className="hextech-corner hextech-corner-br" />

            <span className="text-2xl sm:text-4xl lg:text-5xl font-black font-mono text-lol-gold drop-shadow-sm">
              {String(unit.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] sm:text-xs text-gray-400 font-mono tracking-widest mt-1">
              {unit.label}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4 z-10">
        <a
          href="#campeones"
          onClick={() => sounds.playClick()}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black font-extrabold text-sm uppercase tracking-wider border border-lol-gold shadow-glow-gold transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <Swords size={18} />
          <span>Elegir mi Campeón (Lock-In)</span>
        </a>

        <a
          href="#minijuego"
          onClick={() => sounds.playClick()}
          className="flex items-center gap-2.5 px-6 py-3.5 rounded bg-lol-navy hover:bg-lol-metal text-lol-blue hover:text-white font-bold text-sm uppercase tracking-wider border border-lol-blue/50 shadow-glow-blue transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <Trophy size={18} />
          <span>Jugar en la Grieta</span>
        </a>

        <a
          href="#asistencia"
          onClick={() => sounds.playClick()}
          className="flex items-center gap-2 px-5 py-3 rounded bg-transparent hover:bg-white/5 text-gray-300 hover:text-lol-gold text-sm font-semibold border border-gray-700 hover:border-lol-gold/50 transition-all"
        >
          <span>Confirmar Asistencia</span>
        </a>
      </div>
    </section>
  );
}
