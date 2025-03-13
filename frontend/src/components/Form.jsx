import { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Form.css";
import LoadingIndicator from "./LoadingIndicator";

function Form({ route, method }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate(); 

    const name = method === "login" ? "Sign In" : "Sign Up";

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        try {
            const res = await api.post(route, { email, password });
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/");
            } else {
                navigate("/login");
            }
        } catch (error) {
            alert(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="left-panel">
                <div className="form-container">
                    <h2>Welcome</h2>
                    <p>Please enter your details</p>

                    <form onSubmit={handleSubmit}>
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

                        {loading && <LoadingIndicator />}

                        <button className="form-button" type="submit">
                            {name}
                        </button>

                      
                        {/* Sign-up link navigate automatically */}
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
