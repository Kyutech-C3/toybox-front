import { useWorkEditorStore } from "../store/useWorkEditorStore";
import useWorkTags from "./hook/useWorkTags";
import styles from "./index.module.css";

import AssetUpload from "@/features/WorkEditor/WorkDetailForm/AssetUpload";
import ImageUpload from "@/features/WorkEditor/WorkDetailForm/ImageUpload";
import LinkInput from "@/features/WorkEditor/WorkDetailForm/LinkInput";
import Input from "@/shared/ui/Input";
import Paper from "@/shared/ui/Paper";
import TagInput from "@/shared/ui/TagInput";

const WorkDetailForm = () => {
  const title = useWorkEditorStore((state) => state.current.title);
  const urls = useWorkEditorStore((state) => state.current.urls);
  const setTitle = useWorkEditorStore((state) => state.setTitle);
  const setUrls = useWorkEditorStore((state) => state.setUrls);
  const {
    tags,
    allTagOptions,
    failedTags,
    retryingTags,
    tagError,
    handleAddTag,
    handleRemoveTag,
    handleRetryTag,
    handleRemoveFailedTag,
  } = useWorkTags();

  return (
    <Paper>
      <div className={styles["work-detail-form-wrapper"]}>
        <ImageUpload />
        <AssetUpload />
        <Input heading="タイトル" value={title} onChange={setTitle} />
        <TagInput
          heading="タグ"
          tags={tags}
          failedTags={failedTags}
          retryingTags={retryingTags}
          errorMessage={tagError}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          onRetryTag={handleRetryTag}
          onRemoveFailedTag={handleRemoveFailedTag}
          allTagOptions={allTagOptions}
        />
        <LinkInput urls={urls} onChangeUrls={setUrls} />
      </div>
    </Paper>
  );
};

export default WorkDetailForm;
