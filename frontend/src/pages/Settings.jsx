
import { useState } from "react";
import {
  User,
  Settings as SettingsIcon,
  Bell,
  Database,
  Save,
  Download,
  Trash2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

const SETTINGS_KEY = "flowfund_settings";

const DEFAULT_SETTINGS = {
  name: "",
  email: "",
  currency: "INR",
  notifications: {
    budgetAlerts: true,
    savingsReminders: true,
    subscriptionReminders: true,
  },
};

const DATA_KEYS = [
  "flowfund_transactions",
  "flowfund_budgets",
  "flowfund_savings_goals",
  "flowfund_subscriptions",
  SETTINGS_KEY,
];

function loadSettings() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(SETTINGS_KEY) || "null"
    );

    return {
      ...DEFAULT_SETTINGS,
      ...(stored || {}),
      notifications: {
        ...DEFAULT_SETTINGS.notifications,
        ...(stored?.notifications || {}),
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const cardStyle = {
  background: "#1e293b",
  borderRadius: "16px",
  padding: "25px",
  marginBottom: "24px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  marginTop: "8px",
  background: "#0f172a",
  color: "#f8fafc",
  border: "1px solid #475569",
  borderRadius: "8px",
  fontSize: "15px",
  boxSizing: "border-box",
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "12px 18px",
  border: "none",
  borderRadius: "8px",
  color: "#ffffff",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
};

function Settings() {
  const [settings, setSettings] = useState(loadSettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const updateField = (field, value) => {
    setSettings((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setError("");
  };

  const updateNotification = (field) => {
    setSettings((previous) => ({
      ...previous,
      notifications: {
        ...previous.notifications,
        [field]: !previous.notifications[field],
      },
    }));

    setMessage("");
    setError("");
  };

  const saveSettings = () => {
    if (
      settings.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        settings.email.trim()
      )
    ) {
      setError("Please enter a valid email address.");
      setMessage("");
      return;
    }

    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          ...settings,
          name: settings.name.trim(),
          email: settings.email.trim(),
        })
      );

      setError("");
      setMessage("Settings saved successfully!");
    } catch {
      setError("Unable to save settings.");
      setMessage("");
    }
  };

  const exportData = () => {
    try {
      const exportObject = {
        application: "FlowFund",
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        data: {},
      };

      DATA_KEYS.forEach((key) => {
        const stored = localStorage.getItem(key);

        if (stored !== null) {
          exportObject.data[key] = JSON.parse(stored);
        }
      });

      const blob = new Blob(
        [JSON.stringify(exportObject, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `FlowFund_Backup_${
        new Date().toISOString().split("T")[0]
      }.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      setMessage("FlowFund backup downloaded successfully!");
      setError("");
    } catch {
      setError("Unable to export FlowFund data.");
      setMessage("");
    }
  };

  const resetData = () => {
    try {
      DATA_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });

      setSettings(DEFAULT_SETTINGS);
      setConfirmReset(false);
      setError("");
      setMessage(
        "FlowFund data cleared successfully. Refresh the app to update all pages."
      );
    } catch {
      setError("Unable to clear FlowFund data.");
      setMessage("");
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "#f8fafc",
        maxWidth: "950px",
        margin: "0 auto",
      }}
    >
      <h1>Settings</h1>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: "30px",
        }}
      >
        Manage your FlowFund profile, preferences,
        notifications, and financial data.
      </p>

      {message && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: "#064e3b",
            color: "#6ee7b7",
          }}
        >
          <CheckCircle size={20} />
          {message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: "#7f1d1d",
            color: "#fecaca",
          }}
        >
          {error}
        </div>
      )}

      {/* PROFILE SETTINGS */}
      <section style={cardStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <User size={23} color="#60a5fa" />
          Profile Settings
        </h2>

        <p style={{ color: "#94a3b8" }}>
          Personalize your FlowFund experience.
        </p>

        <div style={{ marginTop: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "20px",
            }}
          >
            Full Name
            <input
              type="text"
              value={settings.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
              placeholder="Enter your full name"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block" }}>
            Email Address
            <input
              type="email"
              value={settings.email}
              onChange={(event) =>
                updateField("email", event.target.value)
              }
              placeholder="Enter your email address"
              style={inputStyle}
            />
          </label>
        </div>
      </section>

      {/* APPLICATION PREFERENCES */}
      <section style={cardStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <SettingsIcon
            size={23}
            color="#a78bfa"
          />
          Application Preferences
        </h2>

        <p style={{ color: "#94a3b8" }}>
          Configure your preferred display options.
        </p>

        <label
          style={{
            display: "block",
            marginTop: "20px",
          }}
        >
          Currency
          <select
            value={settings.currency}
            onChange={(event) =>
              updateField(
                "currency",
                event.target.value
              )
            }
            style={inputStyle}
          >
            <option value="INR">
              INR — Indian Rupee (₹)
            </option>
          </select>
        </label>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "13px",
            marginTop: "10px",
          }}
        >
          FlowFund currently supports INR.
          Additional currencies can be added later.
        </p>
      </section>

      {/* NOTIFICATION PREFERENCES */}
      <section style={cardStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Bell size={23} color="#fbbf24" />
          Notification Preferences
        </h2>

        <p style={{ color: "#94a3b8" }}>
          Choose which reminders you would like
          FlowFund to use.
        </p>

        {[
          {
            key: "budgetAlerts",
            title: "Budget Alerts",
            description:
              "Preference for budget limit warnings.",
          },
          {
            key: "savingsReminders",
            title: "Savings Reminders",
            description:
              "Preference for savings goal reminders.",
          },
          {
            key: "subscriptionReminders",
            title: "Subscription Reminders",
            description:
              "Preference for upcoming renewal reminders.",
          },
        ].map((item) => (
          <label
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "20px",
              padding: "16px 0",
              borderBottom: "1px solid #334155",
              cursor: "pointer",
            }}
          >
            <span>
              <strong>{item.title}</strong>
              <span
                style={{
                  display: "block",
                  color: "#94a3b8",
                  fontSize: "13px",
                  marginTop: "5px",
                }}
              >
                {item.description}
              </span>
            </span>

            <input
              type="checkbox"
              checked={
                settings.notifications[item.key]
              }
              onChange={() =>
                updateNotification(item.key)
              }
              style={{
                width: "20px",
                height: "20px",
                accentColor: "#10b981",
                cursor: "pointer",
              }}
            />
          </label>
        ))}

        <p
          style={{
            color: "#94a3b8",
            fontSize: "13px",
            marginTop: "15px",
          }}
        >
          These options save your notification preferences.
          Automatic notifications are not enabled yet.
        </p>
      </section>

      {/* SAVE SETTINGS */}
      <div style={{ marginBottom: "30px" }}>
        <button
          type="button"
          onClick={saveSettings}
          style={{
            ...buttonStyle,
            background: "#10b981",
          }}
        >
          <Save size={19} />
          Save Settings
        </button>
      </div>

      {/* DATA MANAGEMENT */}
      <section style={cardStyle}>
        <h2
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Database size={23} color="#38bdf8" />
          Data Management
        </h2>

        <p style={{ color: "#94a3b8" }}>
          Download a backup of your FlowFund data
          or clear your saved information.
        </p>

        <div
          style={{
            display: "flex",
            gap: "15px",
            flexWrap: "wrap",
            marginTop: "22px",
          }}
        >
          <button
            type="button"
            onClick={exportData}
            style={{
              ...buttonStyle,
              background: "#2563eb",
            }}
          >
            <Download size={19} />
            Export Data
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmReset(true);
              setError("");
              setMessage("");
            }}
            style={{
              ...buttonStyle,
              background: "#dc2626",
            }}
          >
            <Trash2 size={19} />
            Reset All Data
          </button>
        </div>

        {confirmReset && (
          <div
            style={{
              border: "1px solid #ef4444",
              borderRadius: "10px",
              padding: "20px",
              marginTop: "20px",
            }}
          >
            <h3
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#fca5a5",
              }}
            >
              <AlertTriangle size={21} />
              Confirm Data Reset
            </h3>

            <p style={{ color: "#cbd5e1" }}>
              This will permanently remove your
              transactions, budgets, savings goals,
              subscriptions, and saved settings
              from this browser.
            </p>

            <p style={{ color: "#fca5a5" }}>
              Export a backup first if you want
              to keep your data.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "15px",
              }}
            >
              <button
                type="button"
                onClick={resetData}
                style={{
                  ...buttonStyle,
                  background: "#dc2626",
                }}
              >
                Yes, Delete All Data
              </button>

              <button
                type="button"
                onClick={() =>
                  setConfirmReset(false)
                }
                style={{
                  ...buttonStyle,
                  background: "#475569",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default Settings;
