
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

export const createPrescription = async (req, res) => {
  try {
    const db = await getDB();
    const med = db.collection("medical_records");
    const users = db.collection("users");

    const doctorId = req.user?._id;

    // Extract body data
    const { studentId, diagnosis, prescription, note, problem} = req.body;
    console.log(req.body)

    // Basic input validation
    if (!studentId || !diagnosis || !prescription) {
      return res.status(400).json({
        error: "studentId, diagnosis and prescription are required."
      });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(studentId) || !ObjectId.isValid(doctorId)) {
      return res.status(400).json({ error: "Invalid ID format." });
    }

    // Fetch doctor and student information
    const doctor = await users.findOne({ _id: new ObjectId(doctorId) });
    const student = await users.findOne({ _id: new ObjectId(studentId) });

    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found." });
    }

    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    // Create new medical record
    const newRecord = {
      studentId: new ObjectId(studentId),
      doctorId: new ObjectId(doctorId),
      doctorName: doctor.name,
      diagnosis,
      prescription,
      problem,
      note: note || "",
      date: new Date().toISOString().split("T")[0],
      createdAt: new Date()
    };

    // Insert data into DB
    await med.insertOne(newRecord);

    return res.json({
      message: "Prescription created successfully",
      record: newRecord
    });

  } catch (err) {
    console.error("Prescription error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// medical history 
export const getMyMedicalHistory = async (req, res) => {
  try {
    const db = await getDB();
    const med = db.collection("medical_records");

    const studentId = req.user._id;

    const records = await med
      .find({ studentId: new ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(records);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// doctor sees patient history
export const getStudentHistory = async (req, res) => {
  try {
    const db = await getDB();
    const med = db.collection("medical_records");

    const { studentId } = req.params;

    const records = await med
      .find({ studentId: new ObjectId(studentId) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(records);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


