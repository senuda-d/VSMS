import React from 'react';
import '../../styles/DashboardModule.css';

const DashboardModule = () => {
  return (
    <div className="dashboard-module">
      <div className="module-header">
        <h2>Dashboard</h2>
      </div>
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Customers</h3>
          <p className="stat-number">142</p>
        </div>
        <div className="stat-card">
          <h3>Active Bookings</h3>
          <p className="stat-number">12</p>
        </div>
        <div className="stat-card">
          <h3>Pending Bills</h3>
          <p className="stat-number">5</p>
        </div>
        <div className="stat-card">
          <h3>Monthly Revenue</h3>
          <p className="stat-number">150,000 LKR</p>
        </div>
      </div>
      <div className="dashboard-content">
        <div className="content-card">
          <h3>Recent Activities</h3>
          <p>Coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;
