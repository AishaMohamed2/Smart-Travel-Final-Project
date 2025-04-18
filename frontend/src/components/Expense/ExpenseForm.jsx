import React, { useState } from "react";
import "../../styles/Expense/ExpenseForm.css";
import LoadingIndicator from "../LoadingIndicator"; 

function ExpenseForm({
  editingExpenseId,
  amount,
  date,
  category,
  description,
  trips,
  selectedTrip,
  setAmount,
  setDate,
  setCategory,
  setDescription,
  setSelectedTrip,
  handleSubmit,
  error
}) {
  // Get the selected trip details
  const selectedTripDetails = trips.find(trip => trip.id === Number(selectedTrip));

  // Calculate maximum allowed date (trip end date or today, whichever is earlier)
  const today = new Date().toISOString().split('T')[0];
  const maxDate = selectedTripDetails 
    ? (selectedTripDetails.end_date > today ? today : selectedTripDetails.end_date)
    : today;

  // State to manage loading status
  const [loading, setLoading] = useState(false);

  // Handle form submission with loading state
  const handleFormSubmit = async (e) => {
    setLoading(true);
    await handleSubmit(e); 
    setLoading(false);
  };

  return (
    <div className="expense-form">
      <h2>{editingExpenseId ? "Edit Expense" : "Add Expense"}</h2>
      <form onSubmit={handleFormSubmit}>
        <div className="form-group">
          <label>Trip</label>
          <select 
            value={selectedTrip} 
            onChange={(e) => setSelectedTrip(e.target.value)} 
            required
          >
            <option value="">Select a trip</option>
            {trips.map((trip) => (
              <option key={trip.id} value={trip.id}>
                {trip.trip_name} ({trip.start_date} to {trip.end_date})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Amount</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            required 
          />
        </div>

        <div className="form-group">
          <label>Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            required 
            min={selectedTripDetails?.start_date || ""}
            max={maxDate}
            disabled={!selectedTrip}
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            required
          >
            <option value="food">Food & Dining</option>
            <option value="transport">Transport</option>
            <option value="accommodation">Accommodation</option>
            <option value="entertainment">Entertainment</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Show loading spinner while form is submitting */}
        {loading && <LoadingIndicator />}

        <button type="submit">
          {editingExpenseId ? "Update Expense" : "Add Expense"}
        </button>

        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default ExpenseForm;