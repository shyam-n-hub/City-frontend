import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Home from "./pages/Home";
import AdminHome from "./pages/adminHome";
import Navbar from "./components/Navbar";
import ReportForm from "./components/ReportForm";
import UserDashboard from "./components/UserDashboard";
import AdminPanel from "./components/AdminPanel";


function LayoutWithNavbar({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ padding: "20px" }}>{children}</main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          
          {/* Home page - accessible to all with navbar showing appropriate links */}
          <Route
            path="/"
            element={
              <LayoutWithNavbar>
                <Home />
              </LayoutWithNavbar>
            }
          />

          {/* Admin Home - separate home page for admins */}
          <Route
            path="/admin-home"
            element={
              <AdminRoute>
                <LayoutWithNavbar>
                  <AdminHome />
                </LayoutWithNavbar>
              </AdminRoute>
            }
          />

          {/* Protected Routes for Normal Users */}
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <LayoutWithNavbar>
                  <ReportForm />
                </LayoutWithNavbar>
              </ProtectedRoute>
            }
          />
          
          
          <Route
            path="/userdashboard"
            element={
              <ProtectedRoute>
                <LayoutWithNavbar>
                  <UserDashboard />
                </LayoutWithNavbar>
              </ProtectedRoute>
            }
          />

          {/* Admin Only Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <LayoutWithNavbar>
                  <AdminPanel />
                </LayoutWithNavbar>
              </AdminRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;