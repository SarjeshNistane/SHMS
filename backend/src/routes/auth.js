import { Router } from "express";
import { Doctor } from "../models/Doctor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "shms_super_secret_key_2026";

authRouter.post("/login", async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ 
        success: false, 
        message: "Database connection is not ready. Please try again in a few seconds." 
      });
    }

    const { name, password, role } = req.body;
    console.log(`[AUTH] Login attempt: Name="${name}", Role="${role}"`);
    
    if (!name || !password || !role) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Clean up name and handle optional "Dr." prefix
    const cleanName = name.trim().replace(/^dr\.?\s+/i, "");
    
    // Find user (Doctor or Admin)
    // We match either the exact name OR the name with a "Dr. " prefix
    const user = await Doctor.findOne({ 
      $and: [
        { role: role.toLowerCase() },
        { 
          $or: [
            { name: { $regex: new RegExp(`^${cleanName}$`, "i") } },
            { name: { $regex: new RegExp(`^Dr\\.?\\s+${cleanName}$`, "i") } }
          ]
        }
      ]
    });
    
    if (!user) {
      console.warn(`[AUTH] User not found for: "${name}" as ${role}`);
      return res.status(401).json({ success: false, message: "Invalid credentials (user not found)" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[AUTH] Password mismatch for: "${name}"`);
      return res.status(401).json({ success: false, message: "Invalid credentials (password incorrect)" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, role: user.role, specialization: user.specialization }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during login",
      details: error.message 
    });
  }
});
