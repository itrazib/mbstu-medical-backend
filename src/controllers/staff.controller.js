import { getDB } from "../config/db.js";

export const getMedicalStaff = async (req, res) => {
  try {
    const db = await getDB();
    const medicalUsersCol = db.collection("medicalUsers");

    // শুধু staff টাইপ ইউজার আনছি
    const staff = await medicalUsersCol
      .find({
        designation: { $exists: true, $ne: "" }, // যাদের designation আছে
      })
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
  } catch (error) {
    console.error("Medical staff fetch error:", error);
    res.status(500).json({
      message: "Failed to fetch medical staff",
    });
  }
};

// designation
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
// staff by department
export const getMedicalUsers = async (req, res) => {
  try {
    const db = await getDB();
    const { department } = req.query;

    const staff = await db
      .collection("medicalUsers")
      .find({ designation: department })
      .project({ name: 1 }) // sidebar এ শুধু name দেখাব
      .toArray();

    res.json(staff);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch staff" });
  }
};
// get roster by department
const days = ["Saturday","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday"];
const shifts = ["Morning","Evening"];

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
          as: "staffInfo"
        }
      },
      { $unwind: "$staffInfo" }
    ]).toArray();

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch duty roster" });
  }
};

// add duty assignment
export const addDuty = async (req, res) => {
  try {
    const db = await getDB();
    const { staff, department, day, shift, startTime, endTime } = req.body;

    const result = await db.collection("dutyRosters").insertOne({
      staff: new ObjectId(staff),
      department,
      day,
      shift,
      startTime,
      endTime
    });

    // Populate staff info
    const staffInfo = await db.collection("medicalUsers").findOne({ _id: new ObjectId(staff) });

    res.json({
      _id: result.insertedId,
      staff: staffInfo,
      department,
      day,
      shift,
      startTime,
      endTime
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add duty" });
  }
};


// delete duty assignment
export const deleteDuty = async (req, res) => {
  try {
    const db = await getDB();
    const { id } = req.params;

    await db.collection("dutyRosters").deleteOne({ _id: new ObjectId(id) });

    res.json({ message: "Duty removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete duty" });
  }
};

