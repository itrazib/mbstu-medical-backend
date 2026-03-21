import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";



// GET /api/dispense-records
export const getDispenseRecords = async (req, res) => {
  try {
    const db = await getDB();
    const collection = db.collection("dispenseRecords");

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const status = req.query.status;
    const date = req.query.date;

    const query = {};
    if (status && status !== "all") query.overallStatus = status;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    const total = await collection.countDocuments(query);

    const items = await collection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    // Populate patient and doctor names from other collections
    const patientIds = items.map((i) => i.patient).filter(Boolean);
    const doctorIds = items.map((i) => i.doctor).filter(Boolean);

    const patients = await db
      .collection("patients")
      .find({ _id: { $in: patientIds.map((id) => new ObjectId(id)) } })
      .project({ name: 1 })
      .toArray();
    const doctors = await db
      .collection("doctors")
      .find({ _id: { $in: doctorIds.map((id) => new ObjectId(id)) } })
      .project({ name: 1 })
      .toArray();

    const populated = items.map((rec) => ({
      ...rec,
      patient:
        patients.find((p) => p._id.toString() === rec.patient?.toString()) ||
        null,
      doctor:
        doctors.find((d) => d._id.toString() === rec.doctor?.toString()) ||
        null,
    }));

    res.set("X-Total-Count", total);
    res.json({ items: populated, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export async function updateDispenseStatus(req, res) {

    const db = await getDB();
  const { id } = req.params;
  const { overallStatus } = req.body;

  if (!["pending", "completed"].includes(overallStatus)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const result = await db
      .collection("dispenseRecords")
      .updateOne({ _id: new ObjectId(id) }, { $set: { overallStatus } });

    if (result.matchedCount === 0)
      return res.status(404).json({ message: "Record not found" });

    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function finalizeDispense(req, res) {

    const db = await getDB();
  const { id } = req.params;

  try {
    const record = await db
      .collection("dispenseRecords")
      .findOne({ _id: new ObjectId(id) });

    if (!record) return res.status(404).json({ message: "Record not found" });

    if (record.overallStatus !== "completed")
      return res.status(400).json({ message: "Record not completed yet" });

    // Decrease stock for each medicine
    const updates = record.medicines.map((item) =>
      db
        .collection("medicines")
        .updateOne(
          { _id: new ObjectId(item.medicine._id) },
          { $inc: { monthlyStockQuantity: -item.quantity } },
        ),
    );

    await Promise.all(updates);

    res.json({ message: "Dispense finalized and stock updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// module.exports = { getDispenseRecords };
