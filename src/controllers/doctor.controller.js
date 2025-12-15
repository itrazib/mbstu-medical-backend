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
      image
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
        { $set: profileData }
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

