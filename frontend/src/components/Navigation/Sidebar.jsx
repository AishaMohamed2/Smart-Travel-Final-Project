import React from "react";
import { NavLink } from "react-router-dom";
import { FiHome, FiMap, FiDollarSign, FiPieChart, FiSettings, FiLogOut } from "react-icons/fi";
import "../../styles/Navigation/Sidebar.css";  

function Sidebar({ onLogout }) {
  return (
    <div className="sidebar">
      <h2>SmartTravel</h2>
      <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
        <FiHome /> Dashboard
      </NavLink>
      <NavLink to="/trips" className={({ isActive }) => (isActive ? "active" : "")}>
        <FiMap /> Add Trip
      </NavLink>
      <NavLink to="/expenses" className={({ isActive }) => (isActive ? "active" : "")}>
        <FiDollarSign /> Add Expense
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => (isActive ? "active" : "")}>
        <FiPieChart /> Analytics
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
        <FiSettings /> Settings
      </NavLink>

    </div>
  );
}

export default Sidebar;

