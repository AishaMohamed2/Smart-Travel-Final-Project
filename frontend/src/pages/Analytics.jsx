import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js';
import "../styles/Analytics.css";
import { useCurrency } from '../utils/useCurrency';

// Register ChartJS components
ChartJS.register(
  ArcElement, Tooltip, Legend, 
  CategoryScale, LinearScale, 
  BarElement, Title, LineElement, PointElement
);
  
  // Currently selected trip ID for detailed view (empty  showing all trips)
function Analytics() {
  const { formatAmount, currencySymbol } = useCurrency();
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

  const filterTrips = (trips) => {
    const now = new Date();
    return trips.filter(trip => {
      const startDate = new Date(trip.start_date);
      const endDate = new Date(trip.end_date);
      return endDate <= now || (startDate <= now && now <= endDate); // Include ended and ongoing
    // Include ended and ongoing
    });
  };
  

  const fetchAllTripsData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get("/api/trips/analytics/");
      const filteredTrips = filterTrips(response.data.trips);
      
      // Calculate totals only for filtered trips
      const totalBudget = filteredTrips.reduce((sum, trip) => sum + (trip.total_budget || 0), 0);
      const totalSpent = filteredTrips.reduce((sum, trip) => sum + (trip.total_spent || 0), 0);
      
      setAnalyticsData({
        trips: filteredTrips,
        totalBudget,
        totalSpent,
        categories: response.data.categories || {},
        dailySpending: response.data.daily_spending || {}
      });
    } catch (err) {
      console.error("Error fetching all trips analytics:", err);
      setError("Failed to load trips data. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
              formatDate(date), // Ensure all dates are formatted consistently
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

  const getProgressBarClass = (remainingPercentage) => {
    if (remainingPercentage > 50) return 'high';
    if (remainingPercentage > 25) return 'medium';
    return 'low';
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
    const categoryData = categories || {};
    
    const categoryLabels = {
      food: "Food & Dining",
      transport: "Transport",
      accommodation: "Accommodation",
      entertainment: "Entertainment",
      other: "Other"
    };
  
    return {
      labels: Object.values(categoryLabels),
      datasets: [{
        data: Object.keys(categoryLabels).map(cat => categoryData[cat] || 0),
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 1
      }]
    };
  };

  const getDailySpendingData = (dailyData) => {
    if (!dailyData || Object.keys(dailyData).length === 0) {
      return {
        labels: ['No data'],
        datasets: [{
          label: `Daily Spending`,
          data: [0],
          backgroundColor: '#3b82f6',
          borderColor: '#2563eb',
          borderWidth: 1
        }]
      };
    }


    // Sort dates chronologically for proper line chart
    const sortedDates = Object.keys(dailyData).sort((a, b) => new Date(a) - new Date(b));
    const amounts = sortedDates.map(date => dailyData[date]);
    
    return {
      labels: sortedDates,
      datasets: [{
        label: `Daily Spending`,
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
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 1
      }]
    };
  };

  const calculatePercentage = (value, total) => {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  };

  // Show empty state if no trips available (only for all trips view)
  if (!isLoading && analyticsData.trips.length === 0 && !selectedTripId) {
    return (
      <div className="analytics-page-container">
        <div className="analytics-container">
          <div className="no-analytics-message">
            <h2>No Analytics Available</h2>
            <p>Analytics are only shown for trips that have ended or are ongoing.</p>
            <p>Start a new trip</p>
            <button 
              onClick={() => navigate("/trips")} 
              className="create-trip-btn"
            >
              Create a New Trip
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page-container">
      <div className="analytics-container">
        <div className="analytics-header">
          <h1>Financial Recap</h1>
          <div className="trip-selector">
            <select 
              onChange={(e) => handleTripSelect(e.target.value)}
              value={selectedTripId}
            >
              <option value="">All Trips</option>
              {analyticsData.trips.map(trip => (
                <option key={trip.trip_id} value={trip.trip_id}>
                  {trip.trip_name} ({trip.destination})
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
                <p className="amount">{formatAmount(analyticsData.totalSpent)}</p>
                <div className="progress-bar">
                  <div 
                    className={`progress-bar-fill ${getProgressBarClass(
                      100 - calculatePercentage(analyticsData.totalSpent, analyticsData.totalBudget)
                    )}`}
                    style={{ 
                      width: `${calculatePercentage(analyticsData.totalSpent, analyticsData.totalBudget)}%` 
                    }}
                  ></div>
                </div>
                <p className="summary-text">
                  {formatAmount(analyticsData.totalBudget)} budget
                </p>
              </div>

              <div className="summary-card">
                <h3>Remaining Budget</h3>
                <p className="amount">{formatAmount(analyticsData.totalBudget - analyticsData.totalSpent)}</p>
                <div className="progress-bar">
                  <div 
                    className={`progress-bar-fill ${getProgressBarClass(
                      calculatePercentage(analyticsData.totalBudget - analyticsData.totalSpent, analyticsData.totalBudget)
                    )}`}
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
                <h3>Spending by Trip</h3>
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
                        legend: { position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatAmount(context.raw)}`
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: `Amount (${currencySymbol})`
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
                <h3>Spending by Category</h3>
                <div className="chart-container">
                  <Pie 
                    data={getCategoryChartData(analyticsData.categories)}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { position: 'top' },
                        tooltip: {
                          callbacks: {
                            label: (context) => {
                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                              const percentage = Math.round((context.raw / total) * 100);
                              return `${context.label}: ${formatAmount(context.raw)} (${percentage}%)`;
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="chart-card">
                <h3>Daily Spending</h3>
                <div className="chart-container">
                  {Object.keys(analyticsData.dailySpending).length > 0 ? (
                    <Line 
                      data={getDailySpendingData(analyticsData.dailySpending)}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { position: 'top' },
                          tooltip: {
                            callbacks: {
                              label: (context) => `${context.dataset.label}: ${formatAmount(context.raw)}`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: `Amount (${currencySymbol})`
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
                  <p>{formatDate(tripDetails.start_date)} to {formatDate(tripDetails.end_date)}</p>
                </div>

                <div className="summary-section">
                  <div className="summary-card">
                    <h3>Total Budget</h3>
                    <p className="amount">{formatAmount(tripDetails.total_budget)}</p>
                  </div>
                  
                  <div className="summary-card">
                    <h3>Total Spent</h3>
                    <p className="amount">{formatAmount(tripDetails.total_spent)}</p>
                  </div>
                  
                  <div className="summary-card">
                    <h3>Remaining</h3>
                    <p className="amount">{formatAmount(tripDetails.total_budget - tripDetails.total_spent)}</p>
                    <div className="progress-bar">
                      <div 
                        className={`progress-bar-fill ${getProgressBarClass(
                          calculatePercentage(
                            tripDetails.total_budget - tripDetails.total_spent, 
                            tripDetails.total_budget
                          )
                        )}`}
                        style={{ 
                          width: `${calculatePercentage(
                            tripDetails.total_spent, 
                            tripDetails.total_budget
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <p className="summary-text">
                      {calculatePercentage(
                        tripDetails.total_budget - tripDetails.total_spent, 
                        tripDetails.total_budget
                      )}% remaining
                    </p>
                  </div>
                  
                  <div className="summary-card">
                    <h3>Daily Average</h3>
                    <p className="amount">{formatAmount(
                      tripDetails.total_spent / 
                      ((new Date(tripDetails.end_date) - new Date(tripDetails.start_date)) / 
                      (1000 * 60 * 60 * 24) + 1)
                    )}</p>
                  </div>
                </div>

                <div className="dual-chart-section">
                  <div className="chart-card">
                    <h3>Budget vs Spent</h3>
                    <div className="chart-container">
                      <Doughnut 
                        data={getBudgetComparisonData(tripDetails.total_budget, tripDetails.total_spent)}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' },
                            tooltip: {
                              callbacks: {
                                label: (context) => `${context.label}: ${formatAmount(context.raw)}`
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
                            legend: { position: 'bottom' },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = Math.round((context.raw / total) * 100);
                                  return `${context.label}: ${formatAmount(context.raw)} (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="visualizations-section">
                  <div className="chart-card full-width">
                    <h3>Daily Spending</h3>
                    <div className="chart-container">
                      {Object.keys(tripDetails.daily_spending).length > 0 ? (
                        <Line 
                          data={getDailySpendingData(tripDetails.daily_spending)}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { position: 'top' },
                              tooltip: {
                                callbacks: {
                                  label: (context) => `${context.dataset.label}: ${formatAmount(context.raw)}`
                                }
                              }
                            },
                            scales: {
                              y: { 
                                beginAtZero: true,
                                title: { display: true, text: `Amount (${currencySymbol})` }
                              },
                              x: { 
                                title: { display: true, text: 'Date' } 
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="no-data-message">No daily spending data available</div>
                      )}
                    </div>
                  </div>
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
  );
}

export default Analytics;