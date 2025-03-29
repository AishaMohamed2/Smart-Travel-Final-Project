import React, { useState, useEffect } from "react";
import api from "../api";
import Sidebar from "../components/Navigation/Sidebar";
import ExpenseForm from "../components/Expense/ExpenseForm";
import ExpenseList from "../components/Expense/ExpenseList";
import "../styles/Expense/Expense.css";

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [tripsResponse, expensesResponse] = await Promise.all([
          api.get("/api/trips/"),
          api.get("/api/expenses/")
        ]);

        const today = new Date().toISOString().split("T")[0];
        const currentTrips = tripsResponse.data.filter((trip) => {
          const startDate = new Date(trip.start_date);
          const endDate = new Date(trip.end_date);
          const todayDate = new Date(today);
          return startDate <= todayDate && endDate >= todayDate;
        });

        setTrips(currentTrips);
        setExpenses(expensesResponse.data);

        if (currentTrips.length === 1) {
          setSelectedTrip(currentTrips[0].id.toString());
          setCurrentTrip(currentTrips[0]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please refresh the page.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedTrip && expenses.length > 0) {
      const tripId = Number(selectedTrip);
      const tripExpenses = expenses.filter(expense => expense.trip === tripId);
      const spent = tripExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount || 0), 0);
      setTotalSpent(spent);
    }
  }, [selectedTrip, expenses]);

  const remainingBudget = currentTrip ? parseFloat(currentTrip.total_budget || 0) - totalSpent : 0;

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

    if (!amount || isNaN(amount)) {  // Added missing closing parenthesis
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

  const resetForm = () => {
    setAmount("");
    setDate("");
    setCategory("food");
    setDescription("");
    setError("");
  };

  const handleEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setSelectedTrip(expense.trip.toString());
    setAmount(expense.amount.toString());
    setDate(expense.date);
    setCategory(expense.category);
    setDescription(expense.description);
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      await api.delete(`/api/expenses/${expenseId}/`);
      setExpenses(expenses.filter((expense) => expense.id !== expenseId));
    } catch (err) {
      console.error("Error deleting expense:", err);
      setError("Failed to delete expense. Please try again.");
    }
  };

  const handleTripChange = (tripId) => {
    setSelectedTrip(tripId);
    const selected = trips.find(trip => trip.id === Number(tripId));
    setCurrentTrip(selected);
  };

  if (isLoading) {
    return (
      <div className="expense-page-container">
        <Sidebar />
        <div className="main-content">
          <div className="expense-container">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-page-container">
      <Sidebar />
      <div className="main-content">
        <div className="expense-container">
          {currentTrip && (
            <div className="budget-bar-container">
              <h3>{currentTrip.trip_name} Budget</h3>
              <div className="budget-info">
                <span>Total: £{currentTrip.total_budget}</span>
                <span>Spent: £{totalSpent.toFixed(2)}</span>
                <span>Remaining: £{remainingBudget.toFixed(2)}</span>
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
                  You've exceeded your budget by £{Math.abs(remainingBudget).toFixed(2)}!
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
       {/* Footer */}
       <div className="footer">
                <p>&copy; SmartTravel. All rights reserved.</p>
            </div>
    </div>

    
  );
}

export default Expense;