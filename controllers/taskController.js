const Task = require("../models/Task");

// GET all tasks
const getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find();
    res.status(200).json(tasks);
  } catch (error) {
    next(error);
  }
};

// GET single task by ID
const getTaskById = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ error: `Task with id ${req.params.id} not found` });
    }

    res.status(200).json(task);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    next(error);
  }
};

// POST create a new task
const createTask = async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res
        .status(400)
        .json({ error: "Title is required and cannot be empty" });
    }

    const task = await Task.create({ title });
    res.status(201).json(task);
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

// PUT update a task
const updateTask = async (req, res, next) => {
  try {
    const { title, completed } = req.body;

    if (completed !== undefined && typeof completed !== "boolean") {
      return res
        .status(400)
        .json({ error: "Completed must be a boolean (true or false)" });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, completed },
      { new: true, runValidators: true },
    );

    if (!task) {
      return res
        .status(404)
        .json({ error: `Task with id ${req.params.id} not found` });
    }

    res.status(200).json(task);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    next(error);
  }
};

// DELETE a task
const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res
        .status(404)
        .json({ error: `Task with id ${req.params.id} not found` });
    }

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    next(error);
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
