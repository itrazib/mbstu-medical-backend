import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

export const adminCreateDriver = async (req, res) => {
  try {
    const db = await getDB();
    const drivers = db.collection("ambulanceDrivers");

    const { name, mobile, designation } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({ message: "Name and mobile are required" });
    }

    const result = await drivers.insertOne({
      name,
      mobile,
      designation: designation || "Ambulance Driver",
      createdAt: new Date(),
    });

    res.json({
      message: "Driver created successfully",
      driverId: result.insertedId,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllDriversAdmin = async (req, res) => {
  try {
    const db = await getDB();
    const drivers = db.collection("ambulanceDrivers");

    const list = await drivers
      .find({})
      .sort({ name: 1 })
      .toArray();

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const getAssignedDriversByMonth = async (req, res) => {
  try {
    const { month } = req.query;

    const db = await getDB();
    const assignments = db.collection("ambulanceAssignments");
    const driversCol = db.collection("ambulanceDrivers");

    const record = await assignments.findOne({ month });

    if (!record) {
      return res.json({ month, drivers: [] });
    }

    const drivers = await driversCol
      .find({ _id: { $in: record.driverIds } })
      .toArray();

    res.json({
      month,
      drivers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const assignDriversByMonth = async (req, res) => {
  try {
    const { month, driverIds } = req.body;

    const db = await getDB();
    const assignments = db.collection("ambulanceAssignments");

    // clear assignment
    if (!driverIds || driverIds.length === 0) {
      await assignments.deleteOne({ month });
      return res.json({ cleared: true });
    }

    const ids = driverIds.map((id) => new ObjectId(id));

    await assignments.updateOne(
      { month },
      {
        $set: {
          month,
          driverIds: ids,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    res.json({
      success: true,
      drivers: ids,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

