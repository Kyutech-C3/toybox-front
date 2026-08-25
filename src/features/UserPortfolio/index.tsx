import { useId } from "react";
import { useSearchParams } from "react-router-dom";

import useUserProfile from "./hook/useUserProfile";
import useUserWorks from "./hook/useUserWorks";
import styles from "./index.module.css";

import { useUserStore } from "@/features/auth/store/useUserStore";
import Avatar from "@/shared/ui/Avatar";
import { Pagination } from "@/shared/ui/Pagination";
import WorkCardGrid from "@/shared/ui/WorkCardGrid";

type UserPortfolioProps = {
  userID: string;
};

const ITEMS_PER_PAGE = 21;

const UserPortfolio = ({ userID }: UserPortfolioProps) => {
  const worksHeadingID = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const viewerUserID = useUserStore((state) => state.user?.id);
  const requestedPage = Number(searchParams.get("page")) || 1;
  const {
    data: userProfile,
    error: userError,
    isLoading: isUserLoading,
  } = useUserProfile({ userID });
  const {
    data: works,
    error: worksError,
    isLoading: areWorksLoading,
    isOwner,
  } = useUserWorks({ userID });

  if (userError?.status === 404) {
    return (
      <section className={styles["page-status"]}>
        <h1>ユーザーが見つかりません</h1>
      </section>
    );
  }

  if (userError || worksError) {
    return (
      <section className={styles["page-status"]}>
        <h1>データを取得できませんでした</h1>
      </section>
    );
  }

  if (isUserLoading || areWorksLoading || !userProfile) {
    return <p className={styles["page-status"]}>読み込み中...</p>;
  }

  const workList = works ?? [];
  const totalPages = Math.max(1, Math.ceil(workList.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const firstWorkIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedWorks = workList.slice(
    firstWorkIndex,
    firstWorkIndex + ITEMS_PER_PAGE,
  );

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page) });
    window.scrollTo({ top: 560, behavior: "smooth" });
  };

  return (
    <main className={styles["main-wrapper"]}>
      <section className={styles["profile-section"]}>
        <div className={styles["profile-content"]}>
          <Avatar
            avatarURL={userProfile.avatar_url || undefined}
            alt={`${userProfile.display_name}のプロフィール画像`}
            size="profile"
          />
          <h1 className={styles["display-name"]}>{userProfile.display_name}</h1>
          <p className={styles["profile-text"]}>
            {userProfile.profile || "プロフィールはまだありません"}
          </p>
        </div>
      </section>

      <section
        className={styles["works-section"]}
        aria-labelledby={worksHeadingID}
      >
        <h2 id={worksHeadingID} className={styles["works-heading"]}>
          {isOwner ? "あなたの作品" : `${userProfile.display_name}の作品`}
        </h2>

        {displayedWorks.length === 0 && (
          <p className={styles["works-status"]}>作品はありません。</p>
        )}
        {displayedWorks.length > 0 && (
          <WorkCardGrid works={displayedWorks} viewerUserID={viewerUserID} />
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </section>
    </main>
  );
};

export default UserPortfolio;
