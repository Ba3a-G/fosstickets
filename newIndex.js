const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
require("dotenv").config();

let filePath = path.join(__dirname, "data", "cleanedAttendees.json");
let data = fs.readFileSync(filePath, "utf8");
let attendees = JSON.parse(data);

// Function to generate a QR code for each attendee
let generateQRCodeForAttendees = async (attendees) => {
    let creationLog = [];
    let n = 0;

  for (const attendee of attendees) {
    try {
        const qrPath = path.join(__dirname, "data", "qr", `${attendee.id}.png`);
        n++;

      // Check if the QR code file already exists
      if (fs.existsSync(qrPath)) {
        creationLog.push({ id: attendee.id, status: "exists", path: qrPath });
        console.log(
          `QR code already exists for ${attendee.name} (${attendee.id}) ${n}`
        );
        continue;
      }

      const qrData = JSON.stringify({
        name: attendee.name,
        email: attendee.email,
      });

      // Generate QR code and save as PNG file
      await QRCode.toFile(qrPath, qrData, {
        color: {
          dark: "#000", // QR code dark color
          light: "#FFF", // QR code light color
        },
      });

      // Log the creation status
      creationLog.push({ id: attendee.id, status: "created", path: qrPath });
      console.log(`QR code generated for ${attendee.name} (${attendee.id})`);
    } catch (err) {
      // Log the error status
      creationLog.push({
        id: attendee.id,
        status: "error",
        error: err.message,
      });
      console.error(
        `Failed to generate QR code for ${attendee.name} (${attendee.id}): ${err.message}`
      );
    }
  }

  // Write the log to a file
  const logFilePath = path.join(__dirname, "data", "qr_creation_log.json");
  fs.writeFileSync(logFilePath, JSON.stringify(creationLog, null, 2));
  console.log(`QR code creation log written to ${logFilePath}`);
};

// Generate QR codes for all attendees
generateQRCodeForAttendees(attendees);
