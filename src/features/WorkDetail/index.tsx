import MarkdownPreview from "../MarkdownPreview";
import AssetCarousel from "./AssetCarousel";
import useWorkDetail from "./hooks/useWorkDetail";
import styles from "./index.module.css";

import Avater from "@/shared/ui/Avatar";
import Batch from "@/shared/ui/Batch";
import Paper from "@/shared/ui/Paper";

type WorkDetailProps = {
  workID: string;
};

const WorkDetail = ({ workID }: WorkDetailProps) => {
  const { data, error } = useWorkDetail(workID);

  if (error) {
    return <div>エラー: {error.message}</div>;
  }

  if (!data) {
    return <div>データがありません</div>;
  }
  console.log(data.assets);
  return (
    <Paper>
      <h1>{data.title}</h1>
      <div className={styles["work-detail-metadata"]}>
        <Batch>{data.visibility}</Batch>
      </div>
      <AssetCarousel assets={data.assets} />
      <div className={styles["work-detail-info"]}>
        <div className={styles["user-info-wrapper"]}>
          <Avater avatarURL={data.user.avatar_url} />
          <p>{data.user.display_name}</p>
        </div>
        <div className={styles["batches-wrapper"]}>
          {data.tags.map((tag) => (
            <Batch key={`${data.id}-${tag.id}`}>{tag.name}</Batch>
          ))}
        </div>
        <div className={styles["info-wrapper"]}>
          <p className={styles["work-postdate"]}>
            投稿日：
            {new Date(data.created_at).getFullYear() +
              "/" +
              new Date(data.created_at).getMonth() +
              "/" +
              new Date(data.created_at).getDate() +
              " " +
              new Date(data.created_at).getHours() +
              ":" +
              new Date(data.created_at).getMinutes()}
          </p>
          <p className={styles["work-postdate"]}>
            更新日：
            {new Date(data.updated_at).getFullYear() +
              "/" +
              new Date(data.updated_at).getMonth() +
              "/" +
              new Date(data.updated_at).getDate() +
              " " +
              new Date(data.updated_at).getHours() +
              ":" +
              new Date(data.updated_at).getMinutes()}
          </p>
        </div>
      </div>
      <hr />
      <MarkdownPreview content={data.description} />
    </Paper>
  );
};

export default WorkDetail;
