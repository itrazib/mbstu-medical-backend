import express from "express";

import { finalizeDispense, getDispenseRecords, updateDispenseStatus } from "../controllers/dispenseController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/dispense-records", authMiddleware, getDispenseRecords);
router.patch("/dispense-records/:id", authMiddleware, updateDispenseStatus);
router.post("/dispense-records/:id/finalize", authMiddleware, finalizeDispense);

export default router;