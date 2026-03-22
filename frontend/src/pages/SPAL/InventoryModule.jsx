import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import "../../styles/InventoryModule.css"

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
  const [inventory, setInventory] = useState([]);
  
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

  const fetchInventory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/inventory");
      setInventory(res.data || []);
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

  // Restrict price and quantities to numbers only
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    const cleanValue = value.replace(/[^0-9.]/g, ''); // Allows numbers and decimals
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
        toast.success("Item Updated Successfully! 📦");
      } else {
        await axios.post("http://localhost:5000/api/inventory", payload);
        toast.success("New Item Added to Inventory! ➕");
      }
      resetForm();
      fetchInventory();
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

  return (
    <div>
      <div className="module-header">
        <h2>Inventory & Consumables</h2>
      </div>

      <div className="inventory-layout">
        
        {/* --- LEFT: ADD/EDIT FORM --- */}
        <div className="inventory-form-panel">
          <h3 style={{ color: editingId ? '#f59e0b' : 'inherit' }}>
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
    style={{ width: '100px', color: 'red' }}
  />
</div>
            </div>

            <button type="submit" className="btn-submit" style={{ marginTop: '10px', background: editingId ? '#f59e0b' : 'var(--primary)' }}>
              {editingId ? "Update Item Data" : "Add to Inventory"}
            </button>
            
            {editingId && (
              <button type="button" onClick={resetForm} style={{ padding: '10px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '5px', cursor: 'pointer' }}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* --- RIGHT: INVENTORY DIRECTORY --- */}
        <div className="inventory-table-panel">
          
          <div className="table-controls">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by Item ID or Name..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              style={{ flex: 2 }}
            />
            <select 
              className="search-input" 
              value={filterCategory} 
              onChange={e => setFilterCategory(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="table-scroll-wrapper">
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
      </div>
    </div>
  );
};

export default InventoryModule;