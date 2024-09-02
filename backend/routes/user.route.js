const express = require("express");
const router = express.Router();
const { isLoggedIn } = require("../middleware/protectRoute");
const {
  getUserProfile,
  followUnfollowUser,
  getSuggestedUsers,
  updateUser,
} = require("../controllers/user.controller");

router.get("/profile/:username", isLoggedIn, getUserProfile);
router.get("/suggested", isLoggedIn, getSuggestedUsers);
router.post("/follow/:id", isLoggedIn, followUnfollowUser);
router.post("/update", isLoggedIn, updateUser);
module.exports = router;
