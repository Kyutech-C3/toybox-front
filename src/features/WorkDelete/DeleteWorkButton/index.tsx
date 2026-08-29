import useDeleteWork from "../hook/useDeleteWork";
import styles from "./index.module.css";

type DeleteWorkButtonProps = {
  workID: string;
  ownerID: string;
  onDeleted?: () => void;
};

const DeleteWorkButton = ({
  workID,
  ownerID,
  onDeleted,
}: DeleteWorkButtonProps) => {
  const { canDelete, isDeleting, handleDelete } = useDeleteWork({
    workID,
    ownerID,
    onDeleted,
  });

  if (!canDelete) return null;

  return (
    <button
      type="button"
      className={styles["delete-work-button"]}
      onClick={() => void handleDelete()}
      disabled={isDeleting}
      data-disabled={isDeleting ? "true" : "false"}
    >
      {isDeleting ? "削除中..." : "削除"}
    </button>
  );
};

export default DeleteWorkButton;
