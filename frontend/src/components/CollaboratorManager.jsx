import React, { useState } from "react";
import api from "../api";
import "../styles/CollaboratorManager.css";

function CollaboratorManager({ tripId, initialCollaborators = [], onSave, isModal = false }) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [collaborators, setCollaborators] = useState(initialCollaborators);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const handleAddCollaborator = async () => {
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
        if (collaborators.some(c => c.email.toLowerCase() === email.toLowerCase())) {
          setMessage({ text: "User is already a collaborator", type: "error" });
          return;
        }
        
        const newCollaborator = {
          id: `temp-${Date.now()}`,
          email,
          first_name: userCheck.data.first_name,
          last_name: userCheck.data.last_name
        };
        
        setCollaborators([...collaborators, newCollaborator]);
        setEmail('');
        setMessage({ 
          text: "Collaborator will be added when trip is saved", 
          type: "success" 
        });
        return;
      }

      const response = await api.post(`/api/trips/${tripId}/collaborators/`, { email });
      setCollaborators([...collaborators, response.data.user]);
      setEmail('');
      setMessage({ text: "Collaborator added!", type: "success" });
    } catch (err) {
      setMessage({
        text: err.response?.data?.detail || "Failed to add collaborator",
        type: "error"
      });
    } finally {
      setIsCheckingUser(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!tripId) {
      setCollaborators(collaborators.filter(c => c.id !== userId));
      return;
    }

    try {
      const collaborator = collaborators.find(c => c.id === userId);
      if (!collaborator) return;

      await api.delete(`/api/trips/${tripId}/collaborators/`, {
        data: { email: collaborator.email }
      });
      
      setCollaborators(collaborators.filter(c => c.id !== userId));
      setMessage({ text: "Collaborator removed", type: "success" });
    } catch (err) {
      setMessage({
        text: err.response?.data?.detail || "Failed to remove collaborator",
        type: "error"
      });
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(collaborators);
    }
  };

  return (
    <div className={`collaborator-container ${isModal ? 'modal-view' : ''}`}>
      <div className="collaborator-left">
        <div className="collaborators-section">
          <h3>Collaborators</h3>
          {collaborators.length > 0 ? (
            <ul className="collaborator-list">
              {collaborators.map((user) => (
                <li key={user.id}>
                  <div>
                    <strong>{user.first_name} {user.last_name}</strong>
                    <button 
                      onClick={() => handleRemoveCollaborator(user.id)}
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
            <p>No collaborators have been added</p>
          )}
        </div>
      </div>

      <div className="collaborator-right">
        <div className="add-collaborator-form">
          <h4>Add New Collaborator</h4>
          <div className="form-group">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter collaborator's email"
              className="email-input"
            />
            <button
              onClick={handleAddCollaborator}
              className="add-button"
              disabled={isCheckingUser}
            >
              {isCheckingUser ? "Checking..." : "Add Collaborator"}
            </button>
          </div>
          {message && (
            <p className={`message ${message.type}`}>{message.text}</p>
          )}
        </div>

        {isModal && (
          <div className="modal-actions">
            <button onClick={handleSave} className="save-button">
              Save Collaborators
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CollaboratorManager;