
const express = require('express');
const mysql = require('mysql');
const xlsx = require('xlsx');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');
const moment = require('moment-timezone');

const app = express();
const port = 1009;

// MySQL connection setup
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'with courses'
});

connection.connect(err => {
    if (err) throw err;
    console.log('Connected to MySQL');
});

app.use(bodyParser.json());
app.use(cors());

// Multer setup for file upload
const upload = multer({ dest: 'uploads/' });

const excelDateToJSDate = (serial) => {
    const utcDays = serial - 25569;
    const date = new Date(utcDays * 86400 * 1000);
    const dateNoTimezone = new Date(date.getTime() + date.getTimezoneOffset() * 60 * 1000);
    return dateNoTimezone;
};

const insertDataFromExcel = (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const sheetNameList = workbook.SheetNames;
    const sheet1 = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);

    sheet1.forEach(row => {
        const First_Name = row['First Name'] ? row['First Name'].trim() : '';
        const Middle_Name = row['Middle Name'] ? row['Middle Name'].trim() : '';
        const Surname = row['Surname'] ? row['Surname'].trim() : '';
        const Email = row['Email'] ? row['Email'].trim() : '';
        const Gender = row['Gender'] ? row['Gender'].trim() : '';
        const Date_of_Birth = row['Date of Birth'] ? row['Date of Birth'] : '';
        const Registration_Date = row['Register Date'] ? row['Register Date'] : '';
        const Training_Start_Date = row['Training Start Date'] ? row['Training Start Date'] : '';
        const Training_Completion_Date = row['Training Completion Date'] ? row['Training Completion Date'] : '';
        const course_progress = row['course_progress'] ? row['course_progress'] : 0;
        const ARRAY_CUT = row['ARRAY CUT'] ? row['ARRAY CUT'] : 0;
        const current_lession = row['current_lession'] ? row['current_lession'] : 0;

        console.log(row);

        const specialChars = ['#', '@', '$', '&'];

        const generatePassword = (First_Name, Surname, dob) => {
            const randomSpecialChar = specialChars[Math.floor(Math.random() * specialChars.length)];
            const randomIndex = Math.floor(Math.random() * 100);
            const lastNameSubstr = Surname ? Surname.slice(0, 3) : (First_Name ? First_Name.slice(0, 3) : '');

            const date = new Date(dob);
            const day = date.getDate();

            const password = `${lastNameSubstr}${First_Name ? First_Name.length : 0}${Surname ? Surname.length : 0}${day}${randomSpecialChar}${randomIndex}`;
            return password;
        };

        let dobFormatted;

        if (typeof Date_of_Birth === 'number') {
            dobFormatted = excelDateToJSDate(Date_of_Birth);
        } else if (typeof Date_of_Birth === 'string') {
            const parsedDate = moment(Date_of_Birth, 'MMMM DD YYYY');
            dobFormatted = parsedDate.isValid() ? parsedDate.toDate() : null;
        } else {
            dobFormatted = null;
        }

        const regDateFormatted = excelDateToJSDate(Registration_Date);
        const trStartDateFormatted = excelDateToJSDate(Training_Start_Date);
        const trComDateFormatted = excelDateToJSDate(Training_Completion_Date);

        const password = generatePassword(First_Name, Surname, dobFormatted);

        const Dob = moment.tz(dobFormatted, 'MM-DD-YYYY', 'America/Toronto').unix();
        const RegiDate = moment.tz(regDateFormatted, 'MM-DD-YYYY', 'America/Toronto').unix();
        const TrStDate = moment.tz(trStartDateFormatted, 'MM-DD-YYYY', 'America/Toronto').unix();
        const TrComDate = moment.tz(trComDateFormatted, 'MM-DD-YYYY', 'America/Toronto').unix();

        const query1 = 'INSERT INTO users (first_name, middle_name, last_name, gender, email, dob, password, role_id, date_added, status, is_instructor) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        connection.query(query1, [First_Name, Middle_Name, Surname, Gender, Email, Dob, password, 2, RegiDate, 1, 0], (err, result) => {
            if (err) throw err;

            const studentId = result.insertId;

            const comp_less = ["8", "9", "48", "10", "11", "12", "13", "49", "14", "15", "16", "17", "18", "19", "50", "20", "21", "22", "23", "24", "51", "25", "52", "26", "27", "28", "29", "30", "31", "53", "32", "33", "34", "35", "54", "36", "37", "38", "39", "40", "41", "55", "42", "43", "44", "56", "45", "57", "46", "58", "47", "59", "60"];
            const completed_lesson = ARRAY_CUT && ARRAY_CUT > 0 ? JSON.stringify(comp_less.slice(0, ARRAY_CUT)) : "[]";

            const tcd = TrComDate || "";
            const tsd = TrStDate || "";

            const query2 = 'INSERT INTO watch_histories (course_id, student_id, completed_lesson, course_progress, watching_lesson_id, completed_date, date_added, date_updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            connection.query(query2, [2, studentId, completed_lesson, course_progress, current_lession, tcd, tsd, tcd], (err, result) => {
                if (err) throw err;
            });

            const query3 = 'INSERT INTO payment (user_id, payment_type, course_id, amount, date_added, admin_revenue, instructor_revenue, tax, instructor_payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            connection.query(query3, [studentId, "stripe", 2, 49, tsd, 49, 0, 0, 1], (err, result) => {
                if (err) throw err;
            });

            const query4 = 'INSERT INTO enrol (user_id, course_id, date_added) VALUES (?, ?, ?)';
            connection.query(query4, [studentId, 2, tsd], (err, result) => {
                if (err) throw err;
            });
        });
    });

    console.log('Data insertion process completed');
};

// Endpoint to handle file upload and data insertion
app.post('/upload', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    insertDataFromExcel(filePath);

    fs.unlink(filePath, (err) => {
        if (err) throw err;
        console.log('File deleted');
    });

    res.send('File uploaded and data inserted');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

