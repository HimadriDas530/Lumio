const express= require("express");
const router = express.Router();
const {isLoggedIn} = require("../middleware/protectRoute");
const { createPost, deletePost, commentOnPost, likeUnlikePost, getAllPosts, getLikedPosts, getFollowingPosts, getUserPosts } = require("../controllers/post.controller");

router.get("/all",isLoggedIn,getAllPosts);
router.get("/following",isLoggedIn,getFollowingPosts);
router.get("/likes/:id",isLoggedIn,getLikedPosts);
router.get("/user/:username",isLoggedIn,getUserPosts);
router.post("/create",isLoggedIn,createPost);
router.post("/like/:id",isLoggedIn,likeUnlikePost);
router.post("/comment/:id",isLoggedIn,commentOnPost);
router.delete("/:id",isLoggedIn,deletePost);

module.exports = router;
