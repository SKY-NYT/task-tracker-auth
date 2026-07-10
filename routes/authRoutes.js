const express = require("express");
const router = express.Router();
const { register, login, getUsers } = require("../controllers/authController");
const protect = require("../middleware/protect");
const requireRole = require("../middleware/requireRole");
const { registerLimiter, loginLimiter } = require("../middleware/rateLimiter");

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.get("/users", protect, requireRole("admin"), getUsers);

module.exports = router;
 