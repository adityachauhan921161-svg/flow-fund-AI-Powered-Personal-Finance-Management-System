
import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "../styles/Analytics.css";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

const formatCurrency = (value) =>
  `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

// Read dates saved by the Transactions page (DD/MM/YYYY)
function parseTransactionDate(value) {
  if (typeof value !== "string") return null;

  const parts = value.split("/");
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year)
  ) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function Analytics() {
  const [transactions, setTransactions] = useState([]);
  const [period, setPeriod] = useState("all");

  // Load transactions from localStorage
  useEffect(() => {
    const loadTransactions = () => {
      try {
        const saved = localStorage.getItem(
          "flowfund_transactions"
        );

        const parsed = saved ? JSON.parse(saved) : [];

        setTransactions(
          Array.isArray(parsed) ? parsed : []
        );
      } catch (error) {
        console.error("Error loading analytics:", error);
        setTransactions([]);
      }
    };

    loadTransactions();

    window.addEventListener("storage", loadTransactions);

    return () => {
      window.removeEventListener("storage", loadTransactions);
    };
  }, []);

  const now = new Date();

  // Filter by selected period
  const filteredTransactions = transactions.filter(
    (transaction) => {
      if (period === "all") return true;

      const date = parseTransactionDate(transaction.date);

      if (!date) return false;

      if (period === "month") {
        return (
          date.getMonth() === now.getMonth() &&
          date.getFullYear() === now.getFullYear()
        );
      }

      if (period === "year") {
        return date.getFullYear() === now.getFullYear();
      }

      return true;
    }
  );

  // Calculate financial totals
  const totalIncome = filteredTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce(
      (total, transaction) =>
        total + (Number(transaction.amount) || 0),
      0
    );

  const totalExpenses = filteredTransactions
    .filter((transaction) => transaction.type === "expense")
    .reduce(
      (total, transaction) =>
        total + (Number(transaction.amount) || 0),
      0
    );

  const netCashFlow = totalIncome - totalExpenses;

  const savingsRate =
    totalIncome > 0
      ? (netCashFlow / totalIncome) * 100
      : 0;

  // Group expenses by category
  const categoryTotals = {};

  filteredTransactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;

    const category =
      transaction.category?.trim() || "Other";

    const amount = Number(transaction.amount);

    if (!Number.isFinite(amount) || amount <= 0) return;

    const existingCategory = Object.keys(
      categoryTotals
    ).find(
      (key) =>
        key.toLowerCase() === category.toLowerCase()
    );

    const key = existingCategory || category;

    categoryTotals[key] =
      (categoryTotals[key] || 0) + amount;
  });

  const categoryData = Object.entries(categoryTotals)
    .map(([name, value]) => ({
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate income and expenses for the last six months
  const monthlyData = Array.from(
    { length: 6 },
    (_, index) => {
      const monthDate = new Date(
        now.getFullYear(),
        now.getMonth() - 5 + index,
        1
      );

      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();

      let income = 0;
      let expenses = 0;

      transactions.forEach((transaction) => {
        const date = parseTransactionDate(
          transaction.date
        );

        if (!date) return;

        if (
          date.getMonth() !== month ||
          date.getFullYear() !== year
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
      };
    }
  );

  // Identify the highest spending category
  const highestCategory =
    categoryData.length > 0
      ? categoryData[0]
      : null;

  // Identify financial status
  let financialInsight = "";

  if (filteredTransactions.length === 0) {
    financialInsight =
      "Add transactions to start seeing financial insights.";
  } else if (totalIncome === 0) {
    financialInsight =
      "No income is recorded for this period. Add income transactions for a more complete analysis.";
  } else if (totalExpenses > totalIncome) {
    financialInsight =
      "Your recorded expenses exceed your income for this period. Review your highest spending categories.";
  } else if (savingsRate >= 30) {
    financialInsight =
      "Your recorded income exceeds expenses by at least 30%. Consider allocating some of the surplus toward your savings goals.";
  } else {
    financialInsight =
      "Your income is higher than your expenses. Review your category spending to identify additional saving opportunities.";
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1>Financial Analytics</h1>
          <p>
            Understand your income, expenses, and
            financial trends.
          </p>
        </div>

        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="Select analytics period"
        >
          <option value="all">All Time</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      {/* Financial Summary */}
      <div className="analytics-summary">
        <div className="analytics-summary-card">
          <h3>Total Income</h3>
          <h2 className="analytics-income">
            {formatCurrency(totalIncome)}
          </h2>
        </div>

        <div className="analytics-summary-card">
          <h3>Total Expenses</h3>
          <h2 className="analytics-expense">
            {formatCurrency(totalExpenses)}
          </h2>
        </div>

        <div className="analytics-summary-card">
          <h3>Net Cash Flow</h3>
          <h2>{formatCurrency(netCashFlow)}</h2>
        </div>

        <div className="analytics-summary-card">
          <h3>Net Savings Rate</h3>
          <h2>{savingsRate.toFixed(1)}%</h2>
        </div>
      </div>

      {/* Charts */}
      <div className="analytics-charts">
        <div className="analytics-chart-card">
          <h2>Income vs Expenses</h2>
          <p>Last six calendar months</p>

          <div className="analytics-chart-container">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart data={monthlyData}>
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
        </div>

        <div className="analytics-chart-card">
          <h2>Spending by Category</h2>
          <p>Expenses for the selected period</p>

          {categoryData.length === 0 ? (
            <div className="analytics-empty">
              No expense data available.
            </div>
          ) : (
            <div className="analytics-chart-container">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius="75%"
                    dataKey="value"
                    nameKey="name"
                    label={({ percent }) =>
                      `${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={
                          COLORS[index % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      formatCurrency(value)
                    }
                  />

                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="analytics-section">
        <h2>Expense Breakdown</h2>

        {categoryData.length === 0 ? (
          <p className="analytics-muted">
            No expense transactions found.
          </p>
        ) : (
          <div className="analytics-category-list">
            {categoryData.map((item, index) => {
              const percentage =
                totalExpenses > 0
                  ? (item.value / totalExpenses) * 100
                  : 0;

              return (
                <div
                  className="analytics-category-item"
                  key={item.name}
                >
                  <div className="analytics-category-top">
                    <strong>{item.name}</strong>

                    <span>
                      {formatCurrency(item.value)}
                      {" — "}
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="analytics-progress-track">
                    <div
                      className="analytics-progress-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor:
                          COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Financial Insights */}
      <div className="analytics-section">
        <h2>Financial Insights</h2>

        <p>{financialInsight}</p>

        {highestCategory && (
          <p>
            Your highest expense category is{" "}
            <strong>{highestCategory.name}</strong>,
            with spending of{" "}
            <strong>
              {formatCurrency(highestCategory.value)}
            </strong>.
          </p>
        )}

        <p className="analytics-muted">
          Insights are based on your recorded
          transactions and are not personalized
          financial advice.
        </p>
      </div>
    </div>
  );
}

export default Analytics;
