import { Link } from "react-router-dom";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";

import Batch from "../Batch";
import UserButton from "../UserButton";
import styles from "./index.module.css";

import { formatDateTime } from "@/util/formatDateTime";

import type { SyntheticEvent } from "react";
import type { Work } from "@/shared/types/work";

type CardProps = {
  work: Work;
  viewerUserID?: string;
};

const DEFAULT_CARD_IMAGE_URL = "/comingSoonLugia.webp";

const Card = ({ work, viewerUserID }: CardProps) => {
  const isEditable = viewerUserID === work.user.id;
  const displayTitle =
    work.title.length > 12 ? `${work.title.slice(0, 12)}...` : work.title;

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
          <p className={styles["card-title"]}>{displayTitle}</p>
        </div>
      </Link>
      <div className={styles["card-actions"]}>
        <span className={styles["visibility-label"]}>
          {work.visibility === "public" && (
            <PublicRoundedIcon fontSize="small" aria-hidden="true" />
          )}
          {work.visibility === "private" && (
            <LockRoundedIcon fontSize="small" aria-hidden="true" />
          )}
          {work.visibility === "draft" && (
            <EditNoteRoundedIcon fontSize="small" aria-hidden="true" />
          )}
          {work.visibility}
        </span>
        {isEditable && (
          <Link to={`/edit/${work.id}`} className={styles["edit-link"]}>
            編集
          </Link>
        )}
      </div>
      <div className={styles["card-discription-wrapper"]}>
        <UserButton
          userID={work.user.id}
          displayName={work.user.display_name}
          avatarURL={work.user.avatar_url || undefined}
        />
        <p className={styles["card-postdate"]}>
          {formatDateTime(new Date(work.created_at))}
        </p>
        <div className={styles["batches-wrapper"]}>
          {work.tags.map((tag) => (
            <Batch key={`${work.id}-${tag.id}`}>{tag.name}</Batch>
          ))}
        </div>
      </div>
    </article>
  );
};

export default Card;
