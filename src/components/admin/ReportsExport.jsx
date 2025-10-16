import React, { useState, useEffect } from "react";
import { db } from "../../firebase-config";
import { ref, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";
import "./ReportsExport.css";

const ReportsExport = () => {
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState({});
  const [filteredReports, setFilteredReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch reports
    const reportsRef = ref(db, "reports");
    const unsubscribeReports = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : [];
      setReports(list);
      setFilteredReports(list);
    });

    // Fetch user details to get names
    const usersRef = ref(db, "userDetails");
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setUsers(data);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeReports();
      unsubscribeUsers();
    };
  }, []);

  // Get user name from uid
  const getUserName = (userId) => {
    if (!userId) return "N/A";
    const user = users[userId];
    return user?.citizenName || user?.name || "Anonymous";
  };

  // Get user email from uid
  const getUserEmail = (userId) => {
    if (!userId) return "N/A";
    const user = users[userId];
    return user?.emailId || user?.email || "N/A";
  };

  // Filter by status and department
  useEffect(() => {
    let filtered = [...reports];
    
    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => {
        const status = r.status?.toLowerCase() || "pending";
        return status === filterStatus;
      });
    }
    
    if (filterDept !== "all") {
      filtered = filtered.filter((r) => r.department === filterDept);
    }
    
    setFilteredReports(filtered);
  }, [filterStatus, filterDept, reports]);

  // Excel Export
  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredReports.map((r) => ({
        "Citizen Name": getUserName(r.user),
        "Email": getUserEmail(r.user),
        "Category": r.category || "N/A",
        "Description": r.description || "N/A",
        "Status": r.status || "pending",
        "Department": r.department || "N/A",
        "Area": r.area || r.locality || "N/A",
        "Pin Code": r.pinCode || "N/A",
        "Latitude": r.location?.lat || "N/A",
        "Longitude": r.location?.lng || "N/A",
        "Submitted On": r.createdAt
          ? moment(r.createdAt).format("DD-MM-YYYY HH:mm")
          : "N/A",
        "Last Updated": r.updatedAt
          ? moment(r.updatedAt).format("DD-MM-YYYY HH:mm")
          : "N/A",
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CityFix Reports");
    XLSX.writeFile(wb, `CityFix_Reports_${moment().format("DDMMYYYY_HHmm")}.xlsx`);
  };

  // PDF Export
  const exportToPDF = () => {
    const doc = new jsPDF("landscape");
    doc.setFontSize(16);
    doc.setFont(undefined, "bold");
    doc.text("CityFix Report Summary", 14, 15);
    
    doc.setFontSize(10);
    doc.setFont(undefined, "normal");
    doc.text(`Exported on: ${moment().format("DD-MM-YYYY HH:mm")}`, 14, 22);
    doc.text(`Total Records: ${filteredReports.length}`, 14, 27);

    const tableColumn = [
      "Citizen Name",
      "Email",
      "Category",
      "Status",
      "Department",
      "Area",
      "Coordinates",
      "Submitted Date",
    ];

    const tableRows = filteredReports.map((r) => [
      getUserName(r.user),
      getUserEmail(r.user),
      r.category || "N/A",
      r.status || "pending",
      r.department || "N/A",
      r.area || r.locality || "N/A",
      r.location?.lat && r.location?.lng 
        ? `${r.location.lat.toFixed(4)}, ${r.location.lng.toFixed(4)}` 
        : "N/A",
      r.createdAt ? moment(r.createdAt).format("DD-MM-YYYY") : "N/A",
    ]);

    autoTable(doc, {
      startY: 32,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      styles: { 
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save(`CityFix_Reports_${moment().format("DDMMYYYY_HHmm")}.pdf`);
  };

  // Get department-wise auto mapping
  const getDepartment = (category) => {
    if (!category) return "General Maintenance";
    switch (category.toLowerCase()) {
      case "pothole":
        return "Road & Transport Department";
      case "streetlight":
        return "Electricity Department";
      case "garbage":
        return "Sanitation Department";
      case "water leakage":
        return "Water Supply Department";
      default:
        return "General Maintenance";
    }
  };

  if (loading) {
    return (
      <div className="reports-export-container">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
          <p>Loading reports data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-export-container">
      <h2>📦 Export Reports</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Filter and export city issue reports to Excel or PDF format
      </p>

      {/* Statistics Bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12,
        marginBottom: 20
      }}>
        <div style={statCard}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#2196f3" }}>
            {filteredReports.length}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>Total Reports</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#ff9800" }}>
            {filteredReports.filter(r => !r.status || r.status.toLowerCase() === "pending").length}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>Pending</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#2196f3" }}>
            {filteredReports.filter(r => r.status?.toLowerCase() === "in-progress").length}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>In Progress</div>
        </div>
        <div style={statCard}>
          <div style={{ fontSize: 24, fontWeight: "bold", color: "#4caf50" }}>
            {filteredReports.filter(r => r.status?.toLowerCase() === "resolved").length}
          </div>
          <div style={{ fontSize: 12, color: "#666" }}>Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div>
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div>
          <label>Department:</label>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="all">All Departments</option>
            <option value="Road & Transport Department">Road & Transport</option>
            <option value="Water Supply Department">Water Supply</option>
            <option value="Electricity Department">Electricity</option>
            <option value="Sanitation Department">Sanitation</option>
            <option value="General Maintenance">General Maintenance</option>
          </select>
        </div>
      </div>

      {/* Export Buttons */}
      <div className="export-buttons">
        <button 
          onClick={exportToExcel} 
          className="excel-btn"
          disabled={filteredReports.length === 0}
        >
          📊 Export to Excel
        </button>
        <button 
          onClick={exportToPDF} 
          className="pdf-btn"
          disabled={filteredReports.length === 0}
        >
          📄 Export to PDF
        </button>
      </div>

      {/* Table Preview */}
      <div className="table-container">
        <h3 style={{ marginBottom: 12 }}>Preview ({filteredReports.length} records)</h3>
        {filteredReports.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p>No reports found matching the selected filters</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Citizen Name</th>
                <th>Email</th>
                <th>Category</th>
                <th>Status</th>
                <th>Department</th>
                <th>Area</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.slice(0, 50).map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{getUserName(r.user)}</strong>
                  </td>
                  <td style={{ fontSize: 12 }}>{getUserEmail(r.user)}</td>
                  <td>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: "#e3f2fd",
                      fontSize: 12
                    }}>
                      {r.category || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      background: 
                        r.status?.toLowerCase() === "resolved" ? "#e8f5e9" :
                        r.status?.toLowerCase() === "in-progress" ? "#e3f2fd" :
                        "#fff3e0",
                      color:
                        r.status?.toLowerCase() === "resolved" ? "#4caf50" :
                        r.status?.toLowerCase() === "in-progress" ? "#2196f3" :
                        "#ff9800",
                      fontSize: 12,
                      fontWeight: 600
                    }}>
                      {r.status || "pending"}
                    </span>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {r.department || getDepartment(r.category)}
                  </td>
                  <td style={{ fontSize: 12 }}>{r.area || r.locality || "N/A"}</td>
                  <td style={{ fontSize: 12 }}>
                    {r.createdAt ? moment(r.createdAt).format("DD-MM-YYYY") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {filteredReports.length > 50 && (
          <p style={{ textAlign: "center", marginTop: 12, color: "#666", fontSize: 12 }}>
            Showing first 50 records. Export to see all {filteredReports.length} records.
          </p>
        )}
      </div>
    </div>
  );
};

const statCard = {
  background: "#fff",
  padding: 16,
  borderRadius: 8,
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  textAlign: "center"
};

export default ReportsExport;