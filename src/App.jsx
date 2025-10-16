import React, { useState, useEffect, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Lazy load components for better performance
const Signup = React.lazy(() => import("./pages/Signup"));
const Login = React.lazy(() => import("./pages/Login"));
const Home = React.lazy(() => import("./pages/Home"));
const AdminHome = React.lazy(() => import("./pages/adminHome"));
const ReportForm = React.lazy(() => import("./components/ReportForm"));
const UserDashboard = React.lazy(() => import("./components/UserDashboard"));
const AdminPanel = React.lazy(() => import("./components/AdminPanel"));
const ProtectedRoute = React.lazy(() => import("./components/ProtectedRoute"));
const AdminRoute = React.lazy(() => import("./components/AdminRoute"));
const Navbar = React.lazy(() => import("./components/Navbar"));
const UserDetails = React.lazy(() => import("./pages/UserDetails"));


// Loading Component
const LoadingSpinner = () => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    flexDirection: 'column'
  }}>
    <div style={{
      width: '60px',
      height: '60px',
      border: '6px solid #f3f3f3',
      borderTop: '6px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <p style={{
      marginTop: '20px',
      fontSize: '18px',
      color: '#333',
      fontFamily: 'Arial, sans-serif'
    }}>
      Loading...
    </p>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

// Page Loading Component (for route transitions)
const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    width: '100%'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
  </div>
);

function LayoutWithNavbar({ children }) {
  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Navbar />
      </Suspense>
      <main style={{ padding: "0px" }}>
        <Suspense fallback={<PageLoader />}>
          {children}
        </Suspense>
      </main>
    </>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Adjust this timing as needed

    return () => clearTimeout(timer);
  }, []);

  // Handle page refresh detection
  useEffect(() => {
    const handleBeforeUnload = () => {
      setIsPageTransitioning(true);
    };

    const handleLoad = () => {
      setIsPageTransitioning(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('load', handleLoad);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  // Show loading spinner during initial load or page transitions
  if (isLoading || isPageTransitioning) {
    return <LoadingSpinner />;
  }

  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/signup" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <Signup />
                </Suspense>
              } 
            />
            <Route 
              path="/login" 
              element={
                <Suspense fallback={<PageLoader />}>
                  <Login />
                </Suspense>
              } 
            />
            
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
                <Suspense fallback={<PageLoader />}>
                  <AdminRoute>
                    <LayoutWithNavbar>
                      <AdminHome />
                    </LayoutWithNavbar>
                  </AdminRoute>
                </Suspense>
              }
            />

            {/* Protected Routes for Normal Users */}
            <Route
              path="/report"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedRoute>
                    <LayoutWithNavbar>
                      <ReportForm />
                    </LayoutWithNavbar>
                  </ProtectedRoute>
                </Suspense>
              }
            />

           {/* User Details Route - Not protected since users need to fill this first */}
<Route
  path="/user-details"
  element={
    <Suspense fallback={<PageLoader />}>
      <LayoutWithNavbar>
        <UserDetails />
      </LayoutWithNavbar>
    </Suspense>
  }
/>

            <Route
              path="/userdashboard"
              element={
                <Suspense fallback={<PageLoader />}>
                  <ProtectedRoute>
                    <LayoutWithNavbar>
                      <UserDashboard />
                    </LayoutWithNavbar>
                  </ProtectedRoute>
                </Suspense>
              }
            />

            {/* Admin Only Routes */}
            <Route
              path="/admin"
              element={
                <Suspense fallback={<PageLoader />}>
                  <AdminRoute>
                    <LayoutWithNavbar>
                      <AdminPanel />
                    </LayoutWithNavbar>
                  </AdminRoute>
                </Suspense>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;