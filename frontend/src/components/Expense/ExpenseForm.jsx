import React, { useState } from "react";
import "../../styles/Expense/ExpenseForm.css";
import LoadingIndicator from "../LoadingIndicator"; 
import { useCurrency } from '../../utils/useCurrency'; 

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
  error,
  originalCurrency
}) {

  const { currency } = useCurrency();

  // Get the selected trip details ID
  const selectedTripDetails = trips.find(trip => trip.id === Number(selectedTrip));

  // Set the latest date the user can select for an expense
  // It can't be after the trip end date or after today
  const today = new Date().toISOString().split('T')[0];
  const maxDate = selectedTripDetails 
    ? (selectedTripDetails.end_date > today ? today : selectedTripDetails.end_date)
    : today;


  const [loading, setLoading] = useState(false);

  const handleFormSubmit = async (e) => {
    setLoading(true);
    await handleSubmit(e); 
    setLoading(false);
  };

  return (
    <div className="expense-form">
      <h2>{editingExpenseId ? "Edit Expense" : "Add Expense"}</h2>
      {editingExpenseId && originalCurrency && (
        <div className="currency-notice">
          <p>Expense will be updated to {currency.code} (originally {originalCurrency})</p>
        </div>
      )}
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
          <label>Amount ({currency.code})</label>
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