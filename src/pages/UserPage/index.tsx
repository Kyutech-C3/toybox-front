import { useParams } from "react-router-dom";

import styles from "./index.module.css";

import Header from "@/features/Header";
import UserPortfolio from "@/features/UserPortfolio";

const UserPage = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <>
      <Header />
      {id ? (
        <UserPortfolio userID={id} />
      ) : (
        <main className={styles["page-status"]}>
          <h1>ユーザーが見つかりません</h1>
        </main>
      )}
    </>
  );
};

export default UserPage;
