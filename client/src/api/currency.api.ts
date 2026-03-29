interface FrankfurterResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface JPYtoAUDResult {
  rate: number;
  date: string;
}

export async function fetchJPYtoAUD(): Promise<JPYtoAUDResult> {
  const res = await fetch('https://api.frankfurter.app/latest?from=JPY&to=AUD');
  if (!res.ok) throw new Error(`Currency API error: ${res.status}`);
  const data: FrankfurterResponse = await res.json();
  const rate = data.rates['AUD'];
  if (rate === undefined || !isFinite(rate) || rate <= 0) throw new Error('AUD rate not found in response');
  return { rate, date: data.date };
}
