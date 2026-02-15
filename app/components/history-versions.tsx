"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppTheme } from "./use-app-theme";

const OVERVIEW_SNAPSHOT_STORAGE_KEY = "myfinance.overviewSnapshot";
const OVERVIEW_HISTORY_STORAGE_KEY = "myfinance.overviewMonthlyHistory";

type OverviewSnapshot = {
  savedAt: string;
  reportName: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDisposable: number;
  annualSurplus: number;
  finalNetWorth: number;
  economicHealthScore: number;
};

type HistoryEntry = {
  monthKey: string;
  savedAt: string;
  reportName: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDisposable: number;
  annualSurplus: number;
  finalNetWorth: number;
  economicHealthScore: number;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(date.getTime())) {
    return monthKey;
  }
  return new Intl.DateTimeFormat("da-DK", { month: "long", year: "numeric" }).format(date);
}

function buildMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toHistoryEntry(snapshot: OverviewSnapshot): HistoryEntry {
  const snapshotDate = new Date(snapshot.savedAt);
  const safeDate = Number.isNaN(snapshotDate.getTime()) ? new Date() : snapshotDate;

  return {
    monthKey: buildMonthKey(safeDate),
    savedAt: snapshot.savedAt,
    reportName: snapshot.reportName || "Ikke navngivet",
    monthlyIncome: snapshot.monthlyIncome ?? 0,
    monthlyExpenses: snapshot.monthlyExpenses ?? 0,
    monthlyDisposable: snapshot.monthlyDisposable ?? 0,
    annualSurplus: snapshot.annualSurplus ?? 0,
    finalNetWorth: snapshot.finalNetWorth ?? 0,
    economicHealthScore: snapshot.economicHealthScore ?? 0,
  };
}

function diffClass(value: number, isDarkMode: boolean): string {
  if (value > 0) {
    return isDarkMode ? "text-emerald-300" : "text-emerald-700";
  }
  if (value < 0) {
    return isDarkMode ? "text-rose-300" : "text-rose-700";
  }
  return isDarkMode ? "text-slate-300" : "text-slate-600";
}

function diffLabel(value: number, asCurrency = true): string {
  if (value === 0) {
    return "0";
  }
  const prefix = value > 0 ? "+" : "";
  return asCurrency ? `${prefix}${formatCurrency(value)}` : `${prefix}${value.toFixed(0)}`;
}

export function HistoryVersions() {
  const { isDarkMode } = useAppTheme();
  const [nowSnapshot] = useState<OverviewSnapshot | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(OVERVIEW_SNAPSHOT_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as OverviewSnapshot) : null;
    } catch {
      return null;
    }
  });
  const [history] = useState<HistoryEntry[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(OVERVIEW_HISTORY_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const nowEntry = useMemo(() => (nowSnapshot ? toHistoryEntry(nowSnapshot) : null), [nowSnapshot]);
  const currentDate = useMemo(() => (nowSnapshot ? new Date(nowSnapshot.savedAt) : new Date()), [nowSnapshot]);
  const lastMonthKey = useMemo(() => buildMonthKey(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)), [currentDate]);
  const lastYearKey = useMemo(() => buildMonthKey(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1)), [currentDate]);

  const lastMonthEntry = useMemo(() => history.find((entry) => entry.monthKey === lastMonthKey) ?? null, [history, lastMonthKey]);
  const lastYearEntry = useMemo(() => history.find((entry) => entry.monthKey === lastYearKey) ?? null, [history, lastYearKey]);

  if (!nowEntry) {
    return (
      <section className={`mt-4 rounded-2xl border p-6 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"}`}>
        <h1 className={`text-lg font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Historik og versioner</h1>
        <p className={`mt-2 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Ingen snapshot endnu. Udfyld budgettet foerst.</p>
        <Link href="/" className="mt-4 inline-flex rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
          Gaa til budget
        </Link>
      </section>
    );
  }

  const metricRows = [
    { label: "Indkomst / md", key: "monthlyIncome" as const, currency: true },
    { label: "Udgifter / md", key: "monthlyExpenses" as const, currency: true },
    { label: "Raadighed / md", key: "monthlyDisposable" as const, currency: true },
    { label: "Forventet formue", key: "finalNetWorth" as const, currency: true },
    { label: "Sundhedsscore", key: "economicHealthScore" as const, currency: false },
  ];

  return (
    <section className="mt-4 space-y-4">
      <div className={`rounded-2xl border p-4 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"}`}>
        <h1 className={`text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Historik og versioner</h1>
        <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Maanedlige snapshots: sammenlign nu vs sidste maaned vs sidste aar.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { title: "Nu", entry: nowEntry },
          { title: "Sidste maaned", entry: lastMonthEntry },
          { title: "Sidste aar", entry: lastYearEntry },
        ].map((card) => (
          <article key={card.title} className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{card.title}</p>
            {card.entry ? (
              <>
                <p className={`mt-1 text-sm font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{formatMonthLabel(card.entry.monthKey)}</p>
                <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{card.entry.reportName}</p>
                <p className={`mt-2 text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Raadighed: {formatCurrency(card.entry.monthlyDisposable)}</p>
                <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Formue: {formatCurrency(card.entry.finalNetWorth)}</p>
              </>
            ) : (
              <p className={`mt-1 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Ingen data for perioden.</p>
            )}
          </article>
        ))}
      </div>

      <div className={`rounded-2xl border p-4 ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
        <h2 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Sammenligning</h2>
        <div className="mt-3 space-y-2">
          {metricRows.map((row) => {
            const nowValue = nowEntry[row.key];
            const monthValue = lastMonthEntry ? lastMonthEntry[row.key] : null;
            const yearValue = lastYearEntry ? lastYearEntry[row.key] : null;
            const monthDiff = monthValue === null ? null : nowValue - monthValue;
            const yearDiff = yearValue === null ? null : nowValue - yearValue;

            return (
              <div key={row.key} className={`grid gap-1 rounded-lg px-3 py-2 text-xs md:grid-cols-[minmax(0,1fr)_160px_160px_160px] ${isDarkMode ? "bg-slate-800/80 text-slate-300" : "bg-slate-50 text-slate-700"}`}>
                <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{row.label}</span>
                <span>{row.currency ? formatCurrency(nowValue) : nowValue.toFixed(0)}</span>
                <span className={monthDiff === null ? (isDarkMode ? "text-slate-500" : "text-slate-400") : diffClass(monthDiff, isDarkMode)}>
                  vs sidste maaned: {monthDiff === null ? "-" : diffLabel(monthDiff, row.currency)}
                </span>
                <span className={yearDiff === null ? (isDarkMode ? "text-slate-500" : "text-slate-400") : diffClass(yearDiff, isDarkMode)}>
                  vs sidste aar: {yearDiff === null ? "-" : diffLabel(yearDiff, row.currency)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

