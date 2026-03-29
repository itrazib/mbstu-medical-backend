import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";
import multer from "multer";
import path from "path";
import fs from "fs";

// ==================== MULTER SETUP ====================
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-z0-9\.\-_\s]/gi, "_");
    cb(null, Date.now() + "-" + safeName);
  },
});

export const upload = multer({ storage });

// ==================== AVAILABLE TESTS ====================
export const getAvailableTests = async (req, res) => {
  try {
    const db = await getDB();
    const tests = await db.collection("tests").find().toArray();
    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== UPLOAD REPORT ====================
// export const uploadReport = async (req, res) => {
//   try {
//     const db = await getDB();
//     const studentId = req.user._id;
//     const { testId } = req.body;
//     const file = req.file;

//     if (!testId || !file) {
//       return res.status(400).json({ message: "Select a test and file to upload." });
//     }

//     // Move file to uploads folder (multer already did)
//     const fileUrl = `uploads/${file.filename}`;

//     const reportDoc = {
//       studentId: new ObjectId(studentId),
//       testId: new ObjectId(testId),
//       fileUrl,
//       createdAt: new Date(),
//     };

//     await db.collection("reports").insertOne(reportDoc);
//     res.json({ message: "Report uploaded successfully!", fileUrl });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };
export const uploadReport = async (req, res) => {
  try {
    const db = await getDB();

    const studentId = req.user._id;
    const { testId, recordId } = req.body;
    const file = req.file;

    if (!testId || !recordId || !file) {
      return res.status(400).json({
        success: false,
        message: "testId, recordId and file required",
      });
    }

    const fileUrl = `uploads/${file.filename}`;

    const reportDoc = {
      studentId: new ObjectId(studentId),
      recordId: new ObjectId(recordId),   // IMPORTANT
      testId: new ObjectId(testId),
      fileUrl,
      createdAt: new Date(),
    };

    await db.collection("reports").insertOne(reportDoc);

    res.json({
      success: true,
      message: "Report uploaded successfully",
      report: reportDoc,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ==================== GET STUDENT REPORTS ====================
export const getMyReports = async (req, res) => {
  try {
    const db = await getDB();
    const studentId = req.user._id;
    console.log(studentId)

    const reports = await db.collection("reports").aggregate([
  { $match: { studentId: new ObjectId(studentId) } },
  {
    $lookup: {
      from: "tests",
      localField: "testId",
      foreignField: "_id",
      as: "testInfo",
    },
  },
  {
    $unwind: {
      path: "$testInfo",
      preserveNullAndEmptyArrays: true,
    },
  },
  { $sort: { createdAt: -1 } },
  {
    $project: {
      _id: 1,
      fileUrl: 1,
      createdAt: 1,
      test: { _id: "$testInfo._id", name: "$testInfo.name" },
    },
  },
]).toArray();

    res.json({ success: true, reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
// ==================== GET STUDENT MEDICAL HISTORY ====================
export const getMyMedicalHistory = async (req, res) => {
  try {
    const db = await getDB();
    const med = db.collection("medical_records");
    const studentId = req.user._id;

    const records = await med.aggregate([
      // Match records for the logged-in student
      { $match: { studentId: new ObjectId(studentId) } },

      // Unwind medicines array, preserve empty arrays
      { $unwind: { path: "$medicines", preserveNullAndEmptyArrays: true } },

      // Lookup medicine details
      {
        $lookup: {
          from: "medicines",
          let: { medId: "$medicines.medicineId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", { $toObjectId: "$$medId" }] },
              },
            },
          ],
          as: "medicineInfo",
        },
      },

      { $unwind: { path: "$medicineInfo", preserveNullAndEmptyArrays: true } },

      // Add medicine name
      { $addFields: { "medicines.name": "$medicineInfo.name" } },

      // Group back by record
      {
        $group: {
          _id: "$_id",
          studentId: { $first: "$studentId" },
          doctorId: { $first: "$doctorId" },
          doctorName: { $first: "$doctorName" },
          diagnosis: { $first: "$diagnosis" },
          problem: { $first: "$problem" },
          note: { $first: "$note" },
          testInfo: { $first: "$testInfo" },
          createdAt: { $first: "$createdAt" },
          date: { $first: "$date" },
          medicines: { $push: "$medicines" },
        },
      },

      // Sort latest first
      { $sort: { createdAt: -1 } },
    ]).toArray();

    res.json({ success: true, records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getMyMedicalRecords = async (req, res) => {
  try {
    const db = await getDB();
    const studentId = req.user._id;

    const records = await db
      .collection("medical_records")
      .aggregate([
        { $match: { studentId: new ObjectId(studentId) } },
        {
          $lookup: {
            from: "tests",            // join tests if prescription mentions them
            localField: "testId",     // optional: only if testId exists in record
            foreignField: "_id",
            as: "testInfo",
          },
        },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMedicalHistory = async (req, res) => {
  try {
    const db = await getDB();
    const studentId = req.params.studentId || req.user._id;
    const med = db.collection("medical_records");

    const records = await med.find({ studentId: new ObjectId(studentId) }).toArray();
    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getStudentReports = async (req, res) => {
  try {
    const { studentId } = req.params;
    const db = await getDB();
    const reports = await db.collection("reports")
      .find({ studentId: new ObjectId(studentId) })
      .toArray();

    res.json({ success: true, reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};