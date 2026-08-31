import { Route, Routes } from "react-router-dom";
import "./App.css";

import EditPage from "@/pages/EditPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TopPage from "@/pages/TopPage";
import UserPage from "@/pages/UserPage";
import WorkPage from "@/pages/WorkPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<TopPage />} />
      <Route path="/work/:id" element={<WorkPage />} />
      <Route path="/user/:id" element={<UserPage />} />
      <Route path="/edit/new" element={<EditPage isNewWork />} />
      <Route path="/edit/:id" element={<EditPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
