import React, { useState, useEffect } from "react";
import axios from "axios";
import { Package, List, Calculator, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from "react-hot-toast";
import "../../styles/InventoryModule.css";

const categories = [
  'Lubricants & Fluids', 
  'Filters', 
  'Cleaning & Detailing', 
  'Engine & Ignition', 
  'Brakes & Suspension', 
  'Electrical', 
  'General Consumables'
];

const InventoryModule = () => {
  // --- NEW: TAB STATE ---
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'list', 'calc'
  
  const [inventory, setInventory] = useState([]);
  const [records, setRecords] = useState([]); 
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Lubricants & Fluids',
    price: '',
    quantityInStock: '',
    reorderLevel: '5'
  });

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Calculator States
  const [calcItemPrice, setCalcItemPrice] = useState("");
  const [calcQty, setCalcQty] = useState(1);

  const fetchInventory = async () => {
    try {
      const [invRes, recRes] = await Promise.all([
        axios.get("http://localhost:5000/api/inventory"),
        axios.get("http://localhost:5000/api/service-records")
      ]);
      setInventory(invRes.data || []);
      setRecords(recRes.data || []);
    } catch (err) {
      toast.error("Failed to load inventory data.");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Form Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = value.replace(/[^0-9.]/g, ''); 
    setFormData({ ...formData, [name]: cleanValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      price: Number(formData.price),
      quantityInStock: Number(formData.quantityInStock),
      reorderLevel: Number(formData.reorderLevel)
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/inventory/${editingId}`, payload);
        toast.success("Item Updated Successfully!");
      } else {
        await axios.post("http://localhost:5000/api/inventory", payload);
        toast.success("New Item Added to Inventory!");
      }
      resetForm();
      fetchInventory();
      setActiveTab('list'); // Switch back to list after adding
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save item.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', category: 'Lubricants & Fluids', price: '', quantityInStock: '', reorderLevel: '5' });
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      quantityInStock: item.quantityInStock.toString(),
      reorderLevel: item.reorderLevel.toString()
    });
    // --- NEW: Automatically switch to the Add/Edit tab when they click Edit ---
    setActiveTab('add'); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this item?")) {
      try {
        await axios.delete(`http://localhost:5000/api/inventory/${id}`);
        toast.success("Item Deleted.");
        fetchInventory();
      } catch (err) {
        toast.error("Delete failed.");
      }
    }
  };

  // --- FILTER & CALCULATE LOGIC ---
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.itemId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? item.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const getStatus = (qty, reorder) => {
    if (qty === 0) return { label: "OUT OF STOCK", class: "status-out" };
    if (qty <= reorder) return { label: "LOW STOCK", class: "status-low" };
    return { label: "IN STOCK", class: "status-good" };
  };

  // 1. Calculate Total Inventory Value (Stock sitting on shelves)
  const totalInventoryValue = filteredInventory.reduce((sum, item) => sum + (item.price * item.quantityInStock), 0);

  // 2. Calculate Total Sold Parts Value (Revenue generated from parts)
  const totalSoldValue = records
    .filter(r => r.status === 'Completed')
    .reduce((sum, record) => {
      const partsTotalForService = (record.usedParts || []).reduce((partSum, part) => partSum + (Number(part.totalPrice) || 0), 0);
      return sum + partsTotalForService;
    }, 0);

  return (
    <div>
      <div className="module-header">
        <h2>Inventory & Consumables</h2>
      </div>

      {/* --- NEW: TAB CONTROLS --- */}
      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => { resetForm(); setActiveTab('add'); }}
        >
          <Plus size={16} /> Add New Item
        </button>
        <button 
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <List size={16} /> Global Stock List
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calc' ? 'active' : ''}`}
          onClick={() => setActiveTab('calc')}
        >
          <Calculator size={16} /> Cost Calculator
        </button>
      </div>

      <div className="tab-content-area" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
        
        {/* ======================================= */}
        {/* TAB 1: ADD/EDIT FORM                    */}
        {/* ======================================= */}
        {activeTab === 'add' && (
          <div className="fade-in">
            <div className="inventory-form-panel" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 style={{ color: editingId ? '#f59e0b' : 'inherit', marginTop: 0 }}>
                {editingId ? "✏️ Edit Inventory Item" : "📦 Add New Item"}
              </h3>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Item Name</label>
                  <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g., Mobil 1 Synthetic Oil" />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Category</label>
                  <select name="category" required value={formData.category} onChange={handleInputChange}>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Selling Price (LKR)</label>
                  <input type="text" name="price" required value={formData.price} onChange={handleNumberChange} placeholder="0.00" />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Qty in Stock</label>
                    <input type="text" name="quantityInStock" required value={formData.quantityInStock} onChange={handleNumberChange} placeholder="0" />
                  </div>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Reorder Alert</label>
                    <input 
                      type="text" 
                      name="reorderLevel" 
                      required 
                      value={formData.reorderLevel} 
                      onChange={handleNumberChange} 
                      placeholder="5" 
                      style={{ width: '100%', color: 'red' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-submit" style={{ marginTop: '10px', background: editingId ? '#f59e0b' : 'var(--primary)' }}>
                  {editingId ? "Update Item Data" : "Add to Inventory"}
                </button>
                
                {editingId && (
                  <button type="button" onClick={() => { resetForm(); setActiveTab('list'); }} style={{ padding: '10px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '5px', cursor: 'pointer' }}>
                    Cancel Edit
                  </button>
                )}
              </form>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: INVENTORY LIST & DIRECTORY       */}
        {/* ======================================= */}
        {activeTab === 'list' && (
          <div className="inventory-table-panel fade-in" style={{ padding: 0, border: 'none', boxShadow: 'none' }}>
            
            {/* SPLIT ASSET & SOLD BANNER */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ecfdf5', padding: '15px 20px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#065f46', fontSize: '1.1rem' }}>Current Asset Value</h3>
                  <span style={{ fontSize: '0.8rem', color: '#047857' }}>Filtered stock value</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#059669' }}>
                  {totalInventoryValue.toLocaleString()} LKR
                </div>
              </div>
              
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff', padding: '15px 20px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: '1.1rem' }}>Total Parts Sold</h3>
                  <span style={{ fontSize: '0.8rem', color: '#1d4ed8' }}>From completed services</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#2563eb' }}>
                  {totalSoldValue.toLocaleString()} LKR
                </div>
              </div>
            </div>

            <div className="table-controls" style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '15px' }}>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search by Item ID or Name..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 2, margin: 0 }}
              />
              <select 
                className="search-input" 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                style={{ flex: 1, margin: 0 }}
              >
                <option value="">All Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="table-scroll-wrapper" style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Item Code & Name</th>
                    <th>Category</th>
                    <th>Price (LKR)</th>
                    <th style={{ textAlign: 'center' }}>Stock Level</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-state" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No items found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map(item => {
                      const status = getStatus(item.quantityInStock, item.reorderLevel);
                      return (
                        <tr key={item._id}>
                          <td>
                            <span className="id-badge" style={{ background: '#f1f5f9', color: '#475569', marginBottom: '5px', display: 'inline-block' }}>
                              {item.itemId}
                            </span>
                            <div style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{item.name}</div>
                          </td>
                          <td style={{ color: '#64748b' }}>{item.category}</td>
                          <td style={{ fontWeight: '600' }}>{item.price.toLocaleString()}</td>
                          
                          <td style={{ textAlign: 'center' }}>
                            <span className={`stock-count ${item.quantityInStock <= item.reorderLevel ? 'danger' : 'safe'}`}>
                              {item.quantityInStock}
                            </span>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Alert at {item.reorderLevel}</div>
                          </td>
                          
                          <td style={{ textAlign: 'center' }}>
                            <span className={`status-badge ${status.class}`}>
                              {status.label}
                            </span>
                          </td>
                          
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn-edit" onClick={() => handleEditClick(item)} style={{ marginRight: '5px' }}>Edit</button>
                            <button className="btn-delete" onClick={() => handleDelete(item._id)}>Del</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: QUICK CALCULATOR                 */}
        {/* ======================================= */}
        {activeTab === 'calc' && (
          <div className="fade-in">
            <div style={{ maxWidth: '500px', margin: '0 auto', background: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' }}>
                🧮 Quick Price Calculator
              </h3>
              
              <div className="input-group" style={{ marginBottom: '15px' }}>
                <label style={{ fontWeight: 'bold', color: '#475569' }}>Select Reference Item</label>
                <select 
                  value={calcItemPrice} 
                  onChange={e => setCalcItemPrice(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                >
                  <option value="">-- Select an Item --</option>
                  {inventory.map(i => (
                    <option key={i._id} value={i.price}>{i.name} ({i.price.toLocaleString()} LKR)</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group" style={{ marginBottom: '25px' }}>
                <label style={{ fontWeight: 'bold', color: '#475569' }}>Multiplier (Qty)</label>
                <input 
                  type="number" 
                  min="1" 
                  value={calcQty} 
                  onChange={e => setCalcQty(e.target.value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem' }} 
                />
              </div>
              
              <div style={{ paddingTop: '20px', background: '#f8fafc', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px dashed #cbd5e1' }}>
                <span style={{ fontWeight: 'bold', color: '#64748b', fontSize: '1.1rem' }}>Estimated Value:</span>
                <span style={{ fontSize: '1.8rem', fontWeight: '900', color: 'var(--primary)' }}>
                  {calcItemPrice ? (Number(calcItemPrice) * Number(calcQty)).toLocaleString() : "0"} LKR
                </span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default InventoryModule;