import { getDB } from "../config/db.js"; // তোমার DB connection

// POST /api/tests/add
export const addPathologyTest = async (req, res) => {
  try {
    const db = await getDB();
    const testsCol = db.collection("tests");

    const { name, code, description, availableInMedicalCenter, price } = req.body;

    // validation
    if (!name) {
      return res.status(400).json({ message: "Test name is required" });
    }

    // check duplicate
    const exists = await testsCol.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ message: "Test already exists" });
    }

    const newTest = {
      name: name.trim(),
      code: code?.trim() || "",
      description: description || "",
      availableInMedicalCenter: availableInMedicalCenter === true,
      price: price >= 0 ? price : 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await testsCol.insertOne(newTest);

    res.status(201).json({ message: "Test added successfully", testId: result.insertedId });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};



// parseMonth helper
function parseMonth(str) {
  const [year, mon] = str.split("-").map((n) => parseInt(n, 10));
  return new Date(year, mon - 1, 1);
}

// GET /api/pathology-tests?month=YYYY-MM
export const getPathologyTests = async (req, res) => {
  try {
    const db = await getDB();
    const testsCol = db.collection("tests");

    const { month } = req.query;

    const query = {}; // ✅ FIX: remove wrong filter

    if (month) {
      const start = parseMonth(month);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      query.createdAt = { $gte: start, $lt: end };
    }

    const tests = await testsCol.find(query).toArray();

    res.json({
      month: month || null,
      total: tests.length,
      tests,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};