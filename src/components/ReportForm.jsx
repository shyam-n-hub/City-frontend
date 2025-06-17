import { useState, useContext, useEffect, useRef } from "react";
import { ref, push } from "firebase/database";
import { db } from "../firebase-config";
import { AuthContext } from "../context/AuthContext";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "./ReportForm.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix marker icon
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  shadowUrl: iconShadow,
});

function LocationPicker({ setLocation }) {
  useMapEvents({
    click(e) {
      setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// Enhanced Chatbot Component with CSS classes
function ChatbotAssistant({ form, onSuggestion, isVisible, onToggle }) {
  const [messages, setMessages] = useState([
    { type: 'bot', text: "Hi! I'm here to help you file a better report. How can I assist you today?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = async (userMessage, currentForm) => {
    const message = userMessage.toLowerCase();
    
    const categoryKeywords = {
      pothole: ['pothole', 'road', 'street', 'hole', 'damage', 'asphalt'],
      streetlight: ['light', 'street light', 'lamp', 'dark', 'broken', 'not working'],
      garbage: ['garbage', 'trash', 'waste', 'dump', 'dirty', 'smell'],
      'water leakage': ['water', 'leak', 'pipe', 'burst', 'flooding', 'wet']
    };

    let detectedCategory = null;
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        detectedCategory = category;
        break;
      }
    }

    if (message.includes('help') || message.includes('how')) {
      return "I can help you with:\n• Choosing the right category\n• Writing better descriptions\n• Providing helpful tips\n\nWhat specific help do you need?";
    }

    if (detectedCategory && detectedCategory !== currentForm.category.toLowerCase()) {
      return `Based on your message, this sounds like a "${detectedCategory}" issue. Would you like me to suggest changing the category?`;
    }

    switch (currentForm.category.toLowerCase()) {
      case 'pothole':
        if (message.includes('size') || message.includes('deep')) {
          return "Great! For potholes, it's helpful to mention:\n• Size (small/medium/large)\n• Depth (shallow/deep)\n• Location (lane, sidewalk)\n• Traffic impact\n• Any damage to vehicles";
        }
        return "For pothole reports, consider including:\n• How big is it? (diameter)\n• How deep approximately?\n• Is it causing traffic issues?\n• Has it damaged any vehicles?";

      case 'streetlight':
        if (message.includes('time') || message.includes('when')) {
          return "Good question! For streetlight issues, mention:\n• When did you notice it? (specific time/date)\n• Does it turn on at all?\n• Is it flickering or completely dark?\n• How does it affect safety in the area?";
        }
        return "For streetlight reports, it helps to include:\n• Is it completely dark or flickering?\n• When did you first notice the issue?\n• How does it affect pedestrian/vehicle safety?\n• Are multiple lights affected?";

      case 'garbage':
        if (message.includes('pickup') || message.includes('collection')) {
          return "Excellent point! For garbage issues, mention:\n• Regular pickup schedule\n• How long has it been there?\n• Type of waste (household/commercial)\n• Any health/safety concerns\n• Attracting pests?";
        }
        return "For garbage reports, consider adding:\n• When was the last pickup?\n• What type of waste is it?\n• Is it causing smell or health issues?\n• Is it blocking walkways/roads?";

      case 'water leakage':
        if (message.includes('urgent') || message.includes('emergency')) {
          return "Water leaks can be urgent! Include:\n• Severity (dripping vs gushing)\n• Property damage risk\n• Street flooding potential\n• Utility access issues\n• Emergency contact if severe";
        }
        return "For water leakage reports, helpful details:\n• How severe is the leak?\n• Is it getting worse?\n• Any property damage?\n• Is it affecting traffic/walkways?\n• Approximate location of the pipe";

      default:
        return "I'm here to help improve your report! Tell me what you're experiencing and I'll provide specific guidance.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setInputText("");
    setIsTyping(true);

    setTimeout(async () => {
      const botResponse = await generateBotResponse(userMessage, form);
      setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isVisible) {
    return (
      <div className="chatbot-toggle-container">
        <button onClick={onToggle} className="chatbot-toggle-btn">
          <span className="chatbot-icon">💬</span>
        </button>
      </div>
    );
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="chatbot-header-info">
          <h4>AI Report Assistant</h4>
          <p>Here to help you file better reports</p>
        </div>
        <button onClick={onToggle} className="chatbot-close-btn">✕</button>
      </div>

      <div className="chatbot-messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.type}`}>
            <div className="message-bubble">
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="message bot">
            <div className="message-bubble typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chatbot-input-container">
        <div className="chatbot-input-wrapper">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your report..."
            className="chatbot-input"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="chatbot-send-btn"
          >
            <span>📤</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportForm() {
  const { currentUser } = useContext(AuthContext);
  const [form, setForm] = useState({
    category: "Pothole",
    description: "",
    location: { lat: null, lng: null },
    image: null,
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chatbotVisible, setChatbotVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setForm((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const getPredictedCategory = async (description) => {
    try {
      if (!description || !description.trim()) {
        return form.category;
      }

      const response = await fetch("https://city-backend-pfob.onrender.com/predict", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          description: description.trim() 
        }),
      });

      if (!response.ok) {
        console.warn(`Prediction API returned ${response.status}`);
        return form.category;
      }

      const data = await response.json();
      return data.category || form.category;
    } catch (err) {
      console.error("Prediction error:", err);
      return form.category;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessage("");
    setProgress(0);

    // Validation
    if (!form.location.lat || !form.location.lng) {
      setMessage("Please select a location on the map.");
      setIsSubmitting(false);
      return;
    }

    if (!form.image) {
      setMessage("Please upload an image.");
      setIsSubmitting(false);
      return;
    }

    if (!form.description.trim()) {
      setMessage("Please provide a description.");
      setIsSubmitting(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          setProgress(25);
          const base64Image = reader.result.replace(/^data:image\/[a-z]+;base64,/, '');

          setMessage("📤 Uploading image...");
          setProgress(50);
          const apiKey = "0b03d35eabd7097c44177ec372f3f1da";
          const imageResponse = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: new URLSearchParams({ image: base64Image }),
          });

          const imageResult = await imageResponse.json();
          if (!imageResult.success) {
            throw new Error("Image upload failed: " + (imageResult.error?.message || "Unknown error"));
          }

          const imageUrl = imageResult.data.url;
          setProgress(75);

          setMessage("🤖 Getting AI prediction...");
          const predictedCategory = await getPredictedCategory(form.description);

          const reportData = {
            category: form.category || "Unknown",
            predictedCategory: predictedCategory || form.category || "Unknown",
            description: form.description.trim() || "No description",
            location: {
              lat: Number(form.location.lat),
              lng: Number(form.location.lng)
            },
            imageUrl: imageUrl,
            user: currentUser?.uid || "anonymous",
            status: "pending",
            createdAt: Date.now(),
          };

          setMessage("💾 Submitting report...");
          setProgress(90);
          await push(ref(db, "reports"), reportData);

          setProgress(100);
          setMessage("🎉 Report submitted successfully!");
          
          // Reset form
          setForm({
            category: "Pothole",
            description: "",
            location: { lat: null, lng: null },
            image: null,
          });

          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.value = '';

        } catch (error) {
          console.error("Submission error:", error);
          setMessage(`❌ Error submitting report: ${error.message}`);
        } finally {
          setIsSubmitting(false);
          setTimeout(() => setProgress(0), 2000);
        }
      };

      reader.onerror = () => {
        setMessage("❌ Error reading image file.");
        setIsSubmitting(false);
      };

      reader.readAsDataURL(form.image);
    } catch (error) {
      console.error("File reading error:", error);
      setMessage("❌ Error processing image file.");
      setIsSubmitting(false);
    }
  };

  const handleChatbotSuggestion = (suggestion) => {
    console.log("Chatbot suggestion:", suggestion);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      "Pothole": "🕳️",
      "Streetlight": "💡",
      "Garbage": "🗑️",
      "Water Leakage": "💧"
    };
    return icons[category] || "📋";
  };

  return (
    <div className="report-form-container">
      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
        </div>
      </div>

      <div className="report-form-card">
        <div className="form-header">
          <div className="header-content">
            <h1 className="form-title">
              <span className="title-icon">🏙️</span>
              Smart City Reporter
            </h1>
            <p className="form-subtitle">Help make your city better by reporting public issues</p>
          </div>
          <button
            type="button"
            onClick={() => setChatbotVisible(true)}
            className="ai-help-btn"
          >
            <span className="btn-icon">🤖</span>
            AI Assistant
            <div className="btn-glow"></div>
          </button>
        </div>

        {progress > 0 && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {message && (
          <div className={`alert ${message.includes("Error") || message.includes("Please") ? "alert-error" : "alert-success"}`}>
            <div className="alert-content">
              {message}
            </div>
          </div>
        )}

        <form className="report-form">
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📂</span>
              Issue Category
            </label>
            <div className="select-wrapper">
              <select 
                name="category" 
                value={form.category} 
                onChange={handleChange}
                className="form-select"
                disabled={isSubmitting}
              >
                <option value="Pothole">🕳️ Pothole</option>
                <option value="Streetlight">💡 Streetlight</option>
                <option value="Garbage">🗑️ Garbage</option>
                <option value="Water Leakage">💧 Water Leakage</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📝</span>
              Description
              <span className="required">*</span>
            </label>
            <div className="textarea-wrapper">
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                required 
                placeholder="Describe the problem in detail... Be specific about size, location, and impact."
                className="form-textarea"
                disabled={isSubmitting}
                rows="4"
              />
              <div className="textarea-footer">
                <span className="char-count">{form.description.length} characters</span>
                <span className="help-text">💡 Need help? Try our AI Assistant!</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📍</span>
              Location Selection
              <span className="required">*</span>
            </label>
            <div className="map-container">
              <MapContainer
                center={[10.8505, 78.6921]}
                zoom={6}
                className="leaflet-map"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationPicker setLocation={(loc) => setForm((prev) => ({ ...prev, location: loc }))} />
                {form.location.lat && form.location.lng && (
                  <Marker position={[form.location.lat, form.location.lng]} />
                )}
              </MapContainer>
              <div className="map-instruction">
                <span className="instruction-icon">👆</span>
                Click on the map to select the exact location
              </div>
            </div>
          </div>

          <div className="coordinates-group">
            <div className="coordinate-field">
              <label className="form-label">
                <span className="label-icon">🌐</span>
                Latitude
              </label>
              <input 
                type="number" 
                value={form.location.lat || ""} 
                readOnly 
                className="form-input coordinate-input"
                placeholder="Select location on map"
              />
            </div>
            <div className="coordinate-field">
              <label className="form-label">
                <span className="label-icon">🌐</span>
                Longitude
              </label>
              <input 
                type="number" 
                value={form.location.lng || ""} 
                readOnly 
                className="form-input coordinate-input"
                placeholder="Select location on map"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">📸</span>
              Upload Photo Evidence
              <span className="required">*</span>
            </label>
            <div className="file-upload-wrapper">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                required 
                className="file-input"
                id="image-upload"
                disabled={isSubmitting}
              />
              <label htmlFor="image-upload" className="file-upload-label">
                {form.image ? (
                  <div className="file-selected">
                    <span className="file-icon">✅</span>
                    <span className="file-name">{form.image.name}</span>
                  </div>
                ) : (
                  <div className="file-placeholder">
                    <span className="upload-icon">📷</span>
                    <span className="upload-text">Click to upload photo</span>
                    <span className="upload-subtext">JPG, PNG up to 10MB</span>
                  </div>
                )}
              </label>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`submit-btn ${isSubmitting ? 'submitting' : ''}`}
          >
            {isSubmitting ? (
              <div className="loading-content">
                <div className="spinner"></div>
                <span>Submitting Report...</span>
              </div>
            ) : (
              <div className="submit-content">
                <span className="submit-icon">🚀</span>
                <span>Submit Report</span>
              </div>
            )}
            <div className="btn-ripple"></div>
          </button>
        </form>
      </div>

      <ChatbotAssistant
        form={form}
        onSuggestion={handleChatbotSuggestion}
        isVisible={chatbotVisible}
        onToggle={() => setChatbotVisible(!chatbotVisible)}
      />
    </div>
  );
}

export default ReportForm;