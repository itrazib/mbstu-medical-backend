import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  adminCreateUser,
  getAllDoctorsAdmin,
  deleteDoctor
} from "../controllers/admin.user.controller.js";

const router = express.Router();

router.post("/create-user", authMiddleware, roleMiddleware(["admin"]), adminCreateUser);
router.get("/doctors", authMiddleware, getAllDoctorsAdmin);
router.delete("/doctor/:id", authMiddleware, roleMiddleware(["admin"]), deleteDoctor);

export default router;
