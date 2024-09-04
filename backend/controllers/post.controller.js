const User = require("../models/user.model");
const Post = require("../models/post.model");
const Notification  = require("../models/notification.model");
const cloudinary = require("cloudinary").v2;

module.exports.createPost = async (req,res)=>{
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
}

module.exports.deletePost= async (req,res)=>{
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
}

module.exports.commentOnPost = async (req,res)=>{
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

        res.status(201).json({message: "Comment added successfully.",post});
    }
    catch(error){
        console.error("Error commenting on post:", error.message);
        res.status(500).json({error:"An error occured while commenting on the post"});
    }
}

module.exports.likeUnlikePost = async(req,res)=>{
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
            return res.status(200).json({message:"Post unliked successfully"});

        }
        else{
            // like post
            post.likes.push(userId);
            await post.save();

            // add notification
            const notification = new Notification({
                from:userId,
                to: post.user,
                type:"like"
            });
            await notification.save();

            // update the users liked posts
            await User.updateOne({_id: userId},{$push:{likedPosts:postId}});
            return res.status(201).json({message: "Post liked successfully"});
        }
    }
    catch(error){
        console.error("Error liking on post:", error.message);
        res.status(500).json({error:"An error occured while liking/unliking the post"});
    }
}

module.exports.getAllPosts = async (req,res)=>{
    try{
        const posts = await Post.find().sort({createdAt: -1}).populate("user").populate("comments.user");
        if(posts.length === 0){
            return res.status(200).json([]);
        }
        res.status(200).json(posts);
    }
    catch(error){
        console.log("Error in getAllposts controller:",error);
        res.status(500).json({error:"Internal sever error"});
    }
}

module.exports.getLikedPosts = async (req,res)=>{
    const {id:userId} = req.params;
    try{
        const user = await User.findById(userId);
        const likedPosts = await Post.find({_id: {$in:user.likedPosts}}).sort({createdAt:-1}).populate("user").populate("comments.user");

        if(likedPosts.length==0){
            return res.status(200).json({message:"No liked posts"});
        }

        res.status(200).json(likedPosts);
    }
    catch(error){
        console.error("Error getting the liked posts:", error.message);
        res.status(500).json({error:"An error occured while getting the liked post"});
    }
}

module.exports.getFollowingPosts = async (req,res)=>{
    const userId = req.user._id.toString();
    try{
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({error:"User not found"});
        }
        const following = user.following;
        
        const feedPosts = await Post.find({user:{$in:following}}).sort({createdAt:-1}).populate("user").populate("comments.user");
        if(feedPosts.length==0){
            return res.status(200).json({message:"No feed posts"});
        }

        res.status(200).json(feedPosts);
    }
    catch(error){
        console.error("Error getting the following posts:", error.message);
        res.status(500).json({error:"An error occured while getting the feed post"});
    }

}

module.exports.getUserPosts = async (req,res)=>{
    const {username} = req.params;
    try{
        const user = await User.findOne({username});
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const userPosts = await Post.find({user:user._id}).sort({createdAt:-1}).populate("user").populate("comments.user");
        if(userPosts.length==0){
            return res.status(200).json({message:"No Posts Yet"});
        }

        res.status(200).json(userPosts);
    }
    catch(error){
        console.error("Error getting the user posts:", error.message);
        res.status(500).json({error:"An error occured while getting the user post"});
    }
}
