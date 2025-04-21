import React, { useState, useEffect } from 'react';
import Dropdown from './Dropdown';
import '../../styles/Trip/TripForm.css';
import LoadingIndicator from '../LoadingIndicator';
import TripmateManager from './TripmateManager';
import Modal from '../Modal';
import api from '../../api';

function TripForm({
  editingTripId,
  tripName,
  destination,
  travelerType,
  startDate,
  endDate,
  totalBudget,
  handleSubmit,
  handleStartDateChange,
  handleEndDateChange,
  handleTotalBudgetChange,
  setTripName,
  setDestination,
  setTravelerType,
  validationError,
  recommendedBudget,
  applyRecommendedBudget,
}) {
  const [duration, setDuration] = useState(0);
  const [isBudgetValid, setIsBudgetValid] = useState(true);
  const [showBudgetSection, setShowBudgetSection] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTripmateModal, setShowTripmateModal] = useState(false);
  const [tripmate, setTripmate] = useState([]);
  const [initialTripmateLoaded, setInitialTripmateLoaded] = useState(false);

  // Load tripmates if editing an existing trip
  useEffect(() => {
    if (editingTripId) {
      const fetchTripmate = async () => {
        try {
          const response = await api.get(`/api/trips/${editingTripId}/tripmate/`);
          setTripmate(response.data.data?.tripmate || []);
          setInitialTripmateLoaded(true);
        } catch (error) {
          console.error("Failed to load tripmate:", error);
        }
      };

      if (!initialTripmateLoaded) {
        fetchTripmate();
      }
    } else {
      setTripmate([]);
      setInitialTripmateLoaded(false);
    }
  }, [editingTripId]);

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
    e.preventDefault();
    setLoading(true);
    try {
      await handleSubmit(e, tripmate);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTripmateClick = () => {
    setShowTripmateModal(true);
  };

  const handleSaveTripmate = (newTripmate) => {
    setTripmate(newTripmate);
    setShowTripmateModal(false);
  };

  const handleTripmateRemove = (userId) => {
    setTripmate(tripmate.filter(c => c.id !== userId));
  };

  return (
    <div className="trip-form">
      <h2>{editingTripId ? "Edit Your Trip" : "Add Trip"}</h2>
      {validationError && <div className="form-error">{validationError}</div>}

      <form onSubmit={handleFormSubmit}>
        <div className="form-group">
          <label>Trip Name</label>
          <input
            type="text"
            value={tripName}
            onChange={(e) => setTripName(e.target.value)}
            required
            maxLength={255}
          />
        </div>

        <div className="form-group">
          <label>City</label>
          <Dropdown
            type="city"
            value={destination}
            onChange={(value) => setDestination(value)}
            placeholder="Select a city"
            required
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
            min={startDate || new Date().toISOString().split('T')[0]}
          />
        </div>

        {showBudgetSection && (
          <>
            <div className="form-group">
              <label>Total Budget ({recommendedBudget?.currency || 'GBP'})</label>
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
                  Budget for this traveler type must be between 
                  {(recommendedBudget.total_budget * 0.5).toFixed(2)} and
                  {(recommendedBudget.total_budget * 1.5).toFixed(2)}
                  {recommendedBudget.currency}
                </p>
              )}
            </div>
            <div className="budget-adjustment">
                      <label>Adjust Budget using slider:</label>
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
                          {category.charAt(0).toUpperCase() + category.slice(1)}: 
                          {amount.toFixed(2)} {recommendedBudget.currency}/day
                        </li>
                      ))}
                    </ul>
                    <p>Total for {duration} days:
                      <strong> {recommendedBudget.total_budget.toFixed(2)}
                      {recommendedBudget.currency}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={applyRecommendedBudget}
                      className="apply-recommendation-btn"
                      disabled={loading}
                    >
                      {loading ? 'Applying...' : 'Use Recommended Budget'}
                    </button>

                  </>
                ) : (
                  <p>No recommendation available for this destination</p>
                )}
              </div>
            )}
          </>
        )}

        <div className="form-group">
          <button
            type="button"
            onClick={handleAddTripmateClick}
            className="add-tripmate-btn"
          >
            {tripmate.length > 0
              ? `Manage tripmates (${tripmate.length})`
              : 'Add tripmates'}
          </button>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={(!isBudgetValid && showBudgetSection) || loading}
        >
          {loading ? (
            <span>Processing...</span>
          ) : editingTripId ? (
            <span>Update Trip</span>
          ) : (
            <span>Add Trip</span>
          )}
        </button>
      </form>

      {showTripmateModal && (
        <Modal onClose={() => setShowTripmateModal(false)}>
          <div className="tripmate-modal">
            <h3>{editingTripId ? 'Manage' : 'Add'} Trip Tripmates</h3>
            <TripmateManager
              tripId={editingTripId}
              initialTripmate={tripmate}
              onSave={handleSaveTripmate}
              onRemove={handleTripmateRemove}
              isModal={true}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}

export default TripForm;