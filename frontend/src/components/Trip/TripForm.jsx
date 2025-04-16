import React, { useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import '../../styles/Trip/TripForm.css';
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
  validationError,
  recommendedBudget,
  applyRecommendedBudget
}) {
  const [duration, setDuration] = useState(0);
  const [isBudgetValid, setIsBudgetValid] = useState(true);
  const [showBudgetSection, setShowBudgetSection] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (endDate) {
      setShowBudgetSection(true);
    } else {
      setShowBudgetSection(false);
    }
  }, [endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      setDuration(diffDays);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (recommendedBudget) {
      const minAllowed = recommendedBudget.total_budget * 0.5;
      const maxAllowed = recommendedBudget.total_budget * 1.5;
      setIsBudgetValid(totalBudget >= minAllowed && totalBudget <= maxAllowed);
    } else {
      setIsBudgetValid(true);
    }
  }, [totalBudget, recommendedBudget]);


  const handleFormSubmit = async (e) => {
    setLoading(true);
    await handleSubmit(e);
    setLoading(false);
  };

  return (
    <div className="trip-form">
      <h2>{editingTripId ? "Edit Your Trip" : "Add Trip"}</h2>
      <form onSubmit={handleFormSubmit}>
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
            type="city"
            value={destination}
            onChange={(value) => {
              setDestination(value);
            }}
            placeholder="Select a city"
          />
        </div>

        <div className="form-group">
          <label>Traveller Type</label>
          <select
            value={travelerType}
            onChange={(e) => setTravelerType(e.target.value)}
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

        {showBudgetSection && (
          <>
            <div className="form-group">
              <label>Savings</label>
              <input
                type="number"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
                min="0"
                step="0.01"
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
                className={!isBudgetValid && recommendedBudget ? 'invalid-budget' : ''}
              />
              {recommendedBudget && !isBudgetValid && (
                <p className="validation-warning">
                  Budget must be between {(recommendedBudget.total_budget * 0.5).toFixed(2)} and {(recommendedBudget.total_budget * 1.5).toFixed(2)} {recommendedBudget.currency}
                </p>
              )}
            </div>

            {destination && travelerType && duration > 0 && (
              <div className="budget-recommendation">
                <h4>Budget Recommendation</h4>
                {loading ? (
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

            {recommendedBudget && (
              <div className="budget-range-indicator">
                <p>Allowed budget range for {travelerType}:</p>
                <p>
                  {(recommendedBudget.total_budget * 0.5).toFixed(2)} - 
                  {(recommendedBudget.total_budget * 1.5).toFixed(2)} 
                  {recommendedBudget.currency}
                </p>
              </div>
            )}
          </>
        )}

        <button 
          type="submit" 
          className="submit-btn"
          disabled={(!isBudgetValid && showBudgetSection) || loading}
        >
          {editingTripId ? "Update Trip" : "Add Trip"}
        </button>

        {/* Show loading spinner while form is submitting */}
        {loading && <LoadingIndicator />}

        {validationError && <p className="validation-error">{validationError}</p>}
      </form>
    </div>
  );
}

export default TripForm;