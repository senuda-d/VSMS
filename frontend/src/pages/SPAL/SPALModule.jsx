import { useState, useEffect } from "react";
import "../SPAL/SPAL.css"; 

function Inventory() {
  // --- MOCK DATA ---
  const initialSpareParts = [
    { id: 1, name: "Brake Pad", category: "Brakes", stock: 20, price: 3500 },
    { id: 2, name: "Air Filter", category: "Engine", stock: 50, price: 1200 },
    { id: 3, name: "Oil Filter", category: "Lubrication", stock: 30, price: 1500 },
    { id: 4, name: "Spark Plug", category: "Engine", stock: 100, price: 800 },
    { id: 5, name: "Gear Oil 1L", category: "Lubrication", stock: 40, price: 1800 }
  ];

  const categories = ["All", "Brakes", "Engine", "Lubrication"];

  // --- STATE ---
  const [spareParts, setSpareParts] = useState(initialSpareParts);
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchName, setSearchName] = useState("");

  // --- FILTERED LIST ---
  const filteredParts = spareParts.filter(part => {
    const matchCategory = filterCategory === "All" ? true : part.category === filterCategory;
    const matchSearch = part.name.toLowerCase().includes(searchName.toLowerCase());
    return matchCategory && matchSearch;
  });

  // --- HANDLERS ---
  const handleStockChange = (id, delta) => {
    setSpareParts(prev =>
      prev.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)
    );
  };

  return (
    <div className="app-container">
      <h1>🛠 Spare Parts & Lubrication Inventory</h1>

      <div className="content-wrapper">

        {/* LEFT: ADD NEW ITEM FORM */}
        <div className="booking-form">
          <h2>➕ Add New Item</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Item Name:</label>
              <input type="text" placeholder="Brake Pad" />
            </div>
            <div className="form-group">
              <label>Category:</label>
              <select>
                {categories.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Stock Quantity:</label>
              <input type="number" min="0" placeholder="10" />
            </div>
            <div className="form-group">
              <label>Price (LKR):</label>
              <input type="number" min="0" placeholder="3500" />
            </div>
            <button type="submit" className="submit-btn">Add Item</button>
          </form>
        </div>

        {/* RIGHT: INVENTORY LIST */}
        <div className="booking-list">
          <div className="upcoming-section">
            <h3>📦 Inventory</h3>

            {/* Filters */}
            <div className="filter-bar">
              <input 
                type="text" 
                placeholder="Search by name..." 
                value={searchName} 
                onChange={(e) => setSearchName(e.target.value)} 
                style={{padding: "8px", borderRadius: "5px", flex: 1}}
              />
              <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{padding: "8px", borderRadius: "5px"}}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Inventory Cards */}
            {filteredParts.length === 0 ? (
              <p style={{textAlign: "center", color: "#999", marginTop: "20px"}}>No items found.</p>
            ) : (
              filteredParts.map(part => (
                <div key={part.id} className="booking-card">
                  <div>
                    <span className="card-vehicle">{part.name}</span>
                    <span className="card-owner">Category: {part.category}</span>
                    <span className="card-price">Price: {part.price} LKR</span>
                    <span style={{fontWeight: "bold"}}>Stock: {part.stock}</span>
                  </div>
                  <div style={{display: "flex", flexDirection: "column", gap: "5px"}}>
                    <button className="edit-btn" onClick={() => handleStockChange(part.id, 1)}>+1</button>
                    <button className="delete-btn" onClick={() => handleStockChange(part.id, -1)}>-1</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default Inventory;