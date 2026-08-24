import { Route, Routes } from "react-router-dom";
import "./App.css";

import ProtectedRoute from "@/features/auth/ProtectedRoute";
import EditPage from "@/pages/EditPage";
import TopPage from "@/pages/TopPage";
import UserPage from "@/pages/UserPage";
import WorkPage from "@/pages/WorkPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<TopPage />} />
      <Route path="/work/:id" element={<WorkPage />} />
      <Route path="/user/:id" element={<UserPage />} />
      <Route
        path="/edit/new"
        element={
          <ProtectedRoute>
            <EditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit/:id"
        element={
          <ProtectedRoute>
            <EditPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
