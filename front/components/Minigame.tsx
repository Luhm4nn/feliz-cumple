"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { useAuth } from "@/context/AuthContext";
import { sounds } from "@/lib/sounds";
import {
  Trophy,
  Play,
  RotateCcw,
  Zap,
  Shield,
  Crosshair,
  Swords,
  Skull,
  Heart,
  ChevronRight,
  Flame,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";
import { submitScore } from "@/lib/api";
import { getChampionKit, getChampionModelUrl } from "@/lib/championSkills";

interface MinigameProps {
  onScoreSaved: () => void;
  onOpenAuth: () => void;
}

export type BossKey = "herald" | "elder" | "baron";

export interface BossConfig {
  key: BossKey;
  name: string;
  title: string;
  subtitle: string;
  icon: string;
  baseMaxHp: number;
  modelUrl: string;
  themeColor: string;
  threeColor: number;
  bulletColor: number;
  bulletGlow: string;
  baseAttackInterval: number;
  bulletSpeed: number;
}

export const BOSS_SEQUENCE: BossKey[] = ["herald", "elder", "baron"];

export const BASE_BOSS_CONFIGS: Record<BossKey, BossConfig> = {
  herald: {
    key: "herald",
    name: "Heraldo de la Grieta",
    title: "Shelly del Vacío",
    subtitle: "Ronda 1 • Cargas y Púas Terrestres",
    icon: "👁️",
    baseMaxHp: 6500,
    modelUrl:
      "https://cdn.modelviewer.lol/extras/models/sru_riftherald/0/model-lite-compressed.wasm?c=1",
    themeColor: "#06b6d4",
    threeColor: 0x06b6d4,
    bulletColor: 0xa855f7, // Esferas del vacío
    bulletGlow: "rgba(168, 85, 247, 0.6)",
    baseAttackInterval: 1400,
    bulletSpeed: 0.11,
  },
  elder: {
    key: "elder",
    name: "Dragón Ancestral",
    title: "Furia Elemental",
    subtitle: "Ronda 2 • Aliento de Fuego en Abanico",
    icon: "🐲",
    baseMaxHp: 8500,
    modelUrl:
      "https://cdn.modelviewer.lol/extras/models/sru_dragon_elder/0/model-lite-compressed.wasm?c=1",
    themeColor: "#f59e0b",
    threeColor: 0xf59e0b,
    bulletColor: 0xf97316, // Llamarada infernal
    bulletGlow: "rgba(249, 115, 22, 0.6)",
    baseAttackInterval: 1250,
    bulletSpeed: 0.13,
  },
  baron: {
    key: "baron",
    name: "Barón Nashor",
    title: "El Azote del Vacío",
    subtitle: "Ronda 3 • Lluvia Ácida y Púas Corrosivas",
    icon: "🐉",
    baseMaxHp: 11000,
    modelUrl:
      "https://cdn.modelviewer.lol/extras/models/sru_baron/0/model-lite-compressed.wasm?c=1",
    themeColor: "#9333ea",
    threeColor: 0x9333ea,
    bulletColor: 0x10b981, // Ácido tóxico
    bulletGlow: "rgba(16, 185, 129, 0.6)",
    baseAttackInterval: 1100,
    bulletSpeed: 0.14,
  },
};

// Cálculo dinámico de dificultad por ola infinita
export function getWaveConfig(wave: number) {
  const index = (wave - 1) % 3;
  const cycle = Math.floor((wave - 1) / 3);
  const bossKey = BOSS_SEQUENCE[index];
  const base = BASE_BOSS_CONFIGS[bossKey];
  const multiplier = 1 + cycle * 0.2;
  const maxHp = Math.round(base.baseMaxHp * multiplier);
  const attackInterval = Math.max(750, Math.round(base.baseAttackInterval * (1 - cycle * 0.07)));
  const bulletSpeed = base.bulletSpeed * (1 + cycle * 0.05);

  return {
    ...base,
    cycle,
    maxHp,
    attackInterval,
    bulletSpeed,
    smiteThreshold: 1000,
  };
}

interface Projectile3D {
  mesh: THREE.Mesh;
  fromPlayer: boolean;
  vx: number;
  vy: number;
  vz: number;
  damage: number;
  alive: boolean;
  nearMissChecked?: boolean;
}

interface ZoneStrike {
  mesh: THREE.Mesh;
  strikeX: number;
  detonateAt: number;
  damage: number;
  alive: boolean;
}

export default function Minigame({ onScoreSaved, onOpenAuth }: MinigameProps) {
  const { user } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Progreso del Boss Rush Infinito
  const [wave, setWave] = useState<number>(1);
  const [bossesSlain, setBossesSlain] = useState<number>(0);
  const currentWaveCfg = getWaveConfig(wave);
  const nextWaveCfg = getWaveConfig(wave + 1);

  // Kit del campeón del usuario
  const champKit = getChampionKit(user?.championName, user?.championRole);

  // Estados del juego
  const [gameState, setGameState] = useState<"READY" | "FIGHTING" | "DEFEAT">("READY");
  const [bossHp, setBossHp] = useState<number>(currentWaveCfg.maxHp);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(1);
  const [nearMisses, setNearMisses] = useState<number>(0);
  const [defeatReason, setDefeatReason] = useState<string>("");
  const [modelLoading, setModelLoading] = useState<boolean>(false);
  const [modelLoadProgress, setModelLoadProgress] = useState<string>("");

  // Cooldowns de habilidades
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [shieldCd, setShieldCd] = useState<number>(0); // 0-100%
  const [spellCd, setSpellCd] = useState<number>(0); // 0-100%

  // Notificaciones flotantes en el viewport
  const [bannerNotice, setBannerNotice] = useState<{ text: string; color: string } | null>(null);
  const [damagePopups, setDamagePopups] = useState<
    Array<{ id: number; text: string; color: string; x: number; y: number }>
  >([]);

  // Guardado de puntuación
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scoreSaved, setScoreSaved] = useState<boolean>(false);

  // Referencias mutables para el loop Three.js a 60fps
  const gameRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    animId: number;
    bossGroup: THREE.Group | null;
    bossMixer: THREE.AnimationMixer | null;
    playerGroup: THREE.Group | null;
    playerMixer: THREE.AnimationMixer | null;
    shieldMesh: THREE.Mesh | null;
    smitePillar: THREE.Mesh | null;
    pitRingMesh: THREE.Mesh | null;
    smiteRingMesh: THREE.Mesh | null;
    bossVoidLight: THREE.PointLight | null;
    pitGreenLight: THREE.PointLight | null;
    projectiles: Projectile3D[];
    zoneStrikes: ZoneStrike[];
    playerX: number;
    targetPlayerX: number;
    keys: Record<string, boolean>;
    lastBossAttack: number;
    attackCounter: number;
    isSmiteExecuting: boolean;
    wave: number;
    bossMaxHp: number;
    currentBossHp: number;
    currentPlayerHp: number;
    currentScore: number;
    currentCombo: number;
    currentShield: boolean;
    shieldEndsAt: number;
    shieldReadyAt: number;
    spellReadyAt: number;
    isPlaying: boolean;
    bossModelsCache: Record<BossKey, THREE.Group>;
    bossMixersCache: Record<BossKey, THREE.AnimationMixer | null>;
    gltfLoader: GLTFLoader | null;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    animId: 0,
    bossGroup: null,
    bossMixer: null,
    playerGroup: null,
    playerMixer: null,
    shieldMesh: null,
    smitePillar: null,
    pitRingMesh: null,
    smiteRingMesh: null,
    bossVoidLight: null,
    pitGreenLight: null,
    projectiles: [],
    zoneStrikes: [],
    playerX: 0,
    targetPlayerX: 0,
    keys: {},
    lastBossAttack: 0,
    attackCounter: 0,
    isSmiteExecuting: false,
    wave: 1,
    bossMaxHp: currentWaveCfg.maxHp,
    currentBossHp: currentWaveCfg.maxHp,
    currentPlayerHp: 100,
    currentScore: 0,
    currentCombo: 1,
    currentShield: false,
    shieldEndsAt: 0,
    shieldReadyAt: 0,
    spellReadyAt: 0,
    isPlaying: false,
    bossModelsCache: {} as any,
    bossMixersCache: {} as any,
    gltfLoader: null,
  });

  // Mostrar aviso flotante breve
  const showBanner = useCallback((text: string, color: string = "#f59e0b") => {
    setBannerNotice({ text, color });
    setTimeout(() => {
      setBannerNotice((prev) => (prev?.text === text ? null : prev));
    }, 2400);
  }, []);

  // Agregar número de daño flotante en pantalla
  const addDamagePopup = useCallback((text: string, color: string, screenX: number, screenY: number) => {
    const id = Date.now() + Math.random();
    setDamagePopups((prev) => [...prev.slice(-6), { id, text, color, x: screenX, y: screenY }]);
    setTimeout(() => {
      setDamagePopups((prev) => prev.filter((p) => p.id !== id));
    }, 1100);
  }, []);

  // Terminar partida (Derrota)
  const handleGameOver = useCallback(
    async (reason: string) => {
      const g = gameRef.current;
      g.isPlaying = false;
      sounds.playDamage();
      setDefeatReason(reason);
      setGameState("DEFEAT");

      // Guardar puntaje si el usuario está autenticado
      if (user?.email) {
        setIsSubmitting(true);
        try {
          await submitScore({
            email: user.email,
            score: g.currentScore,
            championId: user.championId || "Champion",
            baronStolen: g.wave > 1,
          });
          setScoreSaved(true);
          onScoreSaved();
        } catch (e) {
          console.error("Error saving score:", e);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [user, onScoreSaved]
  );

  // Transición instantánea / cambio de modelo 3D del Boss
  const switchBossModel = useCallback((targetKey: BossKey) => {
    const g = gameRef.current;
    if (!g.bossGroup || !g.scene) return;

    // Si ya está en caché, simplemente intercambiar
    if (g.bossModelsCache[targetKey]) {
      g.bossGroup.clear();
      g.bossGroup.add(g.bossModelsCache[targetKey]);
      g.bossMixer = g.bossMixersCache[targetKey] || null;
      return;
    }

    // Si aún no está descargado, cargarlo
    if (g.gltfLoader) {
      const targetCfg = BASE_BOSS_CONFIGS[targetKey];
      g.gltfLoader.load(
        targetCfg.modelUrl,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const targetScale = (targetKey === "baron" ? 4.8 : targetKey === "elder" ? 4.4 : 4.0) / maxDim;

          model.scale.setScalar(targetScale);
          model.position.set(-center.x * targetScale, -box.min.y * targetScale, -center.z * targetScale);
          // IMPORTANTE: rotación 0 para que mire de frente al jugador y a la cámara
          model.rotation.y = 0;

          g.bossModelsCache[targetKey] = model;

          if (gltf.animations && gltf.animations.length > 0) {
            const mixer = new THREE.AnimationMixer(model);
            const clip =
              gltf.animations.find((a) => a.name.toLowerCase().includes("idle")) ||
              gltf.animations[0];
            mixer.clipAction(clip).play();
            g.bossMixersCache[targetKey] = mixer;
          }

          if (g.bossGroup) {
            g.bossGroup.clear();
            g.bossGroup.add(model);
            g.bossMixer = g.bossMixersCache[targetKey] || null;
          }
        },
        undefined,
        (err) => {
          console.warn(`Could not load boss model for ${targetKey}:`, err);
        }
      );
    }
  }, []);

  // Transición a la siguiente ronda (Boss Rush sin fin)
  const advanceToNextWave = useCallback(() => {
    const g = gameRef.current;
    const nextWave = g.wave + 1;
    g.wave = nextWave;
    setWave(nextWave);
    setBossesSlain((prev) => prev + 1);

    const nextCfg = getWaveConfig(nextWave);
    g.bossMaxHp = nextCfg.maxHp;
    g.currentBossHp = nextCfg.maxHp;
    setBossHp(nextCfg.maxHp);

    // Limpiar proyectiles y ataques de zona viejos
    g.projectiles.forEach((p) => g.scene?.remove(p.mesh));
    g.projectiles = [];
    g.zoneStrikes.forEach((z) => g.scene?.remove(z.mesh));
    g.zoneStrikes = [];

    // Puntos de bonificación por asegurar objetivo (escala de 50 pts)
    const roundBonus = 50 + g.currentCombo * 2;
    g.currentScore += roundBonus;
    setScore(g.currentScore);
    addDamagePopup(`¡OBJETIVO ASEGURADO! +${roundBonus}`, "#f59e0b", 400, 200);

    // Actualizar iluminación ambiental y anillo temático de la Fosa
    if (g.bossVoidLight) g.bossVoidLight.color.setHex(nextCfg.threeColor);
    if (g.pitGreenLight) g.pitGreenLight.color.setHex(nextCfg.bulletColor);
    if (g.pitRingMesh) (g.pitRingMesh.material as THREE.MeshBasicMaterial).color.setHex(nextCfg.threeColor);
    if (g.smiteRingMesh) (g.smiteRingMesh.material as THREE.MeshBasicMaterial).opacity = 0.35;

    // Sonidos y confeti
    sounds.playVictory();
    sounds.playBaronRoar();
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.5 },
      colors: ["#C8AA6E", "#0AC8B9", "#F0E6D2", "#9333EA", "#F59E0B"],
    });

    showBanner(`¡RONDA ${nextWave}: ${nextCfg.name.toUpperCase()} HA ENTRADO A LA FOSA!`, nextCfg.themeColor);

    // Cambiar modelo 3D
    switchBossModel(nextCfg.key);
  }, [addDamagePopup, showBanner, switchBossModel]);

  // Inicialización de la Escena Three.js 3D
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isMounted = true;
    setModelLoading(true);
    setModelLoadProgress("Construyendo la Fosa del Jefe...");

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c16);
    scene.fog = new THREE.FogExp2(0x060c16, 0.055);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.2, 5.2);
    camera.lookAt(0, 1.4, -1.8);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 2. Iluminación Cinematográfica de la Fosa
    const ambientLight = new THREE.AmbientLight(0x131e33, 1.8);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xa5c9eb, 1.6);
    moonLight.position.set(4, 10, 6);
    moonLight.castShadow = true;
    scene.add(moonLight);

    // Luz de void del Jefe
    const bossVoidLight = new THREE.PointLight(currentWaveCfg.threeColor, 4.0, 14);
    bossVoidLight.position.set(0, 3.5, -4.5);
    scene.add(bossVoidLight);

    // Luz en el suelo de la fosa
    const pitGreenLight = new THREE.PointLight(currentWaveCfg.bulletColor, 2.8, 8);
    pitGreenLight.position.set(0, 0.4, -3.2);
    scene.add(pitGreenLight);

    // 3. Suelo de la Fosa / Agua del Río con Runas
    const floorGeo = new THREE.PlaneGeometry(32, 32, 32, 32);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x050e18,
      roughness: 0.35,
      metalness: 0.8,
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Anillo exterior de la Fosa
    const pitRingGeo = new THREE.RingGeometry(3.2, 3.8, 48);
    const pitRingMat = new THREE.MeshBasicMaterial({
      color: currentWaveCfg.threeColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const pitRingMesh = new THREE.Mesh(pitRingGeo, pitRingMat);
    pitRingMesh.rotation.x = -Math.PI / 2;
    pitRingMesh.position.set(0, 0.02, -3.2);
    scene.add(pitRingMesh);

    // Anillo de Smite crítico (<1000 HP)
    const smiteRingGeo = new THREE.RingGeometry(2.0, 2.3, 48);
    const smiteRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const smiteRingMesh = new THREE.Mesh(smiteRingGeo, smiteRingMat);
    smiteRingMesh.rotation.x = -Math.PI / 2;
    smiteRingMesh.position.set(0, 0.03, -3.2);
    scene.add(smiteRingMesh);

    // 4. Rayo de Smite (Cilindro vertical dorado listo para detonar)
    const smitePillarGeo = new THREE.CylinderGeometry(0.8, 1.4, 18, 32);
    const smitePillarMat = new THREE.MeshBasicMaterial({
      color: 0xffe066,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const smitePillar = new THREE.Mesh(smitePillarGeo, smitePillarMat);
    smitePillar.position.set(0, 9, -3.2);
    scene.add(smitePillar);

    // 5. Escudo Hextech del Jugador (Esfera translúcida)
    const shieldGeo = new THREE.SphereGeometry(1.1, 24, 24);
    const shieldMat = new THREE.MeshStandardMaterial({
      color: 0x0ac8b9,
      emissive: 0x0ac8b9,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0,
      roughness: 0.1,
      metalness: 0.9,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.set(0, 1.0, 1.8);
    scene.add(shieldMesh);

    // 6. Configurar Loader con KTX2 y Meshopt
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/libs/basis/");
    ktx2Loader.detectSupport(renderer);

    const gltfLoader = new GLTFLoader();
    gltfLoader.setKTX2Loader(ktx2Loader);
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);

    // Grupos contenedores
    const bossGroup = new THREE.Group();
    bossGroup.position.set(0, 0, -3.2);
    scene.add(bossGroup);

    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 1.8);
    scene.add(playerGroup);

    let currentBossMixer: THREE.AnimationMixer | null = null;
    let currentPlayerMixer: THREE.AnimationMixer | null = null;

    // Guardar referencias en gameRef
    const g = gameRef.current;
    g.scene = scene;
    g.camera = camera;
    g.renderer = renderer;
    g.bossGroup = bossGroup;
    g.playerGroup = playerGroup;
    g.shieldMesh = shieldMesh;
    g.smitePillar = smitePillar;
    g.pitRingMesh = pitRingMesh;
    g.smiteRingMesh = smiteRingMesh;
    g.bossVoidLight = bossVoidLight;
    g.pitGreenLight = pitGreenLight;
    g.projectiles = [];
    g.zoneStrikes = [];
    g.wave = 1;
    g.bossMaxHp = currentWaveCfg.maxHp;
    g.currentBossHp = currentWaveCfg.maxHp;
    g.currentPlayerHp = 100;
    g.gltfLoader = gltfLoader;

    // A. Cargar Modelo 3D del Primer Boss (Heraldo)
    setModelLoadProgress(`Invocando al ${currentWaveCfg.name}...`);
    gltfLoader.load(
      currentWaveCfg.modelUrl,
      (gltf) => {
        if (!isMounted) return;
        const model = gltf.scene;

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetScale = 4.0 / maxDim;

        model.scale.setScalar(targetScale);
        model.position.set(-center.x * targetScale, -box.min.y * targetScale, -center.z * targetScale);
        // IMPORTANTE: Rotación 0 para que mire directamente al frente (hacia el jugador y la cámara)
        model.rotation.y = 0;

        bossGroup.clear();
        bossGroup.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          currentBossMixer = new THREE.AnimationMixer(model);
          const clip =
            gltf.animations.find((a) => a.name.toLowerCase().includes("idle")) ||
            gltf.animations[0];
          currentBossMixer.clipAction(clip).play();
        }
        g.bossMixer = currentBossMixer;
        g.bossModelsCache[currentWaveCfg.key] = model;
        g.bossMixersCache[currentWaveCfg.key] = currentBossMixer;
        setModelLoading(false);

        // Precargar en segundo plano Dragón y Barón para cambio instantáneo
        ["elder", "baron"].forEach((preloadKey) => {
          const cfg = BASE_BOSS_CONFIGS[preloadKey as BossKey];
          gltfLoader.load(cfg.modelUrl, (pGltf) => {
            const pModel = pGltf.scene;
            const pBox = new THREE.Box3().setFromObject(pModel);
            const pSize = pBox.getSize(new THREE.Vector3());
            const pCenter = pBox.getCenter(new THREE.Vector3());
            const pMaxDim = Math.max(pSize.x, pSize.y, pSize.z) || 1;
            const pScale = (preloadKey === "baron" ? 4.8 : 4.4) / pMaxDim;
            pModel.scale.setScalar(pScale);
            pModel.position.set(-pCenter.x * pScale, -pBox.min.y * pScale, -pCenter.z * pScale);
            pModel.rotation.y = 0; // De frente
            g.bossModelsCache[preloadKey as BossKey] = pModel;

            if (pGltf.animations && pGltf.animations.length > 0) {
              const pMixer = new THREE.AnimationMixer(pModel);
              const pClip =
                pGltf.animations.find((a) => a.name.toLowerCase().includes("idle")) ||
                pGltf.animations[0];
              pMixer.clipAction(pClip).play();
              g.bossMixersCache[preloadKey as BossKey] = pMixer;
            }
          });
        });
      },
      undefined,
      (err) => {
        console.warn("Could not load initial boss model:", err);
        bossGroup.clear();
        const fallbackGeo = new THREE.ConeGeometry(1.6, 4.0, 16);
        const fallbackMat = new THREE.MeshStandardMaterial({
          color: currentWaveCfg.threeColor,
          emissive: currentWaveCfg.threeColor,
          emissiveIntensity: 0.3,
          roughness: 0.3,
        });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        fallbackMesh.position.y = 2.0;
        bossGroup.add(fallbackMesh);
        setModelLoading(false);
      }
    );

    // B. Cargar Modelo 3D del Campeón del Jugador
    const champUrl = getChampionModelUrl(user?.championName, user?.championRole);
    if (champUrl) {
      gltfLoader.load(
        champUrl,
        (gltf) => {
          if (!isMounted) return;
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const targetScale = 1.9 / maxDim;

          model.scale.setScalar(targetScale);
          model.position.set(-center.x * targetScale, -box.min.y * targetScale, -center.z * targetScale);
          // IMPORTANTE: Rotación Math.PI para que mire hacia adelante (hacia la fosa y el boss)
          model.rotation.y = Math.PI;

          playerGroup.clear();
          playerGroup.add(model);

          if (gltf.animations && gltf.animations.length > 0) {
            currentPlayerMixer = new THREE.AnimationMixer(model);
            const clip =
              gltf.animations.find((a) => a.name.toLowerCase().includes("idle")) ||
              gltf.animations[0];
            currentPlayerMixer.clipAction(clip).play();
          }
          g.playerMixer = currentPlayerMixer;
        },
        undefined,
        (err) => {
          console.warn("Could not load champion 3D model for minigame:", err);
          playerGroup.clear();
          const fallbackGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.8, 16);
          const fallbackMat = new THREE.MeshStandardMaterial({
            color: 0xc8aa6e,
            metalness: 0.7,
            roughness: 0.3,
          });
          const m = new THREE.Mesh(fallbackGeo, fallbackMat);
          m.position.y = 0.9;
          playerGroup.add(m);
        }
      );
    } else {
      const fallbackGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.8, 16);
      const fallbackMat = new THREE.MeshStandardMaterial({
        color: 0xc8aa6e,
        metalness: 0.7,
        roughness: 0.3,
      });
      const m = new THREE.Mesh(fallbackGeo, fallbackMat);
      m.position.y = 0.9;
      playerGroup.add(m);
    }

    // 7. Loop de Animación 60fps (Three.js)
    const clock = new THREE.Clock();

    const animate = () => {
      g.animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const now = performance.now();

      // Actualizar mixers esqueléticos
      if (g.bossMixer) g.bossMixer.update(delta);
      if (g.playerMixer) g.playerMixer.update(delta);

      // Control exclusivo por teclado: A / D y flechas
      const moveSpeed = 0.16;
      if (g.keys["left"]) {
        g.targetPlayerX = Math.max(-3.4, g.targetPlayerX - moveSpeed);
      }
      if (g.keys["right"]) {
        g.targetPlayerX = Math.min(3.4, g.targetPlayerX + moveSpeed);
      }

      g.playerX += (g.targetPlayerX - g.playerX) * 0.22;
      if (g.playerGroup) {
        g.playerGroup.position.x = g.playerX;
        // Inclinación dinámica al desplazarse
        g.playerGroup.rotation.z = (g.playerX - g.targetPlayerX) * 0.38;
      }
      if (g.shieldMesh) {
        g.shieldMesh.position.x = g.playerX;
      }

      // Animación de los anillos en la fosa
      if (pitRingMesh) pitRingMesh.rotation.z += 0.005;
      if (smiteRingMesh) smiteRingMesh.rotation.z -= 0.008;

      // Efecto del Rayo de Smite si se detonó
      if (g.isSmiteExecuting && g.smitePillar) {
        (g.smitePillar.material as THREE.MeshBasicMaterial).opacity = Math.max(
          (g.smitePillar.material as THREE.MeshBasicMaterial).opacity - delta * 2.2,
          0
        );
        if ((g.smitePillar.material as THREE.MeshBasicMaterial).opacity <= 0) {
          g.isSmiteExecuting = false;
        }
      }

      // Escudo Hextech
      if (g.currentShield) {
        if (now > g.shieldEndsAt) {
          g.currentShield = false;
          setShieldActive(false);
          if (g.shieldMesh) {
            (g.shieldMesh.material as THREE.MeshStandardMaterial).opacity = 0;
          }
        } else if (g.shieldMesh) {
          (g.shieldMesh.material as THREE.MeshStandardMaterial).opacity = 0.55;
          g.shieldMesh.rotation.y += 0.04;
        }
      }

      // Ciclo de Combate activo
      if (g.isPlaying) {
        const activeCfg = getWaveConfig(g.wave);

        // DISPARO PERIÓDICO DEL JEFE (Ataques normales y especiales)
        if (now - g.lastBossAttack > activeCfg.attackInterval) {
          g.lastBossAttack = now;
          g.attackCounter++;

          // ATAQUE ESPECIAL 2: Ataque de Zona Telegrafiado (Cada 6 ataques)
          if (g.attackCounter % 6 === 0) {
            const strikeX = g.playerX;
            showBanner(`⚠️ ¡ALERTA DE IMPACTO! ¡MUÉVETE CON [A / D]!`, "#ef4444");
            sounds.playLockIn();

            const telegraphGeo = new THREE.RingGeometry(0.75, 1.05, 32);
            const telegraphMat = new THREE.MeshBasicMaterial({
              color: 0xef4444,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.85,
            });
            const telegraphMesh = new THREE.Mesh(telegraphGeo, telegraphMat);
            telegraphMesh.rotation.x = -Math.PI / 2;
            telegraphMesh.position.set(strikeX, 0.04, 1.8);
            scene.add(telegraphMesh);

            g.zoneStrikes.push({
              mesh: telegraphMesh,
              strikeX,
              detonateAt: now + 1200,
              damage: 34,
              alive: true,
            });
          }
          // ATAQUE ESPECIAL 1: Disparo en Abanico / Lluvia (Cada 3 ataques)
          else if (g.attackCounter % 3 === 0) {
            showBanner(`¡${activeCfg.name.toUpperCase()} DISPARA EN ABANICO!`, activeCfg.themeColor);
            sounds.playSkill();

            const offsets = [-1.4, 0, 1.4];
            offsets.forEach((offset) => {
              const bulletGeo = new THREE.SphereGeometry(0.34, 16, 16);
              const bulletMat = new THREE.MeshBasicMaterial({ color: activeCfg.bulletColor });
              const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
              bulletMesh.position.set(0, 1.8, -3.0);
              scene.add(bulletMesh);

              const targetX = g.playerX + offset;
              const dir = new THREE.Vector3(
                targetX - bulletMesh.position.x,
                0.9 - bulletMesh.position.y,
                1.8 - bulletMesh.position.z
              ).normalize();

              g.projectiles.push({
                mesh: bulletMesh,
                fromPlayer: false,
                vx: dir.x * (activeCfg.bulletSpeed * 0.95),
                vy: dir.y * (activeCfg.bulletSpeed * 0.95),
                vz: dir.z * (activeCfg.bulletSpeed * 0.95),
                damage: 22,
                alive: true,
              });
            });
          }
          // ATAQUE NORMAL: Proyectil Dirigido
          else {
            const bulletGeo = new THREE.SphereGeometry(0.32, 16, 16);
            const bulletMat = new THREE.MeshBasicMaterial({ color: activeCfg.bulletColor });
            const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
            bulletMesh.position.set(
              (Math.random() - 0.5) * 1.6,
              1.6 + Math.random() * 0.4,
              -3.0
            );
            scene.add(bulletMesh);

            const targetX = g.playerX + (Math.random() - 0.5) * 0.7;
            const dir = new THREE.Vector3(
              targetX - bulletMesh.position.x,
              0.9 - bulletMesh.position.y,
              1.8 - bulletMesh.position.z
            ).normalize();

            g.projectiles.push({
              mesh: bulletMesh,
              fromPlayer: false,
              vx: dir.x * activeCfg.bulletSpeed,
              vy: dir.y * activeCfg.bulletSpeed,
              vz: dir.z * activeCfg.bulletSpeed,
              damage: 20,
              alive: true,
            });
          }
        }

        // Tensión de Smite: El jefe pierde un poco de vida progresivamente si cae bajo 1800
        if (g.currentBossHp < 1800 && g.currentBossHp > 0) {
          g.currentBossHp = Math.max(0, g.currentBossHp - 3);
          setBossHp(g.currentBossHp);

          // Si el Boss llega a 0 sin Smite -> Te robaron el objetivo
          if (g.currentBossHp <= 0) {
            handleGameOver("¡No llegaste a Smitear con [F]! El jungla enemigo te robó el objetivo.");
          }
        }

        // Procesar Ataques de Zona Telegrafiados
        for (let i = g.zoneStrikes.length - 1; i >= 0; i--) {
          const z = g.zoneStrikes[i];
          // Efecto de pulso en el suelo
          z.mesh.scale.setScalar(1 + Math.sin(now * 0.02) * 0.12);

          if (now >= z.detonateAt) {
            z.alive = false;
            scene.remove(z.mesh);

            // Destello vertical de detonación
            const boomGeo = new THREE.CylinderGeometry(0.8, 1.2, 8, 16);
            const boomMat = new THREE.MeshBasicMaterial({
              color: 0xef4444,
              transparent: true,
              opacity: 0.9,
            });
            const boomMesh = new THREE.Mesh(boomGeo, boomMat);
            boomMesh.position.set(z.strikeX, 4, 1.8);
            scene.add(boomMesh);
            setTimeout(() => scene.remove(boomMesh), 120);

            // Comprobar colisión con el jugador
            const dist = Math.abs(g.playerX - z.strikeX);
            if (dist < 0.95) {
              if (g.currentShield) {
                sounds.playLockIn();
                addDamagePopup("¡ESCUDO ABSORBIÓ IMPACTO!", "#0ac8b9", width / 2, height - 140);
              } else {
                sounds.playDamage();
                g.currentPlayerHp = Math.max(0, g.currentPlayerHp - z.damage);
                g.currentCombo = 1;
                setCombo(1);
                setPlayerHp(g.currentPlayerHp);
                addDamagePopup(`-${z.damage} IMPACTO ZONA`, "#ef4444", width / 2, height - 140);
                if (g.currentPlayerHp <= 0) {
                  handleGameOver("Fuiste fulminado por el ataque de zona especial del jefe.");
                }
              }
            } else {
              // ¡Esquivado con éxito!
              sounds.playNearMiss();
              g.currentCombo = Math.min(g.currentCombo + 1, 10);
              const zoneBonus = 15;
              g.currentScore += zoneBonus;
              setCombo(g.currentCombo);
              setScore(g.currentScore);
              setNearMisses((prev) => prev + 1);
              addDamagePopup(`¡ZONA EVADIDA! +${zoneBonus}`, "#10b981", width / 2, height - 120);
            }
          }
        }
        g.zoneStrikes = g.zoneStrikes.filter((z) => z.alive);

        // Actualizar todos los proyectiles en vuelo
        for (let i = g.projectiles.length - 1; i >= 0; i--) {
          const p = g.projectiles[i];
          p.mesh.position.x += p.vx;
          p.mesh.position.y += p.vy;
          p.mesh.position.z += p.vz;

          // Proyectil del jugador atacando al Boss
          if (p.fromPlayer) {
            if (p.mesh.position.z <= -2.8) {
              p.alive = false;
              scene.remove(p.mesh);

              // Daño al Boss
              const dmg = Math.floor(p.damage * (1 + (g.currentCombo - 1) * 0.15));
              g.currentBossHp = Math.max(0, g.currentBossHp - dmg);
              const hitPoints = p.damage > 300 ? 2 : 1;
              g.currentScore += hitPoints;
              setBossHp(g.currentBossHp);
              setScore(g.currentScore);

              // Sacudida visual al Boss
              if (bossGroup) {
                bossGroup.position.z = -3.2 - 0.15;
                setTimeout(() => {
                  if (bossGroup) bossGroup.position.z = -3.2;
                }, 80);
              }

              sounds.playSkill();
              addDamagePopup(`-${dmg}`, "#38bdf8", width / 2 + (Math.random() - 0.5) * 120, height / 2 - 60);

              // Si cae en zona de Smite por primera vez
              if (g.currentBossHp <= activeCfg.smiteThreshold && g.currentBossHp > 0) {
                smiteRingMat.opacity = 0.95;
                showBanner("¡ZONA DE SMITE! ¡PRESIONA [F] AHORA!", "#f59e0b");
              }
            } else if (p.mesh.position.z < -6 || Math.abs(p.mesh.position.x) > 8) {
              p.alive = false;
              scene.remove(p.mesh);
            }
          }
          // Proyectil del Boss atacando al Jugador
          else {
            const distToPlayer = Math.hypot(p.mesh.position.x - g.playerX, p.mesh.position.z - 1.8);

            // Esquiva Rasante (Near Miss)
            if (!p.nearMissChecked && distToPlayer > 0.6 && distToPlayer < 1.3 && Math.abs(p.mesh.position.z - 1.8) < 0.4) {
              p.nearMissChecked = true;
              g.currentCombo = Math.min(g.currentCombo + 1, 10);
              const dodgePoints = 5;
              g.currentScore += dodgePoints;
              setCombo(g.currentCombo);
              setScore(g.currentScore);
              setNearMisses((prev) => prev + 1);
              sounds.playHover();
              addDamagePopup(`¡ESQUIVA! +${dodgePoints}`, "#fbbf24", width / 2, height - 120);
            }

            // Impacto en el Jugador
            if (distToPlayer <= 0.65 && Math.abs(p.mesh.position.z - 1.8) < 0.4) {
              p.alive = false;
              scene.remove(p.mesh);

              if (g.currentShield) {
                sounds.playLockIn();
                addDamagePopup("¡ESCUDO ABSORBIÓ DAÑO!", "#0ac8b9", width / 2, height - 140);
              } else {
                sounds.playDamage();
                g.currentCombo = 1;
                g.currentPlayerHp = Math.max(0, g.currentPlayerHp - p.damage);
                setCombo(1);
                setPlayerHp(g.currentPlayerHp);
                addDamagePopup(`-${p.damage}`, "#ef4444", width / 2, height - 140);

                if (g.currentPlayerHp <= 0) {
                  handleGameOver("Caíste en la Fosa antes de asegurar el objetivo.");
                }
              }
            } else if (p.mesh.position.z > 3.8) {
              p.alive = false;
              scene.remove(p.mesh);
            }
          }
        }

        g.projectiles = g.projectiles.filter((p) => p.alive);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Eventos de Control por Teclado EXCLUSIVO (A/D para mover, F para Smite)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Movimiento Izquierda: A o Flecha Izquierda
      if (e.code === "KeyA" || e.code === "ArrowLeft" || e.key === "a" || e.key === "A") {
        g.keys["left"] = true;
      }
      // Movimiento Derecha: D o Flecha Derecha (¡NO ACTIVA SMITE!)
      if (e.code === "KeyD" || e.code === "ArrowRight" || e.key === "d" || e.key === "D") {
        g.keys["right"] = true;
      }

      // Iniciar
      if (e.code === "Enter" && gameState === "READY") {
        handleStartFight();
      }

      // Ataque de Campeón: Q
      if (e.code === "KeyQ" && g.isPlaying) {
        handlePlayerAttack();
      }

      // Escudo Hextech: W o Espacio
      if ((e.code === "KeyW" || e.code === "Space") && g.isPlaying) {
        handleActivateShield();
      }

      // Habilidad Especial: E
      if (e.code === "KeyE" && g.isPlaying) {
        handleSpecialSpell();
      }

      // SMITE: EXCLUSIVAMENTE CON LA TECLA F
      if (e.code === "KeyF" && g.isPlaying) {
        handleCastSmite();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft" || e.key === "a" || e.key === "A") {
        g.keys["left"] = false;
      }
      if (e.code === "KeyD" || e.code === "ArrowRight" || e.key === "d" || e.key === "D") {
        g.keys["right"] = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Resize Observer
    const resizeObs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || width;
        const h = entry.contentRect.height || height;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObs.observe(container);

    // Limpieza
    return () => {
      isMounted = false;
      cancelAnimationFrame(g.animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      resizeObs.disconnect();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      ktx2Loader.dispose();
      scene.clear();
    };
  }, [handleGameOver, showBanner, addDamagePopup, user]);

  // Iniciar la batalla desde Ronda 1
  const handleStartFight = () => {
    sounds.playClick();
    sounds.playLockIn();
    const g = gameRef.current;
    g.isPlaying = true;
    g.wave = 1;
    setWave(1);
    setBossesSlain(0);

    const initialCfg = getWaveConfig(1);
    g.bossMaxHp = initialCfg.maxHp;
    g.currentBossHp = initialCfg.maxHp;
    g.currentPlayerHp = 100;
    g.currentScore = 0;
    g.currentCombo = 1;
    g.playerX = 0;
    g.targetPlayerX = 0;
    g.lastBossAttack = performance.now();
    g.attackCounter = 0;

    g.projectiles.forEach((p) => g.scene?.remove(p.mesh));
    g.projectiles = [];
    g.zoneStrikes.forEach((z) => g.scene?.remove(z.mesh));
    g.zoneStrikes = [];

    setBossHp(initialCfg.maxHp);
    setPlayerHp(100);
    setScore(0);
    setCombo(1);
    setNearMisses(0);
    setScoreSaved(false);
    setGameState("FIGHTING");

    // Asegurar modelo de Ronda 1
    switchBossModel("herald");

    if (user?.championName) {
      sounds.playChampionVoice(user.championName, champKit.soundType);
    }
  };

  // Disparo básico de habilidad de campeón (Q o Clic)
  const handlePlayerAttack = useCallback(() => {
    const g = gameRef.current;
    if (!g.isPlaying || !g.scene) return;

    sounds.playClick();

    const projGeo = new THREE.SphereGeometry(0.28, 16, 16);
    const projMat = new THREE.MeshBasicMaterial({
      color: champKit.themeColor ? new THREE.Color(champKit.themeColor) : new THREE.Color(0x38bdf8),
    });
    const projMesh = new THREE.Mesh(projGeo, projMat);
    projMesh.position.set(g.playerX, 1.0, 1.6);
    g.scene.add(projMesh);

    const dir = new THREE.Vector3(0 - g.playerX, 1.5 - 1.0, -3.2 - 1.6).normalize();
    const speed = 0.28;

    g.projectiles.push({
      mesh: projMesh,
      fromPlayer: true,
      vx: dir.x * speed,
      vy: dir.y * speed,
      vz: dir.z * speed,
      damage: 280,
      alive: true,
    });
  }, [champKit]);

  // Activar Escudo Hextech (W o Espacio)
  const handleActivateShield = useCallback(() => {
    const g = gameRef.current;
    const now = performance.now();
    if (!g.isPlaying || now < g.shieldReadyAt) return;

    sounds.playHover();
    g.currentShield = true;
    g.shieldEndsAt = now + 2800; // 2.8s duración
    g.shieldReadyAt = now + 6500; // 6.5s cooldown
    setShieldActive(true);

    setShieldCd(100);
    const interval = setInterval(() => {
      const remaining = Math.max(0, g.shieldReadyAt - performance.now());
      const pct = (remaining / 6500) * 100;
      setShieldCd(pct);
      if (pct <= 0) clearInterval(interval);
    }, 100);
  }, []);

  // Habilidad Especial de Alto Daño (E)
  const handleSpecialSpell = useCallback(() => {
    const g = gameRef.current;
    const now = performance.now();
    if (!g.isPlaying || !g.scene || now < g.spellReadyAt) return;

    sounds.playLockIn();
    g.spellReadyAt = now + 8000;

    // Disparar 3 proyectiles masivos
    for (let offset = -0.6; offset <= 0.6; offset += 0.6) {
      const pGeo = new THREE.SphereGeometry(0.38, 16, 16);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(g.playerX + offset, 1.2, 1.6);
      g.scene.add(pMesh);

      const dir = new THREE.Vector3(offset * 0.2, 1.5 - 1.2, -3.2 - 1.6).normalize();
      g.projectiles.push({
        mesh: pMesh,
        fromPlayer: true,
        vx: dir.x * 0.32,
        vy: dir.y * 0.32,
        vz: dir.z * 0.32,
        damage: 420,
        alive: true,
      });
    }

    setSpellCd(100);
    const interval = setInterval(() => {
      const remaining = Math.max(0, g.spellReadyAt - performance.now());
      const pct = (remaining / 8000) * 100;
      setSpellCd(pct);
      if (pct <= 0) clearInterval(interval);
    }, 100);
  }, []);

  // Ejecución de SMITE: EXCLUSIVAMENTE CON F
  const handleCastSmite = useCallback(() => {
    const g = gameRef.current;
    if (!g.isPlaying) return;

    // 1. Rayo de Smite 3D
    sounds.playSmite();
    g.isSmiteExecuting = true;
    if (g.smitePillar) {
      (g.smitePillar.material as THREE.MeshBasicMaterial).opacity = 0.95;
    }

    const currentCfg = getWaveConfig(g.wave);

    // 2. Comprobar ventana de Smite (<= 1000 HP)
    if (g.currentBossHp <= currentCfg.smiteThreshold && g.currentBossHp > 0) {
      // ¡SMITE PERFECTO! Objetivo asegurado -> Spawnea el siguiente boss infinitamente
      advanceToNextWave();
    } else {
      // Smite prematuro
      const dmg = 800;
      g.currentBossHp = Math.max(0, g.currentBossHp - dmg);
      setBossHp(g.currentBossHp);
      addDamagePopup(`SMITE PREMATURO -${dmg}`, "#ef4444", 400, 200);

      if (g.currentBossHp > 0) {
        setTimeout(() => {
          if (g.isPlaying) {
            handleGameOver("¡Smiteaste antes de tiempo con [F]! El jungla rival aseguró el objetivo con 200 HP.");
          }
        }, 1200);
      }
    }
  }, [advanceToNextWave, handleGameOver, addDamagePopup]);

  const bossHpPct = Math.max(0, Math.min(100, (bossHp / currentWaveCfg.maxHp) * 100));
  const inSmiteRange = bossHp <= currentWaveCfg.smiteThreshold && bossHp > 0;

  return (
    <section id="minijuego" className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lol-gold/15 border border-lol-gold/30 text-lol-gold text-xs font-mono font-bold uppercase tracking-wider mb-2">
          <Crosshair size={14} />
          <span>Arena de Combate 3D • Summoner&apos;s Rift</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black font-beaufort gold-gradient-text uppercase">
          BOSS RUSH INFINITO: EL ROBO DE LA GRIETA
        </h2>
        <p className="text-gray-300 text-xs sm:text-sm max-w-xl mx-auto mt-1">
          Enfréntate en cadena al <strong className="text-cyan-400">Heraldo</strong>,{" "}
          <strong className="text-amber-400">Dragón Ancestral</strong> y{" "}
          <strong className="text-purple-400">Barón Nashor</strong>. Muévete con{" "}
          <strong className="text-white font-mono">[A / D]</strong>, esquiva sus ataques especiales y presiona{" "}
          <strong className="text-lol-gold font-mono">[F - SMITE]</strong> en el milisegundo exacto para avanzar
          sin fin.
        </p>

        {/* Timeline / Indicador de Progreso Boss Rush */}
        <div className="mt-5 flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-xs font-mono">
          {BOSS_SEQUENCE.map((bKey, idx) => {
            const b = BASE_BOSS_CONFIGS[bKey];
            const isCurrent = ((wave - 1) % 3) === idx;
            return (
              <div
                key={bKey}
                className={`px-3 py-1.5 rounded-lg border flex items-center gap-2 transition-all ${
                  isCurrent
                    ? "bg-lol-gold/20 border-lol-gold text-lol-gold shadow-glow-gold scale-105 font-bold"
                    : "bg-lol-navy-black/60 border-lol-gold/20 text-gray-400"
                }`}
              >
                <span>{b.icon}</span>
                <span>
                  {idx + 1}. {b.name}
                </span>
                {isCurrent && (
                  <span className="w-2 h-2 rounded-full bg-lol-gold animate-ping" />
                )}
              </div>
            );
          })}
          <div className="px-2.5 py-1 rounded-lg border border-purple-500/30 bg-purple-950/20 text-purple-300 flex items-center gap-1.5 text-[11px]">
            <span>♾️ Ciclo Infinito (+20% HP/Rda)</span>
          </div>
        </div>
      </div>

      {/* Main 3D Arena Container */}
      <div className="relative w-full rounded-2xl overflow-hidden border-2 border-lol-gold/50 shadow-glow-gold bg-gradient-to-b from-lol-navy-black via-[#060c16] to-black">
        {/* Hextech Corners */}
        <div className="hextech-corner hextech-corner-tl" />
        <div className="hextech-corner hextech-corner-tr" />
        <div className="hextech-corner hextech-corner-bl" />
        <div className="hextech-corner hextech-corner-br" />

        {/* 3D Canvas Viewport */}
        <div
          ref={containerRef}
          onClick={handlePlayerAttack}
          className="relative w-full h-[460px] sm:h-[540px] cursor-crosshair select-none"
        />

        {/* Top Boss Health Bar & HUD */}
        <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none flex flex-col items-center">
          <div className="w-full max-w-xl bg-lol-navy-black/90 p-3 rounded-xl border border-lol-gold/40 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1">
              <span className="text-white flex items-center gap-1.5 uppercase tracking-wide">
                <span>{currentWaveCfg.icon}</span>
                <span className="text-lol-gold">RONDA {wave}:</span>
                <span>{currentWaveCfg.name}</span>
                {currentWaveCfg.cycle > 0 && (
                  <span className="text-[10px] text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">
                    Fase {currentWaveCfg.cycle + 1}
                  </span>
                )}
              </span>
              <span className={inSmiteRange ? "text-amber-400 animate-pulse font-extrabold" : "text-gray-300"}>
                {bossHp.toLocaleString()} / {currentWaveCfg.maxHp.toLocaleString()} HP
              </span>
            </div>

            {/* Health Bar with Smite Execution Marker */}
            <div className="relative w-full h-4 bg-gray-900 rounded-full overflow-hidden border border-lol-gold/30 p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-75 ${
                  inSmiteRange
                    ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-pulse"
                    : "bg-gradient-to-r from-purple-700 via-fuchsia-600 to-emerald-500"
                }`}
                style={{ width: `${bossHpPct}%` }}
              />

              {/* Marcador del Umbral de Smite (1,000 HP) */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-yellow-300 z-10 shadow-[0_0_8px_#fde047]"
                style={{ left: `${(currentWaveCfg.smiteThreshold / currentWaveCfg.maxHp) * 100}%` }}
                title="Umbral de Smite (1,000 HP)"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mt-1">
              <span>Siguiente: {nextWaveCfg.name} {nextWaveCfg.icon}</span>
              {inSmiteRange ? (
                <span className="text-yellow-400 font-bold uppercase tracking-wider animate-bounce">
                  ⚡ ¡RANGO DE SMITE ACTIVO! PRESIONA [F] AHORA ⚡
                </span>
              ) : (
                <span>Umbral de Smite: 1,000 HP</span>
              )}
            </div>
          </div>
        </div>

        {/* Floating In-Game Notification Banner */}
        {bannerNotice && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-bounce">
            <div
              className="px-4 py-1.5 rounded-full font-mono text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-2xl backdrop-blur-md border"
              style={{
                backgroundColor: "rgba(9, 20, 40, 0.95)",
                borderColor: bannerNotice.color,
                color: bannerNotice.color,
                boxShadow: `0 0 20px ${bannerNotice.color}80`,
              }}
            >
              {bannerNotice.text}
            </div>
          </div>
        )}

        {/* 2D Floating Damage Popups */}
        {damagePopups.map((p) => (
          <div
            key={p.id}
            style={{ left: `${p.x}px`, top: `${p.y}px` }}
            className="absolute pointer-events-none font-mono font-black text-sm sm:text-base animate-ping select-none z-30 drop-shadow-md"
          >
            <span style={{ color: p.color }}>{p.text}</span>
          </div>
        ))}

        {/* Loading Overlay */}
        {modelLoading && (
          <div className="absolute inset-0 bg-lol-navy-black/90 backdrop-blur-md flex flex-col items-center justify-center z-40">
            <div className="w-12 h-12 border-3 border-lol-gold border-t-transparent rounded-full animate-spin mb-3 shadow-glow-gold" />
            <div className="text-sm font-mono text-lol-gold font-bold uppercase tracking-widest">
              {modelLoadProgress}
            </div>
            <div className="text-xs text-gray-400 mt-1">Preparando la Arena en 3D...</div>
          </div>
        )}

        {/* Ready Overlay (Start Game) */}
        {gameState === "READY" && !modelLoading && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-16 h-16 rounded-full bg-lol-navy border-2 border-lol-gold text-lol-gold flex items-center justify-center mb-4 shadow-glow-gold">
              <Crosshair size={32} />
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-beaufort text-white uppercase tracking-wider mb-2">
              ¿Listo para el Boss Rush Infinito?
            </h3>

            <p className="text-xs sm:text-sm text-gray-300 max-w-md mb-6 leading-relaxed">
              Jugarás con <strong className="text-lol-gold">{user?.championName || "tu campeón"}</strong>.
              Usa exclusivamente las teclas <strong className="text-white font-bold">[A / D]</strong> para
              moverte, dispara ataques con <strong className="text-white">[Q / Clic]</strong>, cúbrete con{" "}
              <strong className="text-white">[W / Espacio]</strong> y remata con{" "}
              <strong className="text-lol-gold font-bold">[F - SMITE]</strong>. ¡Cada objetivo derrotado suma puntos y
              despierta al siguiente monstruo épico! (¡Tu vida no se regenera entre rondas!)
            </p>

            <button
              onClick={handleStartFight}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold-dark hover:from-lol-gold hover:to-lol-gold-light text-lol-navy-black font-black text-sm uppercase tracking-widest border border-lol-gold shadow-glow-gold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Play size={18} />
              <span>Entrar a la Fosa</span>
            </button>
          </div>
        )}

        {/* Defeat Overlay (Game Over) */}
        {gameState === "DEFEAT" && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-red-950/80 border-2 border-red-500 text-red-400 flex items-center justify-center mb-3 shadow-[0_0_20px_#ef4444]">
              <Skull size={34} />
            </div>

            <span className="text-xs font-mono text-red-400 uppercase font-bold tracking-widest mb-1">
              FIN DE LA EXPEDICIÓN
            </span>

            <h3 className="text-2xl sm:text-3xl font-black font-beaufort text-white uppercase tracking-wide">
              DERROTA EN LA FOSA
            </h3>

            <p className="text-xs text-red-200 max-w-sm mt-1 mb-5">{defeatReason}</p>

            {/* Score Summary Box */}
            <div className="grid grid-cols-4 gap-2 w-full max-w-md p-3.5 rounded-xl bg-lol-navy border border-lol-gold/30 mb-6 font-mono">
              <div className="text-center">
                <div className="text-[10px] text-gray-400 uppercase">Ronda</div>
                <div className="text-lg font-black text-white">{wave}</div>
              </div>
              <div className="text-center border-l border-lol-gold/20">
                <div className="text-[10px] text-gray-400 uppercase">Monstruos</div>
                <div className="text-lg font-black text-cyan-400">{bossesSlain}</div>
              </div>
              <div className="text-center border-l border-lol-gold/20">
                <div className="text-[10px] text-gray-400 uppercase">Puntos</div>
                <div className="text-lg font-black text-lol-gold">{score.toLocaleString()}</div>
              </div>
              <div className="text-center border-l border-lol-gold/20">
                <div className="text-[10px] text-gray-400 uppercase">Combo</div>
                <div className="text-lg font-black text-amber-400">{combo}x</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleStartFight}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-lol-gold-dark via-lol-gold to-lol-gold text-lol-navy-black font-bold text-xs uppercase tracking-wider border border-lol-gold shadow-glow-gold flex items-center gap-2 transition-all hover:scale-105"
              >
                <RotateCcw size={15} />
                <span>Reintentar Boss Rush</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Interactive HUD: Controls & Skills */}
        <div className="p-3 sm:p-4 bg-lol-navy-black/95 border-t border-lol-gold/30 flex flex-wrap items-center justify-between gap-3 select-none">
          {/* Player Champion Info & Health Bar */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {user?.championImage ? (
                <img
                  src={user.championImage}
                  alt={user.championName || "Campeón"}
                  className="w-11 h-11 rounded-full border-2 border-lol-gold object-cover shadow-glow-gold shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-lol-gold/20 flex items-center justify-center text-sm font-bold text-lol-gold border border-lol-gold shrink-0">
                  ⚔️
                </div>
              )}
              {shieldActive && (
                <div className="absolute -inset-1 rounded-full border-2 border-cyan-400 animate-ping pointer-events-none" />
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-white leading-tight">
                {user?.championName || "Invocador"} •{" "}
                <span className="text-lol-gold font-mono text-[11px]">{playerHp}/100 HP</span>
              </div>
              <div className="w-28 sm:w-36 h-2 bg-gray-900 rounded-full overflow-hidden border border-lol-gold/30 mt-1">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-100"
                  style={{ width: `${playerHp}%` }}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons / Ability Bar */}
          <div className="flex items-center gap-2">
            {/* Movimiento: A / D Info */}
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded bg-black/60 border border-gray-700 text-gray-300 text-[11px] font-mono mr-1">
              <span>Mover:</span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-lol-gold font-bold">A</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-lol-gold font-bold">D</kbd>
            </div>

            {/* Q: Ataque de Campeón */}
            <button
              onClick={handlePlayerAttack}
              title="Ataque de Campeón [Q o Clic]"
              className="px-3 py-2 rounded-lg bg-lol-navy hover:bg-lol-metal border border-lol-gold/40 text-lol-gold-light text-xs font-mono font-bold transition-all shadow flex items-center gap-1.5 hover:scale-105 active:scale-95"
            >
              <Swords size={14} className="text-lol-gold" />
              <span>[Q] Atacar</span>
            </button>

            {/* W: Escudo Hextech */}
            <button
              onClick={handleActivateShield}
              disabled={shieldCd > 0}
              title="Escudo Hextech [W o Espacio]"
              className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold transition-all shadow flex items-center gap-1.5 ${
                shieldCd > 0
                  ? "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
                  : shieldActive
                  ? "bg-cyan-950 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400"
                  : "bg-lol-navy hover:bg-lol-metal border-cyan-500/50 text-cyan-300 hover:scale-105 active:scale-95"
              }`}
            >
              <Shield size={14} />
              <span>[W] Escudo</span>
            </button>

            {/* E: Habilidad Especial */}
            <button
              onClick={handleSpecialSpell}
              disabled={spellCd > 0}
              title="Ráfaga Mágica [E]"
              className={`px-3 py-2 rounded-lg border text-xs font-mono font-bold transition-all shadow flex items-center gap-1.5 ${
                spellCd > 0
                  ? "bg-gray-900 border-gray-700 text-gray-500 cursor-not-allowed"
                  : "bg-lol-navy hover:bg-lol-metal border-amber-500/50 text-amber-300 hover:scale-105 active:scale-95"
              }`}
            >
              <Zap size={14} />
              <span>[E] Ráfaga</span>
            </button>

            {/* F: SMITE (SOLO TECLA F) */}
            <button
              onClick={handleCastSmite}
              title="Smite [F]"
              className={`px-4 py-2 rounded-lg border text-xs font-mono font-black uppercase tracking-wider transition-all shadow-lg flex items-center gap-1.5 ${
                inSmiteRange
                  ? "bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black border-yellow-300 shadow-[0_0_20px_#fde047] animate-pulse scale-105"
                  : "bg-gradient-to-r from-yellow-700 to-amber-800 text-amber-100 border-yellow-600/50 hover:border-yellow-400"
              }`}
            >
              <Zap size={15} />
              <span>[F] SMITE</span>
            </button>
          </div>

          {/* Wave & Score Counter */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-gray-400 text-[10px] block leading-none">Ronda</span>
              <strong className="text-cyan-400 text-sm sm:text-base">#{wave}</strong>
            </div>
            <div className="text-right border-l border-lol-gold/20 pl-3">
              <span className="text-gray-400 text-[10px] block leading-none">Puntos</span>
              <strong className="text-lol-gold text-sm sm:text-base">{score.toLocaleString()}</strong>
            </div>
            <div className="text-right border-l border-lol-gold/20 pl-3">
              <span className="text-gray-400 text-[10px] block leading-none">Combo</span>
              <strong className="text-amber-400 text-sm sm:text-base">{combo}x</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
