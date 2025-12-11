import ImageUpload from "./ImageUpload";

import Paper from "@/shared/ui/Paper";

const WorkForm = () => {
  return (
    <Paper>
      <ImageUpload
        onImageSelect={(file: File) => {
          console.log("Selected file:", file);
        }}
      />
    </Paper>
  );
};

export default WorkForm;
