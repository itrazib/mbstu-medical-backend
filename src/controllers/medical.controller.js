
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

export const createPrescription = async (req, res) => {
  try {
    const db = await getDB();

    const { studentId, diagnosis, medicines, note, problem } = req.body;
    const doctorId = req.user._id;

    if (!studentId || !diagnosis || !medicines?.length) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const doctor = await db
      .collection("users")
      .findOne({ _id: new ObjectId(doctorId) });

    const newPrescription = {
      studentId: new ObjectId(studentId),
      doctorId: new ObjectId(doctorId),
      doctorName: doctor.name,
      diagnosis,
      medicines,
      problem,
      note: note || "",
      createdAt: new Date(),
      date: new Date().toISOString().split("T")[0],
    };

    const result = await db
      .collection("medical_records")
      .insertOne(newPrescription);

    // 🔥 AUTO CREATE DISPENSE RECORD
    await db.collection("dispenseRecords").insertOne({
      prescriptionId: result.insertedId,
      patient: { id: studentId },
      medicines: medicines.map((m) => ({
        medicineId: new ObjectId(m.medicineId),
        quantity: m.quantity,
      })),
      overallStatus: "pending",
      createdAt: new Date(),
    });

    res.json({ message: "Prescription + Dispense created" });
  } catch (err) {
    res.status(500).json({ message: err.message });
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


