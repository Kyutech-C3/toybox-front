import AddRoundedIcon from "@mui/icons-material/AddRounded";

import useUrlFields from "./hook/useUrlFields";
import styles from "./index.module.css";
import UrlInputField from "./UrlInputField";

import { MAX_WORK_URL_COUNT } from "@/features/WorkEditor/constants";

type LinkInputProps = {
  urls: string[];
  onChangeUrls: (urls: string[]) => void;
};

const LinkInput = ({ urls, onChangeUrls }: LinkInputProps) => {
  const {
    fields,
    focusFieldID,
    hasReachedUrlLimit,
    handleAddField,
    handleAddFieldAfter,
    handleChangeField,
    handleCommitField,
    handleRemoveField,
    handleRemoveEmptyField,
    handleFocusApplied,
  } = useUrlFields({ urls, onChangeUrls });

  return (
    <div className={styles["link-input"]}>
      <div className={styles["heading-row"]}>
        <h3>リンク</h3>
        <span className={styles["optional-label"]}>オプション</span>
        <button
          type="button"
          className={styles["add-button"]}
          onClick={handleAddField}
          disabled={hasReachedUrlLimit}
          aria-label="リンク入力欄を追加"
        >
          <AddRoundedIcon />
        </button>
        <span className={styles["url-count"]}>
          {fields.length}/{MAX_WORK_URL_COUNT}
        </span>
      </div>
      {fields.length > 0 && (
        <div className={styles["url-fields"]}>
          {fields.map((field, index) => (
            <UrlInputField
              key={field.id}
              index={index}
              value={field.value}
              committedUrl={field.committedUrl}
              error={field.error}
              isFocusRequested={field.id === focusFieldID}
              isRemovable={fields.length > 1}
              hasReachedUrlLimit={hasReachedUrlLimit}
              onChange={(value) => handleChangeField(field.id, value)}
              onCommit={(value) => handleCommitField(field.id, value)}
              onAddAfter={(value) => handleAddFieldAfter(field.id, value)}
              onRemove={() => handleRemoveField(field.id)}
              onRemoveEmpty={(direction) =>
                handleRemoveEmptyField(field.id, direction)
              }
              onFocusApplied={handleFocusApplied}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LinkInput;
