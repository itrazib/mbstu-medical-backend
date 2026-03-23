import express from "express";

import { finalizeDispense, getDispensedReport, getDispenseRecords, updateDispenseStatus } from "../controllers/dispenseController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/dispense-records", authMiddleware, getDispenseRecords);
router.patch("/dispense-records/:id", authMiddleware, updateDispenseStatus);
router.post("/dispense-records/:id/finalize", authMiddleware, finalizeDispense);
router.get("/dispense-records/report", authMiddleware, getDispensedReport);

export default router;