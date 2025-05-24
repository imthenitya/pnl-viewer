"use client";
import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import styles from "./styles.module.css";

const AI_API_URL = process.env.NEXT_PUBLIC_AI_API_URL || "http://localhost:8000";

type ChartPoint = {
  date: string;
  Past?: number;
  Forecast?: number;
};

export default function Chartprediction() {
  const [symbol, setSymbol] = useState("RELIANCE.BSE");
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const getForecast = async () => {
    setError(undefined);
    setLoading(true);
    setChartData([]);

    try {
      // 1. Fetch historical CSV
      const csvRes = await fetch(`/api/stock-csv?symbol=${symbol}`);
      if (!csvRes.ok) throw new Error(await csvRes.text());

      const file = new File([await csvRes.blob()], "history.csv", {
        type: "text/csv",
      });

      // 2. Post to AI service
      const form = new FormData();
      form.append("file", file);
      form.append("forecast_days", "90");

      const aiRes = await fetch(`${AI_API_URL}/forecast`, {
        method: "POST",
        body: form,
      });
      if (!aiRes.ok) throw new Error(await aiRes.text());

      const json = await aiRes.json();

      const combinedMap: Record<string, ChartPoint> = {};

      // Add past data
      for (const { date, price } of json.past) {
        combinedMap[date] = { date, Past: price };
      }

      // Add future (forecasted) data
      for (const { date, predicted_price } of json.future) {
        if (!combinedMap[date]) combinedMap[date] = { date };
        combinedMap[date].Forecast = predicted_price;
      }

      const sorted = Object.values(combinedMap).sort((a, b) => a.date.localeCompare(b.date));

      setChartData(sorted);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: 20 }}>
      <div className={styles.container}>
        <h1 className={styles.title}>AI‑Powered Stock Forecast</h1>
        <div className={styles.inputGroup}>
          <input
            className={styles.input}
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter stock symbol"
            disabled={loading}
          />
          <button
            className={styles.button}
            onClick={getForecast}
            disabled={loading || !symbol.trim()}>
            {loading ? "Predicting…" : "Forecast"}
          </button>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {chartData.length > 0 && (
        <div style={{ width: "100%", height: 400, marginTop: 20 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Past"
                name="Past"
                stroke="#8884d8"
                dot={false}
                isAnimationActive={true}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Forecast"
                name="Forecast"
                stroke="#82ca9d"
                dot={false}
                isAnimationActive={true}
                strokeDasharray="5 5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </main>
  );
}
