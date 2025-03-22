import React, { useState, useEffect } from "react";
import api from "../api";
import "../styles/Trip.css";
import { FaPlane, FaTrash, FaEdit } from "react-icons/fa"; 
import logo from "../assets/logo.png"; 

function Trip() {
    // State variables for trip details and errors
    const [tripName, setTripName] = useState("");
    const [destination, setDestination] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [totalBudget, setTotalBudget] = useState(0);
    const [travelerType, setTravelerType] = useState("medium");
    const [savings, setSavings] = useState(0);
    const [error, setError] = useState("");
    const [trips, setTrips] = useState([]);
    const [editingTripId, setEditingTripId] = useState(null); 

    // Budget limits per day for each traveler type
    const budgetLimits = {
        luxury: Infinity, 
        medium: 200,
        budget: 100,
    };

    // Fetch trips from the API 
    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const response = await api.get("/api/trips/");
                setTrips(response.data);
            } catch (error) {
                console.error("Error fetching trips:", error);
            }
        };

        fetchTrips();
    }, []);

    // Handle start date change
    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);

        // If the selected end date is before the new start date, reset it
        if (endDate && new Date(endDate) < new Date(newStartDate)) {
            setEndDate(newStartDate);
        }
    };

    // Handle end date change
    const handleEndDateChange = (e) => {
        const newEndDate = e.target.value;

        // Ensure end date is not before start date
        if (new Date(newEndDate) < new Date(startDate)) {
            alert("End date cannot be before start date.");
            return;
        }
        setEndDate(newEndDate);
    };

    // Handle total budget change with daily calculation
    const handleTotalBudgetChange = (e) => {
        const newBudget = parseFloat(e.target.value);
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Calculate trip duration in days
        const tripDuration = startDate && endDate ? (end - start) / (1000 * 60 * 60 * 24) + 1 : 1; // +1 to include the start day

        // If the trip duration is calculated, update the total budget
        if (tripDuration && travelerType !== "luxury") {
            const maxBudgetPerDay = budgetLimits[travelerType]; // Budget limit per day for the traveler type
            const maxTotalBudget = maxBudgetPerDay * tripDuration;

            if (newBudget > maxTotalBudget) {
                alert(`Total budget exceeds the limit for a ${travelerType} traveller. The maximum budget for your trip is £${maxTotalBudget}.`);
                return;
            }
        }

        setTotalBudget(newBudget); // Update the total budget if everything is valid
    };

    // Handle trip deletion
    const handleDeleteTrip = async (tripId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this trip?");
        if (!confirmDelete) return;

        try {
            await api.delete(`/api/trips/${tripId}/`);
            setTrips(trips.filter(trip => trip.id !== tripId)); // Remove from UI
        } catch (error) {
            console.error("Error deleting trip:", error);
            alert("Failed to delete trip. Please try again.");
        }
    };

    // Handle trip editing
    const handleEditTrip = (trip) => {
        setEditingTripId(trip.id); // Set the trip being edited
        setTripName(trip.trip_name);
        setDestination(trip.destination);
        setStartDate(trip.start_date);
        setEndDate(trip.end_date);
        setTotalBudget(trip.total_budget);
        setTravelerType(trip.traveler_type);
        setSavings(trip.savings);
    };

    // Handle form submission for both adding and updating trips
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const tripData = {
            trip_name: tripName,
            destination,
            start_date: startDate,
            end_date: endDate,
            total_budget: totalBudget,
            traveler_type: travelerType,
            savings,
        };
    
        try {
            if (editingTripId) {
                // Update existing trip
                const response = await api.put(`/api/trips/${editingTripId}/update/`, tripData); 
    
                if (response.status === 200) {
                    alert("Trip updated successfully!");
                    setTrips(trips.map((trip) => (trip.id === editingTripId ? response.data : trip))); // Update trip in the list
                    setEditingTripId(null); // Clear editing state
                }
            } else {
                // Create new trip
                const response = await api.post("/api/trips/", tripData);
    
                if (response.status === 201) {
                    alert("Trip added successfully!");
                    setTrips([...trips, response.data]); // Add new trip to the list
                }
            }
    
            // Reset form
            setTripName("");
            setDestination("");
            setStartDate("");
            setEndDate("");
            setTotalBudget(0);
            setTravelerType("medium");
            setSavings(0);
            setError("");
        } catch (error) {
            console.error("Error details:", error.response ? error.response.data : error); // Log detailed error response
            setError("Failed to submit trip. Please try again.");
        }
    };
    

    return (
        <div className="trip-container">
           
            <img src={logo} alt="Smart Travel Logo" className="logo" />

            <h2>{editingTripId ? "Edit Your Trip" : "Set Your Trip Budget"}</h2>

            <div className="trip-layout">
              
                <div className="trip-form">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Trip Name</label>
                            <input
                                type="text"
                                value={tripName}
                                onChange={(e) => setTripName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Destination</label>
                            <input
                                type="text"
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Traveller Type</label>
                            <select
                                value={travelerType}
                                onChange={(e) => setTravelerType(e.target.value)}
                            >
                                <option value="luxury">Luxury</option>
                                <option value="medium">Medium</option>
                                <option value="budget">Budget</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={handleStartDateChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={handleEndDateChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Savings</label>
                            <input
                                type="number"
                                value={savings}
                                onChange={(e) => setSavings(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Total Budget</label>
                            <input
                                type="number"
                                value={totalBudget}
                                onChange={handleTotalBudgetChange}
                                required
                            />
                        </div>

                        <button type="submit">{editingTripId ? "Update Trip" : "Add Trip"}</button>
                    </form>
                </div>

                {/* Right Side: List of Trips */}
                <div className="trip-list">
                    <h3>Your Trips</h3>
                    {trips.length === 0 ? (
                        <p>No trips added yet.</p>
                    ) : (
                        <ul>
                            {trips.map((trip) => (
                                <li key={trip.id}>
                                    <div className="trip-icon">
                                        <FaPlane /> {/* Trip icon */}
                                    </div>
                                    <div className="trip-details">
                                        <h4>{trip.trip_name}</h4>
                                        <p>Destination: {trip.destination}</p>
                                        <p>Start Date: {trip.start_date}</p>
                                        <p>End Date: {trip.end_date}</p>
                                        <p>Total Budget: £{trip.total_budget}</p>
                                        <p>Traveller Type: {trip.traveler_type}</p>
                                    </div>
                                    <button onClick={() => handleEditTrip(trip)} className="edit-button">
                                        <FaEdit /> {/* Edit icon */}
                                    </button>
                                    <button
                                        onClick={() => handleDeleteTrip(trip.id)}
                                        className="delete-button"
                                    >
                                        <FaTrash /> {/* Delete icon */}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {error && <p className="error-message">{error}</p>}
        </div>
    );
}

export default Trip;