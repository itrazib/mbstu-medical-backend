import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

export const createPrescription = async (req, res) => {
  try {
    const db = await getDB();

    const { studentId, diagnosis, medicines, note, problem, testInfo } = req.body;
    const doctorId = req.user._id;

    if (!studentId || !diagnosis) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const doctor = await db
      .collection("users")
      .findOne({ _id: new ObjectId(doctorId) });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const student = await db
      .collection("users")
      .findOne({ _id: new ObjectId(studentId) });
    if (!student) return res.status(404).json({ message: "Student not found" });

    // ================= LOGIC =================
    // যদি test select করা থাকে → medicines ignore
    const finalMedicines = testInfo?.length > 0 ? [] : medicines;

    // ================= CREATE PRESCRIPTION =================
    const newPrescription = {
      studentId: new ObjectId(studentId),
      doctorId: new ObjectId(doctorId),
      doctorName: doctor.name,
      diagnosis,
      medicines: finalMedicines,
      problem,
      note: note || "",
      testInfo: testInfo || [],
      createdAt: new Date(),
      date: new Date().toISOString().split("T")[0],
    };

    const result = await db
      .collection("medical_records")
      .insertOne(newPrescription);

    // ================= AUTO CREATE DISPENSE RECORD =================
    if (finalMedicines.length > 0) {
      await db.collection("dispenseRecords").insertOne({
        prescriptionId: result.insertedId,
        patient: { id: studentId, name: student.name },
        doctor: { id: doctorId, name: doctor.name },
        medicines: finalMedicines.map((m) => ({
          medicineId: new ObjectId(m.medicineId),
          quantity: m.quantity,
        })),
        overallStatus: "pending",
        createdAt: new Date(),
      });
    }

    res.json({ message: "Prescription created successfully", prescriptionId: result.insertedId });
  } catch (err) {
    console.error(err);
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
