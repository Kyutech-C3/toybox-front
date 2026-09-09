import { lazy, Suspense } from "react";

import CardWrapper from "../CardWrapper";
import styles from "./index.module.css";
import ModelControlsHelp from "./ModelControlsHelp";

import LoadingSpinner from "@/shared/ui/LoadingSpinner";

const LAZY_MODEL_VIEWER = lazy(() => import("./ModelViewer"));

type ModelCardProps = {
  extension: string;
  isActive: boolean;
  onLoadError: () => void;
  src: string;
};

const LoadingState = () => (
  <div className={styles["loading-state"]}>
    <LoadingSpinner />
  </div>
);

const ModelCard = ({
  extension,
  isActive,
  onLoadError,
  src,
}: ModelCardProps) => {
  return (
    <CardWrapper>
      <div className={styles["model-card"]}>
        {isActive ? (
          <>
            <Suspense fallback={<LoadingState />}>
              <LAZY_MODEL_VIEWER
                extension={extension}
                onLoadError={onLoadError}
                src={src}
              />
            </Suspense>
            <ModelControlsHelp />
          </>
        ) : null}
      </div>
    </CardWrapper>
  );
};

export default ModelCard;
