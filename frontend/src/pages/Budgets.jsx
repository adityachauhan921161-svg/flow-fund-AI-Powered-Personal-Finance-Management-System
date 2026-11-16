
import { useState, useEffect } from "react";
import "../styles/Budgets.css";

function Budgets() {
  const [category, setCategory] = useState("");
  const [limit, setLimit] = useState("");

  const [budgets, setBudgets] = useState(() => {
    try {
      const saved = localStorage.getItem("flowfund_budgets");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading budgets:", error);
      return [];
    }
  });

  const [transactions, setTransactions] = useState([]);

  // Save budgets automatically
  useEffect(() => {
    localStorage.setItem(
      "flowfund_budgets",
      JSON.stringify(budgets)
    );
  }, [budgets]);

  // Load transaction data
  useEffect(() => {
    const loadTransactions = () => {
      try {
        const saved = localStorage.getItem(
          "flowfund_transactions"
        );
        const parsed = saved ? JSON.parse(saved) : [];

        setTransactions(Array.isArray(parsed) ? parsed : []);
      } catch (error) {
        console.error("Error loading transactions:", error);
        setTransactions([]);
      }
    };

    loadTransactions();

    window.addEventListener("storage", loadTransactions);

    return () => {
      window.removeEventListener("storage", loadTransactions);
    };
  }, []);

  const currentMonth = new Date().toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  // Check whether a transaction belongs to this month
  const isCurrentMonth = (dateString) => {
    if (typeof dateString !== "string") return false;

    const parts = dateString.split("/");

    if (parts.length !== 3) return false;

    return (
      Number(parts[1]) === month &&
      Number(parts[2]) === year
    );
  };

  // Calculate monthly spending by category
  const calculateSpent = (budgetCategory) => {
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.category?.trim().toLowerCase() ===
            budgetCategory.trim().toLowerCase() &&
          isCurrentMonth(transaction.date)
      )
      .reduce(
        (total, transaction) =>
          total + (Number(transaction.amount) || 0),
        0
      );
  };

  // Create or update a category budget
  const handleAddBudget = (e) => {
    e.preventDefault();

    const cleanCategory = category.trim();
    const parsedLimit = Number(limit);

    if (
      !cleanCategory ||
      !Number.isFinite(parsedLimit) ||
      parsedLimit <= 0
    ) {
      alert("Please enter a valid category and budget amount.");
      return;
    }

    const existingBudget = budgets.find(
      (budget) =>
        budget.category.toLowerCase() ===
        cleanCategory.toLowerCase()
    );

    if (existingBudget) {
      setBudgets((previous) =>
        previous.map((budget) =>
          budget.id === existingBudget.id
            ? { ...budget, limit: parsedLimit }
            : budget
        )
      );
    } else {
      const newBudget = {
        id: crypto.randomUUID(),
        category: cleanCategory,
        limit: parsedLimit,
      };

      setBudgets((previous) => [
        ...previous,
        newBudget,
      ]);
    }

    setCategory("");
    setLimit("");
  };

  // Delete a budget
  const handleDeleteBudget = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?"
    );

    if (confirmed) {
      setBudgets((previous) =>
        previous.filter((budget) => budget.id !== id)
      );
    }
  };

  const totalBudget = budgets.reduce(
    (total, budget) => total + Number(budget.limit),
    0
  );

  const totalSpent = budgets.reduce(
    (total, budget) =>
      total + calculateSpent(budget.category),
    0
  );

  return (
    <div className="budgets-page">
      <div className="budgets-header">
        <h1>Budget Management</h1>
        <p>
          Create monthly spending limits and monitor your expenses.
        </p>
        <p className="budget-month">{currentMonth}</p>
      </div>

      <div className="budget-summary">
        <div className="budget-summary-card">
          <h3>Total Budget</h3>
          <h2>₹{totalBudget.toLocaleString("en-IN")}</h2>
        </div>

        <div className="budget-summary-card">
          <h3>Total Spent</h3>
          <h2>₹{totalSpent.toLocaleString("en-IN")}</h2>
        </div>

        <div className="budget-summary-card">
          <h3>Remaining Budget</h3>
          <h2>
            ₹{(totalBudget - totalSpent).toLocaleString("en-IN")}
          </h2>
        </div>
      </div>

      <div className="budget-form-card">
        <h2>Create or Update Budget</h2>

        <form onSubmit={handleAddBudget}>
          <label>Category</label>
          <input
            type="text"
            placeholder="e.g. Food, Shopping, Transport"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />

          <label>Monthly Budget Limit (₹)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter budget amount"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            required
          />

          <button type="submit">
            Save Budget
          </button>
        </form>
      </div>

      <div className="budget-list-section">
        <h2>Your Monthly Budgets</h2>

        {budgets.length === 0 ? (
          <p>
            No budgets created yet. Add your first budget above.
          </p>
        ) : (
          <div className="budget-list">
            {budgets.map((budget) => {
              const spent = calculateSpent(budget.category);
              const remaining = budget.limit - spent;
              const percentage = (spent / budget.limit) * 100;
              const progress = Math.min(percentage, 100);

              const status =
                percentage >= 100
                  ? "Exceeded or reached limit"
                  : percentage >= 80
                  ? "Approaching limit"
                  : "Within budget";

              const progressColor =
                percentage >= 100
                  ? "#ef4444"
                  : percentage >= 80
                  ? "#f59e0b"
                  : "#10b981";

              return (
                <div className="budget-item" key={budget.id}>
                  <div className="budget-item-header">
                    <h3>{budget.category}</h3>

                    <button
                      type="button"
                      className="delete-budget-button"
                      onClick={() =>
                        handleDeleteBudget(budget.id)
                      }
                    >
                      Delete
                    </button>
                  </div>

                  <p>
                    ₹{spent.toLocaleString("en-IN")} spent of
                    ₹{budget.limit.toLocaleString("en-IN")}
                  </p>

                  <div className="budget-progress-track">
                    <div
                      className="budget-progress-fill"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: progressColor,
                      }}
                    />
                  </div>

                  <div className="budget-item-footer">
                    <span style={{ color: progressColor }}>
                      {status} ({percentage.toFixed(1)}%)
                    </span>

                    <span>
                      {remaining >= 0
                        ? `₹${remaining.toLocaleString("en-IN")} remaining`
                        : `₹${Math.abs(remaining).toLocaleString("en-IN")} over budget`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Budgets;
