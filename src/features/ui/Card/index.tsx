import Avater from "./Avater";
import Batch from "./Batch";
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
      <img
        src={imageURL}
        width={333}
        height={251}
        className={styles["card-image"]}
      />
      <div className={styles["card-discription-wrapper"]}>
        <div className={styles["card-discription-content"]}>
          <Avater avaterURL={avaterURL} />
          <div>
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
            <Batch>{tag}</Batch>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;
