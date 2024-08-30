const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

const dotenv = require("dotenv");
dotenv.config();

const authRoutes = require("./routes/auth.routes");
const connectMongoDB = require("./DB/connectMongoDB");

// last added
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const User = require("./models/user.model");
const cookieParser = require("cookie-parser");

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

// index route
app.get("/", (req, res) => {
  res.send("are u an idiot");
});

// Authentication routes
app.use("/api/auth", authRoutes);
