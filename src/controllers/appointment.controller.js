import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

export const bookAppointment = async (req, res) => {
  try {
    const db = await getDB();
    const appointments = db.collection("appointments");

    const { doctorId, date, time, patientName, problem } = req.body;
    console.log(req.body)
    const studentId = req.user._id;
    console.log("booking doctor id", doctorId);

    const newAppointment = {
      studentId: new ObjectId(studentId),
      doctorId: new ObjectId(doctorId),
      patientName,
      date,
      problem,
      time,
      status: "pending",
      createdAt: new Date(),
    };

    await appointments.insertOne(newAppointment);

    res.json({
      message: "Appointment request sent successfully",
      appointment: newAppointment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// student apointment
export const getMyAppointments = async (req, res) => {
  try {
    console.log("User from middleware:", req.user);

    const db = await getDB();
    const appointments = db.collection("appointments");

    const studentId = req.user._id;
    console.log("Student ID:", studentId);

    

    const result = await appointments
      .find({ studentId: new ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .toArray();

    console.log("Appointments found:", result.length);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// doctor apointment
export const doctorAppointments = async (req, res) => {
  try {
    const db = await getDB();
    const appointments = db.collection("appointments");
      
    console.log("sdfjkshdfsjkf",req.user)
    const doctorId = req.user._id;
   

    console.log("DoctorId from token:", doctorId);
    console.log(
      "All doctorIds in DB:",
      (await appointments.find().toArray()).map((a) => a.doctorId)
    );

    const result = await appointments
      .find({doctorId: new ObjectId(doctorId)})
      .sort({ createdAt: -1 })
      .toArray();

    console.log("Appointments found:", result.length);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//  doctor update apoinement
export const updateAppointmentStatus = async (req, res) => {
  try {
    const db = await getDB();
    const appointments = db.collection("appointments");

    const { appointmentId, status } = req.body;
    const allowed = ["approved", "rejected", "completed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await appointments.updateOne(
      { _id: new ObjectId(appointmentId) },
      { $set: { status } }
    );

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
