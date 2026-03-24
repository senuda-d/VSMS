import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import './CustomerModule.css';

const API_BASE_URL = 'http://localhost:5000/api/customers';

const initialForm = {
  name: '',
  phone: '',
  address: '',
  vehicleNumber: ''
};

const initialTouched = {
  name: false,
  phone: false,
  address: false,
  vehicleNumber: false
};

const validateField = (field, value) => {
  const trimmedValue = value.trim();

  switch (field) {
    case 'name':
      if (!trimmedValue) return 'Customer name is required.';
      if (!/^[A-Za-z ]+$/.test(trimmedValue)) return 'Name can contain letters and spaces only.';
      if (trimmedValue.length < 3) return 'Name must be at least 3 characters long.';
      return '';
    case 'phone':
      if (!trimmedValue) return 'Phone number is required.';
      if (!/^(?:\+94|0)?7\d{8}$/.test(trimmedValue)) return 'Enter a valid Sri Lankan mobile number.';
      return '';
    case 'address':
      if (!trimmedValue) return 'Address is required.';
      if (trimmedValue.length < 5) return 'Address must be at least 5 characters long.';
      return '';
    case 'vehicleNumber':
      if (!trimmedValue) return 'Vehicle number is required.';
      if (!/^(?:[A-Z]{2,3}-\d{4}|[A-Z]{2,3}\s\d{4}|[A-Z]{2,3}\d{4}|\d{2,3}-\d{4})$/i.test(trimmedValue)) {
        return 'Enter a valid vehicle number like CAB-1234.';
      }
      return '';
    default:
      return '';
  }
};

const validateForm = (form) => {
  const newErrors = {};
  Object.keys(form).forEach((field) => {
    const error = validateField(field, form[field]);
    if (error) newErrors[field] = error;
  });
  return newErrors;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const formatDisplayId = (id) => {
  if (!id) return 'N/A';
  return `CUST-${id.slice(-5).toUpperCase()}`;
};

const CustomerModule = () => {
  const [customers, setCustomers] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(initialTouched);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(API_BASE_URL);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Failed to load customers.');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.address, customer.vehicleNumber]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [customers, searchTerm]);

  const latestCustomer = customers.length > 0 ? customers[0] : null;

  const resetForm = () => {
    setFormData(initialForm);
    setErrors({});
    setTouched(initialTouched);
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === 'vehicleNumber') {
      nextValue = value.toUpperCase();
    }

    if (name === 'phone') {
      nextValue = value.replace(/[^\d+]/g, '').slice(0, 13);
    }

    const nextForm = { ...formData, [name]: nextValue };
    setFormData(nextForm);
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, nextValue) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    setTouched({ name: true, phone: true, address: true, vehicleNumber: true });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error('Please correct the highlighted fields.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      vehicleNumber: formData.vehicleNumber.trim().toUpperCase()
    };

    try {
      setLoading(true);
      if (editId) {
        await axios.put(`${API_BASE_URL}/${editId}`, payload);
        toast.success('Customer updated successfully!');
      } else {
        await axios.post(API_BASE_URL, payload);
        toast.success('Customer added successfully!');
      }
      resetForm();
      fetchCustomers();
    } catch (error) {
      const backendErrors = error?.response?.data?.errors || {};
      setErrors(backendErrors);
      toast.error(error?.response?.data?.message || 'Failed to save customer.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditId(customer._id);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      address: customer.address || '',
      vehicleNumber: customer.vehicleNumber || ''
    });
    setErrors({});
    setTouched(initialTouched);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer record?')) {
      return;
    }

    try {
      await axios.delete(`${API_BASE_URL}/${id}`);
      toast.success('Customer deleted successfully.');
      if (editId === id) resetForm();
      fetchCustomers();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete customer.');
    }
  };

  return (
    <div>
      <div className="module-header">
        <h2>Customer Management</h2>
      </div>

      <div className="module-stats-row">
        <div className="mini-stat-card">
          <h4>Total Customer Records</h4>
          <div className="stat-value">{customers.length}</div>
        </div>
        <div className="mini-stat-card" style={{ borderLeftColor: '#10b981' }}>
          <h4>Latest Customer</h4>
          <div className="stat-value customer-stat-label">
            {latestCustomer ? latestCustomer.name : 'N/A'}
          </div>
        </div>
        <div className="mini-stat-card" style={{ borderLeftColor: '#f59e0b' }}>
          <h4>Latest Vehicle Number</h4>
          <div className="stat-value customer-stat-label">
            {latestCustomer ? latestCustomer.vehicleNumber : 'N/A'}
          </div>
        </div>
      </div>

      <div className="form-card">
        <h3>{editId ? 'Edit Customer Record' : 'Add Customer Record'}</h3>
        <form className="grid-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Customer Name</label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Nimal Perera"
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.name && touched.name ? 'input-error' : ''}
            />
            {errors.name && touched.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label>Phone Number</label>
            <input
              type="text"
              name="phone"
              required
              placeholder="07XXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.phone && touched.phone ? 'input-error' : ''}
            />
            {errors.phone && touched.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="input-group full-width">
            <label>Address</label>
            <input
              type="text"
              name="address"
              required
              placeholder="Customer address"
              value={formData.address}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.address && touched.address ? 'input-error' : ''}
            />
            {errors.address && touched.address && <span className="field-error">{errors.address}</span>}
          </div>

          <div className="input-group full-width">
            <label>Vehicle Number</label>
            <input
              type="text"
              name="vehicleNumber"
              required
              placeholder="e.g. CAB-1234"
              value={formData.vehicleNumber}
              onChange={handleChange}
              onBlur={handleBlur}
              className={errors.vehicleNumber && touched.vehicleNumber ? 'input-error' : ''}
            />
            {errors.vehicleNumber && touched.vehicleNumber && <span className="field-error">{errors.vehicleNumber}</span>}
          </div>

          <button type="submit" className={`btn-submit ${editId ? 'update-mode' : ''}`} disabled={loading}>
            {loading ? 'Saving...' : editId ? 'Update Customer' : 'Save Customer'}
          </button>

          {editId && (
            <button
              type="button"
              className="btn-submit customer-cancel-btn"
              onClick={resetForm}
            >
              Cancel Edit
            </button>
          )}
        </form>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <h3>Customer Directory</h3>
          <div className="search-container customer-search-box">
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, phone, address, or vehicle number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>System ID</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Vehicle Number</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer._id}>
                  <td><span className="id-badge">{formatDisplayId(customer._id)}</span></td>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td className="address-cell" title={customer.address}>{customer.address}</td>
                  <td>{customer.vehicleNumber}</td>
                  <td>{formatDate(customer.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEdit(customer)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(customer._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="empty-state">
                  {customers.length === 0 ? 'No customer records found.' : 'No matching customer records found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerModule;
