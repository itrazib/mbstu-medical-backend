import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.routes.js';
import appointmentRoutes from './routes/appointment.routes.js';
import medicalRoutes from './routes/medical.routes.js';
import vaccineRoutes from './routes/vaccine.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import adminDashboardRoutes from './routes/admin.dashboard.routes.js';
import adminUserRoutes from './routes/admin.user.routes.js';
import staffRoutes from './routes/staff.routes.js';
import telemedicineRoutes from './routes/telemedicine.routes.js';
import pathologyTestRoutes from './routes/pathology.test.js';
import medicineRoutes from './routes/medicine.routes.js';
import dispenseRoutes from './routes/dispense.routes.js';
import studentRoutes from './routes/student.routes.js';

import { connectDB } from './config/db.js';

const app = express();

// ✅ connect DB (NO IIFE)
connectDB();

app.use(cors({
  origin: "*", // ⚠️ production এ domain দিও
  credentials: true,
}));

app.use(express.json());

// ✅ routes
app.use('/api/auth', authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointment", appointmentRoutes);
app.use("/api/vaccine", vaccineRoutes);
app.use("/api/medical", medicalRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/admin/dashboard", adminDashboardRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/telemedicine", telemedicineRoutes);
app.use("/api/diagnosis", pathologyTestRoutes);
app.use("/api/medicine", medicineRoutes);
app.use("/api/dispense", dispenseRoutes);
app.use("/api/student", studentRoutes);

// ❌ REMOVE this (important)
// app.use('/uploads', express.static(...))

app.get('/', (req, res) => {
  res.send('✅ MBSTU Medical Server Running');
});

// ❌ REMOVE listen
// app.listen(...)

// ✅ EXPORT for Vercel
export default app;