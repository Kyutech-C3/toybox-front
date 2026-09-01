import CardWrapper from "../CardWrapper";
import styles from "./index.module.css";

type ImgCardProps = {
  src: string;
  alt?: string;
  onLoadError?: () => void;
};

const ImgCard = ({ src, alt, onLoadError }: ImgCardProps) => {
  return (
    <CardWrapper>
      <img
        src={src}
        alt={alt}
        className={styles["card-img"]}
        onError={onLoadError}
      />
    </CardWrapper>
  );
};

export default ImgCard;
