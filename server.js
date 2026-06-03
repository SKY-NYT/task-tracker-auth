require("dotenv").config();
const express = require("express");

const connectDB = require("./config/db");
const taskRoutes = require("./routes/tasks");
const authRoutes = require("./routes/auth");
const logger = require("./middleware/logger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_VERSION = process.env.API_VERSION || "v1";


connectDB();


app.use(express.json());


app.use(logger);


app.get("/", (req, res) => {
  res.json({
    message: "Task Tracker API is running!",
    version: API_VERSION,
    environment: NODE_ENV,
  });
});

app.use("/api/tasks", taskRoutes);
app.use("/auth", authRoutes);


app.use(notFound);


app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
});

module.exports = app;
