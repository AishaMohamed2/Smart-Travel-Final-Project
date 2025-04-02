import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Sidebar from "../components/Navigation/Sidebar";
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js';
import "../styles/Analytics.css";

ChartJS.register(
  ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, 
  BarElement, Title, LineElement, PointElement
);

function Analytics() {
  const [analyticsData, setAnalyticsData] = useState({
    trips: [],
    totalBudget: 0,
    totalSpent: 0,
    categories: {},
    dailySpending: {}
  });
  const [selectedTripId, setSelectedTripId] = useState("");
  const [tripDetails, setTripDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllTripsData();
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      fetchTripDetails(selectedTripId);
    }
  }, [selectedTripId]);

  const fetchAllTripsData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/api/trips/analytics/");
      const filteredTrips = filterTrips(response.data.trips);
      setAnalyticsData({
        trips: filteredTrips,
        totalBudget: response.data.total_budget,
        totalSpent: response.data.total_spent,
        categories: response.data.categories,
        dailySpending: response.data.daily_spending || {}
      });
    } catch (err) {
      console.error("Error fetching all trips analytics:", err);
      setError("Failed to load trips data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterTrips = (trips) => {
    const now = new Date();
    return trips.filter(trip => {
      const endDate = new Date(trip.end_date);
      const remainingDays = Math.ceil((endDate - now) / (1000 * 3600 * 24));
      return remainingDays <= 0 || remainingDays === 1;
    });
  };

  const fetchTripDetails = async (tripId) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get(`/api/trips/${tripId}/analytics/`);
      const formattedDetails = {
        ...response.data,
        start_date: formatDate(response.data.start_date),
        end_date: formatDate(response.data.end_date),
        daily_spending: response.data.daily_spending ? 
          Object.fromEntries(
            Object.entries(response.data.daily_spending).map(([date, amount]) => [
              formatDate(date),
              amount
            ])
          ) : {},
        category_spending: response.data.category_spending || {}
      };
      setTripDetails(formattedDetails);
    } catch (err) {
      console.error("Error fetching trip details:", err);
      setError(err.response?.data?.error || "Failed to load trip details.");
      setTripDetails(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') return date;
    try {
      const dateObj = new Date(date);
      return dateObj.toISOString().split('T')[0];
    } catch (e) {
      console.error("Error formatting date:", date, e);
      return '';
    }
  };

  const handleTripSelect = (tripId) => {
    setSelectedTripId(tripId);
  };

  const handleViewAllTrips = () => {
    setSelectedTripId("");
    setTripDetails(null);
    setError("");
    fetchAllTripsData();
  };

  const getCategoryChartData = (categories) => {
    const categoryLabels = {
      food: "Food & Dining",
      transport: "Transport",
      accommodation: "Accommodation",
      entertainment: "Entertainment",
      other: "Other"
    };

    const allCategories = Object.keys(categoryLabels);
    const backgroundColors = [
      '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
    ];

    return {
      labels: allCategories.map(cat => categoryLabels[cat]),
      datasets: [{
        data: allCategories.map(cat => categories[cat] || 0),
        backgroundColor: backgroundColors,
        borderWidth: 1
      }]
    };
  };

  const getDailySpendingData = (dailyData) => {
    if (!dailyData || Object.keys(dailyData).length === 0) {
      return {
        labels: ['No data'],
        datasets: [{
          label: 'Daily Spending (£)',
          data: [0],
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1
        }]
      };
    }

    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
    const amounts = sortedDates.map(date => dailyData[date]);
    
    return {
      labels: sortedDates,
      datasets: [{
        label: 'Daily Spending (£)',
        data: amounts,
        backgroundColor: '#3b82f6',
        borderColor: '#2563eb',
        borderWidth: 2,
        tension: 0.1,
        fill: false
      }]
    };
  };

  const getBudgetComparisonData = (budget, spent) => {
    return {
      labels: ['Remaining Budget', 'Amount Spent'],
      datasets: [{
        data: [budget - spent, spent],
        backgroundColor: ['#10b981', '#3b82f6'],
        borderWidth: 1
      }]
    };
  };

  const getDailyAverageData = (spent, startDate, endDate) => {
    const duration = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
    const average = spent / duration;
    return {
      labels: ['Daily Average Spending'],
      datasets: [{
        data: [average],
        backgroundColor: ['#f59e0b'],
        borderWidth: 1
      }]
    };
  };

  const calculatePercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  if (isLoading && !analyticsData.trips.length) {
    return (
      <div className="analytics-page-container">
        <Sidebar />
        <div className="main-content">
          <div className="analytics-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page-container">
      <Sidebar />
      <div className="main-content">
        <div className="analytics-container">
          <div className="analytics-header">
            <h1>Financial Recap</h1>
            <div className="trip-selector">
              <select 
                onChange={(e) => handleTripSelect(e.target.value)}
                value={selectedTripId}
                disabled={isLoading}
              >
                <option value="">All Trips</option>
                {analyticsData.trips.map(trip => (
                  <option key={trip.trip_id} value={trip.trip_id}>
                    {trip.trip_name} ({trip.destination}, {formatDate(trip.start_date)} to {formatDate(trip.end_date)})
                  </option>
                ))}
              </select>
              {selectedTripId && (
                <button onClick={handleViewAllTrips} className="view-all-btn">
                  View All Trips
                </button>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {!selectedTripId ? (
            <div className="all-trips-view">
              <div className="summary-section">
                <div className="summary-card">
                  <h3>Total Spent</h3>
                  <p className="amount">£{analyticsData.totalSpent.toFixed(2)}</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill" 
                      style={{ 
                        width: `${calculatePercentage(analyticsData.totalSpent, analyticsData.totalBudget)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="summary-text">
                    £{analyticsData.totalBudget.toFixed(2)} budget
                  </p>
                </div>

                <div className="summary-card">
                  <h3>Remaining Budget</h3>
                  <p className="amount">£{(analyticsData.totalBudget - analyticsData.totalSpent).toFixed(2)}</p>
                  <div className="progress-bar">
                    <div 
                      className="progress-bar-fill remaining" 
                      style={{ 
                        width: `${calculatePercentage(analyticsData.totalBudget - analyticsData.totalSpent, analyticsData.totalBudget)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="summary-text">
                    {calculatePercentage(analyticsData.totalBudget - analyticsData.totalSpent, analyticsData.totalBudget)}% remaining
                  </p>
                </div>
              </div>

              <div className="visualizations-section">
                <div className="chart-card">
                  <div className="chart-header">
                    <h3>Spending by Trip</h3>
                  </div>
                  <div className="chart-container">
                    <Bar 
                      data={{
                        labels: analyticsData.trips.map(trip => trip.trip_name),
                        datasets: [{
                          label: 'Spent',
                          data: analyticsData.trips.map(trip => trip.total_spent),
                          backgroundColor: '#3b82f6'
                        }, {
                          label: 'Budget',
                          data: analyticsData.trips.map(trip => trip.total_budget),
                          backgroundColor: '#e2e8f0'
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `${context.dataset.label}: £${context.raw.toFixed(2)}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Amount (£)'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="dual-chart-section">
                <div className="chart-card">
                  <div className="chart-header">
                    <h3>Spending by Category</h3>
                  </div>
                  <div className="chart-container">
                    <Pie 
                      data={getCategoryChartData(analyticsData.categories)}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: £${value.toFixed(2)} (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="chart-card">
                  <div className="chart-header">
                    <h3>Daily Spending</h3>
                  </div>
                  <div className="chart-container">
                    {Object.keys(analyticsData.dailySpending).length > 0 ? (
                      <Line 
                        data={getDailySpendingData(analyticsData.dailySpending)}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top',
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `${context.dataset.label}: £${context.raw.toFixed(2)}`;
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Amount (£)'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Date'
                              }
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="no-data-message">
                        No daily spending data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="trip-details-view">
              {tripDetails ? (
                <>
                  <div className="trip-header">
                    <h2>{tripDetails.trip_name} Analytics</h2>
                    <p className="trip-dates">{formatDate(tripDetails.start_date)} to {formatDate(tripDetails.end_date)}</p>
                  </div>

                  <div className="trip-summary-cards">
                    <div className="trip-summary-card">
                      <h3>Total Budget</h3>
                      <p className="amount">£{tripDetails.total_budget?.toFixed(2)}</p>
                    </div>
                    <div className="trip-summary-card">
                      <h3>Total Spent</h3>
                      <p className="amount">£{tripDetails.total_spent?.toFixed(2)}</p>
                    </div>
                    <div className="trip-summary-card">
                      <h3>Remaining</h3>
                      <p className="amount">£{(tripDetails.total_budget - tripDetails.total_spent)?.toFixed(2)}</p>
                    </div>
                    <div className="trip-summary-card">
                      <h3>Daily Average</h3>
                      <p className="amount">£{(
                        tripDetails.total_spent / 
                        ((new Date(tripDetails.end_date) - new Date(tripDetails.start_date)) / (1000 * 60 * 60 * 24) + 1)
                      )?.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="trip-charts-grid">
                    <div className="chart-card">
                      <h3>Budget vs Spent</h3>
                      <div className="chart-container">
                        <Doughnut 
                          data={getBudgetComparisonData(tripDetails.total_budget, tripDetails.total_spent)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `${context.label}: £${context.raw.toFixed(2)}`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="chart-card">
                      <h3>Spending by Category</h3>
                      <div className="chart-container">
                        <Pie 
                          data={getCategoryChartData(tripDetails.category_spending)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    const label = context.label || '';
                                    const value = context.raw || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = Math.round((value / total) * 100);
                                    return `${label}: £${value.toFixed(2)} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {tripDetails.daily_spending && Object.keys(tripDetails.daily_spending).length > 0 && (
                      <div className="chart-card full-width">
                        <h3>Daily Spending</h3>
                        <div className="chart-container">
                          <Line 
                            data={getDailySpendingData(tripDetails.daily_spending)}
                            options={{
                              responsive: true,
                              maintainAspectRatio: false,
                              plugins: {
                                legend: {
                                  position: 'top',
                                },
                                tooltip: {
                                  callbacks: {
                                    label: function(context) {
                                      return `${context.dataset.label}: £${context.raw.toFixed(2)}`;
                                    }
                                  }
                                }
                              },
                              scales: {
                                y: {
                                  beginAtZero: true,
                                  title: {
                                    display: true,
                                    text: 'Amount (£)'
                                  }
                                },
                                x: {
                                  title: {
                                    display: true,
                                    text: 'Date'
                                  }
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="error-message">
                  {error || "No trip details available"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="footer">
        <p>&copy; SmartTravel. All rights reserved.</p>
      </div>
    </div>
  );
}

export default Analytics;