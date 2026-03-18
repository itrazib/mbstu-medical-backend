import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
  createPrescription,
  getMyMedicalHistory,
  getStudentHistory
} from "../controllers/medical.controller.js";


const router = express.Router();

// Doctor creates prescription
router.post("/create", authMiddleware, roleMiddleware(["doctor"]), createPrescription);

// Student view
router.get("/my-history", authMiddleware, roleMiddleware(["student"]), getMyMedicalHistory);

// Doctor view specific student
router.get("/history/:studentId", authMiddleware, roleMiddleware(["doctor"]), getStudentHistory);




export default router;
