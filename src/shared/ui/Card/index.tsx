import { Link } from "react-router-dom";

import Batch from "../Batch";
import EditSquareIcon from "../EditSquareIcon";
import UserButton from "../UserButton";
import VisibilityIcon from "../VisibilityIcon";
import styles from "./index.module.css";

import type { SyntheticEvent } from "react";
import type { Work } from "@/shared/types/work";

type CardProps = {
  work: Work;
  viewerUserID?: string;
};

const DEFAULT_CARD_IMAGE_URL = "/comingSoonLugia.webp";

const Card = ({ work, viewerUserID }: CardProps) => {
  const isEditable = viewerUserID === work.user.id;

  const handleImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (!image.src.endsWith(DEFAULT_CARD_IMAGE_URL)) {
      image.src = DEFAULT_CARD_IMAGE_URL;
    }
  };

  return (
    <article className={styles["card-wrapper"]}>
      <Link
        to={`/work/${work.id}`}
        className={styles["work-link"]}
        aria-label={`${work.title}の作品ページを開く`}
      >
        <div className={styles["card-image-wrapper"]}>
          <img
            src={work.thumbnail_url || DEFAULT_CARD_IMAGE_URL}
            alt={`${work.title}のサムネイル`}
            className={styles["card-image"]}
            onError={handleImageError}
          />
        </div>
      </Link>
      <div className={styles["card-body"]}>
        <div className={styles["card-title-row"]}>
          <h3 className={styles["card-title"]} title={work.title}>
            {work.title}
          </h3>
          <VisibilityIcon
            visibility={work.visibility}
            className={styles["visibility-icon"]}
          />
        </div>
        <div className={styles["card-tags"]}>
          {work.tags.map((tag) => (
            <Batch key={`${work.id}-${tag.id}`} color="pale">
              {tag.name}
            </Batch>
          ))}
        </div>
        <div className={styles["card-footer"]}>
          <UserButton
            userID={work.user.id}
            displayName={work.user.display_name}
            avatarURL={work.user.avatar_url || undefined}
            size="compact"
          />
          {isEditable && (
            <Link
              to={`/edit/${work.id}`}
              className={styles["edit-link"]}
              aria-label={`${work.title}を編集する`}
              title="編集する"
            >
              <EditSquareIcon />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
};

export default Card;
