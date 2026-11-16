
import { useState, useEffect } from "react";
import "../styles/SavingsGoals.css";

function SavingsGoals() {
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");

  // Load saved goals
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "flowfund_savings_goals"
      );

      const parsed = saved ? JSON.parse(saved) : [];

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading savings goals:", error);
      return [];
    }
  });

  // Save goals automatically
  useEffect(() => {
    localStorage.setItem(
      "flowfund_savings_goals",
      JSON.stringify(goals)
    );
  }, [goals]);

  // Create savings goal
  const handleAddGoal = (e) => {
    e.preventDefault();

    const amount = Number(targetAmount);

    if (
      !goalName.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      alert("Please enter a valid goal name and target amount.");
      return;
    }

    const newGoal = {
      id: crypto.randomUUID(),
      name: goalName.trim(),
      target: amount,
      saved: 0,
      targetDate,
      createdAt: new Date().toISOString(),
    };

    setGoals((previous) => [...previous, newGoal]);

    setGoalName("");
    setTargetAmount("");
    setTargetDate("");
  };

  // Add money to an existing goal
  const handleAddSavings = (id) => {
    const goal = goals.find((item) => item.id === id);

    if (!goal) return;

    const input = window.prompt(
      `How much money do you want to add to "${goal.name}"?`
    );

    if (input === null) return;

    if (!input.trim()) {
      alert("Please enter an amount.");
      return;
    }

    const amount = Number(input);

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Please enter a valid positive amount.");
      return;
    }

    setGoals((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, saved: item.saved + amount }
          : item
      )
    );
  };

  // Withdraw money from a goal
  const handleWithdrawSavings = (id) => {
    const goal = goals.find((item) => item.id === id);

    if (!goal || goal.saved <= 0) return;

    const input = window.prompt(
      `How much money do you want to withdraw from "${goal.name}"?`
    );

    if (input === null) return;

    if (!input.trim()) {
      alert("Please enter an amount.");
      return;
    }

    const amount = Number(input);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > goal.saved
    ) {
      alert("Please enter a valid amount within your savings.");
      return;
    }

    setGoals((previous) =>
      previous.map((item) =>
        item.id === id
          ? { ...item, saved: item.saved - amount }
          : item
      )
    );
  };

  // Delete savings goal
  const handleDeleteGoal = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this savings goal?"
    );

    if (confirmed) {
      setGoals((previous) =>
        previous.filter((goal) => goal.id !== id)
      );
    }
  };

  // Calculate totals
  const totalTarget = goals.reduce(
    (total, goal) => total + goal.target,
    0
  );

  const totalSaved = goals.reduce(
    (total, goal) => total + goal.saved,
    0
  );

  const totalRemaining = Math.max(
    totalTarget - totalSaved,
    0
  );

  const formatCurrency = (amount) =>
    `₹${amount.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="savings-page">
      <div className="savings-header">
        <h1>Savings Goals</h1>
        <p>
          Set financial targets and track your savings progress.
        </p>
      </div>

      {/* Savings Summary */}
      <div className="savings-summary">
        <div className="savings-summary-card">
          <h3>Total Savings Target</h3>
          <h2>{formatCurrency(totalTarget)}</h2>
        </div>

        <div className="savings-summary-card">
          <h3>Total Saved Toward Goals</h3>
          <h2>{formatCurrency(totalSaved)}</h2>
        </div>

        <div className="savings-summary-card">
          <h3>Remaining Target</h3>
          <h2>{formatCurrency(totalRemaining)}</h2>
        </div>
      </div>

      {/* Create Savings Goal */}
      <div className="savings-form-card">
        <h2>Create New Savings Goal</h2>

        <form onSubmit={handleAddGoal}>
          <label>Goal Name</label>
          <input
            type="text"
            placeholder="e.g. New Laptop, Vacation, Emergency Fund"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
            required
          />

          <label>Target Amount (₹)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter target amount"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />

          <label>Target Date (Optional)</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          <button type="submit">
            Create Savings Goal
          </button>
        </form>
      </div>

      {/* Savings Goals List */}
      <div className="savings-list-section">
        <h2>Your Savings Goals</h2>

        {goals.length === 0 ? (
          <p>
            No savings goals created yet.
            Create your first goal above.
          </p>
        ) : (
          <div className="savings-list">
            {goals.map((goal) => {
              const percentage =
                (goal.saved / goal.target) * 100;

              const progress = Math.min(percentage, 100);

              const remaining = Math.max(
                goal.target - goal.saved,
                0
              );

              const completed = goal.saved >= goal.target;

              return (
                <div className="savings-item" key={goal.id}>
                  <div className="savings-item-header">
                    <div>
                      <h3>{goal.name}</h3>

                      {goal.targetDate && (
                        <p className="savings-date">
                          Target Date: {goal.targetDate}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      className="savings-delete-button"
                      onClick={() =>
                        handleDeleteGoal(goal.id)
                      }
                    >
                      Delete
                    </button>
                  </div>

                  <p className="savings-amount-text">
                    {formatCurrency(goal.saved)} saved of{" "}
                    {formatCurrency(goal.target)}
                  </p>

                  <div className="savings-progress-track">
                    <div
                      className="savings-progress-fill"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: completed
                          ? "#10b981"
                          : "#8b5cf6",
                      }}
                    />
                  </div>

                  <div className="savings-item-footer">
                    <span>
                      {percentage.toFixed(1)}% completed
                    </span>

                    <span>
                      {completed
                        ? "Goal Achieved!"
                        : `${formatCurrency(remaining)} remaining`}
                    </span>
                  </div>

                  <div className="savings-actions">
                    <button
                      type="button"
                      className="savings-add-button"
                      onClick={() =>
                        handleAddSavings(goal.id)
                      }
                    >
                      + Add Savings
                    </button>

                    <button
                      type="button"
                      className="savings-withdraw-button"
                      onClick={() =>
                        handleWithdrawSavings(goal.id)
                      }
                      disabled={goal.saved <= 0}
                    >
                      Withdraw
                    </button>
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

export default SavingsGoals;
