import React, { useState } from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import "../../styles/Expense/ExpenseList.css";
import { useCurrency } from '../../utils/useCurrency';

function ExpenseList({ expenses, handleEditExpense, handleDeleteExpense }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const { formatAmount, currency } = useCurrency();

  const confirmDelete = (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      handleDeleteExpense(expenseId);
    }
  };

  const categories = ["All", ...new Set(expenses.map((expense) => expense.category))];

  const filteredExpenses =
    selectedCategory === "All"
      ? expenses
      : expenses.filter((expense) => expense.category === selectedCategory);

  return (
    <div className="expense-list">
      <h3>Your Expenses</h3>

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

      {filteredExpenses.length === 0 ? (
        <p className="no-expense-message">No expenses found</p>
      ) : (
        <ul className="expense-list-items">
          {filteredExpenses.map((expense) => (
            <li key={expense.id} className="expense-item" onClick={() => handleEditExpense(expense)}>
              <div className="expense-details">
                <h4>{expense.category}</h4>
                <p>
                  <strong>Amount: </strong>
                  <span className="value">{formatAmount(expense.amount)}</span>
                  {expense.original_currency && expense.original_currency !== currency.code && (
                    <span className="original-amount">
                      (Original: {expense.original_amount} {expense.original_currency})
                    </span>
                  )}
                </p>
                <p>
                  <strong>Date: </strong>
                  <span className="value">{expense.date}</span>
                </p>
                <p>
                  <strong>Description: </strong>
                  <span className="value">{expense.description || 'N/A'}</span>
                </p>
              </div>
              <div className="expense-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditExpense(expense);
                  }}
                  className="edit-button"
                  aria-label="Edit expense"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    confirmDelete(expense.id);
                  }}
                  className="delete-button"
                  aria-label="Delete expense"
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpenseList;