import React, { useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import '../../styles/Trip/TripForm.css';
import api from '../../api';
import LoadingIndicator from '../LoadingIndicator'; 

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
  const [recommendedBudget, setRecommendedBudget] = useState(null);
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);
  const [duration, setDuration] = useState(0);

  // Calculate trip duration when dates change
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      setDuration(diffDays);
    }
  }, [startDate, endDate]);

  // Fetch budget recommendation when city or traveler type changes
  useEffect(() => {
    const fetchBudgetRecommendation = async () => {
      if (!destination || !travelerType || !duration) return;

      setLoadingRecommendation(true);
      try {
        const response = await api.post('/api/budget-recommendation/', {
          city: destination,
          traveler_type: travelerType,
          duration: duration
        });
        
        if (response.data) {
          setRecommendedBudget(response.data);
        } else {
          setRecommendedBudget(null);
        }
      } catch (error) {
        console.error("Budget recommendation failed:", error);
        setRecommendedBudget(null);
      } finally {
        setLoadingRecommendation(false);
      }
    };

    fetchBudgetRecommendation();
  }, [destination, travelerType, duration]);

  const applyRecommendedBudget = () => {
    if (recommendedBudget) {
      handleTotalBudgetChange({
        target: { value: recommendedBudget.total_budget.toFixed(2) }
      });
    }
  };

  return (
    <div className="trip-form">
      <h2>{editingTripId ? "Edit Your Trip" : "Add Trip"}</h2>
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
          <label>City</label>
          <Dropdown
            value={destination}
            onChange={(value) => {
              setDestination(value);
              setRecommendedBudget(null); // Reset recommendation when city changes
            }}
          />
        </div>

        <div className="form-group">
          <label>Traveller Type</label>
          <select
            value={travelerType}
            onChange={(e) => {
              setTravelerType(e.target.value);
              setRecommendedBudget(null); // Reset recommendation when type changes
            }}
            required
          >
            <option value="" disabled>Select traveller type</option>
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
            min={startDate}
          />
        </div>

        <div className="form-group">
          <label>Savings</label>
          <input
            type="number"
            value={savings}
            onChange={(e) => setSavings(e.target.value)}
            min="0"
          />
        </div>

        <div className="form-group">
          <label>Total Budget</label>
          <input
            type="number"
            value={totalBudget}
            onChange={handleTotalBudgetChange}
            required
            min="0"
            step="0.01"

          />
        </div>

        {/* Budget Recommendation Section */}
        {destination && travelerType && duration > 0 && (
          <div className="budget-recommendation">
            <h4>Budget Recommendation</h4>
            {loadingRecommendation ? (
              <LoadingIndicator /> 
            ) : recommendedBudget ? (
              <>
                <p>Based on {travelerType} travel in {destination}:</p>
                <ul>
                  {Object.entries(recommendedBudget.daily_breakdown).map(([category, amount]) => (
                    <li key={category}>
                      {category}: {amount.toFixed(2)} {recommendedBudget.currency}/day
                    </li>
                  ))}
                </ul>
                <p>Total for {duration} days: 
                  <strong> {recommendedBudget.total_budget.toFixed(2)} {recommendedBudget.currency}</strong>
                </p>
                <button 
                  type="button" 
                  onClick={applyRecommendedBudget}
                  className="apply-recommendation-btn"
                >
                  Use Recommended Budget
                </button>
                <div className="budget-adjustment">
                  <label>Adjust Budget (%):</label>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    defaultValue="100"
                    onChange={(e) => {
                      const adjustment = parseFloat(e.target.value) / 100;
                      const adjustedBudget = recommendedBudget.total_budget * adjustment;
                      handleTotalBudgetChange({
                        target: { value: adjustedBudget.toFixed(2) }
                      });
                    }}
                  />
                </div>
              </>
            ) : (
              <p>No recommendation available for this destination</p>
            )}
          </div>
        )}

        <button type="submit" className="submit-btn">
          {editingTripId ? "Update Trip" : "Add Trip"}
        </button>
        {validationError && <p className="validation-error">{validationError}</p>}
      </form>
    </div>
  );
}

export default TripForm;
