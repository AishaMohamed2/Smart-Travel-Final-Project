import React, { useState } from "react";
import { FaPlane, FaTrash, FaEdit } from "react-icons/fa";
import "../../styles/Trip/TripList.css";

function TripList({ trips, handleEditTrip, handleDeleteTrip }) {
  const [selectedTravelerType, setSelectedTravelerType] = useState("All");

  const confirmDelete = (tripId) => {
    if (window.confirm("Are you sure you want to delete this trip?")) {
      handleDeleteTrip(tripId);
    }
  };

  // Get unique traveler types from trips
  const travelerTypes = ["All", ...new Set(trips.map((trip) => trip.traveler_type))];

  // Filter trips based on selected traveler type
  const filteredTrips =
    selectedTravelerType === "All"
      ? trips
      : trips.filter((trip) => trip.traveler_type === selectedTravelerType);

  return (
    <div className="trip-list">
      <h3>Your Trips</h3>

      {/* Traveler Type Filter Dropdown */}
      <div className="traveler-type-filter">
        <label htmlFor="travelerType">Filter by Traveler Type:</label>
        <select
          id="travelerType"
          value={selectedTravelerType}
          onChange={(e) => setSelectedTravelerType(e.target.value)}
        >
          {travelerTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Trip List */}
      {filteredTrips.length === 0 ? (
        <p className="no-trips-message">No trips found for this traveler type.</p>
      ) : (
        <ul className="trip-list-items">
          {filteredTrips.map((trip) => (
            <li key={trip.id} className="trip-item">
              <div className="trip-icon-container">
                <FaPlane className="trip-icon" />
              </div>
              <div className="trip-details">
                <h4>{trip.trip_name}</h4>
                <p>Destination: {trip.destination}</p>
                <p>Start Date: {trip.start_date}</p>
                <p>End Date: {trip.end_date}</p>
                <p>Total Budget: £{trip.total_budget}</p>
                <p>Traveller Type: {trip.traveler_type}</p>
              </div>
              <div className="trip-actions">
                <button 
                  onClick={() => handleEditTrip(trip)} 
                  className="edit-button"
                >
                  <FaEdit />
                </button>
                <button 
                  onClick={() => confirmDelete(trip.id)} 
                  className="delete-button"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TripList;