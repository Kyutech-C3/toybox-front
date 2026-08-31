import styles from "./index.module.css";

type MovieCardProps = {
  src: string;
  extension: string;
  onLoadError?: () => void;
};

const MovieCard = ({ src, extension, onLoadError }: MovieCardProps) => {
  const getVideoMimeType = (extension: string): string => {
    switch (extension) {
      case "mp4":
        return "video/mp4";
      case "mov":
        return "video/quicktime";
      case "avi":
        return "video/x-msvideo";
      case "flv":
        return "video/x-flv";
      case "webm":
        return "video/webm";
      default:
        return "video/mp4";
    }
  };

  return (
    <video controls className={styles["card-movie"]}>
      <source
        src={src}
        type={getVideoMimeType(extension)}
        onError={onLoadError}
      />
      <track kind="captions" srcLang="jp" label="Japanese" />
    </video>
  );
};
export default MovieCard;
