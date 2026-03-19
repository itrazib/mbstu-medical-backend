// src/controllers/staff.controller.js
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

// Get all medical staff with designation
export const getMedicalStaff = async (req, res) => {
  try {
    const db = await getDB();
    const medicalUsersCol = db.collection("medicalUsers");

    const staff = await medicalUsersCol
      .find({ designation: { $exists: true, $ne: "" } })
      .project({
        name: 1,
        designation: 1,
        office: 1,
        phone: 1,
        emails: 1,
        bloodGroup: 1,
        photoUrl: 1,
      })
      .sort({ designation: 1 })
      .toArray();

    res.status(200).json({ staff });
  } catch (err) {
    console.error("Medical staff fetch error:", err);
    res.status(500).json({ message: "Failed to fetch medical staff" });
  }
};

// Get all departments/designations
export const getDepartments = async (req, res) => {
  try {
    const db = await getDB();
    const departments = await db
      .collection("medicalUsers")
      .distinct("designation");

    res.json(departments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch departments" });
  }
};

// Get staff by department
export const getMedicalUsers = async (req, res) => {
  try {
    const db = await getDB();
    const { department } = req.query;

    const staff = await db
      .collection("medicalUsers")
      .find({ designation: department })
      .project({
        _id: 1,
        name: 1,
        userId: 1,
        department: 1,
        designation: 1,
        phone: 1,
        office: 1,
        bloodGroup: 1,
        photoUrl: 1,
        email: 1,
        createdAt: 1,
      })
      .toArray();

    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
};

// Get duty roster by department with populated staff info
export const getDutyRosterpublic = async (req, res) => {
  try {
    const db = await getDB();
    const { department } = req.query;

    const records = await db.collection("dutyRosters").aggregate([
      { $match: { department } },
      {
        $lookup: {
          from: "medicalUsers",
          localField: "staff",
          foreignField: "_id",
          as: "staffInfo",
        },
      },
      { $unwind: "$staffInfo" },
      {
        $project: {
          _id: 1,
          day: 1,
          shift: 1,
          startTime: 1,
          endTime: 1,
          department: 1,
          staff: "$staffInfo", // full staff object
        },
      },
    ]).toArray();

    res.json(records);
  } catch (err) {
    console.error("Failed to fetch duty roster:", err);
    res.status(500).json({ message: "Failed to fetch duty roster" });
  }
};

// Add a duty assignment
export const addDuty = async (req, res) => {
  try {
    const db = await getDB();
    const { staff, department, day, shift, startTime, endTime } = req.body;

    // Validate staff ID
    if (!staff || typeof staff !== "string") {
      return res.status(400).json({ message: "Staff ID is required and must be a string" });
    }

    const staffIdTrimmed = staff.trim();
    if (!/^[0-9a-fA-F]{24}$/.test(staffIdTrimmed)) {
      return res.status(400).json({ message: "Invalid staff ID format" });
    }

    const staffObjectId = new ObjectId(staffIdTrimmed);

    // Insert duty record
    const result = await db.collection("dutyRosters").insertOne({
      staff: staffObjectId,
      department,
      day,
      shift,
      startTime,
      endTime,
    });

    // Populate staff info
    const staffInfo = await db.collection("medicalUsers").findOne({ _id: staffObjectId });

    res.json({
      _id: result.insertedId,
      staff: staffInfo,
      department,
      day,
      shift,
      startTime,
      endTime,
    });
  } catch (err) {
    console.error("addDuty error:", err);
    res.status(500).json({ message: "Failed to add duty", error: err.message });
  }
};

// Delete a duty assignment
export const deleteDuty = async (req, res) => {
  try {
    const db = await getDB();
    const { id } = req.params;

    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return res.status(400).json({ message: "Invalid duty ID" });
    }

    const result = await db.collection("dutyRosters").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Duty not found" });
    }

    res.json({ message: "Duty removed" });
  } catch (err) {
    console.error("deleteDuty error:", err);
    res.status(500).json({ message: "Failed to delete duty" });
  }
};