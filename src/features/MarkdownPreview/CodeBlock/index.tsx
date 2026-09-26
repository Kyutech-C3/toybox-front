import { useState, useSyncExternalStore } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import {
  coldarkCold,
  vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import { copyTextToClipboard } from "@/util/copyTextToClipboard";
import { getCurrentTheme, subscribeTheme } from "@/util/theme";

type CodeBlockProps = {
  language: string;
  children: string;
};

const CodeBlock = ({ language, children }: CodeBlockProps) => {
  const [isCopied, setCopied] = useState(false);
  const theme = useSyncExternalStore(subscribeTheme, getCurrentTheme);

  const handleCopy = async () => {
    const didCopy = await copyTextToClipboard(children);
    if (!didCopy) return;

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles["code-block-container"]}>
      <Button
        size="compact"
        isIconOnly
        className={styles["copy-button"]}
        onClick={handleCopy}
        aria-label="コードをコピー"
        icon={isCopied ? <CheckIcon /> : <ContentCopyIcon />}
      />
      <SyntaxHighlighter
        PreTag="div"
        language={language}
        style={theme === "dark" ? vscDarkPlus : coldarkCold}
        codeTagProps={{
          style: {
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "inherit",
          },
        }}
        customStyle={{
          fontFamily: "inherit",
          fontSize: "inherit",
          lineHeight: "inherit",
          background: "var(--code-block-background-color)",
          backgroundColor: "var(--code-block-background-color)",
          border: "none",
          padding: 0,
          margin: 0,
          overflow: "visible",
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlock;
