import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";



// GET /api/dispense-records
export const getDispenseRecords = async (req, res) => {
  try {
    const db = await getDB();
    const { page = 1, limit = 10, status, date } = req.query;
    const query = {};

    if (status && status !== "all") query.overallStatus = status;
    if (date) query.date = date;

    const items = await db
      .collection("dispenseRecords")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "users",
            localField: "patient.id",
            foreignField: "_id",
            as: "patient",
          },
        },
        { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "users",
            localField: "doctorId",
            foreignField: "_id",
            as: "doctor",
          },
        },
        { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "medicines",
            localField: "medicines.medicineId",
            foreignField: "_id",
            as: "medicineData",
          },
        },
        {
          $addFields: {
            medicines: {
              $map: {
                input: "$medicines",
                as: "m",
                in: {
                  quantity: "$$m.quantity",
                  medicine: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$medicineData",
                          cond: { $eq: ["$$this._id", "$$m.medicineId"] },
                        },
                      },
                      0,
                    ],
                  },
                },
              },
            },
          },
        },
        { $project: { medicineData: 0 } },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: parseInt(limit) },
      ])
      .toArray();

    const total = await db.collection("dispenseRecords").countDocuments(query);

    res.json({
      items,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
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

  const session = db.client.startSession();

  try {
    await session.withTransaction(async () => {
      const record = await db.collection("dispenseRecords").findOne(
        { _id: new ObjectId(id) },
        { session }
      );

      if (!record) throw new Error("Record not found");
      if (record.isFinalized) throw new Error("Already finalized");

      // 🔥 STOCK CHECK
      for (const item of record.medicines) {
        const med = await db.collection("medicines").findOne(
          { _id: item.medicineId },
          { session }
        );

        if (!med || med.monthlyStockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${med?.name}`);
        }
      }

      // 🔥 STOCK UPDATE
      for (const item of record.medicines) {
        await db.collection("medicines").updateOne(
          { _id: item.medicineId },
          { $inc: { monthlyStockQuantity: -item.quantity } },
          { session }
        );
      }

      // 🔥 MARK FINALIZED
      await db.collection("dispenseRecords").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            isFinalized: true,
            finalizedAt: new Date(),
          },
        },
        { session }
      );
    });

    res.json({ message: "Dispense finalized safely" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  } finally {
    await session.endSession();
  }
}

export const getDispensedReport = async (req, res) => {
  try {
    const db = await getDB();
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ message: "Start and End date required" });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59);

    // 🔥 AGGREGATION
    const result = await db.collection("dispenseRecords").aggregate([
      {
        $match: {
          overallStatus: "completed",
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },

      // unwind medicines array
      { $unwind: "$medicines" },

      // group by medicineId
      {
        $group: {
          _id: "$medicines.medicine._id",
          name: { $first: "$medicines.medicine.name" },
          dispensedQuantity: { $sum: "$medicines.quantity" },
        },
      },

      // lookup current stock
      {
        $lookup: {
          from: "medicines",
          localField: "_id",
          foreignField: "_id",
          as: "medicineInfo",
        },
      },

      { $unwind: "$medicineInfo" },

      {
        $project: {
          medicineId: "$_id",
          name: 1,
          dispensedQuantity: 1,
          remainingMonthlyStock: "$medicineInfo.monthlyStockQuantity",
        },
      },
    ]).toArray();

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Failed to generate report",
      error: err.message,
    });
  }
};

// module.exports = { getDispenseRecords };
