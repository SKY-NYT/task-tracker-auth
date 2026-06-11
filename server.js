// 1. Load env variables FIRST — nothing else should run before this
require("dotenv").config();

// 2. Validate required env variables immediately after loading them,
//    before any module that might consume them is imported
if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI environment variable is not set");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set");
  process.exit(1);
}
if (!process.env.CORS_ORIGIN) {
  console.error("FATAL: CORS_ORIGIN environment variable is not set");
  process.exit(1);
}
if (!process.env.DNS_SERVERS) {
  console.error("FATAL: DNS_SERVERS environment variable is not set");
  process.exit(1);
}

// 3. Third-party and built-in imports
const express = require("express");
const cors = require("cors");

// 4. Internal modules (now safe — env is guaranteed to exist)
const connectDB = require("./config/db");
const taskRoutes = require("./routes/tasks");
const authRoutes = require("./routes/auth");
const logger = require("./middleware/logger");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

// 5. Constants derived from env
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";
const API_VERSION = process.env.API_VERSION || "v1";

// 6. Connect to the database
connectDB();

// 7. Create the Express app
const app = express();

// Removes the X-Powered-By: Express header from every response.
// Exposing the framework name and version helps attackers narrow down exploits.
app.disable("x-powered-by");

// 8. Global middleware (runs on every request, in this order):
//    - cors must be first so preflight OPTIONS requests are handled before anything else
//    - express.json parses request bodies so req.body is available to all routes below
//    - logger comes after body parsing so it has access to a fully formed request
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());
app.use(logger);

// 9. Routes
app.get("/", (req, res) => {
  res.json({
    message: "Task Tracker API is running!",
    version: API_VERSION,
    environment: NODE_ENV,
  });
});

app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);

// 10. 404 handler — must come AFTER all routes so it only fires when nothing matched
app.use(notFound);

// 11. Global error handler — must be LAST and must have exactly 4 parameters (err, req, res, next)
//     Express identifies it as an error handler by its arity (4 arguments)
app.use(errorHandler);

// 12. Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
});

module.exports = app;
