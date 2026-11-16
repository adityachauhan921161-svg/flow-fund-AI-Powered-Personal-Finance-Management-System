
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import "../styles/Forecasting.css";

const formatCurrency = (value) =>
  `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

// Read transaction dates stored as DD/MM/YYYY.
function parseTransactionDate(value) {
  if (typeof value !== "string") return null;

  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);
  const date = new Date(year, month - 1, day);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function loadTransactions() {
  try {
    const saved = localStorage.getItem(
      "flowfund_transactions"
    );

    const parsed = saved ? JSON.parse(saved) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading forecast data:", error);
    return [];
  }
}

function Forecasting() {
  const [transactions, setTransactions] = useState(
    loadTransactions
  );

  const [incomeChange, setIncomeChange] = useState(0);
  const [expenseChange, setExpenseChange] = useState(0);

  const now = new Date();

  // Analyze the previous three completed calendar months.
  const historicalData = Array.from(
    { length: 3 },
    (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - 3 + index,
        1
      );

      let income = 0;
      let expenses = 0;

      transactions.forEach((transaction) => {
        const date = parseTransactionDate(
          transaction.date
        );

        if (!date) return;

        if (
          date.getMonth() !== monthDate.getMonth() ||
          date.getFullYear() !== monthDate.getFullYear()
        ) {
          return;
        }

        const amount = Number(transaction.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
          return;
        }

        if (transaction.type === "income") {
          income += amount;
        } else if (transaction.type === "expense") {
          expenses += amount;
        }
      });

      return {
        month: monthDate.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        income,
        expenses,
        type: "Historical",
      };
    }
  );

  // Only use months containing recorded transactions.
  const monthsWithData = historicalData.filter(
    (month) => month.income > 0 || month.expenses > 0
  );

  const totalHistoricalIncome = monthsWithData.reduce(
    (total, month) => total + month.income,
    0
  );

  const totalHistoricalExpenses = monthsWithData.reduce(
    (total, month) => total + month.expenses,
    0
  );

  const averageIncome =
    monthsWithData.length > 0
      ? totalHistoricalIncome / monthsWithData.length
      : 0;

  const averageExpenses =
    monthsWithData.length > 0
      ? totalHistoricalExpenses / monthsWithData.length
      : 0;

  const predictedIncome = Math.max(
    0,
    averageIncome * (1 + incomeChange / 100)
  );

  const predictedExpenses = Math.max(
    0,
    averageExpenses * (1 + expenseChange / 100)
  );

  const predictedSavings =
    predictedIncome - predictedExpenses;

  // Forecast the next three months.
  const forecastData = Array.from(
    { length: 3 },
    (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() + 1 + index,
        1
      );

      return {
        month: monthDate.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
        income: predictedIncome,
        expenses: predictedExpenses,
        savings: predictedSavings,
        type: "Forecast",
      };
    }
  );

  const chartData = [...historicalData, ...forecastData];

  const projectedThreeMonthSavings =
    predictedSavings * 3;

  const forecastAvailable = monthsWithData.length > 0;

  let financialWarning = "";

  if (!forecastAvailable) {
    financialWarning =
      "There is not enough historical data from the previous three completed months to calculate a forecast.";
  } else if (predictedExpenses > predictedIncome) {
    financialWarning =
      "Warning: Projected expenses exceed projected income. Consider reviewing your budget and reducing unnecessary spending.";
  } else if (predictedExpenses > predictedIncome * 0.8) {
    financialWarning =
      "Caution: Projected expenses consume more than 80% of your income. Your estimated savings margin is relatively small.";
  } else {
    financialWarning =
      "Your projected income is higher than your expenses. You may be able to allocate part of the surplus toward savings goals.";
  }

  const handleRefresh = () => {
    setTransactions(loadTransactions());
  };

  return (
    <div className="forecasting-page">
      <div className="forecasting-header">
        <div>
          <h1>Financial Forecasting</h1>
          <p>
            Estimate future income, expenses, and
            cash flow using your transaction history.
          </p>
        </div>

        <button
          type="button"
          className="forecast-refresh-button"
          onClick={handleRefresh}
        >
          Refresh Data
        </button>
      </div>

      {/* Forecast Summary */}
      <div className="forecasting-summary">
        <div className="forecast-summary-card">
          <h3>Predicted Monthly Income</h3>
          <h2 className="forecast-income">
            {forecastAvailable
              ? formatCurrency(predictedIncome)
              : "N/A"}
          </h2>
        </div>

        <div className="forecast-summary-card">
          <h3>Predicted Monthly Expenses</h3>
          <h2 className="forecast-expense">
            {forecastAvailable
              ? formatCurrency(predictedExpenses)
              : "N/A"}
          </h2>
        </div>

        <div className="forecast-summary-card">
          <h3>Predicted Monthly Cash Flow</h3>
          <h2>
            {forecastAvailable
              ? formatCurrency(predictedSavings)
              : "N/A"}
          </h2>
        </div>

        <div className="forecast-summary-card">
          <h3>Projected 3-Month Cash Flow</h3>
          <h2>
            {forecastAvailable
              ? formatCurrency(projectedThreeMonthSavings)
              : "N/A"}
          </h2>
        </div>
      </div>

      {/* Forecast Settings */}
      <div className="forecast-section">
        <h2>Forecast Scenario Settings</h2>

        <p className="forecast-muted">
          Adjust expected income and expense changes
          to explore different financial scenarios.
        </p>

        <div className="forecast-controls">
          <div>
            <label htmlFor="income-change">
              Expected Income Change: {incomeChange}%
            </label>

            <input
              id="income-change"
              type="range"
              min="-50"
              max="100"
              step="5"
              value={incomeChange}
              onChange={(e) =>
                setIncomeChange(Number(e.target.value))
              }
            />
          </div>

          <div>
            <label htmlFor="expense-change">
              Expected Expense Change: {expenseChange}%
            </label>

            <input
              id="expense-change"
              type="range"
              min="-50"
              max="100"
              step="5"
              value={expenseChange}
              onChange={(e) =>
                setExpenseChange(Number(e.target.value))
              }
            />
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="forecast-section">
        <h2>Income and Expense Forecast</h2>

        <p className="forecast-muted">
          Previous three completed months and
          next three projected months.
        </p>

        {forecastAvailable ? (
          <div className="forecast-chart-container">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#374151"
                />

                <XAxis
                  dataKey="month"
                  stroke="#9ca3af"
                />

                <YAxis
                  stroke="#9ca3af"
                  tickFormatter={(value) =>
                    `₹${value.toLocaleString("en-IN")}`
                  }
                />

                <Tooltip
                  formatter={(value) =>
                    formatCurrency(value)
                  }
                />

                <Legend />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#10b981"
                />

                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#ef4444"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="forecast-empty">
            No historical data available for forecasting.
          </p>
        )}
      </div>

      {/* Forecast Table */}
      <div className="forecast-section">
        <h2>Three-Month Financial Projection</h2>

        {forecastAvailable ? (
          <div className="forecast-table-wrapper">
            <table className="forecast-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Net Cash Flow</th>
                </tr>
              </thead>

              <tbody>
                {forecastData.map((month) => (
                  <tr key={month.month}>
                    <td>{month.month}</td>

                    <td className="forecast-income">
                      {formatCurrency(month.income)}
                    </td>

                    <td className="forecast-expense">
                      {formatCurrency(month.expenses)}
                    </td>

                    <td>
                      {formatCurrency(month.savings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="forecast-muted">
            Add historical transactions to generate
            monthly projections.
          </p>
        )}
      </div>

      {/* Financial Warning */}
      <div className="forecast-section">
        <h2>Financial Forecast Insights</h2>

        <p>{financialWarning}</p>

        <p className="forecast-muted">
          Forecast method: Average monthly income and
          expenses from the previous three completed
          calendar months with user-adjustable percentage
          changes. These projections are estimates,
          not guaranteed future results.
        </p>
      </div>
    </div>
  );
}

export default Forecasting;
