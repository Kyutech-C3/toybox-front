import { useId, useRef, useState } from "react";

import Button from "@/shared/ui/Button";
import EditSquareIcon from "@/shared/ui/EditSquareIcon";
import Listbox from "@/shared/ui/Listbox";

type ImageEditButtonProps = {
  ariaLabel: string;
  onEdit: () => void;
  onSelectPhoto: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  className?: string;
};

const IMAGE_ACTIONS = [
  { id: "edit", value: "edit", label: "編集" },
  { id: "select", value: "select", label: "写真を選択" },
];

const ImageEditButton = ({
  ariaLabel,
  onEdit,
  onSelectPhoto,
  isDisabled = false,
  isLoading = false,
  className,
}: ImageEditButtonProps) => {
  const menuID = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={className}>
      <Button
        ref={triggerRef}
        variant="secondary"
        size="small"
        isIconOnly
        icon={<EditSquareIcon />}
        ariaLabel={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuID : undefined}
        onClick={() => setIsOpen((value) => !value)}
        isDisabled={isDisabled}
        isLoading={isLoading}
      />
      <Listbox
        id={menuID}
        isOpen={isOpen && !isDisabled && !isLoading}
        options={IMAGE_ACTIONS}
        triggerRef={triggerRef}
        ariaLabel={ariaLabel}
        placement="bottom"
        align="start"
        onClose={() => setIsOpen(false)}
        onSelect={(value) => {
          if (value === "edit") onEdit();
          else onSelectPhoto();
        }}
      />
    </div>
  );
};

export default ImageEditButton;
