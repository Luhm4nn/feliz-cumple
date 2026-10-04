"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { Volume2, VolumeX, User, LogOut, Sparkles } from "lucide-react";

interface NavbarProps {
  onOpenAuth: () => void;
}

export default function Navbar({ onOpenAuth }: NavbarProps) {
  const { user, isLoggedIn, logout } = useAuth();
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
    if (!muted) sounds.playClick();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-lol-navy-black/90 backdrop-blur-md border-b border-lol-gold/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo / Title */}
        <a
          href="#inicio"
          onClick={() => sounds.playClick()}
          className="flex items-center gap-3 group"
        >
          <div className="w-11 h-11 relative rounded-full border border-lol-gold/60 p-1 bg-gradient-to-br from-lol-gold/20 to-transparent group-hover:border-lol-blue transition-all">
            <div className="w-full h-full rounded-full bg-lol-navy flex items-center justify-center text-lol-gold font-bold text-lg group-hover:text-lol-blue">
              🎂
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-beaufort text-xs tracking-[0.25em] text-lol-gold uppercase font-semibold">
                La Grieta del Cumpleaños
              </span>
              <span className="bg-lol-blue/20 text-lol-blue text-[10px] px-1.5 py-0.5 rounded border border-lol-blue/40 font-mono">
                10/10/26
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-lol-gold-light tracking-wide group-hover:text-white transition-colors">
              Congreso 533 • San Lorenzo
            </h1>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a
            href="#inicio"
            onClick={() => sounds.playClick()}
            className="text-gray-300 hover:text-lol-gold transition-colors"
          >
            Inicio
          </a>
          <a
            href="#evento"
            onClick={() => sounds.playClick()}
            className="text-gray-300 hover:text-lol-gold transition-colors"
          >
            El Evento
          </a>
          <a
            href="#campeones"
            onClick={() => sounds.playClick()}
            className="text-gray-300 hover:text-lol-gold transition-colors"
          >
            Campeones
          </a>
          <a
            href="#minijuego"
            onClick={() => sounds.playClick()}
            className="text-gray-300 hover:text-lol-gold transition-colors"
          >
            Minijuego
          </a>
          <a
            href="#invocadores"
            onClick={() => sounds.playClick()}
            className="text-gray-300 hover:text-lol-gold transition-colors"
          >
            Invocadores
          </a>
          <a
            href="#ubicacion"
            onClick={() => sounds.playClick()}
            className="text-gray-300 hover:text-lol-gold transition-colors"
          >
            Ubicación
          </a>
        </nav>

        {/* Controls: Audio & User Profile */}
        <div className="flex items-center gap-3">
          {/* Audio toggle button */}
          <button
            onClick={handleToggleSound}
            title={isMuted ? "Activar efectos de sonido" : "Silenciar sonidos"}
            className="p-2.5 rounded border border-lol-gold/30 bg-lol-navy hover:bg-lol-metal hover:border-lol-gold text-lol-gold transition-all"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* User state */}
          {isLoggedIn && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-lol-gold/20">
              <div className="flex items-center gap-2 bg-lol-navy/80 border border-lol-gold/40 px-3 py-1.5 rounded-full">
                {user.championImage ? (
                  <div className="w-7 h-7 relative rounded-full overflow-hidden border border-lol-gold">
                    <img
                      src={user.championImage}
                      alt={user.championName || "Campeón"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full border border-lol-gold/50"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-lol-gold/20 flex items-center justify-center text-xs text-lol-gold">
                    <User size={14} />
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-lol-gold-light truncate max-w-[100px]">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-lol-blue truncate max-w-[100px]">
                    {user.championName ? `⚔️ ${user.championName}` : "Sin campeón"}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  sounds.playClick();
                  logout();
                }}
                title="Cerrar sesión"
                className="p-2 rounded text-gray-400 hover:text-lol-red hover:bg-lol-red/10 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAuth();
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black font-bold text-xs sm:text-sm px-4 py-2 rounded border border-lol-gold-light shadow-glow-gold transition-all duration-200"
            >
              <Sparkles size={16} />
              <span>Identifícate</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
