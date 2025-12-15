import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  generateVaccineCertificate,
  getMyCertificate,
  downloadPDF,
  updateVaccine
} from "../controllers/vaccine.controller.js";

const router = express.Router();

router.post("/generate", authMiddleware, roleMiddleware(["student"]), generateVaccineCertificate);
router.post("/update-vaccine", authMiddleware, updateVaccine)
router.get("/my", authMiddleware, roleMiddleware("student"), getMyCertificate);
router.get("/download/:certId", authMiddleware, roleMiddleware(["student"]), downloadPDF);

export default router;
