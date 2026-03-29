import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  updateDoctorProfile,
  getAllDoctors,
  getDoctorDetails,
  register,
  todayAppointmentsCount,
  getPatientHistory,
  getTodayPatients,

  getpatients,
  addMedicinesToRecord,
  getMedicalRecord,
  getPatientRecord,
  getReportsByRecord,
  getMedicines,
  getDispenseRecordsByStudent,
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

// router.get("/patient/:uniqueId", getPatientProfile);
router.get("/patients/:doctorId", authMiddleware, getpatients);
router.get("/patient-history/:uniqueId", authMiddleware, getPatientHistory);
router.get("/today-patients", authMiddleware, getTodayPatients)


router.post("/add-medicine", authMiddleware, addMedicinesToRecord)
// router.get("/record/:recordId", authMiddleware, getMedicalRecord)
router.get("/patient-record/:studentId", authMiddleware, getPatientRecord)
router.get("/report/:recordId", authMiddleware, getReportsByRecord)

router.get("/all-medicines", authMiddleware, getMedicines)
router.get("/dispense-records/:studentId", authMiddleware, getDispenseRecordsByStudent)
export default router;
