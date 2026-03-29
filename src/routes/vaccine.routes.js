import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { addVaccination, getCertificate, getMyVaccination, getPendingVaccinations, rejectVaccination, verifyCertificate, verifyVaccination } from "../controllers/vaccine.controller.js";
// import {
//   generateVaccineCertificate,
//   getMyCertificate,
//   downloadPDF,
//   updateVaccine
// } from "../controllers/vaccine.controller.js";

const router = express.Router();


router.post("/add",authMiddleware, addVaccination);
router.get("/me", authMiddleware, getMyVaccination);

// admin
router.put("/verify/:id/:doseNumber",authMiddleware, verifyVaccination);

// certificate
router.get("/certificate/:userId", authMiddleware, getCertificate);
router.get("/verify/:certificateNo", authMiddleware, verifyCertificate);

router.put("/reject/:id/:doseNumber", authMiddleware, rejectVaccination) 
router.get("/pending", authMiddleware, roleMiddleware(["admin"]), getPendingVaccinations);

// router.post("/generate", authMiddleware, roleMiddleware(["student"]), generateVaccineCertificate);
// router.post("/update-vaccine", authMiddleware, updateVaccine)
// router.get("/my", authMiddleware, roleMiddleware("student"), getMyCertificate);
// router.get("/download/:certId", authMiddleware, roleMiddleware(["student"]), downloadPDF);

export default router;
