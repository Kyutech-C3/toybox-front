import Batch from "../Batch";
import Avater from "./Avatar";
import styles from "./index.module.css";

import type { Tag } from "@/shared/types/work";

type CardProps = {
  title: string;
  workID: string;
  postDate: Date;
  tags: Tag[];
  avaterURL?: string;
  imageURL?: string;
};

const Card = ({
  title,
  workID,
  postDate,
  tags,
  avaterURL = "./comingSoonLugia.webp",
  imageURL = "./comingSoonHo-Oh.webp",
}: CardProps) => {
  return (
    <div className={styles["card-wrapper"]}>
      <img src={imageURL} alt="card-image" className={styles["card-image"]} />
      <div className={styles["card-discription-wrapper"]}>
        <div className={styles["card-discription-content"]}>
          <Avater avatarURL={avaterURL} />
          <div className={styles["title-wrapper"]}>
            <p>{title}</p>
            <p>
              {postDate.getFullYear() +
                "/" +
                postDate.getMonth() +
                "/" +
                postDate.getDate()}
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
