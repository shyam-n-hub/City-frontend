import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ref, set, get } from "firebase/database";
import { db } from "../firebase-config";
import { AuthContext } from "../context/AuthContext";
import "./UserDetails.css";

function UserDetails() {
  const { currentUser } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    citizenName: "",
    emailId: "",
    mobileNumber: "",
    dateOfBirth: "",
    gender: "",
    municipalityName: "",
    pinCode: "",
    area: "",
    locality: "",
    street: "",
    buildingName: "",
    doorNo: ""
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [belongsToMunicipality, setBelongsToMunicipality] = useState(false);

  const municipalities = [
    "Chennai Municipality",
    "Ariyalur Municipality",
    "Chengalpattu Municipality", 
    "Coimbatore Corporation",
    "Cuddalore Municipality",
    "Dharmapuri Municipality",
    "Dindigul Municipality",
    "Erode Municipality",
    "Hosur Municipality",
    "Kanchipuram Municipality",
    "Karaikudi Municipality",
    "Karur Municipality",
    "Krishnagiri Municipality",
    "Kumbakonam Municipality",
    "Madurai Corporation",
    "Mayiladuthurai Municipality",
    "Nagapattinam Municipality",
    "Nagercoil Municipality",
    "Namakkal Municipality",
    "Neyveli Municipality",
    "Ooty Municipality",
    "Pallavaram Municipality",
    "Pollachi Municipality",
    "Pudukkottai Municipality",
    "Ramanathapuram Municipality",
    "Salem Corporation",
    "Sivakasi Municipality",
    "Thanjavur Municipality",
    "Theni Municipality",
    "Thoothukudi Municipality",
    "Tiruchirappalli Corporation",
    "Tirunelveli Corporation",
    "Tiruppur Corporation",
    "Tiruvannaamalai Municipality",
    "Vellore Corporation",
    "Villupuram Municipality",
    "Virudhunagar Municipality"
  ];

  // Check if user already has details filled
  useEffect(() => {
    const checkUserDetails = async () => {
      if (currentUser) {
        try {
          const userDetailsRef = ref(db, `userDetails/${currentUser.uid}`);
          const snapshot = await get(userDetailsRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setFormData(userData);
            setBelongsToMunicipality(!!userData.municipalityName);
            setMessage("Your details are already saved. You can update them if needed.");
          } else {
            // Pre-fill email from auth
            setFormData(prev => ({
              ...prev,
              emailId: currentUser.email || ""
            }));
          }
        } catch (error) {
          console.error("Error checking user details:", error);
        }
      }
    };

    checkUserDetails();
  }, [currentUser]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.citizenName.trim()) {
      newErrors.citizenName = "Citizen name is required";
    }
    
    if (!formData.emailId.trim()) {
      newErrors.emailId = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.emailId)) {
      newErrors.emailId = "Email is invalid";
    }
    
    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ''))) {
      newErrors.mobileNumber = "Mobile number must be 10 digits";
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required";
    }
    
    if (!formData.gender) {
      newErrors.gender = "Gender is required";
    }
    
    if (belongsToMunicipality && !formData.municipalityName) {
      newErrors.municipalityName = "Municipality name is required";
    }
    
    if (!formData.pinCode.trim()) {
      newErrors.pinCode = "Pin code is required";
    } else if (!/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = "Pin code must be 6 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleCheckboxChange = (e) => {
    setBelongsToMunicipality(e.target.checked);
    if (!e.target.checked) {
      setFormData(prev => ({
        ...prev,
        municipalityName: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage("Please correct the errors below.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const userDetailsData = {
        ...formData,
        userId: currentUser.uid,
        updatedAt: Date.now(),
        belongsToMunicipality
      };

      // Save user details to Firebase
      const userDetailsRef = ref(db, `userDetails/${currentUser.uid}`);
      await set(userDetailsRef, userDetailsData);

      setMessage("Details saved successfully! Redirecting...");
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate("/report");
      }, 2000);

    } catch (error) {
      console.error("Error saving user details:", error);
      setMessage("Error saving details. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      citizenName: "",
      emailId: currentUser?.email || "",
      mobileNumber: "",
      dateOfBirth: "",
      gender: "",
      municipalityName: "",
      pinCode: "",
      area: "",
      locality: "",
      street: "",
      buildingName: "",
      doorNo: ""
    });
    setBelongsToMunicipality(false);
    setErrors({});
    setMessage("");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  return (
    <div className="user-details-container">
      <div className="user-details-card">
        <div className="form-header1">
          <h1 className="form-title">
            <span className="title-icon">👤</span>
            New Citizen Registration
          </h1>
          <p className="form-subtitle">Please fill in your details to continue</p>
        </div>

        {message && (
          <div className={`alert ${message.includes("Error") || message.includes("correct") ? "alert-error" : "alert-success"}`}>
            <div className="alert-content">
              {message}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="user-details-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Citizen Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="citizenName"
                value={formData.citizenName}
                onChange={handleInputChange}
                className={`form-input ${errors.citizenName ? 'error' : ''}`}
                placeholder="Enter your full name"
                disabled={isSubmitting}
                style={{ textTransform: "uppercase" }}
              />
              {errors.citizenName && <span className="error-text">{errors.citizenName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Email ID <span className="required">*</span>
              </label>
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleInputChange}
                className={`form-input ${errors.emailId ? 'error' : ''}`}
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
              {errors.emailId && <span className="error-text">{errors.emailId}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Mobile Number <span className="required">*</span>
              </label>
              <div className="mobile-input-group">
                <span className="country-code">+91</span>
                <input
                  type="tel"
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleInputChange}
                  className={`form-input mobile-input ${errors.mobileNumber ? 'error' : ''}`}
                  placeholder="Enter mobile number"
                  disabled={isSubmitting}
                  maxLength="10"
                />
              </div>
              {errors.mobileNumber && <span className="error-text">{errors.mobileNumber}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Date of Birth <span className="required">*</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className={`form-input ${errors.dateOfBirth ? 'error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Gender <span className="required">*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={`form-select ${errors.gender ? 'error' : ''}`}
                disabled={isSubmitting}
              >
                <option value="">--Select--</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <span className="error-text">{errors.gender}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="checkbox-group">
              <label className="checkbox-wrapper">
                <input
                  type="checkbox"
                  checked={belongsToMunicipality}
                  onChange={handleCheckboxChange}
                  disabled={isSubmitting}
                />
                <span className="checkmark"></span>
                <span className="checkbox-text">
                  Please select if the Citizen belongs to Municipality/Corporation
                </span>
              </label>
            </div>
          </div>

          {belongsToMunicipality && (
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Municipality/Corporation Name <span className="required">*</span>
                </label>
                <select
                  name="municipalityName"
                  value={formData.municipalityName}
                  onChange={handleInputChange}
                  className={`form-select ${errors.municipalityName ? 'error' : ''}`}
                  disabled={isSubmitting}
                >
                  <option value="">--Select--</option>
                  {municipalities.map((municipality, index) => (
                    <option key={index} value={municipality}>
                      {municipality}
                    </option>
                  ))}
                </select>
                {errors.municipalityName && <span className="error-text">{errors.municipalityName}</span>}
              </div>
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Pin Code <span className="required">*</span>
              </label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleInputChange}
                className={`form-input ${errors.pinCode ? 'error' : ''}`}
                placeholder="Enter pin code"
                disabled={isSubmitting}
                maxLength="6"
              />
              {errors.pinCode && <span className="error-text">{errors.pinCode}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Area</label>
              <input
                type="text"
                name="area"
                value={formData.area}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter area"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Locality</label>
              <input
                type="text"
                name="locality"
                value={formData.locality}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter locality"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Street</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter street"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Building/Apartment/Landmark Name</label>
              <input
                type="text"
                name="buildingName"
                value={formData.buildingName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter building/apartment/landmark name"
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Door No</label>
              <input
                type="text"
                name="doorNo"
                value={formData.doorNo}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter door number"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-actions">
            {/* <button
              type="button"
              onClick={handleGoHome}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              <span className="btn-icon">🏠</span>
              Go to Home Page
            </button> */}
            
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-outline"
              disabled={isSubmitting}
            >
              <span className="btn-icon">🔄</span>
              Reset
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="loading-content">
                  <div className="spinner"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="submit-content">
                  <span className="btn-icon">💾</span>
                  <span>Submit</span>
                </div>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

export default UserDetails;