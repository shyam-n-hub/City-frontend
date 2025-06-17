import { Link, useNavigate } from "react-router-dom";
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase-config";
import "./Login.css"; // Import the CSS file

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { login, currentUser, isAdmin } = useContext(AuthContext);
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage("");

    try {
      await login(email, password);
      setMessage("Login Successful! Redirecting...");
      
      // Navigation will be handled by useEffect above
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === 'auth/user-not-found') {
        setMessage("No account found with this email.");
      } else if (error.code === 'auth/wrong-password') {
        setMessage("Incorrect password.");
      } else if (error.code === 'auth/invalid-email') {
        setMessage("Invalid email address.");
      } else if (error.code === 'auth/too-many-requests') {
        setMessage("Too many failed attempts. Please try again later.");
      } else if (error.code === 'auth/invalid-credential') {
        setMessage("Invalid email or password.");
      } else {
        setMessage("Login failed. Please try again.");
      }
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = () => {
    setShowResetModal(true);
    setResetEmail(email); // Pre-fill with current email if available
  };

  const handleResetPassword = async () => {
    if (!resetEmail || !resetEmail.trim()) {
      setMessage("Please enter your email address.");
      setTimeout(() => setMessage(""), 4000);
      return;
    }

    setIsProcessing(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setMessage("Reset password link sent! Check your email.");
      setShowResetModal(false);
      setResetEmail("");
      setTimeout(() => setMessage(""), 5000);
    } catch (error) {
      console.error("Reset password error:", error);
      if (error.code === 'auth/user-not-found') {
        setMessage("No account found with this email.");
      } else if (error.code === 'auth/invalid-email') {
        setMessage("Please enter a valid email address.");
      } else {
        setMessage("Failed to send reset link. Please try again.");
      }
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalClose = () => {
    if (!isProcessing) {
      setShowResetModal(false);
      setResetEmail("");
    }
  };

  // Close modal when clicking outside
  const handleModalBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleModalClose();
    }
  };

  return (
    <div className="loginbox" >
      <form className="loginbox1" onSubmit={handleLogin}>
        <h1 className="loginh1">Login</h1>

        <input
          className="logininput"
          type="email"
          placeholder="Enter Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isProcessing}
          autoComplete="email"
        />

        <div className="password-container">
          <input
            className="logininput"
            type={showPassword ? "text" : "password"}
            placeholder="Enter Your Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isProcessing}
            autoComplete="current-password"
          />
        </div>
        
        <div className="login-show">
          <label className="login-show-password">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              disabled={isProcessing}
            />
            Show Password
          </label>
          <p className="forgotpasswordlink" onClick={handleForgotPassword}>
            Forgot Password?
          </p>
        </div>
        
        <button type="submit" className="loginbutton" disabled={isProcessing}>
          {isProcessing ? "Processing..." : "Login"}
        </button>

        {message && (
          <div
            className={`loginmessage ${
              message.includes("Successful") ? "success" : "error"
            }`}
          >
            {message}
          </div>
        )}

        <p className="signup-link">
          Don't have an account? <Link to="/signup">Create Account</Link>
        </p>
      </form>

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="reset-modal" onClick={handleModalBackdropClick}>
          <div className="reset-modal-content">
            <h2>Reset Password</h2>
            <input
              type="email"
              placeholder="Enter your email for reset"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="reset-email-input"
              disabled={isProcessing}
              autoComplete="email"
              autoFocus
            />
            <button 
              className="reset-button" 
              onClick={handleResetPassword}
              disabled={isProcessing || !resetEmail.trim()}
            >
              {isProcessing ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              className="cancel-button"
              onClick={handleModalClose}
              disabled={isProcessing}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;