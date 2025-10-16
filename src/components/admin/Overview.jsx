import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import { ref, onValue, update } from "firebase/database";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Legend
} from "recharts";

const COLORS = ["#ff9800", "#2196f3", "#4caf50", "#9c27b0", "#f44336"];

const Overview = () => {
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState({
    total: 0, pending: 0, inProgress: 0, resolved: 0, categories: {}
  });
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const reportsRef = ref(db, "reports");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
      // Sort newest first
      list.sort((a, b) => {
        const dateA = new Date(b.createdAt || b.timestamp || 0);
        const dateB = new Date(a.createdAt || a.timestamp || 0);
        return dateA - dateB;
      });
      setReports(list);
      setRecent(list.slice(0, 6));
      calculateAnalytics(list);
    });
    return () => unsubscribe();
  }, []);

  const calculateAnalytics = (list) => {
    const total = list.length;
    
    // FIXED: Use correct status values with normalization
    const pending = list.filter((r) => !r.status || r.status.toLowerCase() === "pending").length;
    const inProgress = list.filter((r) => r.status?.toLowerCase() === "in-progress").length;
    const resolved = list.filter((r) => r.status?.toLowerCase() === "resolved").length;
    
    const categories = {};
    list.forEach((r) => { 
      const cat = r.category || "Unknown";
      categories[cat] = (categories[cat] || 0) + 1; 
    });
    
    setAnalytics({ total, pending, inProgress, resolved, categories });
  };

  const statusData = [
    { name: "Pending", value: analytics.pending, color: "red" },
    { name: "In Progress", value: analytics.inProgress, color: "blue" },
    { name: "Resolved", value: analytics.resolved, color: "green" },
  ].filter(item => item.value > 0); // Only show statuses with values

  const categoryData = Object.entries(analytics.categories)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 categories

  // ----- ADMIN ACTIONS -----
  const updateStatus = async (id, status) => {
    try {
      const reportRef = ref(db, `reports/${id}`);
      await update(reportRef, { status });
      alert(`Status updated to ${status} successfully!`);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status: " + err.message);
    }
  };

  const assignDepartment = async (id, department) => {
    try {
      const reportRef = ref(db, `reports/${id}`);
      await update(reportRef, { department });
      alert("Department assigned successfully!");
    } catch (err) {
      console.error("Failed to assign department:", err);
      alert("Failed to assign department: " + err.message);
    }
  };

  // Get status display info
  const getStatusInfo = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    const statusMap = {
      "pending": { color: "red", icon: "⏳", text: "Pending" },
      "in-progress": { color: "blue", icon: "🔄", text: "In Progress" },
      "resolved": { color: "green", icon: "✅", text: "Resolved" }
    };
    return statusMap[statusLower] || statusMap["pending"];
  };

  return (
    <div style={{ padding: 24, fontFamily: "Arial, sans-serif", background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 28 }}>📊 Admin Overview</h2>
        <p style={{ margin: 0, color: "#666" }}>Real-time summary and quick actions on recent reports.</p>
      </div>

      {/* Statistics Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
        gap: 16,
        marginBottom: 28
      }}>
        <StatCard title="Total Reports" value={analytics.total} color="black" icon="📋" />
        <StatCard title="Pending" value={analytics.pending} color="red" icon="⏳" />
        <StatCard title="In Progress" value={analytics.inProgress} color="blue" icon="🔄" />
        <StatCard title="Resolved" value={analytics.resolved} color="green" icon="✅" />
      </div>

      {/* Charts Section */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", 
        gap: 20, 
        marginBottom: 28 
      }}>
        {/* Status Distribution */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 18 }}>Status Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie 
                data={statusData} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                outerRadius={90} 
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Categories */}
        <div style={{ background: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 18 }}>Top Categories</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={categoryData}>
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                style={{ fontSize: 11 }}
              />
              <YAxis />
              <Bar dataKey="value" fill="#2196f3" radius={[8, 8, 0, 0]} />
              <Tooltip />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Reports Section */}
      <div style={{ 
        background: "#fff", 
        padding: 20, 
        borderRadius: 12, 
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)" 
      }}>
        <h3 style={{ margin: "0 0 16px 0", fontSize: 18 }}>
          Recent Reports - Quick Actions
          <span style={{ 
            marginLeft: 10, 
            fontSize: 14, 
            fontWeight: "normal", 
            color: "#666" 
          }}>
            ({recent.length} latest)
          </span>
        </h3>
        
        {recent.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "#999" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <p>No reports yet</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {recent.map((r) => {
              const statusInfo = getStatusInfo(r.status);
              
              return (
                <div key={r.id} style={{
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  padding: 16, 
                  background: "#fafafa", 
                  borderRadius: 10, 
                  border: "1px solid #eee",
                  transition: "all 0.2s ease"
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: 600, 
                      fontSize: 15,
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}>
                      {r.issueName || r.category || "Issue"}
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        background: statusInfo.color + "20",
                        color: statusInfo.color
                      }}>
                        {statusInfo.icon} {statusInfo.text}
                      </span>
                    </div>
                    
                    <div style={{ color: "#666", fontSize: 13, marginBottom: 8 }}>
                      {r.description?.slice(0, 140) || "-"}
                    </div>
                    
                    <div style={{ fontSize: 12, color: "#777" }}>
                      <strong>📍 Area:</strong> {r.area || r.locality || r.pinCode || "Unknown"}
                      {r.department && (
                        <>
                          {" • "}
                          <strong>🏢 Dept:</strong> {r.department}
                        </>
                      )}
                    </div>
                  </div>

                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column",
                    gap: 8, 
                    marginLeft: 16,
                    alignItems: "flex-end"
                  }}>
                    {/* Department Assignment */}
                    <select 
                      value={r.department || ""} 
                      onChange={(e) => assignDepartment(r.id, e.target.value)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #ddd",
                        background: "#fff",
                        fontSize: 12,
                        cursor: "pointer",
                        minWidth: 160
                      }}
                    >
                      <option value="">Assign Department</option>
                      <option value="Road & Transport Department">🛣️ Roads</option>
                      <option value="Electricity Department">⚡ Electricity</option>
                      <option value="Sanitation Department">🗑️ Sanitation</option>
                      <option value="Water Supply Department">💧 Water</option>
                      <option value="General Maintenance">🔧 General</option>
                    </select>

                    {/* Status Update Buttons */}
                    <div style={{ display: "flex", gap: 6 }}>
                      <button 
                        onClick={() => updateStatus(r.id, "pending")} 
                        style={{
                          ...btnStyle("red"),
                          opacity: r.status === "pending" ? 1 : 0.5
                        }}
                        title="Set as Pending"
                      >
                        ⏳
                      </button>
                      <button 
                        onClick={() => updateStatus(r.id, "in-progress")} 
                        style={{
                          ...btnStyle("blue"),
                          opacity: r.status === "in-progress" ? 1 : 0.5
                        }}
                        title="Set as In Progress"
                      >
                        🔄
                      </button>
                      <button 
                        onClick={() => updateStatus(r.id, "resolved")} 
                        style={{
                          ...btnStyle("green"),
                          opacity: r.status === "resolved" ? 1 : 0.5
                        }}
                        title="Mark as Resolved"
                      >
                        ✅
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 20,
        padding: 16,
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        fontSize: 13
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "red" }}></div>
          <span>⏳ Pending - Awaiting action</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "blue" }}></div>
          <span>🔄 In Progress - Being worked on</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "green" }}></div>
          <span>✅ Resolved - Completed successfully</span>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color, icon }) => (
  <div style={{ 
    background: "#fff", 
    padding: 18, 
    borderRadius: 12, 
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    borderTop: `4px solid ${color}`,
    transition: "transform 0.2s ease",
    cursor: "default"
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
      <div>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      </div>
      <div style={{ fontSize: 32, opacity: 0.3 }}>{icon}</div>
    </div>
  </div>
);

const btnStyle = (bg) => ({
  padding: "8px 12px", 
  backgroundColor: bg, 
  color: "white", 
  border: "none", 
  borderRadius: 6, 
  cursor: "pointer", 
  fontSize: 16,
  fontWeight: "600",
  transition: "all 0.2s ease",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
});

export default Overview;