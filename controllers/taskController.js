const Task = require("../models/Task");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

const getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find();
  res.status(200).json({ success: true, count: tasks.length, data: tasks });
});

const getTaskById = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task)
    return next(new AppError(`Task with id ${req.params.id} not found`, 404));
  res.status(200).json({ success: true, data: task });
});

const createTask = asyncHandler(async (req, res, next) => {
  const { title, completed } = req.body;

  if (!title || title.trim() === "") {
    return next(new AppError("Title is required and cannot be empty", 400));
  }
  if (completed !== undefined && typeof completed !== "boolean") {
    return next(
      new AppError("Completed must be a boolean (true or false)", 400),
    );
  }

  const taskData = { title };
  if (completed !== undefined) taskData.completed = completed;

  const task = await Task.create(taskData);
  res.status(201).json({ success: true, data: task });
});

const updateTask = asyncHandler(async (req, res, next) => {
  const { title, completed } = req.body;

  if (completed !== undefined && typeof completed !== "boolean") {
    return next(
      new AppError("Completed must be a boolean (true or false)", 400),
    );
  }

  const updates = {};
  if (title !== undefined) updates.title = title;
  if (completed !== undefined) updates.completed = completed;

  if (Object.keys(updates).length === 0) {
    return next(new AppError("No valid fields provided to update", 400));
  }

  const task = await Task.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });

  if (!task)
    return next(new AppError(`Task with id ${req.params.id} not found`, 404));
  res.status(200).json({ success: true, data: task });
});

const deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task)
    return next(new AppError(`Task with id ${req.params.id} not found`, 404));
  res.status(200).json({ success: true, message: "Task deleted successfully" });
});

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
