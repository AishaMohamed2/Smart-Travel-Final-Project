import React from "react";
import "../../styles/Expense/ExpenseForm.css";

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

  return (
    <div className="expense-form">
      <h2>{editingExpenseId ? "Edit Expense" : "Add Expense"}</h2>
      <form onSubmit={handleSubmit}>
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
                {trip.trip_name} ({trip.start_date} to {trip.end_date}) - Budget: £{trip.total_budget}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Amount (£)</label>
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
            max={selectedTripDetails?.end_date || ""}
            disabled={!selectedTrip} // Disable if no trip is selected
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

        <button type="submit">
          {editingExpenseId ? "Update Expense" : "Add Expense"}
        </button>

        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
}

export default ExpenseForm;
