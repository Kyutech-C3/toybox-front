import { Link } from "react-router-dom";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";

import MarkdownPreview from "../MarkdownPreview";
import AssetCarousel from "./AssetCarousel";
import styles from "./index.module.css";
import ShareButton from "./ShareButton";

import { useUserStore } from "@/features/auth/store/useUserStore";
import FavoriteButton from "@/features/FavoriteButton";
import Batch from "@/shared/ui/Batch";
import EditSquareIcon from "@/shared/ui/EditSquareIcon";
import Paper from "@/shared/ui/Paper";
import UserButton from "@/shared/ui/UserButton";
import VisibilityIcon from "@/shared/ui/VisibilityIcon";
import { formatDateTime } from "@/util/formatDateTime";
import { formatTagLabel } from "@/util/tagName";

import type { Work } from "@/shared/types/work";

type WorkDetailProps = {
  data: Work;
};

const WorkDetail = ({ data }: WorkDetailProps) => {
  const viewerUserID = useUserStore((state) => state.user?.id);

  return (
    <Paper>
      <article className={styles["work-detail"]}>
        {data.assets.length > 0 && (
          <div className={styles["work-detail-assets"]}>
            <AssetCarousel assets={data.assets} />
          </div>
        )}
        <header className={styles["work-detail-header"]}>
          <h1 className={styles["work-detail-title"]}>{data.title}</h1>
          {data.tags.length > 0 && (
            <div className={styles["work-detail-tags"]}>
              {data.tags.map((tag) => (
                <Batch key={`${data.id}-${tag.id}`}>
                  {formatTagLabel(tag.name)}
                </Batch>
              ))}
            </div>
          )}
          <div className={styles["work-detail-meta-row"]}>
            <div className={styles["work-detail-meta"]}>
              <VisibilityIcon
                visibility={data.visibility}
                className={styles["visibility-icon"]}
                isLabelVisible
              />
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
            </div>
            <div className={styles["work-detail-actions"]}>
              <ShareButton title={data.title} />
              <FavoriteButton workID={data.id} isCountVisible />
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
