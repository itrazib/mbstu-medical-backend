import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

// Get all doctors + telemedicine duties
export const getTelemedicineDuties = async (req, res) => {
  try {
    const db = await getDB();
    const doctorsCol = db.collection("doctors");
    const dutyCol = db.collection("telemedicineDuties");

    const doctors = await doctorsCol.find().toArray();
    const duties = await dutyCol.find().toArray();

    // populate doctor info
    const dutiesWithDoctors = await Promise.all(
      duties.map(async (d) => {
        const doc = await doctorsCol.findOne({ _id: new ObjectId(d.doctor) });
        return { ...d, doctor: doc };
      }),
    );

    res.json({ doctors, duties: dutiesWithDoctors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// public
export const getTelemedicineDuty = async (req, res) => {
  try {
    const db = await getDB();

    const duties = await db
      .collection("telemedicineDuties")
      .aggregate([
        {
          $lookup: {
            from: "doctors", // MedicalUser collection name
            localField: "doctor",
            foreignField: "_id",
            as: "doctorInfo",
          },
        },
        { $unwind: "$doctorInfo" },
        {
          $project: {
            day: 1,
            doctor: {
              _id: "$doctorInfo._id",
              name: "$doctorInfo.name",
              designation: "$doctorInfo.designation",
              phone: "$doctorInfo.phone",
              email: { $arrayElemAt: ["$doctorInfo.emails", 0] },
            },
          },
        },
      ])
      .toArray();

    res.status(200).json(duties);
  } catch (error) {
    console.error("Telemedicine duty fetch error:", error);
    res.status(500).json({ message: "Failed to fetch telemedicine duty" });
  }
};

export const getTodayTelemedicineDoctors = async (req, res) => {
  try {
    const db = await getDB();
    const dutyCol = db.collection("telemedicineDuties");
    const doctorsCol = db.collection("doctors");

    // আজকের দিনের নাম
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });

    // duties for today
    const duties = await dutyCol.find({ day: today }).toArray();

    if (!duties.length) return res.json({ doctors: [] });

    const doctors = await Promise.all(
      duties.map(async (duty) => {
        const doc = await doctorsCol.findOne({
          _id: new ObjectId(duty.doctor),
        });
        if (!doc) return null;
        return {
          _id: doc._id,
          name: doc.name,
          designation: doc.designation,
          phone: doc.phone || "", // phone number যোগ
        };
      }),
    );

    const filteredDoctors = doctors.filter(Boolean);

    res.json({ doctors: filteredDoctors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Add telemedicine duty
export const addTelemedicineDuty = async (req, res) => {
  try {
    const db = await getDB();
    const dutyCol = db.collection("telemedicineDuties");
    const doctorsCol = db.collection("doctors");

    const { doctor, day } = req.body;
    if (!doctor || !day)
      return res.status(400).json({ message: "Doctor and day required" });

    const newDuty = {
      doctor: new ObjectId(doctor),
      day,
      createdAt: new Date(),
    };
    const result = await dutyCol.insertOne(newDuty);

    const doctorInfo = await doctorsCol.findOne({ _id: new ObjectId(doctor) });
    newDuty._id = result.insertedId;
    newDuty.doctor = doctorInfo;

    res.status(201).json(newDuty);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

// Delete telemedicine duty
export const deleteTelemedicineDuty = async (req, res) => {
  try {
    const db = await getDB();
    const dutyCol = db.collection("telemedicineDuties");

    const { id } = req.params;
    await dutyCol.deleteOne({ _id: new ObjectId(id) });

    res.json({ success: true, message: "Assignment removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
