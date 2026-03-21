import express from "express";
import { addDuty, deleteDuty, getDepartments, getDutyRosterpublic, getMedicalStaff, getMedicalUsers } from "../controllers/staff.controller.js";

const router = express.Router();

router.get("/medical-staff", getMedicalStaff);
router.get("/medical-users", getMedicalUsers);
router.get("/departments", getDepartments);
router.get("/duty-roster",getDutyRosterpublic);
router.post("/duty-roster/add",addDuty);
router.post("/duty-roster/delete/:id", deleteDuty);
export default router;
