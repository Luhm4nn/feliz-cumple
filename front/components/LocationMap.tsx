"use client";

import React, { useState } from "react";
import { sounds } from "@/lib/sounds";
import { MapPin, Navigation, Copy, Check, ExternalLink } from "lucide-react";

export default function LocationMap() {
  const [copied, setCopied] = useState(false);
  const address = "Congreso 533, San Lorenzo, Santa Fe, Argentina";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    address
  )}`;
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}`;
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    address
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const handleCopy = () => {
    sounds.playClick();
    navigator.clipboard.writeText("Congreso 533, San Lorenzo");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <section id="ubicacion" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-xs sm:text-sm font-mono tracking-[0.25em] text-lol-red uppercase font-bold mb-2">
          Coordenadas de la Grieta
        </h2>
        <h3 className="text-3xl sm:text-4xl font-extrabold font-beaufort gold-gradient-text">
          CÓMO LLEGAR A MI CASA
        </h3>
        <p className="text-gray-400 max-w-lg mx-auto text-sm mt-2">
          Te espero en Congreso 533 (San Lorenzo). Podés usar Google Maps o Waze para guiarte en el viaje.
        </p>
      </div>

      <div className="hextech-card rounded-xl overflow-hidden border border-lol-gold/40 shadow-glow-gold max-w-5xl mx-auto">
        {/* Top Info Bar */}
        <div className="bg-lol-navy p-4 sm:p-6 border-b border-lol-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-lol-red/20 text-lol-red border border-lol-red/40">
              <MapPin size={22} />
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-lol-gold font-bold">
                Dirección Oficial
              </div>
              <div className="text-base sm:text-lg font-bold text-white">
                Congreso 533, San Lorenzo
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-lol-navy-black border border-lol-gold/40 hover:border-lol-gold text-lol-gold-light hover:text-white rounded text-xs font-medium transition-all"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              <span>{copied ? "¡Copiado!" : "Copiar Dirección"}</span>
            </button>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sounds.playClick()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-lol-gold-dark to-lol-gold hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black rounded text-xs font-bold transition-all shadow"
            >
              <Navigation size={14} />
              <span>Google Maps</span>
              <ExternalLink size={12} />
            </a>

            <a
              href={wazeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => sounds.playClick()}
              className="flex items-center gap-1.5 px-4 py-2 bg-lol-navy-black hover:bg-lol-metal border border-lol-blue/50 text-lol-blue hover:text-white rounded text-xs font-bold transition-all"
            >
              <span>Waze</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Google Maps Iframe */}
        <div className="relative w-full h-[380px] sm:h-[450px] bg-lol-navy-black">
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen={false}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Mapa Congreso 533 San Lorenzo"
            className="w-full h-full filter saturate-[1.1] contrast-[1.05]"
          />
        </div>
      </div>
    </section>
  );
}
