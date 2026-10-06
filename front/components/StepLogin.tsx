"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { Swords, User, Calendar, MapPin, ArrowRight, Crown } from "lucide-react";
import { signIn } from "next-auth/react";

interface StepLoginProps {
  onSuccess: () => void;
}

export default function StepLogin({ onSuccess }: StepLoginProps) {
  const { loginQuick } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = () => {
    sounds.playClick();
    try {
      signIn("google", { callbackUrl: window.location.href });
    } catch (e) {
      console.error(e);
      setError("No se pudo conectar con Google. Puedes ingresar con tu nombre abajo.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Por favor ingresa tu nombre de invocador");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Por favor ingresa un correo electrónico válido");
      return;
    }

    sounds.playClick();
    setLoading(true);
    loginQuick(name.trim(), email.trim().toLowerCase());
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-lol-navy-black">
      {/* Decorative ambient glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-lol-blue/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-lol-gold/15 rounded-full blur-3xl pointer-events-none" />

      <div className="hextech-card rounded-2xl p-6 sm:p-10 max-w-lg w-full border border-lol-gold/50 shadow-glow-gold relative text-lol-gold-light">
        <div className="hextech-corner hextech-corner-tl" />
        <div className="hextech-corner hextech-corner-tr" />
        <div className="hextech-corner hextech-corner-bl" />
        <div className="hextech-corner hextech-corner-br" />

        {/* Top Crest */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-full bg-lol-navy border-2 border-lol-gold text-lol-gold mb-4 shadow-glow-gold">
            <Crown size={32} className="text-lol-gold" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lol-gold/10 border border-lol-gold/30 text-lol-gold font-mono text-[11px] uppercase font-bold tracking-widest mb-3">
            <span>Invitación Oficial • Edición 2026</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black font-beaufort text-white uppercase tracking-wide">
            LA GRIETA DE CONGRESO 533
          </h1>
          <p className="gold-gradient-text text-sm sm:text-base font-bold font-beaufort mt-1">
            MI CUMPLEAÑOS EN SUMMONER&apos;S RIFT
          </p>

          <div className="flex items-center justify-center gap-3 text-xs text-gray-400 mt-4">
            <span className="flex items-center gap-1">
              <Calendar size={13} className="text-lol-blue" />
              Sábado 10/10/2026
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <MapPin size={13} className="text-lol-red" />
              San Lorenzo
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-3.5 mb-6 rounded-lg bg-lol-navy/70 border border-lol-gold/20 text-xs text-gray-300 text-center leading-relaxed">
          Para ver los detalles de la fiesta y asegurar tu lugar, identifícate y luego <strong>elige a tu campeón único</strong>.
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-lol-red/20 border border-lol-red/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white text-gray-800 font-bold text-sm hover:bg-gray-100 transition-all shadow mb-5 transform hover:-translate-y-0.5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        <div className="relative flex py-2 items-center mb-5">
          <div className="flex-grow border-t border-lol-gold/20"></div>
          <span className="flex-shrink mx-3 text-[11px] text-gray-400 uppercase tracking-widest font-mono">
            o ingreso directo de invocador
          </span>
          <div className="flex-grow border-t border-lol-gold/20"></div>
        </div>

        {/* Quick Summoner Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-1.5 flex items-center gap-1.5">
              <User size={14} />
              <span>Tu Nombre / Nombre de Invocador</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Marcos, Sofía, Faker..."
              className="w-full px-4 py-2.5 bg-lol-navy-black border border-lol-gold/40 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lol-blue focus:shadow-glow-blue transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-1.5">
              Tu Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@gmail.com"
              className="w-full px-4 py-2.5 bg-lol-navy-black border border-lol-gold/40 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lol-blue focus:shadow-glow-blue transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black font-extrabold text-sm uppercase tracking-wider rounded-lg border border-lol-gold shadow-glow-gold flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 mt-2"
          >
            <Swords size={18} />
            <span>Continuar a Selección de Campeón</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
