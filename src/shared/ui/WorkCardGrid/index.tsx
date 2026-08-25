import styles from "./index.module.css";

import Card from "@/shared/ui/Card";

import type { Work } from "@/shared/types/work";

type WorkCardGridProps = {
  works: Work[];
  viewerUserID?: string;
};

const WorkCardGrid = ({ works, viewerUserID }: WorkCardGridProps) => {
  return (
    <div className={styles["work-card-grid"]}>
      {works.map((work) => (
        <Card key={work.id} work={work} viewerUserID={viewerUserID} />
      ))}
    </div>
  );
};

export default WorkCardGrid;
