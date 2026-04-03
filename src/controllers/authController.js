import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

const signToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// ✅ Register
// export const register = async (req, res) => {
//   try {
//     const { name, email, password, universityId } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: "All fields required" });
//     }

//     const db = await getDB();

//     const existingUser = await db.collection("users").findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "Email already exists" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = {
//       name,
//       email,
//       password: hashedPassword,
//       universityId,
//       role: "pending",
//       isApproved: false,
//       createdAt: new Date(),
//     };

//     await db.collection("users").insertOne(newUser);

//     res
//       .status(201)
//       .json({ message: "Registered. Waiting for admin approval." });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Registration failed" });
//   }
// };
export const register = async (req, res) => {
  try {
    const { name, email, password, uniId, session, department, hall } = req.body;

    // 🧪 Validate
    if (!name || !email || !password || !uniId || !session || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const db = await getDB();

    // Check if email exists
    const existingUser = await db.collection("users").findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

     let imageUrl = "";

    if (req.file) {
      const uploadStream = () =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "mbstu" },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

      const result = await uploadStream();
      imageUrl = result.secure_url;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // User object
    const newUser = {
      name,
      email,
      password: hashedPassword,
      universityId: uniId,
      session,
      department,
      hall,
      image: imageUrl,
      role: "pending",
      dose1: false,
      dose2: false,
      isFullyVaccinated: false, // default role
      isApproved: false, // admin approval required
      createdAt: new Date(),
    };

    // Insert into DB
    await db.collection("users").insertOne(newUser);

    res.status(201).json({
      message: "Registered successfully. Waiting for admin approval.",
    });
  } catch (error) {
    // console.log(error);
    res.status(500).json({ message: "Registration failed" });
  }
};

// ✅ Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const db = await getDB();
    const user = await db.collection("users").findOne({ email });

    // console.log("From DB User:", user);
    // console.log("Entered Password:", password);
    // console.log("DB Hashed Password:", user?.password);

    if (!user) {
      // console.log("User not found");
      return res.status(401).json({ message: "User not found" });
    }

    const match = await bcrypt.compare(password, user.password);
    // console.log("Password match:", match);

    if (!match) {
      return res.status(401).json({ message: "Wrong password" });
    }

    // console.log("User Role:", user.role);
    // console.log("isApproved:", user.isApproved);

    if (user.role !== "admin" && user.isApproved !== true) {
      return res
        .status(403)
        .json({ message: "Admin has not approved your account yet" });
    }

    const token = signToken({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    });

    // console.log("LOGIN SUCCESS");
    // console.log(user);
    // console.log(user._id.toString());

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    // console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

// ✅ Current user
export const getMe = async (req, res) => {
  res.json(req.user);
};

// ✅ Admin get all users
export const getAllUsers = async (req, res) => {
  try {
    const db = await getDB();
    const users = await db.collection("users").find().toArray();

    const cleanUsers = users.map((u) => {
      delete u.password;
      return u;
    });

    res.json(cleanUsers);
  } catch {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};
// update user role

export const updateUserRole = async (req, res) => {
  try {
    const db = await getDB();
    const users = await db.collection("users");

    const { userId, role } = req.body;

    const allowed = ["admin", "doctor", "student", "staff"];
    if (!allowed.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          role: role,
          isApproved: true, // ✅ এখানে যোগ করা হলো
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ message: "User not found / Already updated" });
    }

    res.json({ message: "Role & approval updated successfully ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Pending user
export const getPendingUsers = async (req, res) => {
  try {
    const db = await getDB();

    // Fetch users whose role is "pending" AND not approved yet
    const users = await db
      .collection("users")
      .find({ role: "pending", isApproved: false })
      .toArray();

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ Admin approve & assign role
export const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const validRoles = ["Admin", "Doctor", "Student", "Staff"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const db = await getDB();

    await db
      .collection("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { role, isApproved: true } }
      );

    res.json({ message: "User approved successfully" });
  } catch {
    res.status(500).json({ message: "Failed to approve user" });
  }
};
