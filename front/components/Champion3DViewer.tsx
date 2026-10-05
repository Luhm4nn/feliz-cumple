"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { getChampionModelUrl } from "@/lib/championSkills";
import { RotateCw, RefreshCw, AlertCircle } from "lucide-react";

interface Champion3DViewerProps {
  championName?: string | null;
  championKey?: string | null;
  height?: number | string;
  autoRotate?: boolean;
  interactive?: boolean;
  fallbackImage?: string | null;
  className?: string;
}

export default function Champion3DViewer({
  championName,
  championKey,
  height = 360,
  autoRotate = true,
  interactive = true,
  fallbackImage,
  className = "",
}: Champion3DViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isRotating, setIsRotating] = useState(autoRotate);

  const modelUrl = getChampionModelUrl(championName, championKey);

  useEffect(() => {
    if (!modelUrl || !containerRef.current) {
      if (!modelUrl) {
        setLoading(false);
        setError(true);
      }
      return;
    }

    let isMounted = true;
    const container = containerRef.current;
    const width = container.clientWidth || 320;
    const heightPx = typeof height === "number" ? height : parseInt(String(height)) || 360;

    setLoading(true);
    setError(false);

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / heightPx, 0.1, 100);
    camera.position.set(0, 1.1, 3.4);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    // Clear previous children
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffeedd, 2.2);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x0ac8b9, 1.8);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0xc8aa6e, 1.2);
    fillLight.position.set(0, -2, 2);
    scene.add(fillLight);

    // 3. Hextech Rune Pedestal (Cylinder with glowing ring)
    const pedestalGroup = new THREE.Group();
    const baseGeo = new THREE.CylinderGeometry(1.05, 1.15, 0.08, 32);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x091428,
      metalness: 0.85,
      roughness: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = -0.04;
    pedestalGroup.add(baseMesh);

    const ringGeo = new THREE.RingGeometry(0.85, 1.05, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc8aa6e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = 0.005;
    pedestalGroup.add(ringMesh);

    scene.add(pedestalGroup);

    // 4. Loaders Setup (KTX2 + MeshoptDecoder)
    let mixer: THREE.AnimationMixer | null = null;
    let modelRoot: THREE.Group | null = null;

    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath("/basis/");
    ktx2Loader.detectSupport(renderer);

    const loader = new GLTFLoader();
    loader.setKTX2Loader(ktx2Loader);
    loader.setMeshoptDecoder(MeshoptDecoder);

    loader.load(
      modelUrl,
      (gltf) => {
        if (!isMounted) return;

        modelRoot = gltf.scene;

        // Auto-center and scale model to fit view
        const box = new THREE.Box3().setFromObject(modelRoot);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = 2.0 / (maxDim || 1);
        modelRoot.scale.setScalar(targetScale);

        // Position on pedestal (y = 0)
        modelRoot.position.x = -center.x * targetScale;
        modelRoot.position.y = -box.min.y * targetScale;
        modelRoot.position.z = -center.z * targetScale;

        scene.add(modelRoot);

        // Play Idle animation if available
        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(modelRoot);
          const idleClip =
            gltf.animations.find((a) => a.name.toLowerCase().includes("idle")) ||
            gltf.animations[0];
          const action = mixer.clipAction(idleClip);
          action.play();
        }

        setLoading(false);
      },
      undefined,
      (err) => {
        console.warn("Could not load 3D champion model:", err);
        if (isMounted) {
          setLoading(false);
          setError(true);
        }
      }
    );

    // 5. Drag Interaction (Mouse / Touch Orbit)
    let isDragging = false;
    let prevMouseX = 0;
    let userRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !interactive) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      userRotationY += deltaX * 0.012;
      if (modelRoot) {
        modelRoot.rotation.y = userRotationY;
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || !interactive || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      prevMouseX = e.touches[0].clientX;
      userRotationY += deltaX * 0.015;
      if (modelRoot) {
        modelRoot.rotation.y = userRotationY;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    container.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    // 6. Animation Loop
    const clock = new THREE.Clock();
    let animId = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (mixer) {
        mixer.update(delta);
      }

      if (modelRoot) {
        if (isRotating && !isDragging) {
          userRotationY += 0.008;
          modelRoot.rotation.y = userRotationY;
        }
      }

      // Gentle pedestal rune glow pulse
      ringMesh.rotation.z += 0.003;

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width || width;
        const h = entry.contentRect.height || heightPx;
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

      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      container.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      renderer.dispose();
      ktx2Loader.dispose();
      scene.clear();
    };
  }, [modelUrl, height, interactive, isRotating]);

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl bg-gradient-to-b from-lol-navy/90 to-lol-navy-black/95 select-none ${className}`}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      {/* 3D Canvas Mount */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-lol-navy-black/85 backdrop-blur-sm z-20">
          <div className="w-10 h-10 border-2 border-lol-gold border-t-transparent rounded-full animate-spin mb-3 shadow-glow-gold" />
          <span className="text-xs font-mono text-lol-gold uppercase tracking-wider font-bold">
            Cargando Campeón...
          </span>
          <span className="text-[10px] text-gray-400 mt-1">
            {championName || "Invocador"}
          </span>
        </div>
      )}

      {/* Fallback View if model couldn't be loaded */}
      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-lol-navy-black/90 text-center z-10">
          {fallbackImage ? (
            <img
              src={fallbackImage}
              alt={championName || "Campeón"}
              className="w-24 h-24 rounded-full object-cover border-2 border-lol-gold shadow-glow-gold mb-3"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-lol-gold/15 flex items-center justify-center text-2xl text-lol-gold border border-lol-gold/40 mb-3">
              ⚔️
            </div>
          )}
          <span className="text-sm font-bold text-white mb-0.5">
            {championName}
          </span>
          <span className="text-xs text-gray-400 mb-3">
            Visualizador no disponible en este momento
          </span>
          <button
            onClick={() => {
              setError(false);
              setLoading(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-lol-navy border border-lol-gold/40 text-xs font-bold text-lol-gold-light hover:text-white hover:border-lol-gold transition-all"
          >
            <RefreshCw size={12} />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Interactive Controls Overlay */}
      {!loading && !error && interactive && (
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
          <span className="text-[10px] font-mono text-lol-gold-light/75 bg-black/60 px-2 py-0.5 rounded border border-lol-gold/20 backdrop-blur-sm">
            🖱️ Arrastra para rotar
          </span>

          <button
            onClick={() => setIsRotating((prev) => !prev)}
            className="pointer-events-auto p-1.5 rounded-full bg-black/70 hover:bg-black/90 border border-lol-gold/30 hover:border-lol-gold text-lol-gold hover:text-white transition-all shadow"
            title={isRotating ? "Pausar rotación" : "Girar automáticamente"}
          >
            <RotateCw size={13} className={isRotating ? "animate-spin" : ""} />
          </button>
        </div>
      )}
    </div>
  );
}
