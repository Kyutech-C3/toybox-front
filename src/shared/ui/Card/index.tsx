import Avatar from "../Avatar";
import Batch from "../Batch";
import styles from "./index.module.css";

import type { Tag } from "@/shared/types/work";

type CardProps = {
  title: string;
  workID: string;
  username?: string;
  postDate: Date;
  tags: Tag[];
  avatarURL?: string;
  imageURL?: string;
};

const Card = ({
  title,
  workID,
  username = "UserName",
  postDate,
  tags,
  avatarURL = "./comingSoonLugia.webp",
  imageURL = "./comingSoonHo-Oh.webp",
}: CardProps) => {
  const pad = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className={styles["card-wrapper"]}>
      <div className={styles["card-image-wrapper"]}>
        <img src={imageURL} alt="card-image" className={styles["card-image"]} />
        <p className={styles["card-title"]}>{title}</p>
      </div>
      <div className={styles["card-discription-wrapper"]}>
        <div className={styles["card-discription-content"]}>
          <Avatar avatarURL={avatarURL} />
          <div className={styles["info-wrapper"]}>
            <p className={styles["card-username"]}>{username}</p>
            <p className={styles["card-postdate"]}>
              {postDate.getFullYear() +
                "/" +
                pad(postDate.getMonth() + 1) +
                "/" +
                pad(postDate.getDate()) +
                " " +
                pad(postDate.getHours()) +
                ":" +
                pad(postDate.getMinutes())}
            </p>
          </div>
        </div>
        <div className={styles["batches-wrapper"]}>
          {tags.map((tag) => (
            <Batch key={`${workID}-${tag.id}`}>{tag.name}</Batch>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;
