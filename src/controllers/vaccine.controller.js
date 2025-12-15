import { ObjectId } from "mongodb";
import QRCode from "qrcode";
import pdf from "html-pdf-node";
import { getDB } from "../config/db.js";

// Admin updates vaccine status by uniId
export const updateVaccine = async (req, res) => {
  try {
    const { universityId, dose1, dose2 } = req.body;

    if (!universityId)
      return res.status(400).json({ message: "University ID required" });

    const db = await getDB();
    const users = db.collection("users");
    const certs = db.collection("certificates");

    const student = await users.findOne({ universityId });

    if (!student)
      return res.status(404).json({ message: "Student not found" });

    // Update vaccine
    const updated = {
      dose1: dose1 ?? student.dose1,
      dose2: dose2 ?? student.dose2,
      isFullyVaccinated: dose1 && dose2 ? true : false,
      dose1Date: dose1 ? new Date().toISOString().slice(0, 10) : student.dose1Date,
      dose2Date: dose2 ? new Date().toISOString().slice(0, 10) : student.dose2Date,
      vaccineName: "Covid-19 Vaccine",
    };

    await users.updateOne(
      { universityId },
      { $set: updated }
    );

    // If fully vaccinated → generate certificate
    if (updated.isFullyVaccinated) {
      const qrText = `Student: ${student.name} | ID: ${universityId}`;
      const qrCode = await QRCode.toDataURL(qrText);

      const cert = {
        studentId: student._id,
        name: student.name,
        universityId,
        vaccineName: "Covid-19 Vaccine",
        dose1Date: updated.dose1Date,
        dose2Date: updated.dose2Date,
        generatedAt: new Date(),
        qrCode,
      };

      await certs.insertOne(cert);
    }

    res.json({ message: "Vaccine updated", updated });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Update failed" });
  }
};

// Student gets own vaccine status (authenticated)
export const getMyVaccineStatus = async (req, res) => {
  try {
    const db = await getDB();
    const users = db.collection("users");

    const stud = await users.findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { name: 1, uniId: 1, dose1: 1, dose2: 1, isFullyVaccinated: 1 } }
    );
    if (!stud) return res.status(404).json({ message: "Not found" });
    res.json(stud);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed" });
  }
};

// Generate certificate record (student triggers or admin triggers)
export const generateVaccineCertificate = async (req, res) => {
  try {
    const { vaccineName, dose1Date, dose2Date } = req.body;
    const db = await getDB();
    const certs = db.collection("certificates");
    const users = db.collection("users");

    const studentId = req.user._id;
    const student = await users.findOne({ _id: new ObjectId(studentId) });
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!(student.isFullyVaccinated)) {
      return res.status(400).json({ message: "Student not fully vaccinated" });
    }

    const qrText = `MBSTU|${student.name}|${student.uniId}|${new Date().toISOString()}`;
    const qrCode = await QRCode.toDataURL(qrText);

    const newCert = {
      studentId: new ObjectId(studentId),
      name: student.name,
      uniId: student.uniId,
      vaccineName: vaccineName || "COVID-19 Vaccine",
      dose1Date: dose1Date || null,
      dose2Date: dose2Date || null,
      generatedAt: new Date(),
      qrCode,
    };

    const r = await certs.insertOne(newCert);

    res.status(201).json({ message: "Certificate created", certId: r.insertedId, certificate: newCert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create certificate" });
  }
};

// Get my certificate (student)
export const getMyCertificate = async (req, res) => {
   try {
    const db = await getDB();
    const certs = db.collection("certificates");

    const studentId = new ObjectId(req.user._id);
    console.log("my certificate",studentId)

    const cert = await certs.findOne({ studentId });

    if (!cert)
      return res.status(404).json({ message: "No certificate found" });

    res.json(cert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Download PDF by certId (authenticated)
// export const downloadPDF = async (req, res) => {
//  try {
//     const { certId } = req.params;

//     const db = await getDB();
//     const cert = await db.collection("certificates").findOne({
//       _id: new ObjectId(certId),
//     });

//     if (!cert)
//       return res.status(404).json({ message: "Certificate not found" });

//     const html = `
//       <html>
//         <body style="font-family: sans-serif; padding: 20px;">
//           <h1>MBSTU Covid-19 Vaccine Certificate</h1>
//           <p><strong>Name:</strong> ${cert.name}</p>
//           <p><strong>University ID:</strong> ${cert.universityId}</p>
//           <p><strong>Vaccine:</strong> ${cert.vaccineName}</p>
//           <p><strong>Dose 1:</strong> ${cert.dose1Date}</p>
//           <p><strong>Dose 2:</strong> ${cert.dose2Date}</p>
//           <img src="${cert.qrCode}" width="150" />
//         </body>
//       </html>
//     `;

//     const file = { content: html };
//     const pdfBuffer = await pdf.generatePdf(file, { format: "A4" });

//     res.set({
//       "Content-Type": "application/pdf",
//       "Content-Disposition": `attachment; filename=vaccine-${cert.universityId}.pdf`,
//     });

//     res.send(pdfBuffer);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
export const downloadPDF = async (req, res) => {
  try {
    const { certId } = req.params;

    const db = await getDB();
    const cert = await db.collection("certificates").findOne({
      _id: new ObjectId(certId),
    });

    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Fix: If uniId exists but universityId does not
    const universityId = cert.universityId 

    // QR fix
    if (!cert.qrCode) {
      return res.status(400).json({ message: "QR code missing in certificate" });
    }

    const qrBase64 = cert.qrCode.startsWith("data:")
      ? cert.qrCode
      : `data:image/png;base64,${cert.qrCode}`;

    const html = `
      <html>
      <meta charset="UTF-8" />
      <body style="font-family: Arial; padding: 20px;">
        <h1 style="text-align:center;">MBSTU Covid-19 Vaccine Certificate</h1>

        <p><strong>Name:</strong> ${cert.name}</p>
        <p><strong>University ID:</strong> ${universityId}</p>
        <p><strong>Vaccine:</strong> ${cert.vaccineName}</p>
        <p><strong>Dose 1:</strong> ${cert.dose1Date}</p>
        <p><strong>Dose 2:</strong> ${cert.dose2Date}</p>

        <div style="margin-top:20px;">
          <img src="${qrBase64}" width="180" />
        </div>
      </body>
      </html>
    `;

    const pdfBuffer = await pdf.generatePdf({ content: html }, { format: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="vaccine-${universityId}.pdf"`
    );

    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

