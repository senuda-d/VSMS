import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../api';
import { toast } from 'react-hot-toast';
import '../../styles/CustomerModule.css';

const CustomerModule = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    nic: '',
    address: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await axios.get(API_ENDPOINTS.CUSTOMERS);
      setCustomers(res.data);
    } catch (err) {
      toast.error('Failed to load customers');
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(`${API_ENDPOINTS.CUSTOMERS}/${currentCustomerId}`, formData);
        toast.success('Customer updated successfully');
      } else {
        await axios.post(API_ENDPOINTS.CUSTOMERS, formData);
        toast.success('Customer registered successfully');
      }
      resetForm();
      fetchCustomers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleEdit = (customer) => {
    setEditMode(true);
    setCurrentCustomerId(customer._id);
    setFormData({
      firstName: customer.firstName,
      lastName: customer.lastName,
      email: customer.email,
      phone: customer.phone,
      nic: customer.nic,
      address: customer.address
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`${API_ENDPOINTS.CUSTOMERS}/${id}`);
        toast.success('Customer deleted');
        fetchCustomers();
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  const resetForm = () => {
    setEditMode(false);
    setCurrentCustomerId(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      nic: '',
      address: ''
    });
  };

  const filteredCustomers = customers.filter(c => 
    c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="customer-module">
      <div className="module-header">
        <h2>Customer Management</h2>
      </div>

      <div className="form-card">
        <h3>{editMode ? 'Edit Customer' : 'Register New Customer'}</h3>
        <form onSubmit={handleSubmit} className="grid-form">
          <div className="input-group">
            <label>First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
          </div>
          <div className="input-group">
            <label>Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
          </div>
          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
          </div>
          <div className="input-group">
            <label>Phone</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} required />
          </div>
          <div className="input-group">
            <label>NIC</label>
            <input type="text" name="nic" value={formData.nic} onChange={handleInputChange} required />
          </div>
          <div className="input-group">
            <label>Address</label>
            <input type="text" name="address" value={formData.address} onChange={handleInputChange} required />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-submit">{editMode ? 'Update' : 'Register'}</button>
            {editMode && <button type="button" className="btn-cancel" onClick={resetForm}>Cancel</button>}
          </div>
        </form>
      </div>

      <div className="table-card">
        <div className="table-header">
          <h3>Customer Directory</h3>
          <input 
            type="text" 
            placeholder="Search by name or NIC..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>NIC</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer._id}>
                <td>{customer.customerId}</td>
                <td>{customer.firstName} {customer.lastName}</td>
                <td>{customer.nic}</td>
                <td>{customer.phone}</td>
                <td>{customer.email}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(customer)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(customer._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerModule;
