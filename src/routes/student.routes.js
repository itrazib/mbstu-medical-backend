import express from "express";
import multer from "multer";
import path from "path";
import authMiddleware from "../middleware/authMiddleware.js"; // verifyToken function
import {
  getAvailableTests,
  getMyMedicalHistory,
  getMyReports,
  uploadReport,
  upload,
  getMyMedicalRecords,
  getMedicalHistory,
  getStudentReports, // Multer storage from controller
} from "../controllers/student.controller.js";

const router = express.Router();

// ==================== Upload Report ====================
router.post("/upload-report", authMiddleware, upload.single("file"), uploadReport);

// ==================== Get Student Reports ====================
router.get("/reports", authMiddleware,  getMyReports);
router.get("/reports/:studentId", authMiddleware, getStudentReports);

// ==================== Get Medical History ====================
router.get("/my-history", authMiddleware, getMyMedicalHistory);

// ==================== Get Available Tests ====================
router.get("/tests", authMiddleware, getAvailableTests);

router.get("/my-medical-records", authMiddleware, getMyMedicalRecords)

router.get("/my-history/:studentId", authMiddleware, getMedicalHistory)

export default router;