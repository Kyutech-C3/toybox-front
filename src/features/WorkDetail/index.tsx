import MarkdownPreview from "../MarkdownPreview";
import AssetCarousel from "./AssetCarousel";
import useWorkDetail from "./hook/useWorkDetail";
import styles from "./index.module.css";

import Batch from "@/shared/ui/Batch";
import Paper from "@/shared/ui/Paper";
import UserButton from "@/shared/ui/UserButton";
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
        <UserButton
          userID={data.user.id}
          displayName={data.user.display_name}
          avatarURL={data.user.avatar_url || undefined}
        />
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
