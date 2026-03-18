import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  updateDoctorProfile,
  getAllDoctors,
  getDoctorDetails,
  register,
  todayAppointmentsCount,
} from "../controllers/doctor.controller.js";

const router = express.Router();

// doctor updates/create profile
router.put("/profile", authMiddleware, roleMiddleware(["doctor"]), updateDoctorProfile);
router.post("/doctorRegister", authMiddleware,  register);
router.get("/today-patients", authMiddleware, todayAppointmentsCount);
// router.get("/today-telemedicine-doctors", authMiddleware, getTodayTelemedicineDoctors);

// students view all doctors
// 
router.get("/list",  getAllDoctors);

// get single doctor details
router.get("/details/:id",  getDoctorDetails);

export default router;
