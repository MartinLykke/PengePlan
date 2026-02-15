"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useAppTheme } from "./use-app-theme";

const GOALS_STORAGE_KEY = "myfinance.goals";
const OVERVIEW_SNAPSHOT_STORAGE_KEY = "myfinance.overviewSnapshot";

type Goal = {
  id: string;
  name: string;
  targetAmount: number;
  startAmount: number;
  monthlyContribution: number;
  annualReturn: number;
  targetDate: string;
  createdAt: string;
};

type OverviewSnapshot = {
  monthlyDisposable: number;
  monthlyIncome: number;
  monthlyExpenses: number;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("da-DK", { month: "long", year: "numeric" }).format(date);
}

function monthsBetweenNow(targetDateIso: string): number {
  if (!targetDateIso) {
    return 0;
  }
  const now = new Date();
  const target = new Date(targetDateIso);
  if (Number.isNaN(target.getTime())) {
    return 0;
  }
  const monthDiff = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(0, monthDiff);
}

function projectBalance(startAmount: number, monthlyContribution: number, annualReturn: number, months: number) {
  let balance = Math.max(0, startAmount);
  let totalInterest = 0;
  const monthlyRate = Math.max(0, annualReturn) / 100 / 12;

  for (let month = 0; month < months; month += 1) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    balance += interest + Math.max(0, monthlyContribution);
  }

  return { balance, totalInterest };
}

function requiredMonthlyContribution(goal: Goal, months: number): number {
  if (months <= 0) {
    return Math.max(0, goal.targetAmount - goal.startAmount);
  }

  const monthlyRate = Math.max(0, goal.annualReturn) / 100 / 12;
  const start = Math.max(0, goal.startAmount);
  const target = Math.max(0, goal.targetAmount);

  if (monthlyRate === 0) {
    return Math.max(0, (target - start) / months);
  }

  const growthFactor = (1 + monthlyRate) ** months;
  const numerator = target - start * growthFactor;
  const denominator = (growthFactor - 1) / monthlyRate;
  if (denominator <= 0) {
    return 0;
  }

  return Math.max(0, numerator / denominator);
}

function monthsToReachGoal(goal: Goal): number | null {
  const target = Math.max(0, goal.targetAmount);
  let balance = Math.max(0, goal.startAmount);
  const monthlyContribution = Math.max(0, goal.monthlyContribution);
  const monthlyRate = Math.max(0, goal.annualReturn) / 100 / 12;

  if (balance >= target) {
    return 0;
  }
  if (monthlyContribution <= 0 && monthlyRate <= 0) {
    return null;
  }

  for (let month = 1; month <= 1200; month += 1) {
    balance += balance * monthlyRate + monthlyContribution;
    if (balance >= target) {
      return month;
    }
  }

  return null;
}

function monthsToReachAmount(goal: Goal, targetAmount: number): number | null {
  const target = Math.max(0, targetAmount);
  let balance = Math.max(0, goal.startAmount);
  const monthlyContribution = Math.max(0, goal.monthlyContribution);
  const monthlyRate = Math.max(0, goal.annualReturn) / 100 / 12;

  if (balance >= target) {
    return 0;
  }
  if (monthlyContribution <= 0 && monthlyRate <= 0) {
    return null;
  }

  for (let month = 1; month <= 1200; month += 1) {
    balance += balance * monthlyRate + monthlyContribution;
    if (balance >= target) {
      return month;
    }
  }

  return null;
}

function parseNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value !== "string") {
    return 0;
  }
  const normalized = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  if (!normalized || normalized === "-" || normalized === ".") {
    return 0;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function GoalsPlanner() {
  const { isDarkMode } = useAppTheme();
  const [goals, setGoals] = useState<Goal[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }
    try {
      const raw = window.localStorage.getItem(GOALS_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as Goal[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [overview] = useState<OverviewSnapshot | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    try {
      const raw = window.localStorage.getItem(OVERVIEW_SNAPSHOT_STORAGE_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as OverviewSnapshot;
    } catch {
      return null;
    }
  });

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [startAmount, setStartAmount] = useState("");
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [annualReturn, setAnnualReturn] = useState("3");
  const [targetDate, setTargetDate] = useState("");
  const [importStatus, setImportStatus] = useState("");

  const saveGoals = (next: Goal[]) => {
    setGoals(next);
    try {
      window.localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage errors.
    }
  };

  const createGoal = () => {
    const parsedTarget = Number(targetAmount);
    if (!name.trim() || !Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      return;
    }

    const goal: Goal = {
      id: crypto.randomUUID(),
      name: name.trim(),
      targetAmount: parsedTarget,
      startAmount: Math.max(0, Number(startAmount) || 0),
      monthlyContribution: Math.max(0, Number(monthlyContribution) || 0),
      annualReturn: Math.max(0, Number(annualReturn) || 0),
      targetDate,
      createdAt: new Date().toISOString(),
    };

    saveGoals([goal, ...goals]);
    setName("");
    setTargetAmount("");
    setStartAmount("");
    setMonthlyContribution("");
    setAnnualReturn("3");
    setTargetDate("");
  };

  const deleteGoal = (id: string) => {
    saveGoals(goals.filter((goal) => goal.id !== id));
  };

  const exportGoalsToExcel = async () => {
    if (goals.length === 0) {
      setImportStatus("Ingen maal at eksportere.");
      return;
    }

    const xlsx = await import("xlsx");
    const rows = goals.map((goal) => ({
      report_name: goal.name,
      target_amount: goal.targetAmount,
      start_amount: goal.startAmount,
      monthly_contribution: goal.monthlyContribution,
      annual_return_percent: goal.annualReturn,
      target_date: goal.targetDate,
      created_at: goal.createdAt,
    }));

    const sheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, sheet, "Maal");
    xlsx.writeFile(workbook, "myfinance-maal.xlsx");
    setImportStatus("Maal eksporteret til Excel.");
  };

  const importGoalsFromExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportStatus("Importerer maal...");
      const xlsx = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = xlsx.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

      const importedGoals: Goal[] = rows
        .map((row) => {
          const name = String(row.report_name || row.name || row.goal_name || "").trim();
          const targetAmount = parseNumber(row.target_amount ?? row.target ?? row.maalsum ?? row.maal_beloeb);
          if (!name || targetAmount <= 0) {
            return null;
          }

          const startAmount = parseNumber(row.start_amount ?? row.start ?? row.har_allerede);
          const monthlyContribution = parseNumber(row.monthly_contribution ?? row.monthly ?? row.opsparing_pr_md);
          const annualReturn = parseNumber(row.annual_return_percent ?? row.return_percent ?? row.afkast);
          const targetDate = String(row.target_date || row.maal_dato || "").trim();
          const createdAtRaw = String(row.created_at || "").trim();
          const createdAt = createdAtRaw && !Number.isNaN(new Date(createdAtRaw).getTime()) ? createdAtRaw : new Date().toISOString();

          return {
            id: crypto.randomUUID(),
            name,
            targetAmount,
            startAmount: Math.max(0, startAmount),
            monthlyContribution: Math.max(0, monthlyContribution),
            annualReturn: Math.max(0, annualReturn),
            targetDate,
            createdAt,
          };
        })
        .filter((entry): entry is Goal => entry !== null);

      if (importedGoals.length === 0) {
        setImportStatus("Ingen gyldige maal fundet i filen.");
      } else {
        saveGoals([...importedGoals, ...goals]);
        setImportStatus(`${importedGoals.length} maal importeret.`);
      }
    } catch {
      setImportStatus("Import fejlede. Kontroller filen (.xlsx/.xls/.csv).");
    }

    event.target.value = "";
  };

  const sortedGoals = useMemo(() => [...goals].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).reverse(), [goals]);

  return (
    <section className="mt-4 space-y-4">
      <div className={`rounded-2xl border p-4 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"}`}>
        <h1 className={`text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Maal</h1>
        <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Saet konkrete maal (fx 100.000 kr), se fremdrift i procent, forventet dato og delmaal.</p>
        {overview ? (
          <p className={`mt-2 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Fra budget: Raadighedsbelob {formatCurrency(overview.monthlyDisposable)} pr. md. (indkomst {formatCurrency(overview.monthlyIncome)} / udgift{" "}
            {formatCurrency(overview.monthlyExpenses)}).
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Maal navn (fx noedbuffer)"
          className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring ${
            isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-cyan-100 bg-white/90 text-slate-900"
          }`}
        />
        <input
          value={targetAmount}
          onChange={(event) => setTargetAmount(event.target.value)}
          placeholder="Maal beloeb (DKK)"
          type="number"
          min="0"
          className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring ${
            isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-cyan-100 bg-white/90 text-slate-900"
          }`}
        />
        <input
          value={startAmount}
          onChange={(event) => setStartAmount(event.target.value)}
          placeholder="Har allerede (DKK)"
          type="number"
          min="0"
          className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring ${
            isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-cyan-100 bg-white/90 text-slate-900"
          }`}
        />
        <input
          value={monthlyContribution}
          onChange={(event) => setMonthlyContribution(event.target.value)}
          placeholder="Opsparing pr. md. (DKK)"
          type="number"
          min="0"
          className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring ${
            isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-cyan-100 bg-white/90 text-slate-900"
          }`}
        />
        <input
          value={annualReturn}
          onChange={(event) => setAnnualReturn(event.target.value)}
          placeholder="Forventet afkast % / aar"
          type="number"
          min="0"
          step="0.1"
          className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring ${
            isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-cyan-100 bg-white/90 text-slate-900"
          }`}
        />
        <input
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          type="date"
          className={`rounded-xl border px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring ${
            isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-cyan-100 bg-white/90 text-slate-900"
          }`}
        />
      </div>

      <button
        type="button"
        onClick={createGoal}
        className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500"
      >
        Opret maal
      </button>

      <div className="flex flex-wrap items-center gap-2">
        <label className={`inline-flex cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
          isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
        }`}>
          Importer Excel/CSV
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importGoalsFromExcel} />
        </label>
        <button
          type="button"
          onClick={() => void exportGoalsToExcel()}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Eksporter Excel
        </button>
        {importStatus ? <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{importStatus}</p> : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {sortedGoals.map((goal) => {
          const months = monthsToReachGoal(goal);
          const progress = Math.min(100, Math.max(0, (goal.startAmount / Math.max(goal.targetAmount, 1)) * 100));
          const now = new Date();
          const reachedDate = months === null ? null : new Date(now.getFullYear(), now.getMonth() + months, 1);
          const totalSaved = months === null ? 0 : goal.monthlyContribution * months;
          const projection = months === null ? null : projectBalance(goal.startAmount, goal.monthlyContribution, goal.annualReturn, months);

          const deadlineMonths = monthsBetweenNow(goal.targetDate);
          const neededMonthly = goal.targetDate ? requiredMonthlyContribution(goal, deadlineMonths) : null;
          const disposableShare = overview && goal.monthlyContribution > 0 && overview.monthlyDisposable > 0 ? (goal.monthlyContribution / overview.monthlyDisposable) * 100 : null;
          const milestones = [25, 50, 75, 100].map((pct) => {
            const amount = (goal.targetAmount * pct) / 100;
            const milestoneMonths = monthsToReachAmount(goal, amount);
            const milestoneDate = milestoneMonths === null ? null : new Date(now.getFullYear(), now.getMonth() + milestoneMonths, 1);
            const reached = goal.startAmount >= amount;
            return { pct, amount, milestoneMonths, milestoneDate, reached };
          });

          return (
            <article key={goal.id} className={`rounded-2xl border p-4 shadow-[0_16px_40px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className={`text-base font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{goal.name}</h2>
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Maal: {formatCurrency(goal.targetAmount)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteGoal(goal.id)}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Slet
                </button>
              </div>

              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${progress}%` }} />
              </div>
              <p className={`mt-1 text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Start-progress: {progress.toFixed(0)}%</p>

              <div className={`mt-3 grid gap-1.5 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                <p className="flex items-center justify-between">
                  <span>Tid til maal</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{months === null ? "Kan ikke beregnes" : `${months} maaneder`}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Forventet dato</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{reachedDate ? formatMonthYear(reachedDate) : "-"}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Opsparing pr. md.</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{formatCurrency(goal.monthlyContribution)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Samlet indbetaling</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{formatCurrency(totalSaved)}</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Forventet afkast</span>
                  <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{projection ? formatCurrency(projection.totalInterest) : "-"}</span>
                </p>
                {neededMonthly !== null ? (
                  <p className="flex items-center justify-between">
                    <span>Krav pr. md. til valgt dato</span>
                    <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{formatCurrency(neededMonthly)}</span>
                  </p>
                ) : null}
                {disposableShare !== null ? (
                  <p className="flex items-center justify-between">
                    <span>Andel af raadighedsbelob</span>
                    <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>{disposableShare.toFixed(0)}%</span>
                  </p>
                ) : null}
              </div>

              <div className={`mt-3 rounded-xl border px-3 py-2 ${isDarkMode ? "border-slate-700 bg-slate-800/70" : "border-slate-200 bg-slate-50/90"}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Delmaal</p>
                <div className="mt-2 space-y-1.5">
                  {milestones.map((milestone) => (
                    <p key={milestone.pct} className={`flex items-center justify-between text-xs ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
                      <span>{milestone.pct}% ({formatCurrency(milestone.amount)})</span>
                      <span className={`font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-800"}`}>
                        {milestone.reached ? "Opnaaet" : milestone.milestoneDate ? formatMonthYear(milestone.milestoneDate) : "-"}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {sortedGoals.length === 0 ? (
        <p className={`rounded-2xl border p-4 text-sm ${isDarkMode ? "border-slate-700/70 bg-slate-900/90 text-slate-300" : "border-cyan-100 bg-white/88 text-slate-600"}`}>
          Ingen maal endnu. Opret dit foerste maal ovenfor.
        </p>
      ) : null}
    </section>
  );
}
