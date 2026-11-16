
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  Repeat,
  BarChart3,
  FileText,
  ScanLine,
  TrendingUp,
  Bot,
  Settings,
} from "lucide-react";

import "../styles/Sidebar.css";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/" },
  { name: "Transactions", icon: ArrowLeftRight, path: "/transactions" },
  { name: "Budgets", icon: Wallet, path: "/budgets" },
  { name: "Savings Goals", icon: Target, path: "/savings-goals" },
  { name: "Subscriptions", icon: Repeat, path: "/subscriptions" },
  { name: "Analytics", icon: BarChart3, path: "/analytics" },
  { name: "Reports", icon: FileText, path: "/reports" },
  { name: "Receipt Scanner", icon: ScanLine, path: "/receipt-scanner" },
  { name: "Forecasting", icon: TrendingUp, path: "/forecasting" },
  { name: "AI Assistant", icon: Bot, path: "/ai-assistant" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

function Sidebar({ isOpen = false, onClose = () => {} }) {
  return (
    <aside className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>

      <div className="sidebar-header">
        <h2 className="sidebar-logo">💰 FlowFund</h2>

        <button
          type="button"
          className="sidebar-close-button"
          onClick={onClose}
          aria-label="Close navigation menu"
        >
          ×
        </button>
      </div>

      <nav>
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? "active" : ""}`
              }
              onClick={onClose}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

    </aside>
  );
}

export default Sidebar;

