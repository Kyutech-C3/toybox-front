import { Outlet, useLocation } from "react-router-dom";

import Footer from "./Footer";
import styles from "./index.module.css";

import Header from "@/features/Header";

const AppLayout = () => {
  const { pathname } = useLocation();

  return (
    <div className={styles["layout"]}>
      <Header />
      <div key={pathname} className={styles["content"]} data-page-scroll>
        <div className={styles["page-viewport"]}>
          <div className={styles["page-content"]}>
            <main className={styles["main"]} aria-label="ページの本文">
              <Outlet />
            </main>
            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
