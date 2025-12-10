import { useState } from "react";

import styles from "./index.module.css";

import Input from "@/shared/ui/Input";
import Paper from "@/shared/ui/Paper";

const WorkDetailForm = () => {
  const [title, setTitle] = useState("");

  return (
    <Paper>
      <div className={styles["work-detail-form-wrapper"]}>
        <Input heading="タイトル" value={title} onChange={setTitle} />
      </div>
    </Paper>
  );
};

export default WorkDetailForm;
