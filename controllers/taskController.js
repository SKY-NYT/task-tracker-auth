const mongoose = require("mongoose");
const Task = require("../models/taskModel");

const isValidId = (rawId) => mongoose.Types.ObjectId.isValid(rawId);

const buildOwnerFilter = (user) => (user.role === "admin" ? {} : { userId: user._id });

const isOwnerOrAdmin = (user, task) => user.role === "admin" || task.userId.equals(user._id);

const getAllTasks = async (req, res, next) => {
  try {
    const filter = buildOwnerFilter(req.user);

    if (req.query.completed !== undefined) {
      if (req.query.completed !== "true" && req.query.completed !== "false") {
        return res.status(400).json({ status: "error", message: "Completed query must be 'true' or 'false'" });
      }
      filter.completed = req.query.completed === "true";
    }

    let sortQuery = { createdAt: -1 };
    if (req.query.sortBy) {
      const [field, order] = req.query.sortBy.split(":");
      const allowedFields = ["title", "completed", "createdAt"];
      if (allowedFields.includes(field)) {
        sortQuery = { [field]: order === "desc" ? -1 : 1 };
      }
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(filter).sort(sortQuery).skip(skip).limit(limit),
      Task.countDocuments(filter),
    ]);

    res.status(200).json({
      status: "success",
      data: { total, page, limit, totalPages: Math.ceil(total / limit), tasks },
    });
  } catch (error) {
    next(error);
  }
};

const getTaskById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ status: "error", message: "Invalid ID format" });
    }

    const task = await Task.findById(id);

    if (!task || !isOwnerOrAdmin(req.user, task)) {
      return res.status(404).json({ status: "error", message: "Task not found" });
    }

    res.status(200).json({ status: "success", data: task });
  } catch (error) {
    next(error);
  }
};

const createTask = async (req, res, next) => {
  try {
    const { title, description, completed } = req.body;

    if (typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ status: "error", message: "Title is required and cannot be empty" });
    }

    if (description !== undefined && typeof description !== "string") {
      return res.status(400).json({ status: "error", message: "Description must be a string" });
    }

    if (completed !== undefined && typeof completed !== "boolean") {
      return res.status(400).json({ status: "error", message: "Completed must be a boolean" });
    }

    const taskData = { title: title.trim(), userId: req.user._id };
    if (description !== undefined) taskData.description = description;
    if (completed !== undefined) taskData.completed = completed;

    const task = await Task.create(taskData);

    res.status(201).json({ status: "success", data: task });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ status: "error", message: error.message });
    }
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ status: "error", message: "Invalid ID format" });
    }

    const { title, description, completed } = req.body;
    const updates = {};

    if (title !== undefined) {
      if (typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ status: "error", message: "Title cannot be empty" });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return res.status(400).json({ status: "error", message: "Description must be a string" });
      }
      updates.description = description;
    }

    if (completed !== undefined) {
      if (typeof completed !== "boolean") {
        return res.status(400).json({ status: "error", message: "Completed must be a boolean" });
      }
      updates.completed = completed;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ status: "error", message: "No valid fields provided for update" });
    }

    const existingTask = await Task.findById(id);

    if (!existingTask || !isOwnerOrAdmin(req.user, existingTask)) {
      return res.status(404).json({ status: "error", message: "Task not found" });
    }

    existingTask.set(updates);
    const task = await existingTask.save();

    res.status(200).json({ status: "success", data: task });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ status: "error", message: error.message });
    }
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      return res.status(400).json({ status: "error", message: "Invalid ID format" });
    }

    const task = await Task.findById(id);

    if (!task || !isOwnerOrAdmin(req.user, task)) {
      return res.status(404).json({ status: "error", message: "Task not found" });
    }

    await task.deleteOne();

    res.status(200).json({ status: "success", data: task });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask };
