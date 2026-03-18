import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = express.Router();

import { addPathologyTest, getPathologyTests, } from "../controllers/diagnosis.js";

router.get("/pathology-tests", authMiddleware, getPathologyTests);  
router.post("/pathology-tests-add", authMiddleware, roleMiddleware(["admin"]), addPathologyTest);  // POST route for testing

export default router;