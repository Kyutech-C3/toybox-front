import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import useUserPortfolio from "./hook/useUserPortfolio";
import styles from "./index.module.css";
import ProfileEditor from "./ProfileEditor";

import { useUserStore } from "@/features/auth/store/useUserStore";
import FavoriteButton from "@/features/FavoriteButton";
import Avatar from "@/shared/ui/Avatar";
import EditSquareIcon from "@/shared/ui/EditSquareIcon";
import { Pagination } from "@/shared/ui/Pagination";
import WorkCardGrid, { useWorkGridPageSize } from "@/shared/ui/WorkCardGrid";

type UserPortfolioProps = {
  userID: string;
};

const UserPortfolio = ({ userID }: UserPortfolioProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewerUserID = useUserStore((state) => state.user?.id);
  const requestedPage = Number(searchParams.get("page")) || 1;
  const { userProfile, works, isOwner } = useUserPortfolio({ userID });
  const [isEditing, setIsEditing] = useState(false);
  const { itemsPerPage } = useWorkGridPageSize();

  const workList = works ?? [];
  const totalPages = Math.max(1, Math.ceil(workList.length / itemsPerPage));
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const firstWorkIndex = (currentPage - 1) * itemsPerPage;
  const displayedWorks = workList.slice(
    firstWorkIndex,
    firstWorkIndex + itemsPerPage,
  );

  const handlePageChange = (page: number) => {
    setSearchParams({ page: String(page) });
    window.scrollTo({ top: 560, behavior: "smooth" });
  };

  return (
    <>
      <section className={styles["profile-section"]}>
        <div className={styles["profile-card"]}>
          <div className={styles["profile-head"]}>
            <Avatar
              avatarURL={userProfile.avatar_url || undefined}
              alt={`${userProfile.display_name}のプロフィール画像`}
              size="profile"
            />
            <div className={styles["profile-identity"]}>
              <h1 className={styles["display-name"]}>
                {userProfile.display_name}
              </h1>
              {isOwner && !isEditing && (
                <button
                  type="button"
                  className={styles["edit-profile-button"]}
                  onClick={() => setIsEditing(true)}
                >
                  <EditSquareIcon />
                  プロフィールを編集
                </button>
              )}
            </div>
          </div>
          {isOwner && isEditing ? (
            <ProfileEditor
              key={userProfile.id}
              userProfile={userProfile}
              onClose={() => setIsEditing(false)}
            />
          ) : (
            <p className={styles["profile-text"]}>
              {userProfile.profile || "プロフィールはまだありません"}
            </p>
          )}
        </div>
      </section>

      <section
        className={styles["works-section"]}
        aria-label={
          isOwner ? "あなたの作品" : `${userProfile.display_name}の作品`
        }
      >
        {displayedWorks.length === 0 && (
          <p className={styles["works-status"]}>作品はありません。</p>
        )}
        {displayedWorks.length > 0 && (
          <WorkCardGrid
            works={displayedWorks}
            viewerUserID={viewerUserID}
            renderFavoriteButton={
              viewerUserID
                ? (work) => <FavoriteButton workID={work.id} />
                : undefined
            }
          />
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

export { getUserPortfolioSWRKey } from "./hook/useUserPortfolio";
