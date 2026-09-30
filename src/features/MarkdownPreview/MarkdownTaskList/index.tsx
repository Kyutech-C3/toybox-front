import { createContext, useContext, useId } from "react";

import type { ComponentProps } from "react";
import type { ExtraProps } from "react-markdown";

const TASK_LABEL_CONTEXT = createContext<string | undefined>(undefined);

type MarkdownListItemProps = ComponentProps<"li"> & ExtraProps;

export const MarkdownListItem = ({ node, ...props }: MarkdownListItemProps) => {
  const generatedID = useId();
  const labelID = props.id ?? generatedID;
  return (
    <TASK_LABEL_CONTEXT.Provider value={labelID}>
      <li {...props} id={labelID} />
    </TASK_LABEL_CONTEXT.Provider>
  );
};

type MarkdownInputProps = ComponentProps<"input"> & ExtraProps;

export const MarkdownInput = ({ node, ...props }: MarkdownInputProps) => {
  const labelID = useContext(TASK_LABEL_CONTEXT);
  return <input {...props} aria-labelledby={labelID} />;
};
