import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, method }) {
    // State to manage form inputs
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false); // Loading state for API requests

    const navigate = useNavigate(); // Hook to programmatically navigate users

    // Determine form title based on method
    const name = method === "login" ? "Sign In" : "Sign Up";

    const handleSubmit = async (e) => {
        setLoading(true); // Show loading indicator
        e.preventDefault(); // Prevent default form submission behavior

        try {
            // Prepare data payload based on method (login/register)
            const data = method === "login"
                ? { email, password }
                : { email, password, first_name: firstName, last_name: lastName };

            const res = await api.post(route, data); // Send request to API
            
            if (method === "login") {
                // Store authentication tokens for logged-in users
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/"); // Redirect to home after login
            } else {
                navigate("/login"); // Redirect to login after successful registration
            }
        } catch (error) {
            alert(error); // Show error alert if request fails
        } finally {
            setLoading(false); // Hide loading indicator
        }
    };

    return (
        <div className="login-container">
            <div className="left-panel">
                <div className="form-container">
                    <h2>Welcome</h2>
                    <p>Please enter your details</p>

                    <form onSubmit={handleSubmit}>
                        {/* Show first name & last name fields only for registration */}
                        {method === "register" && (
                            <>
                                <input
                                    className="form-input"
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="First Name"
                                />
                                <input
                                    className="form-input"
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Last Name"
                                />
                            </>
                        )}
                        <input
                            className="form-input"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                        />
                        <input
                            className="form-input"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
                        />

                        <div className="form-links">
                            <a href="#">Forgot password?</a>
                        </div>

                        {loading && <LoadingIndicator />} {/* Show loading spinner if request is in progress */}

                        <button className="form-button" type="submit">
                            {name}
                        </button>

                        {/* Link to navigate between login and register */}
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
