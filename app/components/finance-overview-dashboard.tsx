"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppTheme } from "./use-app-theme";

const OVERVIEW_SNAPSHOT_STORAGE_KEY = "myfinance.overviewSnapshot";

type SnapshotPoint = {
  month: number;
  netWorth: number;
  cash: number;
  debt: number;
  home: number;
};

type SnapshotExpense = {
  key: string;
  label: string;
  value: number;
  color: string;
};

type SnapshotTopExpense = {
  label: string;
  icon: string;
  value: number;
  share: number;
};

type OverviewSnapshot = {
  savedAt: string;
  reportName: string;
  selectedMonths: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDisposable: number;
  annualIncome: number;
  annualExpenses: number;
  annualSurplus: number;
  housingShare: number;
  transportShare: number;
  fixedShare: number;
  debtToIncomeShare: number;
  economicHealthScore: number;
  healthStatus: string;
  finalNetWorth: number;
  finalDebt: number;
  finalHomeValue: number;
  finalCash: number;
  finalPension: number;
  includePensionInNetWorth: boolean;
  topExpenseCategories: SnapshotTopExpense[];
  expenseBreakdown: SnapshotExpense[];
  points: SnapshotPoint[];
  netWorthTrendValues: number[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function FinanceOverviewDashboard() {
  const { isDarkMode } = useAppTheme();
  const [snapshot] = useState<OverviewSnapshot | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(OVERVIEW_SNAPSHOT_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed = JSON.parse(raw) as OverviewSnapshot;
      return parsed;
    } catch {
      return null;
    }
  });

  const donutSegments = useMemo(() => {
    if (!snapshot) {
      return [];
    }
    const total = snapshot.expenseBreakdown.reduce((sum, entry) => sum + entry.value, 0);
    if (total <= 0) {
      return [];
    }
    let start = 0;
    return snapshot.expenseBreakdown.map((entry) => {
      const ratio = entry.value / total;
      const seg = { ...entry, ratio, start };
      start += ratio;
      return seg;
    });
  }, [snapshot]);

  const netWorthChart = useMemo(() => {
    if (!snapshot || snapshot.netWorthTrendValues.length < 2) {
      return null;
    }

    const values = snapshot.netWorthTrendValues;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);
    const points = values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * 300;
        const y = 96 - ((value - min) / range) * 84;
        return `${x},${y}`;
      })
      .join(" ");

    return {
      points,
      min,
      max,
      start: values[0],
      end: values[values.length - 1],
    };
  }, [snapshot]);

  if (!snapshot) {
    return (
      <section className={`mt-4 rounded-2xl border p-6 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"}`}>
        <h1 className={`text-lg font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Overblik</h1>
        <p className={`mt-2 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Indtast data paa budgetsiden for at se dit overblik her.</p>
        <Link href="/" className="mt-4 inline-flex rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
          Gaa til budget
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-4 space-y-4">
      <div className={`rounded-2xl border p-4 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"}`}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className={`text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Overblik</h1>
            <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>
              Rapport: {snapshot.reportName || "Ikke navngivet"} | Opdateret: {new Date(snapshot.savedAt).toLocaleString("da-DK")}
            </p>
          </div>
          <Link href="/" className={`rounded-full px-3 py-1.5 text-xs font-semibold ${isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
            Tilbage til budget
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>Indkomst / md</p>
          <p className={`mt-1 text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{formatCurrency(snapshot.monthlyIncome)}</p>
        </div>
        <div className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>Udgifter / md</p>
          <p className={`mt-1 text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{formatCurrency(snapshot.monthlyExpenses)}</p>
        </div>
        <div className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>Raadighed / md</p>
          <p className={`mt-1 text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{formatCurrency(snapshot.monthlyDisposable)}</p>
        </div>
        <div className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>Sundhedsscore</p>
          <p className={`mt-1 text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{snapshot.economicHealthScore}/100</p>
        </div>
        <div className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-500"}`}>Forventet formue</p>
          <p className={`mt-1 text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{formatCurrency(snapshot.finalNetWorth)}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className={`rounded-2xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>Udgifter Donut</p>
          {donutSegments.length > 0 ? (
            <div className="mt-2 flex items-center gap-3">
              <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
                <circle cx="60" cy="60" r="36" fill="none" stroke="#e2e8f0" strokeWidth="16" />
                {donutSegments.map((segment) => (
                  <circle
                    key={segment.key}
                    cx="60"
                    cy="60"
                    r="36"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="16"
                    strokeDasharray={`${segment.ratio * 226.19} ${226.19 - segment.ratio * 226.19}`}
                    strokeDashoffset={-segment.start * 226.19}
                    transform="rotate(-90 60 60)"
                  />
                ))}
              </svg>
              <div className={`space-y-1 text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                {donutSegments.map((segment) => (
                  <p key={segment.key} className="flex items-center justify-between gap-3">
                    <span>{segment.label}</span>
                    <span className="font-semibold">{(segment.ratio * 100).toFixed(0)}%</span>
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className={`mt-2 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Ingen udgifter endnu.</p>
          )}
        </div>

        <div className={`rounded-2xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>Indkomst Vs Udgifter</p>
          <div className="mt-2 space-y-2">
            {[
              { label: "Indkomst", value: snapshot.monthlyIncome, color: "#10b981" },
              { label: "Udgifter", value: snapshot.monthlyExpenses, color: "#ef4444" },
              { label: "Raadighed", value: Math.max(snapshot.monthlyDisposable, 0), color: "#3b82f6" },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className={`flex items-center justify-between text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                  <span>{row.label}</span>
                  <span className="font-semibold">{formatCurrency(row.value)}</span>
                </div>
                <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                  <div className="h-2 rounded-full" style={{ width: `${(row.value / Math.max(snapshot.monthlyIncome, snapshot.monthlyExpenses, 1)) * 100}%`, backgroundColor: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>Noegletal Gauges</p>
          <div className={`mt-2 space-y-2 text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            <p>Boligprocent: {snapshot.housingShare.toFixed(0)}%</p>
            <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}><div className="h-2 rounded-full bg-amber-500" style={{ width: `${clamp(snapshot.housingShare, 0, 100)}%` }} /></div>
            <p>Gaeldsprocent: {snapshot.debtToIncomeShare.toFixed(0)}%</p>
            <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}><div className="h-2 rounded-full bg-rose-500" style={{ width: `${clamp(snapshot.debtToIncomeShare, 0, 200) / 2}%` }} /></div>
          </div>
        </div>

        <div className={`rounded-2xl border p-3 md:col-span-2 xl:col-span-2 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>Formue Trend</p>
          {netWorthChart ? (
            <div className="mt-2 space-y-1">
              <svg viewBox="0 0 300 100" className="h-28 w-full">
                <polyline fill="none" stroke="#06b6d4" strokeWidth="3" points={netWorthChart.points} strokeLinecap="round" strokeLinejoin="round" />
                <line x1="0" y1="96" x2="300" y2="96" stroke="#e2e8f0" strokeWidth="1" />
              </svg>
              <div className={`grid grid-cols-2 gap-1 text-[11px] ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                <p>Start: <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{formatCurrency(netWorthChart.start)}</span></p>
                <p>Slut: <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{formatCurrency(netWorthChart.end)}</span></p>
                <p>Min: <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{formatCurrency(netWorthChart.min)}</span></p>
                <p>Max: <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{formatCurrency(netWorthChart.max)}</span></p>
              </div>
            </div>
          ) : (
            <p className={`mt-2 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>For lidt data til trend endnu.</p>
          )}
        </div>

        <div className={`rounded-2xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/85" : "border-cyan-100 bg-white/90"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>Top Udgifter</p>
          <div className="mt-2 space-y-2">
            {snapshot.topExpenseCategories.length > 0 ? (
              snapshot.topExpenseCategories.map((entry) => (
                <div key={entry.label} className="space-y-1">
                  <div className={`flex items-center justify-between text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                    <span>{entry.icon} {entry.label}</span>
                    <span className="font-semibold">{formatCurrency(entry.value)}</span>
                  </div>
                  <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                    <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${entry.share}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Ingen udgifter endnu.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
