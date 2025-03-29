import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiPlus, FiHome, FiMap, FiDollarSign, FiPieChart, FiSettings, FiLogOut } from "react-icons/fi";
import api from "../api";
import "../styles/Home.css";

function Home() {
    const [upcomingTrips, setUpcomingTrips] = useState([]);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const response = await api.get("/api/trips/");
                const today = new Date();

                // Filter out trips that have already ended
                const filteredTrips = response.data.filter(trip => new Date(trip.end_date) >= today);

                // Sort trips by start date (earliest first)
                const sortedTrips = filteredTrips.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

                setUpcomingTrips(sortedTrips.slice(0, 2)); // Show only the two most relevant trips
            } catch (error) {
                console.error("Error fetching trips:", error);
            }
        };

        const fetchExpenses = async () => {
            try {
                const response = await api.get("/api/expenses/");
                setRecentExpenses(response.data.slice(0, 5)); // Show 5 most recent expenses
            } catch (error) {
                console.error("Error fetching expenses:", error);
            }
        };

        fetchTrips();
        fetchExpenses();
    }, []);

    const calculateTripStatus = (startDate, endDate) => {
        const today = new Date();
        const tripStartDate = new Date(startDate);
        const tripEndDate = new Date(endDate);

        if (today < tripStartDate) {
            const daysLeft = Math.ceil((tripStartDate - today) / (1000 * 60 * 60 * 24));
            return `${daysLeft} days left`;
        } else if (today >= tripStartDate && today <= tripEndDate) {
            const daysPassed = Math.ceil((today - tripStartDate) / (1000 * 60 * 60 * 24)) + 1;
            return `Day ${daysPassed} of trip`;
        } 
    };

    const handleLogout = () => {
        // Clear any stored authentication data (like token) or session
        localStorage.removeItem("authToken"); // Adjust this based on your app's storage
        sessionStorage.removeItem("authToken");
        navigate("/login"); // Redirect to login page after logout
    };

    return (
        <div className="home-container">
              <div className="sidebar">
                          <h2>SmartTravel</h2>
                          <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
                              <FiHome /> Dashboard
                          </NavLink>
                          <NavLink to="/trips" className={({ isActive }) => (isActive ? "active" : "")}>
                              <FiMap /> Add Trip
                          </NavLink>
                          <NavLink to="/expenses" className={({ isActive }) => (isActive ? "active" : "")}>
                              <FiDollarSign /> Add Expense
                          </NavLink>
                          <NavLink to="/analytics" className={({ isActive }) => (isActive ? "active" : "")}>
                              <FiPieChart /> Analytics
                          </NavLink>
                          <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
                              <FiSettings /> Settings
                          </NavLink>


                {/* Logout Button */}
                <button className="logout-btn" onClick={handleLogout}>
                    <FiLogOut /> Logout
                </button>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="dashboard-header">
                    <h2>Dashboard</h2>
                    <button className="add-expense-btn" onClick={() => navigate("/trips")}>
                        <FiPlus /> Add Trip
                    </button>
                </div>

                {/* Budget Summary */}
                <div className="budget-summary">
                    <div className="budget-card">
                        <h3>Total Budget</h3>
                        <p>£5,000</p>
                        <div className="progress-bar">
                            <div style={{ width: '75%' }}></div>
                        </div>
                    </div>
                    <div className="budget-card">
                        <h3>Spent Amount</h3>
                        <p>£3,750</p>
                    </div>
                    <div className="budget-card">
                        <h3>Remaining</h3>
                        <p>£1,250</p>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="recent-transactions">
                    <h3>Recent Transactions</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentExpenses.map((expense) => (
                                <tr key={expense.id}>
                                    <td>{expense.date}</td>
                                    <td><span className="category-badge">{expense.category}</span></td>
                                    <td>{expense.description}</td>
                                    <td>£{expense.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Upcoming Trips */}
                <div className="upcoming-trips">
                    <h3>Upcoming Trips</h3>
                    <div className="trip-cards">
                        {upcomingTrips.map((trip) => (
                            <div className="trip-card" key={trip.id}>
                                <div className="trip-header">
                                    <h4>{trip.trip_name}</h4>
                                    <span className="trip-badge">{calculateTripStatus(trip.start_date, trip.end_date)}</span>
                                </div>
                                <p>{trip.start_date} - {trip.end_date}</p>
                                <p>Budget: £{trip.total_budget}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="footer">
                <p>&copy; SmartTravel. All rights reserved.</p>
            </div>
        </div>
    );
}

export default Home;