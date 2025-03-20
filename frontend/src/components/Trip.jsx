import React, { useState, useEffect } from "react";
import api from "../api";
import "../styles/Trip.css";
import { FaPlane} from "react-icons/fa"; // Icons for categories

function Trip() {
    const [tripName, setTripName] = useState("");
    const [destination, setDestination] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [totalBudget, setTotalBudget] = useState(0);
    const [travelerType, setTravelerType] = useState("medium");
    const [savings, setSavings] = useState(0);
    const [error, setError] = useState("");
    const [trips, setTrips] = useState([]);

    // Fetch trips from the API when the component mounts
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await api.post("/api/trips/", {
                trip_name: tripName,
                destination,
                start_date: startDate,
                end_date: endDate,
                total_budget: totalBudget,
                traveler_type: travelerType,
                savings,
            });

            if (response.status === 201) {
                alert("Trip added successfully!");
                setTripName("");
                setDestination("");
                setStartDate("");
                setEndDate("");
                setTotalBudget(0);
                setTravelerType("medium");
                setSavings(0);
                setError("");

                setTrips([...trips, response.data]); // Append new trip to the list
            }
        } catch (error) {
            console.error("Error adding trip:", error);
            setError("Failed to add trip. Please try again.");
        }
    };

    return (
        <div className="trip-container">
            <h1>SmartTravel</h1>
            <h2>Set Your Trip Budget</h2>

            <div className="trip-layout">
                {/* Left Side: Add Trip Form */}
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
                            <label>Traveler Type</label>
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
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
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
                                onChange={(e) => setTotalBudget(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit">Add Trip</button>
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
                                        <FaPlane /> {/* Icon for the trip */}
                                    </div>
                                    <div className="trip-details">
                                        <h4>{trip.trip_name}</h4>
                                        <p>Destination: {trip.destination}</p>
                                        <p>Start Date: {trip.start_date}</p>
                                        <p>End Date: {trip.end_date}</p>
                                        <p>Total Budget: ${trip.total_budget}</p>
                                        <p>Traveler Type: {trip.traveler_type}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

           
        </div>
    );
}

export default Trip;

