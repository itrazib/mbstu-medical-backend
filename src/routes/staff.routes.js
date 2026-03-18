import express from "express";
import { getMedicalStaff } from "../controllers/staff.controller.js";
// import { getMedicalStaff } from "../controllers/medicalStaff.controller.js";

const router = express.Router();

router.get("/medical-staff", getMedicalStaff);

export default router;
