module.exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.session.redirectUrl = req.originalUrl;
    //   req.flash("error", "you must be logged in to create listing!");
    //   res.redirect("/login");
    return res.status(404).json({ error: "User is not logged in" });
  }
};
