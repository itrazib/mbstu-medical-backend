import express from "express";
import {
  bookAppointment,
  getMyAppointments,
  doctorAppointments,
  updateAppointmentStatus
} from "../controllers/appointment.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";



const router = express.Router();

// Student routes
router.post("/book", authMiddleware, roleMiddleware(['student']), bookAppointment);
router.get("/my-appointments", authMiddleware, roleMiddleware(['student']), getMyAppointments);

// Doctor routes
router.get("/doctor-list", authMiddleware); // optional: fetch doctor list
router.get("/doctor-appointments", authMiddleware, roleMiddleware(['doctor']), doctorAppointments);
router.patch("/update-status", authMiddleware, roleMiddleware(['doctor']), updateAppointmentStatus);

export default router;
