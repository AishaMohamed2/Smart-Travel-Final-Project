import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import api from '../api';
import '../styles/Settings.css';
import currencies from '../data/currencies';
import { validatePassword, getPasswordStrength } from '../utils/passwordUtils';
import { RxEyeOpen } from "react-icons/rx";
import { GoEyeClosed } from "react-icons/go";

function Settings() {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        currency: 'GBP' 
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    // Prepare currency options for react-select
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
  
      // Validate new password if being changed
      if (formData.newPassword) {
          if (formData.newPassword !== formData.confirmPassword) {
              setError('New passwords do not match');
              setLoading(false);
              return;
          }
          
          const passwordValidation = validatePassword(formData.newPassword);
          if (!passwordValidation.isValid) {
              setError(passwordValidation.errors.join(" "));
              setLoading(false);
              return;
          }
  
          if (!formData.currentPassword) {
              setError('Current password is required to change password');
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
              updateData.current_password = formData.currentPassword;
              updateData.new_password = formData.newPassword;
              updateData.confirm_password = formData.confirmPassword;
          }
          
          // Send PATCH request to update user data
          const response = await api.patch('/api/user/update/', updateData);
          
          setSuccess('Settings saved successfully');
          setFormData(prev => ({
              ...prev,
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
          }));
  
          // If password was changed, update token
          if (formData.newPassword) {
              try {
                  const loginRes = await api.post('/api/token/', {
                      email: formData.email,
                      password: formData.newPassword
                  });
                  localStorage.setItem(ACCESS_TOKEN, loginRes.data.access);
                  localStorage.setItem(REFRESH_TOKEN, loginRes.data.refresh);
              } catch (loginError) {
                  console.error("Token refresh failed:", loginError);
                  // Don't show error to user - they're still logged in with old token
              }
          }
      } catch (err) {
          console.error("Update error:", err.response?.data);
          if (err.response?.status === 400) {
              if (err.response.data?.current_password) {
                  setError("Current password is incorrect");
              } else if (err.response.data?.new_password) {
                  setError("New password validation failed: " + err.response.data.new_password.join(' '));
              } else {
                  setError("Invalid data. Please check your inputs.");
              }
          } else if (err.response?.status === 401) {
              setError("Session expired. Please log in again.");
              localStorage.removeItem(ACCESS_TOKEN);
              localStorage.removeItem(REFRESH_TOKEN);
              navigate('/login');
          } else {
              setError(err.response?.data?.detail || 'Failed to save settings. Please try again.');
          }
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
                        </div>

                        <div className="settings-section">
                            <h3>Change Password</h3>
                            <div className="form-group">
                                <label>Current Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showCurrentPassword ? "text" : "password"}
                                        name="currentPassword"
                                        placeholder="Enter current password"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                    />
                                    <span 
                                        className="password-toggle"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    >
                                        {showCurrentPassword ? <RxEyeOpen /> : < GoEyeClosed />}
                                    </span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        name="newPassword"
                                        placeholder="Enter new password"
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                    />
                                    <span 
                                        className="password-toggle"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <RxEyeOpen /> : < GoEyeClosed />}
                                    </span>
                                </div>
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
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <div className="password-input-container">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Confirm new password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <span 
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? <RxEyeOpen /> : < GoEyeClosed />}
                                    </span>
                                </div>
                            </div>
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