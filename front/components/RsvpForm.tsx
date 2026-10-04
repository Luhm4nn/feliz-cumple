"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { Sparkles, Send, Beer, Utensils, MessageSquare } from "lucide-react";
import confetti from "canvas-confetti";
import { submitRsvp } from "@/lib/api";

interface RsvpFormProps {
  onRsvpSuccess: () => void;
  onOpenAuth: () => void;
}

export default function RsvpForm({ onRsvpSuccess, onOpenAuth }: RsvpFormProps) {
  const { user, isLoggedIn, updateGuestData } = useAuth();

  const [rsvpStatus, setRsvpStatus] = useState<"ATTENDING" | "TENTATIVE" | "DECLINED">(
    user?.rsvpStatus || "ATTENDING"
  );
  const [dietaryNotes, setDietaryNotes] = useState(user?.dietaryNotes || "Poción de Vida (Trago / Birra)");
  const [foodPreference, setFoodPreference] = useState("Banquete Asado");
  const [message, setMessage] = useState(user?.message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isLoggedIn || !user) {
      sounds.playClick();
      onOpenAuth();
      return;
    }

    try {
      setIsSubmitting(true);
      sounds.playClick();

      const combinedDietary = `${dietaryNotes} | Menú: ${foodPreference}`;

      await submitRsvp({
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        rsvpStatus,
        dietaryNotes: combinedDietary,
        message,
        championId: user.championId,
        championName: user.championName,
        championTitle: user.championTitle,
        championRole: user.championRole,
        championImage: user.championImage,
      });

      updateGuestData({
        rsvpStatus,
        dietaryNotes: combinedDietary,
        message,
      });

      sounds.playVictory();
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#C8AA6E", "#0AC8B9", "#F0E6D2", "#E84057"],
      });

      setSuccessMessage("¡Tu confirmación ha sido guardada en la Grieta del Cumpleañero!");
      onRsvpSuccess();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Error al procesar la confirmación");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="asistencia" className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-xs sm:text-sm font-mono tracking-[0.25em] text-lol-gold uppercase font-bold mb-2">
          Llamada a las Armas
        </h2>
        <h3 className="text-3xl sm:text-4xl font-extrabold font-beaufort gold-gradient-text">
          CONFIRMA TU ASISTENCIA
        </h3>
        <p className="text-gray-300 max-w-lg mx-auto text-sm mt-2">
          Asegura tu lugar en el banquete del 10/10/2026. Elegí tus preferencias de bebidas, comida y dejale unas palabras al cumpleañero.
        </p>
      </div>

      <div className="hextech-card rounded-xl p-6 sm:p-8 border border-lol-gold/40 shadow-glow-gold relative">
        <div className="hextech-corner hextech-corner-tl" />
        <div className="hextech-corner hextech-corner-tr" />
        <div className="hextech-corner hextech-corner-bl" />
        <div className="hextech-corner hextech-corner-br" />

        {/* Identity & Champion Status Preview */}
        <div className="mb-6 p-4 rounded-lg bg-lol-navy border border-lol-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user?.championImage ? (
              <img
                src={user.championImage}
                alt={user.championName || "Campeón"}
                className="w-12 h-12 rounded-full object-cover border-2 border-lol-gold shadow-glow-gold"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-lol-gold/20 flex items-center justify-center text-xl text-lol-gold border border-lol-gold/40">
                🛡️
              </div>
            )}
            <div>
              <div className="text-xs font-mono uppercase text-lol-gold font-bold">
                Invocador Identificado
              </div>
              <div className="text-base font-bold text-white">
                {user ? user.name : "Invocador Anónimo"}
              </div>
              <div className="text-xs text-lol-blue">
                {user?.championName ? (
                  <span>Campeón Fijado: <strong>{user.championName}</strong> ({user.championRole})</span>
                ) : (
                  <a href="#campeones" className="underline hover:text-white">
                    ¡Aún no elegiste tu campeón! Haz clic para fijarlo
                  </a>
                )}
              </div>
            </div>
          </div>

          {!isLoggedIn && (
            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2 bg-lol-gold hover:bg-lol-gold-light text-lol-navy-black text-xs font-bold rounded uppercase tracking-wider transition-all"
            >
              Identificarme primero
            </button>
          )}
        </div>

        {successMessage && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-sm font-semibold flex items-center gap-2">
            <Sparkles size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 rounded-lg bg-lol-red/20 border border-lol-red/50 text-red-200 text-sm font-semibold">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-3">
              ¿Vendrás a la Grieta el 10/10/2026?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  id: "ATTENDING",
                  label: "¡A la Batalla!",
                  sub: "Asistencia Confirmada",
                  emoji: "⚔️",
                  color: "border-emerald-500 bg-emerald-950/40 text-emerald-200",
                },
                {
                  id: "TENTATIVE",
                  label: "En Base",
                  sub: "En Duda / Por Confirmar",
                  emoji: "⏳",
                  color: "border-amber-500 bg-amber-950/40 text-amber-200",
                },
                {
                  id: "DECLINED",
                  label: "AFK",
                  sub: "No podré asistir",
                  emoji: "💀",
                  color: "border-lol-red bg-red-950/40 text-red-200",
                },
              ].map((opt) => {
                const isSelected = rsvpStatus === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setRsvpStatus(opt.id as any);
                    }}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      isSelected
                        ? `${opt.color} ring-2 ring-lol-gold shadow-glow-gold`
                        : "bg-lol-navy border-lol-gold/20 hover:border-lol-gold/50 text-gray-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">{opt.emoji}</div>
                    <div className="font-bold text-sm text-white">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Drink & Food Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-2 flex items-center gap-1.5">
                <Beer size={15} />
                <span>Poción de Preferencia</span>
              </label>
              <select
                value={dietaryNotes}
                onChange={(e) => setDietaryNotes(e.target.value)}
                className="w-full px-3 py-2.5 bg-lol-navy-black border border-lol-gold/40 rounded-lg text-sm text-white focus:outline-none focus:border-lol-blue"
              >
                <option value="Poción de Vida (Trago / Birra)">🧪 Poción de Vida (Cerveza / Tragos)</option>
                <option value="Poción de Maná (Gaseosa / Agua)">💧 Poción de Maná (Sin Alcohol)</option>
                <option value="Poción de Corrupción (Lo que pinte)">🍵 Poción de Corrupción (Cualquier brebaje)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-2 flex items-center gap-1.5">
                <Utensils size={15} />
                <span>Menú / Dieta</span>
              </label>
              <select
                value={foodPreference}
                onChange={(e) => setFoodPreference(e.target.value)}
                className="w-full px-3 py-2.5 bg-lol-navy-black border border-lol-gold/40 rounded-lg text-sm text-white focus:outline-none focus:border-lol-blue"
              >
                <option value="Banquete Asado">🥩 Asado Tradicional</option>
                <option value="Vegetariano">🥗 Vegetariano</option>
                <option value="Vegano">🌱 Vegano</option>
                <option value="Sin TACC / Celíaco">🌾 Sin TACC (Celíaco)</option>
              </select>
            </div>
          </div>

          {/* Dedication Message */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-2 flex items-center gap-1.5">
              <MessageSquare size={15} />
              <span>Mensaje o Dedicatoria para el Cumpleañero</span>
            </label>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe un mensaje épico, saludo o advertencia de invocador..."
              className="w-full px-4 py-3 bg-lol-navy-black border border-lol-gold/40 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lol-blue"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black font-extrabold text-sm sm:text-base uppercase tracking-wider border border-lol-gold shadow-glow-gold transition-all duration-200 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
          >
            <Send size={18} />
            <span>{isSubmitting ? "Enviando Pergamino..." : "CONFIRMAR INVITACIÓN"}</span>
          </button>
        </form>
      </div>
    </section>
  );
}
