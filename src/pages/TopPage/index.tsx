import Header from "@/features/Header";
import WorkIndex from "@/features/WorkIndex";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import styles from "./index.module.css";

const TopPage = () => {
  const queryClient = new QueryClient();
  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <QueryClientProvider client={queryClient}>
          <WorkIndex />
        </QueryClientProvider>
      </main>
    </>
  );
};

export default TopPage;
