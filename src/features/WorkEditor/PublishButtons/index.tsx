import { useNavigate } from "react-router-dom";

import { useWorkEditorStore } from "../store/useWorkEditorStore";
import styles from "./index.module.css";
import PublishButton from "./PublishButton";

import DeleteWorkButton from "@/features/WorkDelete/DeleteWorkButton";
import Button from "@/shared/ui/Button";

const PublishButtons = () => {
  const mode = useWorkEditorStore((state) => state.mode);
  const workID = useWorkEditorStore((state) => state.workID);
  const ownerID = useWorkEditorStore((state) => state.ownerID);
  const resetEditor = useWorkEditorStore((state) => state.resetEditor);
  const navigate = useNavigate();

  const handleDeleted = () => {
    resetEditor();
    navigate("/");
  };

  const handleCancel = () => {
    navigate(mode === "edit" && workID ? `/works/${workID}` : "/");
  };

  return (
    <div className={styles["publish-buttons-bar"]}>
      <div className={styles["publish-buttons-wrapper"]}>
        <Button onClick={handleCancel}>キャンセル</Button>
        {mode === "edit" && workID && ownerID && (
          <DeleteWorkButton
            workID={workID}
            ownerID={ownerID}
            onDeleted={handleDeleted}
          />
        )}
        <PublishButton />
      </div>
    </div>
  );
};
export default PublishButtons;
