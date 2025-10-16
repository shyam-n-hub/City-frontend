import React, { useEffect, useState } from "react";
import { db } from "../../firebase-config";
import { ref, onValue } from "firebase/database";

const UserDetailsAdmin = () => {
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all user details
    const userRef = ref(db, "userDetails");
    const reportRef = ref(db, "reports");

    const unsubUsers = onValue(userRef, (snapshot) => {
      const data = snapshot.val() || {};
      const userList = Object.entries(data).map(([uid, value]) => ({
        uid,
        ...value,
      }));
      setUsers(userList);
    });

    const unsubReports = onValue(reportRef, (snapshot) => {
      const data = snapshot.val() || {};
      const reportList = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));
      setReports(reportList);
      setLoading(false);
    });

    return () => {
      unsubUsers();
      unsubReports();
    };
  }, []);

  // FIXED: Compute each user's report statistics with correct status values
  const getReportStats = (uid) => {
    const userReports = reports.filter((r) => r.user === uid); // Changed from userId to user
    return {
      total: userReports.length,
      pending: userReports.filter((r) => !r.status || r.status.toLowerCase() === "pending").length,
      inProgress: userReports.filter((r) => r.status?.toLowerCase() === "in-progress").length,
      resolved: userReports.filter((r) => r.status?.toLowerCase() === "resolved").length,
    };
  };

  if (loading) {
    return (
      <div style={{ padding: 30, textAlign: "center" }}>
        <div style={{ fontSize: 24, marginBottom: 10 }}>⏳</div>
        <div>Loading user data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: "0 0 8px 0", fontSize: 28 }}>👥 Registered Citizens</h2>
        <p style={{ margin: 0, color: "#666" }}>
          View all citizen profiles and their reported issue summary.
        </p>
      </div>

      {/* Statistics Overview */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <div style={summaryCard}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>👤</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#1976d2" }}>{users.length}</div>
          <div style={{ fontSize: 14, color: "#666" }}>Total Citizens</div>
        </div>
        <div style={summaryCard}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#ff9800" }}>{reports.length}</div>
          <div style={{ fontSize: 14, color: "#666" }}>Total Reports</div>
        </div>
        <div style={summaryCard}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#4caf50" }}>
            {users.length > 0 ? (reports.length / users.length).toFixed(1) : 0}
          </div>
          <div style={{ fontSize: 14, color: "#666" }}>Avg Reports/User</div>
        </div>
      </div>

      {/* User Table */}
      <div style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden"
      }}>
        {users.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#999" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>👥</div>
            <p>No users found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14
            }}>
              <thead>
                <tr style={{ background: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                  <th style={tableHeader}>Citizen Name</th>
                  <th style={tableHeader}>Contact Info</th>
                  <th style={tableHeader}>Location</th>
                  <th style={tableHeader}>Municipality</th>
                  <th style={tableHeader}>Total Reports</th>
                  <th style={tableHeader}>⏳ Pending</th>
                  <th style={tableHeader}>🔄 In Progress</th>
                  <th style={tableHeader}>✅ Resolved</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => {
                  const stats = getReportStats(user.uid);

                  return (
                    <tr
                      key={user.uid}
                      style={{
                        borderBottom: "1px solid #eee",
                        background: index % 2 === 0 ? "#fff" : "#fafafa",
                        transition: "background 0.2s ease"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#f0f7ff"}
                      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? "#fff" : "#fafafa"}
                    >
                      <td style={tableCell}>
                        <div style={{ fontWeight: 600, color: "#333" }}>
                          {user.citizenName || "Unnamed User"}
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={{ fontSize: 13 }}>
                          <div style={{ marginBottom: 4 }}>📧 {user.emailId}</div>
                          <div>📱 {user.mobileNumber}</div>
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={{ fontSize: 13, color: "#666" }}>
                          {user.area || "N/A"}, {user.locality || "N/A"}
                          <br />
                          📮 {user.pinCode || "N/A"}
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={{ fontSize: 13, color: "#666" }}>
                          🏢 {user.municipalityName || "Not Specified"}
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: 20,
                          background: "#e3f2fd",
                          color: "black",
                          fontWeight: "bold",
                          fontSize: 16
                        }}>
                          {stats.total}
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: 6,
                          background: stats.pending > 0 ? "#fff3e0" : "#f5f5f5",
                          color: stats.pending > 0 ? "red" : "#999",
                          fontWeight: stats.pending > 0 ? "bold" : "normal"
                        }}>
                          {stats.pending}
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: 6,
                          background: stats.inProgress > 0 ? "#e3f2fd" : "#f5f5f5",
                          color: stats.inProgress > 0 ? "blue" : "#999",
                          fontWeight: stats.inProgress > 0 ? "bold" : "normal"
                        }}>
                          {stats.inProgress}
                        </div>
                      </td>
                      <td style={tableCell}>
                        <div style={{
                          display: "inline-block",
                          padding: "6px 12px",
                          borderRadius: 6,
                          background: stats.resolved > 0 ? "#e8f5e9" : "#f5f5f5",
                          color: stats.resolved > 0 ? "green" : "#999",
                          fontWeight: stats.resolved > 0 ? "bold" : "normal"
                        }}>
                          {stats.resolved}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        marginTop: 16,
        padding: 16,
        background: "#f9f9f9",
        borderRadius: 8,
        display: "flex",
        gap: 20,
        flexWrap: "wrap",
        fontSize: 13
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "red" }}></div>
          <span>Pending - Awaiting action</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "blue" }}></div>
          <span>In Progress - Being worked on</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "green" }}></div>
          <span>Resolved - Completed</span>
        </div>
      </div>
    </div>
  );
};

// Reusable styles
const summaryCard = {
  background: "#fff",
  padding: 20,
  borderRadius: 12,
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  textAlign: "center"
};

const tableHeader = {
  padding: "16px 12px",
  textAlign: "left",
  fontWeight: 600,
  color: "#555",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const tableCell = {
  padding: "16px 12px",
  textAlign: "left",
  verticalAlign: "middle"
};

export default UserDetailsAdmin;