import express from 'express';
import mysql from 'mysql';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import session from 'express-session';

const salt = 10;
const app = express();
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:3000"],
    methods: ["POST", "GET"],
    credentials: true
}));
app.use(cookieParser());
app.use(session({
    secret: 'secret', // Use a strong secret in a real application, ideally stored in environment variables
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: 'signup'
});

// For signup
app.post('/register', (req, res) => {
    const sql = "INSERT INTO login (`name`,`email`,`password`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
        if (err) return res.json({ Error: "Error hashing password" });
        const values = [req.body.name, req.body.email, hash];
        db.query(sql, [values], (err, result) => {
            if (err) return res.json({ Error: "Error inserting data" });
            return res.json({ Status: "Success" });
        });
    });
});

// For login
app.post('/login', (req, res) => {
    const sql = 'SELECT * FROM login WHERE email = ?';
    db.query(sql, [req.body.email], (err, data) => {
        if (err) return res.json({ Error: "Server login error" });
        if (data.length > 0) {
            bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
                if (err) return res.json({ Error: "Password comparison error" });
                if (response) {
                    const name = data[0].name;
                    const token = jwt.sign({ name }, "jwt-secret-key", { expiresIn: '1d' });
                    req.session.token = token;
                    req.session.name = name;
                    res.cookie('token', token);
                    return res.json({ Status: "Success" });
                } else {
                    return res.json({ Error: "Password mismatch" });
                }
            });
        } else {
            return res.json({ Error: "Email not found" });
        }
    });
});

const verifyUser = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.json({ Error: "Not authenticated" });
    } else {
        jwt.verify(token, "jwt-secret-key", (err, decoded) => {
            if (err) {
                return res.json({ Error: "Invalid token" });
            } else {
                req.name = decoded.name;
                next();
            }
        });
    }
};

app.get('/', verifyUser, (req, res) => {
    return res.json({ Status: "Success", name: req.name });
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    req.session.destroy();
    return res.json({ Status: "Success" });
});

app.listen(8081, () => {
    console.log("Server running on port 8081");
});
