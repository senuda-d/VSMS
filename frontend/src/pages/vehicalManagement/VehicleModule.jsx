import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
// import './CustomerModule.css'; // Reusing global form/table styles
import '../../styles/VehicalModule.css';  // Vehicle specific styles

const VehicleModule = () => {
  // State for tabs: 'register' or 'directory'
  const [activeTab, setActiveTab] = useState('register');
  
  // Data States
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  
  // --- REGISTRATION TAB STATES ---
  const [customerSearchNIC, setCustomerSearchNIC] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    licensePlate: '', make: '', model: '', year: '', transmission: 'Automatic', mileage: ''
  });
  
  // --- DIRECTORY TAB STATES ---
  const [dirSearchTerm, setDirSearchTerm] = useState('');
  const [dirSearchFilter, setDirSearchFilter] = useState('plate'); // 'plate' or 'nic'
  const [editVehicleId, setEditVehicleId] = useState(null);

  useEffect(() => {
    fetchCustomers();
    fetchVehicles();
  }, []);

  const fetchCustomers = async () => {
    try { const res = await axios.get('http://localhost:5000/api/customers'); setCustomers(res.data); }
    catch (err) { toast.error('Failed to load customers'); }
  };

  const fetchVehicles = async () => {
    try { const res = await axios.get('http://localhost:5000/api/vehicles'); setVehicles(res.data); }
    catch (err) { toast.error('Failed to load vehicles'); }
  };

  // --- STRICT FRONTEND VALIDATION ---
  
  // 1. NIC Search Validation (Max 12 chars, only numbers and V/v)
  const handleCustomerSearchChange = (e) => {
    const value = e.target.value.replace(/[^0-9vV]/g, '').slice(0, 12);
    setCustomerSearchNIC(value);
    if(selectedCustomer && value !== selectedCustomer.nic) {
        setSelectedCustomer(null); // Deselect if they start typing a new NIC
    }
  };

  // 2. License Plate Formatter (e.g., ABC-1234 or WP CAA-1234)
  const handlePlateChange = (e) => {
    // Allows letters, numbers, spaces, and hyphens. Auto uppercase.
    const value = e.target.value.replace(/[^a-zA-Z0-9\s-]/g, '').toUpperCase();
    setVehicleForm({ ...vehicleForm, licensePlate: value });
  };

  // 3. Numbers only for Year & Mileage
  const handleNumberChange = (e, field, maxLength) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, maxLength);
    setVehicleForm({ ...vehicleForm, [field]: value });
  };

  // Submit Vehicle Validation
  const validateVehicleForm = () => {
    if (!selectedCustomer && !editVehicleId) { toast.error('Please select a customer first.'); return false; }
    if (vehicleForm.licensePlate.length < 5) { toast.error('Please enter a valid License Plate.'); return false; }
    
    const yearNum = parseInt(vehicleForm.year);
    const currentYear = new Date().getFullYear();
    if (yearNum < 1950 || yearNum > currentYear + 1) { toast.error(`Year must be between 1950 and ${currentYear + 1}.`); return false; }
    return true;
  };

  // --- SUBMIT LOGIC ---
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    if (!validateVehicleForm()) return;

    // Attach the selected customer's ID as the "owner"
    const payload = { ...vehicleForm, owner: selectedCustomer?._id };

    try {
      if (editVehicleId) {
        // We will pass the existing owner back to avoid overwriting it
        await axios.put(`http://localhost:5000/api/vehicles/${editVehicleId}`, vehicleForm);
        toast.success('Vehicle updated!');
      } else {
        await axios.post('http://localhost:5000/api/vehicles', payload);
        toast.success('Vehicle registered to customer!');
      }
      
      setVehicleForm({ licensePlate: '', make: '', model: '', year: '', transmission: 'Automatic', mileage: '' });
      setEditVehicleId(null);
      fetchVehicles(); // Refresh the list so the new car shows up!
      if(editVehicleId) setActiveTab('directory'); // Go back to directory after editing
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving vehicle.');
    }
  };

  const handleEditClick = (vehicle) => {
    setVehicleForm({
      licensePlate: vehicle.licensePlate, make: vehicle.make, model: vehicle.model,
      year: vehicle.year.toString(), transmission: vehicle.transmission, mileage: vehicle.mileage.toString()
    });
    setEditVehicleId(vehicle._id);
    setSelectedCustomer(vehicle.owner); // Set the owner so the UI knows who it belongs to
    setActiveTab('register'); // Switch to the form tab
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this vehicle permanently?")) {
        try {
            await axios.delete(`http://localhost:5000/api/vehicles/${id}`);
            toast.success('Vehicle deleted');
            fetchVehicles();
          } catch (err) { toast.error('Delete failed'); }
    }
  };

  // --- FILTERING LOGIC ---
  const filteredCustomers = customers.filter(c => 
    c.nic && c.nic.toLowerCase().includes(customerSearchNIC.toLowerCase())
  );

  const filteredVehicles = vehicles.filter(v => {
    if (!dirSearchTerm) return true;
    if (dirSearchFilter === 'plate') {
      return v.licensePlate.toLowerCase().includes(dirSearchTerm.toLowerCase());
    } else if (dirSearchFilter === 'nic') {
      // Because we used .populate() in the backend, v.owner is an object containing the NIC!
      return v.owner?.nic && v.owner.nic.toLowerCase().includes(dirSearchTerm.toLowerCase());
    }
    return true;
  });

  // Calculate how many vehicles the currently selected customer owns
  const selectedCustomerVehicleCount = selectedCustomer 
    ? vehicles.filter(v => v.owner?._id === selectedCustomer._id).length 
    : 0;

  return (
    <div>
      <div className="module-header">
        <h2>Vehicle Management</h2>
      </div>

      {/* --- TOP TAB NAVIGATION --- */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => { setActiveTab('register'); setEditVehicleId(null); }}
        >
          ➕ Register Vehicle
        </button>
        <button 
          className={`tab-btn ${activeTab === 'directory' ? 'active' : ''}`}
          onClick={() => setActiveTab('directory')}
        >
          🚘 Vehicle Directory
        </button>
      </div>

      {/* ========================================= */}
      {/* TAB 1: REGISTRATION             */}
      {/* ========================================= */}
      {activeTab === 'register' && (
        <>
          {/* STEP 1: CUSTOMER SELECTION (Hidden if we are editing an existing vehicle) */}
          {!editVehicleId && (
            <div className="customer-search-section">
              <h3 style={{ marginBottom: '15px' }}>Step 1: Locate Customer by NIC</h3>
              <div className="input-group" style={{ maxWidth: '400px' }}>
                <input 
                  type="text" 
                  placeholder="Type at least first 3 digits of NIC(Max 12 chars)" 
                  value={customerSearchNIC}
                  onChange={handleCustomerSearchChange}
                  className="search-input"
                  style={{ width: '100%', background: 'white' }}
                />
              </div>

              {customerSearchNIC.length > 2 && !selectedCustomer && (
                <div className="customer-list-grid">
                  {filteredCustomers.map(c => (
                    <div 
                      key={c._id} 
                      className="customer-select-card"
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerSearchNIC(c.nic); // Auto-fill the search bar
                      }}
                    >
                      <div style={{ fontWeight: '600' }}>{c.firstName} {c.lastName}</div>
                      <div style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>NIC: {c.nic}</div>
                      <div style={{ color: 'var(--secondary)', fontSize: '0.85rem' }}>📞 {c.phone}</div>
                    </div>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div style={{ color: 'var(--danger)' }}>No customer found with this NIC. Please register them first.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: VEHICLE FORM (Only visible if a customer is selected) */}
          {selectedCustomer && (
            <div className="form-card" style={{ borderTop: '4px solid var(--primary)' }}>
              
              {/* Owner Info Panel */}
              <div className="owner-info-panel">
                <div>
                  <h4>Registering vehicle for: {selectedCustomer.firstName} {selectedCustomer.lastName}</h4>
                  <p>NIC: {selectedCustomer.nic} | Contact: {selectedCustomer.phone}</p>
                </div>
                <div className="vehicle-count-badge">
                  Current Vehicles Owned: {selectedCustomerVehicleCount}
                </div>
              </div>

              <form className="grid-form" onSubmit={handleVehicleSubmit}>
                <div className="input-group">
                  <label>License Plate (e.g. CAA-1234)</label>
                  <input type="text" required value={vehicleForm.licensePlate} onChange={handlePlateChange} placeholder="Enter Plate Number" />
                </div>
                <div className="input-group">
                  <label>Make (Brand)</label>
<input 
  type="text" 
  required 
  value={vehicleForm.make} 
  onChange={(e) => {
    // Only allows uppercase and lowercase letters (a-z, A-Z)
    const onlyLetters = e.target.value.replace(/[^a-zA-Z]/g, '');
    setVehicleForm({ ...vehicleForm, make: onlyLetters });
  }} 
  placeholder="e.g. Toyota" 
/>
                </div>
                <div className="input-group">
                  <label>Model</label>
                  <input type="text" required value={vehicleForm.model} onChange={(e) => setVehicleForm({...vehicleForm, model: e.target.value})} placeholder="e.g. Corolla" />
                </div>
                <div className="input-group">
                  <label>Manufacture Year</label>
                  <input type="text" required value={vehicleForm.year} onChange={(e) => handleNumberChange(e, 'year', 4)} placeholder="YYYY" />
                </div>
                <div className="input-group">
                  <label>Transmission</label>
                  <select 
                    style={{ padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.95rem' }}
                    value={vehicleForm.transmission} 
                    onChange={(e) => setVehicleForm({...vehicleForm, transmission: e.target.value})}
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                    <option value="CVT">CVT</option>
                    <option value="Electric">Electric</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Current Mileage (km)</label>
                  <input type="text" required value={vehicleForm.mileage} onChange={(e) => handleNumberChange(e, 'mileage', 7)} placeholder="e.g. 50000" />
                </div>
                
                <button type="submit" className={`btn-submit ${editVehicleId ? 'update-mode' : ''}`}>
                  {editVehicleId ? 'Update Vehicle' : '💾 Register Vehicle'}
                </button>
                
                {/* Deselect Customer / Cancel Edit Button */}
                <button 
                  type="button" 
                  className="btn-submit" 
                  style={{ backgroundColor: '#ef4444', marginTop: '0' }}
                  onClick={() => { 
                    setSelectedCustomer(null); 
                    setCustomerSearchNIC(''); 
                    setEditVehicleId(null);
                    setVehicleForm({ licensePlate: '', make: '', model: '', year: '', transmission: 'Automatic', mileage: '' });
                    if(editVehicleId) setActiveTab('directory');
                  }}
                >
                  Cancel / Select Different Customer
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* ========================================= */}
      {/* TAB 2: DIRECTORY                */}
      {/* ========================================= */}
      {activeTab === 'directory' && (
        <div className="table-card">
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, color: 'var(--secondary)' }}>Master Vehicle Directory</h3>
              
              <div className="search-container">
                  <select 
                    className="search-filter-select"
                    value={dirSearchFilter}
                    onChange={(e) => { setDirSearchFilter(e.target.value); setDirSearchTerm(''); }}
                  >
                    <option value="plate">Search by License Plate</option>
                    <option value="nic">Search by Owner's NIC</option>
                  </select>
                  <input 
                      type="text" 
                      className="search-input" 
                      placeholder={dirSearchFilter === 'plate' ? "Type License Plate..." : "Type Owner NIC..."} 
                      value={dirSearchTerm}
                      onChange={(e) => setDirSearchTerm(e.target.value.replace(/[^a-zA-Z0-9\s-vV]/g, ''))}
                  />
              </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>License Plate</th>
                <th>Vehicle Details</th>
                <th>Owner NIC</th>
                <th>Mileage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => (
                <tr key={v._id}>
                  <td>
                    <span className="id-badge" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' }}>
                      {v.licensePlate}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: '600' }}>{v.make} {v.model}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--secondary)' }}>{v.year} • {v.transmission}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{v.owner?.nic || 'Unknown'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {v.owner?.firstName} {v.owner?.lastName}
                    </div>
                  </td>
                  <td>{v.mileage.toLocaleString()} km</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-edit" onClick={() => handleEditClick(v)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(v._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No vehicles found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VehicleModule;