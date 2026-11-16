
import { useEffect, useState } from "react";
import "../styles/Reports.css";

const STORAGE_KEY = "flowfund_transactions";

const formatCurrency = (amount) =>
  `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

// Convert transaction dates from DD/MM/YYYY to Date objects.
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

// Format dates for filtering and CSV export.
function toISODate(date) {
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// Safely format CSV values.
function escapeCSV(value) {
  const text = String(value ?? "");

  // Prevent spreadsheet formula execution.
  const safeText = /^[\s]*[=+\-@\t\r]/.test(text)
    ? `'${text}`
    : text;

  return `"${safeText.replace(/"/g, '""')}"`;
}

function Reports() {
  const [transactions, setTransactions] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Read the same transactions used by Analytics.
  useEffect(() => {
    const loadTransactions = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const parsed = saved ? JSON.parse(saved) : [];

        setTransactions(
          Array.isArray(parsed) ? parsed : []
        );
      } catch (error) {
        console.error("Error loading reports:", error);
        setTransactions([]);
      }
    };

    loadTransactions();

    window.addEventListener("storage", loadTransactions);

    return () => {
      window.removeEventListener("storage", loadTransactions);
    };
  }, []);

  const invalidRange =
    Boolean(startDate && endDate && startDate > endDate);

  // Filter transactions by date and type.
  const filteredTransactions = transactions
    .filter((transaction) => {
      if (
        typeFilter !== "all" &&
        transaction.type !== typeFilter
      ) {
        return false;
      }

      if (!startDate && !endDate) {
        return true;
      }

      const date = parseTransactionDate(transaction.date);

      if (!date) return false;

      const dateString = toISODate(date);

      if (startDate && dateString < startDate) return false;
      if (endDate && dateString > endDate) return false;

      return true;
    })
    .sort((a, b) => {
      const dateA = parseTransactionDate(a.date);
      const dateB = parseTransactionDate(b.date);

      return (dateB?.getTime() || 0) -
        (dateA?.getTime() || 0);
    });

  const reportTransactions = invalidRange
    ? []
    : filteredTransactions;

  // Calculate totals.
  const totalIncome = reportTransactions.reduce(
    (total, transaction) =>
      total +
      (transaction.type === "income"
        ? Number(transaction.amount) || 0
        : 0),
    0
  );

  const totalExpenses = reportTransactions.reduce(
    (total, transaction) =>
      total +
      (transaction.type === "expense"
        ? Number(transaction.amount) || 0
        : 0),
    0
  );

  const netCashFlow = totalIncome - totalExpenses;

  const categoryTotals = {};

  reportTransactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;

    const category =
      transaction.category?.trim() || "Other";

    const existingCategory = Object.keys(
      categoryTotals
    ).find(
      (item) =>
        item.toLowerCase() === category.toLowerCase()
    );

    const key = existingCategory || category;

    categoryTotals[key] =
      (categoryTotals[key] || 0) +
      (Number(transaction.amount) || 0);
  });

  const categoryData = Object.entries(categoryTotals)
    .map(([category, amount]) => ({
      category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Download the filtered transaction report as CSV.
  const handleDownloadCSV = () => {
    if (reportTransactions.length === 0) {
      alert("No transactions available to export.");
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Category",
      "Description",
      "Amount (INR)",
    ];

    const rows = reportTransactions.map(
      (transaction) => [
        transaction.date,
        transaction.type,
        transaction.category,
        transaction.description || "",
        Number(transaction.amount),
      ]
    );

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) =>
        row.map(escapeCSV).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(
      ["\uFEFF", csvContent],
      {
        type: "text/csv;charset=utf-8;",
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `FlowFund_Report_${toISODate(
      new Date()
    )}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (invalidRange) {
      alert("Please select a valid date range.");
      return;
    }

    window.print();
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setTypeFilter("all");
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Financial Reports</h1>
        <p>
          Generate reports and export your financial
          transaction history.
        </p>
      </div>

      {/* Report Filters */}
      <div className="reports-section reports-filters">
        <h2>Generate Report</h2>

        <div className="reports-filter-grid">
          <div>
            <label htmlFor="report-start">
              Start Date
            </label>

            <input
              id="report-start"
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="report-end">
              End Date
            </label>

            <input
              id="report-end"
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="report-type">
              Transaction Type
            </label>

            <select
              id="report-type"
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value)
              }
            >
              <option value="all">All Transactions</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>
        </div>

        {invalidRange && (
          <p className="reports-error">
            Start Date cannot be after End Date.
          </p>
        )}

        <div className="reports-actions">
          <button
            type="button"
            className="reports-primary-button"
            onClick={handleDownloadCSV}
            disabled={
              invalidRange ||
              reportTransactions.length === 0
            }
          >
            Download CSV
          </button>

          <button
            type="button"
            className="reports-secondary-button"
            onClick={handlePrint}
            disabled={invalidRange}
          >
            Print / Save as PDF
          </button>

          <button
            type="button"
            className="reports-reset-button"
            onClick={handleReset}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="reports-summary">
        <div className="reports-summary-card">
          <h3>Total Income</h3>
          <h2 className="reports-income">
            {formatCurrency(totalIncome)}
          </h2>
        </div>

        <div className="reports-summary-card">
          <h3>Total Expenses</h3>
          <h2 className="reports-expense">
            {formatCurrency(totalExpenses)}
          </h2>
        </div>

        <div className="reports-summary-card">
          <h3>Net Cash Flow</h3>
          <h2>{formatCurrency(netCashFlow)}</h2>
        </div>

        <div className="reports-summary-card">
          <h3>Transactions</h3>
          <h2>{reportTransactions.length}</h2>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="reports-section">
        <h2>Expense Breakdown by Category</h2>

        {categoryData.length === 0 ? (
          <p className="reports-muted">
            No expense data for the selected filters.
          </p>
        ) : (
          <div className="reports-category-list">
            {categoryData.map((item) => {
              const percentage =
                totalExpenses > 0
                  ? (item.amount / totalExpenses) * 100
                  : 0;

              return (
                <div
                  className="reports-category-item"
                  key={item.category}
                >
                  <div className="reports-category-top">
                    <strong>{item.category}</strong>

                    <span>
                      {formatCurrency(item.amount)}
                      {" — "}
                      {percentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="reports-progress-track">
                    <div
                      className="reports-progress-fill"
                      style={{
                        width: `${percentage}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction Report */}
      <div className="reports-section">
        <h2>Transaction Report</h2>

        <p className="reports-muted">
          Showing {reportTransactions.length} transaction(s).
        </p>

        {reportTransactions.length === 0 ? (
          <p className="reports-muted">
            No transactions match the selected filters.
          </p>
        ) : (
          <div className="reports-table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {reportTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.date}</td>

                    <td className="reports-type">
                      {transaction.type}
                    </td>

                    <td>{transaction.category}</td>

                    <td>
                      {transaction.description || "—"}
                    </td>

                    <td
                      className={
                        transaction.type === "income"
                          ? "reports-income"
                          : "reports-expense"
                      }
                    >
                      {transaction.type === "income"
                        ? "+"
                        : "-"}
                      {formatCurrency(transaction.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="reports-footer-note">
        Reports are generated from transactions saved
        in this browser. Subscription charges and
        savings-goal contributions are not automatically
        included unless recorded as transactions.
      </p>
    </div>
  );
}

export default Reports;
