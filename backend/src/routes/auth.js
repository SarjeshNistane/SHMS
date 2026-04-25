import { Router } from "express";
import { Doctor } from "../models/Doctor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "shms_super_secret_key_2026";

authRouter.post("/login", async (req, res) => {
  try {
    const { name, password, role } = req.body;
    
    // Find user (Doctor or Admin)
    const user = await Doctor.findOne({ name: new RegExp(name, "i"), role: role });
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
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
    res.status(500).json({ success: false, message: "Server error during login" });
  }
});
