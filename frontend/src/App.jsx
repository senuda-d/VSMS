// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; 
import './App.css';
import CustomerModule from './pages/CustomerModule';
import VehicleModule from './pages/VehicleModule';
import BookingModule from './pages/BookingModule';
import InventoryModule from './pages/InventoryModule';
import ServiceRecordModule from './pages/ServiceRecordModule';
import BillingModule from './pages/BillingModule';

// The Homepage
const DashboardHome = () => (
  <div className="home-container">
    <h1>Welcome to Vehicle Service Center</h1>
    <p>Select a module from the sidebar to begin.</p>
    <div className="dashboard-stats">
      <div className="stat-card">Total Customers: 142</div>
      <div className="stat-card">Active Bookings: 12</div>
      <div className="stat-card">Pending Bills: 5</div>
    </div>
  </div>
);

// The Sidebar Navigation
const Sidebar = () => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/customers', label: '1. Customer Management' },
    { path: '/vehicles', label: '2. Vehicle Management' },
    { path: '/bookings', label: '3. Service Bookings' },
    { path: '/inventory', label: '4. Inventory' },
    { path: '/records', label: '5. Service Records' },
    { path: '/billing', label: '6. Billing & Invoices' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header"><h2>Service System</h2></div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
};

// Main App Layout
function App() {
  return (
    <Router>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          {/* This makes react-hot-toast work everywhere in your app! */}
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
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