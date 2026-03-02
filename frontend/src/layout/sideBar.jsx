import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-64 bg-gray-900 text-white p-6">
      <h2 className="text-xl font-bold mb-6">Vehicle System</h2>

      <nav className="flex flex-col gap-4">
        <Link to="/spal" className="hover:text-gray-300">Spare parts and lubricants</Link>
        <Link to="/vehicles" className="hover:text-gray-300">Vehicles</Link>
      </nav>
    </div>
  );
}

export default Sidebar;