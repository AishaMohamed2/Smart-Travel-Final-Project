import React, { useState, useEffect } from "react";
import api from "../api";
import ExpenseForm from "../components/Expense/ExpenseForm";
import ExpenseList from "../components/Expense/ExpenseList";
import "../styles/Expense/Expense.css";
import { useCurrency } from '../utils/useCurrency';


function Expense() {

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState("");
  const [currentTrip, setCurrentTrip] = useState(null);
  const [totalSpent, setTotalSpent] = useState(0);
  const { formatAmount, currency } = useCurrency();


  // Fetching trips and expenses data from API 
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripsResponse, expensesResponse] = await Promise.all([
          api.get("/api/trips/"),
          api.get("/api/expenses/")
        ]);

        // Filter trips to show only those that are ongoing
        const today = new Date().toISOString().split("T")[0];
        const currentTrips = tripsResponse.data.filter((trip) => {
          const startDate = new Date(trip.start_date);
          const endDate = new Date(trip.end_date);
          const todayDate = new Date(today);
          return startDate <= todayDate && endDate >= todayDate;
        });

        setTrips(currentTrips);
        setExpenses(expensesResponse.data);

        // Automatically select the only ongoing trip if there is exactly one
        if (currentTrips.length === 1) {
          setSelectedTrip(currentTrips[0].id.toString());
          setCurrentTrip(currentTrips[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  // Calculate the total amount spent for the selected trip
  useEffect(() => {
    if (selectedTrip && expenses.length > 0) {
      const tripId = Number(selectedTrip);
      const tripExpenses = expenses.filter(expense => expense.trip === tripId);
      const spent = tripExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      setTotalSpent(spent);
    }
  }, [selectedTrip, expenses]);

  // Calculate remaining budget for the selected trip
  const remainingBudget = currentTrip ? parseFloat(currentTrip.total_budget || 0) - totalSpent : 0;


  // Handle form submission to add or update an expense
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedTrip) {
      setError("Please select a valid trip.");
      return;
    }

    const tripId = Number(selectedTrip);
    const selectedTripDetails = trips.find((trip) => trip.id === tripId);

    if (!selectedTripDetails) {
      setError("Please select a valid trip.");
      return;
    }

    if (!amount || isNaN(amount)) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!date) {
      setError("Please select a date.");
      return;
    }

    try {
      const expenseData = {
        trip: tripId,
        amount: parseFloat(amount),
        date,
        category,
        description,
        original_currency: currency.code
      };

      let updatedExpenses = [];
      if (editingExpenseId) {
        const response = await api.put(`/api/expenses/${editingExpenseId}/update/`, expenseData);
        updatedExpenses = expenses.map((expense) => 
          expense.id === editingExpenseId ? response.data : expense
        );
        setEditingExpenseId(null);
      } else {
        const response = await api.post("/api/expenses/", expenseData);
        updatedExpenses = [...expenses, response.data];
      }

      setExpenses(updatedExpenses);
      resetForm();
    } catch (err) {
      console.error("Error submitting expense:", err);
      setError(err.response?.data?.message || "Failed to submit expense. Please try again.");
    }
  };

  // Reset the form after submission or editing
  const resetForm = () => {
    setAmount("");
    setDate("");
    setCategory("food");
    setDescription("");
    setError("");
  };

  // Prepare the form for editing an existing expense
  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setSelectedTrip(expense.trip.toString());
    setAmount(expense.amount.toString());
    setDate(expense.date);
    setCategory(expense.category);
    setDescription(expense.description);
  };

  // Handle deleting an expense
  const handleDeleteExpense = async (expenseId) => {
    try {
      await api.delete(`/api/expenses/${expenseId}/`);
      setExpenses(expenses.filter((expense) => expense.id !== expenseId));
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError("Failed to delete expense. Please try again.");
    }
  };

  // Handle trip selection change
  const handleTripChange = (tripId) => {
    setSelectedTrip(tripId);
    const selected = trips.find(trip => trip.id === Number(tripId));
    setCurrentTrip(selected);
  };

  return (
    <div className="expense-page-container">
      <div className="main-content">
        <div className="expense-container">
          {currentTrip && (
            <div className="budget-bar-container">
              <h3>{currentTrip.trip_name} Budget</h3>
              <div className="budget-info">
                 <span>Total: {formatAmount(currentTrip.total_budget)}</span>
                 <span>Spent: {formatAmount(totalSpent)}</span>
                 <span>Remaining: {formatAmount(remainingBudget)}</span>
              </div>
              <div className="budget-bar">
                <div 
                  className="budget-progress" 
                  style={{
                    width: `${Math.min(100, (totalSpent / currentTrip.total_budget) * 100)}%`,
                    backgroundColor: remainingBudget < 0 ? '#ff6b6b' : 
                                    (remainingBudget < (currentTrip.total_budget * 0.2) ? '#ffd166' : '#06d6a0')
                  }}
                />
              </div>
              {remainingBudget < 0 && (
                <div className="budget-message error">
                  You've exceeded your budget by {formatAmount(Math.abs(remainingBudget))}!
                </div>
              )}
            </div>
            
          )}

          <div className="expense-layout">
            <ExpenseForm
              editingExpenseId={editingExpenseId}
              amount={amount}
              date={date}
              category={category}
              description={description}
              trips={trips}
              selectedTrip={selectedTrip}
              setAmount={setAmount}
              setDate={setDate}
              setCategory={setCategory}
              setDescription={setDescription}
              setSelectedTrip={handleTripChange}
              handleSubmit={handleSubmit}
              error={error}
              originalCurrency={
                editingExpenseId 
                  ? expenses.find(e => e.id === editingExpenseId)?.original_currency 
                  : null
              }
            />
            <ExpenseList
              expenses={expenses.filter(expense => 
                selectedTrip ? expense.trip === Number(selectedTrip) : false
              )}
              handleEditExpense={handleEditExpense}
              handleDeleteExpense={handleDeleteExpense}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Expense;
