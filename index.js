const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();

let filePath = path.join(__dirname, 'data', 'cleanedAttendees.json');
let data = fs.readFileSync(filePath, 'utf8');
let attendees = JSON.parse(data);

let html = fs.readFileSync(path.join(__dirname, 'data', 'message.html'), 'utf8');

// send an email to each attendee with their QR code
let sendMessage = (transporter, attendee, qr) => {
    html.replace('%name%', attendee.name);
    let message = {
        from: "jalandharfoss@gmail.com",
        to: attendee.email,
        subject: "Ticket for FOSS Jalandhar August Meetup",
        html: html,
        plain: "Here is your ticket for the FOSS Jalandhar August Meetup",
        attachments: [{
            filename: qr,
        }]
      };
    transporter.sendMail(message, function(err, info) {
        if (err) {
            console.error(`Error sending email to ${attendee.email}: ${err}`);
        } else {
            console.log(`Email sent to ${attendee.email}: ${info.response}`);
        }
    });
};

let _syncProgress = (progressFile, sentMails) => {
    let alreadySentMails = fs.readFileSync(progressFile, 'utf8');
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

let alreadySentMails = fs.readFileSync(path.join(__dirname, 'data', 'sentMails.json'), 'utf8');
alreadySentMails = JSON.parse(alreadySentMails);

try {
    attendees.forEach((attendee) => {
        if (alreadySentMails.includes(attendee.id)) {
            return;
        }
        let qr_path = path.join(__dirname, 'data', 'qr', `${attendee.id}.png`);
        sendMessage(transporter, attendee, qr_path);
        sentMails.push(attendee.id);
    });
} catch (err) {
    _syncProgress(path.join(__dirname, 'data', 'sentMails.json'), sentMails);
    console.error(`Error sending email: ${err}`);
} finally {
    _syncProgress(path.join(__dirname, 'data', 'sentMails.json'), sentMails);
}