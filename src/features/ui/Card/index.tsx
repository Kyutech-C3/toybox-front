import Batch from "./Batch";
import styles from "./index.module.css";

type CardProps = {
  title: string;
  tags: string[];
  avaterURL?: string;
  imageURL?: string;
};

const Card = ({
  title,
  tags,
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
      <div>{title}</div>
      {tags.map((tag) => (
        <Batch>{tag}</Batch>
      ))}
    </div>
  );
};

export default Card;
