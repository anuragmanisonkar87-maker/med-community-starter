"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { capture } from "@/lib/posthog";

export const dynamic = "force-static";

// FinnFit Quiz — financial-fitness self-assessment. Original questions.
// Each option carries a score; total maps to a band with recommendations.
type Option = { label: string; score: number };
type Question = { id: string; prompt: string; options: Option[] };

const QUESTIONS: Question[] = [
  {
    id: "emergency",
    prompt: "How many months of expenses do you hold as an emergency fund?",
    options: [
      { label: "None yet", score: 0 },
      { label: "1–2 months", score: 1 },
      { label: "3–5 months", score: 2 },
      { label: "6+ months", score: 3 },
    ],
  },
  {
    id: "insurance",
    prompt: "Do you have term life and health insurance?",
    options: [
      { label: "Neither", score: 0 },
      { label: "One of them", score: 1 },
      { label: "Both, basic cover", score: 2 },
      { label: "Both, adequate cover", score: 3 },
    ],
  },
  {
    id: "investing",
    prompt: "How regularly do you invest?",
    options: [
      { label: "I don't invest yet", score: 0 },
      { label: "Occasionally", score: 1 },
      { label: "Monthly, manually", score: 2 },
      { label: "Automated SIP every month", score: 3 },
    ],
  },
  {
    id: "debt",
    prompt: "How would you describe your high-interest debt (credit cards, personal loans)?",
    options: [
      { label: "Significant and growing", score: 0 },
      { label: "Some, being paid down", score: 1 },
      { label: "Small / almost clear", score: 2 },
      { label: "None", score: 3 },
    ],
  },
  {
    id: "tax",
    prompt: "Do you plan your taxes before year-end?",
    options: [
      { label: "I scramble in March", score: 0 },
      { label: "A little planning", score: 1 },
      { label: "Mostly planned", score: 2 },
      { label: "Planned through the year", score: 3 },
    ],
  },
  {
    id: "retirement",
    prompt: "Do you have a retirement target and a plan to reach it?",
    options: [
      { label: "No idea", score: 0 },
      { label: "Rough idea", score: 1 },
      { label: "A number, loosely tracked", score: 2 },
      { label: "A number and a tracked plan", score: 3 },
    ],
  },
];

function band(score: number) {
  const pct = score / (QUESTIONS.length * 3);
  if (pct < 0.4) return { label: "Needs attention", color: "text-amber-700", tips: ["Build a 3-month emergency fund first.", "Get term + health insurance in place.", "Start one automated SIP, however small."] };
  if (pct < 0.75) return { label: "On track", color: "text-brand-600", tips: ["Push your emergency fund toward 6 months.", "Automate and increase your SIP yearly.", "Plan taxes before year-end, not in March."] };
  return { label: "Financially strong", color: "text-brand-600", tips: ["Review your asset allocation yearly.", "Optimise taxes with advance planning.", "Revisit your retirement target annually."] };
}

export default function QuizPage() {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const total = Object.values(answers).reduce((a, b) => a + b, 0);
  const allAnswered = Object.keys(answers).length === QUESTIONS.length;
  const result = band(total);

  async function submit() {
    setSubmitted(true);
    capture("quiz_completed", { score: total, band: result.label });
    const supabase = createClient();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("quiz_results").insert({
        user_id: user?.id ?? null,
        score: total,
        band: result.label,
        answers,
      });
    }
  }

  if (submitted) {
    return (
      <main className="section">
        <div className="container-page max-w-2xl text-center">
          <p className="eyebrow">FinnFit result</p>
          <h1 className="mt-2 font-display text-3xl font-semibold">
            Your score: {total} / {QUESTIONS.length * 3}
          </h1>
          <p className={`mt-2 text-xl font-semibold ${result.color}`}>{result.label}</p>
          <div className="mt-8 rounded-2xl border border-black/5 p-6 text-left">
            <h2 className="font-semibold">What to do next</h2>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {result.tips.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>
          <button onClick={() => { setSubmitted(false); setAnswers({}); }} className="btn-ghost mt-6">
            Retake quiz
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="section">
      <div className="container-page max-w-2xl">
        <p className="eyebrow">Financial tools</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">FinnFit Quiz</h1>
        <p className="mt-2 text-gray-600">Six quick questions to gauge your financial fitness.</p>

        <div className="mt-8 space-y-6">
          {QUESTIONS.map((q, i) => (
            <fieldset key={q.id} className="rounded-2xl border border-black/5 p-5">
              <legend className="px-1 text-sm font-medium text-gray-800">
                {i + 1}. {q.prompt}
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {q.options.map((o) => {
                  const active = answers[q.id] === o.score;
                  return (
                    <button
                      key={o.label}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.score }))}
                      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                        active ? "border-brand-500 bg-brand-50 text-brand-ink" : "border-gray-200 hover:border-brand-300"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>

        <button onClick={submit} disabled={!allAnswered} className="btn-primary mt-6 w-full">
          {allAnswered ? "See my result" : `Answer all ${QUESTIONS.length} questions`}
        </button>
      </div>
    </main>
  );
}
