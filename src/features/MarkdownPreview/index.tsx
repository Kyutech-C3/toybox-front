import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import styles from "./index.module.css";

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  return (
    <div className={styles.markdownPreview}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
};

export default MarkdownPreview;
