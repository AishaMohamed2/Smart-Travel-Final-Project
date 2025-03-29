import React from "react";
import { FaTrash, FaEdit } from "react-icons/fa";
import "../../styles/Expense/ExpenseList.css";

function ExpenseList({ 
  expenses, 
  handleEditExpense, 
  handleDeleteExpense 
}) {
  const confirmDelete = (expenseId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this expense?");
    if (confirmDelete) {
      handleDeleteExpense(expenseId);
    }
  };

  return (
    <div className="expense-list">
      <h3>Recent Expenses</h3>
      {expenses.length === 0 ? (
        <p>No expenses added yet.</p>
      ) : (
        <ul>
          {expenses.slice(0, 5).map((expense) => (
            <li key={expense.id}>
              <div className="expense-details">
                <h4>{expense.category}</h4>
                <p>Amount: £{expense.amount}</p>
                <p>Date: {expense.date}</p>
                <p>Description: {expense.description}</p>
              </div>
              <button 
                onClick={() => handleEditExpense(expense)} 
                className="edit-button"
              >
                <FaEdit />
              </button>
              <button 
                onClick={() => confirmDelete(expense.id)} 
                className="delete-button"
              >
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