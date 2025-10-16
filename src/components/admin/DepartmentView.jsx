import React, { useEffect, useState, useMemo } from "react";
import { db } from "../../firebase-config";
import { ref, onValue, update } from "firebase/database";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS = ["#f44336", "#ff9800", "#4caf50", "#2196f3", "#9c27b0", "#795548"];

const DepartmentView = () => {
  const [reports, setReports] = useState([]);
  const [filterDept, setFilterDept] = useState("all");
  const [expandedReport, setExpandedReport] = useState(null);
  const [locationNames, setLocationNames] = useState({});
  const [loadingLocations, setLoadingLocations] = useState({});

  useEffect(() => {
    const reportsRef = ref(db, "reports");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.entries(data).map(([id, v]) => ({ id, ...v })) : [];
      setReports(list);
    });
    return () => unsubscribe();
  }, []);

  // Function to get location name from coordinates
  const getLocationName = async (lat, lng, reportId) => {
    if (locationNames[reportId]) return; // Skip if already loaded
    
    try {
      setLoadingLocations(prev => ({ ...prev, [reportId]: true }));
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SmartCityReporter/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch location');
      
      const data = await response.json();
      const address = data.address || {};
      const locationParts = [];
      
      if (address.house_number && address.road) {
        locationParts.push(`${address.house_number} ${address.road}`);
      } else if (address.road) {
        locationParts.push(address.road);
      }
      
      if (address.neighbourhood) {
        locationParts.push(address.neighbourhood);
      } else if (address.suburb) {
        locationParts.push(address.suburb);
      }
      
      if (address.city) {
        locationParts.push(address.city);
      } else if (address.town) {
        locationParts.push(address.town);
      }
      
      if (address.state) {
        locationParts.push(address.state);
      }
      
      const locationName = locationParts.length > 0 
        ? locationParts.join(', ') 
        : data.display_name || 'Location not found';
      
      setLocationNames(prev => ({ ...prev, [reportId]: locationName }));
      
    } catch (error) {
      console.error('Error fetching location name:', error);
      setLocationNames(prev => ({ ...prev, [reportId]: 'Unable to load location name' }));
    } finally {
      setLoadingLocations(prev => ({ ...prev, [reportId]: false }));
    }
  };

  // Department mapping configuration
  const departmentKeywords = {
    "Road & Transport Department": [
      "pothole", "road", "street", "highway", "pavement", "asphalt", 
      "traffic", "signal", "zebra crossing", "pedestrian crossing", 
      "road damage", "crack", "divider", "median", "footpath", "sidewalk",
      "speed breaker", "road sign", "milestone", "bridge", "flyover"
    ],
    "Electricity Department": [
      "streetlight", "street light", "light", "electricity", "power",
      "transformer", "cable", "wire", "pole", "electric pole",
      "power cut", "voltage", "short circuit", "meter", "bulb", "lamp"
    ],
    "Sanitation Department": [
      "garbage", "waste", "trash", "rubbish", "litter", "dustbin",
      "sweeping", "cleaning", "drain", "sewage", "toilet", "public toilet",
      "waste disposal", "dump", "landfill", "compost", "garbage bin",
      "sanitation", "hygiene", "debris", "dumping"
    ],
    "Water Supply Department": [
      "water", "leakage", "leak", "pipe", "pipeline", "tap", "valve",
      "drainage", "water supply", "sewer", "manhole", "overflow",
      "underground water", "water connection", "burst pipe", "water pressure",
      "water contamination", "water shortage", "pipeline burst"
    ],
    "General Maintenance": [
      "park", "garden", "bench", "playground", "tree", "pruning",
      "wall", "fence", "building", "maintenance", "repair", "broken",
      "damaged", "graffiti", "vandalism", "paint", "construction"
    ]
  };

  // Automatically map issue title/category to department
  const getDepartment = (title, category) => {
    const searchText = `${title || ""} ${category || ""}`.toLowerCase();
    
    // Check each department's keywords
    for (const [department, keywords] of Object.entries(departmentKeywords)) {
      for (const keyword of keywords) {
        if (searchText.includes(keyword.toLowerCase())) {
          return department;
        }
      }
    }
    
    // Default department if no match found
    return "General Maintenance";
  };

  // Group reports by department
  const grouped = useMemo(() => {
    const g = {};
    reports.forEach((r) => {
      const dept = r.department || getDepartment(r.issueName || r.category, r.category);
      if (!g[dept]) g[dept] = [];
      g[dept].push(r);
    });
    return g;
  }, [reports]);

  // Chart data for department distribution
  const chartData = Object.entries(grouped).map(([name, arr]) => ({
    name,
    value: arr.length,
  }));

  // Single report status update
  async function updateStatusSingle(id, status) {
    const refPath = ref(db, `reports/${id}`);
    try {
      await update(refPath, { status, updatedAt: new Date().toISOString() });
      alert(`Status updated to ${status} successfully!`);
    } catch (err) {
      console.error(err);
      alert("Update failed: " + err.message);
    }
  }

  // Single department assignment
  async function assignDeptSingle(id, department) {
    const refPath = ref(db, `reports/${id}`);
    try {
      await update(refPath, { department, updatedAt: new Date().toISOString() });
      alert(`Department assigned successfully!`);
    } catch (err) {
      console.error(err);
      alert("Assign failed: " + err.message);
    }
  }

  // Add remarks to report
  async function addRemarks(id, remarks) {
    const refPath = ref(db, `reports/${id}`);
    try {
      await update(refPath, { remarks, updatedAt: new Date().toISOString() });
      alert("Remarks added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add remarks: " + err.message);
    }
  }

  // Get status badge color
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    switch (statusLower) {
      case 'pending':
        return '#ff9800';
      case 'in-progress':
        return '#2196f3';
      case 'resolved':
        return '#4caf50';
      default:
        return '#9e9e9e';
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'pothole': '🕳️',
      'road damage': '🕳️',
      'streetlight': '💡',
      'street light': '💡',
      'garbage': '🗑️',
      'waste': '🗑️',
      'water leakage': '💧',
      'water': '💧',
      'drainage': '💧',
      'traffic': '🚦',
      'noise': '🔊',
      'vandalism': '🎨',
      'construction': '🚧',
      'other': '❓'
    };
    return categoryIcons[category?.toLowerCase()] || '📝';
  };

  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle expand report
  const toggleExpand = (reportId) => {
    if (expandedReport === reportId) {
      setExpandedReport(null);
    } else {
      setExpandedReport(reportId);
      // Load location name when expanding
      const report = reports.find(r => r.id === reportId);
      if (report?.location?.lat && report?.location?.lng) {
        getLocationName(report.location.lat, report.location.lng, reportId);
      }
    }
  };

  return (
    <div style={{ padding: 24, background: "#f5f5f5", minHeight: "100vh" }}>
      <h2>🏢 Department View & Management</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        View department-wise report distribution and manage individual issue assignments.
      </p>

      {/* Department Chart */}
      <div style={{ background: "#fff", padding: 20, borderRadius: 12, marginBottom: 20, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <h3 style={{ margin: "0 0 16px 0" }}>Department Overview</h3>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) => `${name.split(' ')[0]}: ${(percent * 100).toFixed(0)}%`}
            >
              {chartData.map((c, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Department Filter */}
      <div style={{ 
        marginBottom: 20, 
        display: "flex", 
        alignItems: "center", 
        gap: 12,
        background: "#fff",
        padding: 16,
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <label style={{ fontWeight: "bold", fontSize: 15 }}>🔍 Filter by Department:</label>
        <select
          onChange={(e) => setFilterDept(e.target.value)}
          value={filterDept}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "2px solid #e0e0e0",
            minWidth: "280px",
            fontSize: 14,
            cursor: "pointer",
            background: "#fafafa"
          }}
        >
          <option value="all">All Departments ({reports.length})</option>
          {Object.entries(grouped).map(([dept, reports]) => (
            <option key={dept} value={dept}>
              {dept} ({reports.length})
            </option>
          ))}
        </select>
      </div>

      {/* Reports List */}
      <div style={{ marginTop: 18 }}>
        <h3 style={{ marginBottom: 16 }}>
          📋 Reports List {filterDept !== "all" ? `— ${filterDept}` : ""}
          <span style={{ fontWeight: "normal", color: "#666", fontSize: 14, marginLeft: 10 }}>
            ({reports.filter((r) =>
              filterDept === "all"
                ? true
                : (r.department || getDepartment(r.issueName || r.category, r.category)) === filterDept
            ).length} reports)
          </span>
        </h3>
        
        <div style={{ display: "grid", gap: 16 }}>
          {reports
            .filter((r) =>
              filterDept === "all"
                ? true
                : (r.department || getDepartment(r.issueName || r.category, r.category)) === filterDept
            )
            .slice(0, 200)
            .map((r) => {
              const isExpanded = expandedReport === r.id;
              
              return (
                <div
                  key={r.id}
                  style={{
                    background: "#fff",
                    padding: 16,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    transition: "all 0.3s ease",
                    border: isExpanded ? "2px solid #2196f3" : "2px solid transparent"
                  }}
                >
                  {/* Main Report Card */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16
                  }}>
                    {/* Left Side - Report Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 24 }}>{getCategoryIcon(r.category)}</span>
                        <div style={{ fontWeight: 700, fontSize: 16 }}>
                          {r.issueName || r.category}
                        </div>
                        <span 
                          style={{
                            padding: '4px 10px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 600,
                            background: getStatusColor(r.status),
                            color: '#fff'
                          }}
                        >
                          {r.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                      
                      <div style={{ color: "#666", fontSize: 14, marginBottom: 12, lineHeight: 1.5 }}>
                        {r.description?.slice(0, isExpanded ? 500 : 140)}
                        {r.description?.length > 140 && !isExpanded && "..."}
                      </div>
                      
                      <div style={{ fontSize: 13, color: "#555", display: "flex", flexWrap: "wrap", gap: 12 }}>
                        <span><strong>📍 Area:</strong> {r.area || r.locality || r.pinCode || "N/A"}</span>
                        <span><strong>🏢 Dept:</strong> {r.department || getDepartment(r.issueName || r.category, r.category)}</span>
                        <span><strong>📅 Reported:</strong> {formatDate(r.createdAt)}</span>
                      </div>

                      {/* Image Display */}
                      {r.imageUrl && (
                        <div style={{ marginTop: 12 }}>
                          <img 
                            src={r.imageUrl} 
                            alt={r.category}
                            style={{
                              width: "100%",
                              maxWidth: isExpanded ? "600px" : "300px",
                              height: isExpanded ? "auto" : "200px",
                              objectFit: "cover",
                              borderRadius: 8,
                              cursor: "pointer",
                              transition: "all 0.3s ease"
                            }}
                            onClick={() => window.open(r.imageUrl, '_blank')}
                          />
                        </div>
                      )}

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleExpand(r.id)}
                        style={{
                          marginTop: 12,
                          padding: "8px 16px",
                          background: "#f5f5f5",
                          border: "1px solid #ddd",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#2196f3"
                        }}
                      >
                        {isExpanded ? "▲ Show Less" : "▼ View Details & Map"}
                      </button>
                    </div>

                    {/* Right Side - Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 180 }}>
                      {/* Assign Department */}
                      <select
                        value={r.department || getDepartment(r.issueName || r.category, r.category)}
                        onChange={(e) => assignDeptSingle(r.id, e.target.value)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "2px solid #e0e0e0",
                          background: r.department ? "#fafafa" : "#fff3cd",
                          fontSize: 13,
                          cursor: "pointer",
                          fontWeight: r.department ? "normal" : "600"
                        }}
                      >
                        {/* Dynamically show auto-detected department first */}
                        {(() => {
                          const autoDept = getDepartment(r.issueName || r.category, r.category);
                          const allDepts = [
                            { value: "Road & Transport Department", label: "🛣️ Roads" },
                            { value: "Electricity Department", label: "⚡ Electricity" },
                            { value: "Sanitation Department", label: "🗑️ Sanitation" },
                            { value: "Water Supply Department", label: "💧 Water" },
                            { value: "General Maintenance", label: "🔧 General" }
                          ];
                          
                          // Sort departments: auto-detected first, then others
                          const sorted = allDepts.sort((a, b) => {
                            if (a.value === autoDept) return -1;
                            if (b.value === autoDept) return 1;
                            return 0;
                          });
                          
                          return sorted.map((dept, idx) => (
                            <option key={dept.value} value={dept.value}>
                              {dept.value === autoDept && !r.department ? `✨ ${dept.label} (Auto)` : dept.label}
                            </option>
                          ));
                        })()}
                      </select>

                      {/* Update Status */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button
                          onClick={() => updateStatusSingle(r.id, "pending")}
                          style={{
                            ...smallBtn("red"),
                            opacity: r.status === 'pending' ? 1 : 0.5
                          }}
                        >
                          ⏳ Pending
                        </button>
                        <button
                          onClick={() => updateStatusSingle(r.id, "in-progress")}
                          style={{
                            ...smallBtn("blue"),
                            opacity: r.status === 'in-progress' ? 1 : 0.5
                          }}
                        >
                          🔄 In Progress
                        </button>
                        <button
                          onClick={() => updateStatusSingle(r.id, "resolved")}
                          style={{
                            ...smallBtn("green"),
                            opacity: r.status === 'resolved' ? 1 : 0.5
                          }}
                        >
                          ✅ Resolved
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{
                      marginTop: 20,
                      paddingTop: 20,
                      borderTop: "2px solid #f0f0f0"
                    }}>
                      {/* Location Details */}
                      {r.location?.lat && r.location?.lng && (
                        <div style={{
                          background: "#f9f9f9",
                          padding: 16,
                          borderRadius: 8,
                          marginBottom: 16
                        }}>
                          <h4 style={{ margin: "0 0 12px 0", fontSize: 15 }}>
                            📍 Location Details
                          </h4>
                          
                          {loadingLocations[r.id] ? (
                            <div style={{ padding: 10, color: "#666" }}>
                              Loading location name...
                            </div>
                          ) : (
                            <>
                              {locationNames[r.id] && (
                                <p style={{ margin: "8px 0", fontSize: 14, fontWeight: 500 }}>
                                  {locationNames[r.id]}
                                </p>
                              )}
                              <p style={{ margin: "8px 0", fontSize: 13, color: "#666" }}>
                                Coordinates: {r.location.lat.toFixed(6)}, {r.location.lng.toFixed(6)}
                              </p>
                              
                              <a
                                href={`https://www.google.com/maps?q=${r.location.lat},${r.location.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: "inline-block",
                                  marginTop: 8,
                                  padding: "8px 16px",
                                  background: "#4285f4",
                                  color: "#fff",
                                  textDecoration: "none",
                                  borderRadius: 8,
                                  fontSize: 13,
                                  fontWeight: 600
                                }}
                              >
                                🗺️ View on Google Maps
                              </a>
                            </>
                          )}
                        </div>
                      )}

                      {/* Additional Details */}
                      <div style={{
                        background: "#f9f9f9",
                        padding: 16,
                        borderRadius: 8,
                        marginBottom: 16
                      }}>
                        <h4 style={{ margin: "0 0 12px 0", fontSize: 15 }}>
                          📋 Additional Details
                        </h4>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                          <div>
                            <div style={{ fontSize: 12, color: "#666" }}>Report ID</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.id}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: "#666" }}>Category</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{r.category || "N/A"}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: "#666" }}>Status</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: getStatusColor(r.status) }}>
                              {r.status || "pending"}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: 12, color: "#666" }}>Last Updated</div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>
                              {formatDate(r.updatedAt || r.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Remarks Section */}
                      <div style={{
                        background: "#fff9e6",
                        padding: 16,
                        borderRadius: 8,
                        border: "1px solid #ffe082"
                      }}>
                        <h4 style={{ margin: "0 0 12px 0", fontSize: 15 }}>
                          💬 Admin Remarks
                        </h4>
                        {r.remarks ? (
                          <p style={{ margin: "0 0 12px 0", fontSize: 14, color: "#555" }}>
                            {r.remarks}
                          </p>
                        ) : (
                          <p style={{ margin: "0 0 12px 0", fontSize: 13, color: "#999", fontStyle: "italic" }}>
                            No remarks added yet
                          </p>
                        )}
                        <textarea
                          placeholder="Add or update remarks..."
                          defaultValue={r.remarks || ""}
                          onBlur={(e) => {
                            if (e.target.value !== r.remarks) {
                              addRemarks(r.id, e.target.value);
                            }
                          }}
                          style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 6,
                            border: "1px solid #ddd",
                            fontSize: 13,
                            minHeight: 80,
                            fontFamily: "inherit"
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// Reusable button style
const smallBtn = (bg) => ({
  padding: "8px 12px",
  background: bg,
  color: "#fff",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 600,
  transition: 'all 0.2s ease',
  width: "100%"
});

export default DepartmentView;