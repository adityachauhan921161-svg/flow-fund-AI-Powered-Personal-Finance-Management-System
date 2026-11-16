
import { useState, useEffect } from "react";
import "../styles/Transactions.css";

function Transactions() {
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Load saved transactions
  const [transactions, setTransactions] = useState(() => {
    try {
      const savedTransactions = localStorage.getItem(
        "flowfund_transactions"
      );

      const parsed = savedTransactions
        ? JSON.parse(savedTransactions)
        : [];

      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Error loading transactions:", error);
      return [];
    }
  });

  // Save transactions automatically
  useEffect(() => {
    localStorage.setItem(
      "flowfund_transactions",
      JSON.stringify(transactions)
    );
  }, [transactions]);

  // Clear the form
  const resetForm = () => {
    setType("expense");
    setAmount("");
    setCategory("");
    setDescription("");
    setEditingId(null);
  };

  // Add or update transaction
  const handleAddTransaction = (e) => {
    e.preventDefault();

    const parsedAmount = Number(amount);

    if (
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !category.trim()
    ) {
      alert("Please enter a valid amount and category.");
      return;
    }

    if (editingId !== null) {
      // Update existing transaction
      setTransactions((previous) =>
        previous.map((transaction) =>
          transaction.id === editingId
            ? {
                ...transaction,
                type,
                amount: parsedAmount,
                category: category.trim(),
                description: description.trim(),
              }
            : transaction
        )
      );
    } else {
      // Add new transaction
      const newTransaction = {
        id: crypto.randomUUID(),
        type,
        amount: parsedAmount,
        category: category.trim(),
        description: description.trim(),
        date: new Date().toLocaleDateString("en-IN"),
      };

      setTransactions((previous) => [
        newTransaction,
        ...previous,
      ]);
    }

    resetForm();
  };

  // Delete a transaction
  const handleDeleteTransaction = (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (confirmDelete) {
      setTransactions((previous) =>
        previous.filter(
          (transaction) => transaction.id !== id
        )
      );

      if (editingId === id) {
        resetForm();
      }
    }
  };

  // Edit a transaction
  const handleEditTransaction = (transaction) => {
    setEditingId(transaction.id);
    setType(transaction.type);
    setAmount(String(transaction.amount));
    setCategory(transaction.category);
    setDescription(transaction.description || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="transactions-page">
      <h1>Transactions</h1>
      <p>Manage your income and expenses.</p>

      {/* Transaction Form */}
      <div className="transaction-form">
        <h2>
          {editingId !== null
            ? "Edit Transaction"
            : "Add New Transaction"}
        </h2>

        <form onSubmit={handleAddTransaction}>
          <label>Transaction Type</label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <label>Amount (₹)</label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <label>Category</label>

          <input
            type="text"
            placeholder="e.g. Food, Salary, Shopping"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          />

          <label>Description</label>

          <input
            type="text"
            placeholder="Enter description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button type="submit">
            {editingId !== null
              ? "Update Transaction"
              : "Add Transaction"}
          </button>

          {editingId !== null && (
            <button
              type="button"
              className="cancel-edit-button"
              onClick={resetForm}
            >
              Cancel Editing
            </button>
          )}
        </form>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <h2>Transaction History</h2>

        {transactions.length === 0 ? (
          <p>No transactions added yet.</p>
        ) : (
          <div className="transaction-table-wrapper">
            <table className="transaction-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>{transaction.date}</td>

                    <td>{transaction.type}</td>

                    <td>{transaction.category}</td>

                    <td>
                      {transaction.description || "—"}
                    </td>

                    <td
                      className={
                        transaction.type === "income"
                          ? "income-amount"
                          : "expense-amount"
                      }
                    >
                      {transaction.type === "income"
                        ? "+"
                        : "-"}
                      ₹
                      {Number(
                        transaction.amount
                      ).toLocaleString("en-IN")}
                    </td>

                    <td>
                      <div className="transaction-actions">
                        <button
                          type="button"
                          className="edit-transaction-button"
                          onClick={() =>
                            handleEditTransaction(transaction)
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="delete-transaction-button"
                          onClick={() =>
                            handleDeleteTransaction(
                              transaction.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transactions;
