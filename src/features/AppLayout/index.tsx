import { Outlet, useLocation } from "react-router-dom";

import styles from "./index.module.css";

import Header from "@/features/Header";

const AppLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className={styles["layout"]}>
      <Header />
      <main
        key={pathname}
        className={styles["content"]}
        data-page-scroll
        aria-label="ページの本文"
      >
        <div className={styles["page-viewport"]}>
          <div className={styles["page-content"]}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
