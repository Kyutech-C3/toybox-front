import { useWorkEditorStore } from "../store/useWorkEditorStore";
import { validateWork } from "../validateWork";
import styles from "./index.module.css";

import FieldError from "@/shared/ui/FieldError";

import type { WorkValidationErrors } from "../validateWork";

type ValidationMessageProps = {
  field: keyof WorkValidationErrors;
};

const ValidationMessage = ({ field }: ValidationMessageProps) => {
  const current = useWorkEditorStore((state) => state.current);
  const hasAttemptedSubmit = useWorkEditorStore(
    (state) => state.hasAttemptedSubmit,
  );
  const message = hasAttemptedSubmit ? validateWork(current)[field] : undefined;
  if (!message) return null;
  return (
    <FieldError
      id={`work-error-${field}`}
      className={styles["validation-message"]}
      data-work-validation-error="true"
    >
      {message}
    </FieldError>
  );
};

export default ValidationMessage;
