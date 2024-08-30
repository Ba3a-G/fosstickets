const fs = require('fs');
const path = require('path');
const qr = require('qr-image');

let filePath = path.join(__dirname, "..", "data", 'attendees.csv');

let data = fs.readFileSync(filePath, 'utf8');
data = data.split('\n').map(row => row.split(','));

let jsonData = [];
let dups = [];
for (let i = 1; i < data.length; i++) {
    if (dups.includes(data[i][3])) {
        continue;
    }
    dups.push(data[i][3]);
    let id = data[i][1];
    let name = data[i][2];
    let email = data[i][3];

    id = id.replace(/"/g, '');
    name = name.replace(/"/g, '');
    email = email.replace(/"/g, '');

    let obj = { "id": id, "name": name, "email": email };
    jsonData.push(obj);
}

let cleanedFilePath = path.join(__dirname, '..', 'data', 'cleanedAttendees.json');
console.log(`Writing cleaned data to ${cleanedFilePath}`);
try {
    fs.writeFileSync(cleanedFilePath, JSON.stringify(jsonData, null, 2));
} catch (err) {
    console.error(`Error writing file: ${err}`);
}

let qrDir = path.join(__dirname, '..', 'data', 'qr');
if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir);
}

jsonData.forEach(attendee => {
    // json in qr
    let qr_png = qr.imageSync(`{"email':"${attendee.email}","id":"${attendee.id}"}`, { type: 'png' });
    fs.writeFileSync(path.join(qrDir, `${attendee.id}.png`), qr_png);
});
