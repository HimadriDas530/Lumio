// module.exports.isLoggedIn = (req, res, next) => {
//   if (req.isAuthenticated()) {
//     next();
//   } else {
//     req.session.redirectUrl = req.originalUrl;
//     return res.status(404).json({ error: "User is not logged in" });
//   }
// };

module.exports.isLoggedIn = (req, res, next) => {
  try {
    if (req.isAuthenticated()) {
      return next();
    } else {
      return res.status(401).json({ error: "User is not logged in" });
    }
  } catch (err) {
    console.error("Error in isLoggedIn middleware:", err);
    return res.status(500).json({ error: "An unexpected error occurred" });
  }
};
