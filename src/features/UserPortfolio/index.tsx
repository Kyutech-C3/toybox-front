import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import GitHubIcon from "@mui/icons-material/GitHub";
import XIcon from "@mui/icons-material/X";

import useUserPortfolio from "./hook/useUserPortfolio";
import styles from "./index.module.css";
import ProfileEditor from "./ProfileEditor";

import { useUserStore } from "@/features/auth/store/useUserStore";
import FavoriteButton from "@/features/FavoriteButton";
import Avatar from "@/shared/ui/Avatar";
import Button from "@/shared/ui/Button";
import EditSquareIcon from "@/shared/ui/EditSquareIcon";
import { Pagination } from "@/shared/ui/Pagination";
import WorkCardGrid, { useWorkPageSize } from "@/shared/ui/WorkCardGrid";

type UserPortfolioProps = {
  userID: string;
};

const UserPortfolio = ({ userID }: UserPortfolioProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const viewerUserID = useUserStore((state) => state.user?.id);
  const requestedPage = Number(searchParams.get("page")) || 1;
  const { userProfile, works, isOwner } = useUserPortfolio({ userID });
  const [isEditing, setIsEditing] = useState(false);
  const { itemsPerPage } = useWorkPageSize();

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
          <div className={styles["profile-avatar"]}>
            <Avatar
              avatarURL={userProfile.avatar_url || undefined}
              alt={`${userProfile.display_name}のプロフィール画像`}
              size="profile"
            />
          </div>
          {isOwner && isEditing ? (
            <div className={styles["profile-editor-slot"]}>
              <ProfileEditor
                key={userProfile.id}
                userProfile={userProfile}
                onClose={() => setIsEditing(false)}
              />
            </div>
          ) : (
            <>
              <div className={styles["profile-main"]}>
                <h1 className={styles["display-name"]}>
                  {userProfile.display_name}
                </h1>
                {(userProfile.github_id || userProfile.twitter_id) && (
                  <nav
                    className={styles["social-links"]}
                    aria-label="ソーシャルアカウント"
                  >
                    {userProfile.github_id && (
                      <a
                        className={styles["social-link"]}
                        href={`https://github.com/${encodeURIComponent(userProfile.github_id)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <GitHubIcon fontSize="small" />
                        <span>{userProfile.github_id}</span>
                      </a>
                    )}
                    {userProfile.twitter_id && (
                      <a
                        className={styles["social-link"]}
                        href={`https://x.com/${encodeURIComponent(userProfile.twitter_id)}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <XIcon fontSize="small" />
                        <span>{userProfile.twitter_id}</span>
                      </a>
                    )}
                  </nav>
                )}
              </div>
              {isOwner && (
                <div className={styles["profile-edit"]}>
                  <Button
                    variant="accent"
                    onClick={() => setIsEditing(true)}
                    ariaLabel="プロフィールを編集"
                  >
                    <EditSquareIcon />
                    編集
                  </Button>
                </div>
              )}
              {userProfile.profile && (
                <p className={styles["profile-text"]}>{userProfile.profile}</p>
              )}
            </>
          )}
        </div>
      </section>

      <section
        className={styles["works-section"]}
        aria-label={
          isOwner ? "あなたの作品" : `${userProfile.display_name}の作品`
        }
      >
        <WorkCardGrid
          works={displayedWorks}
          viewerUserID={viewerUserID}
          renderFavoriteButton={
            viewerUserID
              ? (work) => <FavoriteButton workID={work.id} />
              : undefined
          }
        />

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
