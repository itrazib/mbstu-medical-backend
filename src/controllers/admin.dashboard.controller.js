import { getDB } from "../config/db.js";

export const getAdminStats = async (req, res) => {
  try {
    const db = await getDB();

    const users = db.collection("users");
    const doctors = db.collection("doctors");
    const appointments = db.collection("appointments");
    const medicalRecords = db.collection("medical_records");

    // Count all
    const totalStudents = await users.countDocuments({ role: "student" });
    const totalDoctors = await users.countDocuments({ role: "doctor" });
    const totalAppointments = await appointments.countDocuments();
    const totalMedicalRecords = await medicalRecords.countDocuments();

    // appointment status pipeline
    const statusCounts = await appointments.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    // today stats
    const today = new Date().toISOString().split("T")[0];

    const todaysAppointments = await appointments.countDocuments({
      date: today
    });

    res.json({
      totalStudents,
      totalDoctors,
      totalAppointments,
      todaysAppointments,
      totalMedicalRecords,
      statusCounts
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const getMonthlyAppointments = async (req, res) => {
  try {
    const db = await getDB();
    const appointments = db.collection("appointments");

    const data = await appointments.aggregate([
      {
        $group: {
          _id: { $substr: ["$date", 0, 7] }, // "YYYY-MM"
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]).toArray();

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
