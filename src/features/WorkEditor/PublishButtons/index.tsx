import DraftToggleButton from "./DraftToggleButton";
import styles from "./index.module.css";
import PublishButton from "./PublishButton";

const PublishButtons = () => {
  return (
    <div className={styles["publish-buttons-wrapper"]}>
      <DraftToggleButton />
      <PublishButton />
    </div>
  );
};
export default PublishButtons;
