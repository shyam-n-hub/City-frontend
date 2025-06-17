import { useEffect, useState, useContext } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase-config";
import { AuthContext } from "../context/AuthContext";
import "./UserDashboard.css";

function UserDashboard() {
  const { currentUser } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [locationNames, setLocationNames] = useState({});
  const [loadingLocations, setLoadingLocations] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  // Function to get location name from coordinates
  const getLocationName = async (lat, lng, reportId) => {
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
      
      if (!response.ok) {
        throw new Error('Failed to fetch location');
      }
      
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
      } else if (address.village) {
        locationParts.push(address.village);
      }
      
      if (address.state) {
        locationParts.push(address.state);
      }
      
      const locationName = locationParts.length > 0 
        ? locationParts.join(', ') 
        : data.display_name || 'Location not found';
      
      setLocationNames(prev => ({ 
        ...prev, 
        [reportId]: locationName 
      }));
      
    } catch (error) {
      console.error('Error fetching location name:', error);
      setLocationNames(prev => ({ 
        ...prev, 
        [reportId]: 'Unable to load location name' 
      }));
    } finally {
      setLoadingLocations(prev => ({ ...prev, [reportId]: false }));
    }
  };

  useEffect(() => {
    const reportsRef = ref(db, "reports");
    const unsubscribe = onValue(reportsRef, (snapshot) => {
      const data = snapshot.val();
      const userReports = [];
      
      for (let id in data) {
        if (data[id].user === currentUser?.uid) {
          userReports.push({ id, ...data[id] });
        }
      }
      
      // Sort reports by creation date (newest first)
      userReports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setReports(userReports);
      setIsLoading(false);
      
      // Fetch location names for each report
      userReports.forEach((report, index) => {
        if (report.location && report.location.lat && report.location.lng) {
          setTimeout(() => {
            getLocationName(report.location.lat, report.location.lng, report.id);
          }, index * 1000);
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown date';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusInfo = (status) => {
    const statusLower = status?.toLowerCase() || 'pending';
    const statusMap = {
      'pending': { color: '#ff9800', icon: '⏳', text: 'Pending' },
      'in-progress': { color: '#2196f3', icon: '🔄', text: 'In Progress' },
      'resolved': { color: '#4caf50', icon: '✅', text: 'Resolved' },
      'rejected': { color: '#f44336', icon: '❌', text: 'Rejected' }
    };
    return statusMap[statusLower] || statusMap['pending'];
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'pothole': '🕳️',
      'streetlight': '💡',
      'garbage': '🗑️',
      'water': '💧',
      'traffic': '🚦',
      'noise': '🔊',
      'vandalism': '🎨',
      'construction': '🚧',
      'other': '❓'
    };
    return categoryIcons[category?.toLowerCase()] || '📝';
  };

  const getStatsData = () => {
    const stats = {
      total: reports.length,
      pending: reports.filter(r => !r.status || r.status.toLowerCase() === 'pending').length,
      resolved: reports.filter(r => r.status?.toLowerCase() === 'resolved').length,
      inProgress: reports.filter(r => r.status?.toLowerCase() === 'in-progress').length
    };
    return stats;
  };

  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your reports...</p>
        </div>
      </div>
    );
  }

  const stats = getStatsData();

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-icon">📊</span>
            Your Issue Reports Dashboard
          </h1>
          <p className="dashboard-subtitle">
            Track and manage all your submitted city issues in one place
          </p>
        </div>
        
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <span className="stat-number">{stats.total}</span>
              <span className="stat-label">Total Reports</span>
            </div>
          </div>
          
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <span className="stat-number">{stats.pending}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
          
          <div className="stat-card progress">
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <span className="stat-number">{stats.inProgress}</span>
              <span className="stat-label">In Progress</span>
            </div>
          </div>
          
          <div className="stat-card resolved">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <span className="stat-number">{stats.resolved}</span>
              <span className="stat-label">Resolved</span>
            </div>
          </div>
        </div>
      </div>

      <div className="reports-section">
        {reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Reports Yet</h3>
            <p>Start making your city better by reporting your first issue!</p>
            <button className="cta-button">
              <span className="button-icon">➕</span>
              Submit Your First Report
            </button>
          </div>
        ) : (
          <div className="reports-grid">
            {reports.map((report, index) => {
              const statusInfo = getStatusInfo(report.status);
              const categoryIcon = getCategoryIcon(report.category);
              
              return (
                <div 
                  key={report.id} 
                  className={`report-card ${report.status?.toLowerCase() || 'pending'}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSelectedReport(selectedReport === report.id ? null : report.id)}
                >
                  <div className="report-header">
                    <div className="category-section">
                      <span className="category-icon">{categoryIcon}</span>
                      <h3 className="category-title">{report.category}</h3>
                    </div>
                    
                    <div className="status-badge" style={{ backgroundColor: statusInfo.color }}>
                      <span className="status-icon">{statusInfo.icon}</span>
                      <span className="status-text">{statusInfo.text}</span>
                    </div>
                  </div>

                  <div className="report-content">
                    <p className="report-description">{report.description}</p>
                    
                    {report.imageUrl && (
                      <div className="image-container">
                        <img 
                          src={report.imageUrl} 
                          alt={report.category}
                          className="report-image"
                          loading="lazy"
                        />
                        <div className="image-overlay">
                          <span className="zoom-icon">🔍</span>
                        </div>
                      </div>
                    )}

                    <div className="location-info">
                      <div className="location-header">
                        <span className="location-icon">📍</span>
                        <span className="location-title">Location Details</span>
                      </div>
                      
                      {loadingLocations[report.id] ? (
                        <div className="location-loading">
                          <div className="mini-spinner"></div>
                          <span>Loading location...</span>
                        </div>
                      ) : (
                        <div className="location-content">
                          {locationNames[report.id] && (
                            <p className="location-name">{locationNames[report.id]}</p>
                          )}
                          <p className="coordinates">
                            {report.location?.lat?.toFixed(6)}, {report.location?.lng?.toFixed(6)}
                          </p>
                          
                          <a
                            href={`https://www.google.com/maps?q=${report.location?.lat},${report.location?.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="map-button"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="map-icon">🗺️</span>
                            View on Maps
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="report-footer">
                      <div className="report-date">
                        <span className="date-icon">📅</span>
                        <span>Reported on {formatDate(report.createdAt)}</span>
                      </div>
                      
                      {report.predictedCategory && report.predictedCategory !== report.category && (
                        <div className="ai-suggestion">
                          <span className="ai-icon">🤖</span>
                          <span>AI suggested: {report.predictedCategory}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedReport === report.id && (
                    <div className="report-expanded">
                      <div className="expanded-content">
                        <h4>Additional Details</h4>
                        <div className="detail-grid">
                          <div className="detail-item">
                            <span className="detail-label">Report ID:</span>
                            <span className="detail-value">{report.id}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Priority:</span>
                            <span className="detail-value priority-high">High</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Category:</span>
                            <span className="detail-value">{report.category}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reports.length > 0 && (
        <div className="tips-section">
          <div className="tips-header">
            <span className="tips-icon">💡</span>
            <h3>Helpful Tips</h3>
          </div>
          <div className="tips-grid">
            <div className="tip-card">
              <span className="tip-icon">🗺️</span>
              <p>Click "View on Maps" to see exact locations of your reports</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">🔄</span>
              <p>Status updates are reflected in real-time from city officials</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">📊</span>
              <p>Track your contribution to making the city better</p>
            </div>
            <div className="tip-card">
              <span className="tip-icon">🤖</span>
              <p>AI helps categorize your reports for faster processing</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;