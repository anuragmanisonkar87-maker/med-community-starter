"use client";

import { useMemo, useState } from "react";
import { capture } from "@/lib/posthog";

export const dynamic = "force-static";

// FIRE (Financial Independence, Retire Early) calculator.
// Original implementation. Projects years to a target corpus using a
// real (inflation-adjusted) return and the safe-withdrawal-rate rule.
export default function FireCalculatorPage() {
  const [age, setAge] = useState(32);
  const [monthlyExpenses, setMonthlyExpenses] = useState(80000);
  const [currentSavings, setCurrentSavings] = useState(1500000);
  const [monthlyInvestment, setMonthlyInvestment] = useState(60000);
  const [returnPct, setReturnPct] = useState(11);
  const [inflationPct, setInflationPct] = useState(6);
  const [swrPct, setSwrPct] = useState(4);

  const result = useMemo(() => {
    const annualExpensesToday = monthlyExpenses * 12;
    // Target corpus by the safe-withdrawal rule (today's money).
    const targetCorpus = annualExpensesToday / (swrPct / 100);
    // Real monthly return (approx) after inflation.
    const realAnnual = (1 + returnPct / 100) / (1 + inflationPct / 100) - 1;
    const r = Math.pow(1 + realAnnual, 1 / 12) - 1;

    // Simulate month by month in today's money until corpus >= target.
    let corpus = currentSavings;
    const series: { year: number; corpus: number }[] = [{ year: age, corpus }];
    let months = 0;
    const maxMonths = 12 * 60; // cap at 60 years
    while (corpus < targetCorpus && months < maxMonths) {
      corpus = corpus * (1 + r) + monthlyInvestment;
      months++;
      if (months % 12 === 0) series.push({ year: age + months / 12, corpus });
    }
    const reached = corpus >= targetCorpus;
    const fiAge = reached ? age + Math.ceil(months / 12) : null;
    return { targetCorpus, fiAge, reached, series, realAnnual };
  }, [age, monthlyExpenses, currentSavings, monthlyInvestment, returnPct, inflationPct, swrPct]);

  const fmt = (n: number) =>
    n >= 1e7 ? `₹${(n / 1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n / 1e5).toFixed(1)} L` : `₹${Math.round(n).toLocaleString("en-IN")}`;

  const maxCorpus = Math.max(result.targetCorpus, ...result.series.map((s) => s.corpus));

  return (
    <main className="section">
      <div className="container-page max-w-5xl">
        <p className="eyebrow">Financial tools</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">FIRE Calculator</h1>
        <p className="mt-2 text-gray-600">
          Estimate the corpus you need for financial independence and the age you could reach it.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-4">
            <Slider label="Current age" value={age} onChange={setAge} min={22} max={60} suffix="yrs" />
            <Slider label="Monthly expenses (today)" value={monthlyExpenses} onChange={setMonthlyExpenses} min={10000} max={500000} step={5000} money />
            <Slider label="Current savings & investments" value={currentSavings} onChange={setCurrentSavings} min={0} max={50000000} step={100000} money />
            <Slider label="Monthly investment" value={monthlyInvestment} onChange={setMonthlyInvestment} min={0} max={500000} step={5000} money />
            <Slider label="Expected return" value={returnPct} onChange={setReturnPct} min={5} max={15} step={0.5} suffix="%" />
            <Slider label="Inflation" value={inflationPct} onChange={setInflationPct} min={3} max={10} step={0.5} suffix="%" />
            <Slider label="Safe withdrawal rate" value={swrPct} onChange={setSwrPct} min={2.5} max={6} step={0.5} suffix="%" />
          </div>

          {/* Results */}
          <div className="space-y-4">
            <div className="rounded-2xl bg-brand-ink p-6 text-white">
              <p className="text-sm text-gray-300">Corpus needed for independence</p>
              <p className="mt-1 font-display text-3xl font-semibold">{fmt(result.targetCorpus)}</p>
              <p className="mt-4 text-sm text-gray-300">
                {result.reached ? "You could reach it around age" : "Not reached within 60 years at these inputs"}
              </p>
              {result.reached && (
                <p className="font-display text-2xl font-semibold text-brand-50">{result.fiAge}</p>
              )}
            </div>

            {/* Simple projection chart */}
            <div className="rounded-2xl border border-black/5 p-5">
              <p className="mb-3 text-sm font-medium text-gray-700">Corpus growth (today's money)</p>
              <svg viewBox="0 0 320 140" className="w-full" role="img" aria-label="Projected corpus growth">
                <line x1="0" y1="120" x2="320" y2="120" stroke="#e5e7eb" />
                {/* target line */}
                <line
                  x1="0"
                  x2="320"
                  y1={120 - (result.targetCorpus / maxCorpus) * 110}
                  y2={120 - (result.targetCorpus / maxCorpus) * 110}
                  stroke="#009356"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <polyline
                  fill="none"
                  stroke="#009356"
                  strokeWidth="2"
                  points={result.series
                    .map((s, i) => {
                      const x = (i / Math.max(1, result.series.length - 1)) * 320;
                      const y = 120 - (s.corpus / maxCorpus) * 110;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    })
                    .join(" ")}
                />
              </svg>
              <div className="mt-1 flex justify-between text-xs text-gray-400">
                <span>Age {age}</span>
                <span>Dashed line = target corpus</span>
              </div>
            </div>

            <button
              onClick={() => capture("fire_calculated", { fiAge: result.fiAge })}
              className="text-xs text-gray-400 hover:text-brand-600"
            >
              These are estimates, not advice. Tap to log this calculation.
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Slider({
  label, value, onChange, min, max, step = 1, suffix, money,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step?: number; suffix?: string; money?: boolean;
}) {
  const display = money
    ? value >= 1e7 ? `₹${(value / 1e7).toFixed(2)} Cr` : value >= 1e5 ? `₹${(value / 1e5).toFixed(1)} L` : `₹${value.toLocaleString("en-IN")}`
    : `${value}${suffix ? " " + suffix : ""}`;
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold text-brand-600">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-brand-500"
      />
    </label>
  );
}
