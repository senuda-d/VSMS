import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  ClipboardList, 
  Settings, 
  History, 
  Trash2, 
  Play, 
  User, 
  Phone, 
  CheckCircle, 
  AlertCircle,
  Package,
  Wrench,
  X
} from 'lucide-react';
import { toast } from "react-hot-toast";
import "../../styles/BookingModule.css"; 
import "../../styles/ServiceRecordModule.css";

const ServiceRecordModule = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'bay', 'history'
  
  // Database States
  const [bookings, setBookings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);

  // Workspace States
  const [activeRecord, setActiveRecord] = useState(null);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQty, setPartQty] = useState(1);
  const [additionalCharges, setAdditionalCharges] = useState(0);
  
  // --- NEW: Track Completed Tasks ---
  const [checkedTasks, setCheckedTasks] = useState([]);

  const localToday = new Date().toLocaleDateString('en-CA');

  // --- TIME CALCULATION HELPERS ---
  const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (hours === 12) hours = 0;
    if (modifier === "PM") hours += 12;
    return hours * 60 + minutes;
  };

  const minutesToTime = (totalMinutes) => {
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;
    const modifier = hours >= 12 ? "PM" : "AM";
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return `${hours}:${minutes < 10 ? '0'+minutes : minutes} ${modifier}`;
  };

  const getEndTimeFromDB = (startStr, estStr) => {
    if (!startStr || !estStr) return "";
    const durationMins = parseInt(estStr); 
    return minutesToTime(timeToMinutes(startStr) + durationMins);
  };

  const fetchData = async () => {
    try {
      const [bookRes, invRes, recRes, custRes] = await Promise.all([
        axios.get("http://localhost:5000/api/bookings"),
        axios.get("http://localhost:5000/api/inventory"),
        axios.get("http://localhost:5000/api/service-records"),
        axios.get("http://localhost:5000/api/customers")
      ]);
      setBookings(bookRes.data || []);
      setInventory(invRes.data || []);
      setRecords(recRes.data || []);
      setCustomers(custRes.data || []);
      
      if (activeRecord) {
        const updated = recRes.data.find(r => r._id === activeRecord._id);
        if (updated) setActiveRecord(updated);
      }
    } catch (err) { toast.error("Failed to fetch live data."); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 1. START SERVICE ---
  const handleStartService = async (booking) => {
    if (!window.confirm(`Move ${booking.vehicleNumber} into the Active Bay?`)) return;
    
    try {
      const payload = {
        bookingId: booking._id,
        vehicleNumber: booking.vehicleNumber,
        customerName: booking.customerName,
        serviceDate: booking.date,
        bookingCost: booking.totalPrice,
        servicesPerformed: booking.selectedServices
      };
      
      const res = await axios.post("http://localhost:5000/api/service-records/start", payload);
      toast.success("Service Started! Vehicle moved to Active Bay.");
      await fetchData();
      setActiveRecord(res.data);
      setActiveTab('bay');
    } catch (error) { toast.error(error.response?.data?.message || "Failed to start."); }
  };

  // --- 1.5 CANCEL SERVICE ---
  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel and permanently delete this booking?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/bookings/${id}`);
      toast.success("Booking cancelled and removed from schedule.");
      fetchData(); 
    } catch (error) { 
      toast.error("Failed to cancel booking."); 
    }
  };

  // --- 2. ADD SPARE PART ---
  const handleAddPart = async () => {
    if (!selectedPartId || partQty < 1) return toast.error("Select a part and valid quantity.");
    
    const part = inventory.find(i => i._id === selectedPartId);
    if (!part) return;

    if (partQty > part.quantityInStock) {
      return toast.error(`Only ${part.quantityInStock} left in inventory!`);
    }

    const newPartEntry = {
      partId: part._id,
      partName: part.name,
      quantity: Number(partQty),
      unitPrice: part.price,
      totalPrice: part.price * Number(partQty)
    };

    const currentParts = activeRecord.usedParts || [];
    const updatedPartsList = [...currentParts, newPartEntry];
    const newPartsCost = updatedPartsList.reduce((sum, p) => sum + p.totalPrice, 0);
    const newFinalTotal = activeRecord.bookingCost + newPartsCost + (activeRecord.additionalCharges || 0);

    try {
      await axios.put(`http://localhost:5000/api/service-records/${activeRecord._id}`, {
        usedParts: updatedPartsList,
        partsCost: newPartsCost,
        finalTotal: newFinalTotal
      });
      toast.success(`${part.name} added to bill.`);
      setSelectedPartId("");
      setPartQty(1);
      fetchData();
    } catch (error) { toast.error("Failed to add part."); }
  };

  // --- NEW: REMOVE MISTAKEN PART ---
  const handleRemovePart = async (indexToRemove) => {
    const partToRemove = activeRecord.usedParts[indexToRemove];
    if (!window.confirm(`Remove ${partToRemove.partName} from the bill?`)) return;

    const updatedPartsList = activeRecord.usedParts.filter((_, idx) => idx !== indexToRemove);
    const newPartsCost = updatedPartsList.reduce((sum, p) => sum + p.totalPrice, 0);
    const newFinalTotal = activeRecord.bookingCost + newPartsCost + (activeRecord.additionalCharges || 0);

    try {
      await axios.put(`http://localhost:5000/api/service-records/${activeRecord._id}`, {
        usedParts: updatedPartsList,
        partsCost: newPartsCost,
        finalTotal: newFinalTotal
      });
      toast.success(`${partToRemove.partName} removed from bill.`);
      fetchData();
    } catch (error) { toast.error("Failed to remove part."); }
  };

  // --- 3. UPDATE ADDITIONAL CHARGES ---
  const handleUpdateCharges = async () => {
    const charges = Number(additionalCharges);
    const newFinalTotal = activeRecord.bookingCost + (activeRecord.partsCost || 0) + charges;
    
    try {
      await axios.put(`http://localhost:5000/api/service-records/${activeRecord._id}`, {
        additionalCharges: charges,
        finalTotal: newFinalTotal
      });
      toast.success("Extra charges updated.");
      fetchData();
    } catch (error) { toast.error("Failed to update charges."); }
  };

  // --- NEW: TOGGLE CHECKLIST TASK ---
  const handleTaskToggle = (task) => {
    if (checkedTasks.includes(task)) {
      setCheckedTasks(checkedTasks.filter(t => t !== task));
    } else {
      setCheckedTasks([...checkedTasks, task]);
    }
  };

  // --- 4. COMPLETE SERVICE ---
  const handleCompleteService = async () => {
    // --- NEW: VALIDATE ALL TASKS ARE CHECKED ---
    if (checkedTasks.length !== activeRecord.servicesPerformed.length) {
      return toast.error("⚠️ Please perform all tasks in the checklist before completing the service!");
    }

    if (!window.confirm("Complete this service? This will deduct used parts from Inventory and generate the final bill.")) return;
    
    try {
      await axios.put(`http://localhost:5000/api/service-records/${activeRecord._id}/complete`);
      toast.success("Service Completed! Inventory updated.");
      setActiveRecord(null);
      fetchData();
      setActiveTab('history');
    } catch (error) { toast.error(error.response?.data?.message || "Failed to complete."); }
  };

  // --- DATA FILTERS & SORTING ---
  // Today's Tasks: Chronologically sorted by time
  const todaysTasks = bookings
    .filter(b => b.date === localToday && b.status === 'Pending')
    .sort((a, b) => timeToMinutes(a.timeSlot) - timeToMinutes(b.timeSlot));
  
  // Future Tasks: Sorted by date, then chronologically by time
  const upcomingTasks = bookings
    .filter(b => b.date > localToday && b.status === 'Pending')
    .sort((a,b) => {
      if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
      return timeToMinutes(a.timeSlot) - timeToMinutes(b.timeSlot);
    });
  
  const activeServices = records.filter(r => r.status === 'In Progress');
  const completedServices = records.filter(r => r.status === 'Completed').sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return (
    <div>
      <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Live Service Floor</h2>
        {todaysTasks.length > 0 && (
          <div className="live-badge">
            <div className="blink-dot"></div>
            {todaysTasks.length} Vehicles Scheduled Today
          </div>
        )}
      </div>

      <div className="tab-container">
        <button className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => { setActiveTab('pending'); setActiveRecord(null); }}>
          <ClipboardList size={16} /> Pending Pipeline
        </button>
        <button className={`tab-btn ${activeTab === 'bay' ? 'active' : ''}`} onClick={() => setActiveTab('bay')}>
          <Settings size={16} /> Active Bay ({activeServices.length})
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setActiveRecord(null); }}>
          <History size={16} /> Complete History
        </button>
      </div>

      <div className="tab-content-area" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
        
        {/* ======================================= */}
        {/* TAB 1: PENDING PIPELINE                 */}
        {/* ======================================= */}
        {activeTab === 'pending' && (
          <div className="fade-in">
            
            {/* SECTION: TODAY'S TASKS */}
            <h3 style={{ marginTop: 0, color: '#dc2626', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
              <div className="blink-dot"></div> Today's Urgent Tasks
            </h3>
            <div className="task-grid">
              {todaysTasks.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1', background: 'white' }}>No pending tasks scheduled for today.</div>
              ) : (
                todaysTasks.map(b => {
                  const cust = customers.find(c => c._id === b.customer);
                  
                  return (
                    <div key={b._id} className="task-card urgent">
                      <div className="task-header">
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>{b.vehicleNumber}</div>
                          {/* Display both Start and End Time */}
                          <div style={{ color: 'var(--secondary)', fontSize: '0.9rem' }}>
                            {b.timeSlot} — {getEndTimeFromDB(b.timeSlot, b.estimatedTime)}
                          </div>
                        </div>
                        <div className="live-badge" style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'fit-content' }}>
                          <div className="blink-dot"></div> TODAY
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <b style={{ color: 'var(--text-main)' }}>👤 {b.customerName}</b><br/>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>📞 {cust ? cust.phone : 'N/A'}</span>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', color: '#475569' }}>
                        <b>Tasks:</b><br/>{b.selectedServices.join(' • ')}
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <b style={{ color: 'var(--success)', fontSize: '1.1rem' }}>{b.totalPrice} LKR</b>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn-submit" style={{ flex: 1, margin: 0, padding: '8px', background: 'var(--danger)' }} onClick={() => handleCancelBooking(b._id)}>
                            🗑️ Cancel
                          </button>
                          <button className="btn-submit" style={{ flex: 2, margin: 0, padding: '8px' }} onClick={() => handleStartService(b)}>
                            🚀 Start Service
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* SECTION: UPCOMING TASKS */}
            <h3 style={{ marginTop: '40px', color: 'var(--secondary)', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              📅 Future Upcoming Schedule
            </h3>
            <div className="task-grid">
              {upcomingTasks.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1', background: 'white' }}>No future bookings in the pipeline.</div>
              ) : (
                upcomingTasks.map(b => {
                  const cust = customers.find(c => c._id === b.customer);
                  return (
                    <div key={b._id} className="task-card">
                      <div className="task-header">
                        <div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>{b.vehicleNumber}</div>
                          <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                            {b.date} &nbsp;|&nbsp; {b.timeSlot} — {getEndTimeFromDB(b.timeSlot, b.estimatedTime)}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ marginBottom: '15px' }}>
                        <b style={{ color: 'var(--text-main)' }}>👤 {b.customerName}</b><br/>
                        <span style={{ color: 'var(--secondary)' }}>📞 {cust ? cust.phone : 'N/A'}</span>
                      </div>

                      <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', color: '#475569' }}>
                        <b>Tasks:</b><br/>{b.selectedServices.join(' • ')}
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <b style={{ color: 'var(--success)', fontSize: '1.1rem' }}>{b.totalPrice} LKR</b>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button className="btn-submit" style={{ flex: 1, margin: 0, padding: '8px', background: 'var(--danger)' }} onClick={() => handleCancelBooking(b._id)}>
                            🗑️ Cancel
                          </button>
                          <button className="btn-submit" style={{ flex: 2, margin: 0, padding: '8px', background: 'var(--secondary)' }} onClick={() => handleStartService(b)}>
                            🚀 Start Early
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: ACTIVE BAY (Workspace)           */}
        {/* ======================================= */}
        {activeTab === 'bay' && (
          <div className="fade-in">
            {!activeRecord ? (
              <div className="task-grid">
                {activeServices.length === 0 ? (
                   <div className="empty-state" style={{ gridColumn: '1 / -1', background: 'white' }}>No vehicles currently in the Active Bay.</div>
                ) : (
                  activeServices.map(r => (
                    <div key={r._id} className="task-card" style={{ borderTopColor: '#3b82f6' }}>
                      <div className="task-header">
                        <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>{r.vehicleNumber}</div>
                        <div style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>IN PROGRESS</div>
                      </div>
                      <div style={{ marginBottom: '15px' }}><b>Client:</b> {r.customerName}</div>
                      <div style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '15px' }}>Started: {r.serviceDate}</div>
                      <button className="btn-submit" style={{ background: '#3b82f6', margin: 0 }} onClick={() => { setActiveRecord(r); setAdditionalCharges(r.additionalCharges || 0); setCheckedTasks([]); }}>
                        Open Live Workspace 🛠️
                      </button>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="workspace-layout fade-in">
                
                {/* LEFT: Checklist */}
                <div className="workspace-panel workspace-left">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>🚘 {activeRecord.vehicleNumber} Workspace</h3>
                    <button onClick={() => setActiveRecord(null)} style={{ padding: '6px 12px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
                  </div>
                  
                  <div style={{ color: 'var(--secondary)', marginBottom: '20px' }}>Client: {activeRecord.customerName}</div>

                  <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>Tasks to Perform:</h4>
                  <div>
                    {activeRecord.servicesPerformed.map(task => (
                      <label key={task} className="checklist-item" style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                        {/* --- NEW: Interactive Checkbox --- */}
                        <input 
                          type="checkbox" 
                          checked={checkedTasks.includes(task)} 
                          onChange={() => handleTaskToggle(task)} 
                          style={{ transform: 'scale(1.2)' }}
                        /> 
                        {task}
                      </label>
                    ))}
                  </div>
                </div>

                {/* RIGHT: Inventory & Billing */}
                <div className="workspace-panel workspace-right">
                  <h4 style={{ margin: '0 0 15px 0', color: 'var(--primary)' }}>📦 Add Materials & Parts</h4>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <select className="search-input" value={selectedPartId} onChange={e => setSelectedPartId(e.target.value)} style={{ flex: 2, margin: 0 }}>
                      <option value="">-- Select from Inventory --</option>
                      {inventory.filter(i => i.quantityInStock > 0).map(i => (
                        <option key={i._id} value={i._id}>{i.name} ({i.quantityInStock} in stock) - {i.price} LKR</option>
                      ))}
                    </select>
                    <input type="number" min="1" className="search-input" value={partQty} onChange={e => setPartQty(e.target.value)} style={{ flex: 1, margin: 0 }} placeholder="Qty" />
                    <button onClick={handleAddPart} className="btn-submit" style={{ flex: 1, margin: 0, padding: '10px' }}>Add</button>
                  </div>

                  {activeRecord.usedParts?.length > 0 && (
                    <table className="parts-table">
                      {/* --- NEW: Added empty th for the delete button column --- */}
                      <thead><tr><th>Part</th><th>Qty</th><th>Total</th><th style={{width: '30px'}}></th></tr></thead>
                      <tbody>
                        {activeRecord.usedParts.map((p, idx) => (
                          <tr key={idx}>
                            <td>{p.partName}</td>
                            <td>x{p.quantity}</td>
                            <td>{p.totalPrice.toLocaleString()} LKR</td>
                            {/* --- NEW: Delete Part Button --- */}
                            <td style={{ textAlign: 'center' }}>
                              <button onClick={() => handleRemovePart(idx)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem' }} title="Remove Part">
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <div className="billing-summary">
                    <h4 style={{ margin: '0 0 15px 0', color: '#1e3a8a' }}>Live Invoice Calculation</h4>
                    <div className="billing-row"><span>Base Service Fee:</span> <b>{activeRecord.bookingCost.toLocaleString()} LKR</b></div>
                    <div className="billing-row"><span>Spare Parts Total:</span> <b>{(activeRecord.partsCost || 0).toLocaleString()} LKR</b></div>
                    
                    <div className="billing-row" style={{ alignItems: 'center', marginTop: '10px' }}>
                      <span>Extra Labor/Charges:</span> 
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <input type="number" value={additionalCharges} onChange={e => setAdditionalCharges(e.target.value)} style={{ width: '100px', padding: '5px', borderRadius: '4px', border: '1px solid #cbd5e1' }} />
                        <button onClick={handleUpdateCharges} style={{ padding: '5px 10px', background: '#94a3b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Set</button>
                      </div>
                    </div>

                    <div className="billing-total">
                      <span>FINAL TOTAL:</span>
                      <span>{activeRecord.finalTotal.toLocaleString()} LKR</span>
                    </div>
                  </div>

                  <button className="btn-submit" style={{ background: 'var(--success)', marginTop: '20px', height: '50px', fontSize: '1.1rem' }} onClick={handleCompleteService}>
                    ✅ Complete Service 
                  </button>

                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: HISTORY                          */}
        {/* ======================================= */}
        {activeTab === 'history' && (
          <div className="task-grid fade-in">
            {completedServices.length === 0 ? (
               <div className="empty-state" style={{ gridColumn: '1 / -1', background: 'white' }}>No completed services yet.</div>
            ) : (
              completedServices.map(r => (
                <div key={r._id} className="task-card" style={{ borderTopColor: '#10b981', background: '#f8fafc', opacity: 0.9 }}>
                  <div className="task-header">
                    <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#475569' }}>{r.vehicleNumber}</div>
                    <div style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>COMPLETED</div>
                  </div>
                  <div style={{ marginBottom: '10px' }}><b>Client:</b> {r.customerName}</div>
                  <div style={{ color: 'var(--secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>Date: {r.serviceDate}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '15px' }}>
                    <b>Parts Used:</b> {r.usedParts?.length > 0 ? r.usedParts.map(p => p.partName).join(', ') : 'None'}
                  </div>
                  <div style={{ marginTop: 'auto', borderTop: '1px dashed #cbd5e1', paddingTop: '15px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>Final Bill:</span>
                    <b style={{ color: 'var(--success)', fontSize: '1.2rem' }}>{r.finalTotal.toLocaleString()} LKR</b>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ServiceRecordModule;