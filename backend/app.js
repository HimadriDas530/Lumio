const express = require("express");
const app = express();
const port = process.env.PORT || 8080;
const dotenv = require("dotenv");
dotenv.config();
const authRoutes = require("./routes/auth.routes");
const connectMongoDB = require("./DB/connectMongoDB");

// connecting the database
connectMongoDB()
  .then((res) => {
    console.log(`MongoDB is connected`);
  })
  .catch((err) => {
    console.error(`Error connection to mongoDB: ${err.message}`);
  });

// starting the backend server
app.listen(port, () => {
  console.log("app is listening on 8080");
});

// index route
app.get("/", (req, res) => {
  res.send("are u an idiot");
});

// Authentication routes
app.use("/api/auth", authRoutes);
