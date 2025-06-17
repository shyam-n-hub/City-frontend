// src/pages/AdminHome.jsx
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import "./AdminHome.css";

function AdminHome() {
  const { currentUser } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    activeUsers: 0
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading stats with animation delay
    const timer = setTimeout(() => {
      setStats({
        totalReports: 1247,
        pendingReports: 89,
        resolvedReports: 1158,
        activeUsers: 324
      });
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const dashboardCards = [
    {
      title: "User Management",
      description: "Monitor and manage user accounts",
      icon: "👥",
      color: "#4f46e5",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      count: stats.activeUsers,
      label: "Active Users"
    },
    {
      title: "Reports Overview",
      description: "View and manage user reports",
      icon: "📊",
      color: "#059669",
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      count: stats.totalReports,
      label: "Total Reports"
    },
    {
      title: "Pending Issues",
      description: "Issues requiring attention",
      icon: "⚠️",
      color: "#d97706",
      gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      count: stats.pendingReports,
      label: "Pending"
    },
    {
      title: "System Analytics",
      description: "Platform usage and statistics",
      icon: "📈",
      color: "#dc2626",
      gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      count: stats.resolvedReports,
      label: "Resolved"
    }
  ];

  const quickActions = [
    { title: "View All Reports", icon: "📋", color: "#8b5cf6" },
    { title: "User Analytics", icon: "👤", color: "#06b6d4" },
    { title: "System Settings", icon: "⚙️", color: "#10b981" },
    { title: "Generate Report", icon: "📄", color: "#f59e0b" }
  ];

  return (
    <div className="admin-home">
      {/* Header Section */}
      <div className="admin-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="admin-title">
              <span className="title-icon">🏛️</span>
              Smart City Admin Dashboard
            </h1>
            <p className="welcome-text">
              Welcome back, <span className="admin-name">{currentUser?.email}</span>
            </p>
            <div className="admin-badge">
              <span className="badge-text">Administrator</span>
            </div>
          </div>
          <div className="header-decoration">
            <div className="floating-shapes">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
              <div className="shape shape-3"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview1">
        <h2 className="section-title1">Platform Overview</h2>
        <div className="stats-grid1">
          {dashboardCards.map((card, index) => (
            <div 
              key={index} 
              className={`stat-card1 ${isLoaded ? 'loaded' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="card-header1">
                <div className="card-icon1" style={{ background: card.gradient }}>
                  {card.icon}
                </div>
                <div className="card-menu1">⋯</div>
              </div>
              <div className="card-content1">
                <h3 className="card-title1">{card.title}</h3>
                <p className="card-description1">{card.description}</p>
                <div className="card-stats1">
                  <span className="stat-number1" style={{ color: card.color }}>
                    {isLoaded ? card.count : 0}
                  </span>
                  <span className="stat-label1">{card.label}</span>
                </div>
              </div>
              {/* <div className="card-footer">
                <button className="view-details-btn" style={{ color: card.color }}>
                  View Details →
                </button>
              </div> */}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action, index) => (
            <button 
              key={index} 
              className="action-btn"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="action-icon" style={{ color: action.color }}>
                {action.icon}
              </div>
              <span className="action-title">{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h2 className="section-title">Recent Activity</h2>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon new">📝</div>
            <div className="activity-content">
              <h4>New Report Submitted</h4>
              <p>Pothole reported on Main Street - 5 minutes ago</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon resolved">✅</div>
            <div className="activity-content">
              <h4>Issue Resolved</h4>
              <p>Streetlight repair completed - 2 hours ago</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon user">👤</div>
            <div className="activity-content">
              <h4>New User Registered</h4>
              <p>john.doe@email.com joined the platform - 1 day ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="admin-footer">
        <p>Smart City Management System © 2024</p>
        <div className="footer-links">
          <a href="#support">Support</a>
          <a href="#docs">Documentation</a>
          <a href="#settings">Settings</a>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;