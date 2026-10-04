import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // En Docker / VPS con Dokploy se activa 'standalone' para crear la imagen ligera
  ...(process.env.BUILD_STANDALONE === "true" ? { output: "standalone" } : {}),
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ddragon.leagueoflegends.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
