import { Router } from "express";
import { getScores, submitScore } from "../controllers/scores.controller";

const router = Router();

router.get("/", getScores);
router.post("/", submitScore);

export default router;
