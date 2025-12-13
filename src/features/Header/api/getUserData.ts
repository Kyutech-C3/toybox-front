import { fetchDataWithAuth } from "@/util/fetchData";

const getUserData = async (accessToken: string) => {
  try {
    const response: {
      display_name: string;
      icon_url: string;
    } = await fetchDataWithAuth("/auth/users/me", accessToken);
    return response;
  } catch (error) {
    console.error("Failed to fetch user data:", error);
    return null;
  }
};

export { getUserData };
