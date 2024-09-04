const User = require("../models/user.model");
const passport = require("passport");

module.exports.signup = async (req, res, next) => {
  let { fullName, username, email, password } = req.body;
  let newUser = new User({ fullName, username, email });

  try {
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);

    req.logIn(registeredUser, (err) => {
      if (err) {
        return next(err); // Pass error to the error handling middleware
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
  } catch (err) {
      console.error("Error Signing up:", err.message);
      res.status(400).json({ error: err.message }); // Use error.message for specific error messages
  }
};

module.exports.login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      // Log unexpected errors
      console.error("Authentication error:", err);
      return res
        .status(500)
        .json({ error: "An error occurred during authentication." });
    }
    if (!user) {
      // Authentication failed, send an error response
      return res
        .status(401)
        .json({ error: info.message || "Invalid username or password." });
    }
    req.logIn(user, (err) => {
      if (err) {
        // Log errors during login
        console.error("Login error:", err);
        return res
          .status(500)
          .json({ error: "An error occurred during login." });
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

module.exports.getMe = async (req,res)=>{
  try{
    const user = await User.findById(req.user._id);
    res.status(200).json(user);
  }
  catch(error){
    console.log("Error in getMe controller", error.message);
    res.status(500).json({error:"Internal server error"});
  }
}