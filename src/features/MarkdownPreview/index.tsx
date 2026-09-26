import { createContext, useContext, useId } from "react";
import Markdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

import CodeBlock from "./CodeBlock";
import styles from "./index.module.css";

import type { ComponentProps } from "react";
import type { ExtraProps } from "react-markdown";

const TASK_LABEL_CONTEXT = createContext<string | undefined>(undefined);

type MarkdownListItemProps = ComponentProps<"li"> & ExtraProps;

const MarkdownListItem = ({ node, ...props }: MarkdownListItemProps) => {
  const labelID = useId();
  return (
    <TASK_LABEL_CONTEXT.Provider value={labelID}>
      <li {...props} id={labelID} />
    </TASK_LABEL_CONTEXT.Provider>
  );
};

type MarkdownInputProps = ComponentProps<"input"> & ExtraProps;

const MarkdownInput = ({ node, ...props }: MarkdownInputProps) => {
  const labelID = useContext(TASK_LABEL_CONTEXT);
  return <input {...props} aria-labelledby={labelID} />;
};

interface MarkdownPreviewProps {
  content: string;
}

const MarkdownPreview = ({ content }: MarkdownPreviewProps) => {
  return (
    <div className={styles["markdown-preview"]}>
      <Markdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          li: MarkdownListItem,
          input: MarkdownInput,
          code(props) {
            const { children, className, ...rest } = props;
            const match = /language-(\w+)/.exec(className || "");
            return match ? (
              <CodeBlock language={match[1]}>
                {String(children).replace(/\n$/, "")}
              </CodeBlock>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
};

export default MarkdownPreview;
