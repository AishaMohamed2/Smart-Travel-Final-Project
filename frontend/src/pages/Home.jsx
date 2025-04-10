import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Home.css";
import { IoPersonOutline } from "react-icons/io5";
import { useCurrency } from '../utils/useCurrency';

function Home() {
    const [upcomingTrips, setUpcomingTrips] = useState([]);
    const [recentExpenses, setRecentExpenses] = useState([]);
    const [totalBudget, setTotalBudget] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const navigate = useNavigate();
    const { formatAmount, currencySymbol } = useCurrency();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch trips
                const tripsResponse = await api.get("/api/trips/");
                const today = new Date();
                
                // Filter out trips that have already ended
                const filteredTrips = tripsResponse.data.filter(trip => new Date(trip.end_date) >= today);
                
                // Sort trips by start date (earliest first)
                const sortedTrips = filteredTrips.sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
                setUpcomingTrips(sortedTrips.slice(0, 4));
                
                // Calculate total budget from upcoming trips
                const budgetSum = sortedTrips.reduce((sum, trip) => sum + parseFloat(trip.total_budget || 0), 0);
                setTotalBudget(budgetSum);

                // Fetch expenses
                const expensesResponse = await api.get("/api/expenses/");
                setRecentExpenses(expensesResponse.data.slice(0, 10)); // Show 10 most recent expenses
                
                // Calculate total spent from expenses
                const spentSum = expensesResponse.data.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
                setTotalSpent(spentSum);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
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

    const calculatePercentage = (value, total) => {
        return total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
    };

    return (
        <div className="home-container">
            {/* Main Content */}
            <div className="main-content">
                <div className="dashboard-header">
                    <h2>Dashboard</h2>
                    <button className="settings-circle-btn" onClick={() => navigate("/settings")}>
                        <IoPersonOutline />
                    </button>
                </div>

                {/* Budget Summary */}
                <div className="budget-summary">
                    <div className="budget-card">
                        <h3>Total Budget</h3>
                        <p>{formatAmount(totalBudget)}</p>
                        <div className="progress-bar">
                            <div 
                                className="progress-bar-fill" 
                                style={{ width: `${calculatePercentage(totalSpent, totalBudget)}%` }}
                            ></div>
                        </div>
                        <p className="budget-text">
                            {calculatePercentage(totalSpent, totalBudget)}% spent
                        </p>
                    </div>
                    <div className="budget-card">
                        <h3>Spent Amount</h3>
                        <p>{formatAmount(totalSpent)}</p>
                    </div>
                    <div className="budget-card">
                        <h3>Remaining</h3>
                        <p>{formatAmount(totalBudget - totalSpent)}</p>
                        <p className="budget-text">
                            {calculatePercentage(totalBudget - totalSpent, totalBudget)}% remaining
                        </p>
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
                                    <td>{formatAmount(expense.amount)}</td>
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
                                <p>Budget: {formatAmount(trip.total_budget)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;