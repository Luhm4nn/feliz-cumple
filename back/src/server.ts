import "dotenv/config";
import express from "express";
import cors from "cors";
import championsRouter from "./routes/champions.routes";
import rsvpRouter from "./routes/rsvp.routes";
import scoresRouter from "./routes/scores.routes";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration: permite conexiones desde el front
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api/champions", championsRouter);
app.use("/api/rsvp", rsvpRouter);
app.use("/api/scores", scoresRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "feliz-cumple-backend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`⚔️ Backend de la Grieta escuchando en http://localhost:${PORT}`);
});

export default app;
