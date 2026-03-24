import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./BookingModule.css"; 
import "./BillingModule.css";

const BillingModule = () => {
  const [activeTab, setActiveTab] = useState('ready'); // 'ready', 'drafts', 'final'
  
  const [records, setRecords] = useState([]);
  const [bills, setBills] = useState([]);
  const [isBlinking, setIsBlinking] = useState(false);

  // Edit Draft State
  const [editingBillId, setEditingBillId] = useState(null);
  const [draftInputs, setDraftInputs] = useState({ additionalBillingCharges: 0, discount: 0 });

  const fetchData = async () => {
    try {
      const [recRes, billRes] = await Promise.all([
        axios.get("http://localhost:5000/api/service-records"),
        axios.get("http://localhost:5000/api/bills")
      ]);
      setRecords(recRes.data || []);
      setBills(billRes.data || []);
    } catch (err) { toast.error("Failed to fetch billing data."); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- 1. CREATE DRAFT BILL ---
  const handleCreateDraft = async (record) => {
    try {
      const payload = {
        serviceRecordId: record._id,
        vehicleNumber: record.vehicleNumber,
        customerName: record.customerName,
        serviceTotal: record.finalTotal, // From the mechanic
        grandTotal: record.finalTotal // Starting point
      };
      
      await axios.post("http://localhost:5000/api/bills", payload);
      toast.success("Draft Bill Created! 📝");
      fetchData();
      setActiveTab('drafts');
    } catch (error) { toast.error("Failed to create draft."); }
  };

  // --- 2. SAVE DRAFT CHANGES ---
  const handleSaveDraft = async (bill) => {
    const additional = Number(draftInputs.additionalBillingCharges) || 0;
    const discount = Number(draftInputs.discount) || 0;
    const newGrandTotal = bill.serviceTotal + additional - discount;

    try {
      await axios.put(`http://localhost:5000/api/bills/${bill._id}`, {
        additionalBillingCharges: additional,
        discount: discount,
        grandTotal: newGrandTotal
      });
      toast.success("Draft Updated.");
      setEditingBillId(null);
      fetchData();
    } catch (error) { toast.error("Failed to update draft."); }
  };

  // --- 3. FINALIZE BILL ---
  const handleFinalizeBill = async (bill) => {
    if (!window.confirm("Finalize this bill? It will become uneditable.")) return;
    try {
      await axios.put(`http://localhost:5000/api/bills/${bill._id}`, {
        status: 'Finalized',
        finalizedAt: new Date()
      });
      toast.success("Bill Finalized and Locked! 🔒");
      fetchData();
      setActiveTab('final');
    } catch (error) { toast.error("Failed to finalize."); }
  };

  // --- 4. SECURE DELETE FUNCTION ---
  const handleDeleteFinalBill = async (bill) => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1); // Exact date 1 month ago
    const finalizedDate = new Date(bill.finalizedAt);

    // SECURITY CHECK: If the bill is less than 1 month old
    if (finalizedDate > oneMonthAgo) {
      // Trigger Red Blink Animation
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 900); // Remove class after animation
      toast.error("SECURITY LOCK: Finalized bills can only be deleted after 1 month has passed!", { duration: 4000 });
      return;
    }

    if (window.confirm("This bill is over 1 month old. Delete permanently?")) {
      try {
        await axios.delete(`http://localhost:5000/api/bills/${bill._id}`);
        toast.success("Old Bill Archived/Deleted.");
        fetchData();
      } catch (error) { toast.error("Failed to delete."); }
    }
  };

  const handleDeleteDraft = async (id) => {
    if (window.confirm("Discard this draft?")) {
      await axios.delete(`http://localhost:5000/api/bills/${id}`);
      fetchData();
    }
  };

  // --- 5. GENERATE DETAILED PDF INVOICE ---
  const generatePDF = (bill) => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); 
      doc.text("SERVICE INVOICE", 105, 20, null, null, "center");
      
      // Bill Details
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105); 
      doc.text(`Invoice ID: ${bill._id.substring(0, 8).toUpperCase()}`, 14, 40);
      doc.text(`Date: ${new Date(bill.finalizedAt).toLocaleDateString()}`, 14, 48);
      
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(`Customer: ${bill.customerName}`, 14, 58);
      doc.text(`Vehicle: ${bill.vehicleNumber}`, 14, 66);

      // --- NEW: FETCH DETAILED RECORD DATA ---
      // Find the detailed mechanic record that matches this bill
      const record = records.find(r => r._id === bill.serviceRecordId);
      
      const tableData = [];

      if (record) {
        // 1. Labor & Base Services Section
        tableData.push([{ content: 'Labor & Services Performed', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }]);
        tableData.push([record.servicesPerformed.join('\n'), `${record.bookingCost.toLocaleString()} LKR`]);

        // 2. Spare Parts & Consumables Section
        if (record.usedParts && record.usedParts.length > 0) {
          tableData.push([{ content: 'Parts & Consumables', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }]);
          record.usedParts.forEach(part => {
            tableData.push([`${part.partName} (Qty: ${part.quantity})`, `${part.totalPrice.toLocaleString()} LKR`]);
          });
        }

        // Mechanic Extra Charges (if any were added in the bay)
        if (record.additionalCharges > 0) {
          tableData.push(['Additional Bay Charges / Extra Labor', `${record.additionalCharges.toLocaleString()} LKR`]);
        }
      } else {
        // Fallback if record is somehow missing
        tableData.push(["Base Service & Parts", `${bill.serviceTotal.toLocaleString()} LKR`]);
      }

      // 3. Billing Adjustments Section (Admin/Cashier level)
      if (bill.additionalBillingCharges > 0 || bill.discount > 0) {
        tableData.push([{ content: 'Billing Adjustments', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [15, 23, 42] } }]);
        
        if (bill.additionalBillingCharges > 0) {
          tableData.push(["Admin / Late Fees", `+ ${bill.additionalBillingCharges.toLocaleString()} LKR`]);
        }
        if (bill.discount > 0) {
          tableData.push(["Discount Applied", `- ${bill.discount.toLocaleString()} LKR`]);
        }
      }

      // Draw the Table
      autoTable(doc, {
        startY: 75,
        head: [['Description', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, 
        styles: { fontSize: 10, cellPadding: 6 },
        columnStyles: {
          1: { halign: 'right', cellWidth: 50 } // Aligns the prices to the right neatly
        }
      });

      // Get Y position where table ended
      const finalY = doc.lastAutoTable.finalY || 110;
      
      // Grand Total
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(30, 58, 138); 
      doc.text(`GRAND TOTAL:`, 14, finalY + 15);
      doc.text(`${bill.grandTotal.toLocaleString()} LKR`, 196, finalY + 15, { align: 'right' });

      // Save the file
      doc.save(`Invoice_${bill.vehicleNumber}_${new Date().getTime()}.pdf`);
      toast.success("Detailed Itemized Invoice Downloaded! 📄");
      
    } catch (error) {
      console.error("PDF Generation Error:", error);
      toast.error("Failed to generate PDF. Check console.");
    }
  };

  // --- DATA FILTERING ---
  const completedServices = records.filter(r => r.status === 'Completed');
  // Only show services that DO NOT have a bill created yet
  const unbilledServices = completedServices.filter(r => !bills.some(b => b.serviceRecordId === r._id));
  
  const draftBills = bills.filter(b => b.status === 'Draft');
  const finalBills = bills.filter(b => b.status === 'Finalized').sort((a,b) => new Date(b.finalizedAt) - new Date(a.finalizedAt));

  // --- NEW: CALCULATE TOTAL REVENUE ---
  const totalRevenue = finalBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);

  return (
    <div>
      {/* RED BLINK OVERLAY COMPONENT */}
      {isBlinking && <div className="security-red-blink"></div>}

      <div className="module-header">
        <h2>Billing & Invoicing</h2>
      </div>

      <div className="tab-container">
        <button className={`tab-btn ${activeTab === 'ready' ? 'active' : ''}`} onClick={() => setActiveTab('ready')}>
          📥 Ready to Bill ({unbilledServices.length})
        </button>
        <button className={`tab-btn ${activeTab === 'drafts' ? 'active' : ''}`} onClick={() => setActiveTab('drafts')}>
          📝 Draft Bills ({draftBills.length})
        </button>
        <button className={`tab-btn ${activeTab === 'final' ? 'active' : ''}`} onClick={() => setActiveTab('final')}>
          🔒 Final Invoices
        </button>
      </div>

      <div className="tab-content-area" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
        
        {/* ======================================= */}
        {/* TAB 1: READY TO BILL                    */}
        {/* ======================================= */}
        {activeTab === 'ready' && (
          <div className="billing-grid fade-in">
            {unbilledServices.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1', background: 'white' }}>No completed services waiting for billing.</div>
            ) : (
              unbilledServices.map(r => (
                <div key={r._id} className="bill-card" style={{ borderTop: '5px solid #3b82f6' }}>
                  <div className="bill-header">
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>{r.vehicleNumber}</div>
                      <div style={{ color: 'var(--secondary)' }}>{r.customerName}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#3b82f6' }}>{r.serviceDate}</div>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '15px' }}>
                    Includes: {r.servicesPerformed.join(', ')} <br/>
                    Parts: {r.usedParts?.length || 0} items used.
                  </div>
                  <div className="finance-row grand-total" style={{ border: 'none', padding: 0, marginTop: 'auto' }}>
                    <span>Mechanic Total:</span>
                    <span>{r.finalTotal.toLocaleString()} LKR</span>
                  </div>
                  <button className="btn-submit" style={{ marginTop: '15px' }} onClick={() => handleCreateDraft(r)}>
                    Generate Draft Bill ➡️
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 2: DRAFT BILLS (Editable)           */}
        {/* ======================================= */}
        {activeTab === 'drafts' && (
          <div className="billing-grid fade-in">
            {draftBills.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1', background: 'white' }}>No draft bills.</div>
            ) : (
              draftBills.map(b => (
                <div key={b._id} className="bill-card" style={{ borderTop: '5px solid #f59e0b', background: '#fffbeb' }}>
                  <div className="bill-header">
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '900' }}>{b.vehicleNumber}</div>
                      <div style={{ color: 'var(--secondary)' }}>{b.customerName}</div>
                    </div>
                    <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold', height: 'fit-content' }}>DRAFT</span>
                  </div>

                  <div className="finance-row"><span>Service & Parts:</span> <b>{b.serviceTotal.toLocaleString()} LKR</b></div>
                  
                  {editingBillId === b._id ? (
                    <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #fcd34d', marginBottom: '10px' }}>
                      <div className="input-group" style={{ marginBottom: '10px' }}>
                        <label>Extra Charges (LKR)</label>
                        <input type="number" value={draftInputs.additionalBillingCharges} onChange={(e) => setDraftInputs({...draftInputs, additionalBillingCharges: e.target.value})} />
                      </div>
                      <div className="input-group" style={{ marginBottom: '10px' }}>
                        <label>Discount (LKR)</label>
                        <input type="number" value={draftInputs.discount} onChange={(e) => setDraftInputs({...draftInputs, discount: e.target.value})} />
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setEditingBillId(null)} style={{ flex: 1, padding: '8px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                        <button onClick={() => handleSaveDraft(b)} style={{ flex: 1, padding: '8px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="finance-row"><span>Extra Charges:</span> <b>+ {b.additionalBillingCharges.toLocaleString()} LKR</b></div>
                      <div className="finance-row"><span>Discount:</span> <b style={{ color: '#16a34a' }}>- {b.discount.toLocaleString()} LKR</b></div>
                      
                      <div className="finance-row grand-total">
                        <span>Grand Total:</span>
                        <span>{b.grandTotal.toLocaleString()} LKR</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button onClick={() => handleDeleteDraft(b._id)} style={{ padding: '10px', background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                        <button onClick={() => { setEditingBillId(b._id); setDraftInputs({ additionalBillingCharges: b.additionalBillingCharges, discount: b.discount }); }} style={{ flex: 1, padding: '10px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Edit Pricing</button>
                        <button onClick={() => handleFinalizeBill(b)} style={{ flex: 1, padding: '10px', background: 'var(--success)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Finalize ✅</button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ======================================= */}
        {/* TAB 3: FINAL INVOICES                   */}
        {/* ======================================= */}
        {activeTab === 'final' && (
          <div className="fade-in">
            
            {/* --- NEW: REVENUE BANNER --- */}
            <div style={{ background: '#dcfce7', color: '#166534', padding: '20px', borderRadius: '8px', marginBottom: '25px', border: '2px solid #bbf7d0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Total Generated Revenue</h3>
                <span style={{ fontSize: '0.9rem', color: '#15803d' }}>From {finalBills.length} finalized service(s)</span>
              </div>
              <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '900' }}>
                {totalRevenue.toLocaleString()} LKR
              </h2>
            </div>

            <div className="billing-grid">
              {finalBills.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1 / -1', background: 'white' }}>No finalized invoices yet.</div>
              ) : (
                finalBills.map(b => (
                  <div key={b._id} className="bill-card" style={{ borderTop: '5px solid #10b981', background: '#f8fafc' }}>
                    <div className="bill-header">
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>{b.vehicleNumber}</div>
                        <div style={{ color: 'var(--secondary)' }}>{b.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '5px' }}>ID: {b._id.substring(0, 8).toUpperCase()}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold' }}>FINALIZED</span><br/>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', display: 'inline-block', marginTop: '5px' }}>
                          {new Date(b.finalizedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="finance-row"><span>Service & Parts:</span> <span>{b.serviceTotal.toLocaleString()} LKR</span></div>
                    <div className="finance-row"><span>Extra Charges:</span> <span>+ {b.additionalBillingCharges.toLocaleString()} LKR</span></div>
                    <div className="finance-row"><span>Discount:</span> <span style={{ color: '#16a34a' }}>- {b.discount.toLocaleString()} LKR</span></div>
                    
                    <div className="finance-row grand-total" style={{ borderTopColor: '#a7f3d0' }}>
                      <span>PAID TOTAL:</span>
                      <span style={{ color: '#047857' }}>{b.grandTotal.toLocaleString()} LKR</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                      <button onClick={() => handleDeleteFinalBill(b)} style={{ flex: 1, padding: '10px', background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>
                        Delete Record
                      </button>
                      <button onClick={() => generatePDF(b)} style={{ flex: 2, padding: '10px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                        📄 Download PDF
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BillingModule;