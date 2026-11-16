
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
} from "recharts";

function IncomeExpenseChart() {
  const [transactions, setTransactions] = useState([]);

  // Load saved transactions
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
        console.error("Error loading chart data:", error);
        setTransactions([]);
      }
    };

    loadTransactions();

    window.addEventListener("storage", loadTransactions);

    return () => {
      window.removeEventListener("storage", loadTransactions);
    };
  }, []);

  // Create data for the last six months
  const now = new Date();

  const data = Array.from({ length: 6 }, (_, index) => {
    const monthDate = new Date(
      now.getFullYear(),
      now.getMonth() - 5 + index,
      1
    );

    const month = monthDate.toLocaleString("en-IN", {
      month: "short",
    });

    const year = monthDate.getFullYear();
    const monthNumber = monthDate.getMonth();

    let income = 0;
    let expenses = 0;

    transactions.forEach((transaction) => {
      if (!transaction.date) return;

      // Transaction dates are saved as DD/MM/YYYY
      const parts = transaction.date.split("/");

      if (parts.length !== 3) return;

      const transactionMonth = Number(parts[1]) - 1;
      const transactionYear = Number(parts[2]);
      const transactionAmount = Number(transaction.amount);

      if (!Number.isFinite(transactionAmount)) return;

      if (
        transactionMonth === monthNumber &&
        transactionYear === year
      ) {
        if (transaction.type === "income") {
          income += transactionAmount;
        } else if (transaction.type === "expense") {
          expenses += transactionAmount;
        }
      }
    });

    return {
      month: `${month} ${year}`,
      income,
      expenses,
    };
  });

  const hasTransactions = data.some(
    (item) => item.income > 0 || item.expenses > 0
  );

  return (
    <div
      style={{
        backgroundColor: "#1f2937",
        padding: "24px",
        borderRadius: "12px",
        marginTop: "30px",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <h2>Income vs Expenses</h2>

      <p>
        Monthly financial overview based on your transactions
      </p>

      {!hasTransactions && (
        <p style={{ color: "#9ca3af" }}>
          No transactions recorded in the last six months.
        </p>
      )}

      <div style={{ width: "100%", height: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
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
                `₹${Number(value).toLocaleString("en-IN")}`
              }
            />

            <Legend />

            <Bar
              dataKey="income"
              fill="#10b981"
              name="Income"
            />

            <Bar
              dataKey="expenses"
              fill="#ef4444"
              name="Expenses"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default IncomeExpenseChart;
