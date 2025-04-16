// src/components/Settings.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import api from '../api';
import '../styles/Settings.css';
import currencies from '../data/currencies';
import { validatePassword, getPasswordStrength } from '../utils/passwordUtils';

function Settings() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
    currency: 'GBP' 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const currencyOptions = currencies.map(currency => ({
    value: currency.code,
    label: `${currency.code} - ${currency.name}`,
    ...currency
  }));

  const selectedCurrency = currencyOptions.find(
    option => option.value === formData.currency
  ) || currencyOptions.find(option => option.value === 'GBP');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/user/');
        const { first_name, last_name, email, currency } = response.data;
        
        setFormData(prev => ({
          ...prev,
          firstName: first_name || '',
          lastName: last_name || '',
          email: email || '',
          currency: currency || 'GBP'
        }));
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data. Using default settings.');
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

  const handleCurrencyChange = (selectedOption) => {
    setFormData(prev => ({
      ...prev,
      currency: selectedOption.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      const passwordValidation = validatePassword(formData.newPassword);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.errors.join(" "));
        setLoading(false);
        return;
      }
    }

    try {
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        currency: formData.currency
      };

      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const response = await api.patch('/api/user/update/', updateData);
      setSuccess('Settings saved successfully');
      setFormData(prev => ({
        ...prev,
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) {
      try {
        setLoading(true);
        await api.delete('/api/user/delete/');
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

  return (
    <div className="settings-page-container">
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
                  onChange={handleChange}
                  required
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
                {formData.newPassword && (
                  <>
                    <div className="password-strength-meter">
                      <div 
                        className={`strength-bar ${getPasswordStrength(formData.newPassword) > 0 ? "active" : ""}`}
                        style={{width: `${getPasswordStrength(formData.newPassword) * 20}%`}}
                      ></div>
                    </div>
                    <div className="password-hint">
                      Password must contain: 8+ characters, uppercase, lowercase, number, and special character.
                    </div>
                  </>
                )}
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

            <div className="form-group">
              <label>Currency</label>
              <Select
                className="city-select"
                classNamePrefix="city-select"
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                options={currencyOptions}
                placeholder="Search currency..."
                isSearchable
                noOptionsMessage={() => "No currencies found"}
              />
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