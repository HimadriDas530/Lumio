const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { isLoggedIn } = require("../middleware/protectRoute");

router.get("/me",isLoggedIn, authController.getMe);
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

module.exports = router;
