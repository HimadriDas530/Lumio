const express = require("express");
const router = express.Router();
const {isLoggedIn} = require("../middleware/protectRoute");
const { getNotifications, deleteNotifications } = require("../controllers/notification.controller");

router.get("/",isLoggedIn,getNotifications);
router.delete("/",isLoggedIn,deleteNotifications);
module.exports = router;