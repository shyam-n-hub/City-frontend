import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect} from "react";
import { AuthContext } from "../context/AuthContext";
import "./Navbar.css";
import { ref, get } from "firebase/database";
import { db } from "../firebase-config";

function Navbar() {
  const { currentUser, isAdmin, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [hasUserDetails, setHasUserDetails] = useState(null);

  const handleLogout = async () => {
  try {
    await logout();
    navigate("/");
    setIsMobileMenuOpen(false);
    setShowLogoutConfirmation(false);
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

const handleLogoutClick = () => {
  setShowLogoutConfirmation(true);
};

const handleLogoutConfirm = () => {
  handleLogout();
};

const handleLogoutCancel = () => {
  setShowLogoutConfirmation(false);
};

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Check if user has filled details
useEffect(() => {
  const checkUserDetails = async () => {
    if (currentUser && !isAdmin) {
      try {
        const userDetailsRef = ref(db, `userDetails/${currentUser.uid}`);
        const snapshot = await get(userDetailsRef);
        setHasUserDetails(snapshot.exists());
      } catch (error) {
        console.error("Error checking user details:", error);
        setHasUserDetails(false);
      }
    }
  };

  checkUserDetails();
}, [currentUser, isAdmin]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand Section */}
        <div className="navbar-brand">
          <Link to="/" className="brand-link" onClick={closeMobileMenu}>
              <img src="/logo.png" alt="logo" className="icon-city" style={{width:"60px",height:"50px"}}></img>
            
            <div className="brand-text">
              <span className="brand-title">City Fix</span>
              <span className="brand-subtitle">Report Hub</span>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-nav">
          {currentUser ? (
            <>
              {/* Regular User Navigation */}
{!isAdmin && (
  <div className="nav-links">
    <Link to="/" className="nav-link" onClick={closeMobileMenu}>
      <span className="nav-icon">🏠</span>
      <span>Home</span>
    </Link>
    <Link to="/user-details" className="nav-link" onClick={closeMobileMenu}>
      <span className="nav-icon">👤</span>
      <span>User Details</span>
      {hasUserDetails === false && <span className="notification-dot"></span>}
    </Link>
    <Link to="/report" className="nav-link " onClick={closeMobileMenu}>
      <span className="nav-icon">📝</span>
      <span>Report Issue</span>
    </Link>
    <Link to="/userdashboard" className="nav-link" onClick={closeMobileMenu}>
      <span className="nav-icon">📊</span>
      <span>Dashboard</span>
    </Link>
  </div>
)}

              {/* Admin Navigation */}
              {isAdmin && (
                <div className="nav-links admin-nav">
                  <Link to="/admin-home" className="nav-link admin-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">⚡</span>
                    <span>Admin Home</span>
                  </Link>
                  <Link to="/admin" className="nav-link admin-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">🛠️</span>
                    <span>Admin Panel</span>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="nav-links">
              <Link to="/" className="nav-link" onClick={closeMobileMenu}>
                <span className="nav-icon">🏠</span>
                <span>Home</span>
              </Link>
              {/* <Link to="/about" className="nav-link" onClick={closeMobileMenu}>
                <span className="nav-icon">ℹ️</span>
                <span>About</span>
              </Link> */}
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="navbar-user">
          {currentUser ? (
            <>
              <div className="user-info">
                <div className="user-avatar">
                  {isAdmin ? "👨‍💼" : "👤"}
                </div>
                <div className="user-details">
                  <span className="user-email">{currentUser.email}</span>
                  {isAdmin && <span className="user-role">Administrator</span>}
                </div>
              </div>
              <button onClick={handleLogoutClick} className="logout-btn">
  <span className="logout-icon">🚪</span>
  <span>Logout</span>
</button>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="auth-btn login-btn" onClick={closeMobileMenu}>
                <span>Login</span>
              </Link>
              <Link to="/signup" className="auth-btn signup-btn" onClick={closeMobileMenu}>
                <span>Sign Up</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="mobile-menu-toggle" onClick={toggleMobileMenu}>
          <div className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
        <div className="mobile-menu-content">
          {currentUser ? (
            <>
              {/* Mobile User Info */}
              <div className="mobile-user-info">
                <div className="mobile-user-avatar">
                  {isAdmin ? "👨‍💼" : "👤"}
                </div>
                <div className="mobile-user-details">
                  <span className="mobile-user-email">{currentUser.email}</span>
                  {isAdmin && <span className="mobile-user-role">Administrator</span>}
                </div>
              </div>

              {/* Mobile Navigation Links */}
{!isAdmin && (
  <div className="mobile-nav-links">
    <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
      <span className="mobile-nav-icon">🏠</span>
      <span>Home</span>
    </Link>
    <Link to="/user-details" className="mobile-nav-link" onClick={closeMobileMenu}>
      <span className="mobile-nav-icon">👤</span>
      <span>User Details</span>
      {hasUserDetails === false && <span className="mobile-notification-dot"></span>}
    </Link>
    <Link to="/report" className="mobile-nav-link report-mobile" onClick={closeMobileMenu}>
      <span className="mobile-nav-icon">📝</span>
      <span>Report Issue</span>
    </Link>
    <Link to="/userdashboard" className="mobile-nav-link" onClick={closeMobileMenu}>
      <span className="mobile-nav-icon">📊</span>
      <span>Dashboard</span>
    </Link>
  </div>
)}

              {isAdmin && (
                <div className="mobile-nav-links">
                  <Link to="/admin-home" className="mobile-nav-link admin-mobile" onClick={closeMobileMenu}>
                    <span className="mobile-nav-icon">⚡</span>
                    <span>Admin Home</span>
                  </Link>
                  <Link to="/admin" className="mobile-nav-link admin-mobile" onClick={closeMobileMenu}>
                    <span className="mobile-nav-icon">🛠️</span>
                    <span>Admin Panel</span>
                  </Link>
                </div>
              )}

              <button onClick={handleLogoutClick} className="mobile-logout-btn">
  <span className="mobile-logout-icon">🚪</span>
  <span>Logout</span>
</button>
            </>
          ) : (
            <>
              <div className="mobile-nav-links">
                <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
                  <span className="mobile-nav-icon">🏠</span>
                  <span>Home</span>
                </Link>
                {/* <Link to="/about" className="mobile-nav-link" onClick={closeMobileMenu}>
                  <span className="mobile-nav-icon">ℹ️</span>
                  <span>About</span>
                </Link> */}
              </div>
              <div className="mobile-auth-buttons">
                <Link to="/login" className="mobile-auth-btn mobile-login-btn" onClick={closeMobileMenu}>
                  <span>Login</span>
                </Link>
                <Link to="/signup" className="mobile-auth-btn mobile-signup-btn" onClick={closeMobileMenu}>
                  <span>Sign Up</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
      {showLogoutConfirmation && (
  <div className="logout-confirmation-overlay">
    <div className="logout-confirmation-modal">
      <div className="logout-confirmation-content">
        <div className="logout-confirmation-icon">⚠️</div>
        <h3 className="logout-confirmation-title">Confirm Logout</h3>
        <p className="logout-confirmation-message">
          Are you sure you want to logout? You will need to sign in again to access your account.
        </p>
        <div className="logout-confirmation-buttons">
          <button onClick={handleLogoutCancel} className="logout-cancel-btn">
            Cancel
          </button>
          <button onClick={handleLogoutConfirm} className="logout-confirm-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </nav>
  );
}

export default Navbar;