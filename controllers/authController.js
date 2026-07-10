const User = require("../models/userModel");
const { generateToken } = require("../utils/tokenUtils");

const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(value);

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!isNonEmptyString(name)) {
      return res.status(400).json({ status: "error", message: "Name is required" });
    }

    if (!isNonEmptyString(email) || !isValidEmail(email)) {
      return res.status(400).json({ status: "error", message: "A valid email address is required" });
    }

    if (!isNonEmptyString(password)) {
      return res.status(400).json({ status: "error", message: "Password is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ status: "error", message: "Password must be at least 6 characters" });
    }

    const userExists = await User.findOne({ email }).lean();
    if (userExists) {
      return res.status(409).json({ status: "error", message: "A user with that email already exists" });
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      status: "success",
      data: {
        token: generateToken(user._id, user.role),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ status: "error", message: error.message });
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!isNonEmptyString(email) || !isValidEmail(email)) {
      return res.status(400).json({ status: "error", message: "A valid email address is required" });
    }

    if (!isNonEmptyString(password)) {
      return res.status(400).json({ status: "error", message: "Password is required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ status: "error", message: "Invalid email or password" });
    }

    res.status(200).json({
      status: "success",
      data: {
        token: generateToken(user._id, user.role),
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().lean();
    res.status(200).json({ status: "success", data: users });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getUsers };
