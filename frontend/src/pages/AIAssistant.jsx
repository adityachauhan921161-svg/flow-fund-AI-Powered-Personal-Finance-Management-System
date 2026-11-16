
import { useState } from "react";
import ReactMarkdown from "react-markdown";

function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // Read saved transactions
  const getTransactions = () => {
    try {
      const saved = localStorage.getItem(
        "flowfund_transactions"
      );

      const transactions = saved
        ? JSON.parse(saved)
        : [];

      return Array.isArray(transactions)
        ? transactions
        : [];
    } catch (error) {
      console.error("Error loading transactions:", error);
      return [];
    }
  };

  // Read saved budgets
  const getBudgets = () => {
    try {
      const saved = localStorage.getItem(
        "flowfund_budgets"
      );

      const budgets = saved
        ? JSON.parse(saved)
        : [];

      return Array.isArray(budgets)
        ? budgets
        : [];
    } catch (error) {
      console.error("Error loading budgets:", error);
      return [];
    }
  };

  // Read saved savings goals
  const getSavingsGoals = () => {
    try {
      const saved = localStorage.getItem(
        "flowfund_savings_goals"
      );

      const goals = saved
        ? JSON.parse(saved)
        : [];

      return Array.isArray(goals)
        ? goals
        : [];
    } catch (error) {
      console.error("Error loading savings goals:", error);
      return [];
    }
  };

  // Send message to Gemini AI
  const sendMessage = async (e) => {
    e.preventDefault();

    const question = input.trim();

    if (!question || loading) return;

    // Display user message
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        text: question,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      // Get latest saved financial data
      const transactions = getTransactions();
      const budgets = getBudgets();
      const savingsGoals = getSavingsGoals();

      // Send financial data to backend
      const response = await fetch(
        "http://localhost:3000/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
            financialData: {
              transactions: transactions,
              budgets: budgets,
              savingsGoals: savingsGoals,
            },
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to get AI response."
        );
      }

      // Display AI response
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text:
            data.reply ||
            "No response received.",
        },
      ]);
    } catch (error) {
      console.error("AI Assistant error:", error);

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Error: " + error.message,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        width: "100%",
        maxWidth: "1000px",
        minWidth: 0,
        margin: "0 auto",
        boxSizing: "border-box",
        textAlign: "left",
      }}
    >
      <h1>FlowFund AI Assistant</h1>

      <p>
        Ask questions about your transactions,
        budgets, savings goals, spending,
        or personal finances.
      </p>

      {/* Chat messages */}
      <div
        style={{
          backgroundColor: "#1f2937",
          borderRadius: "12px",
          padding: "20px",
          minHeight: "350px",
          marginTop: "25px",
          marginBottom: "20px",
          width: "100%",
          minWidth: 0,
          boxSizing: "border-box",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#9ca3af" }}>
            Hello! I'm FlowFund AI.
            How can I help you today?
          </p>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              marginBottom: "15px",
              padding: "16px",
              borderRadius: "10px",
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              overflowWrap: "anywhere",
              textAlign: "left",
              backgroundColor:
                message.role === "user"
                  ? "#2563eb"
                  : "#374151",
            }}
          >
            <strong>
              {message.role === "user"
                ? "You"
                : "FlowFund AI"}
              :
            </strong>

            <div
              style={{
                overflowWrap: "anywhere",
                textAlign: "left",
                lineHeight: "1.7",
                marginTop: "10px",
              }}
            >
              {message.role === "assistant" ? (
                <ReactMarkdown>
                  {message.text}
                </ReactMarkdown>
              ) : (
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    margin: 0,
                  }}
                >
                  {message.text}
                </p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <p style={{ color: "#9ca3af" }}>
            FlowFund AI is thinking...
          </p>
        )}
      </div>

      {/* Message input */}
      <form
        onSubmit={sendMessage}
        style={{
          display: "flex",
          gap: "10px",
          width: "100%",
          minWidth: 0,
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          placeholder="Ask FlowFund AI anything..."
          style={{
            flex: 1,
            minWidth: 0,
            padding: "14px",
            borderRadius: "8px",
            border: "1px solid #4b5563",
            backgroundColor: "#111827",
            color: "white",
            boxSizing: "border-box",
          }}
        />

        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: "12px 22px",
            backgroundColor: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </form>
    </div>
  );
}

export default AIAssistant;
