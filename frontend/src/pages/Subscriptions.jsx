
import { useState, useEffect } from "react";
import "../styles/Subscriptions.css";

const emptyForm = {
  name: "",
  amount: "",
  cycle: "monthly",
  renewalDate: "",
  category: "Entertainment",
};

const formatCurrency = (value) =>
  `₹${Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

function Subscriptions() {
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState(null);

  const [subscriptions, setSubscriptions] = useState(() => {
    try {
      const saved = localStorage.getItem(
        "flowfund_subscriptions"
      );
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading subscriptions:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      "flowfund_subscriptions",
      JSON.stringify(subscriptions)
    );
  }, [subscriptions]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const amount = Number(form.amount);

    if (
      !form.name.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      !form.renewalDate
    ) {
      alert("Please enter valid subscription details.");
      return;
    }

    const subscriptionData = {
      name: form.name.trim(),
      amount,
      cycle: form.cycle,
      renewalDate: form.renewalDate,
      category: form.category,
    };

    if (editingId !== null) {
      setSubscriptions((previous) =>
        previous.map((subscription) =>
          subscription.id === editingId
            ? { ...subscription, ...subscriptionData }
            : subscription
        )
      );
    } else {
      setSubscriptions((previous) => [
        {
          id: crypto.randomUUID(),
          ...subscriptionData,
          active: true,
        },
        ...previous,
      ]);
    }

    resetForm();
  };

  const handleEdit = (subscription) => {
    setEditingId(subscription.id);

    setForm({
      name: subscription.name,
      amount: String(subscription.amount),
      cycle: subscription.cycle,
      renewalDate: subscription.renewalDate,
      category: subscription.category,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this subscription?"
      )
    ) {
      setSubscriptions((previous) =>
        previous.filter((subscription) => subscription.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }
    }
  };

  const toggleStatus = (id) => {
    setSubscriptions((previous) =>
      previous.map((subscription) =>
        subscription.id === id
          ? {
              ...subscription,
              active: !subscription.active,
            }
          : subscription
      )
    );
  };

  // Move a renewal date forward until it is today or later.
  const getNextRenewal = (subscription) => {
    const date = new Date(
      `${subscription.renewalDate}T12:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (date < today) {
      if (subscription.cycle === "yearly") {
        const day = date.getDate();
        date.setDate(1);
        date.setFullYear(date.getFullYear() + 1);
        const lastDay = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0
        ).getDate();
        date.setDate(Math.min(day, lastDay));
      } else {
        const day = date.getDate();
        date.setDate(1);
        date.setMonth(date.getMonth() + 1);
        const lastDay = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0
        ).getDate();
        date.setDate(Math.min(day, lastDay));
      }
    }

    return date;
  };

  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.active
  );

  const monthlyCost = activeSubscriptions.reduce(
    (total, subscription) =>
      total +
      (subscription.cycle === "monthly"
        ? Number(subscription.amount)
        : Number(subscription.amount) / 12),
    0
  );

  const yearlyCost = monthlyCost * 12;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = activeSubscriptions
    .map((subscription) => ({
      ...subscription,
      nextRenewal: getNextRenewal(subscription),
    }))
    .filter((subscription) => {
      if (!subscription.nextRenewal) return false;

      const days =
        (subscription.nextRenewal - today) /
        (1000 * 60 * 60 * 24);

      return days >= 0 && days <= 7;
    })
    .sort((a, b) => a.nextRenewal - b.nextRenewal);

  return (
    <div className="subscriptions-page">
      <div className="subscriptions-header">
        <h1>Subscription Management</h1>
        <p>
          Track recurring payments, renewal dates, and
          subscription expenses.
        </p>
      </div>

      {/* Summary */}
      <div className="subscriptions-summary">
        <div className="subscription-summary-card">
          <h3>Active Subscriptions</h3>
          <h2>{activeSubscriptions.length}</h2>
        </div>

        <div className="subscription-summary-card">
          <h3>Monthly Cost (Average)</h3>
          <h2>{formatCurrency(monthlyCost)}</h2>
        </div>

        <div className="subscription-summary-card">
          <h3>Estimated Yearly Cost</h3>
          <h2>{formatCurrency(yearlyCost)}</h2>
        </div>
      </div>

      {/* Subscription Form */}
      <div className="subscription-form-card">
        <h2>
          {editingId !== null
            ? "Edit Subscription"
            : "Add New Subscription"}
        </h2>

        <form onSubmit={handleSubmit}>
          <label>Subscription Name</label>
          <input
            type="text"
            placeholder="e.g. Netflix, Spotify, Amazon Prime"
            value={form.name}
            onChange={(e) =>
              updateField("name", e.target.value)
            }
            required
          />

          <label>Amount (₹)</label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter subscription cost"
            value={form.amount}
            onChange={(e) =>
              updateField("amount", e.target.value)
            }
            required
          />

          <label>Billing Cycle</label>
          <select
            value={form.cycle}
            onChange={(e) =>
              updateField("cycle", e.target.value)
            }
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) =>
              updateField("category", e.target.value)
            }
          >
            <option>Entertainment</option>
            <option>Software</option>
            <option>Education</option>
            <option>Utilities</option>
            <option>Fitness</option>
            <option>Other</option>
          </select>

          <label>Renewal Date</label>
          <input
            type="date"
            value={form.renewalDate}
            onChange={(e) =>
              updateField("renewalDate", e.target.value)
            }
            required
          />

          <button type="submit">
            {editingId !== null
              ? "Update Subscription"
              : "Add Subscription"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="subscription-cancel-button"
              onClick={resetForm}
            >
              Cancel Editing
            </button>
          )}
        </form>
      </div>

      {/* Upcoming Renewals */}
      <div className="subscription-section">
        <h2>Upcoming Renewals (Next 7 Days)</h2>

        {upcoming.length === 0 ? (
          <p className="subscription-muted">
            No upcoming renewals in the next 7 days.
          </p>
        ) : (
          <div className="subscription-upcoming-list">
            {upcoming.map((subscription) => (
              <div
                className="subscription-upcoming-item"
                key={subscription.id}
              >
                <strong>{subscription.name}</strong>
                <span>
                  {subscription.nextRenewal.toLocaleDateString(
                    "en-IN"
                  )}
                  {" — "}
                  {formatCurrency(subscription.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscription List */}
      <div className="subscription-section">
        <h2>Your Subscriptions</h2>

        {subscriptions.length === 0 ? (
          <p className="subscription-muted">
            No subscriptions added yet.
          </p>
        ) : (
          <div className="subscription-list">
            {subscriptions.map((subscription) => {
              const nextRenewal =
                getNextRenewal(subscription);

              return (
                <div
                  className="subscription-item"
                  key={subscription.id}
                >
                  <div className="subscription-item-top">
                    <div>
                      <h3>{subscription.name}</h3>
                      <p>{subscription.category}</p>
                    </div>

                    <span
                      className={
                        subscription.active
                          ? "subscription-status active"
                          : "subscription-status inactive"
                      }
                    >
                      {subscription.active
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>

                  <div className="subscription-details">
                    <p>
                      <strong>Cost:</strong>{" "}
                      {formatCurrency(subscription.amount)}
                    </p>

                    <p>
                      <strong>Billing:</strong>{" "}
                      {subscription.cycle}
                    </p>

                    <p>
                      <strong>Next Renewal:</strong>{" "}
                      {nextRenewal
                        ? nextRenewal.toLocaleDateString(
                            "en-IN"
                          )
                        : "Invalid date"}
                    </p>
                  </div>

                  <div className="subscription-actions">
                    <button
                      type="button"
                      className="subscription-edit-button"
                      onClick={() =>
                        handleEdit(subscription)
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="subscription-toggle-button"
                      onClick={() =>
                        toggleStatus(subscription.id)
                      }
                    >
                      {subscription.active
                        ? "Deactivate"
                        : "Activate"}
                    </button>

                    <button
                      type="button"
                      className="subscription-delete-button"
                      onClick={() =>
                        handleDelete(subscription.id)
                      }
                    >
                      Delete
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

export default Subscriptions;
