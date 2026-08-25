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
  const { data: userProfile } = useUserProfile({ userID });
  const { data: works, isOwner } = useUserWorks({ userID });

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
    <>
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
    </>
  );
};

export default UserPortfolio;
