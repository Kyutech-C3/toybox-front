import Batch from "../Batch";
import Avater from "./Avatar";
import styles from "./index.module.css";

type CardProps = {
  title: string;
  username?: string;
  postDate: Date;
  tags: string[];
  avaterURL?: string;
  imageURL?: string;
};

const Card = ({
  title,
  username = "UserName",
  postDate,
  tags,
  avaterURL = "./comingSoonLugia.webp",
  imageURL = "./comingSoonHo-Oh.webp",
}: CardProps) => {
  return (
    <div className={styles["card-wrapper"]}>
      <div className={styles["card-image-wrapper"]}>
        <img src={imageURL} alt="card-image" className={styles["card-image"]} />
        <p className={styles["card-title"]}>{title}</p>
      </div>
      <div className={styles["card-discription-wrapper"]}>
        <div className={styles["card-discription-content"]}>
          <Avater avatarURL={avaterURL} />
          <div className={styles["info-wrapper"]}>
            <p className={styles["card-username"]}>{username}</p>
            <p className={styles["card-postdate"]}>
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
            <Batch key={tag}>{tag}</Batch>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;
