import toast from "react-hot-toast";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";

const useFollow = ()=>{

    const queryClient = useQueryClient();
    const {mutate:follow,isPending} = useMutation({
        mutationFn: async (userId)=>{
            const res = await fetch(`/api/users/follow/${userId}`,{
                method:"POST"
            });
            const data = await res.json();
            if(!res.ok){
                throw new Error(data.error || "Something went wrong");
            }
            return data
        },
        onError:(error)=>{
            console.error(error.message);
            toast.error(error.message);
        },
        onSuccess:()=>{
            Promise.all([
                queryClient.invalidateQueries({queryKey:['suggestedUsers']}),
                queryClient.invalidateQueries({queryKey:['authUser']})
            ]);
        }
    });
    return {follow, isPending};
}

export default useFollow;