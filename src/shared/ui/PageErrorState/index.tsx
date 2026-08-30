import { Link } from "react-router-dom";

import styles from "./index.module.css";

import Button from "@/shared/ui/Button";

type PageErrorButtonAction = {
  id: string;
  label: string;
  onClick: () => void;
  isDisabled?: boolean;
  type: "button";
};

type PageErrorLinkAction = {
  id: string;
  label: string;
  to: string;
  type: "link";
};

export type PageErrorAction = PageErrorButtonAction | PageErrorLinkAction;
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
      <div className={styles["message"]}>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      <div className={styles["actions"]}>
        {actions.map((action) => {
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
            >
              {action.label}
            </Button>
          );
        })}
      </div>
    </section>
  );
};

export default PageErrorState;
