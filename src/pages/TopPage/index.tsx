import Header from "@/features/Header";
import WorkIndex from "@/features/workIndex";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const TopPage = () => {
  const queryClient = new QueryClient();
  return (
    <>
      <Header />
      <main>
        <QueryClientProvider client={queryClient}>
          <WorkIndex />
        </QueryClientProvider>
      </main>
    </>
  );
};

export default TopPage;
