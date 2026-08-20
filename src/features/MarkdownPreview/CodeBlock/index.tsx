import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { prism as style } from "react-syntax-highlighter/dist/esm/styles/prism";

import styles from "./index.module.css";

type CodeBlockProps = {
  language: string;
  children: string;
};

const CodeBlock = ({ language, children }: CodeBlockProps) => {
  const [isCopied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles["code-block-container"]}>
      <button
        type="button"
        className={styles["copy-button"]}
        onClick={handleCopy}
        aria-label="コードをコピー"
      >
        {isCopied ? (
          <CheckIcon fontSize="small" />
        ) : (
          <ContentCopyIcon fontSize="small" />
        )}
      </button>
      <SyntaxHighlighter PreTag="div" language={language} style={style}>
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
