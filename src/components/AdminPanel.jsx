import { useEffect, useState } from "react";
import { db } from "../firebase-config";
import { ref, onValue, update } from "firebase/database";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "./AdminPanel.css";


function AdminPanel() {
  const [reports, setReports] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedUrgency, setSelectedUrgency] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [locationCache, setLocationCache] = useState({}); // Cache for location names

  // Reverse geocoding function
  const getLocationName = async (lat, lng) => {
    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // Check cache first
    if (locationCache[cacheKey]) {
      return locationCache[cacheKey];
    }

    try {
      // Using Nominatim (free OpenStreetMap geocoding service)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CityIssueTracker/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding failed');
      }

      const data = await response.json();
      
      let locationName = "Unknown Location";
      
      if (data && data.address) {
        const addr = data.address;
        const parts = [];
        
        // Build a readable address from available components
        if (addr.house_number && addr.road) {
          parts.push(`${addr.house_number} ${addr.road}`);
        } else if (addr.road) {
          parts.push(addr.road);
        }
        
        if (addr.neighbourhood || addr.suburb) {
          parts.push(addr.neighbourhood || addr.suburb);
        }
        
        if (addr.city || addr.town || addr.village) {
          parts.push(addr.city || addr.town || addr.village);
        }
        
        if (addr.state) {
          parts.push(addr.state);
        }
        
        if (parts.length > 0) {
          locationName = parts.join(', ');
        } else if (data.display_name) {
          // Fallback to display name, but truncate if too long
          locationName = data.display_name.length > 100 
            ? data.display_name.substring(0, 100) + '...'
            : data.display_name;
        }
      }

      // Cache the result
      setLocationCache(prev => ({
        ...prev,
        [cacheKey]: locationName
      }));

      return locationName;
    } catch (error) {
      console.error('Error getting location name:', error);
      const fallbackName = `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
      // Cache the fallback too
      setLocationCache(prev => ({
        ...prev,
        [cacheKey]: fallbackName
      }));
      
      return fallbackName;
    }
  };

  // Enhanced function to enrich clusters with location names
  const enrichClustersWithLocations = async (clustersData) => {
    const enrichedClusters = await Promise.all(
      clustersData.map(async (cluster) => {
        const locationName = await getLocationName(cluster.lat, cluster.lng);
        return {
          ...cluster,
          locationName
        };
      })
    );
    return enrichedClusters;
  };

  // Fetch reports from Firebase
  useEffect(() => {
    const reportsRef = ref(db, "reports");
    onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const reportList = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      setReports(reportList);
      
      // Auto-cluster when reports change
      if (reportList.length > 0) {
        performClustering(reportList);
        calculateAnalytics(reportList);
      } else {
        setClusters([]);
        setAnalytics(null);
      }
    });
  }, []);

  const calculateAnalytics = (reportList) => {
    const analytics = {
      total_reports: reportList.length,
      pending_reports: reportList.filter(r => r.status === 'pending').length,
      doing_reports: reportList.filter(r => r.status === 'doing').length,
      completed_reports: reportList.filter(r => r.status === 'completed').length,
      category_distribution: {},
      status_distribution: {}
    };

    // Calculate category distribution
    reportList.forEach(report => {
      const category = report.category || 'Unknown';
      analytics.category_distribution[category] = (analytics.category_distribution[category] || 0) + 1;
    });

    // Calculate status distribution
    reportList.forEach(report => {
      const status = report.status || 'pending';
      analytics.status_distribution[status] = (analytics.status_distribution[status] || 0) + 1;
    });

    setAnalytics(analytics);
  };

  const performClustering = async (reportList) => {
    setLoading(true);
    setError(null);
    
    try {
      // Filter out reports without valid location data
      const validReports = reportList.filter(r => 
        r.location && 
        typeof r.location.lat === 'number' && 
        typeof r.location.lng === 'number' &&
        !isNaN(r.location.lat) && 
        !isNaN(r.location.lng)
      );

      if (validReports.length === 0) {
        setError("No reports with valid location data found");
        setClusters([]);
        return;
      }

      const enriched = validReports.map((r) => ({
        id: r.id,
        lat: Number(r.location.lat),
        lng: Number(r.location.lng),
        description: r.description || "",
        category: r.category || "",
        status: r.status || "pending"
      }));

      const response = await fetch("http://localhost:5000/cluster", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(enriched)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const clustered = await response.json();
      const clustersArray = Array.isArray(clustered) ? clustered : [];
      
      // Enrich clusters with location names
      const enrichedClusters = await enrichClustersWithLocations(clustersArray);
      setClusters(enrichedClusters);
    } catch (err) {
      console.error("Clustering error:", err);
      setError(`Clustering failed: ${err.message}`);
      setClusters([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const reportRef = ref(db, `reports/${id}`);
      await update(reportRef, { status });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const updateClusterStatus = async (cluster, status) => {
    try {
      const updatePromises = cluster.reports.map(report => 
        update(ref(db, `reports/${report.id}`), { status })
      );
      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Error updating cluster status:", err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'doing': return '#FF9800';
      case 'pending': return '#f44336';
      default: return '#9E9E9E';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'High': return '#f44336';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Pothole': return '🕳️';
      case 'Streetlight': return '💡';
      case 'Garbage': return '🗑️';
      case 'Water Leakage': return '💧';
      default: return '⚠️';
    }
  };

  // Filter clusters based on selected filters
  const filteredClusters = clusters.filter(cluster => {
    const categoryMatch = selectedCategory === 'all' || cluster.category === selectedCategory;
    const urgencyMatch = selectedUrgency === 'all' || cluster.urgency === selectedUrgency;
    return categoryMatch && urgencyMatch;
  });

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h2>🛠️ Enhanced Admin Dashboard</h2>
      
      {/* Analytics Dashboard */}
      {analytics && (
        <div style={{ marginBottom: '30px' }}>
          <h3>📊 Quick Analytics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ 
              backgroundColor: '#e3f2fd', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#1976d2' }}>Total Reports</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.total_reports}</div>
            </div>
            <div style={{ 
              backgroundColor: '#ffebee', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#d32f2f' }}>Pending</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.pending_reports}</div>
            </div>
            <div style={{ 
              backgroundColor: '#fff3e0', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#f57c00' }}>In Progress</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.doing_reports}</div>
            </div>
            <div style={{ 
              backgroundColor: '#e8f5e8', 
              padding: '15px', 
              borderRadius: '8px', 
              textAlign: 'center' 
            }}>
              <h4 style={{ margin: '0 0 5px 0', color: '#388e3c' }}>Completed</h4>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{analytics.completed_reports}</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px' 
        }}>
          {error}
        </div>
      )}

      {loading && <p>🔄 Loading smart clusters and location data...</p>}

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Category:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="all">All Categories</option>
            <option value="Pothole">Pothole</option>
            <option value="Streetlight">Streetlight</option>
            <option value="Garbage">Garbage</option>
            <option value="Water Leakage">Water Leakage</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Urgency:</label>
          <select 
            value={selectedUrgency} 
            onChange={(e) => setSelectedUrgency(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="all">All Urgency Levels</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* 🗺️ Enhanced Map View */}
      <div style={{ marginBottom: '30px' }}>
        <h3>📍 Smart Cluster Map</h3>
        <MapContainer 
          center={[10.85, 78.69]} 
          zoom={6} 
          style={{ height: 400, border: '1px solid #ccc', borderRadius: '8px' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredClusters.map((cluster, index) => (
            <Marker
              key={index}
              position={[cluster.lat, cluster.lng]}
              icon={L.divIcon({
                html: `<div style="background-color: ${getUrgencyColor(cluster.urgency)}; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${cluster.stats.total_reports}</div>`,
                className: 'custom-marker',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              })}
            >
              <Popup>
                <div style={{ minWidth: '250px' }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>
                    {getCategoryIcon(cluster.category)} {cluster.category} Cluster
                  </h4>
                  <p><strong>📍 Location:</strong> {cluster.locationName}</p>
                  <p><strong>📊 Reports:</strong> {cluster.stats.total_reports}</p>
                  <p><strong>⚡ Urgency:</strong> <span style={{ color: getUrgencyColor(cluster.urgency) }}>{cluster.urgency}</span></p>
                  <p><strong>🎯 Priority Score:</strong> {cluster.priority}</p>
                  <p><strong>⏳ Pending:</strong> {cluster.stats.pending}</p>
                  <p><strong>🔄 In Progress:</strong> {cluster.stats.doing}</p>
                  <p><strong>✅ Completed:</strong> {cluster.stats.completed}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* 📊 Enhanced Cluster Summary */}
      <div style={{ marginBottom: '30px' }}>
        <h3>🎯 Smart Clusters ({filteredClusters.length})</h3>
        {filteredClusters.length === 0 ? (
          <p>No clusters match the current filters.</p>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredClusters.map((cluster, index) => (
              <div key={index} style={{ 
                border: `2px solid ${getUrgencyColor(cluster.urgency)}`,
                borderRadius: '12px',
                padding: '20px',
                backgroundColor: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px' }}>{getCategoryIcon(cluster.category)}</span>
                      {cluster.category} Cluster #{cluster.cluster}
                      <span style={{ 
                        backgroundColor: getUrgencyColor(cluster.urgency),
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {cluster.urgency} Priority
                      </span>
                    </h4>
                    
                    {/* Enhanced Location Display */}
                    <div style={{ 
                      backgroundColor: '#f0f8ff', 
                      padding: '12px', 
                      borderRadius: '8px', 
                      marginBottom: '10px',
                      border: '1px solid #e1f5fe'
                    }}>
                      <p style={{ margin: '0 0 5px 0', color: '#1565c0', fontWeight: 'bold' }}>
                        📍 Location: {cluster.locationName}
                      </p>
                      <p style={{ margin: '0', color: '#666', fontSize: '12px' }}>
                        Coordinates: {cluster.lat.toFixed(6)}, {cluster.lng.toFixed(6)}
                      </p>
                    </div>
                    
                    <p style={{ margin: '5px 0', color: '#666' }}>
                      <strong>Priority Score:</strong> {cluster.priority}
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      onClick={() => updateClusterStatus(cluster, "doing")}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#FF9800',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Mark All In Progress
                    </button>
                    <button 
                      onClick={() => updateClusterStatus(cluster, "completed")}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Mark All Complete
                    </button>
                  </div>
                </div>

                {/* Cluster Stats */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                  gap: '10px', 
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                      {cluster.stats.total_reports}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Total</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f44336' }}>
                      {cluster.stats.pending}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Pending</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF9800' }}>
                      {cluster.stats.doing}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Doing</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4CAF50' }}>
                      {cluster.stats.completed}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Done</div>
                  </div>
                </div>

                {/* Individual Reports in Cluster */}
                <div>
                  <h5 style={{ margin: '0 0 10px 0' }}>Reports in this cluster:</h5>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {cluster.reports.map((report, reportIndex) => (
                      <div key={reportIndex} style={{ 
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: '#fafafa'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                              <strong>Description:</strong> {report.description || 'No description'}
                            </p>
                            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>
                              <strong>Status:</strong> 
                              <span style={{ 
                                color: getStatusColor(report.status),
                                fontWeight: 'bold',
                                marginLeft: '8px'
                              }}>
                                {report.status || 'pending'}
                              </span>
                            </p>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button 
                              onClick={() => updateStatus(report.id, "pending")}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                            >
                              Pending
                            </button>
                            <button 
                              onClick={() => updateStatus(report.id, "doing")}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#FF9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                            >
                              Doing
                            </button>
                            <button 
                              onClick={() => updateStatus(report.id, "completed")}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                fontSize: '10px'
                              }}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;