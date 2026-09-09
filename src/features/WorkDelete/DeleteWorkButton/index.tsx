import useDeleteWork from "../hook/useDeleteWork";

import Button from "@/shared/ui/Button";

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
    <Button
      variant="destructive"
      onClick={() => void handleDelete()}
      isDisabled={isDeleting}
    >
      {isDeleting ? "削除中..." : "削除"}
    </Button>
  );
};

export default DeleteWorkButton;
