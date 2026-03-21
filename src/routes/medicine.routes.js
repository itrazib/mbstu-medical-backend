import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
const router = express.Router();
import { addMedicine, deleteMedicine, getLowStockMedicines, getMedicines, getSingleMedicine, updateMedicine } from "../controllers/medicine.controller.js";

router.post("/add", authMiddleware, addMedicine);
router.get("/medicines/:id", authMiddleware, getSingleMedicine);
router.put("/medicines/:id", authMiddleware, updateMedicine);
router.get("/medicines", authMiddleware, getMedicines);
router.delete("/medicines/:id", authMiddleware, deleteMedicine);
router.get("/low-stock", authMiddleware, getLowStockMedicines);


export default router;