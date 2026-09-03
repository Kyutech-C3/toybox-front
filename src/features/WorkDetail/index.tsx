import { Link } from "react-router-dom";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";

import MarkdownPreview from "../MarkdownPreview";
import AssetCarousel from "./AssetCarousel";
import useWorkDetail from "./hook/useWorkDetail";
import styles from "./index.module.css";
import ShareButton from "./ShareButton";

import { useUserStore } from "@/features/auth/store/useUserStore";
import Batch from "@/shared/ui/Batch";
import EditSquareIcon from "@/shared/ui/EditSquareIcon";
import LikeButton from "@/shared/ui/LikeButton";
import Paper from "@/shared/ui/Paper";
import UserButton from "@/shared/ui/UserButton";
import VisibilityIcon from "@/shared/ui/VisibilityIcon";
import { formatDateTime } from "@/util/formatDateTime";

type WorkDetailProps = {
  workID: string;
};

const WorkDetail = ({ workID }: WorkDetailProps) => {
  const { data } = useWorkDetail({ id: workID });
  const viewerUserID = useUserStore((state) => state.user?.id);

  if (!data) {
    return <div>データがありません</div>;
  }

  return (
    <Paper>
      <article className={styles["work-detail"]}>
        {data.assets.length > 0 && (
          <div className={styles["work-detail-assets"]}>
            <AssetCarousel assets={data.assets} />
          </div>
        )}
        <header className={styles["work-detail-header"]}>
          <h1 className={styles["work-detail-title"]}>
            {data.title}
            <VisibilityIcon
              visibility={data.visibility}
              className={styles["visibility-icon"]}
            />
          </h1>
          {data.tags.length > 0 && (
            <div className={styles["work-detail-tags"]}>
              {data.tags.map((tag) => (
                <Batch key={`${data.id}-${tag.id}`} color="pale">
                  {tag.name}
                </Batch>
              ))}
            </div>
          )}
          <div className={styles["work-detail-meta-row"]}>
            <dl className={styles["work-detail-dates"]}>
              <div className={styles["work-detail-date"]}>
                <dt>
                  <span
                    className={styles["date-icon"]}
                    role="img"
                    aria-label="投稿日"
                    title="投稿日"
                  >
                    <AccessTimeRoundedIcon fontSize="inherit" />
                  </span>
                </dt>
                <dd>
                  <time dateTime={data.created_at}>
                    {formatDateTime(data.created_at)}
                  </time>
                </dd>
              </div>
              <div className={styles["work-detail-date"]}>
                <dt>
                  <span
                    className={styles["date-icon"]}
                    role="img"
                    aria-label="更新日"
                    title="更新日"
                  >
                    <AutorenewRoundedIcon fontSize="inherit" />
                  </span>
                </dt>
                <dd>
                  <time dateTime={data.updated_at}>
                    {formatDateTime(data.updated_at)}
                  </time>
                </dd>
              </div>
            </dl>
            <div className={styles["work-detail-actions"]}>
              <ShareButton title={data.title} />
              <LikeButton isCountVisible />
            </div>
          </div>
          <div className={styles["work-detail-author-row"]}>
            <UserButton
              userID={data.user.id}
              displayName={data.user.display_name}
              avatarURL={data.user.avatar_url || undefined}
            />
            {viewerUserID === data.user.id && (
              <Link to={`/edit/${data.id}`} className={styles["edit-link"]}>
                <EditSquareIcon />
                編集
              </Link>
            )}
          </div>
        </header>
        <hr className={styles["work-detail-divider"]} />
        <MarkdownPreview content={data.description} />
      </article>
    </Paper>
  );
};

export default WorkDetail;
