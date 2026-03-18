import { getDB } from "../config/db.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

export const adminCreateUser = async (req, res) => {
  try {
    const db = await getDB();

    const usersCol = db.collection("users");
    const doctorsCol = db.collection("doctors");
    const staffCol = db.collection("medicalUsers");

    const {
      name,
      email,
      password,
      role,
      designation,
      phone,
      office,
      bloodGroup,
      photoUrl,
    } = req.body;

    // 🔹 Basic validation
    if (!name || !password || !role) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    if (!["doctor", "staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // 🔹 Doctor must have email
    if (role === "doctor" && !email) {
      return res.status(400).json({ message: "Email is required for doctor" });
    }

    // 🔹 Check duplicate email ONLY if email exists
    if (email) {
      const exists = await usersCol.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // 🔹 Create base user
    const userData = {
      name,
      password: hashedPassword,
      role,
      isApproved: true,
      createdAt: new Date(),
    };

    // Only add email if exists (doctor ক্ষেত্রে থাকবে)
    if (email) {
      userData.email = email;
    }

    const userResult = await usersCol.insertOne(userData);
    const userId = userResult.insertedId;

    // 🔹 Doctor profile
    if (role === "doctor") {
      await doctorsCol.insertOne({
        userId: new ObjectId(userId),
        name,
        email, // doctor only
        phone: phone || "",
        designation: designation || "",
        bloodGroup: bloodGroup || "",
        photoUrl: photoUrl || "",
        createdAt: new Date(),
      });
    }

    // 🔹 Staff profile (NO email)
    if (role === "staff") {
      await staffCol.insertOne({
        userId: new ObjectId(userId),
        name,
        designation: designation || "",
        phone: phone || "",
        office: office || "",
        bloodGroup: bloodGroup || "",
        photoUrl: photoUrl || "",
        createdAt: new Date(),
      });
    }

    res.status(201).json({
      message: `${role} created successfully`,
      role,
      userId,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create user" });
  }
};

export const getAllDoctorsAdmin = async (req, res) => {
  try {
    const db = await getDB();
    const users = db.collection("users");

    const list = await users
      .find({ role: "doctor" })
      .project({ password: 0 })
      .toArray();

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteDoctor = async (req, res) => {
  try {
    const db = await getDB();
    const users = db.collection("users");
    const doctors = db.collection("doctors");

    const { id } = req.params;

    await users.deleteOne({ _id: new ObjectId(id) });
    await doctors.deleteOne({ userId: new ObjectId(id) });

    res.json({ message: "Doctor removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
