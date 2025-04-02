import React, { useState } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import "../../styles/Expense/ExpenseList.css";

function ExpenseList({ expenses, handleEditExpense, handleDeleteExpense }) {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const confirmDelete = (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      handleDeleteExpense(expenseId);
    }
  };

  // Get unique categories from expenses
  const categories = ["All", ...new Set(expenses.map((expense) => expense.category))];

  // Filter expenses based on selected category
  const filteredExpenses =
    selectedCategory === "All"
      ? expenses
      : expenses.filter((expense) => expense.category === selectedCategory);

  return (
    <div className="expense-list">
      <h3>Your Expenses</h3>

      {/* Category Filter Dropdown */}
      <div className="category-filter">
        <label htmlFor="category">Filter by Category:</label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Expense List */}
      {filteredExpenses.length === 0 ? (
        <p>No expenses found for this category.</p>
      ) : (
        <ul>
          {filteredExpenses.map((expense) => (
            <li key={expense.id}>
              <div className="expense-details">
                <h4>{expense.category}</h4>
                <p>Amount: £{expense.amount}</p>
                <p>Date: {expense.date}</p>
                <p>Description: {expense.description}</p>
              </div>
              <button onClick={() => handleEditExpense(expense)} className="edit-button">
                <FaEdit />
              </button>
              <button onClick={() => confirmDelete(expense.id)} className="delete-button">
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpenseList;
