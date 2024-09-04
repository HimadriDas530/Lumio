import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import {useQuery} from '@tanstack/react-query';
import { useEffect } from "react";
const Posts = ({feedType}) => {

	const getPostEndpoint = ()=>{
		switch(feedType){
			case "forYou":
				return "/api/posts/all";
			case "following":
				return "/api/posts/following";
			default:
				return "/api/posts/all";
		}
	}
	const POST_ENDPOINT= getPostEndpoint();
	const {data:posts,isLoading,refetch,isRefetching}=useQuery({
		querykey:['authUser'],
		queryFn:async ()=>{
			const res = await fetch(POST_ENDPOINT);
			const data = await res.json();
			if(!res.ok){
				throw new Error(data.error || "Sommething went wrong");
			}
			return data;
		}
	}); 
	useEffect(()=>{
		refetch();
	},[feedType,refetch]);

	return (
		<>
			{(isLoading || isRefetching) && (
				<div className='flex flex-col justify-center'>
					<PostSkeleton />
					<PostSkeleton />
					<PostSkeleton />
				</div>
			)}
			{!isLoading && posts?.length === 0 && <p className='text-center my-4'>No posts in this tab. Switch 👻</p>}
			{!isLoading && posts && (
				<div>
					{posts.map((post) => (
						<Post key={post._id} post={post} />
					))}
				</div>
			)}
		</>
	);
};
export default Posts;