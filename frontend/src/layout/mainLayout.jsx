import { Outlet } from "react-router-dom";
import Navbar from "./navBar";
import "../styles/layout.css";

function MainLayout() {
  return (
    <div className="main-layout d-flex">
      

      <div className="content-area">
        <Navbar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;