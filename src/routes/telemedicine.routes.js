import { getTelemedicineDuty,getTodayTelemedicineDoctors } from "../controllers/telemedicine.dutyroster.controller.js";

import express from "express";

const router = express.Router();

router.get("/telemedicine-duty-api", getTelemedicineDuty);
router.get("/today-telemedicine-doctors", getTodayTelemedicineDoctors);

export default router;