import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LightbulbOutlinedIcon from "@mui/icons-material/LightbulbOutlined";
import PriorityHighRoundedIcon from "@mui/icons-material/PriorityHighRounded";
import ReportOutlinedIcon from "@mui/icons-material/ReportOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import styles from "./index.module.css";

import type { ComponentProps } from "react";
import type { ExtraProps } from "react-markdown";

const ALERTS = {
  NOTE: { label: "補足", Icon: InfoOutlinedIcon },
  TIP: { label: "ヒント", Icon: LightbulbOutlinedIcon },
  IMPORTANT: { label: "重要", Icon: PriorityHighRoundedIcon },
  WARNING: { label: "警告", Icon: WarningAmberRoundedIcon },
  CAUTION: { label: "注意", Icon: ReportOutlinedIcon },
};

type MarkdownAlertProps = ComponentProps<"blockquote"> & ExtraProps;

const MarkdownAlert = ({ node, children, ...props }: MarkdownAlertProps) => {
  const type = node?.properties.dataMarkdownAlert;
  if (
    type !== "NOTE" &&
    type !== "TIP" &&
    type !== "IMPORTANT" &&
    type !== "WARNING" &&
    type !== "CAUTION"
  ) {
    return <blockquote {...props}>{children}</blockquote>;
  }
  const { label, Icon } = ALERTS[type];
  return (
    <blockquote
      {...props}
      className={styles["markdown-alert"]}
      data-markdown-alert={type}
    >
      <p className={styles["alert-title"]}>
        <Icon fontSize="small" aria-hidden="true" />
        {label}
      </p>
      {children}
    </blockquote>
  );
};

export default MarkdownAlert;
