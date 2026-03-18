import express from 'express';

import {
  register,
  login,
  getMe,
  getAllUsers,
  approveUser,

 

} from '../controllers/authController.js';

import authMiddleware from '../middleware/authMiddleware.js';
import roleMiddleware from '../middleware/roleMiddleware.js';
// import { getDutyRosterDoctor } from '../controllers/duty.roster.doctor.js';

const router = express.Router();

// Public
router.post('/register', register);
router.post('/login', login);

// Protected
router.get('/me', authMiddleware, getMe);

// Admin only
router.get('/users', authMiddleware, roleMiddleware(['admin']), getAllUsers);
// router.get("/duty-roster-doctor-api", getDutyRosterDoctor);

router.patch('/approve/:userId', authMiddleware, roleMiddleware(['admin']), approveUser);



export default router;
