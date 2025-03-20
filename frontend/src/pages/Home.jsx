import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link for navigation
import api from "../api"; // Assuming you have an api instance for requests
import "../styles/Home.css";

function Home() {
    const [upcomingTrips, setUpcomingTrips] = useState([]);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const response = await api.get("/api/trips/");
                const currentDate = new Date();
                currentDate.setHours(0, 0, 0, 0); // Reset time to midnight
        
                const upcoming = response.data.filter((trip) => {
                    const startDate = new Date(trip.start_date);
                    startDate.setHours(0, 0, 0, 0); // Reset start date time to midnight
                    return startDate >= currentDate;
                });
        
                setUpcomingTrips(upcoming);
            } catch (error) {
                console.error("Error fetching trips:", error);
            }
        };
        
        fetchTrips();
    }, []); // Empty dependency array ensures this runs once when the component mounts

    return (
        <div>
            <h2>Welcome to Smart Travel</h2>

            {/* Navigation link to Trip page */}
            <div>
                <Link to="/trips">Go to Trip Page</Link>
            </div>

            {/* Display upcoming trips */}
            <div className="upcoming-trips">
                <h3>Upcoming Trips</h3>
                {upcomingTrips.length === 0 ? (
                    <p>No upcoming trips found.</p>
                ) : (
                    <ul>
                        {upcomingTrips.map((trip) => (
                            <li key={trip.id}>
                                <h4>{trip.trip_name}</h4>
                                <p>Destination: {trip.destination}</p>
                                <p>Start Date: {new Date(trip.start_date).toLocaleDateString()}</p>
                                <p>End Date: {new Date(trip.end_date).toLocaleDateString()}</p>
                                <p>Total Budget: {trip.total_budget}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default Home;
