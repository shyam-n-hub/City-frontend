import { useEffect, useState, useCallback, useMemo } from "react";
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
  const [locationCache, setLocationCache] = useState({}); 
  const [updatingStatus, setUpdatingStatus] = useState(new Set());
  const [lastClusterTime, setLastClusterTime] = useState(0);

  // Multiple geocoding service options
  const getLocationName = useCallback(async (lat, lng) => {
    const cacheKey = `${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // Check cache first
    if (locationCache[cacheKey]) {
      return locationCache[cacheKey];
    }

    try {
      // Method 1: Try using a CORS proxy with Nominatim
      let locationName = await tryNominatimWithProxy(lat, lng);
      
      // Method 2: If proxy fails, try BigDataCloud (free tier, no API key needed)
      if (!locationName) {
        locationName = await tryBigDataCloud(lat, lng);
      }
      
      // Method 3: If both fail, try OpenCage (requires API key but has free tier)
      if (!locationName) {
        locationName = await tryOpenCage(lat, lng);
      }
      
      // Method 4: If all fail, use a simple coordinate-based name
      if (!locationName) {
        locationName = await generateCoordinateBasedName(lat, lng);
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
      
      setLocationCache(prev => ({
        ...prev,
        [cacheKey]: fallbackName
      }));
      
      return fallbackName;
    }
  }, [locationCache]);

  // Method 1: Nominatim with CORS proxy
  const tryNominatimWithProxy = async (lat, lng) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1100)); // Rate limiting
      
      const proxyUrl = 'https://api.allorigins.win/raw?url=';
      const targetUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`;
      
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Nominatim proxy failed');

      const data = await response.json();
      return formatNominatimAddress(data);
    } catch (error) {
      console.log('Nominatim with proxy failed:', error.message);
      return null;
    }
  };

  // Method 2: BigDataCloud (free tier, CORS-friendly)
  const tryBigDataCloud = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) throw new Error('BigDataCloud failed');

      const data = await response.json();
      
      if (data && (data.locality || data.city || data.principalSubdivision)) {
        const parts = [];
        
        if (data.locality && data.locality !== data.city) {
          parts.push(data.locality);
        }
        
        if (data.city) {
          parts.push(data.city);
        }
        
        if (data.principalSubdivision) {
          parts.push(data.principalSubdivision);
        }
        
        if (data.countryName) {
          parts.push(data.countryName);
        }
        
        return parts.length > 0 ? parts.join(', ') : null;
      }
      
      return null;
    } catch (error) {
      console.log('BigDataCloud failed:', error.message);
      return null;
    }
  };

  // Method 3: OpenCage (requires API key - add your own if needed)
  const tryOpenCage = async (lat, lng) => {
    try {
      // You'll need to get a free API key from https://opencagedata.com/
      const API_KEY = 'YOUR_OPENCAGE_API_KEY'; // Replace with your actual API key
      
      if (!API_KEY || API_KEY === 'YOUR_OPENCAGE_API_KEY') {
        return null; // Skip if no API key provided
      }
      
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${API_KEY}&limit=1`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      );

      if (!response.ok) throw new Error('OpenCage failed');

      const data = await response.json();
      
      if (data && data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components;
        
        const parts = [];
        
        if (components.road) {
          parts.push(components.road);
        }
        
        if (components.neighbourhood || components.suburb) {
          parts.push(components.neighbourhood || components.suburb);
        }
        
        if (components.city || components.town || components.village) {
          parts.push(components.city || components.town || components.village);
        }
        
        if (components.state) {
          parts.push(components.state);
        }
        
        return parts.length > 0 ? parts.join(', ') : result.formatted;
      }
      
      return null;
    } catch (error) {
      console.log('OpenCage failed:', error.message);
      return null;
    }
  };

  // Method 4: Generate coordinate-based location name with region detection
  const generateCoordinateBasedName = async (lat, lng) => {
    try {
      // Simple region detection based on coordinates (for India)
      let region = 'Unknown Region';
      
      // Basic region detection for India (you can expand this)
      if (lat >= 8.0 && lat <= 37.6 && lng >= 68.7 && lng <= 97.25) {
        // Within India bounds
        if (lat >= 20 && lng >= 72 && lng <= 88) {
          region = 'Northern India';
        } else if (lat < 20 && lng >= 72 && lng <= 88) {
          region = 'Southern India';
        } else if (lng < 77) {
          region = 'Western India';
        } else if (lng > 85) {
          region = 'Eastern India';
        } else {
          region = 'Central India';
        }
      }
      
      return `${region} (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    } catch (error) {
      return `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  };

  // Helper function to format Nominatim address
  const formatNominatimAddress = (data) => {
    if (!data || !data.address) return null;
    
    const addr = data.address;
    const parts = [];
    
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
      return parts.join(', ');
    } else if (data.display_name) {
      return data.display_name.length > 100 
        ? data.display_name.substring(0, 100) + '...'
        : data.display_name;
    }
    
    return null;
  };

  // Optimized batch location enrichment with better error handling
  const enrichClustersWithLocations = useCallback(async (clustersData) => {
    const batchSize = 2; // Reduced batch size to be more conservative
    const enrichedClusters = [];
    
    for (let i = 0; i < clustersData.length; i += batchSize) {
      const batch = clustersData.slice(i, i + batchSize);
      
      const enrichedBatch = await Promise.allSettled(
        batch.map(async (cluster) => {
          try {
            const locationName = await getLocationName(cluster.lat, cluster.lng);
            return {
              ...cluster,
              locationName
            };
          } catch (error) {
            console.error(`Failed to get location for cluster ${cluster.cluster}:`, error);
            return {
              ...cluster,
              locationName: `Location ${cluster.lat.toFixed(4)}, ${cluster.lng.toFixed(4)}`
            };
          }
        })
      );
      
      // Handle both fulfilled and rejected promises
      enrichedBatch.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          enrichedClusters.push(result.value);
        } else {
          // Fallback for failed promises
          const originalCluster = batch[index];
          enrichedClusters.push({
            ...originalCluster,
            locationName: `Location ${originalCluster.lat.toFixed(4)}, ${originalCluster.lng.toFixed(4)}`
          });
        }
      });
      
      // Add delay between batches
      if (i + batchSize < clustersData.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return enrichedClusters;
  }, [getLocationName]);

  // Memoized analytics calculation
  const calculateAnalytics = useCallback((reportList) => {
    const analytics = {
      total_reports: reportList.length,
      pending_reports: reportList.filter(r => r.status === 'pending').length,
      doing_reports: reportList.filter(r => r.status === 'doing').length,
      completed_reports: reportList.filter(r => r.status === 'completed').length,
      category_distribution: {},
      status_distribution: {}
    };

    reportList.forEach(report => {
      const category = report.category || 'Unknown';
      analytics.category_distribution[category] = (analytics.category_distribution[category] || 0) + 1;
      
      const status = report.status || 'pending';
      analytics.status_distribution[status] = (analytics.status_distribution[status] || 0) + 1;
    });

    setAnalytics(analytics);
  }, []);

  // Debounced clustering
  const performClustering = useCallback(async (reportList) => {
    const now = Date.now();
    if (now - lastClusterTime < 2000) {
      return;
    }
    
    setLastClusterTime(now);
    setLoading(true);
    setError(null);
    
    try {
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

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch("https://city-backend-pfob.onrender.com/cluster", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify(enriched),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const clustered = await response.json();
      const clustersArray = Array.isArray(clustered) ? clustered : [];
      
      if (clustersArray.length > 0) {
        const enrichedClusters = await enrichClustersWithLocations(clustersArray);
        setClusters(enrichedClusters);
      } else {
        setClusters([]);
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Clustering request timed out. Please try again.');
      } else {
        console.error("Clustering error:", err);
        setError(`Clustering failed: ${err.message}`);
      }
      setClusters([]);
    } finally {
      setLoading(false);
    }
  }, [lastClusterTime, enrichClustersWithLocations]);

  // Fetch reports from Firebase
  useEffect(() => {
    const reportsRef = ref(db, "reports");
    
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const reportList = data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : [];
      
      setReports(reportList);
      calculateAnalytics(reportList);
      
      if (reportList.length > 0) {
        performClustering(reportList);
      } else {
        setClusters([]);
      }
    }, (error) => {
      console.error("Firebase error:", error);
      setError("Failed to fetch reports from database");
    });

    return () => unsubscribe();
  }, [calculateAnalytics, performClustering]);

  // Status update functions
  const updateStatus = useCallback(async (id, status) => {
    const updateKey = `single_${id}`;
    setUpdatingStatus(prev => new Set([...prev, updateKey]));
    
    try {
      const reportRef = ref(db, `reports/${id}`);
      await update(reportRef, { status });
      
      setReports(prevReports => 
        prevReports.map(report => 
          report.id === id ? { ...report, status } : report
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
      setError(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }
  }, []);

  const updateClusterStatus = useCallback(async (cluster, status) => {
    const updateKey = `cluster_${cluster.cluster}`;
    setUpdatingStatus(prev => new Set([...prev, updateKey]));
    
    try {
      const updatePromises = cluster.reports.map(report => {
        const reportRef = ref(db, `reports/${report.id}`);
        return update(reportRef, { status });
      });
      
      await Promise.all(updatePromises);
      
      setReports(prevReports => 
        prevReports.map(report => {
          const isInCluster = cluster.reports.some(clusterReport => clusterReport.id === report.id);
          return isInCluster ? { ...report, status } : report;
        })
      );
    } catch (err) {
      console.error("Error updating cluster status:", err);
      setError(`Failed to update cluster status: ${err.message}`);
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }
  }, []);

  // Utility functions
  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'doing': return '#FF9800';
      case 'pending': return '#f44336';
      default: return '#9E9E9E';
    }
  }, []);

  const getUrgencyColor = useCallback((urgency) => {
    switch (urgency) {
      case 'High': return '#f44336';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  }, []);

  const getCategoryIcon = useCallback((category) => {
    switch (category) {
      case 'Pothole': return '🕳️';
      case 'Streetlight': return '💡';
      case 'Garbage': return '🗑️';
      case 'Water Leakage': return '💧';
      default: return '⚠️';
    }
  }, []);

  // Filtered clusters
  const filteredClusters = useMemo(() => {
    return clusters.filter(cluster => {
      const categoryMatch = selectedCategory === 'all' || cluster.category === selectedCategory;
      const urgencyMatch = selectedUrgency === 'all' || cluster.urgency === selectedUrgency;
      return categoryMatch && urgencyMatch;
    });
  }, [clusters, selectedCategory, selectedUrgency]);

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
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button 
            onClick={() => setError(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#c62828', 
              cursor: 'pointer',
              fontSize: '16px',
              padding: '0 5px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {loading && (
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          color: '#1976d2', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          🔄 Loading smart clusters and location data... This may take a moment.
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
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
        
        <button
          onClick={() => performClustering(reports)}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Refreshing...' : '🔄 Refresh Clusters'}
        </button>
      </div>

      {/* Map View */}
      <div style={{ marginBottom: '30px' }}>
        <h3>📍 Smart Cluster Map ({filteredClusters.length} clusters)</h3>
        <MapContainer 
          center={[10.85, 78.69]} 
          zoom={6} 
          style={{ height: 400, border: '1px solid #ccc', borderRadius: '8px' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {filteredClusters.map((cluster, index) => (
            <Marker
              key={`${cluster.cluster}-${index}`}
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
                  <p><strong>📍 Location:</strong> {cluster.locationName || 'Loading...'}</p>
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

      {/* Cluster Summary */}
      <div style={{ marginBottom: '30px' }}>
        <h3>🎯 Smart Clusters ({filteredClusters.length})</h3>
        {filteredClusters.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '8px',
            color: '#666'
          }}>
            {loading ? '🔄 Loading clusters...' : 'No clusters match the current filters.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {filteredClusters.map((cluster, index) => {
              const clusterUpdateKey = `cluster_${cluster.cluster}`;
              const isUpdatingCluster = updatingStatus.has(clusterUpdateKey);
              
              return (
                <div key={`${cluster.cluster}-${index}`} style={{ 
                  border: `2px solid ${getUrgencyColor(cluster.urgency)}`,
                  borderRadius: '12px',
                  padding: '20px',
                  backgroundColor: 'white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  opacity: isUpdatingCluster ? 0.7 : 1
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
                      
                      <div style={{ 
                        backgroundColor: '#f0f8ff', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        marginBottom: '10px',
                        border: '1px solid #e1f5fe'
                      }}>
                        <p style={{ margin: '0 0 5px 0', color: '#1565c0', fontWeight: 'bold' }}>
                          📍 Location: {cluster.locationName || 'Loading location...'}
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
                        disabled={isUpdatingCluster}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isUpdatingCluster ? '#ccc' : '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isUpdatingCluster ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {isUpdatingCluster ? '⏳ Updating...' : 'Mark All In Progress'}
                      </button>
                      <button 
                        onClick={() => updateClusterStatus(cluster, "completed")}
                        disabled={isUpdatingCluster}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: isUpdatingCluster ? '#ccc' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: isUpdatingCluster ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        {isUpdatingCluster ? '⏳ Updating...' : 'Mark All Complete'}
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
                      {cluster.reports.map((report, reportIndex) => {
                        const reportUpdateKey = `single_${report.id}`;
                        const isUpdatingReport = updatingStatus.has(reportUpdateKey);
                        
                        return (
                          <div key={`${report.id}-${reportIndex}`} style={{ 
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '12px',
                            backgroundColor: '#fafafa',
                            opacity: isUpdatingReport ? 0.7 : 1
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
                                  {isUpdatingReport && <span style={{ marginLeft: '8px' }}>⏳</span>}
                                </p>
                              </div>
                              
                              <div style={{ display: 'flex', gap: '5px' }}>
                                <button 
                                  onClick={() => updateStatus(report.id, "pending")}
                                  disabled={isUpdatingReport}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: isUpdatingReport ? '#ccc' : '#f44336',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: isUpdatingReport ? 'not-allowed' : 'pointer',
                                    fontSize: '10px'
                                  }}
                                >
                                  Pending
                                </button>
                                <button 
                                  onClick={() => updateStatus(report.id, "doing")}
                                  disabled={isUpdatingReport}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: isUpdatingReport ? '#ccc' : '#FF9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: isUpdatingReport ? 'not-allowed' : 'pointer',
                                    fontSize: '10px'
                                  }}
                                >
                                  Doing
                                </button>
                                <button 
                                  onClick={() => updateStatus(report.id, "completed")}
                                  disabled={isUpdatingReport}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: isUpdatingReport ? '#ccc' : '#4CAF50',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: isUpdatingReport ? 'not-allowed' : 'pointer',
                                    fontSize: '10px'
                                  }}
                                >
                                  Done
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;