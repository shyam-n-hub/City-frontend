import { Link, useNavigate } from "react-router-dom";
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { signup, currentUser, isAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      if (isAdmin) {
        navigate("/admin-home");
      } else {
        navigate("/");
      }
    }
  }, [currentUser, isAdmin, navigate]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage("");

    try {
      await signup(email, password, name);
      setMessage("Account Created Successfully! Redirecting...");
      
      // Navigation will be handled by useEffect above
    } catch (error) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use') {
        setMessage("Email already in use. Please use a different email or log in.");
      } else if (error.code === 'auth/weak-password') {
        setMessage("Password should be at least 6 characters.");
      } else if (error.code === 'auth/invalid-email') {
        setMessage("Invalid email address.");
      } else {
        setMessage("Failed to create account. Please try again.");
      }
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-background">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
      
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">Create Account</h1>
          <p className="signup-subtitle">Join us today and get started</p>
        </div>

        <form className="signup-form" onSubmit={handleSignup}>
          <div className="input-group">
            <div className="input-wrapper">
              <input
                className="signup-input"
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ textTransform: "uppercase" }}
                disabled={isProcessing}
              />
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20.5901 22C20.5901 18.13 16.7402 15 12.0002 15C7.26015 15 3.41016 18.13 3.41016 22" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <input
                className="signup-input"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isProcessing}
              />
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
            </div>
          </div>

          <div className="input-group">
            <div className="input-wrapper">
              <input
                className="signup-input"
                type={showPassword ? "text" : "password"}
                placeholder="Create Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isProcessing}
              />
              <div className="input-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="12" cy="16" r="1" fill="currentColor"/>
                  <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isProcessing}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06L17.94 17.94Z" stroke="currentColor" strokeWidth="2"/>
                    <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8.21 8.21A4.5 4.5 0 0 0 15.79 15.79" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                disabled={isProcessing}
              />
              <span className="checkmark"></span>
              <span className="checkbox-text">Show Password</span>
            </label>
          </div>

          <button type="submit" className="signup-button" disabled={isProcessing}>
            <span className="button-text">
              {isProcessing ? "Creating Account..." : "Create Account"}
            </span>
            {!isProcessing && (
              <svg className="button-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </button>

          {message && (
            <div className={`signup-message ${message.includes("Successful") ? "success" : "error"}`}>
              <div className="message-icon">
                {message.includes("Successful") ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                )}
              </div>
              <span>{message}</span>
            </div>
          )}

          <div className="login-link">
            <span>Already have an account? </span>
            <Link to="/login" className="login-link-text">Sign In</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;