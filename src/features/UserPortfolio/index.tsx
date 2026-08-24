import { useId } from "react";
import { useSearchParams } from "react-router-dom";

import useUserProfile from "./hook/useUserProfile";
import useUserWorks from "./hook/useUserWorks";
import styles from "./index.module.css";

import { Pagination } from "@/features/WorkIndex/Pagination";
import Avatar from "@/shared/ui/Avatar";
import Card from "@/shared/ui/Card";

type UserPortfolioProps = {
  userID: string;
};

const ITEMS_PER_PAGE = 9;

const UserPortfolio = ({ userID }: UserPortfolioProps) => {
  const worksHeadingID = useId();
  const [searchParams, setSearchParams] = useSearchParams();
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

  if (isUserLoading) {
    return <p className={styles["page-status"]}>ユーザーを読み込み中...</p>;
  }

  if (userError?.status === 404) {
    return (
      <section className={styles["page-status"]}>
        <h1>ユーザーが見つかりません</h1>
        <p>URLをご確認ください。</p>
      </section>
    );
  }

  if (userError || !userProfile) {
    return (
      <section className={styles["page-status"]}>
        <h1>ユーザー情報を取得できませんでした</h1>
        <p>時間をおいて、もう一度お試しください。</p>
      </section>
    );
  }

  const totalPages = works
    ? Math.max(1, Math.ceil(works.length / ITEMS_PER_PAGE))
    : 1;
  const currentPage = Math.min(Math.max(requestedPage, 1), totalPages);
  const firstWorkIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedWorks = works?.slice(
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

        {areWorksLoading && (
          <p className={styles["works-status"]}>作品を読み込み中...</p>
        )}
        {worksError && (
          <p className={styles["works-status"]}>
            作品を取得できませんでした。時間をおいて再度お試しください。
          </p>
        )}
        {!areWorksLoading && !worksError && displayedWorks?.length === 0 && (
          <p className={styles["works-status"]}>表示できる作品はありません。</p>
        )}
        {!worksError && displayedWorks && displayedWorks.length > 0 && (
          <div className={styles["works-grid"]}>
            {displayedWorks.map((work) => (
              <Card
                key={work.id}
                workID={work.id}
                userID={work.user.id}
                title={
                  work.title.length > 12
                    ? `${work.title.slice(0, 12)}...`
                    : work.title
                }
                username={work.user.display_name}
                avatarURL={work.user.avatar_url || undefined}
                tags={work.tags}
                imageURL={work.thumbnail_url || undefined}
                postDate={new Date(work.created_at)}
                visibility={work.visibility}
                isEditable={isOwner}
              />
            ))}
          </div>
        )}

        {!worksError && totalPages > 1 && (
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
