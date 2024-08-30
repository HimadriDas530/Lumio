const User = require("../models/user.model");
const passport = require("passport");

module.exports.signup = async (req, res, next) => {
  let { fullName, username, email, password } = req.body;
  let newUser = new User({ fullName, username, email });
  User.register(newUser, password)
    .then((registeredUser) => {
      console.log(registeredUser);
      req.logIn(registeredUser, (err) => {
        if (err) {
          next(err);
        }
        res.status(201).json({
          _id: registeredUser._id,
          fullName: registeredUser.fullName,
          username: registeredUser.username,
          email: registeredUser.email,
          followers: registeredUser.followers,
          following: registeredUser.following,
          profileImg: registeredUser.profileImg,
          coverImg: registeredUser.coverImg,
        });
      });
    })
    .catch((err) => {
      res.status(500).send(err);
    });
};

module.exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      // Log unexpected errors
      console.error("Authentication error:", err);
      return res
        .status(500)
        .json({ message: "An error occurred during authentication." });
    }
    if (!user) {
      // Authentication failed, send an error response
      return res
        .status(401)
        .json({ message: info.message || "Invalid username or password." });
    }
    req.logIn(user, (err) => {
      if (err) {
        // Log errors during login
        console.error("Login error:", err);
        return res
          .status(500)
          .json({ message: "An error occurred during login." });
      }
      // Authentication successful, send a success response
      return res.status(200).json({
        _id: user._id,
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        followers: user.followers,
        following: user.following,
        profileImg: user.profileImg,
        coverImg: user.coverImg,
      });
    });
  })(req, res, next);
};

module.exports.logout = async (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res
        .status(500)
        .json({ message: "An error occurred during logout." });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return res
          .status(500)
          .json({ message: "An error occurred while destroying the session." });
      }

      // Clear cookies if needed
      res.clearCookie("connect.sid");

      // Send a response or redirect
      res.status(200).json({ message: "Logout successful!" });
      // Alternatively, redirect:
      // res.redirect('/login');
    });
  });
};
