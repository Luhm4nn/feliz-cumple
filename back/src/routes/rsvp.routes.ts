import { Router } from "express";
import { getGuests, submitRsvp } from "../controllers/rsvp.controller";

const router = Router();

router.get("/", getGuests);
router.post("/", submitRsvp);

export default router;
