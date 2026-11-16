
import { useState } from "react";
import {
  Upload,
  ScanLine,
  X,
  Save,
  CheckCircle,
} from "lucide-react";

const API_URL = "http://localhost:3000";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Healthcare",
  "Education",
  "Utilities",
  "Other",
];

const initialDetails = {
  merchant: "",
  date: "",
  amount: "",
  category: "Other",
  description: "",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid #475569",
  background: "#0f172a",
  color: "#f8fafc",
  fontSize: "15px",
  boxSizing: "border-box",
  marginTop: "8px",
};

const labelStyle = {
  display: "block",
  color: "#cbd5e1",
  marginBottom: "18px",
  textAlign: "left",
};

function convertDateToInput(dateString) {
  if (!dateString) return "";

  const match =
    /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateString);

  if (!match) return "";

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function convertDateToStorage(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function ReceiptScanner() {
  const [receipt, setReceipt] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const [details, setDetails] = useState(null);
  const [saved, setSaved] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setDetails(null);
    setSaved(false);

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError(
        "Please upload a JPG, PNG, or WEBP image."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Receipt image must be smaller than 5 MB."
      );
      event.target.value = "";
      return;
    }

    setReceipt(file);

    const reader = new FileReader();

    reader.onload = () => {
      setPreview(reader.result);
    };

    reader.onerror = () => {
      setError("Unable to preview this image.");
      setReceipt(null);
      setPreview(null);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const removeReceipt = () => {
    if (scanning) return;

    setReceipt(null);
    setPreview(null);
    setError("");
    setDetails(null);
    setSaved(false);
  };

  const handleScan = async () => {
    if (!receipt || scanning) return;

    setError("");
    setDetails(null);
    setSaved(false);
    setScanning(true);

    try {
      const formData = new FormData();
      formData.append("receipt", receipt);

      const response = await fetch(
        `${API_URL}/api/ai/scan-receipt`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to scan receipt."
        );
      }

      if (!data.receipt) {
        throw new Error(
          "No receipt details were returned."
        );
      }

      setDetails({
        merchant: data.receipt.merchant || "",
        date: convertDateToInput(
          data.receipt.date
        ),
        amount:
          data.receipt.amount == null
            ? ""
            : String(data.receipt.amount),
        category: CATEGORIES.includes(
          data.receipt.category
        )
          ? data.receipt.category
          : "Other",
        description:
          data.receipt.description || "",
      });
    } catch (err) {
      setError(
        err.message ||
          "Something went wrong while scanning."
      );
    } finally {
      setScanning(false);
    }
  };

  const handleDetailChange = (field, value) => {
    setDetails((previous) => ({
      ...previous,
      [field]: value,
    }));

    setSaved(false);
    setError("");
  };

  const handleSave = () => {
    if (!details || saved) return;

    const amount = Number(details.amount);

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      setError(
        "Please enter a valid amount greater than zero."
      );
      return;
    }

    if (!details.date) {
      setError(
        "Please select the transaction date."
      );
      return;
    }

    const date = new Date(
      `${details.date}T12:00:00`
    );

    if (Number.isNaN(date.getTime())) {
      setError(
        "Please enter a valid transaction date."
      );
      return;
    }

    if (!details.merchant.trim()) {
      setError(
        "Please enter the merchant name."
      );
      return;
    }

    const description =
      details.description.trim() ||
      `Receipt from ${details.merchant.trim()}`;

    const transaction = {
      id: crypto.randomUUID(),
      type: "expense",
      amount: Math.round(amount * 100) / 100,
      category: details.category,
      description,
      date: convertDateToStorage(
        details.date
      ),
    };

    try {
      const stored = JSON.parse(
        localStorage.getItem(
          "flowfund_transactions"
        ) || "[]"
      );

      if (!Array.isArray(stored)) {
        throw new Error(
          "Stored transactions have an invalid format."
        );
      }

      localStorage.setItem(
        "flowfund_transactions",
        JSON.stringify([
          ...stored,
          transaction,
        ])
      );

      setSaved(true);
      setError("");
    } catch (err) {
      setError(
        "Unable to save the transaction. " +
          err.message
      );
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        color: "#f8fafc",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <h1>Receipt Scanner</h1>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: "30px",
        }}
      >
        Upload a receipt and extract its
        transaction details using FlowFund AI.
      </p>

      <div
        style={{
          background: "#1e293b",
          padding: "30px",
          borderRadius: "16px",
          textAlign: "center",
        }}
      >
        <ScanLine
          size={48}
          color="#10b981"
          style={{ marginBottom: "15px" }}
        />

        <h2>Upload Your Receipt</h2>

        <p style={{ color: "#94a3b8" }}>
          Supported formats: JPG, PNG, WEBP
        </p>

        <p style={{ color: "#94a3b8" }}>
          Maximum file size: 5 MB
        </p>

        {!receipt && (
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "#2563eb",
              padding: "12px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              marginTop: "20px",
              color: "#ffffff",
            }}
          >
            <Upload size={20} />
            Choose Receipt

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>
        )}

        {error && (
          <p
            role="alert"
            style={{
              color: "#f87171",
              marginTop: "20px",
            }}
          >
            {error}
          </p>
        )}

        {receipt && preview && (
          <div style={{ marginTop: "25px" }}>
            <h3>Receipt Preview</h3>

            <img
              src={preview}
              alt="Uploaded receipt"
              style={{
                width: "100%",
                maxWidth: "400px",
                maxHeight: "450px",
                objectFit: "contain",
                borderRadius: "10px",
                marginTop: "15px",
              }}
            />

            <p style={{ color: "#94a3b8" }}>
              {receipt.name}
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexWrap: "wrap",
                marginTop: "20px",
              }}
            >
              <button
                type="button"
                onClick={handleScan}
                disabled={scanning}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  background: scanning
                    ? "#64748b"
                    : "#10b981",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: scanning
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                <ScanLine size={20} />
                {scanning
                  ? "Scanning Receipt..."
                  : "Scan Receipt"}
              </button>

              <button
                type="button"
                onClick={removeReceipt}
                disabled={scanning}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 20px",
                  background: "#ef4444",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: scanning
                    ? "not-allowed"
                    : "pointer",
                  opacity: scanning ? 0.6 : 1,
                }}
              >
                <X size={20} />
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {details && (
        <div
          style={{
            background: "#1e293b",
            padding: "30px",
            borderRadius: "16px",
            marginTop: "25px",
          }}
        >
          <h2>Extracted Receipt Details</h2>

          <p
            style={{
              color: "#94a3b8",
              marginBottom: "25px",
            }}
          >
            Review and edit the details before
            saving the transaction.
          </p>

          <label style={labelStyle}>
            Merchant Name
            <input
              type="text"
              value={details.merchant}
              onChange={(event) =>
                handleDetailChange(
                  "merchant",
                  event.target.value
                )
              }
              placeholder="Enter merchant name"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Transaction Date
            <input
              type="date"
              value={details.date}
              onChange={(event) =>
                handleDetailChange(
                  "date",
                  event.target.value
                )
              }
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Total Amount (₹)
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={details.amount}
              onChange={(event) =>
                handleDetailChange(
                  "amount",
                  event.target.value
                )
              }
              placeholder="Enter total amount"
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Expense Category
            <select
              value={details.category}
              onChange={(event) =>
                handleDetailChange(
                  "category",
                  event.target.value
                )
              }
              style={inputStyle}
            >
              {CATEGORIES.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label style={labelStyle}>
            Description
            <textarea
              value={details.description}
              onChange={(event) =>
                handleDetailChange(
                  "description",
                  event.target.value
                )
              }
              rows={3}
              placeholder="Enter transaction description"
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />
          </label>

          {saved ? (
            <div
              role="status"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#34d399",
                marginTop: "20px",
              }}
            >
              <CheckCircle size={22} />
              Transaction saved successfully!
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSave}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 22px",
                background: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "15px",
                marginTop: "20px",
              }}
            >
              <Save size={20} />
              Save as Expense
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ReceiptScanner;
