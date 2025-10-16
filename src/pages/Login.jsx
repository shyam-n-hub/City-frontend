import { Link, useNavigate } from "react-router-dom";
import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
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

  // Initialize Google Auth Provider
  const googleProvider = new GoogleAuthProvider();

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

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setMessage("");

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      setMessage("Google Login Successful! Redirecting...");
      
      // The useEffect above will handle navigation after currentUser updates
    } catch (error) {
      console.error("Google login error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setMessage("Login was cancelled.");
      } else if (error.code === 'auth/popup-blocked') {
        setMessage("Popup was blocked. Please allow popups and try again.");
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        setMessage("An account already exists with this email but different credentials.");
      } else {
        setMessage("Google login failed. Please try again.");
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

        {/* OR Divider */}
        <div className="login-divider">
          <span>OR</span>
        </div>

        {/* Google Login Button */}
        <button 
          type="button" 
          className="google-login-button" 
          onClick={handleGoogleLogin}
          disabled={isProcessing}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {isProcessing ? "Signing in..." : "Continue with Google"}
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