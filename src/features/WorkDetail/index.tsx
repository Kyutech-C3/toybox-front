import MarkdownPreview from "../MarkdownPreview";
import AssetCarousel from "./AssetCarousel";
import styles from "./index.module.css";
import ShareButton from "./ShareButton";

import { useUserStore } from "@/features/auth/store/useUserStore";
import FavoriteButton from "@/features/FavoriteButton";
import LinkList from "@/shared/ui/LinkList";
import Paper from "@/shared/ui/Paper";
import TagLinkList from "@/shared/ui/TagLinkList";
import WorkAuthorBar from "@/shared/ui/WorkAuthorBar";
import WorkMetaBar from "@/shared/ui/WorkMetaBar";

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
          <TagLinkList tags={data.tags} />
          <WorkMetaBar
            visibility={data.visibility}
            createdAt={data.created_at}
            updatedAt={data.updated_at}
          />
          <WorkAuthorBar
            userID={data.user.id}
            displayName={data.user.display_name}
            avatarURL={data.user.avatar_url || undefined}
            editPath={
              viewerUserID === data.user.id ? `/edit/${data.id}` : undefined
            }
            actions={
              <>
                <ShareButton title={data.title} />
                <FavoriteButton workID={data.id} isCountVisible />
              </>
            }
          />
        </header>
        <hr className={styles["work-detail-divider"]} />
        <LinkList urls={data.urls} />
        <MarkdownPreview content={data.description} />
      </article>
    </Paper>
  );
};

export default WorkDetail;
