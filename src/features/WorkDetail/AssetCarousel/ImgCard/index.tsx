import CardWrapper from "../CardWrapper";
import styles from "./index.module.css";

type ImgCardProps = {
  src: string;
  alt?: string;
};

const ImgCard = ({ src, alt }: ImgCardProps) => {
  return (
    <CardWrapper>
      <img src={src} alt={alt} className={styles["card-img"]} />
    </CardWrapper>
  );
};

export default ImgCard;
