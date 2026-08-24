import { Link } from "react-router-dom";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";

import Avatar from "../Avatar";
import Batch from "../Batch";
import styles from "./index.module.css";

import { formatDateTime } from "@/util/formatDateTime";

import type { Tag } from "@/shared/types/work";

type CardProps = {
  title: string;
  workID: string;
  userID: string;
  username?: string;
  postDate: Date;
  tags: Tag[];
  avatarURL?: string;
  imageURL?: string;
  visibility?: "public" | "private" | "draft";
  isEditable?: boolean;
};

const Card = ({
  title,
  workID,
  userID,
  username = "UserName",
  postDate,
  tags,
  avatarURL = "./comingSoonLugia.webp",
  imageURL = "./comingSoonHo-Oh.webp",
  visibility = "public",
  isEditable = false,
}: CardProps) => {
  return (
    <article className={styles["card-wrapper"]}>
      <Link
        to={`/work/${workID}`}
        className={styles["work-link"]}
        aria-label={`${title}の作品ページを開く`}
      >
        <div className={styles["card-image-wrapper"]}>
          <img
            src={imageURL}
            alt={`${title}のサムネイル`}
            className={styles["card-image"]}
          />
          <p className={styles["card-title"]}>{title}</p>
        </div>
      </Link>
      <div className={styles["card-actions"]}>
        <span className={styles["visibility-label"]}>
          {visibility === "public" && (
            <PublicRoundedIcon fontSize="small" aria-hidden="true" />
          )}
          {visibility === "private" && (
            <LockRoundedIcon fontSize="small" aria-hidden="true" />
          )}
          {visibility === "draft" && (
            <EditNoteRoundedIcon fontSize="small" aria-hidden="true" />
          )}
          {visibility}
        </span>
        {isEditable && (
          <Link to={`/edit/${workID}`} className={styles["edit-link"]}>
            編集
          </Link>
        )}
      </div>
      <div className={styles["card-discription-wrapper"]}>
        <Link
          to={`/user/${userID}`}
          className={styles["card-discription-content"]}
          aria-label={`${username}のユーザーページを開く`}
        >
          <Avatar avatarURL={avatarURL} alt={`${username}のアバター`} />
          <div className={styles["info-wrapper"]}>
            <p className={styles["card-username"]}>{username}</p>
            <p className={styles["card-postdate"]}>
              {formatDateTime(postDate)}
            </p>
          </div>
        </Link>
        <div className={styles["batches-wrapper"]}>
          {tags.map((tag) => (
            <Batch key={`${workID}-${tag.id}`}>{tag.name}</Batch>
          ))}
        </div>
      </div>
    </article>
  );
};

export default Card;
