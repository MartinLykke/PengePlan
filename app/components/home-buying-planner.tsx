"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppTheme } from "./use-app-theme";

const OVERVIEW_SNAPSHOT_STORAGE_KEY = "myfinance.overviewSnapshot";

type OverviewSnapshot = {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyDisposable: number;
  finalCash?: number;
  finalDebt?: number;
  reportName?: string;
  savedAt?: string;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function principalFromPayment(payment: number, annualRatePercent: number, years: number): number {
  const monthlyRate = Math.max(0, annualRatePercent) / 100 / 12;
  const months = Math.max(1, Math.round(years * 12));
  if (monthlyRate === 0) {
    return payment * months;
  }
  const factor = (1 - (1 + monthlyRate) ** -months) / monthlyRate;
  return payment * factor;
}

function monthlyPaymentFromPrincipal(principal: number, annualRatePercent: number, years: number): number {
  const monthlyRate = Math.max(0, annualRatePercent) / 100 / 12;
  const months = Math.max(1, Math.round(years * 12));
  if (monthlyRate === 0) {
    return principal / months;
  }
  return (principal * monthlyRate) / (1 - (1 + monthlyRate) ** -months);
}

export function HomeBuyingPlanner() {
  const { isDarkMode } = useAppTheme();
  const [snapshot] = useState<OverviewSnapshot | null>(() => {
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

  const monthlyIncome = snapshot?.monthlyIncome ?? 0;
  const monthlyDisposable = snapshot?.monthlyDisposable ?? 0;

  const [interestRate, setInterestRate] = useState("4.0");
  const [loanYears, setLoanYears] = useState("30");
  const [housingShareLimit, setHousingShareLimit] = useState("30");
  const [monthlyHousingFixedCosts, setMonthlyHousingFixedCosts] = useState("2500");
  const [debtToIncomeCap, setDebtToIncomeCap] = useState("4");
  const [existingDebt, setExistingDebt] = useState(String(Math.max(0, snapshot?.finalDebt ?? 0)));
  const [downPaymentPercent, setDownPaymentPercent] = useState("5");
  const [availableCash, setAvailableCash] = useState(String(Math.max(0, snapshot?.finalCash ?? 0)));
  const [monthlySavingsForHome, setMonthlySavingsForHome] = useState(String(Math.max(0, Math.round(monthlyDisposable * 0.5))));

  const calc = useMemo(() => {
    const income = Math.max(0, Number(monthlyIncome) || 0);
    const disposable = Math.max(0, Number(monthlyDisposable) || 0);
    const rate = Math.max(0, Number(interestRate) || 0);
    const years = Math.max(1, Number(loanYears) || 1);
    const shareLimit = clamp(Number(housingShareLimit) || 0, 5, 80);
    const fixedHousing = Math.max(0, Number(monthlyHousingFixedCosts) || 0);
    const dtiCap = Math.max(1, Number(debtToIncomeCap) || 1);
    const currentDebt = Math.max(0, Number(existingDebt) || 0);
    const downPct = clamp(Number(downPaymentPercent) || 0, 0, 80);
    const cash = Math.max(0, Number(availableCash) || 0);
    const monthlySave = Math.max(0, Number(monthlySavingsForHome) || 0);

    const maxHousingBudget = Math.max((income * shareLimit) / 100 - fixedHousing, 0);
    const loanByPayment = principalFromPayment(maxHousingBudget, rate, years);
    const loanByIncome = Math.max(income * 12 * dtiCap - currentDebt, 0);
    const maxLoan = Math.min(loanByPayment, loanByIncome);

    const ownPayRatio = downPct / 100;
    const maxPrice = ownPayRatio >= 1 ? 0 : maxLoan / (1 - ownPayRatio);
    const recommendedPrice = maxPrice * 0.9;
    const neededDownPayment = maxPrice * ownPayRatio;
    const buyerCosts = maxPrice * 0.045;
    const upfrontNeed = neededDownPayment + buyerCosts;
    const missingUpfront = Math.max(upfrontNeed - cash, 0);
    const monthsToReady = monthlySave > 0 ? Math.ceil(missingUpfront / monthlySave) : null;

    const stressRate = rate + 2;
    const stressPayment = monthlyPaymentFromPrincipal(maxLoan, stressRate, years);
    const normalPayment = monthlyPaymentFromPrincipal(maxLoan, rate, years);
    const stressDisposableLeft = disposable - (stressPayment + fixedHousing);

    return {
      rate,
      years,
      shareLimit,
      maxHousingBudget,
      loanByPayment,
      loanByIncome,
      maxLoan,
      maxPrice,
      recommendedPrice,
      neededDownPayment,
      buyerCosts,
      upfrontNeed,
      missingUpfront,
      monthsToReady,
      stressRate,
      stressPayment,
      normalPayment,
      stressDisposableLeft,
    };
  }, [
    availableCash,
    debtToIncomeCap,
    downPaymentPercent,
    existingDebt,
    housingShareLimit,
    interestRate,
    loanYears,
    monthlyDisposable,
    monthlyHousingFixedCosts,
    monthlyIncome,
    monthlySavingsForHome,
  ]);

  if (!snapshot) {
    return (
      <section className={`mt-4 rounded-2xl border p-6 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"}`}>
        <h1 className={`text-lg font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Boligkoeb</h1>
        <p className={`mt-2 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Udfyld budget foerst. Saa kan siden beregne en realistisk max boligpris.</p>
        <Link href="/" className="mt-4 inline-flex rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
          Gaa til budget
        </Link>
      </section>
    );
  }

  return (
    <section className="mt-4 space-y-4">
      <div className={`rounded-2xl border p-4 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"}`}>
        <h1 className={`text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Boligkoeb</h1>
        <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Vurder max boligpris ud fra din oekonomi, udbetaling og risikotest.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Max boligpris", value: calc.maxPrice },
          { label: "Anbefalet pris", value: calc.recommendedPrice },
          { label: "Max laan", value: calc.maxLoan },
          { label: "Maanedsydelse (nu)", value: calc.normalPayment },
        ].map((item) => (
          <article key={item.label} className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
            <p className={`text-[11px] font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{item.label}</p>
            <p className={`mt-1 text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{formatCurrency(item.value)}</p>
          </article>
        ))}
      </div>

      <div className={`rounded-2xl border p-4 ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
        <h2 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Antagelser</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <input value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="Rente %" className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"}`} />
          <input value={loanYears} onChange={(e) => setLoanYears(e.target.value)} placeholder="Loebetid aar" className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"}`} />
          <input value={housingShareLimit} onChange={(e) => setHousingShareLimit(e.target.value)} placeholder="Boligprocent %" className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"}`} />
          <input value={monthlyHousingFixedCosts} onChange={(e) => setMonthlyHousingFixedCosts(e.target.value)} placeholder="Faste boligomk./md" className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"}`} />
          <input value={debtToIncomeCap} onChange={(e) => setDebtToIncomeCap(e.target.value)} placeholder="Gaeldsfaktor" className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"}`} />
          <input value={existingDebt} onChange={(e) => setExistingDebt(e.target.value)} placeholder="Eksisterende gaeld" className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"}`} />
          <input value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(e.target.value)} placeholder="Udbetaling %" className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"}`} />
          <input value={availableCash} onChange={(e) => setAvailableCash(e.target.value)} placeholder="Opsparing nu" className={`rounded-lg border px-3 py-2 text-sm ${isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"}`} />
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <article className={`rounded-2xl border p-4 ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Egenbetaling og omkostninger</h3>
          <div className={`mt-3 space-y-2 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            <p className="flex justify-between"><span>Udbetaling</span><span className="font-semibold">{formatCurrency(calc.neededDownPayment)}</span></p>
            <p className="flex justify-between"><span>Koebeomkostninger (est.)</span><span className="font-semibold">{formatCurrency(calc.buyerCosts)}</span></p>
            <p className="flex justify-between"><span>I alt kontant behov</span><span className="font-semibold">{formatCurrency(calc.upfrontNeed)}</span></p>
            <p className="flex justify-between"><span>Mangler</span><span className={`font-semibold ${calc.missingUpfront > 0 ? (isDarkMode ? "text-amber-300" : "text-amber-700") : ""}`}>{formatCurrency(calc.missingUpfront)}</span></p>
          </div>
          <div className="mt-3">
            <input value={monthlySavingsForHome} onChange={(e) => setMonthlySavingsForHome(e.target.value)} placeholder="Opsparing mod bolig / md" className={`w-full rounded-lg border px-3 py-2 text-sm ${isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"}`} />
            <p className={`mt-2 text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              Tid til koebsklar: {calc.monthsToReady === null ? "kan ikke beregnes" : `${calc.monthsToReady} mdr`}
            </p>
          </div>
        </article>

        <article className={`rounded-2xl border p-4 ${isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/90"}`}>
          <h3 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-slate-800"}`}>Risikotest (+2% rente)</h3>
          <div className={`mt-3 space-y-2 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-700"}`}>
            <p className="flex justify-between"><span>Ydelse ved {calc.rate.toFixed(1)}%</span><span className="font-semibold">{formatCurrency(calc.normalPayment)}</span></p>
            <p className="flex justify-between"><span>Ydelse ved {calc.stressRate.toFixed(1)}%</span><span className="font-semibold">{formatCurrency(calc.stressPayment)}</span></p>
            <p className="flex justify-between"><span>Raadighed efter stress</span><span className={`font-semibold ${calc.stressDisposableLeft < 0 ? (isDarkMode ? "text-rose-300" : "text-rose-700") : ""}`}>{formatCurrency(calc.stressDisposableLeft)}</span></p>
          </div>
          <div className="mt-3 space-y-2">
            <div>
              <p className={`mb-1 text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Laanegraense via betaling</p>
              <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${clamp((calc.loanByPayment / Math.max(calc.loanByIncome, calc.loanByPayment, 1)) * 100, 0, 100)}%` }} />
              </div>
            </div>
            <div>
              <p className={`mb-1 text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>Laanegraense via gaeldsfaktor</p>
              <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${clamp((calc.loanByIncome / Math.max(calc.loanByIncome, calc.loanByPayment, 1)) * 100, 0, 100)}%` }} />
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

