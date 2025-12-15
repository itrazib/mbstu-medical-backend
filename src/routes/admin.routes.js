import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import { getPendingUsers, updateUserRole } from "../controllers/authController.js";



const router = express.Router();

// Only Admin can access
router.get("/pending-users", authMiddleware, roleMiddleware(['admin']), getPendingUsers);

router.patch("/update-role", authMiddleware, roleMiddleware(['admin']), updateUserRole);

export default router;
