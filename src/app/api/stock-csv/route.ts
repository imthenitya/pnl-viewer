import { NextResponse } from "next/server";

async function fetchOHLC(rawSymbol: string) {
  let symbol = rawSymbol.toUpperCase();
  if (symbol.endsWith(".BSE")) {
    symbol = symbol.replace(/\.BSE$/, ".BO");
  } else if (!symbol.includes(".")) {
    symbol = `${symbol}.NS`;
  }

  // <-- Updated here to 1 year
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2y&interval=1d`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Yahoo fetch error ${res.status}: ${text}`);
  }
  const json = await res.json();

  const err = json.chart?.error;
  if (err) throw new Error(`Yahoo API error: ${err.description}`);
  const result = json.chart?.result?.[0];
  if (!result) throw new Error("No data returned for symbol");
  return result;
}

function calculateMomentum(close: number[], window = 5): number[] {
  return close.map((price, i) => (i >= window ? price - close[i - window] : 0));
}

function calculateVolatility(close: number[], window = 5): number[] {
  return close.map((_, i) => {
    if (i < window) return 0;
    const slice = close.slice(i - window, i);
    const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
    const variance = slice.reduce((a, b) => a + (b - mean) ** 2, 0) / slice.length;
    return Math.sqrt(variance);
  });
}

function calculateVolume(volume: number[]): number[] {
  return volume.map((v) => (v === null || isNaN(v) ? 0 : v));
}

function jsonifyDates(data: any) {
  const ts = data.timestamp;
  const quote = data.indicators.quote?.[0];
  const adjClose = data.indicators.adjclose?.[0]?.adjclose;

  const open = quote?.open || [];
  const high = quote?.high || [];
  const low = quote?.low || [];
  const close = adjClose || quote?.close || [];
  const volume = quote?.volume || [];

  const momentum = calculateMomentum(close);
  const volatility = calculateVolatility(close);

  const rows = ["ds,open,high,low,close,volume,momentum,volatility"];
  for (let i = 0; i < ts.length; i++) {
    if (!close[i] || !open[i] || !high[i] || !low[i]) continue;
    const date = new Date(ts[i] * 1000).toISOString().split("T")[0];
    rows.push(
      `${date},${open[i]},${high[i]},${low[i]},${close[i]},${volume[i] || 0},${momentum[i]},${
        volatility[i]
      }`
    );
  }

  return rows.join("\n");
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawSymbol = searchParams.get("symbol") || "RELIANCE.BSE";
    const data = await fetchOHLC(rawSymbol);
    const csv = jsonifyDates(data);
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv" },
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
