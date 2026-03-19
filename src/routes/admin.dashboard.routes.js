import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  getAdminStats,
  getMonthlyAppointments
} from "../controllers/admin.dashboard.controller.js";
import { adminCreateDriver, assignDriversByMonth, getAllDriversAdmin, getAssignedDriversByMonth } from "../controllers/ambulanceAdmin.controller.js";
import { addDutyAssignment, deleteDutyAssignment, getDutyRoster, getDutyRosterDoctor, updateDutyAssignment } from "../controllers/duty.roster.doctor.js";
import { addTelemedicineDuty, deleteTelemedicineDuty, getTelemedicineDuties } from "../controllers/telemedicine.dutyroster.controller.js";
import { addDuty, deleteDuty, getMedicalUsers,  getDutyRosterpublic } from "../controllers/staff.controller.js";

const router = express.Router();

router.get("/stats", authMiddleware, roleMiddleware(["admin"]), getAdminStats);
router.get("/monthly-appointments", authMiddleware, roleMiddleware(["admin"]), getMonthlyAppointments);
router.post("/add-driver",authMiddleware, roleMiddleware(["admin"]), adminCreateDriver);
router.get("/get-drivers",authMiddleware, roleMiddleware(["admin"]), getAllDriversAdmin);
router.get("/current-driver",authMiddleware, getAssignedDriversByMonth);
router.post("/assign-driver",authMiddleware, roleMiddleware(["admin"]), assignDriversByMonth);


router.get("/duty-roster-doctor", authMiddleware, getDutyRoster);
router.get("/duty-roster-doctor-api", getDutyRosterDoctor);
router.post("/duty-roster-doctor/add", authMiddleware, roleMiddleware(["admin"]), addDutyAssignment);
router.post("/duty-roster-doctor/delete/:id", authMiddleware, roleMiddleware(["admin"]), deleteDutyAssignment);
router.patch("/duty-roster-doctor/update/:id", authMiddleware, roleMiddleware(["admin"]), updateDutyAssignment);

router.get("/telemedicine-duty",authMiddleware, roleMiddleware(["admin"]), getTelemedicineDuties);
router.post("/telemedicine-duty/add",authMiddleware, roleMiddleware(["admin"]), addTelemedicineDuty);
router.post("/telemedicine-duty/delete/:id",authMiddleware, roleMiddleware(["admin"]), deleteTelemedicineDuty);




export default router;
