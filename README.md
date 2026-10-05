# ⚔️ Invitación en la Grieta del Invocador (League of Legends)

Aplicación web interactiva de invitación de cumpleaños con temática integral de **League of Legends (Hextech / Summoner's Rift)**, con arquitectura completamente separada en **Frontend (`front/`)** y **Backend (`back/`)**.

---

## 🏗️ Arquitectura del Proyecto

```
feliz-cumple/
├── back/                         # API REST Backend (Node.js, Express, TypeScript)
│   ├── src/
│   │   ├── controllers/         # champions, rsvp, scores
│   │   ├── services/            # riot (Data Dragon), prisma (Neon PostgreSQL)
│   │   ├── routes/              # champions, rsvp, scores
│   │   └── server.ts            # Servidor Express (Puerto 4000) con CORS
│   ├── prisma/
│   │   └── schema.prisma        # Modelos Neon PostgreSQL con restricción de campeón único
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── .env
│   └── Dockerfile               # Contenedor de backend para Dokploy
│
├── front/                        # Aplicación Frontend (Next.js 15, React 19, Tailwind)
│   ├── app/                     # Next.js App Router (layout, page, globals)
│   ├── components/              # Navbar, HeroCountdown, ChampionSelect, Minigame, etc.
│   ├── context/                 # AuthContext
│   ├── lib/                     # api.ts (cliente HTTP al backend), sounds.ts (Web Audio)
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── .env.example
│   ├── .env
│   └── Dockerfile               # Contenedor de frontend standalone para Dokploy
│
├── docker-compose.yml           # Orquestación Dokploy para tu VPS en Hostinger
├── pnpm-workspace.yaml          # Monorepo con pnpm
└── package.json                 # Scripts unificados de desarrollo y compilación
```

---

## ⚔️ Características Principales

1. **Datos del Evento y Cuenta Regresiva:**
   - **Fecha:** Sábado 10 de Octubre de 2026 a las 20:30 hs.
   - **Lugar:** Congreso 533, San Lorenzo, Santa Fe.
   - Contador regresivo en tiempo real con estética Hextech.
   - Mapa interactivo de **Google Maps** embebido y botones directos a **Google Maps** y **Waze**.

2. **Fase de Selección de Campeones (Los 170+ Campeones de LoL):**
   - Conexión dinámica desde el backend con **Riot Data Dragon API** en español (`es_ES`):
     - Splash arts en alta definición, retratos oficiales y roles.
     - Habilidades completas: **Pasiva, Q, W, E y R** con iconos y descripciones oficiales.
   - Buscador en vivo por nombre y filtro por roles (*Asesinos, Luchadores, Magos, Tiradores, Soportes, Tanques*).
   - **Regla de Oro (Campeón Único por Persona):** Cuando un invitado bloquea un campeón ("Lock-In"), queda reservado exclusivamente para él en el backend (`409 Conflict` si otro intenta tomarlo).

3. **Confirmación de Asistencia (RSVP):**
   - Estados: *¡A la batalla! (Confirmado)*, *En base (En duda)*, *AFK (No podré ir)*.
   - Elección de pociones (*Poción de Vida con alcohol / Poción de Maná sin alcohol / Poción de Corrupción*).
   - Preferencia de banquete (*Asado, Vegetariano, Vegano, Celíaco*).
   - Pergamino de dedicatorias y mensajes para el cumpleañero.

4. **El Muro de los Invocadores (Lobby de Invitados):**
   - Muestra las tarjetas de todos los amigos confirmados con su campeón asignado, rol, dedicatoria y récord del minijuego.

5. **Minijuego "Baron Steal & Skillshot Dodge":**
   - Minijuego interactivo en Canvas donde juegas con el avatar de tu campeón elegido.
   - Habilidad especial activa según el rol de tu campeón:
     - **Asesino:** Destello sombrío con invulnerabilidad temporal.
     - **Mago:** Onda de choque arcana que limpia todos los proyectiles en pantalla.
     - **Tanque:** Escudo inquebrantable de 4 segundos.
     - **Tirador:** Ráfaga en abanico que destruye obstáculos.
     - **Soporte:** Recuperación de vida y ralentización cósmica.
     - **Luchador:** Giro con espada para despejar amenazas cercanas.
   - Evento de **Barón Nashor**: cuando el Barón desciende, debes acertar el **SMITE** (Tecla `D`/`F` o botón en pantalla) en la ventana dorada de vida para robarlo y ganar +5,000 puntos.
   - Ranking global (Leaderboard) con medallas Challenger, Gran Maestro y Maestro.

6. **Efectos de Sonido Hextech (Web Audio API):**
   - Sintetizador de audio nativo client-side (sin descargas de archivos mp3 pesados): sonido de Lock-In, Smite, habilidades, clic Hextech y fanfarria de victoria con botón de silencio.

---

## 🛠️ Instalación y Desarrollo Local

### 1. Instalar dependencias del monorepo
```bash
pnpm install
```

### 2. Generar cliente de Prisma en el Backend
```bash
pnpm prisma:generate
```

### 3. Iniciar Backend y Frontend

Puedes correr cada uno en una terminal separada:

**Terminal 1 (Backend - Puerto 4000):**
```bash
pnpm dev:back
# O entrando a la carpeta:
# cd back && pnpm dev
```

**Terminal 2 (Frontend - Puerto 3000):**
```bash
pnpm dev:front
# O entrando a la carpeta:
# cd front && pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🗄️ Base de Datos Neon (PostgreSQL)

Configura la URL de Neon en `back/.env`:
```env
DATABASE_URL="postgresql://usuario:contraseña@ep-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://usuario:contraseña@ep.us-east-2.aws.neon.tech/neondb?sslmode=require"
```

Aplica las tablas con:
```bash
pnpm prisma:push
```

> **Nota:** La aplicación incluye un fallback en memoria para que puedas probarla localmente al 100% de inmediato sin configurar Neon.

---

## 🚀 Despliegue con Dokploy en VPS (Hostinger)

El archivo `docker-compose.yml` en la raíz orquesta ambos servicios:

```yaml
services:
  back:
    build:
      context: ./back
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - DIRECT_URL=${DIRECT_URL}

  front:
    build:
      context: ./front
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
```

En Dokploy:
1. Crea una aplicación apuntando al repositorio con tipo de compilación **Docker Compose**.
2. En las variables de entorno de Dokploy define `DATABASE_URL`, `DIRECT_URL` y `NEXT_PUBLIC_API_URL`.
3. Dokploy levantará el backend y el frontend exponiendo el front a tu dominio con SSL automático.
