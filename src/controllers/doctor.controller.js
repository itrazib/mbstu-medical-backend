import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

export const updateDoctorProfile = async (req, res) => {
  try {
    const db = await getDB();
    const doctors = db.collection("doctors");

    const doctorId = req.user.id;
    const {
      department,
      specialization,
      education,
      experience,
      room,
      availableTime,
      phone,
      fee,
      days,
      bio,
      image,
    } = req.body;

    const existing = await doctors.findOne({ userId: new ObjectId(doctorId) });

    const profileData = {
      userId: new ObjectId(doctorId),
      name: req.user.name,
      department,
      specialization,
      education,
      experience,
      room,
      availableTime,
      phone,
      fee,
      days,
      bio,
      image,
      updatedAt: new Date(),
    };

    if (existing) {
      await doctors.updateOne(
        { userId: new ObjectId(doctorId) },
        { $set: profileData },
      );
      return res.json({ message: "Profile updated", profile: profileData });
    }

    await doctors.insertOne(profileData);

    res.json({
      message: "Profile created successfully",
      profile: profileData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// get all doctore
export const getAllDoctors = async (req, res) => {
  try {
    const db = await getDB();
    const doctors = db.collection("doctors");

    const list = await doctors.find().toArray();

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// dpctor details
export const getDoctorDetails = async (req, res) => {
  try {
    const db = await getDB();
    const doctors = db.collection("doctors");
    const { id } = req.params;

    const doc = await doctors.findOne({ _id: new ObjectId(id) });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      universityId,
      role,
      department,
      specialization,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    const db = await getDB();

    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      universityId,
      role: role, // use frontend role
      department: department || "",
      specialization: specialization || "",
      isApproved: false, // admin approval needed
      createdAt: new Date(),
    };

    await db.collection("users").insertOne(newUser);

    res.status(201).json({
      status: true,
      message: "Registered. Waiting for admin approval.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const todayAppointmentsCount = async (req, res) => {
  try {
    const db = await getDB();
    const appointments = db.collection("appointments");

    const doctorId = new ObjectId(req.user._id);

    // আজকের তারিখ (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0];

    const count = await appointments.countDocuments({
      doctorId: new ObjectId(doctorId),
      date: today,
    });

    res.json(count);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDoctorProfile = async (req, res) => {
  try {
    const db = await getDB();
    const doctors = db.collection("doctors");
    const users = db.collection("users");
    const { id } = req.params;

    await doctors.deleteOne({ userId: new ObjectId(id) });
    await users.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: "Doctor profile deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// get patients
// export const getPatients = async (req, res) => {
//   try {
//     const db = await getDB();
//     const students = db.collection("users");
//     const patients = await students
//       .find({ role: "student" })
//       .project({ name: 1, universityId: 1, department: 1, session: 1 })
//       .toArray();

//     res.json(patients);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

// export const getPatients = async (req, res) => {
//   try {
//     const db = await getDB();
//     const usersCollection = db.collection("users");

//     const patients = await usersCollection
//       .find({ role: "student" }) // student role
//       .project({
//         _id: 1,
//         name: 1,
//         universityId: 1,
//         department: 1,
//         session: 1,
//       })
//       .toArray();

//     res.json({ success: true, patients });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


// get patients list with specific doctor
export const getpatients = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const db = await getDB();
    const appointmentCollection = db.collection("appointments");

    const patients = await appointmentCollection.aggregate([
      {
        $match: {
          doctorId: new ObjectId(doctorId),
          status: "approved"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "studentDetails"
        }
      },
      {
        $unwind: "$studentDetails"
      },
      {
        $project: {
          _id: 1,
          patientName: 1,
          problem: 1,
          date: 1,
          time: 1,
          studentId: 1,

          "studentDetails.name": 1,
          "studentDetails.universityId": 1,
          "studentDetails.department": 1,
          "studentDetails.session": 1,
          "studentDetails.image": 1
        }
      }
    ]).toArray();

    res.json({
      success: true,
      totalPatients: patients.length,
      patients
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
// export const getPatientProfile = async (req, res) => {
//   try {
//     // const { uniqueId } = req.params;
//     const {uniqueId}= req.params;

//     const db = await getDB();
//     // your db name
//     const usersCollection = db.collection("users"); // your collection

//     const patient = await usersCollection.findOne({
//       _id: new ObjectId(uniqueId)
//     });

//     if (!patient) {
//       return res.status(404).json({
//         success: false,
//         message: "Patient not found",
//       });
//     }

//     res.json({
//       success: true,
//       user: {
//         _id: patient._id,
//         name: patient.name,
//         email: patient.email,
//         uniqueId: patient.universityId,
//         department: patient.department,
//         session: patient.session,
//         role: patient.role,
//         phone: patient.phone || "",
//         bloodGroup: patient.bloodGroup || null,
//         dob: patient.dob || null,
//         // photoUrl: patient.photoUrl || "",
//       },
//     });
//   } catch (error) {
//     console.error("Get Patient Error:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//     });
//   }
// };

// // get patient history
// export const getPatientHistory = async (req, res) => {
//   try {
//     const { uniqueId } = req.params; // patient universityId
//     const db = await getDB();
//     const usersCollection = db.collection("users");
//     const medicalCollection = db.collection("medical_records");

//     // find patient
//     const patient = await usersCollection.findOne({ _id: new ObjectId(uniqueId) } );
//     if (!patient) {
//       return res.status(404).json({ success: false, message: "Patient not found" });
//     }

//     // get all medical records for this patient
//     const records = await medicalCollection
//       .find({ studentId: patient._id.toString() })
//       .sort({ createdAt: -1 })
//       .toArray();

//     res.json({
//       success: true,
//       patient: {
//         _id: patient._id,
//         name: patient.name,
//         universityId: patient.universityId,
//       },
//       records,
//     });
//   } catch (error) {
//     console.error("Get Patient History Error:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };

export const getPatientHistory = async (req, res) => {
  try {
    const { uniqueId } = req.params;

    const db = await getDB();
    const usersCollection = db.collection("users");
    const medicalCollection = db.collection("medical_records");

    const patient = await usersCollection.findOne({
      _id: new ObjectId(uniqueId),
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const records = await medicalCollection.aggregate([
      {
        $match: {
          studentId: new ObjectId(uniqueId),
        },
      },

      { $unwind: "$medicines" },

      {
        $lookup: {
          from: "medicines",
          let: { medId: "$medicines.medicineId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$_id", { $toObjectId: "$$medId" }],
                },
              },
            },
          ],
          as: "medicineInfo",
        },
      },

      {
        $unwind: {
          path: "$medicineInfo",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $addFields: {
          "medicines.name": "$medicineInfo.name",
        },
      },

      {
        $group: {
          _id: "$_id",
          studentId: { $first: "$studentId" },
          diagnosis: { $first: "$diagnosis" },
          notes: { $first: "$notes" },
          createdAt: { $first: "$createdAt" },
          medicines: { $push: "$medicines" },
        },
      },

      { $sort: { createdAt: -1 } },
    ]).toArray();

    res.json({
      success: true,
      patient,
      records,
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getTodayPatients = async (req, res) => {
  try {
    const db = await getDB();
    const appointments = db.collection("appointments");
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const patients = await appointments.aggregate([
      {
        $match: {
          doctorId: new ObjectId(req.user._id), // ObjectId হিসেবে match
          date: todayStr
        }
      },
      {
        $lookup: {
          from: "users",
          let: { studentId: "$studentId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$studentId"] } // ObjectId same type
              }
            },
            { $project: { name: 1, email: 1, universityId: 1, department: 1, session: 1 } }
          ],
          as: "studentInfo"
        }
      },
      { $unwind: "$studentInfo" },
      {
        $project: {
          _id: "$studentInfo._id",
          name: "$studentInfo.name",
          email: "$studentInfo.email",
          universityId: "$studentInfo.universityId",
          department: "$studentInfo.department",
          session: "$studentInfo.session"
        }
      }
    ]).toArray();

    res.json({ patients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


export const addMedicinesToRecord = async (req, res) => {
  try {
    const { recordId, medicines } = req.body; // medicines = [{name, quantity}]

    const db = await getDB();
    const medicalCollection = db.collection("medical_records");

    const result = await medicalCollection.updateOne(
      { _id: new ObjectId(recordId) },
      { $push: { medicines: { $each: medicines } } }
    );

    if (result.modifiedCount === 1) {
      res.json({ success: true, message: "Medicines added" });
    } else {
      res.status(404).json({ success: false, message: "Record not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
export const getMedicalRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const db = await getDB();
    const record = await db.collection("medical_records").findOne({ _id: new ObjectId(recordId) });

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    res.json({ success: true, record });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPatientRecord = async (req, res) => {
  try {
    const { studentId } = req.params;
    const db = await getDB();
    const recordCollection = db.collection("reports");

    // Assuming 1 latest record per student for simplicity
    const record = await recordCollection.findOne(
      { studentId: new ObjectId(studentId) },
      { sort: { createdAt: -1 } }
    );

    if (!record) return res.status(404).json({ success: false, message: "No record found" });

    res.json({ success: true, record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
// export const getReportsByRecord = async (req, res) => {

//   try {
//     const db = await getDB();
//     const { recordId } = req.params;

//     const reports = await db.collection("reports").find({
//       recordId: new ObjectId(recordId)
//     }).toArray();

//     res.json({
//       success: true,
//       reports
//     });

//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

export const getReportsByRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const db = await getDB();
    const reportsCollection = db.collection("reports");

    const reports = await reportsCollection
      .find({ recordId: new ObjectId(recordId) })
      .project({ _id: 1, fileUrl: 1, createdAt: 1 })
      .toArray();

    res.json({ success: true, reports });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMedicines = async (req, res) => {
  try {
    const db = await getDB();
    const medicinesCollection = db.collection("medicines");

    const medicines = await medicinesCollection
      .find({})
      .project({ _id: 1, name: 1, genericName: 1, type: 1 })
      .toArray();

    res.json({
      success: true,
      medicines,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

export const getDispenseRecordsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const db = await getDB();
    const records = await db.collection("dispenseRecords")
      .find({ "patient.id": studentId })
      .toArray();

    res.json({ success: true, records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};