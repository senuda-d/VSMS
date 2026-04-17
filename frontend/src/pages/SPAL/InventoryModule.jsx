import React, { useState, useEffect } from "react";
import axios from "axios";
import { Package, List, Calculator, Plus, Edit, Trash2, MinusCircle, PlusCircle } from 'lucide-react';
import { toast } from "react-hot-toast";
import "../../styles/InventoryModule.css";

// Industry standard categories for automotive spare parts
const categories = [
  'Lubricants & Fluids', 
  'Filters', 
  'Cleaning & Detailing', 
  'Engine & Ignition', 
  'Brakes & Suspension', 
  'Electrical', 
  'General Consumables'
];

/**
 * InventoryModule Component: Handles the full lifecycle of inventory management
 * including CRUD operations, stock adjustments, and material cost calculations.
 */
const InventoryModule = () => {
  // Navigation state management between tabs
  const [activeTab, setActiveTab] = useState('add'); // 'add', 'list', 'calc'
  
  // Application Data States
  const [inventory, setInventory] = useState([]);
  const [records, setRecords] = useState([]); // Used for financial calculations from service records
  
  // Item Creation/Editing State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Lubricants & Fluids',
    price: '',
    quantityInStock: '',
    reorderLevel: '5'
  });

  // UI Filtering & Search States
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Material Cost Calculator States (Internal business logic helper)
  const [calcItemPrice, setCalcItemPrice] = useState("");
  const [calcQty, setCalcQty] = useState(1);

  /**
   * Data Fetching: Synchronizes frontend state with MongoDB cluster
   */
  const fetchInventory = async () => {
    try {
      // Parallel execution for optimized performance
      const [invRes, recRes] = await Promise.all([
        axios.get("http://localhost:5000/api/inventory"),
        axios.get("http://localhost:5000/api/service-records")
      ]);
      setInventory(invRes.data || []);
      setRecords(recRes.data || []);
    } catch (err) {
      toast.error("Network Link Error: Failed to load inventory data.");
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Form Input Handlers with sanitization
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = value.replace(/[^0-9.]/g, ''); // Enforce numeric input integrity
    setFormData({ ...formData, [name]: cleanValue });
  };

  /**
   * Persistence Logic: Saves new items or updates existing inventory entries
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Payload preparation with proper type casting
    const payload = {
      ...formData,
      price: Number(formData.price),
      quantityInStock: Number(formData.quantityInStock),
      reorderLevel: Number(formData.reorderLevel)
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/inventory/${editingId}`, payload);
        toast.success("Inventory synchronization successful.");
      } else {
        await axios.post("http://localhost:5000/api/inventory", payload);
        toast.success("Data entry committed to master record.");
      }
      resetForm();
      fetchInventory();
      setActiveTab('list'); 
    } catch (error) {
      toast.error(error.response?.data?.message || "Critical Error: Transaction failed.");
    }
  };

  /**
   * Real-time Stock Adjustment: Provides quick +/- increment controls
   * Triggers reorder alerts instantly if thresholds are crossed
   */
  const handleQuantityAdjust = async (item, delta) => {
    const previousInventory = [...inventory];
    const newQty = item.quantityInStock + delta;
    
    if (newQty < 0) return toast.error("Stock level cannot drop below zero.");

    // 1. Optimistic Update: Update UI instantly
    setInventory(prev => prev.map(i => i._id === item._id ? { ...i, quantityInStock: newQty } : i));

    try {
      // 2. Persistent Storage Sync
      await axios.put(`http://localhost:5000/api/inventory/${item._id}`, {
        ...item,
        quantityInStock: newQty
      });
      
      // 3. Alert System logic (post-sync)
      if (newQty <= item.reorderLevel) {
        toast("CRITICAL ALERT: Low stock detected for " + item.name, {
          icon: '⚠️',
          style: { background: '#991b1b', color: '#fff' }
        });
      }
    } catch (error) {
      // 4. Revert state on failure
      setInventory(previousInventory);
      toast.error("Network Sync Error: Adjustment could not be saved.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Verify: Move item to archive (Delete permanently?)")) return;
    try {
      await axios.delete(`http://localhost:5000/api/inventory/${id}`);
      toast.success("Data record purged.");
      fetchInventory();
    } catch (error) {
      toast.error("Cleanup failed.");
    }
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
    setActiveTab('add');
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', category: 'Lubricants & Fluids', price: '', quantityInStock: '', reorderLevel: '5' });
  };

  // Logic: Determining visual UI state based on stock safety levels
  const getStatus = (qty, reorder) => {
    if (qty === 0) return { label: 'STOCK OUT', class: 'status-out' };
    if (qty <= reorder) return { label: 'LOW STOCK', class: 'status-low' };
    return { label: 'IN STOCK', class: 'status-ok' };
  };

  // Financial Analytical Calculations
  const filteredInventory = inventory.filter(item => 
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     item.itemId.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterCategory === "" || item.category === filterCategory)
  );

  const totalInventoryValue = filteredInventory.reduce((sum, item) => sum + (item.price * item.quantityInStock), 0);
  
  // Calculate total historical revenue from parts used in service records
  const totalSoldValue = records.reduce((sum, record) => sum + (record.partsCost || 0), 0);

  return (
    <div className="inventory-module fade-in">
      <div className="module-header industrial-header">
        <h2>Inventory Control</h2>
      </div>

      <div className="tab-container">
        <button 
          className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => { resetForm(); setActiveTab('add'); }}
        >
          <Plus size={16} /> Add Item
        </button>
        <button 
          className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <List size={16} /> View Stock
        </button>
        <button 
          className={`tab-btn ${activeTab === 'calc' ? 'active' : ''}`}
          onClick={() => setActiveTab('calc')}
        >
          <Calculator size={16} /> Calculator
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'add' && (
          <div className="form-card-industrial">
            <h3>{editingId ? "Edit Item" : "Add New Item"}</h3>
            <form onSubmit={handleSubmit} className="industrial-form">
              <div className="input-group">
                <label>Item Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} placeholder="e.g. Engine Oil" />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select name="category" value={formData.category} onChange={handleInputChange}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>Price (LKR)</label>
                <input type="text" name="price" required value={formData.price} onChange={handleNumberChange} placeholder="0.00" />
              </div>
              <div className="input-group">
                <label>In Stock</label>
                <input type="text" name="quantityInStock" required value={formData.quantityInStock} onChange={handleNumberChange} placeholder="Qty" />
              </div>
              <div className="input-group">
                <label>Reorder Level</label>
                <input type="text" name="reorderLevel" required value={formData.reorderLevel} onChange={handleNumberChange} placeholder="Alert Level" />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary-industrial">Save Item</button>
                {editingId && <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'list' && (
          <div className="list-area fade-in">
            <div className="analytical-summary">
              <div className="analysis-card asset">
                <div>
                  <h4>Liquidation Value</h4>
                  <p>Current holdings valuation</p>
                </div>
                <div className="value-display">{totalInventoryValue.toLocaleString()} LKR</div>
              </div>
              <div className="analysis-card revenue">
                <div>
                  <h4>Cumulative Revenue</h4>
                  <p>Materials utilized in operations</p>
                </div>
                <div className="value-display">{totalSoldValue.toLocaleString()} LKR</div>
              </div>
            </div>

            <div className="filter-panel industrial-card">
              <input type="text" placeholder="Search Master Records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Resource Categories</option>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div className="inventory-grid">
              <table className="industrial-table">
                <thead>
                  <tr>
                    <th>Identifier & Description</th>
                    <th>Price</th>
                    <th style={{ textAlign: 'center' }}>Stock Adjustment</th>
                    <th style={{ textAlign: 'center' }}>Metric Status</th>
                    <th style={{ textAlign: 'right' }}>Management</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map(item => {
                    const status = getStatus(item.quantityInStock, item.reorderLevel);
                    return (
                      <tr key={item._id}>
                        <td>
                          <code className="code-id">{item.itemId}</code>
                          <div className="item-name-bold">{item.name}</div>
                          <span className="cat-tag">{item.category}</span>
                        </td>
                        <td className="price-col">{item.price.toLocaleString()}</td>
                        
                        <td className="adjust-col" style={{ textAlign: 'center' }}>
                          <div className="qty-adjustment-ui">
                            <button className="adjust-btn minus" onClick={() => handleQuantityAdjust(item, -1)}><MinusCircle size={20} /></button>
                            <span className={`stock-val ${status.class}`}>{item.quantityInStock}</span>
                            <button className="adjust-btn plus" onClick={() => handleQuantityAdjust(item, 1)}><PlusCircle size={20} /></button>
                          </div>
                          <div className="threshold-note">Threshold: {item.reorderLevel}</div>
                        </td>
                        
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-pill ${status.class}`}>{status.label}</span>
                        </td>
                        
                        <td style={{ textAlign: 'right' }}>
                          <button className="action-link edit" onClick={() => handleEditClick(item)}>Edit</button>
                          <button className="action-link delete" onClick={() => handleDelete(item._id)}>Purge</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'calc' && (
          <div className="calculator-area-industrial fade-in">
            <div className="card-industrial">
              <h3>Internal Cost Projection</h3>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', marginTop: '20px' }}>
                <div className="input-group" style={{ flex: 2 }}>
                  <label>Select Template Resource</label>
                  <select value={calcItemPrice} onChange={e => setCalcItemPrice(e.target.value)}>
                    <option value="">-- Choose Item --</option>
                    {inventory.map(i => <option key={i._id} value={i.price}>{i.name} ({i.price} LKR)</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1 }}>
                  <label>Projected Units</label>
                  <input type="number" min="1" value={calcQty} onChange={e => setCalcQty(e.target.value)} />
                </div>
              </div>
              <div className="calc-result-industrial">
                <span className="label">Estimated Resource Cost:</span>
                <span className="value">{(Number(calcItemPrice) * Number(calcQty)).toLocaleString()} LKR</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryModule;