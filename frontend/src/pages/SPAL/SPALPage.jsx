import { useState } from "react";
import "../../styles/pages.css"

function SpalPage() {
  const [spares, setSpares] = useState([
    { id: 1, name: "Engine Oil", type: "Lubricant", quantity: 20 },
    { id: 2, name: "Brake Pad", type: "Spare Part", quantity: 15 },
  ]);

  const [formData, setFormData] = useState({ name: "", type: "", quantity: "" });
  const [editingId, setEditingId] = useState(null);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add or update spare part
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setSpares(
        spares.map((item) =>
          item.id === editingId ? { ...item, ...formData, quantity: Number(formData.quantity) } : item
        )
      );
      setEditingId(null);
    } else {
      setSpares([
        ...spares,
        { id: Date.now(), ...formData, quantity: Number(formData.quantity) },
      ]);
    }
    setFormData({ name: "", type: "", quantity: "" });
  };

  // Edit a spare part
  const handleEdit = (item) => {
    setFormData({ name: item.name, type: item.type, quantity: item.quantity });
    setEditingId(item.id);
  };

  // Delete a spare part
  const handleDelete = (id) => {
    setSpares(spares.filter((item) => item.id !== id));
  };

  return (
    <div className="spal-page container-fluid">

      <div className="page-header">
        <h2>Spare Parts & Lubricant Management</h2>
        <p>Manage inventory, track usage, and monitor spare parts.</p>
      </div>

      {/* Form to add/edit spare parts */}
      <div className="page-card">
        <form className="spare-form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Spare/Lubricant Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="type"
            placeholder="Type (Spare Part / Lubricant)"
            value={formData.type}
            onChange={handleChange}
            required
          />
          <input
            type="number"
            name="quantity"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
          />
          <button type="submit">{editingId ? "Update" : "Add"} Item</button>
        </form>
      </div>

      {/* Inventory Table */}
      <div className="page-card mt-4">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {spares.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.type}</td>
                <td>{item.quantity}</td>
                <td>
                  <button onClick={() => handleEdit(item)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
            {spares.length === 0 && (
              <tr>
                <td colSpan="4" className="placeholder-text">
                  No spare parts added yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default SpalPage;