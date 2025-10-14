const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET || "default_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "2d"; // fallback for safety

  console.log("🔍 JWT_EXPIRES_IN:", expiresIn); // debug log

  return jwt.sign(payload, secret, { expiresIn });
};

module.exports = { generateToken };
