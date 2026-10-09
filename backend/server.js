const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Render-এর দেওয়া PORT ধরবে, লোকাল মেশিনে চললে 5000 ব্যবহার করবে
const PORT = process.env.PORT || 5000;


// =========================
// MySQL Connection
// =========================

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    ssl: {
        // Aiven Cloud ডেটাবেসে SSL হ্যান্ডেল করার জন্য এটি প্রয়োজন
        rejectUnauthorized: false
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// =========================
// Test MySQL Connection
// =========================

app.get("/api/db-test", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT 1 AS result"
        );

        res.json({
            message: "MySQL connected successfully!",
            result: rows[0]
        });

    } catch (error) {
        console.error("DB Test Error:", error);

        res.status(500).json({
            message: "MySQL connection failed!",
            error: error.message
        });
    }
});


// =========================
// Register User
// =========================

app.post("/api/register", async (req, res) => {
    try {
        const {
            name,
            email,
            password
        } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required!"
            });
        }

        const [existingUser] = await db.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                message: "Email already exists!"
            });
        }

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        const [result] = await db.query(
            `INSERT INTO users 
            (name, email, password) 
            VALUES (?, ?, ?)`,
            [
                name,
                email,
                hashedPassword
            ]
        );

        res.json({
            message: "User registered successfully!",
            user_id: result.insertId
        });

    } catch (error) {
        console.error("Register Error:", error);

        res.status(500).json({
            message: "Registration failed!",
            error: error.message
        });
    }
});


// =========================
// Login User
// =========================

app.post("/api/login", async (req, res) => {
    try {
        const {
            email,
            password
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required!"
            });
        }

        const [rows] = await db.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password!"
            });
        }

        const user = rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password!"
            });
        }

        res.json({
            message: "Login successful!",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login Error:", error);

        res.status(500).json({
            message: "Login failed!",
            error: error.message
        });
    }
});


// =========================
// Get User's Tasks
// =========================

app.get("/api/tasks", async (req, res) => {
    try {
        const {
            user_id
        } = req.query;

        if (!user_id) {
            return res.status(400).json({
                message: "User ID is required!"
            });
        }

        const [rows] = await db.query(
            `SELECT * 
             FROM tasks 
             WHERE user_id = ? 
             ORDER BY id DESC`,
            [user_id]
        );

        res.json(rows);

    } catch (error) {
        console.error("Fetch Tasks Error:", error);

        res.status(500).json({
            message: "Failed to fetch tasks!",
            error: error.message
        });
    }
});


// =========================
// Create Task
// =========================

app.post("/api/tasks", async (req, res) => {
    try {
        const {
            user_id,
            title,
            description,
            priority,
            deadline
        } = req.body;

        if (!user_id || !title) {
            return res.status(400).json({
                message: "User ID and title are required!"
            });
        }

        const [result] = await db.query(
            `INSERT INTO tasks 
            (user_id, title, description, priority, deadline) 
            VALUES (?, ?, ?, ?, ?)`,
            [
                user_id,
                title,
                description || "",
                priority || "medium",
                deadline || null
            ]
        );

        res.json({
            message: "Task created successfully!",
            task_id: result.insertId
        });

    } catch (error) {
        console.error("Create Task Error:", error);

        res.status(500).json({
            message: "Failed to create task!",
            error: error.message
        });
    }
});


// =========================
// Update Task
// =========================

app.put("/api/tasks/:id", async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const {
            title,
            description,
            status,
            priority,
            deadline
        } = req.body;

        const [result] = await db.query(
            `UPDATE tasks 
             SET title = ?, 
                 description = ?, 
                 status = ?, 
                 priority = ?, 
                 deadline = ? 
             WHERE id = ?`,
            [
                title,
                description,
                status,
                priority || "medium",
                deadline || null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Task not found!"
            });
        }

        res.json({
            message: "Task updated successfully!"
        });

    } catch (error) {
        console.error("Update Task Error:", error);

        res.status(500).json({
            message: "Failed to update task!",
            error: error.message
        });
    }
});


// =========================
// Delete Task
// =========================

app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const {
            id
        } = req.params;

        const [result] = await db.query(
            "DELETE FROM tasks WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Task not found!"
            });
        }

        res.json({
            message: "Task deleted successfully!"
        });

    } catch (error) {
        console.error("Delete Task Error:", error);

        res.status(500).json({
            message: "Failed to delete task!",
            error: error.message
        });
    }
});


// =========================
// Home Route
// =========================

app.get("/", (req, res) => {
    res.send(
        "TaskFlow Backend is running!"
    );
});


// =========================
// Message Route
// =========================

app.get("/api/message", (req, res) => {
    res.json({
        message:
            "Hello from TaskFlow Backend!"
    });
});


// =========================
// Start Server
// =========================


app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
});