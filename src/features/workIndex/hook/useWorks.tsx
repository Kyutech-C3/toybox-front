import { useQuery } from "@tanstack/react-query";
import { fetchData } from "@/util/fetchData";
import type { Work } from "@/types/work";

const useWorks = () => {
  const fetchWorksData = async (): Promise<Work[]> => {
    const response = await fetchData("/works");
    return response.works;
  };
  const { data, error, isLoading, refetch } = useQuery<Work[]>({
    queryKey: ["works"],
    queryFn: fetchWorksData,
  });
  return { data, error, isLoading, refetch };
};

export default useWorks;
