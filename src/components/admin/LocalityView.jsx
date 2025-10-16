import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase-config";
import { ref, onValue } from "firebase/database";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Tooltip,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#ff9800", "#2196f3", "#4caf50", "#f44336"];

const LocalityView = () => {
  const [reports, setReports] = useState([]);
  const [localityData, setLocalityData] = useState([]);
  const [totalStats, setTotalStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    const reportsRef = ref(db, "reports");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reportList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setReports(reportList);
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ Group reports by locality or pin code with FIXED status values
  const groupedLocalities = useMemo(() => {
    const groups = {};
    let stats = { total: 0, pending: 0, inProgress: 0, resolved: 0 };

    reports.forEach((r) => {
      const key = r.pinCode || r.area || r.locality || "Unknown Area";
      
      if (!groups[key]) {
        groups[key] = {
          total: 0,
          pending: 0,
          inProgress: 0,
          resolved: 0,
          lat: 0,
          lng: 0,
          count: 0,
        };
      }

      groups[key].total++;
      stats.total++;

      // FIXED: Normalize status and handle all cases
      const status = r.status?.toLowerCase() || "pending";
      
      if (status === "pending") {
        groups[key].pending++;
        stats.pending++;
      } else if (status === "in-progress") {
        groups[key].inProgress++;
        stats.inProgress++;
      } else if (status === "resolved") {
        groups[key].resolved++;
        stats.resolved++;
      } else {
        // Handle any other status as pending
        groups[key].pending++;
        stats.pending++;
      }

      if (r.location?.lat && r.location?.lng) {
        groups[key].lat += parseFloat(r.location.lat);
        groups[key].lng += parseFloat(r.location.lng);
        groups[key].count++;
      }
    });

    // Average location per area
    Object.keys(groups).forEach((key) => {
      if (groups[key].count > 0) {
        groups[key].lat /= groups[key].count;
        groups[key].lng /= groups[key].count;
      } else {
        groups[key].lat = 10.85;
        groups[key].lng = 78.69;
      }
    });

    const array = Object.entries(groups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total); // Sort by total reports

    setLocalityData(array);
    setTotalStats(stats);
    return array;
  }, [reports]);

  // Pie chart data for overall status distribution
  const pieData = [
    { name: "Pending", value: totalStats.pending, color: "red" },
    { name: "In Progress", value: totalStats.inProgress, color: "blue" },
    { name: "Resolved", value: totalStats.resolved, color: "green" },
  ].filter((item) => item.value > 0);

  return (
    <div style={{ padding: "25px", fontFamily: "Arial, sans-serif" }}>
      <h2>📍 Locality / Area-Wise Report Overview</h2>
      <p style={{ color: "#555", marginBottom: 20 }}>
        Visualize issue density and progress by location (based on Pin Code or GPS).
      </p>

      {/* Overall Statistics Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "15px",
          marginBottom: "30px",
        }}
      >
        <div style={statCardStyle("black")}>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>{totalStats.total}</div>
          <div style={{ fontSize: 14, marginTop: 5 }}>Total Reports</div>
        </div>
        <div style={statCardStyle("red")}>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>{totalStats.pending}</div>
          <div style={{ fontSize: 14, marginTop: 5 }}>⏳ Pending</div>
        </div>
        <div style={statCardStyle("blue")}>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>{totalStats.inProgress}</div>
          <div style={{ fontSize: 14, marginTop: 5 }}>🔄 In Progress</div>
        </div>
        <div style={statCardStyle("green")}>
          <div style={{ fontSize: 32, fontWeight: "bold" }}>{totalStats.resolved}</div>
          <div style={{ fontSize: 14, marginTop: 5 }}>✅ Resolved</div>
        </div>
      </div>

      {/* Status Distribution Pie Chart */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
          marginBottom: "30px",
        }}
      >
        <h3>📊 Overall Status Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, value, percent }) =>
                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
              }
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ReTooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Locality Cards */}
      <h3 style={{ marginBottom: 15 }}>📌 Locality Breakdown</h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        {localityData.map((loc, i) => {
          const completionRate = loc.total > 0 
            ? ((loc.resolved / loc.total) * 100).toFixed(0) 
            : 0;

          return (
            <div
              key={i}
              style={{
                backgroundColor: "#fff",
                borderRadius: "10px",
                padding: "18px",
                boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
                borderLeft: "6px solid #1976d2",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <h3 style={{ color: "#1976d2", marginBottom: "8px", flex: 1 }}>
                  {loc.name}
                </h3>
                <div
                  style={{
                    background: completionRate >= 50 ? "#e8f5e9" : "#fff3e0",
                    color: completionRate >= 50 ? "#4caf50" : "#ff9800",
                    padding: "4px 10px",
                    borderRadius: 12,
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                >
                  {completionRate}% Done
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <p style={{ margin: "8px 0", fontSize: 15 }}>
                  <strong>Total Reports:</strong>{" "}
                  <span style={{ color: "black", fontWeight: "bold" }}>
                    {loc.total}
                  </span>
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
                  <div style={miniStatStyle("red")}>
                    <div style={{ fontSize: 18, fontWeight: "bold" }}>{loc.pending}</div>
                    <div style={{ fontSize: 11 }}>Pending</div>
                  </div>
                  <div style={miniStatStyle("blue")}>
                    <div style={{ fontSize: 18, fontWeight: "bold" }}>{loc.inProgress}</div>
                    <div style={{ fontSize: 11 }}>In Progress</div>
                  </div>
                  <div style={miniStatStyle("green")}>
                    <div style={{ fontSize: 18, fontWeight: "bold" }}>{loc.resolved}</div>
                    <div style={{ fontSize: 11 }}>Resolved</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ marginTop: 12 }}>
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      background: "#f0f0f0",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${completionRate}%`,
                        height: "100%",
                        background: "linear-gradient(90deg, #4caf50, #66bb6a)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Visualization */}
      <div
        style={{
          marginTop: "40px",
          backgroundColor: "#fff",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h3>🗺️ Issue Density Map</h3>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 15 }}>
          Circle size represents total reports. Color indicates completion status (Red: more pending, Green: more resolved)
        </p>
        <MapContainer
          center={[10.85, 78.69]}
          zoom={6}
          style={{ height: "450px", width: "100%", borderRadius: "8px" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          {localityData.map(
            (loc, index) =>
              loc.lat &&
              loc.lng && (
                <CircleMarker
                  key={index}
                  center={[loc.lat, loc.lng]}
                  radius={Math.min(30, Math.max(8, loc.total * 1.5))}
                  color={
                    loc.resolved > loc.pending
                      ? "green"
                      : loc.inProgress > loc.pending
                      ? "blue"
                      : "red"
                  }
                  fillOpacity={0.6}
                  weight={2}
                >
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                    <div style={{ fontSize: "12px" }}>
                      <strong style={{ fontSize: 13 }}>{loc.name}</strong>
                      <br />
                      <strong>Total:</strong> {loc.total}
                      <br />
                      <span style={{ color: "red" }}>⏳ Pending: {loc.pending}</span>
                      <br />
                      <span style={{ color: "blue" }}>🔄 In Progress: {loc.inProgress}</span>
                      <br />
                      <span style={{ color: "green" }}>✅ Resolved: {loc.resolved}</span>
                    </div>
                  </Tooltip>
                </CircleMarker>
              )
          )}
        </MapContainer>
      </div>

      {/* Bar Chart */}
      <div
        style={{
          marginTop: "40px",
          backgroundColor: "#fff",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
        }}
      >
        <h3>📊 Top Localities by Report Count</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={localityData.slice(0, 10)}>
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              style={{ fontSize: 12 }}
            />
            <YAxis />
            <ReTooltip />
            <Legend />
            <Bar dataKey="pending" stackId="a" fill="red" name="⏳ Pending" />
            <Bar dataKey="inProgress" stackId="a" fill="blue" name="🔄 In Progress" />
            <Bar dataKey="resolved" stackId="a" fill="green" name="✅ Resolved" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Reusable styles
const statCardStyle = (color) => ({
  backgroundColor: "#fff",
  borderRadius: "10px",
  padding: "20px",
  textAlign: "center",
  boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
  borderTop: `4px solid ${color}`,
  color: color,
});

const miniStatStyle = (color) => ({
  background: `${color}15`,
  padding: "8px",
  borderRadius: 6,
  textAlign: "center",
  color: color,
  border: `1px solid ${color}40`,
});

export default LocalityView;