import Batch from "../Batch";
import Avater from "./Avatar";
import styles from "./index.module.css";

type CardProps = {
  title: string;
  postDate: Date;
  tags: string[];
  avaterURL?: string;
  imageURL?: string;
};

const Card = ({
  title,
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
            <Batch key={tag}>{tag}</Batch>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;
