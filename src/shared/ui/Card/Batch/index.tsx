import styles from "./index.module.css";

import type { ReactNode } from "react";

type BatchProps = {
	children: ReactNode;
};

const Batch = ({ children }: BatchProps) => {
	return <span className={styles.batch}>{children}</span>;
};

export default Batch;
