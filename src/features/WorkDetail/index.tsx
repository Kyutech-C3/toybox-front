import { Link } from "react-router-dom";

import MarkdownPreview from "../MarkdownPreview";
import AssetCarousel from "./AssetCarousel";
import useWorkDetail from "./hook/useWorkDetail";
import styles from "./index.module.css";

import { useUserStore } from "@/features/auth/store/useUserStore";
import Batch from "@/shared/ui/Batch";
import EditSquareIcon from "@/shared/ui/EditSquareIcon";
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
    <Paper width="read">
      <article className={styles["work-detail"]}>
        {data.assets.length > 0 && (
          <div className={styles["work-detail-assets"]}>
            <AssetCarousel assets={data.assets} />
          </div>
        )}
        <header className={styles["work-detail-header"]}>
          <div className={styles["work-detail-title-row"]}>
            <VisibilityIcon
              visibility={data.visibility}
              className={styles["visibility-icon"]}
            />
            <h1 className={styles["work-detail-title"]}>{data.title}</h1>
          </div>
          {data.tags.length > 0 && (
            <div className={styles["work-detail-tags"]}>
              {data.tags.map((tag) => (
                <Batch key={`${data.id}-${tag.id}`} color="pale">
                  {tag.name}
                </Batch>
              ))}
            </div>
          )}
          <div className={styles["work-detail-author-row"]}>
            <UserButton
              userID={data.user.id}
              displayName={data.user.display_name}
              avatarURL={data.user.avatar_url || undefined}
            />
            {viewerUserID === data.user.id && (
              <Link to={`/edit/${data.id}`} className={styles["edit-link"]}>
                <EditSquareIcon />
                Toyを編集
              </Link>
            )}
          </div>
          <dl className={styles["work-detail-dates"]}>
            <div className={styles["work-detail-date"]}>
              <dt>投稿日</dt>
              <dd>
                <time dateTime={data.created_at}>
                  {formatDateTime(data.created_at)}
                </time>
              </dd>
            </div>
            <div className={styles["work-detail-date"]}>
              <dt>更新日</dt>
              <dd>
                <time dateTime={data.updated_at}>
                  {formatDateTime(data.updated_at)}
                </time>
              </dd>
            </div>
          </dl>
        </header>
        <hr className={styles["work-detail-divider"]} />
        <MarkdownPreview content={data.description} />
      </article>
    </Paper>
  );
};

export default WorkDetail;
