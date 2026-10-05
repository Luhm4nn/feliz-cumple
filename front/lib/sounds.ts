// Web Audio API Synthesizer & Official League of Legends Voice Engine
// Supports zero-latency Hextech UI FX, Minigame audio, and Real Champion Voice Lines!

import { CHAMPION_MODEL_IDS } from "./championSkills";

// Obtiene la key numérica del campeón (ej: Yasuo -> 157, Brand -> 63, Fiddlesticks -> 9)
export function getChampionKey(nameOrKey?: string | null): number | null {
  if (!nameOrKey) return null;
  const num = Number(nameOrKey);
  if (!isNaN(num) && num > 0) {
    return num > 1000 ? Math.floor(num / 1000) : num;
  }
  const clean = nameOrKey.toLowerCase().replace(/[^a-z0-9]/g, "");
  const modelId = CHAMPION_MODEL_IDS[clean];
  if (modelId) {
    return Math.floor(modelId / 1000);
  }
  return null;
}

class HextechSoundFX {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private isMuted: boolean = false;
  private currentVoice: HTMLAudioElement | null = null;
  private listeners: Set<(muted: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("lol_cumple_muted");
        if (stored !== null) {
          this.isMuted = stored === "true";
        }
      } catch (_) {}

      // Desbloqueo suave en la primera interacción genuina del usuario (política de navegadores)
      const unlockHandler = () => {
        this.unlock();
        window.removeEventListener("pointerdown", unlockHandler);
        window.removeEventListener("click", unlockHandler);
        window.removeEventListener("keydown", unlockHandler);
      };

      window.addEventListener("pointerdown", unlockHandler, { once: true, passive: true });
      window.addEventListener("click", unlockHandler, { once: true, passive: true });
      window.addEventListener("keydown", unlockHandler, { once: true, passive: true });
    }
  }

  // Activa el AudioContext con un gesto de usuario
  public unlock(): void {
    if (typeof window === "undefined") return;
    const ctx = this.getOrCreateContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  private getOrCreateContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();

        // Compresor dinámico maestro para evitar saturación o clipping en efectos simultáneos
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-16, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(5, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.18, this.ctx.currentTime);

        // Control de volumen maestro
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, this.ctx.currentTime);

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem("lol_cumple_muted", String(this.isMuted));
    } catch (_) {}

    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.75, now);
    }

    if (this.isMuted && this.currentVoice) {
      try {
        this.currentVoice.pause();
        this.currentVoice.currentTime = 0;
      } catch (_) {}
      this.currentVoice = null;
    }

    this.notifyListeners();
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    if (this.isMuted !== muted) {
      this.toggleMute();
    }
  }

  public onMuteChange(listener: (muted: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((fn) => fn(this.isMuted));
  }

  // Reproduce la voz REAL del campeón oficial de League of Legends (en Español Latino / Castellano)
  public async playChampionVoice(
    championNameOrKey?: string | null,
    fallbackSoundType: "steel" | "arcane" | "rocket" | "shadow" | "light" | "earth" | "beast" = "steel"
  ): Promise<void> {
    if (this.isMuted) return;
    this.unlock();

    const key = getChampionKey(championNameOrKey);
    if (!key) {
      this.playChampionSkill(fallbackSoundType);
      return;
    }

    // Detener voz anterior si estaba hablando
    if (this.currentVoice) {
      try {
        this.currentVoice.pause();
        this.currentVoice.currentTime = 0;
      } catch (_) {}
      this.currentVoice = null;
    }

    // URLs oficiales de CommunityDragon: Español Latino -> Español España -> Default
    const urls = [
      `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/es_ar/v1/champion-choose-vo/${key}.ogg`,
      `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/es_es/v1/champion-choose-vo/${key}.ogg`,
      `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-choose-vo/${key}.ogg`,
    ];

    const tryNext = (idx: number) => {
      if (idx >= urls.length) {
        // Fallback al sintetizador si no hay conexión
        this.playChampionSkill(fallbackSoundType);
        return;
      }

      const audio = new Audio(urls[idx]);
      audio.volume = 0.85;
      this.currentVoice = audio;

      audio.play().catch(() => {
        tryNext(idx + 1);
      });
    };

    tryNext(0);
  }

  // Sonido de clic Hextech
  public playClick() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.04);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.compressor || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Sonido al pasar el ratón por un campeón (Hextech Hover)
  public playHover() {
    if (this.isMuted) return;
    // No intentar reproducir si el navegador no habilitó aún el AudioContext (evita alertas de autoplay)
    if (!this.ctx || this.ctx.state !== "running") return;

    const now = Math.max(this.ctx.currentTime, 0) + 0.005;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.035);

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.compressor || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.035);
  }

  // Sonido épico de "LOCK IN" (bloqueo de campeón en selección)
  public playLockIn() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;

    // Frecuencia grave tipo Gong / Metal
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(110, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 1.2);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    // Chime metálico agudo
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(587.33, now); // D5
    osc2.frequency.setValueAtTime(880, now + 0.1); // A5
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc1.connect(gain1);
    gain1.connect(this.compressor || ctx.destination);

    osc2.connect(gain2);
    gain2.connect(this.compressor || ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.2);
    osc2.stop(now + 0.8);
  }

  // Sonido épico de SMITE (relámpago celestial sobre Barón)
  public playSmite() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.4);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.compressor || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Sonido de habilidad activada en el minijuego
  public playSkill() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.2);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.compressor || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Recolectar Poro / Pastelito
  public playCollect() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.compressor || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Golpe / Daño recibido
  public playDamage() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(70, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this.compressor || ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Fanfarria de victoria / confirmación de asistencia
  public playVictory() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

      osc.connect(gain);
      gain.connect(this.compressor || ctx.destination);

      osc.start(start);
      osc.stop(start + 0.4);
    });
  }

  // Sonido sintético específico según arquetipo del campeón
  public playChampionSkill(soundType: "steel" | "arcane" | "rocket" | "shadow" | "light" | "earth" | "beast") {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;
    const now = Math.max(ctx.currentTime, 0) + 0.005;

    if (soundType === "steel") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.25);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.compressor || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (soundType === "arcane") {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = "sine";
      osc2.type = "triangle";
      osc1.frequency.setValueAtTime(520, now);
      osc1.frequency.exponentialRampToValueAtTime(1300, now + 0.35);
      osc2.frequency.setValueAtTime(1040, now);
      osc2.frequency.exponentialRampToValueAtTime(2600, now + 0.35);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.compressor || ctx.destination);
      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } else if (soundType === "rocket") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(this.compressor || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (soundType === "shadow") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.linearRampToValueAtTime(280, now + 0.2);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.compressor || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (soundType === "light") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(1500, now + 0.15);
      osc.frequency.linearRampToValueAtTime(900, now + 0.4);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(this.compressor || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (soundType === "earth") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(75, now);
      osc.frequency.linearRampToValueAtTime(40, now + 0.5);
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(this.compressor || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.compressor || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    }
  }

  // Sonido de esquiva rasante ("Near Miss")
  public playNearMiss() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.08);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.compressor || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Rugido del Barón al aparecer
  public playBaronRoar() {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(130, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.8);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    osc.connect(gain);
    gain.connect(this.compressor || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  // Chime ascendente al encadenar combo de esquiva
  public playCombo(streak: number) {
    if (this.isMuted) return;
    this.unlock();
    const ctx = this.getOrCreateContext();
    if (!ctx) return;

    const now = Math.max(ctx.currentTime, 0) + 0.005;
    const baseFreq = 500 + Math.min(streak * 60, 600);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, now + 0.1);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.compressor || ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }
}

export const sounds = new HextechSoundFX();
