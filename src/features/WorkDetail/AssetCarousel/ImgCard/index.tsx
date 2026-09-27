import CardWrapper from "../CardWrapper";
import styles from "./index.module.css";

import LoadingImage from "@/shared/ui/LoadingImage";

type ImgCardProps = {
  src: string;
  alt?: string;
  onLoadError?: () => void;
};

const ImgCard = ({ src, alt, onLoadError }: ImgCardProps) => {
  return (
    <CardWrapper>
      <LoadingImage
        src={src}
        alt={alt}
        loading="lazy"
        className={styles["card-img"]}
        onError={onLoadError}
      />
    </CardWrapper>
  );
};

export default ImgCard;
