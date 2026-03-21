import { Outlet } from "react-router-dom";
import Navbar from "./navBar";
import "../styles/layout.css";

function MainLayout() {
  return (
    <div className="main-layout">
      <Navbar />

      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;