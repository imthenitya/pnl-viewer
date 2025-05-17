"use client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { useState } from "react";
import * as XLSX from "xlsx";

type StockData = {
  tradingsymbol: string;
  isin: string;
  quantity: number;
  buy_value: number;
  sell_value: number;
  realized_profit: number;
  realized_profit_percentage: number;
  close_price: number;
  open_quantity: number;
  open_quantity_type: string;
  open_value: number;
  unrealized_profit: number;
  unrealized_profit_percentage: number;
  realized_profit_abs: number;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: "white", border: "1px solid #ccc", padding: 10 }}>
        <strong>{label}</strong>
        <div>Buy Value: ₹{data.buy_value?.toFixed(2)}</div>
        <div>Sell Value: ₹{data.sell_value?.toFixed(2)}</div>
        <div style={{ color: data.realized_profit >= 0 ? "green" : "red" }}>
          Profit/Loss: ₹{data.realized_profit?.toFixed(2)}
        </div>
      </div>
    );
  }
  return null;
};

export default function StockPerformanceChart() {
  const [data, setData] = useState<StockData[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        range: 37, // starts from row 38 (0-based index)
        defval: null,
      });

      const parsedData: StockData[] = rawData.map((row: any) => {
        const realizedProfit = row["Realized P&L"] ?? 0;
        return {
          tradingsymbol: row["Symbol"],
          isin: row["ISIN"],
          quantity: row["Quantity"],
          buy_value: row["Buy Value"],
          sell_value: row["Sell Value"],
          realized_profit: realizedProfit,
          realized_profit_percentage: row["Realized P&L Pct."],
          close_price: row["Previous Closing Price"],
          open_quantity: row["Open Quantity"],
          open_quantity_type: row["Open Quantity Type"],
          open_value: row["Open Value"],
          unrealized_profit: row["Unrealized P&L"],
          unrealized_profit_percentage: row["Unrealized P&L Pct."],
          realized_profit_abs: Math.abs(realizedProfit),
        };
      });

      setData(parsedData);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <>
      {data.length === 0 && (
        <div className="fileSelector">
          <input
            type="file"
            id="fileUpload"
            accept=".xlsx, .xls"
            onChange={handleFileUpload}
            className="hiddenInput"
          />
          <label htmlFor="fileUpload" className="customFileLabel">
            Upload Profit and Loss Excel
          </label>
        </div>
      )}
      {data.length > 0 && (
        <div style={{ height: "100vh", overflowX: "auto" }}>
          <div style={{ width: data.length * 120, height: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="tradingsymbol"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  tick={{ fontSize: 11 }}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="buy_value" fill="#8884d8" name="Buy Value" />
                <Bar dataKey="sell_value" fill="#82ca9d" name="Sell Value" />
                <Bar dataKey="realized_profit_abs" name="Profit/Loss" isAnimationActive={false}>
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.realized_profit >= 0 ? "green" : "red"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
}
