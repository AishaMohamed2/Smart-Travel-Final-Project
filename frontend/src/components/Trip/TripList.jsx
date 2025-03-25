import React from "react";
import { FaPlane, FaTrash, FaEdit } from "react-icons/fa";
import "../../styles/Trip/TripList.css";

function TripList({ trips, handleEditTrip, handleDeleteTrip }) {
    return (
        <div className="trip-list">
            <h3>Your Trips</h3>
            {trips.length === 0 ? (
                <p className="no-trips-message">No trips added yet.</p>
            ) : (
                <ul className="trip-list-items">
                    {trips.map((trip) => (
                        <li key={trip.id} className="trip-item">
                            <div className="trip-icon">
                                <FaPlane />
                            </div>
                            <div className="trip-details">
                                <h4>{trip.trip_name}</h4>
                                <p>Destination: {trip.destination}</p>
                                <p>Start Date: {trip.start_date}</p>
                                <p>End Date: {trip.end_date}</p>
                                <p>Total Budget: £{trip.total_budget}</p>
                                <p>Traveller Type: {trip.traveler_type}</p>
                            </div>
                            <button 
                                onClick={() => handleEditTrip(trip)} 
                                className="edit-button"
                            >
                                <FaEdit />
                            </button>
                            <button 
                                onClick={() => handleDeleteTrip(trip.id)} 
                                className="delete-button"
                            >
                                <FaTrash />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default TripList;
