// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import { 
  LayoutDashboard, 
  Users, 
  Car, 
  CalendarClock, 
  Package, 
  FileText, 
  Receipt,
  LogOut
} from 'lucide-react';
import '../src/styles/App.css';
import '../src/styles/index.css';

import CustomerModule from './pages/customerManagement/CustomerModule';
import VehicleModule from './pages/vehicalManagement/VehicleModule';
import BookingModule from './pages/serviceBookings/BookingModule';
import InventoryModule from './pages/SPAL/InventoryModule';
import ServiceRecordModule from './pages/serviceRecord/ServiceRecordModule';
import BillingModule from './pages/billing/BillingModule';
import DashboardModule from './pages/dashboard/DashboardModule';

import logoImg from './assets/logo.png';

const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/customers', label: 'Customers', icon: <Users size={20} /> },
    { path: '/vehicles', label: 'Vehicles', icon: <Car size={20} /> },
    { path: '/bookings', label: 'Bookings', icon: <CalendarClock size={20} /> },
    { path: '/inventory', label: 'Inventory', icon: <Package size={20} /> },
    { path: '/records', label: 'Service Logs', icon: <FileText size={20} /> },
    { path: '/billing', label: 'Billing', icon: <Receipt size={20} /> }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={logoImg} alt="VSMS" className="sidebar-logo" />
        <div className="brand-text">
          <span className="brand-name">VSMS</span>
          <span className="brand-sub">Enterprise</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="logout-btn">
          <LogOut size={18} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<DashboardModule />} />
              <Route path="/customers" element={<CustomerModule />} />
              <Route path="/vehicles" element={<VehicleModule />} />
              <Route path="/bookings" element={<BookingModule />} />
              <Route path="/inventory" element={<InventoryModule />} />             
              <Route path="/records" element={<ServiceRecordModule />} />
              <Route path="/billing" element={<BillingModule />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;