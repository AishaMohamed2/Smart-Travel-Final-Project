import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Sidebar from '../components/Navigation/Sidebar';
import '../styles/Settings.css';

function Settings() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
    currency: 'USD'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/user/'); // Corrected endpoint
        console.log('User data response:', response.data); // Debug log
        
        const { first_name, last_name, email, currency } = response.data;
        setFormData(prev => ({
          ...prev,
          firstName: first_name || '',
          lastName: last_name || '',
          email: email || '',
          currency: currency || 'USD'
        }));
      } catch (err) {
        console.error('Detailed fetch error:', err.response || err);
        setError(err.response?.data?.detail || 'Failed to load user data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        currency: formData.currency
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const response = await api.patch('/api/user/update/', updateData); // Corrected endpoint
      console.log('Update response:', response.data); // Debug log
      
      setSuccess('Settings saved successfully');
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      console.error('Detailed update error:', err.response || err);
      setError(err.response?.data?.detail || 'Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
      try {
        setLoading(true);
        await api.delete('/api/user/delete/'); // Corrected endpoint
        localStorage.clear();
        navigate('/login');
      } catch (err) {
        console.error('Detailed delete error:', err.response || err);
        setError(err.response?.data?.detail || 'Failed to delete account. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="settings-page-container">
        <Sidebar />
        <div className="main-content">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page-container">
      <Sidebar />
      <div className="main-content">
        <div className="settings-container">
          <h1>Settings</h1>
          <p className="settings-subtitle">Manage your account preferences and settings</p>
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="settings-section">
              <h3>Profile Settings</h3>
              <div className="form-group">
                <label>First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="read-only-input"
                />
              </div>
              <div className="form-group">
                <label>Change Password</label>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>
              {formData.newPassword && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm new password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            <div className="settings-section">
              <h3>Currency Preferences</h3>
              <div className="form-group">
                <label>Default Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
            </div>

            <div className="settings-actions">
              <button type="submit" className="save-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
              <button 
                type="button" 
                className="delete-btn" 
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Delete Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Settings;