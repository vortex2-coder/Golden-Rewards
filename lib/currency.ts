import "server-only";

import countryToCurrency from "country-to-currency";
import { cacheLife } from "next/cache";

type ExchangeRateResponse = {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
};

export type LocalCurrencyQuote = {
  currencyCode: string;
  amount: number | null;
  rate: number | null;
  updatedAt: string | null;
};

async function getUsdRates(): Promise<ExchangeRateResponse> {
  "use cache";
  cacheLife("hours");

  const response = await fetch("https://open.er-api.com/v6/latest/USD", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Exchange-rate service returned HTTP ${response.status}.`);
  }

  const data = (await response.json()) as ExchangeRateResponse;
  if (
    data.result !== "success" ||
    data.base_code !== "USD" ||
    !data.rates ||
    typeof data.rates !== "object"
  ) {
    throw new Error("Exchange-rate service returned an invalid USD rate table.");
  }
  return data;
}

export async function getLocalCurrencyQuote(
  amountUsd: number,
  countryIsoCode: string,
): Promise<LocalCurrencyQuote | null> {
  const currencyCode = countryToCurrency[countryIsoCode.toUpperCase() as keyof typeof countryToCurrency];
  if (!currencyCode) return null;

  try {
    const rates = await getUsdRates();
    const rate = rates.rates[currencyCode];
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      return { currencyCode, amount: null, rate: null, updatedAt: rates.time_last_update_utc };
    }

    return {
      currencyCode,
      amount: amountUsd * rate,
      rate,
      updatedAt: rates.time_last_update_utc,
    };
  } catch (error) {
    console.error("Could not load a local-currency display rate.", error);
    return { currencyCode, amount: null, rate: null, updatedAt: null };
  }
}

export function formatMoney(amount: number, currencyCode: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}
