import styles from "./index.module.css";

type MovieCardProps = {
  src: string;
  extension: string;
};

const MovieCard = ({ src, extension }: MovieCardProps) => {
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
  console.log(`Rendering video with src: ${src} and extension: ${extension}`);

  return (
    <video controls className={styles["movie-card"]}>
      <source src={src} type={getVideoMimeType(extension)} />
      <track kind="captions" srcLang="jp" label="Japanese" />
    </video>
  );
};
export default MovieCard;
