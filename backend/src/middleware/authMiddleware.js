import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "shms_super_secret_key_2026";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.status(401).json({ success: false, message: "No token provided" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Token is invalid or expired" });
    }
    req.user = user;
    next();
  });
};
