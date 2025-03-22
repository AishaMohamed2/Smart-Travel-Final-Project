import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";
import logo from "../assets/logo.png"; 

function Form({ route, method }) {
    // State variables for form fields and errors
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [apiError, setApiError] = useState("");

    const navigate = useNavigate(); 
    const name = method === "login" ? "Sign In" : "Sign Up";

    // Validate form fields
    const validateForm = () => {
        let newErrors = {};
        
        if (!email.trim()) newErrors.email = "Email is required.";
        if (!password.trim()) newErrors.password = "Password is required.";

        if (method === "register") {
            if (!firstName.trim()) newErrors.firstName = "First name is required.";
            if (!lastName.trim()) newErrors.lastName = "Last name is required.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setApiError("");

        // Validate the form before submitting
        if (!validateForm()) {
            setLoading(false);
            return;
        }

        try {
            // Prepare data for the API request
            const data = method === "login"
                ? { email, password }
                : { email, password, first_name: firstName, last_name: lastName };

            const res = await api.post(route, data);
            
            if (method === "login") {
                // Save tokens to local storage and navigate to the home page
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/");
            } else {
                // Navigate to the login page after registration
                navigate("/login");
            }
        } catch (error) {
            // Handle API errors
            if (error.response && error.response.data) {
                setApiError(error.response.data.detail || "An error occurred. Please try again.");
            } else {
                setApiError("Something went wrong. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="left-panel">
                {/* Logo */}
                <img src={logo} alt="Smart Travel Logo" className="logo" />

                <div className="form-container">
                    <h2>Welcome</h2>
                    <p>Please enter your details</p>

                    {apiError && <p className="api-error">{apiError}</p>}

                    <form onSubmit={handleSubmit}>
                        {method === "register" && (
                            <>
                                <div className="input-group">
                                    <input
                                        className={`form-input ${errors.firstName ? "error" : ""}`}
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="First Name"
                                    />
                                    {errors.firstName && <p className="error-text">{errors.firstName}</p>}
                                </div>

                                <div className="input-group">
                                    <input
                                        className={`form-input ${errors.lastName ? "error" : ""}`}
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Last Name"
                                    />
                                    {errors.lastName && <p className="error-text">{errors.lastName}</p>}
                                </div>
                            </>
                        )}

                        <div className="input-group">
                            <input
                                className={`form-input ${errors.email ? "error" : ""}`}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                            />
                            {errors.email && <p className="error-text">{errors.email}</p>}
                        </div>

                        <div className="input-group">
                            <input
                                className={`form-input ${errors.password ? "error" : ""}`}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                            />
                            {errors.password && <p className="error-text">{errors.password}</p>}
                        </div>

                        <div className="form-links">
                            <a href="#">Forgot password?</a>
                        </div>

                        {loading && <LoadingIndicator />}

                        <button className="form-button" type="submit">
                            {name}
                        </button>

                        <p className="signup-link">
                            Don't have an account?{" "}
                            <span
                                className="signup-button"
                                onClick={() => navigate("/register")}
                                style={{ color: "#007bff", cursor: "pointer", textDecoration: "underline" }}
                            >
                                Sign up
                            </span>
                        </p>
                    </form>
                </div>
            </div>

            <div className="right-panel">
                <div>
                    <h2>Track Your Expenses</h2>
                    <p>Stay on top of your finances while traveling with Smart Travel.</p>
                </div>
            </div>
        </div>
    );
}

export default Form;