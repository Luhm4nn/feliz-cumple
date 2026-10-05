"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { GuestItem } from "@/lib/api";
import { getChampionModelUrl, getChampionKit } from "@/lib/championSkills";
import { sounds } from "@/lib/sounds";
import { Users, MessageSquare, Beer, Shield, Volume2 } from "lucide-react";

interface Squad3DStageProps {
  guests: GuestItem[];
}

interface LoadedChamp {
  guest: GuestItem;
  model: THREE.Group;
  mixer: THREE.AnimationMixer | null;
  pedestal: THREE.Group;
  screenPos: { x: number; y: number; visible: boolean };
}

export function getRsvpVisual(status?: string | null) {
  if (status === "ATTENDING") {
    return {
      hexColor: "#10b981", // Verde Esmeralda
      threeColor: 0x10b981,
      badgeText: "✓ Confirmo",
      badgeClass: "bg-emerald-950/90 text-emerald-300 border-emerald-500",
      lightColor: 0x34d399,
      isDeclined: false,
    };
  }
  if (status === "TENTATIVE") {
    return {
      hexColor: "#f59e0b", // Amarillo Ámbar
      threeColor: 0xf59e0b,
      badgeText: "⏳ En veremos",
      badgeClass: "bg-amber-950/90 text-amber-300 border-amber-500",
      lightColor: 0xfbbf24,
      isDeclined: false,
    };
  }
  if (status === "DECLINED") {
    return {
      hexColor: "#ef4444", // Rojo Carmesí
      threeColor: 0xef4444,
      badgeText: "💀 No va",
      badgeClass: "bg-red-950/90 text-red-300 border-red-500",
      lightColor: 0xf87171,
      isDeclined: true,
    };
  }
  // PENDING / Selección inicial
  return {
    hexColor: "#0ac8b9", // Cyan Hextech
    threeColor: 0x0ac8b9,
    badgeText: "⚡ Bloqueado",
    badgeClass: "bg-cyan-950/90 text-cyan-300 border-cyan-500",
    lightColor: 0x0ac8b9,
    isDeclined: false,
  };
}

export default function Squad3DStage({ guests }: Squad3DStageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [selectedGuest, setSelectedGuest] = useState<GuestItem | null>(null);
  const [nameplates, setNameplates] = useState<
    Array<{
      id: string;
      name: string;
      championName: string;
      championRole?: string | null;
      avatar?: string | null;
      rsvpStatus: string;
      screenX: number;
      screenY: number;
      visible: boolean;
      guest: GuestItem;
    }>
  >([]);

  // Solo aparecen en la escena quienes tengan un campeón bloqueado.
  // Deduplicamos rigurosamente por email (o id) para asegurar que NUNCA aparezcan modelos viejos de la misma persona.
  const guestsWithChampions: GuestItem[] = useMemo(() => {
    const seenUsers = new Set<string>();
    const result: GuestItem[] = [];

    for (const g of guests) {
      if (!g.championName) continue;
      const userKey = (g.email ? g.email.trim().toLowerCase() : g.id);
      if (!userKey || seenUsers.has(userKey)) continue;
      seenUsers.add(userKey);
      result.push(g);
    }

    return result;
  }, [guests]);

  // Firma compuesta única de la alineación activa actual: si alguien cambia de campeón o estado, la escena se actualiza de inmediato
  const stageSignature = useMemo(() => {
    return guestsWithChampions
      .map((g: GuestItem) => `${(g.email || g.id).toLowerCase()}:${g.championName}:${g.rsvpStatus}`)
      .sort()
      .join("|");
  }, [guestsWithChampions]);

  const handleSelectChampion = useCallback((guest: GuestItem) => {
    setSelectedGuest(guest);
    sounds.playClick();
    const kit = getChampionKit(guest.championName, guest.championRole);
    sounds.playChampionVoice(guest.championName, kit.soundType);
  }, []);

  useEffect(() => {
    if (!containerRef.current || guestsWithChampions.length === 0) {
      setLoading(false);
      setNameplates([]);
      return;
    }

    let isMounted = true;
    const container = containerRef.current;
    const width = container.clientWidth || 900;
    const height = container.clientHeight || 520;

    setLoading(true);
    setLoadedCount(0);

    let currentWidth = width;
    let currentHeight = height;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 2. Cinematic Lighting for the Team Lineup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
    scene.add(ambientLight);

    // Warm golden key light from top right
    const keyLight = new THREE.DirectionalLight(0xfff3db, 2.4);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    // Hextech cyan rim light from behind/left
    const cyanRim = new THREE.DirectionalLight(0x0ac8b9, 2.0);
    cyanRim.position.set(-8, 4, -4);
    scene.add(cyanRim);

    // Purple accent fill light from ground
    const purpleFill = new THREE.DirectionalLight(0xa055ff, 1.2);
    purpleFill.position.set(0, -3, 3);
    scene.add(purpleFill);

    // Ground reflective stage platform (Hextech runway)
    const count = guestsWithChampions.length;
    const spacing = count > 5 ? 2.0 : 2.4;
    const totalWidth = Math.max(0, (count - 1) * spacing);

    const stageWidth = Math.max(14, totalWidth + 6);
    const stageGeo = new THREE.CylinderGeometry(stageWidth / 2, stageWidth / 2 + 0.6, 0.2, 48);
    const stageMat = new THREE.MeshStandardMaterial({
      color: 0x050d1a,
      roughness: 0.35,
      metalness: 0.85,
    });
    const stageMesh = new THREE.Mesh(stageGeo, stageMat);
    stageMesh.position.y = -0.1;
    scene.add(stageMesh);

    // Outer golden trim ring on runway
    const trimGeo = new THREE.RingGeometry(stageWidth / 2 - 0.25, stageWidth / 2, 48);
    const trimMat = new THREE.MeshBasicMaterial({
      color: 0xc8aa6e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const trimMesh = new THREE.Mesh(trimGeo, trimMat);
    trimMesh.rotation.x = -Math.PI / 2;
    trimMesh.position.y = 0.01;
    scene.add(trimMesh);

    // 3. Loaders (KTX2 + MeshoptDecoder)
    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("/basis/");
    ktx2Loader.detectSupport(renderer);

    const loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    // Camera framing: calculate distance so all champions fit in view
    const fovRad = (camera.fov * Math.PI) / 360;
    const vTan = Math.tan(fovRad);
    const hTan = vTan * (width / height);
    const requiredZ = Math.max(
      4.4,
      (totalWidth / 2 + 1.2) / Math.max(hTan, 0.25) + 0.8
    );
    camera.position.set(0, 1.45, Math.min(requiredZ, 16));
    camera.lookAt(0, 0.95, 0);

    const loadedChamps: Array<{
      guest: GuestItem;
      champGroup: THREE.Group;
      mixer: THREE.AnimationMixer | null;
      pedestal: THREE.Group;
    }> = [];
    const mixers: THREE.AnimationMixer[] = [];

    // Load each champion in parallel
    guestsWithChampions.forEach((guest: GuestItem, index: number) => {
      const modelUrl = getChampionModelUrl(guest.championName);
      if (!modelUrl) return;

      // Position along horizontal line facing forward
      const posX = index * spacing - totalWidth / 2;
      // Slight arc curve: champions on sides are slightly forward/curved
      const normalizedFromCenter = totalWidth > 0 ? (posX / (totalWidth / 2)) : 0;
      const posZ = -Math.abs(normalizedFromCenter) * 0.45;

      const statusVisual = getRsvpVisual(guest.rsvpStatus);

      // Pedestal for this champion
      const pedestalGroup = new THREE.Group();
      pedestalGroup.position.set(posX, 0, posZ);

      const pBaseGeo = new THREE.CylinderGeometry(0.85, 0.95, 0.08, 32);
      const pBaseMat = new THREE.MeshStandardMaterial({
        color: 0x091428,
        metalness: 0.9,
        roughness: 0.25,
      });
      const pBaseMesh = new THREE.Mesh(pBaseGeo, pBaseMat);
      pBaseMesh.position.y = 0.04;
      pedestalGroup.add(pBaseMesh);

      // Glowing rune ring (Verde: asiste, Amarillo: en veremos, Rojo: no va)
      const pRingGeo = new THREE.RingGeometry(0.68, 0.88, 32);
      const pRingMat = new THREE.MeshBasicMaterial({
        color: statusVisual.threeColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const pRingMesh = new THREE.Mesh(pRingGeo, pRingMat);
      pRingMesh.rotation.x = -Math.PI / 2;
      pRingMesh.position.y = 0.085;
      pedestalGroup.add(pRingMesh);

      // Status aura point light on pedestal
      const pStatusLight = new THREE.PointLight(statusVisual.lightColor, 1.5, 2.8);
      pStatusLight.position.set(0, 0.2, 0);
      pedestalGroup.add(pStatusLight);

      scene.add(pedestalGroup);

      loader.load(
        modelUrl,
        (gltf) => {
          if (!isMounted) return;

          const rawModel = gltf.scene;
          const champGroup = new THREE.Group();
          champGroup.position.set(posX, 0.08, posZ);

          // Si el invitado no va (Rojo / DECLINED), efecto espectral/AFK
          if (statusVisual.isDeclined) {
            rawModel.traverse((node) => {
              if ((node as THREE.Mesh).isMesh) {
                const mesh = node as THREE.Mesh;
                if (mesh.material) {
                  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                  mats.forEach((m) => {
                    m.transparent = true;
                    m.opacity = 0.65;
                    if ("color" in m) {
                      (m as any).color.lerp(new THREE.Color(0xef4444), 0.2);
                    }
                  });
                }
              }
            });
          }

          // Scale and align model cleanly inside its wrapper group
          const box = new THREE.Box3().setFromObject(rawModel);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const targetScale = 1.95 / (maxDim || 1);

          rawModel.scale.setScalar(targetScale);
          rawModel.position.set(
            -center.x * targetScale,
            -box.min.y * targetScale,
            -center.z * targetScale
          );

          champGroup.add(rawModel);

          // Face towards camera (slight inward turn if on the sides)
          const angleToCenter = -normalizedFromCenter * 0.18;
          champGroup.rotation.y = angleToCenter;

          scene.add(champGroup);

          // Animation Mixer with slight random offset so they breathe naturally
          let champMixer: THREE.AnimationMixer | null = null;
          if (gltf.animations && gltf.animations.length > 0) {
            champMixer = new THREE.AnimationMixer(rawModel);
            const idleClip =
              gltf.animations.find((a) => a.name.toLowerCase().includes("idle")) ||
              gltf.animations[0];
            const action = champMixer.clipAction(idleClip);
            action.startAt(Math.random() * 2);
            action.play();
            mixers.push(champMixer);
          }

          loadedChamps.push({
            guest,
            champGroup,
            mixer: champMixer,
            pedestal: pedestalGroup,
          });

          setLoadedCount((prev) => {
            const next = prev + 1;
            if (next >= guestsWithChampions.length) {
              setLoading(false);
            }
            return next;
          });
        },
        undefined,
        (err) => {
          console.warn(`Could not load 3D model for ${guest.championName}:`, err);
          setLoadedCount((prev) => {
            const next = prev + 1;
            if (next >= guestsWithChampions.length) {
              setLoading(false);
            }
            return next;
          });
        }
      );
    });

    // 4. Raycaster for clicking champions in the 3D scene
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClickScene = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      for (const item of loadedChamps) {
        const intersects = raycaster.intersectObjects(item.champGroup.children, true);
        if (intersects.length > 0) {
          handleSelectChampion(item.guest);
          break;
        }
      }
    };

    container.addEventListener("click", onClickScene);

    // 5. Animation Loop & Screen Coordinates projection for Nameplates
    const clock = new THREE.Clock();
    let animId = 0;
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Update all champion animations
      for (const mixer of mixers) {
        mixer.update(delta);
      }

      // Rotate runway trim slowly
      trimMesh.rotation.z += 0.002;

      renderer.render(scene, camera);

      // Project 3D head positions to 2D screen coordinates for HTML Nameplates
      const updatedPlates = loadedChamps.map((item) => {
        // Find top of champion model
        const box = new THREE.Box3().setFromObject(item.champGroup);
        tempVec.set(
          (box.min.x + box.max.x) / 2,
          box.max.y + 0.35,
          (box.min.z + box.max.z) / 2
        );

        // Project to screen space (-1 to +1)
        tempVec.project(camera);

        const isVisible = tempVec.z < 1 && tempVec.z > -1;
        const screenX = ((tempVec.x + 1) * currentWidth) / 2;
        const screenY = ((-tempVec.y + 1) * currentHeight) / 2;

        return {
          id: item.guest.id,
          name: item.guest.name,
          championName: item.guest.championName || "",
          championRole: item.guest.championRole,
          avatar: item.guest.avatar,
          rsvpStatus: item.guest.rsvpStatus,
          screenX,
          screenY,
          visible: isVisible,
          guest: item.guest,
        };
      });

      if (isMounted) {
        setNameplates(updatedPlates);
      }
    };

    animId = requestAnimationFrame(animate);

    // 6. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || width;
        const h = entry.contentRect.height || height;
        currentWidth = w;
        currentHeight = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    });
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      isMounted = false;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      container.removeEventListener("click", onClickScene);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      ktx2Loader.dispose();
      scene.clear();
    };
  }, [stageSignature, handleSelectChampion]);

  const selectedKit = getChampionKit(selectedGuest?.championName, selectedGuest?.championRole);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-lol-gold/50 shadow-glow-gold bg-gradient-to-b from-lol-navy via-lol-navy-black to-lol-navy-black">
      {/* Hextech corners */}
      <div className="hextech-corner hextech-corner-tl" />
      <div className="hextech-corner hextech-corner-tr" />
      <div className="hextech-corner hextech-corner-bl" />
      <div className="hextech-corner hextech-corner-br" />

      {/* 3D Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-[480px] sm:h-[540px] cursor-pointer select-none"
      />

      {/* Floating 2D Nameplates pinned in 3D Space above each champion */}
      <div className="absolute top-0 left-0 w-full h-[480px] sm:h-[540px] pointer-events-none overflow-hidden z-20">
        {nameplates.map((plate) => {
          const isSelected = selectedGuest?.id === plate.id;
          const statusVisual = getRsvpVisual(plate.guest.rsvpStatus);
          return (
            <div
              key={plate.id}
              onClick={() => handleSelectChampion(plate.guest)}
              style={{
                left: `${plate.screenX}px`,
                top: `${plate.screenY}px`,
                transform: "translate(-50%, -100%)",
                opacity: plate.visible ? 1 : 0,
              }}
              className={`absolute pointer-events-auto cursor-pointer transition-all duration-150 flex flex-col items-center group ${
                isSelected ? "scale-110" : "hover:scale-105"
              }`}
            >
              {/* Summoner Nameplate Capsule */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-lg backdrop-blur-md transition-all ${
                  isSelected
                    ? "bg-lol-navy-black text-white ring-2"
                    : "bg-lol-navy-black/95 hover:bg-lol-navy text-white"
                }`}
                style={{
                  borderColor: statusVisual.hexColor,
                  boxShadow: isSelected
                    ? `0 0 16px ${statusVisual.hexColor}80`
                    : `0 0 8px ${statusVisual.hexColor}40`,
                }}
              >
                {plate.avatar ? (
                  <img
                    src={plate.avatar}
                    alt={plate.name}
                    className="w-5 h-5 rounded-full border object-cover shrink-0"
                    style={{ borderColor: statusVisual.hexColor }}
                  />
                ) : (
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                    style={{
                      backgroundColor: `${statusVisual.hexColor}25`,
                      color: statusVisual.hexColor,
                      border: `1px solid ${statusVisual.hexColor}`,
                    }}
                  >
                    {plate.name.charAt(0).toUpperCase()}
                  </div>
                )}

                <div className="text-left leading-none pr-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold tracking-wide">{plate.name}</span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${statusVisual.hexColor}25`,
                        color: statusVisual.hexColor,
                        border: `1px solid ${statusVisual.hexColor}60`,
                      }}
                    >
                      {statusVisual.badgeText}
                    </span>
                  </div>
                  <div
                    className="text-[9px] font-mono mt-0.5"
                    style={{ color: statusVisual.hexColor }}
                  >
                    ⚔️ {plate.championName}
                  </div>
                </div>
              </div>

              {/* Pointer triangle */}
              <div
                className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] -mt-0.5"
                style={{ borderTopColor: statusVisual.hexColor }}
              />
            </div>
          );
        })}
      </div>

      {/* Loading Overlay */}
      {loading && guestsWithChampions.length > 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-lol-navy-black/85 backdrop-blur-md z-30">
          <div className="w-12 h-12 border-3 border-lol-gold border-t-transparent rounded-full animate-spin mb-3 shadow-glow-gold" />
          <span className="text-sm font-mono text-lol-gold uppercase tracking-widest font-bold">
            Convocando al Escuadrón a la Grieta...
          </span>
          <span className="text-xs text-gray-400 mt-1">
            Cargando modelos: {loadedCount} / {guestsWithChampions.length}
          </span>
        </div>
      )}

      {/* Empty State if no guests with champions and attendance confirmed */}
      {guestsWithChampions.length === 0 && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 text-gray-400">
          <Users size={36} className="text-lol-gold mb-3 opacity-80" />
          <h3 className="text-lg font-bold text-white mb-1">
            El Escenario está esperando al Escuadrón
          </h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Para subir al podio, selecciona tu campeón y confirma tu asistencia (🟢 Sí voy, 🟡 En veremos, o 🔴 No voy).
          </p>
        </div>
      )}

      {/* Selected Champion Detail Card Footer in the 3D Stage */}
      {selectedGuest && (
        <div className="p-4 sm:p-5 bg-lol-navy-black/95 border-t border-lol-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3.5">
            {selectedGuest.avatar ? (
              <img
                src={selectedGuest.avatar}
                alt={selectedGuest.name}
                className="w-12 h-12 rounded-full border-2 border-lol-gold object-cover shadow-glow-gold shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-lol-gold/20 flex items-center justify-center text-lg font-bold text-lol-gold border-2 border-lol-gold shrink-0">
                {selectedGuest.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm sm:text-base font-extrabold text-white">
                  {selectedGuest.name}
                </span>
                <span className="text-xs font-mono text-lol-gold font-bold">
                  ({selectedGuest.championName})
                </span>
                {selectedGuest.championRole && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/80 border border-lol-gold/30 text-lol-gold">
                    {selectedGuest.championRole}
                  </span>
                )}
              </div>

              {selectedGuest.message ? (
                <p className="text-xs text-gray-300 italic">
                  "{selectedGuest.message}"
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic font-beaufort">
                  "{selectedKit.quote}"
                </p>
              )}

              {selectedGuest.dietaryNotes && (
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <Beer size={12} />
                  <span>Llevará: {selectedGuest.dietaryNotes}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => sounds.playChampionVoice(selectedGuest.championName, selectedKit.soundType)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-lol-navy hover:bg-lol-metal border border-lol-gold/40 hover:border-lol-gold text-lol-gold-light text-xs font-bold transition-all shadow shrink-0"
          >
            <Volume2 size={14} />
            <span>Escuchar Voz</span>
          </button>
        </div>
      )}
    </div>
  );
}
