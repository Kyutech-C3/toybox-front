import { fetchDataWithAuth } from "@/util/fetchData";

const getUserData = async () => {
  try {
    const response: {
      id: string;
      display_name: string;
      icon_url: string;
    } = await fetchDataWithAuth("/auth/users/me");
    return response;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    return null;
  }
};

export { getUserData };
