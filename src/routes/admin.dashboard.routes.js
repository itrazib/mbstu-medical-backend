import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getAdminStats,
  getMonthlyAppointments
} from "../controllers/admin.dashboard.controller.js";

const router = express.Router();

router.get("/stats", authMiddleware, roleMiddleware(["admin"]), getAdminStats);
router.get("/monthly-appointments", authMiddleware, roleMiddleware(["admin"]), getMonthlyAppointments);

export default router;
