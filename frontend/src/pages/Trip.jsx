import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Navigation/Sidebar";
import TripForm from "../components/Trip/TripForm";
import TripList from "../components/Trip/TripList";
import "../styles/Trip/Trip.css";

function Trip() {
    const [tripName, setTripName] = useState("");
    const [destination, setDestination] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [totalBudget, setTotalBudget] = useState(0);
    const [travelerType, setTravelerType] = useState("");
    const [savings, setSavings] = useState(0);
    const [error, setError] = useState("");
    const [trips, setTrips] = useState([]);
    const [editingTripId, setEditingTripId] = useState(null);
    const [validationError, setValidationError] = useState("");
    const navigate = useNavigate();
    
    const budgetLimits = {
        luxury: Infinity,
        medium: 200,
        budget: 100,
    };

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

    const handleStartDateChange = (e) => {
        const newStartDate = e.target.value;
        setStartDate(newStartDate);
        if (endDate && new Date(endDate) < new Date(newStartDate)) {
            setEndDate(newStartDate);
        }
    };

    const handleEndDateChange = (e) => {
        const newEndDate = e.target.value;
        if (new Date(newEndDate) < new Date(startDate)) {
            setValidationError("End date cannot be before start date.");
            return;
        }
        setValidationError("");
        setEndDate(newEndDate);
    };

    const handleTotalBudgetChange = (e) => {
        const newBudget = parseFloat(e.target.value);
        const start = new Date(startDate);
        const end = new Date(endDate);
        const tripDuration = startDate && endDate ? (end - start) / (1000 * 60 * 60 * 24) + 1 : 1;

        if (travelerType && travelerType !== "luxury") {
            const maxBudgetPerDay = budgetLimits[travelerType];
            const maxTotalBudget = maxBudgetPerDay * tripDuration;
            if (newBudget > maxTotalBudget) {
                setValidationError(`Total budget exceeds the limit for a ${travelerType} traveller. The maximum budget for your trip is £${maxTotalBudget}.`);
                return;
            }
        }
        setValidationError("");
        setTotalBudget(newBudget);
    };

    const handleDeleteTrip = async (tripId) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this trip?");
        if (!confirmDelete) return;

        try {
            await api.delete(`/api/trips/${tripId}/`);
            setTrips(trips.filter((trip) => trip.id !== tripId));
        } catch (error) {
            console.error("Error deleting trip:", error);
            setError("Failed to delete trip. Please try again.");
        }
    };

    const handleEditTrip = (trip) => {
        setEditingTripId(trip.id);
        setTripName(trip.trip_name);
        setDestination(trip.destination);
        setStartDate(trip.start_date);
        setEndDate(trip.end_date);
        setTotalBudget(trip.total_budget);
        setTravelerType(trip.traveler_type || "");
        setSavings(trip.savings);
        setValidationError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError("");
        setError("");
        
        if (!travelerType) {
            setValidationError("Please select a traveller type.");
            return;
        }

        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        const selectedEndDate = new Date(endDate);
    
        if (selectedEndDate < currentDate) {
            setValidationError("You cannot add a trip that has already ended.");
            return;
        }
    
        // Calculate trip duration
        const start = new Date(startDate);
        const end = new Date(endDate);
        const tripDuration = (end - start) / (1000 * 60 * 60 * 24) + 1;
    
        // Validate budget based on traveler type
        if (travelerType !== "luxury") {
            const maxBudgetPerDay = budgetLimits[travelerType];
            const maxTotalBudget = maxBudgetPerDay * tripDuration;
            
            if (totalBudget > maxTotalBudget) {
                setValidationError(`Total budget exceeds the limit for a ${travelerType} traveller. The maximum budget for your trip is £${maxTotalBudget.toFixed(2)}.`);
                return;
            }
        }
    
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
                const response = await api.put(`/api/trips/${editingTripId}/update/`, tripData);
                setTrips(trips.map((trip) => (trip.id === editingTripId ? response.data : trip)));
                setEditingTripId(null);
            } else {
                const response = await api.post("/api/trips/", tripData);
                setTrips([...trips, response.data]);
            }
            
            // Reset form
            setTripName("");
            setDestination("");
            setStartDate("");
            setEndDate("");
            setTotalBudget(0);
            setTravelerType("");
            setSavings(0);
        } catch (error) {
            console.error("Error details:", error.response ? error.response.data : error);
            setError("Failed to submit trip. Please try again.");
        }
    };

    return (
        <div className="trip-page-container">
            <Sidebar />
            <div className="main-content">
                <div className="trip-container">
                    <div className="trip-layout">
                        <TripForm
                            editingTripId={editingTripId}
                            tripName={tripName}
                            destination={destination}
                            travelerType={travelerType}
                            startDate={startDate}
                            endDate={endDate}
                            savings={savings}
                            totalBudget={totalBudget}
                            handleSubmit={handleSubmit}
                            handleStartDateChange={handleStartDateChange}
                            handleEndDateChange={handleEndDateChange}
                            handleTotalBudgetChange={handleTotalBudgetChange}
                            setTripName={setTripName}
                            setDestination={setDestination}
                            setTravelerType={setTravelerType}
                            setSavings={setSavings}
                            validationError={validationError}
                        />
                        <TripList
                            trips={trips}
                            handleEditTrip={handleEditTrip}
                            handleDeleteTrip={handleDeleteTrip}
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                </div>
            </div>
            <div className="footer">
                <p>&copy; SmartTravel. All rights reserved.</p>
            </div>
        </div>
    );
}

export default Trip;