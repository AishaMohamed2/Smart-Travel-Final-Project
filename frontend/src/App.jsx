/* Title: <Django & React Web App Tutorial - Authentication, Databases, Deployment & More...>
Author: <Tech with Tim>
Date: <26/03/2024>
Code version: <n/a>
Availability: <https://www.youtube.com/watch?v=c-QsfbznSXI> 
REUSED LOGIN,REGISTER, AND PROTECTED ROUTE
*/

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import Trip from "./pages/Trip";
import Expense from "./pages/Expense";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Layout from "./components/Navigation/Layout";

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}

function RegisterAndLogout() {
  localStorage.clear();
  return <Register />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (without layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/register" element={<RegisterAndLogout />} />
        
        {/* Protected routes with Layout */}
        <Route element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Home />} />
          <Route path="/trips" element={<Trip />} />
          <Route path="/expenses" element={<Expense />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;