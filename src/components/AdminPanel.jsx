import React, { useState, Suspense, lazy } from "react";
import "./AdminPanel.css";

const Overview = lazy(() => import("./admin/Overview"));
const DepartmentView = lazy(() => import("./admin/DepartmentView"));
const LocalityView = lazy(() => import("./admin/LocalityView"));
const ClusterInsights = lazy(() => import("./admin/ClusterInsights"));
const UserDetailsAdmin = lazy(() => import("./admin/UserDetailsAdmin"));
const ReportsExport = lazy(() => import("./admin/ReportsExport"));

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const renderTab = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "department":
        return <DepartmentView />;
      case "locality":
        return <LocalityView />;
      case "cluster":
        return <ClusterInsights />;
      case "users":
        return <UserDetailsAdmin />;
      case "reports":
        return <ReportsExport />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="admin-dashboard-container">
      <aside className="sidebar">
        <ul className="menu">
          <li
            className={activeTab === "overview" ? "active" : ""}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </li>
          <li
            className={activeTab === "department" ? "active" : ""}
            onClick={() => setActiveTab("department")}
          >
            🏢 Department View
          </li>
          <li
            className={activeTab === "locality" ? "active" : ""}
            onClick={() => setActiveTab("locality")}
          >
            📍 Locality View
          </li>
          <li
            className={activeTab === "cluster" ? "active" : ""}
            onClick={() => setActiveTab("cluster")}
          >
            🧠 AI Clusters
          </li>
          <li
            className={activeTab === "users" ? "active" : ""}
            onClick={() => setActiveTab("users")}
          >
            👥 User Details
          </li>
          <li
            className={activeTab === "reports" ? "active" : ""}
            onClick={() => setActiveTab("reports")}
          >
            📄 Reports & Export
          </li>
        </ul>
      </aside>

      <main className="main-content">
        <Suspense fallback={<div className="loading">Loading...</div>}>
          {renderTab()}
        </Suspense>
      </main>
    </div>
  );
};

export default AdminPanel;
