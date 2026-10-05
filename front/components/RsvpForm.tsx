"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { CheckCircle2, Swords, MessageSquare, Beer, Edit3, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";
import { submitRsvp } from "@/lib/api";
import { getChampionKit } from "@/lib/championSkills";

interface RsvpFormProps {
  onRsvpSuccess: () => void;
  onOpenAuth: () => void;
}

export default function RsvpForm({ onRsvpSuccess, onOpenAuth }: RsvpFormProps) {
  const { user, isLoggedIn, updateGuestData } = useAuth();
  const championKit = getChampionKit(user?.championName, user?.championRole);

  const [rsvpStatus, setRsvpStatus] = useState<"ATTENDING" | "TENTATIVE" | "DECLINED">(
    user?.rsvpStatus && user.rsvpStatus !== "PENDING" ? user.rsvpStatus : "ATTENDING"
  );
  const [beverage, setBeverage] = useState(
    user?.dietaryNotes || championKit.potionRecommendation
  );
  const [message, setMessage] = useState(user?.message || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(!user?.rsvpStatus || user.rsvpStatus === "PENDING");
  const [successToast, setSuccessToast] = useState("");

  const handleSubmit = async (statusOverride?: "ATTENDING" | "TENTATIVE" | "DECLINED") => {
    const finalStatus = statusOverride || rsvpStatus;

    if (!isLoggedIn || !user) {
      sounds.playClick();
      onOpenAuth();
      return;
    }

    try {
      setIsSubmitting(true);
      sounds.playClick();

      await submitRsvp({
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        rsvpStatus: finalStatus,
        dietaryNotes: beverage,
        message,
        championId: user.championId,
        championName: user.championName,
        championTitle: user.championTitle,
        championRole: user.championRole,
        championImage: user.championImage,
      });

      updateGuestData({
        rsvpStatus: finalStatus,
        dietaryNotes: beverage,
        message,
      });

      sounds.playVictory();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#C8AA6E", "#0AC8B9", "#F0E6D2", "#E84057"],
      });

      setSuccessToast("¡Estado actualizado en la Grieta!");
      setIsEditing(false);
      onRsvpSuccess();
      setTimeout(() => setSuccessToast(""), 4000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al actualizar asistencia");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConfirmed = user?.rsvpStatus === "ATTENDING";
  const isTentative = user?.rsvpStatus === "TENTATIVE";

  return (
    <section id="asistencia" className="py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lol-gold/15 border border-lol-gold/30 text-lol-gold text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Swords size={14} />
          <span>Llamada a las Armas</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold font-beaufort gold-gradient-text uppercase">
          CONFIRMACIÓN DE ASISTENCIA
        </h2>
        <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-md mx-auto">
          Confirmá en un toque para asegurar tu porción de choripanes el 10/10 a las 8:30 PM.
        </p>
      </div>

      <div className="hextech-card rounded-2xl p-5 sm:p-7 border border-lol-gold/40 shadow-glow-gold relative">
        <div className="hextech-corner hextech-corner-tl" />
        <div className="hextech-corner hextech-corner-tr" />
        <div className="hextech-corner hextech-corner-bl" />
        <div className="hextech-corner hextech-corner-br" />

        {/* Success Alert */}
        {successToast && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* State 1: Already has status and NOT editing (Brief & clear view) */}
        {!isEditing && user?.rsvpStatus && user.rsvpStatus !== "PENDING" ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 p-4 sm:p-5 rounded-xl bg-lol-navy/90 border border-lol-gold/30">
            <div className="flex items-center gap-4">
              {user.championImage ? (
                <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-lol-gold shadow-glow-gold shrink-0">
                  <img src={user.championImage} alt={user.championName || "Campeón"} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-full bg-lol-gold/20 flex items-center justify-center text-xl text-lol-gold border border-lol-gold shrink-0">
                  🛡️
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-xs font-mono px-2.5 py-0.5 rounded font-bold uppercase ${
                      isConfirmed
                        ? "bg-emerald-900/90 border border-emerald-400 text-emerald-300"
                        : isTentative
                        ? "bg-amber-900/90 border border-amber-400 text-amber-300"
                        : "bg-red-900/90 border border-red-400 text-red-300"
                    }`}
                  >
                    {isConfirmed ? "✓ ¡Asistencia Confirmada!" : isTentative ? "⏳ En Duda (En Base)" : "💀 No podré asistir"}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {user.name} • <span className="text-lol-gold">{user.championName || "Sin campeón"}</span>
                </h3>
                {user.dietaryNotes && (
                  <p className="text-xs text-gray-300 mt-0.5">
                    🍻 Bebida/Poción: <span className="text-lol-gold-light font-semibold">{user.dietaryNotes}</span>
                  </p>
                )}
                {user.message && (
                  <p className="text-xs text-lol-blue italic mt-0.5">
                    "{user.message}"
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  onOpenAuth();
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-lol-navy-black hover:bg-lol-metal border border-lol-gold/40 hover:border-lol-gold text-lol-gold-light text-xs font-semibold transition-all shadow"
              >
                <RefreshCw size={13} />
                <span>Cambiar Campeón</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-lol-navy-black hover:bg-lol-metal border border-lol-gold/40 hover:border-lol-gold text-lol-gold-light text-xs font-semibold transition-all shadow"
              >
                <Edit3 size={13} />
                <span>Modificar</span>
              </button>
            </div>
          </div>
        ) : (
          /* State 2: Edit / Quick confirmation form */
          <div className="space-y-5">
            {/* Quick Status Buttons */}
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-2">
                ¿Venís a los choripanes el 10/10 a las 8:30 PM?
              </label>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  { id: "ATTENDING", label: "¡A la Batalla!", sub: "Confirmo 100%", emoji: "⚔️", activeColor: "border-emerald-500 bg-emerald-950/60 text-emerald-200 ring-1 ring-emerald-400" },
                  { id: "TENTATIVE", label: "En Duda", sub: "Por confirmar", emoji: "⏳", activeColor: "border-amber-500 bg-amber-950/60 text-amber-200 ring-1 ring-amber-400" },
                  { id: "DECLINED", label: "AFK", sub: "No puedo ir", emoji: "💀", activeColor: "border-red-500 bg-red-950/60 text-red-200 ring-1 ring-red-400" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setRsvpStatus(opt.id as any);
                    }}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      rsvpStatus === opt.id
                        ? opt.activeColor
                        : "bg-lol-navy/70 border-lol-gold/20 hover:border-lol-gold/40 text-gray-400"
                    }`}
                  >
                    <div className="text-xl sm:text-2xl mb-1">{opt.emoji}</div>
                    <div className="font-bold text-xs sm:text-sm text-white">{opt.label}</div>
                    <div className="text-[10px] text-gray-400">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Beverage & Message Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-1.5 flex items-center gap-1.5">
                  <Beer size={14} className="text-emerald-400" />
                  <span>¿Qué bebida vas a llevar? (Opcional)</span>
                </label>
                <input
                  type="text"
                  value={beverage}
                  onChange={(e) => setBeverage(e.target.value)}
                  placeholder="Ej: Birra, Fernet, Gin Tonic, Coca-Cola..."
                  className="w-full px-3 py-2 bg-lol-navy-black border border-lol-gold/30 rounded-lg text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lol-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-1.5 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-lol-blue" />
                  <span>Mensaje para el cumpleañero (Opcional)</span>
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Un saludo o advertencia para la Grieta..."
                  className="w-full px-3 py-2 bg-lol-navy-black border border-lol-gold/30 rounded-lg text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-lol-blue"
                />
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting}
                className="flex-1 py-3 px-5 rounded-lg bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black font-extrabold text-xs sm:text-sm uppercase tracking-wider border border-lol-gold shadow-glow-gold transition-all duration-200 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <Swords size={16} />
                <span>{isSubmitting ? "Guardando..." : "GUARDAR ASISTENCIA"}</span>
              </button>

              {user?.rsvpStatus && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="py-3 px-4 rounded-lg bg-lol-navy border border-gray-700 hover:border-gray-500 text-gray-400 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
