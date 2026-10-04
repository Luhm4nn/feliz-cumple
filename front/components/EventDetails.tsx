"use client";

import React from "react";
import { sounds } from "@/lib/sounds";
import { Calendar, Clock, MapPin, Beer, Shirt, ShieldCheck } from "lucide-react";

export default function EventDetails() {
  const cards = [
    {
      icon: <Calendar className="text-lol-gold" size={26} />,
      title: "Día de la Batalla",
      detail: "Sábado 10 de Octubre de 2026",
      subtext: "Guardá la fecha en tu calendario de invocador",
    },
    {
      icon: <Clock className="text-lol-blue" size={26} />,
      title: "Hora de Partida",
      detail: "20:30 hs en punto",
      subtext: "Hasta que caiga el Nexo enemigo (toda la noche)",
    },
    {
      icon: <MapPin className="text-lol-red" size={26} />,
      title: "Base Principal (Lugar)",
      detail: "Congreso 533, San Lorenzo",
      subtext: "San Lorenzo, Santa Fe • Con mapa interactivo abajo",
    },
    {
      icon: <Beer className="text-amber-400" size={26} />,
      title: "Pociones & Banquete",
      detail: "Buffet del Barón & Pociones",
      subtext: "Health Potions (tragos/birra), Mana Potions (sin alcohol) y comida",
    },
    {
      icon: <Shirt className="text-purple-400" size={26} />,
      title: "Código de Vestimenta",
      detail: "Casual / Remera de LoL",
      subtext: "Cosplays y atuendos temáticos son más que bienvenidos",
    },
    {
      icon: <ShieldCheck className="text-emerald-400" size={26} />,
      title: "Regla de Oro",
      detail: "Campeón Único por Invitado",
      subtext: "Elegí y bloqueá tu campeón antes de que otro lo tome",
    },
  ];

  return (
    <section id="evento" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-xs sm:text-sm font-mono tracking-[0.25em] text-lol-blue uppercase font-bold mb-2">
          Detalles de la Convocatoria
        </h2>
        <h3 className="text-3xl sm:text-4xl font-extrabold font-beaufort gold-gradient-text">
          INFORMACIÓN DE LA PARTIDA
        </h3>
        <p className="text-gray-400 max-w-xl mx-auto text-sm mt-2">
          Todos los invocadores confirmados compartirán el banquete, las pociones y la gloria en mi casa.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            onMouseEnter={() => sounds.playHover()}
            className="hextech-card p-6 rounded-lg border border-lol-gold/30 hover:border-lol-gold transition-all duration-300 transform hover:-translate-y-1 shadow-md"
          >
            <div className="hextech-corner hextech-corner-tl" />
            <div className="hextech-corner hextech-corner-tr" />
            <div className="hextech-corner hextech-corner-bl" />
            <div className="hextech-corner hextech-corner-br" />

            <div className="p-3 w-fit rounded-lg bg-lol-navy border border-lol-gold/40 mb-4 shadow-inner">
              {card.icon}
            </div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-1">
              {card.title}
            </h4>
            <div className="text-lg font-bold text-white mb-1">
              {card.detail}
            </div>
            <p className="text-xs text-gray-400">
              {card.subtext}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
