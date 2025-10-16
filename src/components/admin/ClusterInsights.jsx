import React, { useEffect, useState, useCallback } from "react";
import { db } from "../../firebase-config";
import { ref, onValue } from "firebase/database";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

const ClusterInsights = () => {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);

  // ✅ Fetch reports from Firebase
  useEffect(() => {
    const reportsRef = ref(db, "reports");
    const unsubscribe = onValue(reportsRef, async (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const reportList = Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
        }));
        setReports(reportList);
        await generateClusters(reportList);
      }
    });
    return () => unsubscribe();
  }, []);

  // ✅ AI Clustering Simulation (replace with backend AI later)
  const generateClusters = useCallback(async (reportList) => {
    if (!reportList || reportList.length === 0) {
      setClusters([]);
      setLoading(false);
      return;
    }

    // Fake AI grouping by location proximity
    const clusterMap = {};
    reportList.forEach((r) => {
      if (r.location?.lat && r.location?.lng) {
        const latGroup = Math.round(r.location.lat * 10) / 10;
        const lngGroup = Math.round(r.location.lng * 10) / 10;
        const key = `${latGroup}_${lngGroup}`;
        if (!clusterMap[key]) {
          clusterMap[key] = {
            clusterId: key,
            lat: latGroup,
            lng: lngGroup,
            total: 0,
            pending: 0,
            doing: 0,
            completed: 0,
            categoryCount: {},
          };
        }
        clusterMap[key].total++;
        clusterMap[key][r.status || "pending"]++;
        const cat = r.category || "Other";
        clusterMap[key].categoryCount[cat] =
          (clusterMap[key].categoryCount[cat] || 0) + 1;
      }
    });

    setClusters(Object.values(clusterMap));
    setLoading(false);
  }, []);

  // ✅ Calculate cluster urgency score
  const getClusterColor = (cluster) => {
    if (cluster.pending > cluster.completed) return "#f44336";
    if (cluster.doing > cluster.completed) return "#ff9800";
    return "#4caf50";
  };

  return (
    <div style={{ padding: "25px", fontFamily: "Arial, sans-serif" }}>
      <h2>🧠 AI-Based Cluster Insights</h2>
      <p style={{ color: "#555" }}>
        Visualize automatically grouped issue clusters, detect patterns, and track hotspot areas.
      </p>

      {loading ? (
        <div
          style={{
            backgroundColor: "#e3f2fd",
            color: "#1976d2",
            padding: "12px",
            borderRadius: "6px",
            marginTop: "20px",
          }}
        >
          🔄 Generating AI clusters...
        </div>
      ) : clusters.length === 0 ? (
        <div
          style={{
            backgroundColor: "#f8d7da",
            color: "#721c24",
            padding: "12px",
            borderRadius: "6px",
            marginTop: "20px",
          }}
        >
          ⚠️ No clusters found. Make sure issues have valid location data.
        </div>
      ) : (
        <>
          {/* 🔹 Map View of Clusters */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "10px",
              padding: "20px",
              marginTop: "30px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
            }}
          >
            <h3>📍 Cluster Map Visualization</h3>
            <MapContainer
              center={[10.85, 78.69]}
              zoom={6}
              style={{ height: "400px", width: "100%", borderRadius: "8px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
              {clusters.map((cluster, index) => (
                <CircleMarker
                  key={index}
                  center={[cluster.lat, cluster.lng]}
                  radius={Math.min(30, Math.max(6, cluster.total))}
                  fillColor={getClusterColor(cluster)}
                  color="#fff"
                  fillOpacity={0.7}
                  stroke={true}
                >
                  <Tooltip>
                    <div style={{ fontSize: "12px" }}>
                      <strong>Cluster ID:</strong> {cluster.clusterId}
                      <br />
                      <strong>Total:</strong> {cluster.total}
                      <br />
                      Pending: {cluster.pending}
                      <br />
                      Doing: {cluster.doing}
                      <br />
                      Completed: {cluster.completed}
                      <br />
                      <strong>Top Category:</strong>{" "}
                      {
                        Object.keys(cluster.categoryCount).sort(
                          (a, b) =>
                            cluster.categoryCount[b] -
                            cluster.categoryCount[a]
                        )[0]
                      }
                    </div>
                  </Tooltip>
                </CircleMarker>
              ))}
            </MapContainer>
          </div>

          {/* 🔹 Scatter Chart Visualization */}
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "10px",
              padding: "20px",
              marginTop: "40px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.05)",
            }}
          >
            <h3>📈 Cluster Density & Urgency Scatter Plot</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="lat"
                  name="Latitude"
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="lng"
                  name="Longitude"
                  tick={{ fontSize: 10 }}
                />
                <ReTooltip cursor={{ strokeDasharray: "3 3" }} />
                <Scatter
                  name="Issue Clusters"
                  data={clusters}
                  fill="#2196f3"
                  shape="circle"
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

export default ClusterInsights;
