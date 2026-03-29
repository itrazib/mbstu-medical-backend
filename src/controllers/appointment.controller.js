import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

export const bookAppointment = async (req, res) => {
  try {
    const db = await getDB();
    const appointments = db.collection("appointments");

    const { doctorId, date, time, patientName, problem } = req.body;
    console.log(req.body)
    const studentId = req.user._id;
    console.log("booking doctor id", doctorId);

    const newAppointment = {
      studentId: new ObjectId(studentId),
      doctorId: new ObjectId(doctorId),
      patientName,
      date,
      problem,
      time,
      status: "pending",
      createdAt: new Date(),
    };

    await appointments.insertOne(newAppointment);

    res.json({
      message: "Appointment request sent successfully",
      appointment: newAppointment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// student apointment
export const getMyAppointments =  async (req, res) => {
  try {
    const db = await getDB();
    const appointmentsCollection = db.collection("appointments");
    const studentsCollection = db.collection("users"); // student info
    const doctorsCollection = db.collection("users"); // doctor info

    const studentId = req.user._id; // from auth middleware

    // aggregation to join student and doctor info
    const appointments = await appointmentsCollection.aggregate([
      { $match: { studentId: new ObjectId(studentId) } },
      // join doctor info
      {
        $lookup: {
          from: "users",
          localField: "doctorId",
          foreignField: "_id",
          as: "doctor"
        }
      },
      { $unwind: { path: "$doctor", preserveNullAndEmptyArrays: true } },
      // join student info
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student"
        }
      },
      { $unwind: { path: "$student", preserveNullAndEmptyArrays: true } },
      // project only required fields
      {
        $project: {
          _id: 1,
          date: 1,
          time: 1,
          problem: 1,
          status: 1,
          doctorName: "$doctor.name",
          department: "$student.department",
          studentName: "$student.name"
        }
      },
      { $sort: { date: -1, time: 1 } } // latest first
    ]).toArray();

    res.json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


// doctor apointment
export const doctorAppointments = async (req, res) => {
  try {
    const db = await getDB();
    const appointments = db.collection("appointments");
      
    console.log("sdfjkshdfsjkf",req.user)
    const doctorId = req.user._id;
   

    console.log("DoctorId from token:", doctorId);
    console.log(
      "All doctorIds in DB:",
      (await appointments.find().toArray()).map((a) => a.doctorId)
    );

    const result = await appointments
      .find({doctorId: new ObjectId(doctorId)})
      .sort({ createdAt: -1 })
      .toArray();

    console.log("Appointments found:", result.length);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
//  doctor update apoinement
export const updateAppointmentStatus = async (req, res) => {
  try {
    const db = await getDB();
    const appointments = db.collection("appointments");

    const { appointmentId, status } = req.body;
    const allowed = ["approved", "rejected", "completed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await appointments.updateOne(
      { _id: new ObjectId(appointmentId) },
      { $set: { status } }
    );

    res.json({ message: "Status updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
