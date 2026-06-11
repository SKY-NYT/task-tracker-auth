const mongoose = require("mongoose");
const dns = require("node:dns");

dns.setDefaultResultOrder("ipv4first");
dns.setServers(process.env.DNS_SERVERS.split(","));

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.log("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error(`MongoDB error: ${err.message}`);
});

module.exports = connectDB;
