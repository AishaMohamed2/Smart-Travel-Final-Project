import React, { useState } from "react";
import api from "../../api";
import "../../styles/Trip/TripmateManager.css";

function TripmateManager({ tripId, initialTripmate = [], onSave, isModal = false }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [tripmate, setTripmate] = useState(initialTripmate);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const handleAddTripmate = async () => {
    if (!email.trim()) {
      setMessage({ text: "Please enter a valid email", type: "error" });
      return;
    }

    setIsCheckingUser(true);
    setMessage({ text: "Checking user...", type: "info" });

    try {
      const userCheck = await api.get(`/api/users/verify/?email=${email}`);
      
      if (!userCheck.data.exists) {
        setMessage({ text: "User with this email does not exist", type: "error" });
        return;
      }

      if (!tripId) {
        if (tripmate.some(c => c.email.toLowerCase() === email.toLowerCase())) {
          setMessage({ text: "User is already a tripmate", type: "error" });
          return;
        }
        
        const newTripmate = {
          id: `temp-${Date.now()}`,
          email,
          first_name: userCheck.data.first_name,
          last_name: userCheck.data.last_name
        };
        
        setTripmate([...tripmate, newTripmate]);
        setEmail('');
        setMessage({ 
          text: "tripmate will be added when trip is saved", 
          type: "success" 
        });
        return;
      }

      const response = await api.post(`/api/trips/${tripId}/tripmate/`, { email });
      setTripmate([...tripmate, response.data.user]);
      setEmail('');
      setMessage({ text: "Tripmate added!", type: "success" });
    } catch (err) {
      setMessage({
        text: err.response?.data?.detail || "Failed to add tripmate",
        type: "error"
      });
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleRemoveTripmate = async (userId) => {
    if (!tripId) {
        // For new trips (not saved yet)
        const updatedTripmate = tripmate.filter(c => c.id !== userId);
        setTripmate(updatedTripmate);
        return;
    }

    try {
        const tripmateToRemove = tripmate.find(c => c.id === userId);
        if (!tripmateToRemove) return;

        await api.delete(`/api/trips/${tripId}/tripmate/`, {
            data: { email: tripmateToRemove.email }
        });
        
        const updatedTripmate = tripmate.filter(c => c.id !== userId);
        setTripmate(updatedTripmate);
        setMessage({ text: "Tripmate removed", type: "success" });
    } catch (err) {
        setMessage({
            text: err.response?.data?.detail || "Failed to remove tripmate",
            type: "error"
        });
    }
};

  const handleSave = () => {
    if (onSave) {
      onSave(tripmate);
    }
  };

  return (
    <div className={`tripmate-container ${isModal ? 'modal-view' : ''}`}>
      <div className="tripmate-left">
        <div className="tripmate-section">
          <h3>Tripmate</h3>
          {tripmate.length > 0 ? (
            <ul className="tripmate-list">
              {tripmate.map((user) => (
                <li key={user.id}>
                  <div>
                    <strong>{user.first_name} {user.last_name}</strong>
                    <button 
                      onClick={() => handleRemoveTripmate(user.id)}
                      className="remove-button"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="email-muted">{user.email}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tripmate have been added</p>
          )}
        </div>
      </div>

      <div className="tripmate-right">
        <div className="add-tripmate-form">
          <h4>Add New Tripmate</h4>
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter tripmate's email"
              className="email-input"
            />
            <button
              onClick={handleAddTripmate}
              className="add-button"
              disabled={isCheckingUser}
            >
              {isCheckingUser ? "Checking..." : "Add Tripmate"}
            </button>
          </div>
          {message && (
            <p className={`message ${message.type}`}>{message.text}</p>
          )}
        </div>

        {isModal && (
          <div className="modal-actions">
            <button onClick={handleSave} className="save-button">
              Save Tripmate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripmateManager;