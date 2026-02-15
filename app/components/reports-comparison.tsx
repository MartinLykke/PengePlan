"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useAppTheme } from "./use-app-theme";

type HouseholdType = "2v0b" | "2v1b" | "2v2b";

type ParsedReport = {
  id: string;
  sourceFile: string;
  reportName: string;
  selectedMonths: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDisposable: number;
  annualIncome: number;
  annualExpenses: number;
  annualSurplus: number;
  startingSavings: number;
  expectedMonthlySavings: number;
  homeValue: number;
  mortgageDebt: number;
  interestRate: number;
  homeGrowthRate: number;
  salaryGrowthRate: number;
  monthlyMortgagePayment: number;
  finalNetWorth: number;
  netWorthGrowth: number;
  finalDebt: number;
  finalHomeValue: number;
  finalCash: number;
};

const HOUSEHOLD_TARGETS: Record<HouseholdType, { label: string; targetDisposable: number }> = {
  "2v0b": { label: "2 voksne uden boern", targetDisposable: 13000 },
  "2v1b": { label: "2 voksne + 1 barn", targetDisposable: 15000 },
  "2v2b": { label: "2 voksne + 2 boern", targetDisposable: 16500 },
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseAmount(input: unknown): number {
  if (typeof input === "number") {
    return Number.isFinite(input) ? input : 0;
  }

  if (typeof input !== "string") {
    return 0;
  }

  const normalized = input
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");

  if (!normalized || normalized === "-" || normalized === ".") {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringifyCell(input: unknown): string {
  if (typeof input === "string") {
    return input.trim();
  }
  if (typeof input === "number" && Number.isFinite(input)) {
    return String(input);
  }
  return "";
}

function computeProjection(report: {
  selectedMonths: number;
  startingSavings: number;
  homeValue: number;
  mortgageDebt: number;
  interestRate: number;
  homeGrowthRate: number;
  salaryGrowthRate: number;
  monthlyIncome: number;
  expectedMonthlySavings: number;
  monthlyMortgagePayment: number;
}) {
  const monthlyInterestRate = Math.max(0, report.interestRate) / 100 / 12;
  const monthlyHomeGrowthRate = Math.pow(1 + Math.max(0, report.homeGrowthRate) / 100, 1 / 12) - 1;
  const monthlySalaryGrowthRate = Math.pow(1 + Math.max(0, report.salaryGrowthRate) / 100, 1 / 12) - 1;

  let cash = Math.max(0, report.startingSavings);
  let debt = Math.max(0, report.mortgageDebt);
  let home = Math.max(0, report.homeValue);
  let projectedMonthlyIncome = Math.max(0, report.monthlyIncome);

  for (let month = 0; month < Math.max(0, report.selectedMonths); month += 1) {
    const interestForMonth = debt * monthlyInterestRate;
    const actualPayment = Math.min(Math.max(0, report.monthlyMortgagePayment), debt + interestForMonth);
    const additionalDisposableFromSalaryGrowth = Math.max(projectedMonthlyIncome - report.monthlyIncome, 0);
    const projectedMonthlySavings = Math.max(0, report.expectedMonthlySavings) + additionalDisposableFromSalaryGrowth;

    cash += projectedMonthlySavings;
    debt = Math.max(0, debt + interestForMonth - actualPayment);
    home *= 1 + monthlyHomeGrowthRate;
    projectedMonthlyIncome *= 1 + monthlySalaryGrowthRate;
  }

  const finalNetWorth = cash + home - debt;
  return { finalNetWorth, finalDebt: debt, finalHomeValue: home, finalCash: cash };
}

function parseReportRows(rows: unknown[][], fileName: string): ParsedReport | null {
  const values: Record<string, string> = {};

  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 2) {
      continue;
    }

    const key = stringifyCell(row[0]);
    if (!key) {
      continue;
    }

    values[key] = stringifyCell(row[1]);
  }

  const incomeEntries = Object.entries(values)
    .filter(([key]) => key.startsWith("income."))
    .map(([, value]) => parseAmount(value));
  const housingEntries = Object.entries(values)
    .filter(([key]) => key.startsWith("housing."))
    .map(([, value]) => parseAmount(value));
  const transportEntries = Object.entries(values)
    .filter(([key]) => key.startsWith("transport."))
    .map(([, value]) => parseAmount(value));
  const fixedEntries = Object.entries(values)
    .filter(([key]) => key.startsWith("fixed."))
    .map(([, value]) => parseAmount(value));

  const monthlyIncome = incomeEntries.reduce((sum, value) => sum + value, 0);
  const housingExpenses = housingEntries.reduce((sum, value) => sum + value, 0);
  const transportExpenses = transportEntries.reduce((sum, value) => sum + value, 0);
  const fixedExpenses = fixedEntries.reduce((sum, value) => sum + value, 0);
  const monthlyExpenses = housingExpenses + transportExpenses + fixedExpenses;

  const selectedMonths = Math.max(1, Math.round(parseAmount(values.selectedMonths || "12")));
  const startingSavings = Math.max(0, parseAmount(values.startingSavings || "0"));
  const expectedMonthlySavings = Math.max(0, parseAmount(values.expectedMonthlySavings || "0"));
  const homeValue = Math.max(0, parseAmount(values.homeValue || "0"));
  const mortgageDebt = Math.max(0, parseAmount(values.mortgageDebt || "0"));
  const interestRate = Math.max(0, parseAmount(values.interestRate || "0"));
  const homeGrowthRate = Math.max(0, parseAmount(values.homeGrowthRate || "0"));
  const salaryGrowthRate = Math.max(0, parseAmount(values.salaryGrowthRate || "0"));
  const monthlyMortgagePayment = Math.max(0, parseAmount(values["housing.housingPayment"] || "0"));
  const monthlyDisposable = monthlyIncome - monthlyExpenses;

  const projection = computeProjection({
    selectedMonths,
    startingSavings,
    homeValue,
    mortgageDebt,
    interestRate,
    homeGrowthRate,
    salaryGrowthRate,
    monthlyIncome,
    expectedMonthlySavings,
    monthlyMortgagePayment,
  });

  const netWorthNow = startingSavings + homeValue - mortgageDebt;
  const reportName =
    (values.reportName || "").trim() ||
    fileName.replace(/\.[^/.]+$/, "").trim() ||
    "Uden navn";

  return {
    id: crypto.randomUUID(),
    sourceFile: fileName,
    reportName,
    selectedMonths,
    monthlyIncome,
    monthlyExpenses,
    monthlyDisposable,
    annualIncome: monthlyIncome * 12,
    annualExpenses: monthlyExpenses * 12,
    annualSurplus: monthlyDisposable * 12,
    startingSavings,
    expectedMonthlySavings,
    homeValue,
    mortgageDebt,
    interestRate,
    homeGrowthRate,
    salaryGrowthRate,
    monthlyMortgagePayment,
    finalNetWorth: projection.finalNetWorth,
    netWorthGrowth: projection.finalNetWorth - netWorthNow,
    finalDebt: projection.finalDebt,
    finalHomeValue: projection.finalHomeValue,
    finalCash: projection.finalCash,
  };
}

export function ReportsComparison() {
  const { isDarkMode } = useAppTheme();
  const [reports, setReports] = useState<ParsedReport[]>([]);
  const [status, setStatus] = useState("");
  const [householdType, setHouseholdType] = useState<HouseholdType>("2v0b");

  const household = HOUSEHOLD_TARGETS[householdType];

  const reportComparisons = useMemo(() => {
    return reports.map((report) => {
      const disposableDistance = Math.abs(report.monthlyDisposable - household.targetDisposable);
      const balanceScore = Math.max(0, 100 - (disposableDistance / Math.max(1, household.targetDisposable)) * 100);
      return {
        ...report,
        disposableDistance,
        balanceScore,
      };
    });
  }, [household.targetDisposable, reports]);

  const bestDisposable = useMemo(
    () => reportComparisons.reduce((best, current) => (current.monthlyDisposable > (best?.monthlyDisposable ?? -Infinity) ? current : best), reportComparisons[0]),
    [reportComparisons],
  );
  const bestWealthGrowth = useMemo(
    () => reportComparisons.reduce((best, current) => (current.netWorthGrowth > (best?.netWorthGrowth ?? -Infinity) ? current : best), reportComparisons[0]),
    [reportComparisons],
  );
  const bestBalanced = useMemo(
    () => reportComparisons.reduce((best, current) => (current.balanceScore > (best?.balanceScore ?? -Infinity) ? current : best), reportComparisons[0]),
    [reportComparisons],
  );

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    try {
      setStatus("Importerer rapporter...");
      const xlsx = await import("xlsx");
      const imported: ParsedReport[] = [];

      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const workbook = xlsx.read(buffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null });

        const report = parseReportRows(rows, file.name);
        if (report) {
          imported.push(report);
        }
      }

      if (imported.length === 0) {
        setStatus("Ingen gyldige rapporter fundet i filerne.");
      } else {
        setReports((current) => [...imported, ...current]);
        setStatus(`${imported.length} rapport(er) importeret.`);
      }
    } catch {
      setStatus("Import fejlede. Kontroller at filerne er .xlsx/.xls/.csv.");
    }

    event.target.value = "";
  };

  const removeReport = (id: string) => {
    setReports((current) => current.filter((report) => report.id !== id));
  };

  const clearAll = () => {
    setReports([]);
    setStatus("Alle rapporter fjernet.");
  };

  return (
    <section className="mt-4 space-y-4">
      <div className={`rounded-2xl border p-4 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"}`}>
        <h1 className={`text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Rapport-sammenligning</h1>
        <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
          Importer 2+ budgetfiler og sammenlign raaadighedsbelob, forventet formue/afkast og hvilken rapport der er mest balanceret.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500">
            Importer Excel/CSV (flere)
            <input type="file" accept=".xlsx,.xls,.csv" multiple className="hidden" onChange={handleImport} />
          </label>
          <button
            type="button"
            onClick={clearAll}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            Ryd alle
          </button>
          <select
            value={householdType}
            onChange={(event) => setHouseholdType(event.target.value as HouseholdType)}
            className={`rounded-full border px-3 py-2 text-sm outline-none ring-cyan-300 focus:ring ${
              isDarkMode ? "border-slate-700 bg-slate-950 text-slate-200" : "border-cyan-100 bg-white text-slate-700"
            }`}
            aria-label="Husstandstype"
          >
            {Object.entries(HOUSEHOLD_TARGETS).map(([key, value]) => (
              <option key={key} value={key}>
                {value.label} (maal {formatCurrency(value.targetDisposable)})
              </option>
            ))}
          </select>
        </div>

        {status ? <p className={`mt-2 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{status}</p> : null}
      </div>

      {reportComparisons.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-3">
          <article className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Stoerst raadighedsbelob</p>
            <p className={`mt-1 text-sm font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{bestDisposable?.reportName ?? "-"}</p>
            <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{bestDisposable ? formatCurrency(bestDisposable.monthlyDisposable) + " / md" : "-"}</p>
          </article>
          <article className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Stoerst afkast formue/bolig</p>
            <p className={`mt-1 text-sm font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{bestWealthGrowth?.reportName ?? "-"}</p>
            <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{bestWealthGrowth ? formatCurrency(bestWealthGrowth.netWorthGrowth) : "-"}</p>
          </article>
          <article className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Mest balanceret oekonomi</p>
            <p className={`mt-1 text-sm font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{bestBalanced?.reportName ?? "-"}</p>
            <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              {bestBalanced ? `Score ${bestBalanced.balanceScore.toFixed(0)} (maal ${formatCurrency(household.targetDisposable)})` : "-"}
            </p>
          </article>
        </div>
      ) : null}

      <div className="space-y-3">
        {reportComparisons.map((report) => (
          <article key={report.id} className={`rounded-2xl border p-4 shadow-[0_16px_40px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className={`text-base font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{report.reportName}</h2>
                <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Fil: {report.sourceFile} | Periode: {report.selectedMonths} mdr</p>
              </div>
              <button
                type="button"
                onClick={() => removeReport(report.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Fjern
              </button>
            </div>

            <div className={`mt-3 grid gap-2 text-sm md:grid-cols-2 xl:grid-cols-4 ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
              <p className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-800/80" : "bg-slate-50"}`}>
                <span>Raadighedsbelob</span>
                <span className="font-semibold">{formatCurrency(report.monthlyDisposable)}</span>
              </p>
              <p className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-800/80" : "bg-slate-50"}`}>
                <span>Indkomst / md</span>
                <span className="font-semibold">{formatCurrency(report.monthlyIncome)}</span>
              </p>
              <p className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-800/80" : "bg-slate-50"}`}>
                <span>Udgifter / md</span>
                <span className="font-semibold">{formatCurrency(report.monthlyExpenses)}</span>
              </p>
              <p className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-800/80" : "bg-slate-50"}`}>
                <span>Aarsflow</span>
                <span className="font-semibold">{formatCurrency(report.annualSurplus)}</span>
              </p>
              <p className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-800/80" : "bg-slate-50"}`}>
                <span>Formuevaekst</span>
                <span className="font-semibold">{formatCurrency(report.netWorthGrowth)}</span>
              </p>
              <p className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-800/80" : "bg-slate-50"}`}>
                <span>Forventet slutformue</span>
                <span className="font-semibold">{formatCurrency(report.finalNetWorth)}</span>
              </p>
              <p className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-800/80" : "bg-slate-50"}`}>
                <span>Slut boligvaerdi</span>
                <span className="font-semibold">{formatCurrency(report.finalHomeValue)}</span>
              </p>
              <p className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDarkMode ? "bg-slate-800/80" : "bg-slate-50"}`}>
                <span>Balance-score</span>
                <span className="font-semibold">
                  {report.balanceScore.toFixed(0)} ({formatCurrency(report.monthlyDisposable)} vs {formatCurrency(household.targetDisposable)})
                </span>
              </p>
            </div>
          </article>
        ))}
      </div>

      {reportComparisons.length === 0 ? (
        <p className={`rounded-2xl border p-4 text-sm ${isDarkMode ? "border-slate-700/70 bg-slate-900/90 text-slate-300" : "border-cyan-100 bg-white/88 text-slate-600"}`}>
          Ingen rapporter endnu. Importer mindst 2 filer for at sammenligne.
        </p>
      ) : null}
    </section>
  );
}
