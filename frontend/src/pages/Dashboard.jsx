import { useState, useEffect } from "react";
import "../styles/Dashboard.css";
import IncomeExpenseChart from "../components/IncomeExpenseChart";

import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  HeartPulse,
} from "lucide-react";

// Safely load saved data
function loadSavedArray(key) {
  try {
    const saved = localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return [];
  }
}

// Convert an amount to a valid positive number
function validAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

// Calculate Financial Health Score
function calculateHealthScore(transactions, budgets, savingsGoals) {
  const components = [];
  let earnedPoints = 0;
  let availablePoints = 0;

  const income = transactions
    .filter((item) => item?.type === "income")
    .reduce((sum, item) => sum + validAmount(item.amount), 0);

  const expenses = transactions
    .filter((item) => item?.type === "expense")
    .reduce((sum, item) => sum + validAmount(item.amount), 0);

  // 1. Income vs Expenses — 40 points
  if (transactions.length > 0 && income > 0) {
    const ratio = Math.max(
      0,
      Math.min(1, (income - expenses) / income)
    );

    const points = Math.round(ratio * 40);

    earnedPoints += points;
    availablePoints += 40;

    components.push({
      name: "Income vs Expenses",
      points,
      maximum: 40,
    });
  } else {
    components.push({
      name: "Income vs Expenses",
      points: null,
      maximum: 40,
    });
  }

  // 2. Monthly Budget Management — 30 points
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const validBudgets = budgets.filter(
    (budget) =>
      typeof budget?.category === "string" &&
      budget.category.trim() &&
      validAmount(budget.limit) > 0
  );

  if (validBudgets.length > 0) {
    const scores = validBudgets.map((budget) => {
      const category = budget.category.trim().toLowerCase();
      const limit = Number(budget.limit);

      const spent = transactions
        .filter((transaction) => {
          if (transaction?.type !== "expense") return false;

          const transactionCategory =
            typeof transaction.category === "string"
              ? transaction.category.trim().toLowerCase()
              : "";

          const parts =
            typeof transaction.date === "string"
              ? transaction.date.split("/")
              : [];

          return (
            transactionCategory === category &&
            parts.length === 3 &&
            Number(parts[1]) === month &&
            Number(parts[2]) === year
          );
        })
        .reduce(
          (sum, transaction) =>
            sum + validAmount(transaction.amount),
          0
        );

      const percentageUsed = (spent / limit) * 100;

      if (percentageUsed <= 80) return 30;
      if (percentageUsed <= 100) return 20;

      return Math.max(
        0,
        Math.round(20 - (percentageUsed - 100) * 0.2)
      );
    });

    const points = Math.round(
      scores.reduce((sum, score) => sum + score, 0) /
        scores.length
    );

    earnedPoints += points;
    availablePoints += 30;

    components.push({
      name: "Monthly Budget Management",
      points,
      maximum: 30,
    });
  } else {
    components.push({
      name: "Monthly Budget Management",
      points: null,
      maximum: 30,
    });
  }

  // 3. Savings Goal Progress — 30 points
  const validGoals = savingsGoals.filter(
    (goal) =>
      typeof goal?.name === "string" &&
      goal.name.trim() &&
      validAmount(goal.target) > 0
  );

  if (validGoals.length > 0) {
    const totalTarget = validGoals.reduce(
      (sum, goal) => sum + Number(goal.target),
      0
    );

    const totalSaved = validGoals.reduce(
      (sum, goal) => {
        const saved = Number(goal.saved);
        return sum +
          (Number.isFinite(saved) && saved >= 0 ? saved : 0);
      },
      0
    );

    const ratio = Math.max(
      0,
      Math.min(1, totalSaved / totalTarget)
    );

    const points = Math.round(ratio * 30);

    earnedPoints += points;
    availablePoints += 30;

    components.push({
      name: "Savings Goal Progress",
      points,
      maximum: 30,
    });
  } else {
    components.push({
      name: "Savings Goal Progress",
      points: null,
      maximum: 30,
    });
  }

  const score =
    availablePoints > 0
      ? Math.round((earnedPoints / availablePoints) * 100)
      : null;

  return {
    score,
    components,
    isPartial: availablePoints < 100,
  };
}

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);

  // Load all financial data from localStorage
  useEffect(() => {
    const loadData = () => {
      setTransactions(
        loadSavedArray("flowfund_transactions")
      );

      setBudgets(
        loadSavedArray("flowfund_budgets")
      );

      setSavingsGoals(
        loadSavedArray("flowfund_savings_goals")
      );
    };

    loadData();

    window.addEventListener("storage", loadData);
    window.addEventListener("focus", loadData);

    return () => {
      window.removeEventListener("storage", loadData);
      window.removeEventListener("focus", loadData);
    };
  }, []);

  // Current month and year
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Convert transaction date (DD/MM/YYYY)
  const isCurrentMonth = (dateString) => {
    if (typeof dateString !== "string") return false;

    const parts = dateString.split("/");

    if (parts.length !== 3) return false;

    const month = Number(parts[1]) - 1;
    const year = Number(parts[2]);

    return month === currentMonth && year === currentYear;
  };

  // Calculate total income
  const totalIncome = transactions
    .filter((transaction) => transaction?.type === "income")
    .reduce(
      (total, transaction) =>
        total + validAmount(transaction.amount),
      0
    );

  // Calculate total expenses
  const totalExpenses = transactions
    .filter((transaction) => transaction?.type === "expense")
    .reduce(
      (total, transaction) =>
        total + validAmount(transaction.amount),
      0
    );

  // Calculate monthly income
  const monthlyIncome = transactions
    .filter(
      (transaction) =>
        transaction?.type === "income" &&
        isCurrentMonth(transaction.date)
    )
    .reduce(
      (total, transaction) =>
        total + validAmount(transaction.amount),
      0
    );

  // Calculate monthly expenses
  const monthlyExpenses = transactions
    .filter(
      (transaction) =>
        transaction?.type === "expense" &&
        isCurrentMonth(transaction.date)
    )
    .reduce(
      (total, transaction) =>
        total + validAmount(transaction.amount),
      0
    );

  const totalBalance = totalIncome - totalExpenses;
  const totalSavings = totalBalance;

  // Calculate Financial Health Score
  const health = calculateHealthScore(
    transactions,
    budgets,
    savingsGoals
  );

  const cards = [
    {
      title: "Total Balance",
      amount: totalBalance,
      icon: Wallet,
      color: "#3b82f6",
    },
    {
      title: "Monthly Income",
      amount: monthlyIncome,
      icon: TrendingUp,
      color: "#10b981",
    },
    {
      title: "Monthly Expenses",
      amount: monthlyExpenses,
      icon: TrendingDown,
      color: "#ef4444",
    },
    {
      title: "Net Savings",
      amount: totalSavings,
      icon: PiggyBank,
      color: "#a855f7",
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Financial Dashboard</h1>
        <p>Welcome to FlowFund!</p>
        <p>
          Your financial overview based on recorded transactions.
        </p>
      </div>

      {/* Existing financial cards */}
      <div className="dashboard-cards">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.title} className="dashboard-card">
              <Icon size={28} color={card.color} />

              <h3>{card.title}</h3>

              <h2>
                ₹{card.amount.toLocaleString("en-IN")}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Existing income and expense chart */}
      <IncomeExpenseChart />

      {/* New Financial Health Score section */}
      <section
        style={{
          marginTop: "30px",
          padding: "24px",
          background: "#1e293b",
          borderRadius: "16px",
          color: "#f8fafc",
        }}
      >
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "12px",
          }}
        >
          <HeartPulse size={28} color="#10b981" />
          Financial Health Score
        </h2>

        <p style={{ color: "#94a3b8", marginBottom: "20px" }}>
          Your FlowFund financial planning indicator
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: "150px",
              height: "150px",
              borderRadius: "50%",
              background:
                health.score === null
                  ? "#475569"
                  : `conic-gradient(
                      #10b981 ${health.score}%,
                      #334155 ${health.score}% 100%
                    )`,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "125px",
                height: "125px",
                borderRadius: "50%",
                background: "#1e293b",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <span
                style={{
                  fontSize: "38px",
                  fontWeight: "bold",
                }}
              >
                {health.score === null
                  ? "N/A"
                  : health.score}
              </span>

              <span style={{ color: "#94a3b8" }}>
                out of 100
              </span>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: "220px" }}>
            {health.components.map((component) => (
              <div
                key={component.name}
                style={{ marginBottom: "16px" }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "12px",
                    marginBottom: "6px",
                  }}
                >
                  <span>{component.name}</span>
                  <strong>
                    {component.points === null
                      ? "N/A"
                      : `${component.points}/${component.maximum}`}
                  </strong>
                </div>

                <div
                  style={{
                    height: "8px",
                    background: "#334155",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${
                        component.points === null
                          ? 0
                          : (component.points /
                              component.maximum) *
                            100
                      }%`,
                      background: "#10b981",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {health.isPartial && (
          <p style={{ color: "#fbbf24", marginTop: "12px" }}>
            Some financial information is missing.
            Your score is based only on available data.
          </p>
        )}

        <p
          style={{
            marginTop: "20px",
            fontSize: "13px",
            color: "#94a3b8",
            lineHeight: "1.6",
          }}
        >
          This is an experimental FlowFund planning indicator,
          not a credit score or a verified financial health
          assessment. It does not account for debts, assets,
          essential expenses, or income stability.
        </p>
      </section>
    </div>
  );
}

export default Dashboard;