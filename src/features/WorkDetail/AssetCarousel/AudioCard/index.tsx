import styles from "./index.module.css";

type AudioCardProps = {
  src: string;
  extension: string;
};

const AudioCard = ({ src, extension }: AudioCardProps) => {
  const getAudioMimeType = (extension: string): string => {
    switch (extension) {
      case "mp3":
        return "audio/mpeg";
      case "wav":
        return "audio/wav";
      case "m4a":
        return "audio/mp4";
      case "ogg":
        return "audio/ogg";
      case "aac":
        return "audio/aac";
      default:
        return "audio/mpeg";
    }
  };
  return (
    <div className={styles["card-audio"]}>
      <audio controls>
        <source src={src} type={getAudioMimeType(extension)} />
        <track kind="captions" srcLang="jp" label="Japanese" />
      </audio>
    </div>
  );
};

export default AudioCard;
