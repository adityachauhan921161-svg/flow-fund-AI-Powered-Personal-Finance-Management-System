
import "./App.css";

import { Menu } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

// Lazy-loaded pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budgets = lazy(() => import("./pages/Budgets"));
const SavingsGoals = lazy(() => import("./pages/SavingGoals"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./pages/Reports"));
const ReceiptScanner = lazy(() => import("./pages/ReceiptScanner"));
const Forecasting = lazy(() => import("./pages/Forecasting"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const Settings = lazy(() => import("./pages/Settings"));

function App() {
  const [message, setMessage] = useState("Loading...");
  const [status, setStatus] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/message")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        setMessage(data.message);
        setStatus(data.status);
      })
      .catch((error) => {
        console.error(error);
        setMessage("Unable to connect to backend");
        setStatus("error");
      });
  }, []);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding: "20px",
        }}
      >
        <button
          className="mobile-menu-button"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>

        <Suspense
          fallback={
            <div
              style={{
                padding: "40px",
                textAlign: "center",
              }}
            >
              <h3>Loading FlowFund...</h3>
              <p>Please wait while the page loads.</p>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/savings-goals" element={<SavingsGoals />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route
              path="/receipt-scanner"
              element={<ReceiptScanner />}
            />
            <Route path="/forecasting" element={<Forecasting />} />
            <Route path="/ai-assistant" element={<AIAssistant />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Suspense>

        <div
          style={{
            marginTop: "30px",
            textAlign: "center",
          }}
        >
          <p>{message}</p>
          <p>Status: {status}</p>
        </div>
      </main>
    </div>
  );
}

export default App;
