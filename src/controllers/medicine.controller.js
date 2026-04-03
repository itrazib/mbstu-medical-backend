import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// List medicines with pagination + search
export const getMedicines = async (req, res) => {
  try {
    const db = await getDB();
    const { page = 1, limit = 10, search = "" } = req.query;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { genericName: { $regex: search, $options: "i" } },
            { manufacturer: { $regex: search, $options: "i" } },
            { dosage: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await db.collection("medicines").countDocuments(query);
    const items = await db
      .collection("medicines")
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();

    res.json({
      items,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const addMedicine = async (req, res) => {
  try {
    const db = await getDB();
    const medicinesCol = db.collection("medicines");

    const {
      name,
      genericName,
      type,
      mainStockQuantity,
      monthlyStockQuantity,
      dosage,
      manufacturer,
      expiryDate,
      batchNumber,
      price,
      storageCondition,
      sideEffects,
      usageInstructions,
    } = req.body;

    // Basic validation
    if (!name || !genericName) {
      return res
        .status(400)
        .json({ message: "Name and Generic Name required" });
    }

    const newMedicine = {
      name,
      genericName,
      type,
      mainStockQuantity: Number(mainStockQuantity) || 0,
      monthlyStockQuantity: Number(monthlyStockQuantity) || 0,
      dosage,
      manufacturer,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      batchNumber,
      price: Number(price) || 0,
      storageCondition,
      sideEffects: Array.isArray(sideEffects) ? sideEffects : [],
      usageInstructions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await medicinesCol.insertOne(newMedicine);

    res.status(201).json({
      message: "Medicine added successfully",
      medicine: {
        _id: result.insertedId,
        ...newMedicine,
      },
    });
  } catch (err) {
    console.error("Add medicine error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSingleMedicine = async (req, res) => {
  try {
    const db = await getDB();
    const { id } = req.params;

    // console.log("Requested ID:", id);

    // ✅ validate id
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid medicine ID" });
    }

    const medicine = await db
      .collection("medicines")
      .findOne({ _id: new ObjectId(id) });

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.status(200).json(medicine);
  } catch (err) {
    console.error("getSingleMedicine error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMedicine = async (req, res) => {
  try {
    const db = await getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const updateData = { ...req.body };

    // Remove _id if present in body
    if (updateData._id) delete updateData._id;

    // Optional: clean sideEffects if string
    if (typeof updateData.sideEffects === "string") {
      updateData.sideEffects = updateData.sideEffects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const result = await db
      .collection("medicines")
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    const updatedMedicine = await db
      .collection("medicines")
      .findOne({ _id: new ObjectId(id) });

    res.json({
      message: "Medicine updated successfully",
      medicine: updatedMedicine,
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({
      message: "Failed to update medicine",
      error: err.message,
    });
  }
};

// Delete medicine
export const deleteMedicine = async (req, res) => {
  try {
    const db = await getDB();
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ message: "Invalid ID" });

    const result = await db
      .collection("medicines")
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ message: "Medicine not found" });

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/medicine/low-stock?threshold=5
export const getLowStockMedicines = async (req, res) => {
  try {
    const db = await getDB();
    const threshold = parseInt(req.query.threshold) || 5;

    const medicines = await db
      .collection("medicines")
      .find({
        monthlyStockQuantity: { $lte: threshold },
      })
      .sort({ monthlyStockQuantity: 1 }) // lowest first
      .toArray();

    res.json(medicines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch low-stock medicines" });
  }
};

export const getAllMedicinesWithStock = async (req, res) => {
  try {
    const db = await getDB();
    
    // query parameters (optional search, pagination)
    const { search = "", page = 1, limit = 1000 } = req.query; // default 1000 medicines
    
    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { genericName: { $regex: search, $options: "i" } },
            { manufacturer: { $regex: search, $options: "i" } },
            { dosage: { $regex: search, $options: "i" } },
          ],
        }
      : {};
    
    const total = await db.collection("medicines").countDocuments(query);
    
    let medicines = await db
      .collection("medicines")
      .find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .toArray();
    
    // convert _id to string and include stock info
    medicines = medicines.map((m) => ({
      _id: m._id.toString(),
      name: m.name,
      genericName: m.genericName,
      manufacturer: m.manufacturer,
      dosage: m.dosage,
      mainStockQuantity: m.mainStockQuantity || 0,
      monthlyStockQuantity: m.monthlyStockQuantity || 0,
    }));
    
    res.json({
      medicines,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (err) {
    console.error("getAllMedicinesWithStock error:", err);
    res.status(500).json({ message: err.message });
  }
};
