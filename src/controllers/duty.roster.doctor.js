// import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
// const { ObjectId } = require("mongodb");

// Get all doctors and optionally the duty roster for a month
export const getDutyRoster = async (req, res) => {
  try {
    const db = await getDB();
    const doctorsCol = db.collection("doctors");
    const dutyCol = db.collection("dutyRosterDoctor");

    // Get all doctors
    const doctors = await doctorsCol.find().toArray();

    // Get all assignments
    const dutyRosterDoctor = await dutyCol.find().toArray();

    res.json({ doctors, dutyRosterDoctor });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};



// const { connect } = require("../lib/dbConnect");

export const getDutyRosterDoctor = async (req, res) => {
  try {
    const db = await getDB();
    const { day } = req.query;

    const matchStage = day ? { $match: { day } } : { $match: {} };

    const roster = await db
      .collection("dutyRosterDoctor")
      .aggregate([
        matchStage,
        {
          $lookup: {
            from: "doctors",
            localField: "doctor",
            foreignField: "_id",
            as: "doctorInfo",
          },
        },
        { $unwind: "$doctorInfo" },
        {
          $project: {
            day: 1,
            shift: 1,
            startTime: 1,
            endTime: 1,
            doctor: {
              _id: "$doctorInfo._id",
              name: "$doctorInfo.name",
              designation: "$doctorInfo.designation",
              department: "$doctorInfo.department",
            },
          },
        },
      ])
      .toArray();

    res.status(200).json(roster);
  } catch (error) {
    console.error("Duty roster fetch error:", error);
    res.status(500).json({ message: "Failed to fetch duty roster" });
  }
};



// Add a doctor to a duty shift
export const addDutyAssignment = async (req, res) => {
  try {
    const db = await getDB();
    const dutyCol = db.collection("dutyRosterDoctor");

    const { doctor, day, shift, startTime, endTime } = req.body;

    if (!doctor || !day || !shift) {
      return res.status(400).json({ message: "Doctor, day and shift are required" });
    }

    const newAssignment = {
      doctor: new ObjectId(doctor),
      day,
      shift,
      startTime,
      endTime,
      createdAt: new Date(),
    };

    const result = await dutyCol.insertOne(newAssignment);

    // populate doctor info
    const doctorsCol = db.collection("doctors");
    const doctorInfo = await doctorsCol.findOne({ _id: new ObjectId(doctor) });
    newAssignment._id = result.insertedId;
    newAssignment.doctor = doctorInfo;

    res.status(201).json(newAssignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Delete a doctor from a duty shift
export const deleteDutyAssignment = async (req, res) => {
  try {
    const db = await getDB();
    const dutyCol = db.collection("dutyRosterDoctor");

    const { id } = req.params;

    await dutyCol.deleteOne({ _id: new ObjectId(id) });

    res.json({ success: true, message: "Assignment removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Update an existing duty assignment (optional)
export const updateDutyAssignment = async (req, res) => {
  try {
    const db = await getDB();
    const dutyCol = db.collection("dutyRosterDoctor");

    const { id } = req.params;
    const { day, shift, startTime, endTime, doctor } = req.body;

    const updateData = {};
    if (day) updateData.day = day;
    if (shift) updateData.shift = shift;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;
    if (doctor) updateData.doctor = new ObjectId(doctor);
    updateData.updatedAt = new Date();

    await dutyCol.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    // Populate doctor info if updated
    let updatedAssignment = await dutyCol.findOne({ _id: new ObjectId(id) });
    if (doctor) {
      const doctorsCol = db.collection("doctors");
      const doctorInfo = await doctorsCol.findOne({ _id: new ObjectId(doctor) });
      updatedAssignment.doctor = doctorInfo;
    }

    res.json(updatedAssignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
