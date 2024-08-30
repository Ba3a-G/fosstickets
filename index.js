const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Sleep function to introduce delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let filePath = path.join(__dirname, "data", "cleanedAttendees.json");
let data = fs.readFileSync(filePath, "utf8");
let attendees = JSON.parse(data);

const failedEmails = [];

let htmlTemplate = fs.readFileSync(
  path.join(__dirname, "data", "message.html"),
  "utf8"
);

let sendMessage = async (transporter, attendee, qr, isResend = false) => {
  console.log(qr);
  let html = htmlTemplate
    .replace("%name%", attendee.name)
    .replace(
      "%image%",
      `https://raw.githubusercontent.com/surajjbhardwaj/fosstickets/main/data/qr/${qr}`
    );

  let subject = isResend
    ? "[R] Congratulations 🥳 ! Your RSVP for FOSS Jalandhar August Meetup is Approved"
    : "Congratulations 🥳 ! Your RSVP for FOSS Jalandhar August Meetup is Approved";

  let message = {
    from: process.env.SMTP_EMAIL,
    to: attendee.email,
    subject: subject,
    html: html,
    plain: "Here is your ticket for the FOSS Jalandhar August Meetup",
  };

  try {
    let info = await transporter.sendMail(message);
    console.log(`Email sent to ${attendee.email}: ${info.response}`);
  } catch (err) {
    console.error(`Error sending email to ${attendee.email}: ${err}`);
    failedEmails.push(attendee);
  }
};

let _syncProgress = (progressFile, sentMails) => {
  let alreadySentMails = fs.readFileSync(progressFile, "utf8");
  alreadySentMails = JSON.parse(alreadySentMails);
  sentMails = sentMails.concat(alreadySentMails);
  fs.writeFileSync(progressFile, JSON.stringify(sentMails));
};

let transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

let alreadySentMails = fs.readFileSync(
  path.join(__dirname, "data", "sentMails.json"),
  "utf8"
);
alreadySentMails = JSON.parse(alreadySentMails);
let sentMails = [];

const sendEmails = async (attendees) => {
  for (const attendee of attendees) {
    let qr_path = `${attendee.id}.png`;

    if (alreadySentMails.includes(attendee.id)) {
      let isResend = alreadySentMails.includes(attendee.id);
      await sendMessage(transporter, attendee, qr_path, isResend);
    } else {
      await sendMessage(transporter, attendee, qr_path);
      sentMails.push(attendee.id);
    }

    // Introduce a 1-second delay between emails
    await sleep(1000);
  }

  _syncProgress(path.join(__dirname, "data", "sentMails.json"), sentMails);

  if (failedEmails.length > 0) {
    console.log("Retrying failed emails...");
    await sendEmails(failedEmails);
  }
};

try {
  sendEmails(attendees);
} catch (err) {
  console.error(`Error sending email: ${err}`);
} finally {
  _syncProgress(path.join(__dirname, "data", "sentMails.json"), sentMails);
}
