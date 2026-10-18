
require("dotenv").config();

const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing from .env");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
});

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  })
);

app.use(express.json({ limit: "10kb" }));

app.use(
  "/api/responses",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Create the table
async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invitation_responses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      section VARCHAR(1) NOT NULL
        CHECK (section IN ('A', 'B', 'C')),
      roll_number VARCHAR(30) NOT NULL,
      food_preference VARCHAR(10) NOT NULL
        CHECK (food_preference IN ('Veg', 'Non-Veg')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (section, roll_number)
    )
  `);

  console.log("Database table is ready");
}

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

// Save a student's response
app.post("/api/responses", async (req, res) => {
  const { name, section, rollNumber, foodPreference } = req.body || {};

  if (
    typeof name !== "string" ||
    typeof section !== "string" ||
    typeof rollNumber !== "string" ||
    typeof foodPreference !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide all required fields.",
    });
  }

  const cleanName = name.trim();
  const cleanSection = section.trim().toUpperCase();
  const cleanRoll = rollNumber.trim();
  const cleanFood = foodPreference.trim();

  if (
    cleanName.length < 2 ||
    cleanName.length > 100 ||
    !/^[A-Za-z\s.'-]+$/.test(cleanName)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid name.",
    });
  }

  if (!["A", "B", "C"].includes(cleanSection)) {
    return res.status(400).json({
      success: false,
      message: "Invalid section.",
    });
  }

  if (
    cleanRoll.length < 1 ||
    cleanRoll.length > 30 ||
    !/^[A-Za-z0-9/-]+$/.test(cleanRoll)
  ) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid roll number.",
    });
  }

  if (!["Veg", "Non-Veg"].includes(cleanFood)) {
    return res.status(400).json({
      success: false,
      message: "Invalid food preference.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO invitation_responses
        (name, section, roll_number, food_preference)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (section, roll_number) DO NOTHING
       RETURNING id, created_at`,
      [cleanName, cleanSection, cleanRoll, cleanFood]
    );

    if (result.rowCount === 0) {
      return res.status(409).json({
        success: false,
        message: "This roll number has already submitted a response.",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Your response has been saved!",
      responseId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Database insert failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save your response. Please try again.",
    });
  }
});

// Start only after the database is ready
async function startServer() {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
