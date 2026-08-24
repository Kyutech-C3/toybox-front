import { Link } from "react-router-dom";

import MarkdownPreview from "../MarkdownPreview";
import AssetCarousel from "./AssetCarousel";
import useWorkDetail from "./hook/useWorkDetail";
import styles from "./index.module.css";

import Avatar from "@/shared/ui/Avatar";
import Batch from "@/shared/ui/Batch";
import Paper from "@/shared/ui/Paper";
import { formatDateTime } from "@/util/formatDateTime";

type WorkDetailProps = {
  workID: string;
};

const WorkDetail = ({ workID }: WorkDetailProps) => {
  const { data, error } = useWorkDetail({ id: workID });

  if (error) {
    return <div>エラー: {error.message}</div>;
  }

  if (!data) {
    return <div>データがありません</div>;
  }
  return (
    <Paper>
      <h1>{data.title}</h1>
      <div className={styles["work-detail-metadata"]}>
        <Batch>{data.visibility}</Batch>
      </div>
      <AssetCarousel assets={data.assets} />
      <div className={styles["work-detail-info"]}>
        <Link
          to={`/user/${data.user.id}`}
          className={styles["user-info-wrapper"]}
          aria-label={`${data.user.display_name}のユーザーページを開く`}
        >
          <Avatar
            avatarURL={data.user.avatar_url || undefined}
            alt={`${data.user.display_name}のアバター`}
          />
          <p>{data.user.display_name}</p>
        </Link>
        <div className={styles["batches-wrapper"]}>
          {data.tags.map((tag) => (
            <Batch key={`${data.id}-${tag.id}`}>{tag.name}</Batch>
          ))}
        </div>
        <div className={styles["info-wrapper"]}>
          <p className={styles["work-postdate"]}>
            投稿日 {formatDateTime(data.created_at)}
          </p>
          <p className={styles["work-postdate"]}>
            更新日 {formatDateTime(data.updated_at)}
          </p>
        </div>
      </div>
      <hr />
      <MarkdownPreview content={data.description} />
    </Paper>
  );
};

export default WorkDetail;
