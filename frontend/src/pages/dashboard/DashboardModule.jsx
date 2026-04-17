import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Package,
  ChevronRight
} from 'lucide-react';
import '../../styles/DashboardModule.css';
import heroImg from '../../assets/hero.png';

const DashboardModule = () => {
  const [stats, setStats] = useState({
    customers: 0,
    bookings: 0,
    pendingBills: 0,
    revenue: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [custRes, bookRes, billRes, invRes] = await Promise.all([
          axios.get('http://localhost:5000/api/customers'),
          axios.get('http://localhost:5000/api/bookings'),
          axios.get('http://localhost:5000/api/bills'),
          axios.get('http://localhost:5000/api/inventory')
        ]);

        const customersCount = custRes.data.length;
        const todayDate = new Date().toLocaleDateString('en-CA');
        const bookingsCount = bookRes.data.filter(b => b.status === 'Pending' && b.date >= todayDate).length;
        const pendingBillsCount = billRes.data.filter(b => b.status === 'Draft').length;
        const totalRevenue = billRes.data
          .filter(b => b.status === 'Finalized')
          .reduce((sum, b) => sum + (b.grandTotal || 0), 0);

        setStats({
          customers: customersCount,
          bookings: bookingsCount,
          pendingBills: pendingBillsCount,
          revenue: totalRevenue
        });

        const lowStock = invRes.data.filter(item => 
          item.quantityInStock <= item.reorderLevel
        );
        setLowStockItems(lowStock);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="dashboard-module fade-in">
      <div className="dashboard-hero">
        <img src={heroImg} alt="Workshop" className="hero-image" />
        <div className="hero-content">
          <h1>Service Management Console</h1>
          <p>Precision monitoring and operational control for your service center.</p>
        </div>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card-industrial">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-data">
            <h3>Total Customers</h3>
            <p className="stat-number">{stats.customers}</p>
          </div>
        </div>
        <div className="stat-card-industrial">
          <div className="stat-icon"><Calendar size={24} /></div>
          <div className="stat-data">
            <h3>Active Bookings</h3>
            <p className="stat-number">{stats.bookings}</p>
          </div>
        </div>
        <div className="stat-card-industrial">
          <div className="stat-icon"><AlertTriangle size={24} /></div>
          <div className="stat-data">
            <h3>Pending Invoices</h3>
            <p className="stat-number">{stats.pendingBills}</p>
          </div>
        </div>
        <div className="stat-card-industrial">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-data">
            <h3>Net Revenue</h3>
            <p className="stat-number">{stats.revenue.toLocaleString()} LKR</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel-industrial">
          <div className="panel-header">
            <h3>System Notifications</h3>
            <CheckCircle size={18} color="var(--success)" />
          </div>
          <div className="panel-body">
            <div className="notification-list">
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <div key={item._id} className="notification-item">
                    <div className="notification-icon"><Package size={20} /></div>
                    <div className="notification-content">
                      <div className="notification-title">Critical Inventory Alert: {item.name}</div>
                      <div className="notification-desc">
                        Current stock: {item.quantityInStock} units. Reorder level reached ({item.reorderLevel}).
                      </div>
                    </div>
                    <ChevronRight size={16} />
                  </div>
                ))
              ) : (
                <div className="empty-notifications">
                  <p>All systems operational. No critical inventory alerts.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="panel-industrial">
          <div className="panel-header">
            <h3>Operational Overview</h3>
          </div>
          <div className="panel-body">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Real-time synchronization active. Internal database systems are performing within normal parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;
