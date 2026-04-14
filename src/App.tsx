import { Route, Routes } from "react-router-dom";
import "./App.css";

import AuthPage from "@/pages/AuthPage";
import EditPage from "@/pages/EditPage";
import TopPage from "@/pages/TopPage";
import UserPage from "@/pages/UserPage";
import WorkPage from "@/pages/WorkPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<TopPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/work/:id" element={<WorkPage />} />
      <Route path="/user/:id" element={<UserPage />} />
      <Route path="/edit/:id" element={<EditPage />} />
    </Routes>
  );
}

export default App;
