import useSWR from "swr";

import { fetchData } from "@/util/fetchData";

import type { Work } from "@/types/work";

const useWorks = () => {
  const fetcher = async (url: string): Promise<Work[]> => {
    const response = await fetchData(url);
    return response.works;
  };
  const { data, error, isLoading } = useSWR<Work[]>("/works", fetcher);
  return { data, error, isLoading };
};

export default useWorks;
