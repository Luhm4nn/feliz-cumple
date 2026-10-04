import { Router } from "express";
import { getChampions, getChampionById } from "../controllers/champions.controller";

const router = Router();

router.get("/", getChampions);
router.get("/:id", getChampionById);

export default router;
