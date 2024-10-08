import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { v2 as cloudinary } from "cloudinary";

export const createPost = async (req, res) => {
	try{
        const {text} = req.body;
        let {img} = req.body;
        const userId = req.user._id.toString();

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }

        if(!text && !img){
            return res.status(400).json({message:"Post must have text or image"});
        }

        if(img){
            const uploadedResponse = await cloudinary.uploader.upload(img);
            img = uploadedResponse.secure_url;
        }

        const newPost = new Post({
            user:userId,
            text,
            img
        });
        
        newPost.save().then((newPost)=>{
            res.status(201).json(newPost);
        })
        .catch((error)=>{
            res.status(500).json({error:error.message});
        });

    }
    catch(error){
        res.status(500).json({error:error});
        console.log(error);
    }
};

export const deletePost = async (req, res) => {
	try{
        const {id} = req.params;
        const post = await Post.findById(id);
        if(!post){
            return res.status(404).json({error:"Post not found"});
        }
        if(post.user.toString() !== req.user._id.toString()){
            return res.status(401).json({error:"You are not authorized to delete this post"});
        }
        if(post.img){
            const imgId = post.img.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(imgId);
        }

        Post.findByIdAndDelete(id).then(()=>{
            res.status(200).json({message: "Post deleted successfully"});
        }).catch((err)=>{
            res.status(400).json({error:err});
        })
    }
    catch(error){
        console.log("Error in deletePost controller: ",error);
        res.status(500).json({error:"Internal server error"});
    }
};

export const commentOnPost = async (req, res) => {
	try{
        const {text} = req.body;
        const postId=req.params.id;
        const userId = req.user._id;
    
        if(!text || text.trim()===""){
            return res.status(400).json({error:"Comment text is required"});
        }

        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({error:"Post not found"});
        }

        post.comments.push({text,user:userId});
        await post.save();

        const updatedPost = await Post.findById(postId).populate('comments.user','fullName username');
        const updatedComments= updatedPost.comments;
        res.status(201).json(updatedComments);
    }
    catch(error){
        console.error("Error commenting on post:", error.message);
        res.status(500).json({error:"An error occured while commenting on the post"});
    }
};

export const likeUnlikePost = async (req, res) => {
	try{
        const postId=req.params.id;
        const userId = req.user._id;

        const post = await Post.findById(postId);

        if(!post){
            return res.status(404).json({error:"Post not found"});
        }

        const userLikedPost = post.likes.includes(userId);
        if(userLikedPost){
            // unlike post
            await Post.updateOne({_id:postId},{$pull:{likes:userId}});
            await User.updateOne({_id: userId},{$pull:{likedPosts:postId}});

            const updatedLikes = post.likes.filter((id)=> id.toString() !== userId.toString());
            return res.status(200).json(updatedLikes);
        }
        else{
            // like post
            post.likes.push(userId);
            await post.save();

            // update the users liked posts
            await User.updateOne({_id: userId},{$push:{likedPosts:postId}});

            // add notification
            const notification = new Notification({
                from:userId,
                to: post.user,
                type:"like"
            });
            await notification.save();

            const updatedLikes = post.likes;
            return res.status(201).json(updatedLikes);
        }
    }
    catch(error){
        console.error("Error liking on post:", error.message);
        res.status(500).json({error:"An error occured while liking/unliking the post"});
    }
};

export const getAllPosts = async (req, res) => {
	try {
		const posts = await Post.find()
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		if (posts.length === 0) {
			return res.status(200).json([]);
		}

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getAllPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getLikedPosts = async (req, res) => {
	const userId = req.params.id;

	try {
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(likedPosts);
	} catch (error) {
		console.log("Error in getLikedPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getFollowingPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);
		if (!user) return res.status(404).json({ error: "User not found" });

		const following = user.following;

		const feedPosts = await Post.find({ user: { $in: following } })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(feedPosts);
	} catch (error) {
		console.log("Error in getFollowingPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};

export const getUserPosts = async (req, res) => {
	try {
		const { username } = req.params;

		const user = await User.findOne({ username });
		if (!user) return res.status(404).json({ error: "User not found" });

		const posts = await Post.find({ user: user._id })
			.sort({ createdAt: -1 })
			.populate({
				path: "user",
				select: "-password",
			})
			.populate({
				path: "comments.user",
				select: "-password",
			});

		res.status(200).json(posts);
	} catch (error) {
		console.log("Error in getUserPosts controller: ", error);
		res.status(500).json({ error: "Internal server error" });
	}
};
