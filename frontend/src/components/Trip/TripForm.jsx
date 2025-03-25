import React from "react";
import "../../styles/Trip/TripForm.css";

function TripForm({
    editingTripId,
    tripName,
    destination,
    travelerType,
    startDate,
    endDate,
    savings,
    totalBudget,
    handleSubmit,
    handleStartDateChange,
    handleEndDateChange,
    handleTotalBudgetChange,
    setTripName,
    setDestination,
    setTravelerType,
    setSavings,
    validationError
}) {
    return (
        <div className="trip-form">
            <h2>{editingTripId ? "Edit Your Trip" : "Set Your Trip Budget"}</h2>
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
                {validationError && <p className="validation-error">{validationError}</p>}
            </form>
        </div>
    );
}

export default TripForm;