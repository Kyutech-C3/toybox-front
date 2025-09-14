import { Route, Routes } from "react-router-dom";
import "./App.css";

import TopPage from "@/pages/TopPage";

function App() {
	return (
		<Routes>
			<Route path="/" element={<TopPage />} />
		</Routes>
	);
}

export default App;
