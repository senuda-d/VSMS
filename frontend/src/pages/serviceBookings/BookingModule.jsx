import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import "../../styles/BookingModule.css"; 

const serviceOptions = [
  { name: "Full Body Wash", price: 3500, time: 30 }, 
  { name: "Interior Cleaning", price: 4000, time: 45 },
  { name: "Oil Change", price: 6000, time: 20 },
  { name: "Engine Tune-up", price: 12000, time: 60 },
  { name: "Brake Inspection", price: 2500, time: 15 }
];

const availableSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", 
  "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
  "04:00 PM", "04:30 PM"
];

const BookingModule = () => {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  
  const [activeTab, setActiveTab] = useState('new'); 

  // Wizard States
  const [step, setStep] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [checkedServices, setCheckedServices] = useState([]);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  
  // Calculations
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [calculatedEndTime, setCalculatedEndTime] = useState("");

  // Upcoming Filter States
  const [upcomingFilterDate, setUpcomingFilterDate] = useState("");
  const [upcomingFilterVehicle, setUpcomingFilterVehicle] = useState("");

  //HISTORY FILTER STATES ---
  const [historyFilterDate, setHistoryFilterDate] = useState("");
  const [historyFilterVehicle, setHistoryFilterVehicle] = useState("");

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { sender: "bot", text: "Hi! I'm Service-Bot. Ask about availability (e.g. 'Is 2026-03-25 free?') or check a vehicle." }
  ]);
  const chatEndRef = useRef(null);

  const fetchData = async () => {
    try {
      const [custRes, vehRes, bookRes] = await Promise.all([
        axios.get("http://localhost:5000/api/customers"),
        axios.get("http://localhost:5000/api/vehicles"),
        axios.get("http://localhost:5000/api/bookings")
      ]);
      setCustomers(custRes.data || []);
      setVehicles(vehRes.data || []);
      setBookings(bookRes.data || []);
    } catch (err) { toast.error("Failed to connect to database."); }
  };

  useEffect(() => { fetchData(); }, []);

  // Time Calculators
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

  // Date constraints
  const today = new Date();
  const localToday = today.toLocaleDateString('en-CA');
  const maxDateObj = new Date();
  maxDateObj.setMonth(maxDateObj.getMonth() + 3);
  const localMaxDate = maxDateObj.toLocaleDateString('en-CA');

  //PREVENT PAST TIME BOOKINGS ---
  const getCurrentMinutes = () => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  };

  const dynamicallyFilteredSlots = availableSlots.filter(slot => {
    if (date === localToday) {
      return timeToMinutes(slot) > getCurrentMinutes();
    }
    return true; 
  });
  // ---------------------------------------

  // Live Wizard Calculator
  useEffect(() => {
    let price = 0, time = 0;
    checkedServices.forEach(name => {
      const srv = serviceOptions.find(s => s.name === name);
      if (srv) { price += srv.price; time += srv.time; }
    });
    setTotalPrice(price); 
    setTotalTime(time);

    if (timeSlot && time > 0) {
      setCalculatedEndTime(minutesToTime(timeToMinutes(timeSlot) + time));
    } else {
      setCalculatedEndTime("");
    }
  }, [checkedServices, timeSlot]);

const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 4) return;

    //OVERLAP CHECK LOGIC ---
    const newStart = timeToMinutes(timeSlot);
    const newEnd = newStart + totalTime;
    
    // Get all bookings for this specific date
    const dayBookings = bookings.filter(b => b.date === date && b._id !== editingId);

    for (let b of dayBookings) {
      const existingStart = timeToMinutes(b.timeSlot);
      const duration = parseInt(b.estimatedTime) || 0; 
      const existingEnd = existingStart + duration;

      // The Overlap Formula
      if (newStart < existingEnd && newEnd > existingStart) {
        toast.error(`⏱️ Time Conflict! Another vehicle is being serviced from ${b.timeSlot} until ${minutesToTime(existingEnd)}.`);
        return; //physically stops the form from submitting!
      }
    }
    // ------------------------------------------

    const payload = {
      customer: selectedCustomer._id,
      vehicle: selectedVehicle._id,
      vehicleNumber: selectedVehicle.licensePlate,
      customerName: `${selectedCustomer.firstName} ${selectedCustomer.lastName}`,
      customerPhone: selectedCustomer.phone,
      selectedServices: checkedServices,
      totalPrice,
      estimatedTime: `${totalTime} mins`,
      date, 
      timeSlot
    };

    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/bookings/${editingId}`, payload);
        toast.success("Booking Updated Successfully! 🔄");
      } else {
        await axios.post("http://localhost:5000/api/bookings", payload);
        toast.success("Booking Confirmed! ✅");
      }
      resetForm();
      fetchData();
      setActiveTab('upcoming');
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed.");
    }
  };

  const resetForm = () => {
    setStep(1); setSearchQuery(""); setSelectedCustomer(null); 
    setSelectedVehicle(null); setCheckedServices([]); setDate(""); setTimeSlot(""); setEditingId(null);
  };

  const handleEditClick = (b) => {
    const cust = customers.find(c => c._id === b.customer);
    const veh = vehicles.find(v => v._id === b.vehicle);

    setSelectedCustomer(cust || null);
    setSelectedVehicle(veh || null);
    setCheckedServices(b.selectedServices);
    setDate(b.date);
    setTimeSlot(b.timeSlot);
    setEditingId(b._id);

    setActiveTab('new');
    setStep(4); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBooking = async (id) => {
    if (window.confirm("Delete this booking permanently?")) {
      try {
        await axios.delete(`http://localhost:5000/api/bookings/${id}`);
        toast.success("Booking Deleted.");
        fetchData();
      } catch (err) { toast.error("Delete failed."); }
    }
  };

  // --- UPCOMING LOGIC (Strictly > Today) ---
  const upcomingList = bookings.filter(b => {
    if (b.date <= localToday) return false; //If it is today or earlier it goes to history
    
    if (upcomingFilterDate && b.date !== upcomingFilterDate) return false;
    if (upcomingFilterVehicle && !b.vehicleNumber.toLowerCase().includes(upcomingFilterVehicle.toLowerCase())) return false;
    
    return true;
  }).sort((a, b) => {
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
    return timeToMinutes(a.timeSlot) - timeToMinutes(b.timeSlot);
  });

  // --- HISTORY LOGIC (<= Today) ---
  const historyList = bookings.filter(b => {
    if (b.date > localToday) return false; // CHANGED: Only today and past dates

    if (historyFilterDate && b.date !== historyFilterDate) return false;
    if (historyFilterVehicle && !b.vehicleNumber.toLowerCase().includes(historyFilterVehicle.toLowerCase())) return false;

    return true;
  }).sort((a, b) => {
    // History usually sorts newest first (descending)
    if (a.date !== b.date) return new Date(b.date) - new Date(a.date);
    return timeToMinutes(b.timeSlot) - timeToMinutes(a.timeSlot);
  });

  const customerVehicles = selectedCustomer 
    ? vehicles.filter(v => v.owner?._id === selectedCustomer._id) 
    : [];

  const handleServiceToggle = (name) => {
    if (checkedServices.includes(name)) {
      setCheckedServices(checkedServices.filter(s => s !== name));
    } else {
      setCheckedServices([...checkedServices, name]);
    }
  };

  // --- UPGRADED CHATBOT LOGIC ---
const handleChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [...prev, { sender: "user", text: chatInput }]);
    const input = chatInput.toUpperCase();
    setChatInput("");
    
    setTimeout(() => {
      let response = "I didn't quite catch that. Try asking:\n- 'Is 2026-03-25 free?'\n- 'Status of WP CAA-1234'\n- 'Revenue for 2026-03-25'";
      
      const dateMatch = input.match(/\d{4}-\d{2}-\d{2}/);
      const vehicleMatch = input.match(/[A-Z0-9\s-]+-\d+/); 
      
      // SCENARIO 1: REVENUE FOR A SPECIFIC DATE
      if ((input.includes("REVENUE") || input.includes("INCOME") || input.includes("EARN")) && dateMatch) {
        const checkDate = dateMatch[0];
        const daysBookings = bookings.filter(b => b.date === checkDate);
        
        if (daysBookings.length === 0) {
          response = `📉 No revenue recorded for ${checkDate} (0 bookings).`;
        } else {
          const total = daysBookings.reduce((sum, b) => sum + Number(b.totalPrice), 0);
          response = `💰 Revenue for ${checkDate}:\nTotal: ${total.toLocaleString()} LKR\nGenerated from ${daysBookings.length} booking(s).`;
        }
      }
      // SCENARIO 2: AVAILABILITY (SMART DURATION CHECK)
      else if ((input.includes("FREE") || input.includes("AVAILABLE") || input.includes("AVAILABILITY")) && dateMatch) {
        const checkDate = dateMatch[0];
        const daysBookings = bookings.filter(b => b.date === checkDate);
        
        // Smarter Filter: Checks if a slot falls INSIDE an ongoing service duration
        const freeSlots = availableSlots.filter(slot => {
          const slotMins = timeToMinutes(slot);
          
          const isOverlapping = daysBookings.some(b => {
            const bookedStart = timeToMinutes(b.timeSlot);
            const duration = parseInt(b.estimatedTime) || 0;
            const bookedEnd = bookedStart + duration;
            
            // If the time slot falls anywhere between the start and end of another booking, it's blocked!
            return slotMins >= bookedStart && slotMins < bookedEnd;
          });
          
          return !isOverlapping;
        });
        
        if (freeSlots.length === 0) {
          response = `❌ All time slots on ${checkDate} are fully booked.`;
        } else if (freeSlots.length === availableSlots.length) {
          response = `✅ The entire day is free on ${checkDate}!`;
        } else {
          response = `✅ Available time frames on ${checkDate}:\n• ${freeSlots.join("\n• ")}`;
        }
      }
      // SCENARIO 3: VEHICLE STATUS
      else if (vehicleMatch) {
        const vNum = vehicleMatch[0].trim();
        const cleanSearch = vNum.replace(/\s/g, "");
        const vBookings = bookings.filter(b => b.vehicleNumber.replace(/\s/g, "").includes(cleanSearch));
        
        if (vBookings.length === 0) {
          response = `ℹ️ No service records found for vehicle: ${vNum}.`;
        } else {
          const past = vBookings.filter(b => b.date <= localToday);
          const future = vBookings.filter(b => b.date > localToday);
          
          let report = `📋 Status Report for ${vNum}:\n`;
          
          if (future.length > 0) {
            report += `\n📅 UPCOMING:\n${future.map(b => `> ${b.date} @ ${b.timeSlot}`).join("\n")}`;
          } else {
            report += `\n📅 UPCOMING: None scheduled.`;
          }
          
          if (past.length > 0) {
            report += `\n\n📜 HISTORY:\n${past.map(b => `> ${b.date}`).join("\n")}`;
          } else {
            report += `\n\n📜 HISTORY: No past records.`;
          }
          
          response = report;
        }
      }
      
      setChatMessages(prev => [...prev, { sender: "bot", text: response }]);
    }, 600);
  };
  
  useEffect(() => { chatEndRef.current?.scrollIntoView(); }, [chatMessages]);

  return (
    <div>
      <div className="module-header">
        <h2>Service Bookings</h2>
      </div>

      <div className="tab-container">
        <button className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>
          {editingId ? "✏️ Edit Booking" : "➕ New Booking"}
        </button>
        <button className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => { setActiveTab('upcoming'); setEditingId(null); }}>
          📅 Upcoming Schedule
        </button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => { setActiveTab('history'); setEditingId(null); }}>
          📜 Service History
        </button>
      </div>

      <div className="tab-content-area">
        
        {/* ======================================= */}
        {/* TAB 1: NEW BOOKING WIZARD */}
        {/* ======================================= */}
        {activeTab === 'new' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div className="stepper-header">
              <span className={step >= 1 ? "active-step" : ""}>1. Client</span>
              <span className={step >= 2 ? "active-step" : ""}>2. Vehicle</span>
              <span className={step >= 3 ? "active-step" : ""}>3. Services</span>
              <span className={step >= 4 ? "active-step" : ""}>4. Schedule</span>
            </div>

            <div style={{ flex: 1, minHeight: '300px' }}>
              
              {step === 1 && (
                <div className="fade-in">
                  <label className="bold-label">Search Client by NIC or Phone:</label>
                  <input
                   type="text"
                   className="search-box"
                   placeholder="Enter at least first 3 digits of NIC or Phone"
                   value={searchQuery}
                   onChange={(e) => {
                   const value = e.target.value;
                   if (/^[0-9vV]{0,12}$/.test(value)) {
                      setSearchQuery(value);
                   }
                   }}/>                  
                   {searchQuery.length >= 3 && !selectedCustomer && (
                    <div className="selection-grid">
                      {customers.filter(c => (c.nic && c.nic.includes(searchQuery)) || (c.phone && c.phone.includes(searchQuery))).map(c => (
                        <div key={c._id} className="select-card" onClick={() => setSelectedCustomer(c)}>
                          <b>{c.firstName} {c.lastName}</b><br/>NIC: {c.nic} | 📞 {c.phone}
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedCustomer && (
                    <div className="select-card active-card" style={{ maxWidth: '400px' }}>
                      <b>Selected: {selectedCustomer.firstName} {selectedCustomer.lastName}</b>
                      <p style={{ margin: '5px 0', color: 'var(--secondary)' }}>{selectedCustomer.nic} | {selectedCustomer.phone}</p>
                      <button type="button" onClick={() => setSelectedCustomer(null)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Change Client</button>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="fade-in">
                  <label className="bold-label">Select Vehicle for {selectedCustomer?.firstName}:</label>
                  {customerVehicles.length === 0 ? (
                    <p style={{ color: 'var(--danger)' }}>No vehicles found. Register one in Vehicle Management first.</p>
                  ) : (
                    <div className="selection-grid">
                      {customerVehicles.map(v => (
                        <div key={v._id} className={`select-card ${selectedVehicle?._id === v._id ? 'active-card' : ''}`} onClick={() => setSelectedVehicle(v)}>
                          <b style={{ fontSize: '1.2rem' }}>{v.licensePlate}</b><br/>{v.make} {v.model}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="fade-in">
                  <label className="bold-label">Select Services:</label>
                  <div className="service-list">
                    {serviceOptions.map(opt => (
                      <label key={opt.name} className="service-item">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input type="checkbox" checked={checkedServices.includes(opt.name)} onChange={() => handleServiceToggle(opt.name)} style={{ marginRight: '10px', transform: 'scale(1.2)' }} />
                          <b>{opt.name}</b>
                        </div>
                        <span style={{ color: 'var(--secondary)' }}>{opt.time}m | {opt.price.toLocaleString()} LKR</span>
                      </label>
                    ))}
                  </div>
                  <div className="summary-box">
                    <div>Estimated Cost: <b style={{ color: 'var(--success)' }}>{totalPrice.toLocaleString()} LKR</b></div>
                    <div>Estimated Duration: <b style={{ color: 'var(--primary)' }}>{totalTime} Mins</b></div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="fade-in">
                  <div style={{ maxWidth: '400px' }}>
                    <label className="bold-label">Select Date (Max 3 Months Advance):</label>
                    <input type="date" required min={localToday} max={localMaxDate} value={date} onChange={e => setDate(e.target.value)} className="search-box" />
                    
                    <label className="bold-label" style={{ marginTop: '15px' }}>Select Start Time:</label>
                    <select required value={timeSlot} onChange={e => setTimeSlot(e.target.value)} className="search-box">
                      <option value="">-- Choose Time --</option>
                      {dynamicallyFilteredSlots.length === 0 ? (
                        <option value="" disabled>No more slots available today</option>
                      ) : (
                        dynamicallyFilteredSlots.map(s => <option key={s} value={s}>{s}</option>)
                      )}
                    </select>
                  </div>

                  {calculatedEndTime && (
                    <div style={{ marginTop: '25px', padding: '20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', maxWidth: '400px' }}>
                      <div style={{ color: '#166534', fontWeight: 'bold', marginBottom: '5px' }}>⏱️ Service Schedule Confirmed</div>
                      <div style={{ fontSize: '1.1rem', color: '#14532d' }}>
                        Starts: <b>{timeSlot}</b> <br/>
                        Ends By: <b style={{ fontSize: '1.3rem' }}>{calculatedEndTime}</b>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "15px", marginTop: "30px", borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
              {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="btn-submit" style={{ flex: 1, background: 'var(--secondary)' }}>⬅️ Back</button>}
              {step < 4 ? (
                <button type="button" className="btn-submit" style={{ flex: 2 }} onClick={() => {
                  if (step === 1 && !selectedCustomer) return toast.error("Select client.");
                  if (step === 2 && !selectedVehicle) return toast.error("Select vehicle.");
                  if (step === 3 && checkedServices.length === 0) return toast.error("Select a service.");
                  setStep(step + 1);
                }}>Next Step ➡️</button>
              ) : (
                <button type="submit" className="btn-submit" style={{ flex: 2, background: editingId ? '#f59e0b' : 'var(--success)' }}>
                  {editingId ? "Update Booking ✅" : "Confirm Booking ✅"}
                </button>
              )}
              
              {editingId && (
                <button type="button" onClick={resetForm} style={{ marginLeft: '10px', padding: '0 20px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        )}

        {/* ======================================= */}
        {/* TAB 2: UPCOMING (Strictly Tomorrow Onwards) */}
        {/* ======================================= */}
        {activeTab === 'upcoming' && (
          <div className="fade-in">
            <h3 style={{ marginTop: 0, color: 'var(--success)', marginBottom: '15px' }}>📅 Upcoming Bookings</h3>
            
            <div className="filter-bar-row">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Filter by Date:</label>
                <input 
                  type="date" 
                  className="filter-input" 
                  min={localToday} 
                  max={localMaxDate}
                  value={upcomingFilterDate} 
                  onChange={(e) => setUpcomingFilterDate(e.target.value)} 
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Filter by License Plate:</label>
                <input 
                  type="text" 
                  className="filter-input" 
                  placeholder="e.g.CAA-1234"
                  value={upcomingFilterVehicle} 
                  onChange={(e) => setUpcomingFilterVehicle(e.target.value)} 
                />
              </div>
              {(upcomingFilterDate || upcomingFilterVehicle) && (
                <button className="btn-clear" style={{ marginTop: '20px' }} onClick={() => { setUpcomingFilterDate(""); setUpcomingFilterVehicle(""); }}>
                  Clear
                </button>
              )}
            </div>

            {upcomingList.length === 0 ? (
               <div className="empty-state">No upcoming bookings match your filters.</div>
            ) : (
              upcomingList.map(b => {
                
                const cust = customers.find(c => c._id === b.customer);

                return (
                  <div key={b._id} className="booking-ticket">
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '5px' }}>
                        {b.date} &nbsp;|&nbsp; <span style={{ color: 'var(--primary)' }}>{b.timeSlot} — {getEndTimeFromDB(b.timeSlot, b.estimatedTime)}</span>
                      </div>
                      <div style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <span style={{ color: '#0369a1', fontWeight: 'bold', background: '#e0f2fe', padding: '4px 8px', borderRadius: '4px' }}>
                          {b.vehicleNumber}
                        </span> 
                        <span>{b.customerName}</span>
                        {/* --- NEW: Display the auto-loaded phone number --- */}
                        <span style={{ color: 'var(--secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>
                          📞 {cust ? cust.phone : 'N/A'}
                        </span>
                      </div>
                      <div style={{ marginTop: '8px', color: 'var(--secondary)' }}>
                        {b.selectedServices.join(' • ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ color: 'var(--success)', fontWeight: 'bold', fontSize: '1.2rem' }}>{b.totalPrice.toLocaleString()} LKR</div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button className="btn-edit" onClick={() => handleEditClick(b)}>Edit</button>
                        <button onClick={() => deleteBooking(b._id)} style={{ padding: '8px 15px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: HISTORY (Today and Past) */}
        {/* ======================================= */}
        {activeTab === 'history' && (
          <div className="fade-in">
            <h3 style={{ marginTop: 0, color: 'var(--secondary)', marginBottom: '20px' }}>📜 Service History</h3>
            
            {/* --- NEW: HISTORY FILTERS --- */}
            <div className="filter-bar-row">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Filter by Date:</label>
                <input 
                  type="date" 
                  className="filter-input" 
                  max={localToday} /* Cannot search future dates in history */
                  value={historyFilterDate} 
                  onChange={(e) => setHistoryFilterDate(e.target.value)} 
                />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>Filter by License Plate:</label>
                <input 
                  type="text" 
                  className="filter-input" 
                  placeholder="e.g. WP CAA-1234"
                  value={historyFilterVehicle} 
                  onChange={(e) => setHistoryFilterVehicle(e.target.value)} 
                />
              </div>
              {(historyFilterDate || historyFilterVehicle) && (
                <button className="btn-clear" style={{ marginTop: '20px' }} onClick={() => { setHistoryFilterDate(""); setHistoryFilterVehicle(""); }}>
                  Clear
                </button>
              )}
            </div>

            {historyList.length === 0 ? (
               <div className="empty-state">No past records found.</div>
            ) : (
              historyList.map(b => (
                <div key={b._id} className="booking-ticket history-ticket">
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px', gap: '15px' }}>
                        <b style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{b.date}</b>
                        <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                          {b.vehicleNumber}
                        </span>
                      </div>
                      <div style={{ color: 'var(--secondary)' }}>{b.customerName}</div>
                      <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#64748b' }}>
                        {b.selectedServices.join(' • ')}
                      </div>
                    </div>

                    {/* --- NEW: DELETE BUTTON IN HISTORY --- */}
                    <div>
                      <button onClick={() => deleteBooking(b._id)} style={{ padding: '8px 15px', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        Delete
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* --- CHATBOT --- */}
      <div className="chat-container">
        {isChatOpen ? (
          <div className="chat-box">
            <div style={{ padding: '15px', background: 'var(--text-main)', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
              <b>🤖 Service-Bot</b>
              <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            <div style={{ flex: 1, padding: '15px', overflowY: 'auto', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ padding: '10px', borderRadius: '8px', maxWidth: '80%', alignSelf: msg.sender === 'bot' ? 'flex-start' : 'flex-end', background: msg.sender === 'bot' ? '#e2e8f0' : 'var(--primary)', color: msg.sender === 'bot' ? 'black' : 'white' }}>
                  {msg.text}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChat} style={{ display: 'flex', padding: '10px', borderTop: '1px solid #e2e8f0', background: 'white' }}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Type here..." style={{ flex: 1, padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', marginRight: '5px' }} />
              <button type="submit" style={{ padding: '8px 15px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px' }}>Send</button>
            </form>
          </div>
        ) : (
          <button className="chat-bubble-btn" onClick={() => setIsChatOpen(true)}>💬</button>
        )}
      </div>

    </div>
  );
};

export default BookingModule;