import { Suspense } from "react";
import { useLocation, useParams } from "react-router-dom";

import styles from "./index.module.css";

import Header from "@/features/Header";
import UserPortfolio from "@/features/UserPortfolio";
import PageErrorBoundary from "@/shared/ui/PageErrorBoundary";
import PageLoading from "@/shared/ui/PageLoading";
import { ApiError } from "@/util/fetchData";

const UserPage = () => {
  const { id } = useParams<{ id: string }>();
  const { key: locationKey } = useLocation();

  const getErrorMessage = (error: Error) => {
    if (error instanceof ApiError && error.status === 404) {
      return "ユーザーが見つかりません";
    }

    return "データを取得できませんでした";
  };

  return (
    <>
      <Header />
      <main className={styles["main-wrapper"]}>
        <PageErrorBoundary
          resetKey={locationKey}
          getErrorMessage={getErrorMessage}
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
