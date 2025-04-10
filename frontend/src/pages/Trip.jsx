import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import TripForm from "../components/Trip/TripForm";
import TripList from "../components/Trip/TripList";
import "../styles/Trip/Trip.css";
import { useCurrency } from '../utils/useCurrency';

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
    const [recommendedBudget, setRecommendedBudget] = useState(null);
    const [loadingRecommendation, setLoadingRecommendation] = useState(false);
    const navigate = useNavigate();
    const { formatAmount } = useCurrency();

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

    const calculateDuration = (start, end) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    };

    useEffect(() => {
        const duration = calculateDuration(startDate, endDate);
        if (destination && travelerType && duration > 0) {
            fetchBudgetRecommendation(destination, travelerType, duration);
        } else {
            setRecommendedBudget(null);
        }
    }, [destination, travelerType, startDate, endDate]);

    const fetchBudgetRecommendation = async (city, type, days) => {
        setLoadingRecommendation(true);
        try {
            const response = await api.post('/api/budget-recommendation/', {
                city,
                traveler_type: type,
                duration: days
            });
            setRecommendedBudget(response.data);
        } catch (error) {
            console.error("Budget recommendation failed:", error);
            setRecommendedBudget(null);
        } finally {
            setLoadingRecommendation(false);
        }
    };

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
        setValidationError("");
        setTotalBudget(newBudget);
    };

    const applyRecommendedBudget = () => {
        if (recommendedBudget) {
            setTotalBudget(recommendedBudget.total_budget);
        }
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
        
        const tripData = {
            trip_name: tripName,
            destination,
            start_date: startDate,
            end_date: endDate,
            total_budget: totalBudget,
            traveler_type: travelerType,
            savings: savings || 0,
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
            setRecommendedBudget(null);
        } catch (error) {
            console.error("Error details:", error.response ? error.response.data : error);
            setError("Failed to submit trip. Please try again.");
        }
    };

    return (
        <div className="trip-page-container">
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
                            recommendedBudget={recommendedBudget}
                            loadingRecommendation={loadingRecommendation}
                            applyRecommendedBudget={applyRecommendedBudget}
                        />
                        <TripList
                            trips={trips}
                            handleEditTrip={handleEditTrip}
                            handleDeleteTrip={handleDeleteTrip}
                            formatAmount={formatAmount}
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                </div>
            </div>
        </div>
    );
}

export default Trip;