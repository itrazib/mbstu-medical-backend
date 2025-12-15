import { getDB } from "../config/db.js";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

export const adminCreateUser = async (req, res) => {
  try {
    const db = await getDB();
    const users = db.collection("users");
    const doctors = db.collection("doctors");

    const { name, email, password, role, uniId, department, specialization } =
      req.body;

    if (!["doctor", "staff"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const exists = await users.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      name,
      email,
      password: hashedPassword,
      role,
      department,
      specialization,
      isApproved: true,
      uniId,
      createdAt: new Date(),
    };

    const result = await users.insertOne(newUser);

    // if doctor → also create doctor profile
    if (role === "doctor") {
      await doctors.insertOne({
        userId: result.insertedId,
        name,
        department,
        specialization,
        updatedAt: new Date(),
      });
    }

    res.json({ message: "User created successfully", user: newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
