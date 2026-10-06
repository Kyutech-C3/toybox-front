import { Link } from "react-router-dom";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";
import PageMetadata from "@/shared/ui/PageMetadata";

import type { ReactNode } from "react";

type PageErrorButtonAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  type: "button";
};

type PageErrorAnchorAction = {
  href: string;
  id: string;
  label: string;
  type: "anchor";
};

type PageErrorLinkAction = {
  id: string;
  label: string;
  to: string;
  type: "link";
};

export type PageErrorAction =
  | PageErrorAnchorAction
  | PageErrorButtonAction
  | PageErrorLinkAction;
export type PageErrorStateLayout = "page" | "section";

type PageErrorStateProps = {
  title: string;
  description?: string;
  actions: PageErrorAction[];
  layout?: PageErrorStateLayout;
};

const PageErrorState = ({
  title,
  description,
  actions,
  layout = "page",
}: PageErrorStateProps) => {
  return (
    <section className={styles["page-error"]} data-layout={layout} role="alert">
      {layout === "page" && (
        <PageMetadata title={title} description={description ?? title} />
      )}
      <div className={styles["message"]}>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className={styles["actions"]}>
        {actions.map((action) => {
          if (action.type === "anchor") {
            return (
              <a
                key={action.id}
                className={styles["link-action"]}
                href={action.href}
              >
                {action.label}
              </a>
            );
          }

          if (action.type === "link") {
            return (
              <Link
                key={action.id}
                className={styles["link-action"]}
                to={action.to}
              >
                {action.label}
              </Link>
            );
          }

          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              isDisabled={action.isDisabled}
              isLoading={action.isLoading}
            >
              <span className={styles["action-label"]}>
                {!action.isLoading && action.icon}
                {action.label}
              </span>
            </Button>
          );
        })}
      </div>
    </section>
  );
};

export default PageErrorState;
