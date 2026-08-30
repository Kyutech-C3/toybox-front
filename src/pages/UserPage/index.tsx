import { Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";
import { mutate } from "swr";

import styles from "./index.module.css";

import { useAuthStore } from "@/features/auth/store/useAuthStore";
import Header from "@/features/Header";
import UserPortfolio, {
  getUserPortfolioSWRKey,
} from "@/features/UserPortfolio";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";
import { ApiError } from "@/util/fetchData";

const UserPage = () => {
  const { id } = useParams<{ id: string }>();
  const { key: locationKey } = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);

  const getErrorMessage = (error: Error) => {
    if (error instanceof ApiError && error.status === 404) {
      return "ユーザーが見つかりません";
    }

    return error instanceof ApiError
      ? error.displayMessage
      : "画面の表示中に問題が発生しました";
  };

  const handleRetry = async () => {
    if (!id) return;

    await mutate(
      getUserPortfolioSWRKey({ userID: id, accessToken }),
      undefined,
      { revalidate: false },
    );
  };

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <PageErrorBoundary
          resetKey={locationKey}
          getErrorMessage={getErrorMessage}
          onRetry={handleRetry}
        >
          <Suspense fallback={<PageLoading />}>
            {id ? (
              <UserPortfolio userID={id} />
            ) : (
              <section className={styles["page-status"]}>
                <h1>ユーザーが見つかりません</h1>
              </section>
            )}
          </Suspense>
        </PageErrorBoundary>
      </main>
    </>
  );
};

export default UserPage;
