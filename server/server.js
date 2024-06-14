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
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60
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
    const sql = "INSERT INTO user (`username`, `password`, `email`, `createdTime`) VALUES (?)";
    bcrypt.hash(req.body.password.toString(), salt, (err, hash) => {
        if (err) return res.json({ Error: "Error hashing password" });
        const values = [req.body.name, hash, req.body.email, new Date()];
        db.query(sql, [values], (err, result) => {
            if (err) return res.json({ Error: "Error inserting data" });
            return res.json({ Status: "Success" });
        });
    });
});

// For login
app.post('/login', (req, res) => {
    const sql = 'SELECT * FROM user WHERE email = ?';
    db.query(sql, [req.body.email], (err, data) => {
        if (err) return res.json({ Error: "Server login error" });
        if (data.length > 0) {
            bcrypt.compare(req.body.password.toString(), data[0].password, (err, response) => {
                if (err) return res.json({ Error: "Password comparison error" });
                if (response) {
                    const username = data[0].username;
                    const token = jwt.sign({ username }, "jwt-secret-key", { expiresIn: '1d' });
                    req.session.token = token;
                    req.session.username = username;
                    res.cookie('token', token, { httpOnly: true });

                    const roleSql = `
                        SELECT role.name AS role, module.name AS module
                        FROM role 
                        INNER JOIN userrole ON role.id = userrole.role_id
                        INNER JOIN privilege ON role.id = privilege.role_id
                        INNER JOIN module ON privilege.module_id = module.id
                        WHERE userrole.user_id = ?`;
                    db.query(roleSql, [data[0].id], (err, roleData) => {
                        if (err) {
                            console.error('SQL Error:', err);
                            return res.json({ Error: "Role fetching error" });
                        }
                        if (roleData.length > 0) {
                            return res.json({
                                Status: "Success",
                                username: username,
                                role: roleData[0].role,
                                privileges: roleData.map(item => item.module)
                            });
                        } else {
                            return res.json({ Status: "Success", username: username, role: null, privileges: [] });
                        }
                    });
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
                console.error('Token verification error:', err);
                return res.json({ Error: "Invalid token" });
            } else {
                req.username = decoded.username;
                next();
            }
        });
    }
};

app.get('/', verifyUser, (req, res) => {
    const sql = `
        SELECT role.name AS role, module.name AS module
        FROM user
        INNER JOIN userrole ON user.id = userrole.user_id
        INNER JOIN role ON userrole.role_id = role.id
        INNER JOIN privilege ON role.id = privilege.role_id
        INNER JOIN module ON privilege.module_id = module.id
        WHERE user.username = ?`;
    db.query(sql, [req.username], (err, roleData) => {
        if (err) {
            console.error('SQL Error:', err);
            return res.json({ Error: "Role fetching error" });
        }
        if (roleData.length > 0) {
            return res.json({
                Status: "Success",
                username: req.username,
                role: roleData[0].role,
                privileges: roleData.map(item => item.module)
            });
        } else {
            return res.json({ Status: "Success", username: req.username, role: null, privileges: [] });
        }
    });
});

app.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.clearCookie('connect.sid');
    req.session.destroy(err => {
        if (err) {
            return res.json({ Error: "Error in logout" });
        }
        return res.json({ Status: "Success" });
    });
});


app.listen(8081, () => {
    console.log("Server running on port 8081");
});
