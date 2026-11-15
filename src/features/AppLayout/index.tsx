import { useLayoutEffect, useRef } from "react";
import { Outlet, useLocation } from "react-router-dom";

import styles from "./index.module.css";

import Footer from "@/features/Footer";
import Header from "@/features/Header";
import { scrollPageToTop } from "@/util/pageScroll";

const AppLayout = () => {
  const { key: locationKey } = useLocation();
  const previousLocationKeyRef = useRef(locationKey);
  useLayoutEffect(() => {
    if (previousLocationKeyRef.current === locationKey) return;
    previousLocationKeyRef.current = locationKey;
    scrollPageToTop();
  }, [locationKey]);

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
