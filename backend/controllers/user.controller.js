const cloudinary = require("cloudinary").v2;
const Notification = require("../models/notification.model");
const User = require("../models/user.model");

module.exports.getUserProfile = async (req, res) => {
  const { username } = req.params;
  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
      console.log("Error in getUserProfile: :", error.message);
    });
};

module.exports.followUnfollowUser = async (req, res) => {
  try {
    const { id } = req.params; // ID of the user to follow/unfollow
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    // Check if users exist
    if (!userToModify || !currentUser) {
      return res.status(400).json({ error: "User not found" });
    }

    // Prevent following/unfollowing oneself
    if (id === req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You can not follow/unfollow yourself" });
    }

    const isFollowing = currentUser.following.includes(id);

    if (!isFollowing) {
      // follow the user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, {
        $push: { following: id },
      });
      const newNotification = new Notification({
        type: "follow",
        from: req.user._id,
        to: id,
      });
      await newNotification.save().then(()=>{
        console.log(" New notification has been saved");
      });

      res.status(200).json({ message: "user followed successfully" });
      
    } else {
      // unfollow the user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, {
        $pull: { following: id },
      });

      res.status(200).json({ message: "user unfollowed successfully" });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports.getSuggestedUsers = async (req, res) => {
  try {
    const currUserId = req.user._id;

    // Get the list of user IDs that the current user is following
    const user = await User.findById(currUserId).populate('following').lean();
    const usersFollowedByMe = user.following.map(followedUser => followedUser._id.toString());

    // Retrieve suggested users
    const users = await User.aggregate([
      { $match: { _id: { $ne: currUserId } } }, // Exclude the current user
      { $sample: { size: 10 } }, // Sample a random set of users
      { $project: { hash: 0, salt: 0 } } // Exclude `hash` and `salt` fields
    ]);

    // Filter out the users that are already followed by the current user
    const filteredUsers = users.filter(user => !usersFollowedByMe.includes(user._id.toString()));

    // Get only 4 suggested users
    const suggestedUsers = filteredUsers.slice(0, 4);

    res.status(200).json(suggestedUsers);

  } catch (error) {
    console.error("Error in getSuggestedUsers:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const { fullName, email, username, currentPassword, newPassword, bio, link } = req.body;
    let {profileImg, coverImg} = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update fields if provided
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (username) user.username = username;
    if (bio) user.bio = bio;
    if (link) user.link = link;

    // Handle password update
    if ((currentPassword && !newPassword) || (!currentPassword && newPassword)) {
      return res.status(400).json({
        error: "Please provide both current and new passwords to update your password.",
      });
    }

    if (currentPassword && newPassword) {
      const isMatch = await user.authenticate(currentPassword);

      if (!isMatch.user) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      await user.setPassword(newPassword);
    }

    // update profile  image
    if (profileImg) {
      try {
        // Delete the previous profile image if it exists
        if (user.profileImg) {
        const publicId = user.profileImg.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
        }
        // Upload the new profile image
        const uploadedResponse = await cloudinary.uploader.upload(profileImg);
        user.profileImg = uploadedResponse.secure_url;
      } catch (error) {
        console.error("Error uploading profile image:", error.message);
        return res.status(500).json({ error: "Failed to upload profile image." });
      }
    }
    
    if (coverImg) {
      try {
        // Delete the previous cover image if it exists
        if (user.coverImg) {
          const publicId = user.coverImg.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
        // Upload the new cover image
        const uploadedResponse = await cloudinary.uploader.upload(coverImg);
        user.coverImg = uploadedResponse.secure_url;
      } catch (error) {
        console.error("Error uploading cover image:", error.message);
        return res.status(500).json({ error: "Failed to upload cover image." });
      }
    }
    
    await user.save();

    res.status(200).json({
      message: "Profile updated successfully!",
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        username: user.username,
        bio: user.bio,
        link: user.link,
      },
    });

  } catch (error) {
    console.error("Error in updateUserProfile:", error.message);
    res.status(500).json({ error: "An error occurred during the update." });
  }
};