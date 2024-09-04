const port = process.env.PORT || 8080;
const dotenv = require("dotenv");
dotenv.config();

const cloudinary = require("cloudinary").v2;
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// packages
const cors = require('cors');
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const cookieParser = require("cookie-parser");

// routes
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const postRoutes = require("./routes/post.route");
const notificationRoutes = require("./routes/notification.route");
// models
const User = require("./models/user.model");

// middlewares
const connectMongoDB = require("./DB/connectMongoDB");

// -----------------------------------------------------//

// connecting the database
connectMongoDB()
  .then((res) => {
    console.log(`MongoDB is connected`);
  })
  .catch((err) => {
    console.error(`Error connection to mongoDB: ${err.message}`);
  });

// starting the backend server
const app = express();
app.listen(port, () => {
  console.log("app is listening on 8080");
});

app.use(cors());
app.use(express.json()); //for parsing req.body
app.use(express.urlencoded({ extended: true })); //to parse urlncoded form data
app.use(cookieParser());

// setting up session with mongostore
const store = MongoStore.create({
  mongoUrl: process.env.MONGO_URL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true, //prevents xss attacks
    sameSite: "strict", //prevents CSRF attacks
    secure: process.env.NODE_ENV !== "development",
  },
};

app.use(session(sessionOptions));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(User.createStrategy()); // Automatically sets up LocalStrategy

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//

// -------------------------------------------------------//

// index route
app.get("/", (req, res) => {
  res.send("are u an idiot");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
