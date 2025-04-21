import { NavLink, useNavigate } from "react-router-dom";
import { FiHome, FiMap, FiDollarSign, FiPieChart, FiSettings, FiLogOut } from "react-icons/fi";
import "../../styles/Navigation/Sidebar.css";  
import { ACCESS_TOKEN } from "../../constants";
import React, { useState, useEffect } from "react";

function Sidebar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  useEffect(() => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      setIsLoggedIn(token !== null);
  }, []);

  const handleLogout = () => {
      localStorage.clear();
      setIsLoggedIn(false);
      navigate("/login");
  };

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

      <button className="logout-button" onClick={handleLogout}>
        <FiLogOut /> Logout
      </button>
    </div>
  );
}

export default Sidebar;