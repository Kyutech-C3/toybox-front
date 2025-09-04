import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/util/fetchData";
import type { Work } from "@/types/work";

const useWorks = (page?: number, userID?: string) => {
  const fetchWorksData = async () => await fetchData("/works");
  const { data, error, isLoading, refetch } = useQuery<Work[]>({
    queryKey: ["works", page, userID],
    queryFn: fetchWorksData,
  });
  return { data, error, isLoading, refetch };
};

export default useWorks;
