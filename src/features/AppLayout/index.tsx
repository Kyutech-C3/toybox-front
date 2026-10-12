import { Outlet } from "react-router-dom";

import styles from "./index.module.css";

import Footer from "@/features/Footer";
import Header from "@/features/Header";

const AppLayout = () => {
  return (
    <div className={styles["layout"]}>
      <Header />
      <main className={styles["main"]} aria-label="ページの本文">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default AppLayout;
