"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { X, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { signIn } from "next-auth/react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageNotice?: string;
}

export default function AuthModal({ isOpen, onClose, messageNotice }: AuthModalProps) {
  const { loginQuick } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    sounds.playClick();
    try {
      signIn("google", { callbackUrl: window.location.href });
    } catch (e) {
      console.error(e);
      setError("No se pudo conectar con Google. Puedes ingresar con el modo Invocador abajo.");
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
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
    setIsSubmitting(true);
    loginQuick(name.trim(), email.trim().toLowerCase());
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-lol-navy-dark border border-lol-gold/50 rounded-lg shadow-glow-gold p-6 text-lol-gold-light">
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
          className="absolute top-4 right-4 text-gray-400 hover:text-lol-gold transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-lol-navy border border-lol-gold/40 text-lol-gold mb-3 shadow-inner">
            <Sparkles size={28} />
          </div>
          <h2 className="text-xl font-bold font-beaufort gold-gradient-text uppercase tracking-wider">
            Portal de Invocadores
          </h2>
          <p className="text-xs text-gray-300 mt-1">
            Identifícate para bloquear tu campeón exclusivo y confirmar tu asistencia a la fiesta.
          </p>
          {messageNotice && (
            <div className="mt-3 p-2 rounded bg-lol-blue/10 border border-lol-blue/30 text-lol-blue text-xs flex items-center gap-1.5 justify-center">
              <ShieldAlert size={14} />
              <span>{messageNotice}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded bg-lol-red/20 border border-lol-red/50 text-red-200 text-xs">
            {error}
          </div>
        )}

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded bg-white text-gray-800 font-semibold text-sm hover:bg-gray-100 transition-all shadow mb-4"
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

        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-lol-gold/20"></div>
          <span className="flex-shrink mx-4 text-[11px] text-gray-400 uppercase tracking-widest">
            o acceso directo de invocador
          </span>
          <div className="flex-grow border-t border-lol-gold/20"></div>
        </div>

        {/* Quick Summoner Form */}
        <form onSubmit={handleQuickSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-lol-gold uppercase tracking-wider mb-1">
              Nombre de Invocador / Tu Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Faker, Juani, Marcos..."
              className="w-full px-3 py-2 bg-lol-navy-black border border-lol-gold/40 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lol-blue"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-lol-gold uppercase tracking-wider mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@gmail.com"
              className="w-full px-3 py-2 bg-lol-navy-black border border-lol-gold/40 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lol-blue"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black font-bold text-sm rounded border border-lol-gold shadow-glow-gold flex items-center justify-center gap-2 transition-all"
          >
            <UserCheck size={16} />
            <span>Ingresar a la Grieta</span>
          </button>
        </form>
      </div>
    </div>
  );
}
