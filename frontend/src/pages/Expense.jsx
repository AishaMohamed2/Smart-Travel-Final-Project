import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiMap, FiDollarSign, FiPieChart, FiSettings } from "react-icons/fi";
import api from "../api";
import "../styles/Expense.css";
import { FaTrash, FaEdit } from "react-icons/fa";

function Expense() {
    // State variables for form fields and errors
    const [amount, setAmount] = useState(0);
    const [date, setDate] = useState("");
    const [category, setCategory] = useState("food"); // Default category
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [expenses, setExpenses] = useState([]);
    const [editingExpenseId, setEditingExpenseId] = useState(null); // Track which expense is being edited
    const [trips, setTrips] = useState([]); // List of available trips
    const [selectedTrip, setSelectedTrip] = useState(""); // Selected trip ID as a string

    // Fetch trips from the API when the component mounts
    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const response = await api.get("/api/trips/");
                const today = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format

                // Filter trips to only include those that are currently ongoing
                const currentTrips = response.data.filter((trip) => {
                    const startDate = new Date(trip.start_date);
                    const endDate = new Date(trip.end_date);
                    const todayDate = new Date(today);

                    return startDate <= todayDate && endDate >= todayDate;
                });

                setTrips(currentTrips);
            } catch (error) {
                console.error("Error fetching trips:", error);
            }
        };

        fetchTrips();
    }, []);

    // Fetch expenses from the API when the component mounts
    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const response = await api.get("/api/expenses/");
                setExpenses(response.data);
            } catch (error) {
                console.error("Error fetching expenses:", error);
            }
        };

        fetchExpenses();
    }, []);

    // Handle form submission for adding or updating an expense
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate that a trip has been selected
        if (!selectedTrip) {
            setError("Please select a valid trip.");
            return;
        }

        const tripId = Number(selectedTrip); // Convert trip ID to a number
        const selectedTripDetails = trips.find((trip) => trip.id === tripId);

        // Validate that the selected trip exists
        if (!selectedTripDetails) {
            setError("Please select a valid trip.");
            return;
        }

        const today = new Date().toISOString().split("T")[0]; // Today's date in YYYY-MM-DD format
        const expenseDate = new Date(date);
        const tripStartDate = new Date(selectedTripDetails.start_date);
        const tripEndDate = new Date(selectedTripDetails.end_date);

        // Validate that the expense date is within the trip's start and end dates
        if (expenseDate < tripStartDate || expenseDate > tripEndDate) {
            setError("Expense date must be within the trip's start and end dates.");
            return;
        }

        // Prepare the expense data for submission
        const expenseData = {
            trip: tripId,
            amount,
            date,
            category,
            description,
        };

        try {
            if (editingExpenseId) {
                // Update an existing expense
                const response = await api.put(`/api/expenses/${editingExpenseId}/update/`, expenseData);
                setExpenses(expenses.map((expense) => (expense.id === editingExpenseId ? response.data : expense)));
                setEditingExpenseId(null); // Clear editing state
            } else {
                // Add a new expense
                const response = await api.post("/api/expenses/", expenseData);
                setExpenses([...expenses, response.data]);
            }

            // Reset the form fields
            setAmount(0);
            setDate("");
            setCategory("food");
            setDescription("");
            setError("");
        } catch (error) {
            console.error("Error details:", error.response ? error.response.data : error);
            setError("Failed to submit expense. Please try again.");
        }
    };

    // Handle editing an expense
    const handleEditExpense = (expense) => {
        setEditingExpenseId(expense.id);
        setSelectedTrip(expense.trip.toString()); // Convert trip ID to string for dropdown compatibility
        setAmount(expense.amount);
        setDate(expense.date);
        setCategory(expense.category);
        setDescription(expense.description);
    };

    // Handle deleting an expense
    const handleDeleteExpense = async (expenseId) => {
        try {
            await api.delete(`/api/expenses/${expenseId}/`);
            setExpenses((prevExpenses) => prevExpenses.filter((expense) => expense.id !== expenseId));
        } catch (error) {
            console.error("Error details:", error.response ? error.response.data : error);
            setError("Failed to delete expense. Please try again.");
        }
    };

    return (
        <div className="home-container">
            {/* Sidebar */}
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
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="expense-container">
                    <h2>{editingExpenseId ? "Edit Expense" : "Add Expense"}</h2>

                    <div className="expense-layout">
                        <div className="expense-form">
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label>Trip</label>
                                    <select value={selectedTrip} onChange={(e) => setSelectedTrip(e.target.value)} required>
                                        <option value="">Select a trip</option>
                                        {trips.map((trip) => (
                                            <option key={trip.id} value={trip.id}>
                                                {trip.trip_name} ({trip.start_date} to {trip.end_date})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Amount (£)</label>
                                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select value={category} onChange={(e) => setCategory(e.target.value)} required>
                                        <option value="food">Food & Dining</option>
                                        <option value="transport">Transport</option>
                                        <option value="accommodation">Accommodation</option>
                                        <option value="entertainment">Entertainment</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                                </div>
                                <button type="submit">{editingExpenseId ? "Update Expense" : "Add Expense"}</button>
                            </form>
                        </div>

                        <div className="expense-list">
                            <h3>Recent Expenses</h3>
                            {expenses.length === 0 ? (
                                <p>No expenses added yet.</p>
                            ) : (
                                <ul>
                                    {expenses.slice(0, 5).map((expense) => (
                                        <li key={expense.id}>
                                            <div className="expense-details">
                                                <h4>{expense.category}</h4>
                                                <p>Amount: £{expense.amount}</p>
                                                <p>Date: {expense.date}</p>
                                                <p>Description: {expense.description}</p>
                                            </div>
                                            <button onClick={() => handleEditExpense(expense)} className="edit-button">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDeleteExpense(expense.id)} className="delete-button">
                                                <FaTrash />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {error && <p className="error-message">{error}</p>}
                </div>
            </div>

            {/* Footer */}
            <div className="footer">
                <p>&copy; SmartTravel. All rights reserved.</p>
            </div>
        </div>
    );
}

export default Expense;