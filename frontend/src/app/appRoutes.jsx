import { Routes, Route } from "react-router-dom";
import MainLayout from "../layout/mainLayout";

import SpalPage from "../pages/SPAL/SPALPage";


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="spal" element={<SpalPage />} />
        
      </Route>
    </Routes>
  );
}

export default AppRoutes;