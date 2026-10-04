"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import { Trophy, Play, RotateCcw, Zap, Flame, Heart, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { submitScore } from "@/lib/api";

interface MinigameProps {
  onScoreSaved: () => void;
  onOpenAuth: () => void;
}

export default function Minigame({ onScoreSaved, onOpenAuth }: MinigameProps) {
  const { user, isLoggedIn } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game state
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [baronsStolen, setBaronsStolen] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cooldowns & Abilities
  const [abilityCooldown, setAbilityCooldown] = useState(0); // 0 to 100%
  const [abilityReady, setAbilityReady] = useState(true);

  // Active champion info
  const playerRole = user?.championRole || "Mage";
  const championName = user?.championName || "Ahri";
  const championImage = user?.championImage || "https://ddragon.leagueoflegends.com/cdn/16.19.1/img/champion/Ahri.png";

  // Ability names and descriptions by role
  const roleAbilityInfo: Record<
    string,
    { name: string; desc: string; key: string }
  > = {
    Assassin: { name: "Destello Sombrío", desc: "Invulnerabilidad y salto hacia adelante", key: "ESPACIO" },
    Mage: { name: "Onda Arcana", desc: "Destruye todos los proyectiles en pantalla", key: "ESPACIO" },
    Tank: { name: "Escudo de Hierro", desc: "Invulnerabilidad total por 4 segundos", key: "ESPACIO" },
    Marksman: { name: "Ráfaga de Fuego", desc: "Dispara proyectiles que eliminan amenazas", key: "ESPACIO" },
    Support: { name: "Cura & Ralentización", desc: "Recupera 1 vida y ralentiza todo al 50%", key: "ESPACIO" },
    Fighter: { name: "Remolino de Acero", desc: "Giro con espada destruyendo objetos cercanos", key: "ESPACIO" },
  };

  const ability = roleAbilityInfo[playerRole] || roleAbilityInfo["Mage"];

  // Internal game engine references
  const engineRef = useRef<{
    animationId: number;
    player: {
      x: number;
      y: number;
      radius: number;
      speed: number;
      vx: number;
      vy: number;
      invincibleUntil: number;
    };
    keys: Record<string, boolean>;
    obstacles: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
      type: "lux" | "morgana" | "teemo" | "bullet";
    }>;
    collectables: Array<{
      x: number;
      y: number;
      radius: number;
      vy: number;
      type: "cupcake" | "poro" | "coin";
    }>;
    playerBullets: Array<{
      x: number;
      y: number;
      radius: number;
      vy: number;
    }>;
    particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
      radius: number;
    }>;
    baron: {
      active: boolean;
      hp: number;
      maxHp: number;
      vy: number;
      y: number;
      targetSmiteMin: number;
      targetSmiteMax: number;
    } | null;
    currentScore: number;
    currentLives: number;
    stolenCount: number;
    abilityCdRemaining: number;
    abilityCdTotal: number;
    slowMotionUntil: number;
    champImgElement: HTMLImageElement | null;
  }>({
    animationId: 0,
    player: { x: 350, y: 400, radius: 24, speed: 6, vx: 0, vy: 0, invincibleUntil: 0 },
    keys: {},
    obstacles: [],
    collectables: [],
    playerBullets: [],
    particles: [],
    baron: null,
    currentScore: 0,
    currentLives: 3,
    stolenCount: 0,
    abilityCdRemaining: 0,
    abilityCdTotal: 400, // frames
    slowMotionUntil: 0,
    champImgElement: null,
  });

  // Load Champion Image for avatar rendering in Canvas
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = championImage;
    img.onload = () => {
      engineRef.current.champImgElement = img;
    };
  }, [championImage]);

  // Activate Class Skill
  const triggerSkill = useCallback(() => {
    const eng = engineRef.current;
    if (eng.abilityCdRemaining > 0 || !isPlaying || gameOver) return;

    sounds.playSkill();
    eng.abilityCdRemaining = eng.abilityCdTotal;

    const now = Date.now();

    if (playerRole === "Assassin") {
      eng.player.invincibleUntil = now + 2500;
      eng.player.y = Math.max(60, eng.player.y - 120);
      // Spawn burst particles
      for (let i = 0; i < 25; i++) {
        eng.particles.push({
          x: eng.player.x,
          y: eng.player.y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          color: "#A055FF",
          alpha: 1,
          radius: 3,
        });
      }
    } else if (playerRole === "Mage") {
      // Clear all obstacles
      eng.obstacles = [];
      eng.currentScore += 300;
      setScore(eng.currentScore);
      for (let i = 0; i < 40; i++) {
        eng.particles.push({
          x: 350,
          y: 250,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12,
          color: "#0AC8B9",
          alpha: 1,
          radius: 4,
        });
      }
    } else if (playerRole === "Tank") {
      eng.player.invincibleUntil = now + 4000;
    } else if (playerRole === "Marksman") {
      // Shoot 5 projectiles
      for (let angle = -0.4; angle <= 0.4; angle += 0.2) {
        eng.playerBullets.push({
          x: eng.player.x,
          y: eng.player.y - 20,
          radius: 6,
          vy: -10,
        });
      }
    } else if (playerRole === "Support") {
      // Heal 1 HP and slow-mo
      if (eng.currentLives < 3) {
        eng.currentLives++;
        setLives(eng.currentLives);
      }
      eng.slowMotionUntil = now + 4000;
    } else {
      // Fighter: Whirlwind
      eng.player.invincibleUntil = now + 3000;
      eng.obstacles = eng.obstacles.filter((o) => {
        const dist = Math.hypot(o.x - eng.player.x, o.y - eng.player.y);
        return dist > 150;
      });
    }
  }, [playerRole, isPlaying, gameOver]);

  // Trigger Smite
  const triggerSmite = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.baron || !isPlaying || gameOver) return;

    sounds.playSmite();

    const isSuccess =
      eng.baron.hp <= eng.baron.targetSmiteMax &&
      eng.baron.hp >= eng.baron.targetSmiteMin;

    if (isSuccess) {
      eng.currentScore += 5000;
      eng.stolenCount++;
      setScore(eng.currentScore);
      setBaronsStolen(eng.stolenCount);
      eng.baron = null;

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.3 },
        colors: ["#C8AA6E", "#A055FF", "#F0E6D2"],
      });
    } else {
      // Smite missed!
      eng.currentScore = Math.max(0, eng.currentScore - 500);
      setScore(eng.currentScore);
      eng.baron = null;
    }
  }, [isPlaying, gameOver]);

  // Key listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const eng = engineRef.current;
      eng.keys[e.key.toLowerCase()] = true;

      if (e.code === "Space") {
        e.preventDefault();
        triggerSkill();
      }
      if (e.key.toLowerCase() === "d" || e.key.toLowerCase() === "f") {
        e.preventDefault();
        triggerSmite();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      engineRef.current.keys[e.key.toLowerCase()] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [triggerSkill, triggerSmite]);

  // Main Game Loop
  const startGame = () => {
    sounds.playClick();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const eng = engineRef.current;
    eng.player = {
      x: canvas.width / 2,
      y: canvas.height - 80,
      radius: 22,
      speed: 6,
      vx: 0,
      vy: 0,
      invincibleUntil: Date.now() + 1500,
    };
    eng.obstacles = [];
    eng.collectables = [];
    eng.playerBullets = [];
    eng.particles = [];
    eng.baron = null;
    eng.currentScore = 0;
    eng.currentLives = 3;
    eng.stolenCount = 0;
    eng.abilityCdRemaining = 0;

    setScore(0);
    setLives(3);
    setBaronsStolen(0);
    setGameOver(false);
    setSaveSuccess(false);
    setIsPlaying(true);

    let frameCount = 0;

    const loop = () => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      frameCount++;
      const now = Date.now();
      const isSlowMo = now < eng.slowMotionUntil;
      const speedMultiplier = isSlowMo ? 0.45 : 1;

      // Update cooldown percentage
      if (eng.abilityCdRemaining > 0) {
        eng.abilityCdRemaining--;
        const pct = Math.floor((eng.abilityCdRemaining / eng.abilityCdTotal) * 100);
        setAbilityCooldown(pct);
        setAbilityReady(false);
      } else {
        setAbilityCooldown(0);
        setAbilityReady(true);
      }

      // 1. Move Player
      let dx = 0;
      let dy = 0;
      if (eng.keys["arrowleft"] || eng.keys["a"]) dx -= 1;
      if (eng.keys["arrowright"] || eng.keys["d"] && !eng.baron) dx += 1;
      if (eng.keys["arrowup"] || eng.keys["w"]) dy -= 1;
      if (eng.keys["arrowdown"] || eng.keys["s"]) dy += 1;

      // Normalize diagonal speed
      if (dx !== 0 && dy !== 0) {
        dx *= 0.7071;
        dy *= 0.7071;
      }

      eng.player.x += dx * eng.player.speed;
      eng.player.y += dy * eng.player.speed;

      // Bounds
      eng.player.x = Math.max(eng.player.radius, Math.min(canvas.width - eng.player.radius, eng.player.x));
      eng.player.y = Math.max(eng.player.radius, Math.min(canvas.height - eng.player.radius, eng.player.y));

      // 2. Spawn Obstacles
      if (frameCount % Math.max(15, 45 - Math.floor(eng.currentScore / 800)) === 0) {
        const types: Array<"lux" | "morgana" | "teemo"> = ["lux", "morgana", "teemo"];
        const chosen = types[Math.floor(Math.random() * types.length)];
        eng.obstacles.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -20,
          radius: chosen === "lux" ? 14 : chosen === "teemo" ? 16 : 18,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (chosen === "lux" ? 5.5 : chosen === "teemo" ? 3.5 : 4) * speedMultiplier,
          color: chosen === "lux" ? "#F0E6D2" : chosen === "teemo" ? "#0AC8B9" : "#A055FF",
          type: chosen,
        });
      }

      // 3. Spawn Collectables
      if (frameCount % 60 === 0) {
        const cTypes: Array<"cupcake" | "poro" | "coin"> = ["cupcake", "poro", "coin"];
        const chosen = cTypes[Math.floor(Math.random() * cTypes.length)];
        eng.collectables.push({
          x: Math.random() * (canvas.width - 40) + 20,
          y: -15,
          radius: 14,
          vy: 2.5 * speedMultiplier,
          type: chosen,
        });
      }

      // 4. Trigger Baron Event periodically
      if (!eng.baron && frameCount % 600 === 0 && eng.currentScore >= 1000) {
        eng.baron = {
          active: true,
          hp: 5000,
          maxHp: 5000,
          vy: 0.5,
          y: 60,
          targetSmiteMin: 700,
          targetSmiteMax: 1300,
        };
      }

      // Update Baron
      if (eng.baron) {
        eng.baron.hp -= 25;
        if (eng.baron.hp <= 0) {
          eng.baron = null; // Missed
        }
      }

      // 5. Update Bullets
      eng.playerBullets.forEach((b) => (b.y += b.vy));
      eng.playerBullets = eng.playerBullets.filter((b) => b.y > -20);

      // 6. Update Obstacles & Check Collisions
      const isInvincible = now < eng.player.invincibleUntil;

      for (let i = eng.obstacles.length - 1; i >= 0; i--) {
        const obs = eng.obstacles[i];
        obs.x += obs.vx;
        obs.y += obs.vy;

        // Check bullet hit
        for (let bIdx = eng.playerBullets.length - 1; bIdx >= 0; bIdx--) {
          const bullet = eng.playerBullets[bIdx];
          const dist = Math.hypot(obs.x - bullet.x, obs.y - bullet.y);
          if (dist < obs.radius + bullet.radius) {
            eng.obstacles.splice(i, 1);
            eng.playerBullets.splice(bIdx, 1);
            eng.currentScore += 150;
            setScore(eng.currentScore);
            break;
          }
        }

        // Check player hit
        const playerDist = Math.hypot(obs.x - eng.player.x, obs.y - eng.player.y);
        if (playerDist < obs.radius + eng.player.radius) {
          if (!isInvincible) {
            sounds.playDamage();
            eng.currentLives--;
            setLives(eng.currentLives);
            eng.player.invincibleUntil = now + 1500;

            if (eng.currentLives <= 0) {
              setGameOver(true);
              setIsPlaying(false);
              cancelAnimationFrame(eng.animationId);
              return;
            }
          }
          eng.obstacles.splice(i, 1);
        } else if (obs.y > canvas.height + 30) {
          eng.obstacles.splice(i, 1);
          eng.currentScore += 20;
          setScore(eng.currentScore);
        }
      }

      // 7. Update Collectables
      for (let i = eng.collectables.length - 1; i >= 0; i--) {
        const col = eng.collectables[i];
        col.y += col.vy;

        const dist = Math.hypot(col.x - eng.player.x, col.y - eng.player.y);
        if (dist < col.radius + eng.player.radius) {
          sounds.playCollect();
          const pts = col.type === "poro" ? 500 : col.type === "cupcake" ? 300 : 150;
          eng.currentScore += pts;
          setScore(eng.currentScore);
          eng.collectables.splice(i, 1);
        } else if (col.y > canvas.height + 30) {
          eng.collectables.splice(i, 1);
        }
      }

      // 8. Update Particles
      for (let i = eng.particles.length - 1; i >= 0; i--) {
        const p = eng.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        if (p.alpha <= 0) {
          eng.particles.splice(i, 1);
        }
      }

      // 9. DRAW CANVAS
      // Background: Summoner's Rift Dark River
      ctx.fillStyle = "#010A13";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = "rgba(10, 200, 185, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw Particles
      eng.particles.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw Bullets
      ctx.fillStyle = "#F0E6D2";
      eng.playerBullets.forEach((b) => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Collectables
      eng.collectables.forEach((c) => {
        ctx.save();
        ctx.font = "20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const emoji = c.type === "poro" ? "🐹" : c.type === "cupcake" ? "🧁" : "🪙";
        ctx.fillText(emoji, c.x, c.y);
        ctx.restore();
      });

      // Draw Obstacles
      eng.obstacles.forEach((o) => {
        ctx.save();
        ctx.fillStyle = o.color;
        ctx.shadowColor = o.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
        ctx.fill();

        // Icon inside obstacle
        ctx.fillStyle = "#000";
        ctx.font = "12px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(o.type === "lux" ? "⚡" : o.type === "teemo" ? "🍄" : "🔮", o.x, o.y);
        ctx.restore();
      });

      // Draw Baron Event Banner & Health Bar
      if (eng.baron) {
        ctx.save();
        ctx.fillStyle = "rgba(10, 20, 40, 0.9)";
        ctx.strokeStyle = "#A055FF";
        ctx.lineWidth = 2;
        ctx.fillRect(100, 20, canvas.width - 200, 60);
        ctx.strokeRect(100, 20, canvas.width - 200, 60);

        ctx.font = "bold 14px Georgia, serif";
        ctx.fillStyle = "#F0E6D2";
        ctx.textAlign = "center";
        ctx.fillText("¡BARÓN NASHOR! PRESIONA SMITE [D/F]", canvas.width / 2, 40);

        // HP bar
        const barWidth = canvas.width - 240;
        const hpPct = Math.max(0, eng.baron.hp / eng.baron.maxHp);
        ctx.fillStyle = "#333";
        ctx.fillRect(120, 50, barWidth, 16);

        // Smite strike zone highlight
        const zoneMinPct = eng.baron.targetSmiteMin / eng.baron.maxHp;
        const zoneMaxPct = eng.baron.targetSmiteMax / eng.baron.maxHp;
        ctx.fillStyle = "rgba(200, 170, 110, 0.6)";
        ctx.fillRect(120 + barWidth * zoneMinPct, 50, barWidth * (zoneMaxPct - zoneMinPct), 16);

        // Current HP
        const isStrikeReady =
          eng.baron.hp <= eng.baron.targetSmiteMax &&
          eng.baron.hp >= eng.baron.targetSmiteMin;
        ctx.fillStyle = isStrikeReady ? "#C8AA6E" : "#E84057";
        ctx.fillRect(120, 50, barWidth * hpPct, 16);

        ctx.font = "bold 10px monospace";
        ctx.fillStyle = "#fff";
        ctx.fillText(`${eng.baron.hp} HP`, canvas.width / 2, 62);
        ctx.restore();
      }

      // Draw Player
      ctx.save();
      if (isInvincible && Math.floor(frameCount / 4) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // Shield Aura
      if (isInvincible) {
        ctx.strokeStyle = "#0AC8B9";
        ctx.lineWidth = 4;
        ctx.shadowColor = "#0AC8B9";
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(eng.player.x, eng.player.y, eng.player.radius + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Champion Image Clip
      ctx.beginPath();
      ctx.arc(eng.player.x, eng.player.y, eng.player.radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (eng.champImgElement) {
        ctx.drawImage(
          eng.champImgElement,
          eng.player.x - eng.player.radius,
          eng.player.y - eng.player.radius,
          eng.player.radius * 2,
          eng.player.radius * 2
        );
      } else {
        ctx.fillStyle = "#C8AA6E";
        ctx.fill();
      }
      ctx.restore();

      // Gold border around player
      ctx.strokeStyle = "#C8AA6E";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(eng.player.x, eng.player.y, eng.player.radius, 0, Math.PI * 2);
      ctx.stroke();

      eng.animationId = requestAnimationFrame(loop);
    };

    eng.animationId = requestAnimationFrame(loop);
  };

  // Stop loop on unmount
  useEffect(() => {
    const eng = engineRef.current;
    return () => {
      cancelAnimationFrame(eng.animationId);
    };
  }, []);

  // Save score to DB
  const handleSaveScore = async () => {
    if (!isLoggedIn || !user) {
      onOpenAuth();
      return;
    }

    try {
      setIsSubmitting(true);
      sounds.playClick();

      await submitScore({
        email: user.email,
        score,
        championId: user.championId || championName,
        baronStolen: baronsStolen > 0,
      });

      sounds.playVictory();
      setSaveSuccess(true);
      onScoreSaved();
    } catch (e: any) {
      alert(e.message || "Error al registrar récord");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="minijuego" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lol-blue/15 border border-lol-blue/30 text-lol-blue text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Zap size={14} />
          <span>Desafío de la Grieta</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold font-beaufort gold-gradient-text">
          BARON STEAL & SKILLSHOT DODGE
        </h2>
        <p className="text-gray-300 max-w-xl mx-auto text-sm mt-2">
          Juega con tu campeón elegido. Esquiva los ataques de Morgana y Lux, recoge Poros y asesta el Smite al Barón Nashor para liderar el ranking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Game Screen Column */}
        <div className="lg:col-span-2 hextech-card rounded-xl p-4 sm:p-6 border border-lol-gold/40 shadow-glow-gold relative flex flex-col items-center">
          <div className="hextech-corner hextech-corner-tl" />
          <div className="hextech-corner hextech-corner-tr" />
          <div className="hextech-corner hextech-corner-bl" />
          <div className="hextech-corner hextech-corner-br" />

          {/* Top HUD */}
          <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-lol-gold/20 text-xs sm:text-sm font-mono">
            {/* Lives */}
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400 font-bold">VIDAS:</span>
              <div className="flex items-center gap-1 text-lol-red">
                {[1, 2, 3].map((heart) => (
                  <Heart
                    key={heart}
                    size={18}
                    className={heart <= lives ? "fill-lol-red text-lol-red" : "text-gray-600"}
                  />
                ))}
              </div>
            </div>

            {/* Score */}
            <div className="text-center">
              <span className="text-gray-400">PUNTOS: </span>
              <strong className="text-lol-gold font-mono text-lg">{score.toLocaleString()}</strong>
            </div>

            {/* Barons */}
            <div className="flex items-center gap-1 text-purple-400">
              <Flame size={16} />
              <span>BARÓN: {baronsStolen}</span>
            </div>
          </div>

          {/* Canvas */}
          <div className="relative w-full max-w-[640px] aspect-[4/3] bg-lol-navy-black rounded-lg overflow-hidden border border-lol-gold/30 shadow-inner">
            <canvas
              ref={canvasRef}
              width={640}
              height={480}
              className="w-full h-full block"
            />

            {/* Start Screen Overlay */}
            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full border-2 border-lol-gold mb-3 overflow-hidden shadow-glow-gold">
                  <img src={championImage} alt={championName} className="w-full h-full object-cover" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold font-beaufort text-white mb-1">
                  {championName} ({playerRole})
                </h3>
                <p className="text-xs text-lol-gold-light mb-4 max-w-sm">
                  Habilidad: <strong className="text-lol-blue">{ability.name}</strong> ({ability.desc})
                </p>

                <button
                  onClick={startGame}
                  className="px-8 py-3.5 rounded bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black font-extrabold text-sm uppercase tracking-wider border border-lol-gold shadow-glow-gold transition-all duration-200 flex items-center gap-2 transform hover:scale-105"
                >
                  <Play size={18} />
                  <span>COMENZAR PARTIDA</span>
                </button>

                <div className="mt-4 text-[11px] text-gray-400 space-y-1">
                  <div>⌨️ <strong>Mover:</strong> Flechas / WASD • <strong>Habilidad:</strong> Espacio</div>
                  <div>⚡ <strong>Smite:</strong> Tecla D o F cuando el Barón esté en zona dorada</div>
                </div>
              </div>
            )}

            {/* Game Over Screen Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                <div className="text-3xl mb-2">💀</div>
                <h3 className="text-2xl sm:text-3xl font-black font-beaufort text-lol-red uppercase mb-1">
                  CAÍSTE EN LA GRIETA
                </h3>
                <div className="text-sm text-gray-300 mb-1">Puntuación Final:</div>
                <div className="text-4xl font-black font-mono gold-gradient-text mb-4">
                  {score.toLocaleString()} PTS
                </div>

                {saveSuccess ? (
                  <div className="p-3 mb-4 rounded bg-emerald-950/80 border border-emerald-500 text-emerald-200 text-xs font-bold">
                    ✓ ¡Récord guardado exitosamente en el ranking!
                  </div>
                ) : (
                  <button
                    onClick={handleSaveScore}
                    disabled={isSubmitting}
                    className="mb-4 px-6 py-2.5 rounded bg-gradient-to-r from-lol-blue-dark to-lol-blue hover:from-lol-blue hover:to-white text-lol-navy-black font-extrabold text-xs uppercase tracking-wider border border-lol-blue shadow-glow-blue transition-all"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Puntuación en el Ranking"}
                  </button>
                )}

                <button
                  onClick={startGame}
                  className="px-6 py-2.5 rounded bg-lol-navy hover:bg-lol-metal text-lol-gold border border-lol-gold/40 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                >
                  <RotateCcw size={14} />
                  <span>Jugar de Nuevo</span>
                </button>
              </div>
            )}
          </div>

          {/* On-Screen Mobile Action Controls */}
          <div className="w-full mt-4 flex items-center justify-between gap-3">
            {/* Ability Trigger */}
            <button
              onClick={triggerSkill}
              disabled={!abilityReady || !isPlaying}
              className={`flex-1 py-3 px-4 rounded-lg border text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                abilityReady && isPlaying
                  ? "bg-lol-blue/20 border-lol-blue text-lol-blue shadow-glow-blue hover:bg-lol-blue/30"
                  : "bg-lol-navy border-gray-700 text-gray-500"
              }`}
            >
              <Zap size={16} />
              <span>
                {ability.name} ({abilityReady ? "[ESPACIO]" : `${abilityCooldown}%`})
              </span>
            </button>

            {/* Smite Trigger */}
            <button
              onClick={triggerSmite}
              disabled={!isPlaying}
              className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-amber-600 to-lol-gold hover:from-lol-gold hover:to-amber-400 text-lol-navy-black border border-lol-gold font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-glow-gold transition-all"
            >
              <Flame size={16} />
              <span>SMITE BARÓN [D / F]</span>
            </button>
          </div>
        </div>

        {/* Instructions & Champion Perk Sidebar */}
        <div className="space-y-6">
          <div className="hextech-card rounded-xl p-5 border border-lol-gold/30">
            <h4 className="text-xs font-mono uppercase tracking-wider text-lol-gold font-bold mb-3 flex items-center gap-2">
              <Sparkles size={14} />
              <span>Tu Campeón en Juego</span>
            </h4>
            <div className="flex items-center gap-3 mb-3">
              <img
                src={championImage}
                alt={championName}
                className="w-12 h-12 rounded-full border border-lol-gold object-cover"
              />
              <div>
                <div className="font-bold text-white text-base leading-tight">
                  {championName}
                </div>
                <div className="text-xs text-lol-blue font-mono">{playerRole}</div>
              </div>
            </div>
            <p className="text-xs text-gray-300 bg-lol-navy/60 p-3 rounded border border-lol-gold/15">
              Habilidad activa: <strong className="text-lol-gold">{ability.name}</strong>. {ability.desc}.
            </p>
          </div>

          <div className="hextech-card rounded-xl p-5 border border-lol-gold/30 text-xs space-y-3">
            <h4 className="font-mono uppercase tracking-wider text-lol-gold font-bold flex items-center gap-2">
              <Trophy size={14} />
              <span>Puntuaciones & Bonificaciones</span>
            </h4>
            <div className="space-y-2 text-gray-300">
              <div className="flex items-center justify-between">
                <span>🐹 Poro Legendario:</span>
                <strong className="text-lol-gold font-mono">+500 pts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>🧁 Pastel de Cumpleaños:</span>
                <strong className="text-lol-gold font-mono">+300 pts</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>🪙 Moneda de Oro:</span>
                <strong className="text-lol-gold font-mono">+150 pts</strong>
              </div>
              <div className="flex items-center justify-between border-t border-lol-gold/15 pt-2">
                <span className="text-purple-300 font-bold">⚡ Robo de Barón (Smite):</span>
                <strong className="text-purple-400 font-mono">+5,000 pts</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
