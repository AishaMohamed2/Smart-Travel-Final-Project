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
    const [error, setError] = useState("");
    const [trips, setTrips] = useState([]);
    const [editingTripId, setEditingTripId] = useState(null);
    const [validationError, setValidationError] = useState("");
    const [recommendedBudget, setRecommendedBudget] = useState(null);
    const [loadingRecommendation, setLoadingRecommendation] = useState(false);
    const [tripmate, setTripmate] = useState([]);
    const [initialTripmateLoaded, setInitialTripmateLoaded] = useState(false);
    const [loadingTripmate, setLoadingTripmate] = useState(false);
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

    // Function to calculate trip duration based on start and end dates
    const calculateDuration = (start, end) => {
        if (!start || !end) return 0;
        const startDate = new Date(start);
        const endDate = new Date(end);
        return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    };

    // Fetch tripmates for the currently edited trip
    useEffect(() => {
        const controller = new AbortController();
        
        const fetchTripmate = async () => {
            if (editingTripId && !initialTripmateLoaded) {
                setLoadingTripmate(true);
                try {
                    const response = await api.get(`/api/trips/${editingTripId}/tripmate/`, {
                        signal: controller.signal
                    });
                    setTripmate(response.data.data?.tripmate || []);
                    setInitialTripmateLoaded(true);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error("Failed to load tripmate:", error);
                    }
                } finally {
                    setLoadingTripmate(false);
                }
            }
        };

        fetchTripmate();
        return () => controller.abort();
    }, [editingTripId, initialTripmateLoaded]);
 
    // Fetch budget recommendation whenever necessary these fields change (destination, travelerType, and date)
    useEffect(() => {
        const duration = calculateDuration(startDate, endDate);
        if (endDate && destination && travelerType && duration > 0) {
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
        const today = new Date().toISOString().split('T')[0];
        
        if (new Date(newEndDate) < new Date(startDate)) {
            setValidationError("End date cannot be before start date.");
            return;
        }
        
        if (new Date(newEndDate) < new Date(today)) {
            setValidationError("End date cannot be in the past.");
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
        try {
            await api.delete(`/api/trips/${tripId}/`);
            setTrips(trips.filter((trip) => trip.id !== tripId));
        } catch (error) {
            if (error.response && error.response.status === 403) {
                setError("Only the trip owner can delete this trip");
            } else {
                console.error("Error deleting trip:", error);
                setError("Failed to delete trip. Please try again.");
            }
        }
    };

    // Pre-fill the form with the trip data when editing a trip
    const handleEditTrip = (trip) => {
        setEditingTripId(trip.id);
        setTripName(trip.trip_name);
        setDestination(trip.destination);
        setStartDate(trip.start_date);
        setEndDate(trip.end_date);
        setTotalBudget(trip.total_budget);
        setTravelerType(trip.traveler_type || "");
        setValidationError("");
        setTripmate([]);
        setInitialTripmateLoaded(false);
    };

    const resetForm = () => {
        setTripName("");
        setDestination("");
        setStartDate("");
        setEndDate("");
        setTotalBudget(0);
        setTravelerType("");
        setRecommendedBudget(null);
        setEditingTripId(null);
        setValidationError("");
        setError("");
        setLoadingRecommendation(false);
        setTripmate([]);
        setInitialTripmateLoaded(false);
    };

    const handleSubmit = async (e, tripmate = []) => {
        e.preventDefault();
        setValidationError("");
        setError("");
        
        if (!travelerType) {
            setValidationError("Please select a traveller type.");
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (new Date(endDate) < today) {
            setValidationError("You cannot add a trip that has already ended.");
            return;
        }

        const duration = calculateDuration(startDate, endDate);

        // Check if budget is within recommended range
        if (endDate && recommendedBudget) {
            const maxAllowed = recommendedBudget.total_budget * 1.5;
            const minAllowed = recommendedBudget.total_budget * 0.5;
            
            if (totalBudget < minAllowed || totalBudget > maxAllowed) {
                setValidationError(
                    `Budget must be between ${minAllowed.toFixed(2)} and ${maxAllowed.toFixed(2)} ${recommendedBudget.currency} for ${travelerType} travel`
                );
                return;
            }
        } else if (endDate && destination && duration > 0) {
            try {
                setLoadingRecommendation(true);
                const response = await api.post('/api/budget-recommendation/', {
                    city: destination,
                    traveler_type: travelerType,
                    duration: duration
                });
                
                const recBudget = response.data.total_budget;
                const maxAllowed = recBudget * 1.5;
                const minAllowed = recBudget * 0.5;
                
                if (totalBudget < minAllowed || totalBudget > maxAllowed) {
                    setValidationError(
                        `Budget must be between ${minAllowed.toFixed(2)} and ${maxAllowed.toFixed(2)} ${response.data.currency} for ${travelerType} travel`
                    );
                    return;
                }
            } catch (error) {
                console.error("Budget validation failed:", error);
                setValidationError("Couldn't verify budget recommendation. Please ensure your budget is reasonable.");
            } finally {
                setLoadingRecommendation(false);
            }
        }
        
        const tripData = {
            trip_name: tripName,
            destination,
            start_date: startDate,
            end_date: endDate,
            total_budget: totalBudget,
            traveler_type: travelerType,
        };
          
        try {
            let response;
            if (editingTripId) {
                try {
                    response = await api.put(`/api/trips/${editingTripId}/update/`, tripData);
                    await updateTripmate(editingTripId, tripmate);
                    setTrips(trips.map((trip) => (trip.id === editingTripId ? response.data : trip)));
                    resetForm();
                } catch (error) {
                    if (error.response && error.response.status === 403) {
                        setError("Only the trip owner can update this trip");
                    } else {
                        console.error("Error:", error);
                        setError("Only the trip owner can update this trip");
                    }
                    return;
                }
            } else {
                response = await api.post("/api/trips/", tripData);
                await updateTripmate(response.data.id, tripmate);
                setTrips([...trips, response.data]);
                resetForm();
            }
        } catch (error) {
            console.error("Error:", error);
            setError("Failed to submit trip. Please try again.");
        }
    };
      
    const updateTripmate = async (tripId, newTripmate) => {
        try {
            const currentResponse = await api.get(`/api/trips/${tripId}/tripmate/`);
            const currentTripmate = currentResponse.data.data?.tripmate || [];
            
            const currentEmails = currentTripmate.map(c => c.email);
            const newEmails = newTripmate.map(c => c.email);
            
      
            for (const tripmate of currentTripmate) {
                if (!newEmails.includes(tripmate.email)) {
                    await api.delete(`/api/trips/${tripId}/tripmate/`, {
                        data: { email: tripmate.email }
                    });
                }
            }
            
           
            for (const tripmate of newTripmate) {
                if (!currentEmails.includes(tripmate.email)) {
                    try {
                        await api.post(`/api/trips/${tripId}/tripmate/`, {
                            email: tripmate.email
                        });
                    } catch (err) {
                        console.error("Failed to add tripmate:", err);
                    }
                }
            }
        } catch (err) {
            console.error("Error updating tripmate:", err);
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
                            totalBudget={totalBudget}
                            handleSubmit={handleSubmit}
                            handleStartDateChange={handleStartDateChange}
                            handleEndDateChange={handleEndDateChange}
                            handleTotalBudgetChange={handleTotalBudgetChange}
                            setTripName={setTripName}
                            setDestination={setDestination}
                            setTravelerType={setTravelerType}
                            validationError={validationError}
                            recommendedBudget={recommendedBudget}
                            loadingRecommendation={loadingRecommendation}
                            applyRecommendedBudget={applyRecommendedBudget}
                            tripmate={tripmate}
                            loadingTripmate={loadingTripmate}
                            setTripmate={setTripmate}
                        />
                        <TripList
                            trips={trips}
                            handleEditTrip={handleEditTrip}
                            handleDeleteTrip={handleDeleteTrip}
                            formatAmount={formatAmount}
                        />
                    </div>
                    {error && (
                        <div className="error-message">
                            {error}
                            <button 
                                onClick={() => setError("")} 
                                className="close-error-btn"
                            >
                                ×
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Trip;