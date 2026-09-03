import useWorkGridColumns from "./hook/useWorkGridColumns";
import styles from "./index.module.css";

import Card from "@/shared/ui/Card";

import type { CSSProperties, ReactNode } from "react";
import type { Work } from "@/shared/types/work";

type WorkCardGridProps = {
  works: Work[];
  viewerUserID?: string;
  renderFavoriteButton?: (work: Work) => ReactNode;
};

const WorkCardGrid = ({
  works,
  viewerUserID,
  renderFavoriteButton,
}: WorkCardGridProps) => {
  const { columns } = useWorkGridColumns();
  const gridStyle = {
    "--work-card-columns": String(columns),
  } as CSSProperties;

  return (
    <div className={styles["work-card-grid"]} style={gridStyle}>
      {works.map((work) => (
        <Card
          key={work.id}
          work={work}
          viewerUserID={viewerUserID}
          favoriteButton={renderFavoriteButton?.(work)}
        />
      ))}
    </div>
  );
};

export default WorkCardGrid;

export { default as useWorkGridColumns } from "./hook/useWorkGridColumns";
export { default as useWorkGridPageSize } from "./hook/useWorkGridPageSize";
