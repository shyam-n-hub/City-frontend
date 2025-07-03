// src/pages/Home.jsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleReportClick = () => {
    if (currentUser) {
      navigate('/report');
    } else {
      navigate('/login');
    }
  };

  const handleViewReportsClick = () => {
    if (currentUser) {
      navigate('/userdashboard');
    } else {
      navigate('/login');
    }
  };

  const handleStartReportingClick = () => {
    if (currentUser) {
      navigate('/report');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="gradient-text">Smart City</span>
              <br />
              Issue Reporting System!
            </h1>
            <p className="hero-subtitle">
              Empowering citizens to build better communities through collaborative issue reporting
            </p>
            <div className="hero-buttons">
              <button className="cta-button primary" onClick={handleReportClick}>
                <span>Report an Issue</span>
                <div className="button-shine"></div>
              </button>
              <button className="cta-button secondary" onClick={handleViewReportsClick}>
                <span>View Reports</span>
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-elements">
              <div className="floating-icon city">🏙️</div>
              <div className="floating-icon report">📋</div>
              <div className="floating-icon location">📍</div>
              <div className="floating-icon ai">🤖</div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C150,100 350,0 600,60 C900,120 1050,20 1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">
            <span className="title-highlight">Key Features</span>
          </h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🗺️</div>
              <h3>Interactive Map</h3>
              <p>Pinpoint exact locations using our intuitive map interface powered by OpenStreetMap</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Classification</h3>
              <p>Automatic issue categorization using machine learning for faster processing</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📸</div>
              <h3>Image Upload</h3>
              <p>Capture and upload photos to provide visual evidence of reported issues</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔐</div>
              <h3>Secure Authentication</h3>
              <p>Firebase-powered secure login system to track and manage your reports</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-time Updates</h3>
              <p>Get instant notifications on the status of your reported issues</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Analytics Dashboard</h3>
              <p>View comprehensive statistics and trends of city-wide issues</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <h2 className="section-title">
            <span className="title-highlight">How It Works</span>
          </h2>
          <div className="steps-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Identify the Issue</h3>
                <p>Spot a problem in your neighborhood? Take a photo and note the details.</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Report via Map</h3>
                <p>Use our interactive map to pinpoint the exact location of the issue.</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>AI Classification</h3>
                <p>Our smart system automatically categorizes your report for faster processing.</p>
              </div>
            </div>
            <div className="step-connector"></div>
            <div className="step-item">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Track Progress</h3>
                <p>Monitor the status of your report and receive updates on resolution.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Issue Types Section */}
      <section className="issue-types-section">
        <div className="container">
          <h2 className="section-title">
            <span className="title-highlight">Report These Issues</span>
          </h2>
          <div className="issue-types-grid">
            <div className="issue-type-card">
              <div className="issue-icon">🕳️</div>
              <h4>Potholes</h4>
              <p>Road damage affecting traffic safety</p>
            </div>
            <div className="issue-type-card">
              <div className="issue-icon">💡</div>
              <h4>Street Lights</h4>
              <p>Broken or non-functional lighting</p>
            </div>
            <div className="issue-type-card">
              <div className="issue-icon">🗑️</div>
              <h4>Garbage Issues</h4>
              <p>Overflowing bins or illegal dumping</p>
            </div>
            <div className="issue-type-card">
              <div className="issue-icon">💧</div>
              <h4>Water Problems</h4>
              <p>Leaks, flooding, or supply issues</p>
            </div>
            <div className="issue-type-card">
              <div className="issue-icon">🏗️</div>
              <h4>Infrastructure</h4>
              <p>Damaged sidewalks, bridges, or buildings</p>
            </div>
            <div className="issue-type-card">
              <div className="issue-icon">🌳</div>
              <h4>Environmental</h4>
              <p>Pollution, tree damage, or green spaces</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">1247</div>
              <div className="stat-label">Issues Reported</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">892</div>
              <div className="stat-label">Issues Resolved</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3500</div>
              <div className="stat-label">Active Citizens</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">89%</div>
              <div className="stat-label">Resolution Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Make a Difference?</h2>
            <p>Join thousands of citizens making their communities better, one report at a time.</p>
            <div className="cta-buttons">
              <button className="cta-button primary large" onClick={handleStartReportingClick}>
                <span>Start Reporting Now</span>
                <div className="button-shine"></div>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;