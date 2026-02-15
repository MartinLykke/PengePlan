"use client";

import { ChangeEvent, DragEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { SidebarControls } from "./sidebar-controls";
import { applyDarkMode, DARK_MODE_STORAGE_KEY, THEME_CHANGE_EVENT, readInitialDarkMode } from "./use-app-theme";

type PeriodOption = {
  label: string;
  months: number;
};

type FieldConfig = {
  key: string;
  label: string;
  placeholder: string;
};

type BudgetFieldSection = "income" | "housing" | "transport" | "fixed";
type BudgetFieldPeriod = "monthly" | "yearly";
type MidPageCard = "wealthAssumptions" | "pension";
type LowerPageCard = "projection" | "moreCharts";
type ImportFeedbackType = "success" | "error" | "info";

type ImportTarget = {
  section: BudgetFieldSection | "meta";
  key: string;
};

const PERIODS: PeriodOption[] = [
  { label: "3 mdr", months: 3 },
  { label: "6 mdr", months: 6 },
  { label: "1 år", months: 12 },
  { label: "2 år", months: 24 },
  { label: "5 år", months: 60 },
  { label: "10 år", months: 120 },
  { label: "30 år", months: 360 },
];

const CHART_WIDTH = 860;
const CHART_HEIGHT = 340;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_RIGHT = 20;
const CHART_PADDING_BOTTOM = 42;
const CHART_PADDING_LEFT = 72;
const SIDEBAR_VISIBILITY_STORAGE_KEY = "myfinance.sidebarVisible";
const HIDDEN_FIELDS_STORAGE_KEY = "myfinance.hiddenBudgetFields";
const COLLAPSED_SECTIONS_STORAGE_KEY = "myfinance.collapsedSections";
const PERIOD_TOGGLE_STORAGE_KEY = "myfinance.periodTogglesEnabled";
const SECTION_ORDER_STORAGE_KEY = "myfinance.sectionOrder";
const MID_PAGE_CARD_ORDER_STORAGE_KEY = "myfinance.midPageCardOrder";
const LOWER_PAGE_CARD_ORDER_STORAGE_KEY = "myfinance.lowerPageCardOrder";
const OVERVIEW_CHARTS_STORAGE_KEY = "myfinance.overviewChartsVisible";
const OVERVIEW_SNAPSHOT_STORAGE_KEY = "myfinance.overviewSnapshot";
const CUSTOM_FIELDS_STORAGE_KEY = "myfinance.customBudgetFields";
const OVERVIEW_HISTORY_STORAGE_KEY = "myfinance.overviewMonthlyHistory";

type OverviewChartKey =
  | "expenseDonut"
  | "incomeVsExpense"
  | "expenseStack"
  | "savingsGauge"
  | "housingGauge"
  | "debtGauge"
  | "assetsVsDebt"
  | "netWorthTrend"
  | "annualFlow"
  | "topExpenses";

const OVERVIEW_CHART_OPTIONS: { key: OverviewChartKey; label: string }[] = [
  { key: "expenseDonut", label: "Udgifter donut" },
  { key: "incomeVsExpense", label: "Indkomst vs udgift" },
  { key: "expenseStack", label: "Udgiftsmix" },
  { key: "savingsGauge", label: "Opsparings-rate" },
  { key: "housingGauge", label: "Boligprocent" },
  { key: "debtGauge", label: "Gaeldsprocent" },
  { key: "assetsVsDebt", label: "Aktiver vs gaeld" },
  { key: "netWorthTrend", label: "Formue-trend" },
  { key: "annualFlow", label: "Aarsflow" },
  { key: "topExpenses", label: "Top udgifter" },
];

const DEFAULT_OVERVIEW_CHARTS: OverviewChartKey[] = OVERVIEW_CHART_OPTIONS.map((entry) => entry.key);

const INCOME_FIELDS: FieldConfig[] = [
  { key: "person1Salary", label: "Person 1 løn efter skat", placeholder: "30237" },
  { key: "person2Salary", label: "Person 2 løn efter skat", placeholder: "1000" },
  { key: "benefits", label: "Dagpenge, kontanthjælp, SU", placeholder: "5800" },
  { key: "childBenefits", label: "Børnepenge", placeholder: "1708" },
  { key: "otherIncome", label: "øvrige indtægter efter skat", placeholder: "1250" },
];

const HOUSING_FIELDS: FieldConfig[] = [
  { key: "housingPayment", label: "Husleje/ydelse på boliglån", placeholder: "10081" },
  { key: "heat", label: "Varme", placeholder: "610" },
  { key: "water", label: "Vand", placeholder: "700" },
  { key: "electricity", label: "El", placeholder: "350" },
  { key: "gas", label: "Gas", placeholder: "275" },
  { key: "propertyTax", label: "Ejendomsskat/ejerudgift", placeholder: "3600" },
  { key: "maintenance", label: "Vedligehold og reparation", placeholder: "450" },
  { key: "otherHousing", label: "Andre udgifter", placeholder: "320" },
];

const TRANSPORT_FIELDS: FieldConfig[] = [
  { key: "leasing", label: "Leasingaftale/Billån", placeholder: "2800" },
  { key: "publicTransport", label: "Offentlig transport", placeholder: "4200" },
  { key: "fuel", label: "Brændstof", placeholder: "950" },
  { key: "ownershipTax", label: "Ejerafgift", placeholder: "210" },
  { key: "transportMaintenance", label: "Vedligehold og reparation", placeholder: "375" },
];

const FIXED_FIELDS: FieldConfig[] = [
  { key: "union", label: "Fagforening", placeholder: "293" },
  { key: "aKasse", label: "A-kasse", placeholder: "467" },
  { key: "insurance", label: "Forsikringer", placeholder: "328" },
  { key: "accidentInsurance", label: "Ulykkesforsikring", placeholder: "180" },
  { key: "travelInsurance", label: "Årsrejseforsikring", placeholder: "95" },
  { key: "homeInsurance", label: "Indbo", placeholder: "240" },
  { key: "healthInsurance", label: "Sygesikring", placeholder: "169" },
  { key: "daycare", label: "Daginstitution/SFO", placeholder: "1800" },
  { key: "tvSubscriptions", label: "TV/Licens/Abonnementer", placeholder: "30" },
  { key: "phoneInternet", label: "Telefon/internet", placeholder: "119" },
  { key: "medicine", label: "Medicin", placeholder: "50" },
  { key: "sport", label: "Sport og fritid", placeholder: "500" },
  { key: "glasses", label: "Briller og kontaktlinser", placeholder: "88" },
  { key: "dentist", label: "Tandlæge", placeholder: "86" },
  { key: "food", label: "Mad", placeholder: "4200" },
];

const SECTION_LABELS: Record<BudgetFieldSection, string> = {
  income: "Indtægter",
  housing: "Bolig",
  transport: "Transport",
  fixed: "Øvrige faste",
};

const SECTION_ICONS: Record<BudgetFieldSection, string> = {
  income: "💰",
  housing: "🏡",
  transport: "🚗",
  fixed: "🧾",
};

const DEFAULT_SECTION_ORDER: BudgetFieldSection[] = ["income", "housing", "transport", "fixed"];
const DEFAULT_MID_PAGE_CARD_ORDER: MidPageCard[] = ["wealthAssumptions", "pension"];
const DEFAULT_LOWER_PAGE_CARD_ORDER: LowerPageCard[] = ["projection", "moreCharts"];

const IMPORT_MAPPINGS: { aliases: string[]; target: ImportTarget }[] = [
  { aliases: ["martins lon", "person 1", "person1"], target: { section: "income", key: "person1Salary" } },
  { aliases: ["rikkes lon", "person 2", "person2"], target: { section: "income", key: "person2Salary" } },
  { aliases: ["dagpenge", "kontanthjælp", "su"], target: { section: "income", key: "benefits" } },
  { aliases: ["børnepenge"], target: { section: "income", key: "childBenefits" } },
  { aliases: ["øvrige indtægter"], target: { section: "income", key: "otherIncome" } },
  { aliases: ["husleje", "ydelse pa boliglan"], target: { section: "housing", key: "housingPayment" } },
  { aliases: ["varme"], target: { section: "housing", key: "heat" } },
  { aliases: ["vand"], target: { section: "housing", key: "water" } },
  { aliases: ["el"], target: { section: "housing", key: "electricity" } },
  { aliases: ["gas"], target: { section: "housing", key: "gas" } },
  { aliases: ["ejendomsskat", "ejerudgift"], target: { section: "housing", key: "propertyTax" } },
  { aliases: ["vedligehold og reparation"], target: { section: "housing", key: "maintenance" } },
  { aliases: ["andre udgifter"], target: { section: "housing", key: "otherHousing" } },
  { aliases: ["leasingaftale", "billan"], target: { section: "transport", key: "leasing" } },
  { aliases: ["offentlig transport"], target: { section: "transport", key: "publicTransport" } },
  { aliases: ["brændstof"], target: { section: "transport", key: "fuel" } },
  { aliases: ["ejerafgift"], target: { section: "transport", key: "ownershipTax" } },
  { aliases: ["fagforening"], target: { section: "fixed", key: "union" } },
  { aliases: ["a-kasse", "a kasse"], target: { section: "fixed", key: "aKasse" } },
  { aliases: ["forsikringer"], target: { section: "fixed", key: "insurance" } },
  { aliases: ["ulykkesforsikring"], target: { section: "fixed", key: "accidentInsurance" } },
  { aliases: ["arsrejseforsikring"], target: { section: "fixed", key: "travelInsurance" } },
  { aliases: ["indbo"], target: { section: "fixed", key: "homeInsurance" } },
  { aliases: ["sygesikring"], target: { section: "fixed", key: "healthInsurance" } },
  { aliases: ["daginstitution", "sfo"], target: { section: "fixed", key: "daycare" } },
  { aliases: ["tv/licens", "abonnementer"], target: { section: "fixed", key: "tvSubscriptions" } },
  { aliases: ["telefon", "internet"], target: { section: "fixed", key: "phoneInternet" } },
  { aliases: ["medicin"], target: { section: "fixed", key: "medicine" } },
  { aliases: ["sport og fritid"], target: { section: "fixed", key: "sport" } },
  { aliases: ["briller", "kontaktlinser"], target: { section: "fixed", key: "glasses" } },
  { aliases: ["tandlæge"], target: { section: "fixed", key: "dentist" } },
  { aliases: ["mad"], target: { section: "fixed", key: "food" } },
  { aliases: ["startopsparing"], target: { section: "meta", key: "startingSavings" } },
  { aliases: ["boligværdi"], target: { section: "meta", key: "homeValue" } },
  { aliases: ["restgæld"], target: { section: "meta", key: "mortgageDebt" } },
  { aliases: ["rente"], target: { section: "meta", key: "interestRate" } },
  { aliases: ["værdistigning", "vaerdistigning"], target: { section: "meta", key: "homeGrowthRate" } },
  { aliases: ["forventet lønstigning", "forventet lonstigning", "lønstigning", "lonstigning"], target: { section: "meta", key: "salaryGrowthRate" } },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseAmount(value: string): number {
  const trimmed = value.trim();
  if (trimmed === "") {
    return 0;
  }

  let cleaned = trimmed.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!cleaned) {
    return 0;
  }

  if (/^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",") && cleaned.includes(".")) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }

  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : 0;
}

function parseCurrencyAmount(value: string): number {
  const trimmed = value.trim();
  if (trimmed === "") {
    return 0;
  }

  let cleaned = trimmed.replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  if (!cleaned) {
    return 0;
  }

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      cleaned = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    if (/^-?\d{1,3}(,\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, "");
    } else {
      cleaned = cleaned.replace(",", ".");
    }
  } else if (hasDot) {
    const dotCount = (cleaned.match(/\./g) ?? []).length;
    if (dotCount > 1) {
      cleaned = cleaned.replace(/\./g, "");
    } else {
      const [integerPart = "", decimalPart = ""] = cleaned.split(".");
      const isLikelyThousands = integerPart.length >= 1 && integerPart.length <= 3 && decimalPart.length === 3;

      if (isLikelyThousands) {
        cleaned = `${integerPart}${decimalPart}`;
      }
    }
  }

  const amount = Number(cleaned);
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

function formatAmountInput(value: string): string {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "";
  }

  const rounded = Math.max(parseCurrencyAmount(trimmed), 0);
  return new Intl.NumberFormat("da-DK", {
    maximumFractionDigits: 0,
  }).format(rounded);
}

function formatAmountInputOnChange(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (!digitsOnly) {
    return "";
  }

  const amount = Number(digitsOnly);
  if (!Number.isFinite(amount)) {
    return "";
  }

  return new Intl.NumberFormat("da-DK", {
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAmountValues(values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, formatAmountInput(value)]));
}

function normalizeLabel(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function labelMatchesAlias(normalizedLabel: string, alias: string): boolean {
  const normalizedAlias = normalizeLabel(alias);
  if (!normalizedAlias) {
    return false;
  }

  const aliasPattern = normalizedAlias
    .split(" ")
    .filter(Boolean)
    .map((part) => escapeRegex(part))
    .join("\\s+");

  const regex = new RegExp(`(^|\\s)${aliasPattern}($|\\s)`);
  return regex.test(normalizedLabel);
}

function parseExcelAmount(cell: unknown): number | null {
  if (typeof cell === "number" && Number.isFinite(cell)) {
    return cell;
  }

  if (typeof cell !== "string") {
    return null;
  }

  let cleaned = cell.trim().toLowerCase();
  if (!cleaned) {
    return null;
  }

  cleaned = cleaned.replace("kr", "").replace("pr. md.", "").replace("pr md", "").replace(/\s/g, "");
  cleaned = cleaned.replace(/[^0-9,.-]/g, "");

  if (!cleaned) {
    return null;
  }

  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  }

  const amount = Number(cleaned);
  return Number.isFinite(amount) ? amount : null;
}

function isPeriodCell(cell: unknown): boolean {
  if (typeof cell !== "string") {
    return false;
  }

  const normalized = normalizeLabel(cell);
  return normalized === "pr md" || normalized === "pr maned" || normalized === "pr ar";
}

function findAmountNearLabel(row: unknown[], labelIndex: number): number | null {
  let rightBoundary = Math.min(row.length - 1, labelIndex + 6);

  for (let index = labelIndex + 1; index <= rightBoundary; index += 1) {
    if (isPeriodCell(row[index])) {
      rightBoundary = index - 1;
      break;
    }
  }

  for (let index = labelIndex + 1; index <= rightBoundary; index += 1) {
    const value = parseExcelAmount(row[index]);
    if (value !== null) {
      return value;
    }
  }

  return null;
}

function buildFieldId(section: BudgetFieldSection, key: string): string {
  return `${section}.${key}`;
}

function parseFieldId(fieldId: string): { section: BudgetFieldSection; key: string } | null {
  const [rawSection, key] = fieldId.split(".");
  if (!rawSection || !key) {
    return null;
  }

  if (rawSection !== "income" && rawSection !== "housing" && rawSection !== "transport" && rawSection !== "fixed") {
    return null;
  }

  return { section: rawSection, key };
}

function isBudgetFieldSection(value: unknown): value is BudgetFieldSection {
  return value === "income" || value === "housing" || value === "transport" || value === "fixed";
}

function isMidPageCard(value: unknown): value is MidPageCard {
  return value === "wealthAssumptions" || value === "pension";
}

function isLowerPageCard(value: unknown): value is LowerPageCard {
  return value === "projection" || value === "moreCharts";
}

function isOverviewChartKey(value: unknown): value is OverviewChartKey {
  return OVERVIEW_CHART_OPTIONS.some((entry) => entry.key === value);
}

function sumValuesForVisibleFields(
  values: Record<string, string>,
  section: BudgetFieldSection,
  hiddenFieldIds: Set<string>,
  fieldPeriods: Record<string, BudgetFieldPeriod>,
): number {
  return Object.entries(values).reduce((sum, [key, value]) => {
    const fieldId = buildFieldId(section, key);
    if (hiddenFieldIds.has(fieldId)) {
      return sum;
    }

    const period = fieldPeriods[fieldId] ?? "monthly";
    const normalizedValue = parseCurrencyAmount(value);
    const monthlyValue = period === "yearly" ? normalizedValue / 12 : normalizedValue;
    return sum + monthlyValue;
  }, 0);
}

function formatPeriodLabel(months: number): string {
  if (months % 12 === 0) {
    return `${months / 12} ar`;
  }

  return `${months} mdr`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function buildPensionValues(months: number, current: number, monthly: number, annualReturn: number): number[] {
  const monthlyReturn = Math.pow(1 + annualReturn / 100, 1 / 12) - 1;
  const values: number[] = [];
  let value = current;

  for (let month = 0; month <= months; month += 1) {
    values.push(value);

    if (month === months) {
      break;
    }

    value = value * (1 + monthlyReturn) + monthly;
  }

  return values;
}

type ChartSeries = {
  label: string;
  color: string;
  values: number[];
};

type ChartPoint = {
  month: number;
  x: number;
  y: number;
  value: number;
};

type ChartGeometry = {
  seriesPaths: { label: string; color: string; path: string; points: ChartPoint[] }[];
  yTicks: { value: number; y: number }[];
  xTicks: { month: number; x: number; label: string }[];
  min: number;
  max: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function buildChartGeometry(months: number, series: ChartSeries[]): ChartGeometry {
  const left = CHART_PADDING_LEFT;
  const right = CHART_WIDTH - CHART_PADDING_RIGHT;
  const top = CHART_PADDING_TOP;
  const bottom = CHART_HEIGHT - CHART_PADDING_BOTTOM;
  const xRange = right - left;
  const yRange = bottom - top;
  const allValues = series.flatMap((entry) => entry.values);

  let min = Math.min(...allValues);
  let max = Math.max(...allValues);

  if (min === max) {
    min -= 1;
    max += 1;
  } else {
    const margin = (max - min) * 0.08;
    min -= margin;
    max += margin;
  }

  const toX = (month: number) => left + (month / months) * xRange;
  const toY = (value: number) => top + ((max - value) / (max - min)) * yRange;

  const seriesPaths = series.map((entry) => {
    const points = entry.values.map((value, month) => ({
      month,
      x: toX(month),
      y: toY(value),
      value,
    }));
    const path = points.map((point) => `${point.x},${point.y}`).join(" ");
    return { label: entry.label, color: entry.color, path, points };
  });

  const yTickCount = 5;
  const yTicks = Array.from({ length: yTickCount }, (_, index) => {
    const ratio = index / (yTickCount - 1);
    const value = max - ratio * (max - min);
    return { value, y: toY(value) };
  });

  const xTickCount = months > 120 ? 7 : 6;
  const xTicks = Array.from({ length: xTickCount }, (_, index) => {
    const ratio = index / (xTickCount - 1);
    const month = Math.round(ratio * months);
    return { month, x: toX(month), label: formatPeriodLabel(month) };
  });

  return { seriesPaths, yTicks, xTicks, min, max, left, right, top, bottom };
}

function stringifyCell(cell: unknown): string {
  if (typeof cell === "string") {
    return cell.trim();
  }

  if (typeof cell === "number" && Number.isFinite(cell)) {
    return cell.toString();
  }

  return "";
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function shouldPreventCardDrag(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("input, textarea, select, button, label, [contenteditable='true']"));
}

function sanitizeFileName(value: string): string {
  const normalized = value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\.+$/, "");

  return normalized || "myfinance-export";
}

function createCustomFieldKey(label: string, existingKeys: Set<string>): string {
  const base =
    label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "felt";

  let key = `custom_${base}`;
  let index = 2;
  while (existingKeys.has(key)) {
    key = `custom_${base}_${index}`;
    index += 1;
  }
  return key;
}

function isCustomFieldKey(key: string): boolean {
  return key.startsWith("custom_");
}

type BudgetSectionProps = {
  section: BudgetFieldSection;
  title: string;
  fields: FieldConfig[];
  values: Record<string, string>;
  fieldPeriods: Record<string, BudgetFieldPeriod>;
  arePeriodTogglesEnabled: boolean;
  onChange: (key: string, value: string) => void;
  onPeriodChange: (section: BudgetFieldSection, key: string, period: BudgetFieldPeriod) => void;
  onHideField: (section: BudgetFieldSection, key: string) => void;
  hiddenFieldIds: Set<string>;
  totalLabel: string;
  totalValue: number;
  percentageOfIncome?: number;
  darkMode?: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onAddField: (section: BudgetFieldSection) => void;
};

function BudgetSection({
  section,
  title,
  fields,
  values,
  fieldPeriods,
  arePeriodTogglesEnabled,
  onChange,
  onPeriodChange,
  onHideField,
  hiddenFieldIds,
  totalLabel,
  totalValue,
  percentageOfIncome,
  darkMode = false,
  isCollapsed,
  onToggleCollapsed,
  onAddField,
}: BudgetSectionProps) {
  const visibleFields = fields.filter((field) => !hiddenFieldIds.has(buildFieldId(section, field.key)));
  const sectionIcon = SECTION_ICONS[section];
  const lightHeaderClass =
    section === "income"
      ? "bg-gradient-to-r from-emerald-100 via-teal-100 to-cyan-100 text-emerald-950"
      : section === "housing"
        ? "bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 text-rose-950"
        : section === "transport"
          ? "bg-gradient-to-r from-sky-100 via-blue-100 to-indigo-100 text-indigo-950"
          : "bg-gradient-to-r from-violet-100 via-fuchsia-100 to-pink-100 text-fuchsia-950";
  const lightFooterClass =
    section === "income"
      ? "bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-950"
      : section === "housing"
        ? "bg-gradient-to-r from-amber-50 to-rose-50 text-rose-950"
        : section === "transport"
          ? "bg-gradient-to-r from-sky-50 to-indigo-50 text-indigo-950"
          : "bg-gradient-to-r from-violet-50 to-pink-50 text-fuchsia-950";
  const lightBorderClass =
    section === "income"
      ? "border-emerald-200 bg-white/96"
      : section === "housing"
        ? "border-amber-200 bg-white/96"
        : section === "transport"
          ? "border-sky-200 bg-white/96"
          : "border-violet-200 bg-white/96";

  return (
    <div
      className={`flex h-full flex-col overflow-hidden rounded-2xl border shadow-[0_18px_44px_-24px_rgba(2,6,23,0.45)] backdrop-blur-sm transition ${
        darkMode ? "border-slate-700/70 bg-slate-900/88" : lightBorderClass
      }`}
    >
      <h2
        className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold uppercase tracking-wide ${
          darkMode
            ? "bg-gradient-to-r from-cyan-900/70 via-blue-900/65 to-slate-800 text-cyan-100"
            : lightHeaderClass
        }`}
      >
        <span className="text-base">{sectionIcon}</span>
        <span className="flex-1">{title}</span>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
            darkMode ? "bg-slate-800 text-slate-100 hover:bg-slate-700" : "bg-white/85 text-slate-700 hover:bg-white"
          }`}
          aria-label={isCollapsed ? `Udvid ${title}` : `Minimer ${title}`}
          title={isCollapsed ? `Udvid ${title}` : `Minimer ${title}`}
        >
          {isCollapsed ? "+" : "-"}
        </button>
      </h2>
      {!isCollapsed ? (
      <div className="flex-1 space-y-2 p-4">
        {visibleFields.map((field) => (
          <div key={field.key} className={`grid gap-1 text-sm ${darkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <input
                  id={`${section}-${field.key}`}
                  type="text"
                  inputMode="decimal"
                  value={values[field.key] ?? ""}
                  onChange={(event) => onChange(field.key, formatAmountInputOnChange(event.target.value))}
                  className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                    darkMode
                      ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                      : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                  }`}
                  placeholder={field.label}
                  aria-label={field.label}
                />
                {(values[field.key] ?? "").trim() !== "" ? (
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                      darkMode ? "text-slate-300 font-medium" : "text-slate-700 font-medium"
                    }`}
                  >
                    {field.label}
                  </span>
                ) : null}
              </div>
              {arePeriodTogglesEnabled ? (
                <div
                  className={`flex items-center gap-1 rounded-full border p-1 text-[11px] font-semibold ${
                    darkMode ? "border-slate-700 bg-slate-900 text-slate-200" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onPeriodChange(section, field.key, "monthly")}
                    aria-pressed={(fieldPeriods[buildFieldId(section, field.key)] ?? "monthly") === "monthly"}
                    className={`rounded-full px-2 py-0.5 transition ${
                      (fieldPeriods[buildFieldId(section, field.key)] ?? "monthly") === "monthly"
                        ? darkMode
                          ? "bg-slate-700 text-slate-100"
                          : "bg-slate-200 text-slate-900"
                        : darkMode
                          ? "text-slate-300 hover:bg-slate-800"
                          : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    md
                  </button>
                  <button
                    type="button"
                    onClick={() => onPeriodChange(section, field.key, "yearly")}
                    aria-pressed={(fieldPeriods[buildFieldId(section, field.key)] ?? "monthly") === "yearly"}
                    className={`rounded-full px-2 py-0.5 transition ${
                      (fieldPeriods[buildFieldId(section, field.key)] ?? "monthly") === "yearly"
                        ? darkMode
                          ? "bg-slate-700 text-slate-100"
                          : "bg-slate-200 text-slate-900"
                        : darkMode
                          ? "text-slate-300 hover:bg-slate-800"
                          : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    år
                  </button>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => onHideField(section, field.key)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                  darkMode
                    ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                title={`Fjern ${field.label}`}
                aria-label={`Fjern ${field.label}`}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        {visibleFields.length === 0 ? (
          <p className={`rounded-lg border px-3 py-2 text-xs ${darkMode ? "border-slate-700 text-slate-300" : "border-sky-100 text-zinc-500"}`}>
            Ingen aktive felter i denne sektion.
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => onAddField(section)}
          className={`w-full rounded-lg border px-3 py-2 text-left text-sm font-semibold transition ${
            darkMode ? "border-slate-700 bg-slate-800/80 text-slate-100 hover:bg-slate-700" : "border-sky-200 bg-sky-50/80 text-slate-800 hover:bg-sky-100"
          }`}
          aria-label={`Tilfoej felt i ${title}`}
          title={`Tilfoej felt i ${title}`}
        >
          + Tilfoej felt
        </button>
      </div>
      ) : null}
      <div
        className={`flex items-center justify-between px-4 py-3 text-sm font-semibold ${
          darkMode ? "bg-slate-800/80 text-slate-100" : lightFooterClass
        }`}
      >
        <span>{totalLabel}</span>
        <span>
          {formatCurrency(totalValue)}
          {typeof percentageOfIncome === "number" ? ` (${percentageOfIncome.toFixed(0)}%)` : ""}
        </span>
      </div>
    </div>
  );
}

type ProjectionChartProps = {
  title: string;
  subtitle: string;
  months: number;
  series: ChartSeries[];
  ariaLabel: string;
  darkMode?: boolean;
};

function ProjectionChart({ title, subtitle, months, series, ariaLabel, darkMode = false }: ProjectionChartProps) {
  const chart = useMemo(() => buildChartGeometry(months, series), [months, series]);
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const titleIcon = title.toLowerCase().includes("pension") ? "📈" : "📉";

  const hoveredPoints = useMemo(() => {
    if (hoveredMonth === null) {
      return [];
    }

    return chart.seriesPaths
      .map((entry) => {
        const point = entry.points[hoveredMonth];
        if (!point) {
          return null;
        }

        return { label: entry.label, color: entry.color, point };
      })
      .filter((entry): entry is { label: string; color: string; point: ChartPoint } => entry !== null);
  }, [chart.seriesPaths, hoveredMonth]);

  const hoveredX = useMemo(() => {
    if (hoveredMonth === null) {
      return null;
    }

    const ratio = clamp(hoveredMonth / Math.max(months, 1), 0, 1);
    return chart.left + ratio * (chart.right - chart.left);
  }, [chart.left, chart.right, hoveredMonth, months]);

  const tooltipY = useMemo(() => {
    if (hoveredPoints.length === 0) {
      return null;
    }

    const minY = Math.min(...hoveredPoints.map((entry) => entry.point.y));
    return Math.max(chart.top + 20, minY - 14);
  }, [chart.top, hoveredPoints]);

  const tooltipWidth = 210;
  const tooltipHeight = 22 + hoveredPoints.length * 14;
  const tooltipX =
    hoveredX === null ? null : hoveredX > chart.right - tooltipWidth - 12 ? hoveredX - tooltipWidth - 12 : hoveredX + 10;
  const tooltipTextX = tooltipX === null ? null : tooltipX + 12;
  const tooltipTop = tooltipY === null ? null : Math.max(chart.top + 8, Math.min(tooltipY, chart.bottom - tooltipHeight - 8));

  const handleChartMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    if (bounds.width === 0) {
      return;
    }

    const xInViewBox = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;
    const ratio = clamp((xInViewBox - chart.left) / (chart.right - chart.left), 0, 1);
    const nextMonth = Math.round(ratio * months);
    setHoveredMonth(nextMonth);
  };

  return (
    <div className={`rounded-2xl p-4 shadow-[0_16px_44px_-28px_rgba(2,6,23,0.45)] backdrop-blur-sm md:p-4 ${darkMode ? "bg-slate-900/88" : "bg-white/82"}`}>
      <h3 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
        <span>{titleIcon}</span>
        {title}
      </h3>
      <p className={`mt-1 text-xs ${darkMode ? "text-slate-300" : "text-slate-600"}`}>{subtitle}</p>

      <div className={`mt-4 overflow-x-auto overflow-y-visible rounded-xl p-2 ${darkMode ? "bg-gradient-to-br from-slate-900 to-slate-800" : "bg-gradient-to-br from-sky-50/80 to-cyan-50/45"}`}>
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-80 min-w-[620px] w-full overflow-visible"
          role="img"
          aria-label={ariaLabel}
          onMouseMove={handleChartMouseMove}
          onMouseLeave={() => setHoveredMonth(null)}
        >
          {chart.yTicks.map((tick) => (
            <line
              key={`y-${tick.y}`}
              x1={chart.left}
              y1={tick.y}
              x2={chart.right}
              y2={tick.y}
              stroke="#e4e4e7"
              strokeWidth="1"
              strokeDasharray="3 5"
            />
          ))}

          {chart.xTicks.map((tick) => (
            <line
              key={`x-${tick.month}`}
              x1={tick.x}
              y1={chart.top}
              x2={tick.x}
              y2={chart.bottom}
              stroke="#ececf0"
              strokeWidth="1"
            />
          ))}

          <line x1={chart.left} y1={chart.top} x2={chart.left} y2={chart.bottom} stroke="#a1a1aa" strokeWidth="1.5" />
          <line x1={chart.left} y1={chart.bottom} x2={chart.right} y2={chart.bottom} stroke="#a1a1aa" strokeWidth="1.5" />

          {chart.yTicks.map((tick) => (
            <text key={`y-label-${tick.y}`} x={chart.left - 8} y={tick.y + 4} textAnchor="end" fill="#52525b" fontSize="11">
              {formatCurrency(tick.value)}
            </text>
          ))}

          {chart.xTicks.map((tick) => (
            <text key={`x-label-${tick.month}`} x={tick.x} y={chart.bottom + 18} textAnchor="middle" fill="#52525b" fontSize="11">
              {tick.label}
            </text>
          ))}

          <text x={18} y={(chart.top + chart.bottom) / 2} fill="#3f3f46" fontSize="12" transform={`rotate(-90 18 ${(chart.top + chart.bottom) / 2})`}>
            Beløb (DKK)
          </text>
          <text x={(chart.left + chart.right) / 2} y={CHART_HEIGHT - 8} fill="#3f3f46" fontSize="12" textAnchor="middle">
            Tid
          </text>

          {chart.seriesPaths.map((entry) => (
            <polyline
              key={entry.label}
              fill="none"
              stroke={entry.color}
              strokeWidth="3"
              points={entry.path}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {hoveredX !== null ? (
            <line
              x1={hoveredX}
              y1={chart.top}
              x2={hoveredX}
              y2={chart.bottom}
              stroke={darkMode ? "#64748b" : "#94a3b8"}
              strokeWidth="1"
              strokeDasharray="4 4"
            />
          ) : null}

          {hoveredPoints.map((entry) => (
            <circle
              key={`hover-${entry.label}`}
              cx={entry.point.x}
              cy={entry.point.y}
              r="4"
              fill={entry.color}
              stroke={darkMode ? "#0f172a" : "#ffffff"}
              strokeWidth="1.5"
            />
          ))}

          {hoveredMonth !== null && hoveredX !== null && tooltipTop !== null && tooltipX !== null && tooltipTextX !== null && hoveredPoints.length > 0 ? (
            <>
              <rect
                x={tooltipX}
                y={tooltipTop}
                width={tooltipWidth}
                height={tooltipHeight}
                rx={8}
                fill={darkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.96)"}
                stroke={darkMode ? "#334155" : "#d4d4d8"}
                strokeWidth="1"
              />
              <text
                x={tooltipTextX}
                y={tooltipTop + 16}
                fill={darkMode ? "#e2e8f0" : "#0f172a"}
                fontSize="11"
                fontWeight="600"
              >
                {`Måned ${hoveredMonth} (${formatPeriodLabel(hoveredMonth)})`}
              </text>
              {hoveredPoints.map((entry, index) => (
                <text
                  key={`tooltip-${entry.label}`}
                  x={tooltipTextX}
                  y={tooltipTop + 30 + index * 14}
                  fill={entry.color}
                  fontSize="11"
                >
                  {`${entry.label}: ${formatCurrency(entry.point.value)}`}
                </text>
              ))}
            </>
          ) : null}
        </svg>
      </div>

      <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs ${darkMode ? "text-slate-300" : "text-zinc-700"}`}>
        {chart.seriesPaths.map((entry) => (
          <p key={`legend-${entry.label}`} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.label}
          </p>
        ))}
      </div>
    </div>
  );
}

type OverviewChartCardProps = {
  title: string;
  subtitle: string;
  darkMode?: boolean;
  children: ReactNode;
};

function OverviewChartCard({ title, subtitle, darkMode = false, children }: OverviewChartCardProps) {
  return (
    <div className={`rounded-2xl border p-3 ${darkMode ? "border-slate-700/70 bg-slate-900/84" : "border-cyan-100 bg-white/90"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-slate-200" : "text-zinc-800"}`}>{title}</p>
      <p className={`mt-0.5 text-[11px] ${darkMode ? "text-slate-400" : "text-zinc-500"}`}>{subtitle}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

type SavingsProjectionProps = {
  reportName?: string;
  onReportNameChange?: (value: string) => void;
};

export function SavingsProjection({ reportName = "", onReportNameChange }: SavingsProjectionProps) {
  const [incomeValues, setIncomeValues] = useState<Record<string, string>>({});
  const [housingValues, setHousingValues] = useState<Record<string, string>>({});
  const [transportValues, setTransportValues] = useState<Record<string, string>>({});
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({});
  const [customBudgetFields, setCustomBudgetFields] = useState<Record<BudgetFieldSection, FieldConfig[]>>(() => {
    const fallback: Record<BudgetFieldSection, FieldConfig[]> = {
      income: [],
      housing: [],
      transport: [],
      fixed: [],
    };

    if (typeof window === "undefined") {
      return fallback;
    }

    try {
      const raw = window.localStorage.getItem(CUSTOM_FIELDS_STORAGE_KEY);
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw) as Partial<Record<BudgetFieldSection, unknown>>;
      const normalizeSection = (section: BudgetFieldSection): FieldConfig[] => {
        const entries = parsed?.[section];
        if (!Array.isArray(entries)) {
          return [];
        }
        return entries
          .map((entry) => {
            if (!entry || typeof entry !== "object") {
              return null;
            }
            const key = (entry as { key?: unknown }).key;
            const label = (entry as { label?: unknown }).label;
            if (typeof key !== "string" || typeof label !== "string" || !key.trim() || !label.trim()) {
              return null;
            }
            return { key: key.trim(), label: label.trim(), placeholder: "" };
          })
          .filter((entry): entry is FieldConfig => entry !== null);
      };

      return {
        income: normalizeSection("income"),
        housing: normalizeSection("housing"),
        transport: normalizeSection("transport"),
        fixed: normalizeSection("fixed"),
      };
    } catch {
      return fallback;
    }
  });
  const [budgetFieldPeriods, setBudgetFieldPeriods] = useState<Record<string, BudgetFieldPeriod>>({});
  const [startingSavingsInput, setStartingSavingsInput] = useState("");
  const [homeValueInput, setHomeValueInput] = useState("");
  const [mortgageDebtInput, setMortgageDebtInput] = useState("");
  const [interestRateInput, setInterestRateInput] = useState("");
  const [homeGrowthRateInput, setHomeGrowthRateInput] = useState("");
  const [salaryGrowthRateInput, setSalaryGrowthRateInput] = useState("");
  const [pensionCurrentInput, setPensionCurrentInput] = useState("");
  const [pensionMonthlyInput, setPensionMonthlyInput] = useState("");
  const [pensionReturnInput, setPensionReturnInput] = useState("");
  const [expectedMonthlySavingsInput, setExpectedMonthlySavingsInput] = useState("");
  const [includePensionInNetWorth, setIncludePensionInNetWorth] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(SIDEBAR_VISIBILITY_STORAGE_KEY) !== "0";
  });
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return readInitialDarkMode();
  });
  const [hasThemePreference, setHasThemePreference] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(DARK_MODE_STORAGE_KEY) !== null;
  });
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [pensionSelectedMonths, setPensionSelectedMonths] = useState(12);
  const [importStatus, setImportStatus] = useState("");
  const [importFeedback, setImportFeedback] = useState<{ type: ImportFeedbackType; message: string } | null>(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [arePeriodTogglesEnabled, setArePeriodTogglesEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return true;
    }

    return window.localStorage.getItem(PERIOD_TOGGLE_STORAGE_KEY) !== "0";
  });
  const [hiddenBudgetFields, setHiddenBudgetFields] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(HIDDEN_FIELDS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.filter((entry): entry is string => typeof entry === "string" && parseFieldId(entry) !== null);
    } catch {
      return [];
    }
  });
  const [isHiddenFieldsPanelOpen, setIsHiddenFieldsPanelOpen] = useState(false);
  const [visibleOverviewCharts, setVisibleOverviewCharts] = useState<OverviewChartKey[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_OVERVIEW_CHARTS;
    }

    try {
      const raw = window.localStorage.getItem(OVERVIEW_CHARTS_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_OVERVIEW_CHARTS;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return DEFAULT_OVERVIEW_CHARTS;
      }

      const keys = parsed.filter((entry): entry is OverviewChartKey => isOverviewChartKey(entry));
      const uniqueKeys = Array.from(new Set(keys));
      return uniqueKeys.length > 0 ? uniqueKeys : DEFAULT_OVERVIEW_CHARTS;
    } catch {
      return DEFAULT_OVERVIEW_CHARTS;
    }
  });
  const [sectionOrder, setSectionOrder] = useState<BudgetFieldSection[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SECTION_ORDER;
    }

    try {
      const raw = window.localStorage.getItem(SECTION_ORDER_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_SECTION_ORDER;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return DEFAULT_SECTION_ORDER;
      }

      const validSections = parsed.filter((entry): entry is BudgetFieldSection => isBudgetFieldSection(entry));
      const uniqueSections = Array.from(new Set(validSections));
      const hasAllSections = DEFAULT_SECTION_ORDER.every((section) => uniqueSections.includes(section));

      if (!hasAllSections || uniqueSections.length !== DEFAULT_SECTION_ORDER.length) {
        return DEFAULT_SECTION_ORDER;
      }

      return uniqueSections;
    } catch {
      return DEFAULT_SECTION_ORDER;
    }
  });
  const [midPageCardOrder, setMidPageCardOrder] = useState<MidPageCard[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_MID_PAGE_CARD_ORDER;
    }

    try {
      const raw = window.localStorage.getItem(MID_PAGE_CARD_ORDER_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_MID_PAGE_CARD_ORDER;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return DEFAULT_MID_PAGE_CARD_ORDER;
      }

      const validCards = parsed.filter((entry): entry is MidPageCard => isMidPageCard(entry));
      const uniqueCards = Array.from(new Set(validCards));
      const hasAllCards = DEFAULT_MID_PAGE_CARD_ORDER.every((card) => uniqueCards.includes(card));

      if (!hasAllCards || uniqueCards.length !== DEFAULT_MID_PAGE_CARD_ORDER.length) {
        return DEFAULT_MID_PAGE_CARD_ORDER;
      }

      return uniqueCards;
    } catch {
      return DEFAULT_MID_PAGE_CARD_ORDER;
    }
  });
  const [lowerPageCardOrder, setLowerPageCardOrder] = useState<LowerPageCard[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_LOWER_PAGE_CARD_ORDER;
    }

    try {
      const raw = window.localStorage.getItem(LOWER_PAGE_CARD_ORDER_STORAGE_KEY);
      if (!raw) {
        return DEFAULT_LOWER_PAGE_CARD_ORDER;
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return DEFAULT_LOWER_PAGE_CARD_ORDER;
      }

      const validCards = parsed.filter((entry): entry is LowerPageCard => isLowerPageCard(entry));
      const uniqueCards = Array.from(new Set(validCards));
      const hasAllCards = DEFAULT_LOWER_PAGE_CARD_ORDER.every((card) => uniqueCards.includes(card));

      if (!hasAllCards || uniqueCards.length !== DEFAULT_LOWER_PAGE_CARD_ORDER.length) {
        return DEFAULT_LOWER_PAGE_CARD_ORDER;
      }

      return uniqueCards;
    } catch {
      return DEFAULT_LOWER_PAGE_CARD_ORDER;
    }
  });
  const [draggedSection, setDraggedSection] = useState<BudgetFieldSection | null>(null);
  const [dropTargetSection, setDropTargetSection] = useState<BudgetFieldSection | null>(null);
  const [draggedMidPageCard, setDraggedMidPageCard] = useState<MidPageCard | null>(null);
  const [dropTargetMidPageCard, setDropTargetMidPageCard] = useState<MidPageCard | null>(null);
  const [draggedLowerPageCard, setDraggedLowerPageCard] = useState<LowerPageCard | null>(null);
  const [dropTargetLowerPageCard, setDropTargetLowerPageCard] = useState<LowerPageCard | null>(null);
  const [isPageReady, setIsPageReady] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<BudgetFieldSection, boolean>>(() => {
    const fallback: Record<BudgetFieldSection, boolean> = {
      income: false,
      housing: false,
      transport: false,
      fixed: false,
    };

    if (typeof window === "undefined") {
      return fallback;
    }

    try {
      const raw = window.localStorage.getItem(COLLAPSED_SECTIONS_STORAGE_KEY);
      if (!raw) {
        return fallback;
      }
      const parsed = JSON.parse(raw) as Partial<Record<BudgetFieldSection, boolean>>;
      return {
        income: parsed.income === true,
        housing: parsed.housing === true,
        transport: parsed.transport === true,
        fixed: parsed.fixed === true,
      };
    } catch {
      return fallback;
    }
  });
  const hiddenFieldIds = useMemo(() => new Set(hiddenBudgetFields), [hiddenBudgetFields]);
  const sectionFieldsBySection = useMemo(
    () => ({
      income: [...INCOME_FIELDS, ...customBudgetFields.income],
      housing: [...HOUSING_FIELDS, ...customBudgetFields.housing],
      transport: [...TRANSPORT_FIELDS, ...customBudgetFields.transport],
      fixed: [...FIXED_FIELDS, ...customBudgetFields.fixed],
    }),
    [customBudgetFields],
  );
  const hiddenFieldDetails = useMemo(
    () =>
      hiddenBudgetFields
        .map((fieldId) => {
          const parsed = parseFieldId(fieldId);
          if (!parsed) {
            return null;
          }

          const field = sectionFieldsBySection[parsed.section].find((entry) => entry.key === parsed.key);
          if (!field) {
            return null;
          }

          return {
            fieldId,
            section: parsed.section,
            sectionLabel: SECTION_LABELS[parsed.section],
            fieldLabel: field.label,
            isCustom: isCustomFieldKey(parsed.key),
          };
        })
        .filter((entry): entry is { fieldId: string; section: BudgetFieldSection; sectionLabel: string; fieldLabel: string; isCustom: boolean } => entry !== null),
    [hiddenBudgetFields, sectionFieldsBySection],
  );

  const updateIncome = (key: string, value: string) => setIncomeValues((current) => ({ ...current, [key]: value }));
  const updateHousing = (key: string, value: string) => setHousingValues((current) => ({ ...current, [key]: value }));
  const updateTransport = (key: string, value: string) => setTransportValues((current) => ({ ...current, [key]: value }));
  const updateFixed = (key: string, value: string) => setFixedValues((current) => ({ ...current, [key]: value }));
  const updateBudgetFieldPeriod = (section: BudgetFieldSection, key: string, period: BudgetFieldPeriod) => {
    const fieldId = buildFieldId(section, key);
    setBudgetFieldPeriods((current) => ({ ...current, [fieldId]: period }));
  };
  const hideBudgetField = (section: BudgetFieldSection, key: string) => {
    const fieldId = buildFieldId(section, key);
    setHiddenBudgetFields((current) => (current.includes(fieldId) ? current : [...current, fieldId]));

    if (section === "income") {
      setIncomeValues((current) => ({ ...current, [key]: "" }));
    } else if (section === "housing") {
      setHousingValues((current) => ({ ...current, [key]: "" }));
    } else if (section === "transport") {
      setTransportValues((current) => ({ ...current, [key]: "" }));
    } else {
      setFixedValues((current) => ({ ...current, [key]: "" }));
    }
  };
  const showBudgetField = (fieldId: string) => {
    setHiddenBudgetFields((current) => current.filter((entry) => entry !== fieldId));
  };
  const addCustomField = (section: BudgetFieldSection) => {
    const input = window.prompt("Navn paa nyt felt:");
    const label = input?.trim();
    if (!label) {
      return;
    }

    const existingKeys = new Set(sectionFieldsBySection[section].map((field) => field.key));
    const key = createCustomFieldKey(label, existingKeys);
    const newField: FieldConfig = { key, label, placeholder: "" };

    setCustomBudgetFields((current) => ({
      ...current,
      [section]: [...current[section], newField],
    }));
  };
  const deleteCustomField = (fieldId: string) => {
    const parsed = parseFieldId(fieldId);
    if (!parsed || !isCustomFieldKey(parsed.key)) {
      return;
    }

    setCustomBudgetFields((current) => ({
      ...current,
      [parsed.section]: current[parsed.section].filter((field) => field.key !== parsed.key),
    }));
    setHiddenBudgetFields((current) => current.filter((entry) => entry !== fieldId));
    setBudgetFieldPeriods((current) => {
      const next = { ...current };
      delete next[fieldId];
      return next;
    });

    if (parsed.section === "income") {
      setIncomeValues((current) => {
        const next = { ...current };
        delete next[parsed.key];
        return next;
      });
    } else if (parsed.section === "housing") {
      setHousingValues((current) => {
        const next = { ...current };
        delete next[parsed.key];
        return next;
      });
    } else if (parsed.section === "transport") {
      setTransportValues((current) => {
        const next = { ...current };
        delete next[parsed.key];
        return next;
      });
    } else {
      setFixedValues((current) => {
        const next = { ...current };
        delete next[parsed.key];
        return next;
      });
    }
  };

  const handleExportData = () => {
    const toExportAmount = (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return "";
      }

      return parseCurrencyAmount(trimmed).toString();
    };

    const rows: Array<[string, string]> = [
      ["__myfinance_export__", "v1"],
      ["reportName", reportName.trim()],
      ["selectedMonths", selectedMonths.toString()],
      ["pensionSelectedMonths", pensionSelectedMonths.toString()],
      ["startingSavings", toExportAmount(startingSavingsInput)],
      ["expectedMonthlySavings", toExportAmount(expectedMonthlySavingsInput)],
      ["includePensionInNetWorth", includePensionInNetWorth ? "1" : "0"],
      ["homeValue", toExportAmount(homeValueInput)],
      ["mortgageDebt", toExportAmount(mortgageDebtInput)],
      ["interestRate", interestRateInput],
      ["homeGrowthRate", homeGrowthRateInput],
      ["salaryGrowthRate", salaryGrowthRateInput],
      ["pensionCurrent", toExportAmount(pensionCurrentInput)],
      ["pensionMonthly", toExportAmount(pensionMonthlyInput)],
      ["pensionReturn", pensionReturnInput],
    ];

    for (const field of sectionFieldsBySection.income) {
      rows.push([`income.${field.key}`, toExportAmount(incomeValues[field.key] ?? "")]);
    }
    for (const field of sectionFieldsBySection.housing) {
      rows.push([`housing.${field.key}`, toExportAmount(housingValues[field.key] ?? "")]);
    }
    for (const field of sectionFieldsBySection.transport) {
      rows.push([`transport.${field.key}`, toExportAmount(transportValues[field.key] ?? "")]);
    }
    for (const field of sectionFieldsBySection.fixed) {
      rows.push([`fixed.${field.key}`, toExportAmount(fixedValues[field.key] ?? "")]);
    }

    const csvContent = ["key,value", ...rows.map(([key, value]) => `${csvEscape(key)},${csvEscape(value)}`)].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sanitizeFileName(reportName)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setImportStatus("Data eksporteret til CSV.");
    setImportFeedback({ type: "info", message: "CSV er eksporteret." });
  };

  const handleExcelImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportStatus("Importerer data fra Excel...");
      setImportFeedback({ type: "info", message: "Importerer data..." });

      const xlsx = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = xlsx.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: null });

      const nextIncome = { ...incomeValues };
      const nextHousing = { ...housingValues };
      const nextTransport = { ...transportValues };
      const nextFixed = { ...fixedValues };

      let nextStartingSavings = startingSavingsInput;
      let nextHomeValue = homeValueInput;
      let nextMortgageDebt = mortgageDebtInput;
      let nextInterestRate = interestRateInput;
      let nextHomeGrowthRate = homeGrowthRateInput;
      let nextSalaryGrowthRate = salaryGrowthRateInput;
      let nextPensionCurrent = pensionCurrentInput;
      let nextPensionMonthly = pensionMonthlyInput;
      let nextPensionReturn = pensionReturnInput;
      let nextExpectedMonthlySavings = expectedMonthlySavingsInput;
      let nextIncludePensionInNetWorth = includePensionInNetWorth;
      let nextSelectedMonths = selectedMonths;
      let nextPensionSelectedMonths = pensionSelectedMonths;
      let nextReportName = reportName;
      let hasImportedReportName = false;

      for (const row of rows) {
        if (!Array.isArray(row) || row.length === 0) {
          continue;
        }

        const directKey = stringifyCell(row[0]);
        if (directKey) {
          const directValue = stringifyCell(row[1] ?? "");
          const numericValue = parseExcelAmount(row[1]);
          const normalizedDirect = normalizeLabel(directKey);
          const value = directValue || (numericValue !== null ? numericValue.toString() : "");

          if (normalizedDirect === "myfinance export" || normalizedDirect === "myfinance export v1") {
            continue;
          }

          if (directKey.startsWith("income.")) {
            nextIncome[directKey.slice("income.".length)] = value;
            continue;
          }
          if (directKey.startsWith("housing.")) {
            nextHousing[directKey.slice("housing.".length)] = value;
            continue;
          }
          if (directKey.startsWith("transport.")) {
            nextTransport[directKey.slice("transport.".length)] = value;
            continue;
          }
          if (directKey.startsWith("fixed.")) {
            nextFixed[directKey.slice("fixed.".length)] = value;
            continue;
          }
          if (directKey === "startingSavings") {
            nextStartingSavings = value;
            continue;
          }
          if (directKey === "homeValue") {
            nextHomeValue = value;
            continue;
          }
          if (directKey === "mortgageDebt") {
            nextMortgageDebt = value;
            continue;
          }
          if (directKey === "interestRate") {
            nextInterestRate = value;
            continue;
          }
          if (directKey === "homeGrowthRate") {
            nextHomeGrowthRate = value;
            continue;
          }
          if (directKey === "salaryGrowthRate") {
            nextSalaryGrowthRate = value;
            continue;
          }
          if (directKey === "pensionCurrent") {
            nextPensionCurrent = value;
            continue;
          }
          if (directKey === "pensionMonthly") {
            nextPensionMonthly = value;
            continue;
          }
          if (directKey === "pensionReturn") {
            nextPensionReturn = value;
            continue;
          }
          if (directKey === "expectedMonthlySavings") {
            nextExpectedMonthlySavings = value;
            continue;
          }
          if (directKey === "includePensionInNetWorth") {
            nextIncludePensionInNetWorth = value === "1" || normalizeLabel(value) === "true";
            continue;
          }
          if (directKey === "selectedMonths") {
            const parsedMonths = Number(value);
            if (Number.isFinite(parsedMonths) && parsedMonths > 0) {
              nextSelectedMonths = parsedMonths;
            }
            continue;
          }
          if (directKey === "pensionSelectedMonths") {
            const parsedMonths = Number(value);
            if (Number.isFinite(parsedMonths) && parsedMonths > 0) {
              nextPensionSelectedMonths = parsedMonths;
            }
            continue;
          }
          if (directKey === "reportName") {
            nextReportName = value.trim();
            hasImportedReportName = true;
            continue;
          }
        }

        const labelCandidates = row
          .map((cell, index) => ({ cell, index }))
          .filter((entry) => typeof entry.cell === "string" && /[a-zA-Z]/.test(entry.cell));

        const matchedLabel = labelCandidates
          .map((candidate) => {
            const normalizedLabel = normalizeLabel(candidate.cell as string);
            const matchedMapping = IMPORT_MAPPINGS.find((mapping) =>
              mapping.aliases.some((alias) => labelMatchesAlias(normalizedLabel, alias)),
            );

            return matchedMapping ? { index: candidate.index, target: matchedMapping.target } : null;
          })
          .find((entry) => entry !== null);

        if (!matchedLabel) {
          continue;
        }

        const amount = findAmountNearLabel(row, matchedLabel.index);

        if (amount === null) {
          continue;
        }

        const value = amount.toString();

        if (matchedLabel.target.section === "income") {
          nextIncome[matchedLabel.target.key] = value;
        } else if (matchedLabel.target.section === "housing") {
          nextHousing[matchedLabel.target.key] = value;
        } else if (matchedLabel.target.section === "transport") {
          nextTransport[matchedLabel.target.key] = value;
        } else if (matchedLabel.target.section === "fixed") {
          nextFixed[matchedLabel.target.key] = value;
        } else if (matchedLabel.target.key === "startingSavings") {
          nextStartingSavings = value;
        } else if (matchedLabel.target.key === "homeValue") {
          nextHomeValue = value;
        } else if (matchedLabel.target.key === "mortgageDebt") {
          nextMortgageDebt = value;
        } else if (matchedLabel.target.key === "interestRate") {
          nextInterestRate = value;
        } else if (matchedLabel.target.key === "homeGrowthRate") {
          nextHomeGrowthRate = value;
        } else if (matchedLabel.target.key === "salaryGrowthRate") {
          nextSalaryGrowthRate = value;
        }
      }

      setIncomeValues(formatAmountValues(nextIncome));
      setHousingValues(formatAmountValues(nextHousing));
      setTransportValues(formatAmountValues(nextTransport));
      setFixedValues(formatAmountValues(nextFixed));
      setStartingSavingsInput(formatAmountInput(nextStartingSavings));
      setHomeValueInput(formatAmountInput(nextHomeValue));
      setMortgageDebtInput(formatAmountInput(nextMortgageDebt));
      setInterestRateInput(nextInterestRate);
      setHomeGrowthRateInput(nextHomeGrowthRate);
      setSalaryGrowthRateInput(nextSalaryGrowthRate);
      setPensionCurrentInput(formatAmountInput(nextPensionCurrent));
      setPensionMonthlyInput(formatAmountInput(nextPensionMonthly));
      setPensionReturnInput(nextPensionReturn);
      setExpectedMonthlySavingsInput(formatAmountInput(nextExpectedMonthlySavings));
      setIncludePensionInNetWorth(nextIncludePensionInNetWorth);
      setSelectedMonths(nextSelectedMonths);
      setPensionSelectedMonths(nextPensionSelectedMonths);
      if (!hasImportedReportName) {
        nextReportName = file.name.replace(/\.[^/.]+$/, "").trim();
      }
      onReportNameChange?.(nextReportName);

      setImportStatus("Import gennemført.");
      setImportFeedback({ type: "success", message: "Import lykkedes. Budgettet er opdateret." });
    } catch {
      setImportStatus("Import fejlede. Kontroller at filen er .xlsx/.xls/.csv og at pakken xlsx er installeret.");
      setImportFeedback({ type: "error", message: "Import fejlede. Tjek filformatet og prøv igen." });
    }

    event.target.value = "";
  };

  const monthlyIncome = sumValuesForVisibleFields(incomeValues, "income", hiddenFieldIds, budgetFieldPeriods);
  const housingExpenses = sumValuesForVisibleFields(housingValues, "housing", hiddenFieldIds, budgetFieldPeriods);
  const transportExpenses = sumValuesForVisibleFields(transportValues, "transport", hiddenFieldIds, budgetFieldPeriods);
  const fixedExpenses = sumValuesForVisibleFields(fixedValues, "fixed", hiddenFieldIds, budgetFieldPeriods);
  const monthlyExpenses = housingExpenses + transportExpenses + fixedExpenses;
  const monthlyDisposable = monthlyIncome - monthlyExpenses;

  const startingSavings = Math.max(parseCurrencyAmount(startingSavingsInput), 0);
  const homeValue = Math.max(parseCurrencyAmount(homeValueInput), 0);
  const mortgageDebt = Math.max(parseCurrencyAmount(mortgageDebtInput), 0);
  const annualInterestRate = Math.max(parseAmount(interestRateInput), 0);
  const annualHomeGrowthRate = Math.max(parseAmount(homeGrowthRateInput), 0);
  const annualSalaryGrowthRate = Math.max(parseAmount(salaryGrowthRateInput), 0);
  const monthlyMortgagePayment = Math.max(parseCurrencyAmount(housingValues.housingPayment ?? ""), 0);
  const pensionCurrent = Math.max(parseCurrencyAmount(pensionCurrentInput), 0);
  const pensionMonthly = Math.max(parseCurrencyAmount(pensionMonthlyInput), 0);
  const pensionAnnualReturn = Math.max(parseAmount(pensionReturnInput), 0);
  const monthlySavings = Math.max(parseCurrencyAmount(expectedMonthlySavingsInput), 0);
  const hasOverviewData =
    monthlyIncome > 0 ||
    monthlyExpenses > 0 ||
    startingSavings > 0 ||
    homeValue > 0 ||
    mortgageDebt > 0 ||
    pensionCurrent > 0 ||
    pensionMonthly > 0 ||
    monthlySavings > 0;
  const hasCompletePensionInputs =
    pensionCurrentInput.trim() !== "" && pensionMonthlyInput.trim() !== "" && pensionReturnInput.trim() !== "";

  useEffect(() => {
    if (!hasCompletePensionInputs && includePensionInNetWorth) {
      setIncludePensionInNetWorth(false);
    }
  }, [hasCompletePensionInputs, includePensionInNetWorth]);

  useEffect(() => {
    window.localStorage.setItem(HIDDEN_FIELDS_STORAGE_KEY, JSON.stringify(hiddenBudgetFields));
  }, [hiddenBudgetFields]);

  useEffect(() => {
    window.localStorage.setItem(COLLAPSED_SECTIONS_STORAGE_KEY, JSON.stringify(collapsedSections));
  }, [collapsedSections]);

  useEffect(() => {
    window.localStorage.setItem(SECTION_ORDER_STORAGE_KEY, JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  useEffect(() => {
    window.localStorage.setItem(MID_PAGE_CARD_ORDER_STORAGE_KEY, JSON.stringify(midPageCardOrder));
  }, [midPageCardOrder]);

  useEffect(() => {
    window.localStorage.setItem(LOWER_PAGE_CARD_ORDER_STORAGE_KEY, JSON.stringify(lowerPageCardOrder));
  }, [lowerPageCardOrder]);

  useEffect(() => {
    window.localStorage.setItem(OVERVIEW_CHARTS_STORAGE_KEY, JSON.stringify(visibleOverviewCharts));
  }, [visibleOverviewCharts]);

  useEffect(() => {
    const payload = {
      income: customBudgetFields.income.map(({ key, label }) => ({ key, label })),
      housing: customBudgetFields.housing.map(({ key, label }) => ({ key, label })),
      transport: customBudgetFields.transport.map(({ key, label }) => ({ key, label })),
      fixed: customBudgetFields.fixed.map(({ key, label }) => ({ key, label })),
    };
    window.localStorage.setItem(CUSTOM_FIELDS_STORAGE_KEY, JSON.stringify(payload));
  }, [customBudgetFields]);

  useEffect(() => {
    if (hiddenBudgetFields.length === 0 && isHiddenFieldsPanelOpen) {
      setIsHiddenFieldsPanelOpen(false);
    }
  }, [hiddenBudgetFields.length, isHiddenFieldsPanelOpen]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_VISIBILITY_STORAGE_KEY, isSidebarVisible ? "1" : "0");
  }, [isSidebarVisible]);

  useEffect(() => {
    window.localStorage.setItem(PERIOD_TOGGLE_STORAGE_KEY, arePeriodTogglesEnabled ? "1" : "0");
  }, [arePeriodTogglesEnabled]);

  useEffect(() => {
    if (!arePeriodTogglesEnabled) {
      setBudgetFieldPeriods({});
    }
  }, [arePeriodTogglesEnabled]);

  useEffect(() => {
    if (!hasThemePreference) {
      window.localStorage.removeItem(DARK_MODE_STORAGE_KEY);
      return;
    }

    applyDarkMode(isDarkMode);
  }, [hasThemePreference, isDarkMode]);

  useEffect(() => {
    if (hasThemePreference) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applySystemTheme = () => setIsDarkMode(mediaQuery.matches);
    applySystemTheme();

    const onThemeChange = (event: MediaQueryListEvent) => {
      setIsDarkMode(event.matches);
    };

    mediaQuery.addEventListener("change", onThemeChange);
    return () => mediaQuery.removeEventListener("change", onThemeChange);
  }, [hasThemePreference]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const syncTheme = () => {
      const storedTheme = window.localStorage.getItem(DARK_MODE_STORAGE_KEY);
      if (storedTheme === "1" || storedTheme === "0") {
        setHasThemePreference(true);
        setIsDarkMode(storedTheme === "1");
        return;
      }

      setHasThemePreference(false);
      setIsDarkMode(readInitialDarkMode());
    };

    const onThemeChanged = () => {
      syncTheme();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === DARK_MODE_STORAGE_KEY) {
        syncTheme();
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, onThemeChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, onThemeChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!importFeedback || importFeedback.type !== "success") {
      return;
    }

    const timer = window.setTimeout(() => {
      setImportFeedback(null);
    }, 2800);

    return () => window.clearTimeout(timer);
  }, [importFeedback]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsPageReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const toggleDarkMode = () => {
    setHasThemePreference(true);
    setIsDarkMode((current) => !current);
  };
  const handleClearAllData = () => {
    setIncomeValues({});
    setHousingValues({});
    setTransportValues({});
    setFixedValues({});
    setBudgetFieldPeriods({});
    setStartingSavingsInput("");
    setExpectedMonthlySavingsInput("");
    setHomeValueInput("");
    setMortgageDebtInput("");
    setInterestRateInput("");
    setHomeGrowthRateInput("");
    setSalaryGrowthRateInput("");
    setPensionCurrentInput("");
    setPensionMonthlyInput("");
    setPensionReturnInput("");
    setIncludePensionInNetWorth(false);
    setImportStatus("");
    setImportFeedback(null);
    onReportNameChange?.("");
  };

  const points = useMemo(() => {
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const monthlyHomeGrowthRate = Math.pow(1 + annualHomeGrowthRate / 100, 1 / 12) - 1;
    const monthlySalaryGrowthRate = Math.pow(1 + annualSalaryGrowthRate / 100, 1 / 12) - 1;
    const entries: { month: number; netWorth: number; cash: number; debt: number; home: number }[] = [];

    let cash = startingSavings;
    let debt = mortgageDebt;
    let house = homeValue;
    let projectedMonthlyIncome = monthlyIncome;

    for (let month = 0; month <= selectedMonths; month += 1) {
      const netWorth = cash + house - debt;
      entries.push({ month, netWorth, cash, debt, home: house });

      if (month === selectedMonths) {
        break;
      }

      const interestForMonth = debt * monthlyInterestRate;
      const actualPayment = Math.min(monthlyMortgagePayment, debt + interestForMonth);
      const additionalDisposableFromSalaryGrowth = Math.max(projectedMonthlyIncome - monthlyIncome, 0);
      const projectedMonthlySavings = monthlySavings + additionalDisposableFromSalaryGrowth;

      cash += projectedMonthlySavings;
      debt = Math.max(0, debt + interestForMonth - actualPayment);
      house *= 1 + monthlyHomeGrowthRate;
      projectedMonthlyIncome *= 1 + monthlySalaryGrowthRate;
    }

    return entries;
  }, [
    annualHomeGrowthRate,
    annualInterestRate,
    annualSalaryGrowthRate,
    homeValue,
    monthlyIncome,
    monthlySavings,
    monthlyMortgagePayment,
    mortgageDebt,
    selectedMonths,
    startingSavings,
  ]);

  const wealthPensionValues = useMemo(
    () => buildPensionValues(selectedMonths, pensionCurrent, pensionMonthly, pensionAnnualReturn),
    [pensionAnnualReturn, pensionCurrent, pensionMonthly, selectedMonths],
  );
  const pensionPoints = useMemo(
    () =>
      buildPensionValues(pensionSelectedMonths, pensionCurrent, pensionMonthly, pensionAnnualReturn).map((value, month) => ({
        month,
        value,
      })),
    [pensionAnnualReturn, pensionCurrent, pensionMonthly, pensionSelectedMonths],
  );

  const annualIncome = monthlyIncome * 12;
  const annualExpenses = monthlyExpenses * 12;
  const finalNetWorth =
    points.length > 0
      ? points[points.length - 1].netWorth + (includePensionInNetWorth ? (wealthPensionValues[points.length - 1] ?? 0) : 0)
      : 0;
  const finalDebt = points.length > 0 ? points[points.length - 1].debt : 0;
  const finalCash = points.length > 0 ? points[points.length - 1].cash : 0;
  const finalHomeValue = points.length > 0 ? points[points.length - 1].home : 0;
  const finalPension = pensionPoints.length > 0 ? pensionPoints[pensionPoints.length - 1].value : 0;
  const hasWealthContent =
    monthlyIncome > 0 ||
    monthlyExpenses > 0 ||
    startingSavings > 0 ||
    homeValue > 0 ||
    mortgageDebt > 0 ||
    expectedMonthlySavingsInput.trim() !== "";

  const housingShare = monthlyIncome > 0 ? (housingExpenses / monthlyIncome) * 100 : 0;
  const transportShare = monthlyIncome > 0 ? (transportExpenses / monthlyIncome) * 100 : 0;
  const fixedShare = monthlyIncome > 0 ? (fixedExpenses / monthlyIncome) * 100 : 0;
  const sectionCards: Record<
    BudgetFieldSection,
    {
      title: string;
      fields: FieldConfig[];
      values: Record<string, string>;
      onChange: (key: string, value: string) => void;
      totalLabel: string;
      totalValue: number;
      percentageOfIncome?: number;
    }
  > = {
    income: {
      title: "Indtægter",
      fields: sectionFieldsBySection.income,
      values: incomeValues,
      onChange: updateIncome,
      totalLabel: "Indtægter pr. md.",
      totalValue: monthlyIncome,
    },
    housing: {
      title: "Bolig",
      fields: sectionFieldsBySection.housing,
      values: housingValues,
      onChange: updateHousing,
      totalLabel: "Bolig pr. md.",
      totalValue: housingExpenses,
      percentageOfIncome: housingShare,
    },
    transport: {
      title: "Transport",
      fields: sectionFieldsBySection.transport,
      values: transportValues,
      onChange: updateTransport,
      totalLabel: "Transport pr. md.",
      totalValue: transportExpenses,
      percentageOfIncome: transportShare,
    },
    fixed: {
      title: "Øvrige faste",
      fields: sectionFieldsBySection.fixed,
      values: fixedValues,
      onChange: updateFixed,
      totalLabel: "Øvrige faste pr. md.",
      totalValue: fixedExpenses,
      percentageOfIncome: fixedShare,
    },
  };

  const moveSectionCard = (from: BudgetFieldSection, to: BudgetFieldSection) => {
    if (from === to) {
      return;
    }

    setSectionOrder((current) => {
      const fromIndex = current.indexOf(from);
      const toIndex = current.indexOf(to);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };
  const moveMidPageCard = (from: MidPageCard, to: MidPageCard) => {
    if (from === to) {
      return;
    }

    setMidPageCardOrder((current) => {
      const fromIndex = current.indexOf(from);
      const toIndex = current.indexOf(to);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };
  const moveLowerPageCard = (from: LowerPageCard, to: LowerPageCard) => {
    if (from === to) {
      return;
    }

    setLowerPageCardOrder((current) => {
      const fromIndex = current.indexOf(from);
      const toIndex = current.indexOf(to);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };
  const disposableShare = monthlyIncome > 0 ? (monthlyDisposable / monthlyIncome) * 100 : 0;
  const topExpenseCategories = useMemo(
    () =>
      [
        { label: "Bolig", icon: "🏡", value: housingExpenses },
        { label: "Transport", icon: "🚗", value: transportExpenses },
        { label: "Øvrige faste", icon: "🧾", value: fixedExpenses },
      ]
        .filter((entry) => entry.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 3)
        .map((entry) => ({
          ...entry,
          share: monthlyExpenses > 0 ? (entry.value / monthlyExpenses) * 100 : 0,
        })),
    [fixedExpenses, housingExpenses, monthlyExpenses, transportExpenses],
  );
  const expenseBreakdown = useMemo(
    () =>
      [
        { key: "housing", label: "Bolig", value: housingExpenses, color: "#f59e0b" },
        { key: "transport", label: "Transport", value: transportExpenses, color: "#3b82f6" },
        { key: "fixed", label: "Oevrige", value: fixedExpenses, color: "#8b5cf6" },
      ].filter((entry) => entry.value > 0),
    [fixedExpenses, housingExpenses, transportExpenses],
  );
  const assetsNow = Math.max(startingSavings, 0) + Math.max(homeValue, 0) + (includePensionInNetWorth ? Math.max(pensionCurrent, 0) : 0);
  const liabilitiesNow = Math.max(mortgageDebt, 0);
  const annualSurplus = annualIncome - annualExpenses;
  const netWorthTrendValues = points.map((entry, month) => entry.netWorth + (includePensionInNetWorth ? (wealthPensionValues[month] ?? 0) : 0));
  const expenseDonutSegments = useMemo(() => {
    const total = expenseBreakdown.reduce((sum, entry) => sum + entry.value, 0);
    if (total <= 0) {
      return [];
    }

    let start = 0;
    return expenseBreakdown.map((entry) => {
      const ratio = entry.value / total;
      const segment = { ...entry, start, ratio };
      start += ratio;
      return segment;
    });
  }, [expenseBreakdown]);
  const netWorthSparkline = useMemo(() => {
    if (netWorthTrendValues.length < 2) {
      return "";
    }

    const min = Math.min(...netWorthTrendValues);
    const max = Math.max(...netWorthTrendValues);
    const range = Math.max(max - min, 1);

    return netWorthTrendValues
      .map((value, index) => {
        const x = (index / (netWorthTrendValues.length - 1)) * 280;
        const y = 90 - ((value - min) / range) * 78;
        return `${x},${y}`;
      })
      .join(" ");
  }, [netWorthTrendValues]);
  const toggleOverviewChart = (key: OverviewChartKey) => {
    setVisibleOverviewCharts((current) => {
      if (current.includes(key)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((entry) => entry !== key);
      }
      return [...current, key];
    });
  };
  const disposableToneClass =
    disposableShare > 20 ? "text-emerald-700 bg-emerald-50" : disposableShare >= 10 ? "text-amber-700 bg-amber-50" : "text-rose-700 bg-rose-50";
  const housingToneClass =
    housingShare > 65
      ? "text-rose-700 bg-rose-50"
      : housingShare >= 55
        ? "text-amber-700 bg-amber-50"
        : "text-emerald-700 bg-emerald-50";
  const savingsRate = disposableShare;
  const monthsToTarget = monthlyDisposable > 0 ? Math.ceil(250000 / monthlyDisposable) : null;
  const debtToIncomeShare = monthlyIncome > 0 ? (mortgageDebt / (monthlyIncome * 12)) * 100 : 0;
  const disposableScore = clamp(disposableShare * 2.2, 0, 45);
  const housingScore = clamp((65 - housingShare) * 1.1, 0, 35);
  const debtScore = clamp((80 - debtToIncomeShare) * 0.25, 0, 20);
  const economicHealthScore = Math.round(disposableScore + housingScore + debtScore);
  const healthToneClass =
    economicHealthScore >= 75
      ? "text-emerald-700 bg-emerald-50"
      : economicHealthScore >= 55
        ? "text-amber-700 bg-amber-50"
        : "text-rose-700 bg-rose-50";
  const healthStatus =
    economicHealthScore >= 75 ? "Stærk" : economicHealthScore >= 55 ? "Middel" : "Presset";
  const insightItems = useMemo(() => {
    const entries: { icon: string; text: string; className: string }[] = [];

    if (housingShare > 65) {
      entries.push({
        icon: "⚠️",
        text: "Boligudgift er meget høj i forhold til indkomst.",
        className: "text-rose-700",
      });
    } else if (housingShare >= 55) {
      entries.push({
        icon: "⚠️",
        text: "Boligudgift er i den høje ende. Hold øje med rådighedsbeløbet.",
        className: "text-amber-700",
      });
    }

    if (transportExpenses > 0) {
      const potential = Math.round(transportExpenses * 0.15);
      entries.push({
        icon: "💡",
        text: `Mulig besparelse: ${formatCurrency(potential)} ved 15% lavere transport.`,
        className: "text-amber-700",
      });
    }

    if (disposableShare >= 20 && housingShare <= 55) {
      entries.push({
        icon: "✅",
        text: "Økonomien ser sund ud.",
        className: "text-emerald-700",
      });
    }

    if (entries.length === 0) {
      entries.push({
        icon: "ℹ️",
        text: "Indtast flere tal for personlige insights.",
        className: "text-zinc-600",
      });
    }

    return entries.slice(0, 3);
  }, [disposableShare, housingShare, transportExpenses]);
  const netWorthSeries = useMemo(
    () => [
      {
        label: includePensionInNetWorth ? "Forventet formue (inkl. pension)" : "Forventet formue",
        color: "#059669",
        values: points.map((point, month) => point.netWorth + (includePensionInNetWorth ? (wealthPensionValues[month] ?? 0) : 0)),
      },
      { label: "Boligværdi", color: "#2563eb", values: points.map((point) => point.home) },
      { label: "Restgæld", color: "#dc2626", values: points.map((point) => point.debt) },
    ],
    [includePensionInNetWorth, points, wealthPensionValues],
  );
  const pensionSeries = useMemo(
    () => [{ label: "Pensionsopsparing", color: "#0f766e", values: pensionPoints.map((point) => point.value) }],
    [pensionPoints],
  );

  useEffect(() => {
    const snapshot = {
      savedAt: new Date().toISOString(),
      reportName,
      selectedMonths,
      monthlyIncome,
      monthlyExpenses,
      monthlyDisposable,
      annualIncome,
      annualExpenses,
      annualSurplus,
      housingShare,
      transportShare,
      fixedShare,
      debtToIncomeShare,
      economicHealthScore,
      healthStatus,
      finalNetWorth,
      finalDebt,
      finalHomeValue,
      finalCash,
      finalPension,
      includePensionInNetWorth,
      topExpenseCategories,
      expenseBreakdown,
      points,
      netWorthTrendValues,
    };

    window.localStorage.setItem(OVERVIEW_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));

    const hasOverviewData =
      monthlyIncome > 0 ||
      monthlyExpenses > 0 ||
      finalNetWorth !== 0 ||
      finalDebt > 0 ||
      finalHomeValue > 0 ||
      finalCash > 0;

    if (!hasOverviewData) {
      return;
    }

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const historyEntry = {
      monthKey,
      savedAt: snapshot.savedAt,
      reportName: reportName || "Ikke navngivet",
      monthlyIncome,
      monthlyExpenses,
      monthlyDisposable,
      annualSurplus,
      finalNetWorth,
      economicHealthScore,
    };

    try {
      const rawHistory = window.localStorage.getItem(OVERVIEW_HISTORY_STORAGE_KEY);
      const parsedHistory = rawHistory ? (JSON.parse(rawHistory) as typeof historyEntry[]) : [];
      const nextHistory = Array.isArray(parsedHistory)
        ? [...parsedHistory.filter((entry) => entry.monthKey !== monthKey), historyEntry]
        : [historyEntry];

      nextHistory.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
      window.localStorage.setItem(OVERVIEW_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory.slice(0, 60)));
    } catch {
      // Ignore storage parse/save errors.
    }
  }, [
    annualExpenses,
    annualIncome,
    annualSurplus,
    debtToIncomeShare,
    economicHealthScore,
    expenseBreakdown,
    finalCash,
    finalDebt,
    finalHomeValue,
    finalNetWorth,
    finalPension,
    fixedShare,
    healthStatus,
    housingShare,
    includePensionInNetWorth,
    monthlyDisposable,
    monthlyExpenses,
    monthlyIncome,
    netWorthTrendValues,
    points,
    reportName,
    selectedMonths,
    topExpenseCategories,
    transportShare,
  ]);

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:gap-2">
      {isClearModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-[0_24px_60px_-32px_rgba(2,6,23,0.7)] ${
              isDarkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-data-title"
          >
            <h3 id="clear-data-title" className="text-base font-semibold">
              Er du sikker på at du vil slette alt?
            </h3>
            <p className={`mt-2 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              Dette kan ikke fortrydes.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Annuller
              </button>
              <button
                type="button"
                onClick={() => {
                  handleClearAllData();
                  setIsClearModalOpen(false);
                }}
                className="rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Slet alt
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {isSettingsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4">
          <div
            className={`w-full max-w-sm rounded-2xl border p-5 shadow-[0_24px_60px_-32px_rgba(2,6,23,0.7)] ${
              isDarkMode ? "border-slate-700 bg-slate-900 text-slate-100" : "border-slate-200 bg-white text-slate-900"
            }`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
          >
            <h3 id="settings-title" className="text-base font-semibold">
              Indstillinger
            </h3>
            <label className="mt-4 flex items-center justify-between gap-3 text-sm">
              <span>Vis md/år toggles</span>
              <input
                type="checkbox"
                checked={arePeriodTogglesEnabled}
                onChange={(event) => {
                  const nextValue = event.target.checked;
                  setArePeriodTogglesEnabled(nextValue);
                  if (!nextValue) {
                    setBudgetFieldPeriods({});
                  }
                }}
                className="h-4 w-4"
              />
            </label>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                  isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Luk
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section
        className={`w-full flex-1 rounded-3xl p-4 shadow-[0_30px_70px_-40px_rgba(15,23,42,0.45)] transition-all duration-700 ease-out md:p-5 ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-950 via-indigo-950/80 to-cyan-950/90"
            : "bg-gradient-to-br from-cyan-100 via-sky-50 to-emerald-100/70"
        } ${isPageReady ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
      >
      <SidebarControls
        isSidebarVisible={isSidebarVisible}
        onToggleSidebar={() => setIsSidebarVisible((current) => !current)}
        darkMode={isDarkMode}
      />

      <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
        <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
          <div
            id="tour-report-name"
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 shadow-[0_10px_24px_-20px_rgba(2,6,23,0.6)] ${
              isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-cyan-200 bg-white/90 text-slate-900"
            }`}
          >
            <span className="group relative text-base" aria-hidden="true">
              📝
              <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
                Budget navn
              </span>
            </span>
            <div className="relative">
              <input
                type="text"
                value={reportName}
                onChange={(event) => onReportNameChange?.(event.target.value)}
                size={Math.max(reportName.length, 12)}
                className={`w-auto max-w-full bg-transparent pr-20 text-sm font-semibold outline-none focus:placeholder:text-transparent ${
                  isDarkMode ? "placeholder:text-slate-300 placeholder:font-medium" : "placeholder:text-slate-600 placeholder:font-medium"
                }`}
                placeholder="Navn på rapport"
                aria-label="Budget navn"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={toggleDarkMode}
          className={`group relative inline-flex items-center rounded-md p-2 opacity-80 transition hover:opacity-100 ${
            isDarkMode ? "bg-slate-900 text-slate-100" : "bg-cyan-50/95 text-cyan-900"
          }`}
          aria-label={isDarkMode ? "Skift til lys tilstand" : "Skift til dark mode"}
          title={isDarkMode ? "Skift til lys tilstand" : "Skift til dark mode"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            {isDarkMode ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
              />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            )}
          </svg>
          <span className="pointer-events-none absolute -top-8 right-0 rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            {isDarkMode ? "Lys tilstand" : "Dark mode"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsSettingsModalOpen(true)}
          className={`group relative inline-flex items-center rounded-md p-2 opacity-80 transition hover:opacity-100 ${
            isDarkMode ? "bg-slate-900 text-slate-100" : "bg-cyan-50/95 text-cyan-900"
          }`}
          aria-label="Åbn indstillinger"
          title="Indstillinger"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h10M4 17h16M14 7a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM6 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z" />
          </svg>
          <span className="pointer-events-none absolute -top-8 right-0 rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            Indstillinger
          </span>
        </button>

        {hiddenFieldDetails.length > 0 ? (
          <button
            type="button"
            onClick={() => setIsHiddenFieldsPanelOpen((current) => !current)}
            className={`group relative inline-flex items-center rounded-md px-2 py-2 text-xs font-semibold opacity-80 transition hover:opacity-100 ${
              isDarkMode ? "bg-slate-900 text-slate-100" : "bg-cyan-50/95 text-cyan-900"
            }`}
            aria-label="Vis skjulte felter"
          >
            Skjulte felter ({hiddenFieldDetails.length})
          </button>
        ) : null}

        <label
          className={`group relative inline-flex cursor-pointer items-center rounded-md p-2 opacity-80 transition hover:opacity-100 ${
            isDarkMode ? "bg-slate-900 text-slate-100" : "bg-cyan-50/95 text-cyan-900"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
          </svg>
          <span className="sr-only">Importer Excel eller CSV</span>
          <span className="pointer-events-none absolute -top-8 right-0 rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            Importer Excel/CSV
          </span>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
        </label>

        <button
          type="button"
          onClick={handleExportData}
          className={`group relative inline-flex items-center rounded-md p-2 opacity-80 transition hover:opacity-100 ${
            isDarkMode ? "bg-slate-900 text-slate-100" : "bg-cyan-50/95 text-cyan-900"
          }`}
          aria-label="Eksporter data til CSV"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v12m0 0l4-4m-4 4l-4-4M4 10V6a2 2 0 012-2h12a2 2 0 012 2v4" />
          </svg>
          <span className="pointer-events-none absolute -top-8 right-0 rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            Eksporter CSV
          </span>
        </button>

        <button
          type="button"
          onClick={() => setIsClearModalOpen(true)}
          className="group relative inline-flex items-center rounded-md bg-rose-600 p-2 text-white opacity-90 transition hover:bg-rose-700 hover:opacity-100"
          aria-label="Slet alle indtastede data"
          title="Slet alle indtastede data"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M9 6V4h6v2m-8 0h10l-1 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L7 6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 11v6M14 11v6" />
          </svg>
          <span className="pointer-events-none absolute -top-8 right-0 rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            Slet alle data
          </span>
        </button>

        {importStatus ? (
          <div
            className={`ml-1 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-[0_10px_22px_-16px_rgba(2,6,23,0.55)] transition-all duration-500 ${
              importFeedback?.type === "success"
                ? isDarkMode
                  ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-200 animate-pulse"
                  : "border-emerald-300 bg-emerald-50 text-emerald-800 animate-pulse"
                : importFeedback?.type === "error"
                  ? isDarkMode
                    ? "border-rose-500/60 bg-rose-500/15 text-rose-200"
                    : "border-rose-300 bg-rose-50 text-rose-800"
                  : isDarkMode
                    ? "border-slate-600 bg-slate-800/80 text-slate-200"
                    : "border-slate-200 bg-white/90 text-zinc-600"
            }`}
          >
            <span aria-hidden="true">
              {importFeedback?.type === "success" ? "✓" : importFeedback?.type === "error" ? "!" : "i"}
            </span>
            <span>{importFeedback?.message ?? importStatus}</span>
          </div>
        ) : null}
        </div>
      </div>

      {isHiddenFieldsPanelOpen ? (
        <div className={`mt-3 rounded-2xl border p-3 text-sm ${isDarkMode ? "border-slate-700 bg-slate-900/85 text-slate-200" : "border-sky-100 bg-white/85 text-zinc-700"}`}>
          <p className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-300" : "text-zinc-500"}`}>
            <span>🗂️</span>
            Skjulte felter
          </p>
          {hiddenFieldDetails.length > 0 ? (
            <div className="mt-2 space-y-2">
              {hiddenFieldDetails.map((entry) => (
                <div
                  key={entry.fieldId}
                  className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${
                    isDarkMode ? "bg-slate-800/70" : "bg-sky-50/70"
                  }`}
                >
                  <p className="text-xs">
                    {entry.sectionLabel}: <span className="font-semibold">{entry.fieldLabel}</span>
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => showBudgetField(entry.fieldId)}
                      className={`rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                        isDarkMode ? "bg-cyan-700 text-white hover:bg-cyan-600" : "bg-cyan-600 text-white hover:bg-cyan-700"
                      }`}
                    >
                      Aktiver igen
                    </button>
                    {entry.isCustom ? (
                      <button
                        type="button"
                        onClick={() => deleteCustomField(entry.fieldId)}
                        className="rounded-md bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white transition hover:bg-rose-700"
                      >
                        Slet permanent
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={`mt-2 text-xs ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>Du har ikke fjernet nogen felter endnu.</p>
          )}
        </div>
      ) : null}

      <div className="mt-4 grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-4">
        {sectionOrder.map((section, index) => {
          const card = sectionCards[section];
          const isDropTarget = dropTargetSection === section && draggedSection !== section;

          return (
            <div
              key={section}
              id={`tour-card-${section}`}
              draggable
              onDragStart={(event: DragEvent<HTMLDivElement>) => {
                if (shouldPreventCardDrag(event.target)) {
                  event.preventDefault();
                  return;
                }
                setDraggedSection(section);
              }}
              onDragEnd={() => {
                setDraggedSection(null);
                setDropTargetSection(null);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (dropTargetSection !== section) {
                  setDropTargetSection(section);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                if (draggedSection) {
                  moveSectionCard(draggedSection, section);
                }
                setDraggedSection(null);
                setDropTargetSection(null);
              }}
              className={`h-full rounded-2xl transition-all duration-500 ease-out ${
                isPageReady ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              } ${isDropTarget ? "ring-2 ring-cyan-400/75 ring-offset-2 ring-offset-transparent" : ""}`}
              style={{ transitionDelay: `${80 + index * 70}ms` }}
              aria-label={`Kort: ${card.title}. Træk for at ændre rækkefølge.`}
            >
              <BudgetSection
                section={section}
                title={card.title}
                fields={card.fields}
                values={card.values}
                fieldPeriods={budgetFieldPeriods}
                arePeriodTogglesEnabled={arePeriodTogglesEnabled}
                onChange={card.onChange}
                onPeriodChange={updateBudgetFieldPeriod}
                onHideField={hideBudgetField}
                hiddenFieldIds={hiddenFieldIds}
                totalLabel={card.totalLabel}
                totalValue={card.totalValue}
                percentageOfIncome={card.percentageOfIncome}
                darkMode={isDarkMode}
                isCollapsed={collapsedSections[section] === true}
                onToggleCollapsed={() =>
                  setCollapsedSections((current) => ({
                    ...current,
                    [section]: !current[section],
                  }))
                }
                onAddField={addCustomField}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div
          id="tour-wealth-assumptions"
          draggable
          onDragStart={(event: DragEvent<HTMLDivElement>) => {
            if (shouldPreventCardDrag(event.target)) {
              event.preventDefault();
              return;
            }
            setDraggedMidPageCard("wealthAssumptions");
          }}
          onDragEnd={() => {
            setDraggedMidPageCard(null);
            setDropTargetMidPageCard(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (dropTargetMidPageCard !== "wealthAssumptions") {
              setDropTargetMidPageCard("wealthAssumptions");
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedMidPageCard) {
              moveMidPageCard(draggedMidPageCard, "wealthAssumptions");
            }
            setDraggedMidPageCard(null);
            setDropTargetMidPageCard(null);
          }}
          className={`rounded-2xl border p-4 shadow-[0_20px_48px_-26px_rgba(2,6,23,0.48)] backdrop-blur-sm transition md:p-5 ${
            isDarkMode ? "border-slate-700/70 bg-slate-900/86" : "border-cyan-100 bg-white/90"
          } ${
            dropTargetMidPageCard === "wealthAssumptions" && draggedMidPageCard !== "wealthAssumptions"
              ? "ring-2 ring-cyan-400/75 ring-offset-2 ring-offset-transparent"
              : ""
          }`}
          style={{ order: midPageCardOrder.indexOf("wealthAssumptions") }}
        >
          <h2 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>
            <span>🏠</span>
            Formueforudsætninger
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={startingSavingsInput}
                onChange={(event) => setStartingSavingsInput(formatAmountInputOnChange(event.target.value))}
                className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                    : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                }`}
                placeholder="Nuværende opsparing (DKK)"
                aria-label="Nuværende opsparing (DKK)"
              />
              {startingSavingsInput.trim() !== "" ? (
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Nuværende opsparing (DKK)
                </span>
              ) : null}
            </div>
          </div>

          <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={expectedMonthlySavingsInput}
                onChange={(event) => setExpectedMonthlySavingsInput(formatAmountInputOnChange(event.target.value))}
                className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                    : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                }`}
                placeholder="Forventes opspares pr. md. (DKK)"
                aria-label="Forventes opspares pr. md. (DKK)"
              />
              {expectedMonthlySavingsInput.trim() !== "" ? (
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Forventes opspares pr. md. (DKK)
                </span>
              ) : null}
            </div>
          </div>

          <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={homeValueInput}
                onChange={(event) => setHomeValueInput(formatAmountInputOnChange(event.target.value))}
                className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                    : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                }`}
                placeholder="Boligværdi (DKK)"
                aria-label="Boligværdi (DKK)"
              />
              {homeValueInput.trim() !== "" ? (
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Boligværdi (DKK)
                </span>
              ) : null}
            </div>
          </div>

          <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={mortgageDebtInput}
                  onChange={(event) => setMortgageDebtInput(formatAmountInputOnChange(event.target.value))}
                  className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                    isDarkMode
                      ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                      : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                  }`}
                  placeholder="Restgæld boliglån (DKK)"
                  aria-label="Restgæld boliglån (DKK)"
                />
                {mortgageDebtInput.trim() !== "" ? (
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Restgæld boliglån (DKK)
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={interestRateInput}
                  onChange={(event) => setInterestRateInput(event.target.value)}
                  className={`w-full rounded-lg border px-3 py-2 pr-20 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                    isDarkMode
                      ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                      : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                  }`}
                  placeholder="Årlig rente (%)"
                  aria-label="Årlig rente (%)"
                />
                {interestRateInput.trim() !== "" ? (
                  <span
                    className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                      isDarkMode ? "text-slate-500" : "text-slate-400"
                    }`}
                  >
                    Årlig rente (%)
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={homeGrowthRateInput}
                onChange={(event) => setHomeGrowthRateInput(event.target.value)}
                className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                    : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                }`}
                placeholder="Årlig værdistigning bolig (%)"
                aria-label="Årlig værdistigning bolig (%)"
              />
              {homeGrowthRateInput.trim() !== "" ? (
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Årlig værdistigning bolig (%)
                </span>
              ) : null}
            </div>
          </div>

          <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={salaryGrowthRateInput}
                onChange={(event) => setSalaryGrowthRateInput(event.target.value)}
                className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                    : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                }`}
                placeholder="Forventet lønstigning pr. år (%)"
                aria-label="Forventet lønstigning pr. år (%)"
              />
              {salaryGrowthRateInput.trim() !== "" ? (
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Forventet lønstigning pr. år (%)
                </span>
              ) : null}
            </div>
          </div>
          </div>
        </div>

        <div
          id="tour-pension"
          draggable
          onDragStart={(event: DragEvent<HTMLDivElement>) => {
            if (shouldPreventCardDrag(event.target)) {
              event.preventDefault();
              return;
            }
            setDraggedMidPageCard("pension");
          }}
          onDragEnd={() => {
            setDraggedMidPageCard(null);
            setDropTargetMidPageCard(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (dropTargetMidPageCard !== "pension") {
              setDropTargetMidPageCard("pension");
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedMidPageCard) {
              moveMidPageCard(draggedMidPageCard, "pension");
            }
            setDraggedMidPageCard(null);
            setDropTargetMidPageCard(null);
          }}
          className={`rounded-2xl border p-4 shadow-[0_20px_48px_-26px_rgba(2,6,23,0.48)] backdrop-blur-sm transition md:p-5 ${
            isDarkMode ? "border-slate-700/70 bg-slate-900/86" : "border-cyan-100 bg-white/90"
          } ${
            dropTargetMidPageCard === "pension" && draggedMidPageCard !== "pension"
              ? "ring-2 ring-cyan-400/75 ring-offset-2 ring-offset-transparent"
              : ""
          }`}
          style={{ order: midPageCardOrder.indexOf("pension") }}
        >
          <h2 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>
            <span>📈</span>
            Pensionsopsparing
          </h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={pensionCurrentInput}
                onChange={(event) => setPensionCurrentInput(formatAmountInputOnChange(event.target.value))}
                className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                    : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                }`}
                placeholder="Nuværende pension (DKK)"
                aria-label="Nuværende pension (DKK)"
              />
              {pensionCurrentInput.trim() !== "" ? (
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Nuværende pension (DKK)
                </span>
              ) : null}
            </div>
          </div>

          <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="relative">
              <input
                type="text"
                inputMode="decimal"
                value={pensionMonthlyInput}
                onChange={(event) => setPensionMonthlyInput(formatAmountInputOnChange(event.target.value))}
                className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                    : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                }`}
                placeholder="Månedlig indbetaling (DKK)"
                aria-label="Månedlig indbetaling (DKK)"
              />
              {pensionMonthlyInput.trim() !== "" ? (
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Månedlig indbetaling (DKK)
                </span>
              ) : null}
            </div>
          </div>

          <div className={`flex flex-col gap-1.5 text-sm font-medium ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={pensionReturnInput}
                onChange={(event) => setPensionReturnInput(event.target.value)}
                className={`w-full rounded-lg border px-3 py-2 pr-24 outline-none ring-sky-400 focus:ring focus:placeholder:text-transparent ${
                  isDarkMode
                    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-300 placeholder:font-medium"
                    : "border-sky-200 bg-white text-slate-900 placeholder:text-slate-600 placeholder:font-medium"
                }`}
                placeholder="Forventet årligt afkast (%)"
                aria-label="Forventet årligt afkast (%)"
              />
              {pensionReturnInput.trim() !== "" ? (
                <span
                  className={`pointer-events-none absolute right-3 top-1/2 max-w-[45%] -translate-y-1/2 truncate text-[11px] ${
                    isDarkMode ? "text-slate-500" : "text-slate-400"
                  }`}
                >
                  Forventet årligt afkast (%)
                </span>
              ) : null}
            </div>
          </div>
          </div>

          <div className={`mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
            <p>
              Nuværende pension: <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(pensionCurrent)}</span>
            </p>
            <p>
              Forventet pension efter {formatPeriodLabel(pensionSelectedMonths)}:{" "}
              <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(finalPension)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
      {hasWealthContent && points.length > 0 ? (
        <div
          draggable
          onDragStart={(event: DragEvent<HTMLDivElement>) => {
            if (shouldPreventCardDrag(event.target)) {
              event.preventDefault();
              return;
            }
            setDraggedLowerPageCard("projection");
          }}
          onDragEnd={() => {
            setDraggedLowerPageCard(null);
            setDropTargetLowerPageCard(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (dropTargetLowerPageCard !== "projection") {
              setDropTargetLowerPageCard("projection");
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedLowerPageCard) {
              moveLowerPageCard(draggedLowerPageCard, "projection");
            }
            setDraggedLowerPageCard(null);
            setDropTargetLowerPageCard(null);
          }}
          className={`space-y-3 rounded-2xl p-4 shadow-[0_16px_44px_-28px_rgba(2,6,23,0.45)] backdrop-blur-sm transition md:p-5 ${
            isDarkMode ? "bg-slate-900/72" : "bg-white/74"
          } ${
            dropTargetLowerPageCard === "projection" && draggedLowerPageCard !== "projection"
              ? "ring-2 ring-cyan-400/75 ring-offset-2 ring-offset-transparent"
              : ""
          }`}
          style={{ order: lowerPageCardOrder.indexOf("projection") }}
        >
          <div className={`flex flex-wrap gap-x-5 gap-y-2 text-sm ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
            <p>
              Forventet formue efter {formatPeriodLabel(selectedMonths)}:{" "}
              <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(finalNetWorth)}</span>
            </p>
            <p>
              Restgæld efter {formatPeriodLabel(selectedMonths)}:{" "}
              <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(finalDebt)}</span>
            </p>
            <p>
              Boligværdi efter {formatPeriodLabel(selectedMonths)}:{" "}
              <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(finalHomeValue)}</span>
            </p>
            <p>
              Opsparing efter {formatPeriodLabel(selectedMonths)}:{" "}
              <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(finalCash)}</span>
            </p>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => {
                if (!hasCompletePensionInputs) {
                  return;
                }

                setIncludePensionInNetWorth((current) => !current);
              }}
              disabled={!hasCompletePensionInputs}
              title={!hasCompletePensionInputs ? "Du kan inkludere din pension hvis du indtaster den nedenfor" : undefined}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                includePensionInNetWorth
                  ? "bg-emerald-600 text-white"
                  : hasCompletePensionInputs
                    ? "bg-white/85 text-slate-700 hover:bg-white"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
              }`}
            >
              Inkluder forventet pension
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {PERIODS.map((period) => {
              const isActive = selectedMonths === period.months;

              return (
                <button
                  key={period.months}
                  type="button"
                  onClick={() => {
                    setSelectedMonths(period.months);
                    setPensionSelectedMonths(period.months);
                  }}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-[0_8px_20px_-10px_rgba(13,148,136,0.8)]"
                      : "bg-white/85 text-zinc-700 hover:bg-white"
                  }`}
                >
                  {period.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ProjectionChart
              title="Formueudvikling"
              subtitle="Grafen viser forventet formue, boligværdi og restgæld over tid med valgte renter og værdistigning."
              months={selectedMonths}
              series={netWorthSeries}
              ariaLabel="Graf over forventet formue, boligværdi og restgæld"
              darkMode={isDarkMode}
            />

            <ProjectionChart
              title="Pensionsprognose"
              subtitle="Udvikling med renters rente og faste månedlige indbetalinger."
              months={pensionSelectedMonths}
              series={pensionSeries}
              ariaLabel="Graf over pensionsopsparing over tid"
              darkMode={isDarkMode}
            />
          </div>
        </div>
      ) : (
        <div
          draggable
          onDragStart={(event: DragEvent<HTMLDivElement>) => {
            if (shouldPreventCardDrag(event.target)) {
              event.preventDefault();
              return;
            }
            setDraggedLowerPageCard("projection");
          }}
          onDragEnd={() => {
            setDraggedLowerPageCard(null);
            setDropTargetLowerPageCard(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (dropTargetLowerPageCard !== "projection") {
              setDropTargetLowerPageCard("projection");
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedLowerPageCard) {
              moveLowerPageCard(draggedLowerPageCard, "projection");
            }
            setDraggedLowerPageCard(null);
            setDropTargetLowerPageCard(null);
          }}
          className={`rounded-2xl p-5 text-sm backdrop-blur-sm transition ${
            isDarkMode ? "bg-slate-900/72 text-slate-300" : "bg-white/75 text-zinc-600"
          } ${
            dropTargetLowerPageCard === "projection" && draggedLowerPageCard !== "projection"
              ? "ring-2 ring-cyan-400/75 ring-offset-2 ring-offset-transparent"
              : ""
          }`}
          style={{ order: lowerPageCardOrder.indexOf("projection") }}
        >
          Indtast dine tal for at se udvikling i formue.
        </div>
      )}

      {hasOverviewData ? (
        <div
          draggable
          onDragStart={(event: DragEvent<HTMLDivElement>) => {
            if (shouldPreventCardDrag(event.target)) {
              event.preventDefault();
              return;
            }
            setDraggedLowerPageCard("moreCharts");
          }}
          onDragEnd={() => {
            setDraggedLowerPageCard(null);
            setDropTargetLowerPageCard(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            if (dropTargetLowerPageCard !== "moreCharts") {
              setDropTargetLowerPageCard("moreCharts");
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (draggedLowerPageCard) {
              moveLowerPageCard(draggedLowerPageCard, "moreCharts");
            }
            setDraggedLowerPageCard(null);
            setDropTargetLowerPageCard(null);
          }}
          className={`rounded-2xl border p-4 shadow-[0_16px_44px_-28px_rgba(2,6,23,0.45)] transition ${
            isDarkMode ? "border-slate-700/70 bg-slate-900/78" : "border-cyan-100 bg-white/80"
          } ${
            dropTargetLowerPageCard === "moreCharts" && draggedLowerPageCard !== "moreCharts"
              ? "ring-2 ring-cyan-400/75 ring-offset-2 ring-offset-transparent"
              : ""
          }`}
          style={{ order: lowerPageCardOrder.indexOf("moreCharts") }}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className={`text-sm font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>Flere Diagrammer</h2>
              <p className={`mt-1 text-xs ${isDarkMode ? "text-slate-300" : "text-zinc-600"}`}>Vaelg selv hvilke overbliksdiagrammer du vil se.</p>
            </div>
            <button
              type="button"
              onClick={() => setVisibleOverviewCharts(DEFAULT_OVERVIEW_CHARTS)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              Vis alle
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {OVERVIEW_CHART_OPTIONS.map((option) => {
              const active = visibleOverviewCharts.includes(option.key);
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => toggleOverviewChart(option.key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-cyan-600 to-teal-600 text-white"
                      : isDarkMode
                        ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                  aria-pressed={active}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {visibleOverviewCharts.includes("expenseDonut") ? (
              <OverviewChartCard title="Udgifter Donut" subtitle="Fordeling af maanedlige udgifter" darkMode={isDarkMode}>
                {expenseDonutSegments.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0">
                      <circle cx="60" cy="60" r="36" fill="none" stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} strokeWidth="16" />
                      {expenseDonutSegments.map((segment) => (
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
                    <div className={`space-y-1.5 text-xs ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                      {expenseDonutSegments.map((segment) => (
                        <p key={segment.key} className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: segment.color }} />
                            {segment.label}
                          </span>
                          <span className="font-semibold">{segment.ratio * 100 < 1 ? "<1%" : `${(segment.ratio * 100).toFixed(0)}%`}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>Ingen udgifter at vise endnu.</p>
                )}
              </OverviewChartCard>
            ) : null}

            {visibleOverviewCharts.includes("incomeVsExpense") ? (
              <OverviewChartCard title="Indkomst Vs Udgift" subtitle="Maanedlig sammenligning" darkMode={isDarkMode}>
                {Math.max(monthlyIncome, monthlyExpenses, 1) > 0 ? (
                  <div className="space-y-2">
                    {[
                      { label: "Indkomst", value: monthlyIncome, color: "#10b981" },
                      { label: "Udgift", value: monthlyExpenses, color: "#ef4444" },
                      { label: "Raadig", value: Math.max(monthlyDisposable, 0), color: "#3b82f6" },
                    ].map((entry) => (
                      <div key={entry.label} className="space-y-1">
                        <div className={`flex items-center justify-between text-xs ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                          <span>{entry.label}</span>
                          <span className="font-semibold">{formatCurrency(entry.value)}</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${(entry.value / Math.max(monthlyIncome, monthlyExpenses, 1)) * 100}%`, backgroundColor: entry.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </OverviewChartCard>
            ) : null}

            {visibleOverviewCharts.includes("expenseStack") ? (
              <OverviewChartCard title="Udgiftsmix" subtitle="Stablet andel af udgifter" darkMode={isDarkMode}>
                <div className={`h-5 overflow-hidden rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                  {expenseBreakdown.map((entry) => (
                    <div
                      key={entry.key}
                      className="h-full"
                      style={{
                        width: `${monthlyExpenses > 0 ? (entry.value / monthlyExpenses) * 100 : 0}%`,
                        backgroundColor: entry.color,
                        float: "left",
                      }}
                    />
                  ))}
                </div>
                <div className={`mt-2 space-y-1 text-xs ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                  {expenseBreakdown.map((entry) => (
                    <p key={entry.key} className="flex items-center justify-between">
                      <span>{entry.label}</span>
                      <span className="font-semibold">{monthlyExpenses > 0 ? ((entry.value / monthlyExpenses) * 100).toFixed(0) : 0}%</span>
                    </p>
                  ))}
                </div>
              </OverviewChartCard>
            ) : null}

            {visibleOverviewCharts.includes("savingsGauge") ? (
              <OverviewChartCard title="Opsparings-Rate" subtitle="Andel af nettoindkomst" darkMode={isDarkMode}>
                <div className="flex items-center gap-3">
                  <svg viewBox="0 0 120 70" className="h-20 w-28">
                    <path d="M10 60 A50 50 0 0 1 110 60" fill="none" stroke={isDarkMode ? "#1e293b" : "#e2e8f0"} strokeWidth="12" strokeLinecap="round" />
                    <path
                      d="M10 60 A50 50 0 0 1 110 60"
                      fill="none"
                      stroke={disposableShare >= 20 ? "#10b981" : disposableShare >= 10 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${clamp(disposableShare, 0, 40) / 40 * 157} 157`}
                    />
                  </svg>
                  <div>
                    <p className={`text-2xl font-bold ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>{disposableShare.toFixed(0)}%</p>
                    <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-zinc-600"}`}>Raadighed af indkomst</p>
                  </div>
                </div>
              </OverviewChartCard>
            ) : null}

            {visibleOverviewCharts.includes("housingGauge") ? (
              <OverviewChartCard title="Boligprocent Gauge" subtitle="Boligudgift i procent" darkMode={isDarkMode}>
                <div className={`h-3 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${clamp(housingShare, 0, 100)}%`,
                      background: housingShare >= 55 ? "#ef4444" : housingShare >= 45 ? "#f59e0b" : "#10b981",
                    }}
                  />
                </div>
                <p className={`mt-2 text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>{housingShare.toFixed(0)}% af nettoindkomst</p>
              </OverviewChartCard>
            ) : null}

            {visibleOverviewCharts.includes("debtGauge") ? (
              <OverviewChartCard title="Gaeldsprocent Gauge" subtitle="Gaeld ift. aarsindkomst" darkMode={isDarkMode}>
                <div className={`h-3 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${clamp(debtToIncomeShare, 0, 200) / 2}%`,
                      background: debtToIncomeShare > 120 ? "#ef4444" : debtToIncomeShare > 80 ? "#f59e0b" : "#10b981",
                    }}
                  />
                </div>
                <p className={`mt-2 text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>{debtToIncomeShare.toFixed(0)}%</p>
              </OverviewChartCard>
            ) : null}

            {visibleOverviewCharts.includes("assetsVsDebt") ? (
              <OverviewChartCard title="Aktiver Vs Gaeld" subtitle="Nuværende balance" darkMode={isDarkMode}>
                <div className="space-y-2">
                  {[
                    { label: "Aktiver", value: assetsNow, color: "#10b981" },
                    { label: "Gaeld", value: liabilitiesNow, color: "#ef4444" },
                  ].map((entry) => (
                    <div key={entry.label} className="space-y-1">
                      <div className={`flex items-center justify-between text-xs ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                        <span>{entry.label}</span>
                        <span className="font-semibold">{formatCurrency(entry.value)}</span>
                      </div>
                      <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${(entry.value / Math.max(assetsNow, liabilitiesNow, 1)) * 100}%`, backgroundColor: entry.color }}
                        />
                      </div>
                    </div>
                  ))}
                  <p className={`text-xs font-semibold ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
                    Netto: {formatCurrency(assetsNow - liabilitiesNow)}
                  </p>
                </div>
              </OverviewChartCard>
            ) : null}

            {visibleOverviewCharts.includes("netWorthTrend") ? (
              <OverviewChartCard title="Formue Trend" subtitle={`Udvikling over ${formatPeriodLabel(selectedMonths)}`} darkMode={isDarkMode}>
                {netWorthSparkline ? (
                  <svg viewBox="0 0 280 96" className="h-24 w-full">
                    <polyline fill="none" stroke="#06b6d4" strokeWidth="3" points={netWorthSparkline} strokeLinecap="round" strokeLinejoin="round" />
                    <line x1="0" y1="90" x2="280" y2="90" stroke={isDarkMode ? "#334155" : "#e2e8f0"} strokeWidth="1" />
                  </svg>
                ) : (
                  <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>For lidt data til trend endnu.</p>
                )}
              </OverviewChartCard>
            ) : null}

            {visibleOverviewCharts.includes("annualFlow") ? (
              <OverviewChartCard title="Aarsflow" subtitle="Indkomst, udgift og overskud pr. aar" darkMode={isDarkMode}>
                <div className="space-y-2">
                  {[
                    { label: "Indkomst", value: annualIncome, color: "#10b981" },
                    { label: "Udgift", value: annualExpenses, color: "#ef4444" },
                    { label: "Overskud", value: Math.max(annualSurplus, 0), color: "#3b82f6" },
                  ].map((entry) => (
                    <div key={entry.label} className="space-y-1">
                      <div className={`flex items-center justify-between text-xs ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                        <span>{entry.label}</span>
                        <span className="font-semibold">{formatCurrency(entry.value)}</span>
                      </div>
                      <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                        <div className="h-2 rounded-full" style={{ width: `${(entry.value / Math.max(annualIncome, annualExpenses, 1)) * 100}%`, backgroundColor: entry.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </OverviewChartCard>
            ) : null}

            {visibleOverviewCharts.includes("topExpenses") ? (
              <OverviewChartCard title="Top Udgifter" subtitle="Stoerste poster nu" darkMode={isDarkMode}>
                <div className="space-y-2">
                  {topExpenseCategories.length > 0 ? (
                    topExpenseCategories.map((entry) => (
                      <div key={entry.label} className="space-y-1">
                        <div className={`flex items-center justify-between text-xs ${isDarkMode ? "text-slate-300" : "text-zinc-700"}`}>
                          <span>{entry.icon} {entry.label}</span>
                          <span className="font-semibold">{formatCurrency(entry.value)}</span>
                        </div>
                        <div className={`h-2 rounded-full ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                          <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${entry.share}%` }} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-zinc-500"}`}>Ingen udgifter endnu.</p>
                  )}
                </div>
              </OverviewChartCard>
            ) : null}
          </div>
        </div>
      ) : null}
      </div>
      </section>

      {isSidebarVisible ? (
        <aside id="tour-sidebar" className="w-full lg:sticky lg:top-4 lg:max-h-[calc(100vh-2.5rem)] lg:w-56 lg:shrink-0 lg:overflow-y-auto">
          <div className={`space-y-4 rounded-2xl border p-4 shadow-[0_16px_40px_-24px_rgba(2,6,23,0.45)] backdrop-blur-sm ${isDarkMode ? "border-slate-700/70 bg-slate-900/92" : "border-cyan-100 bg-white/92"}`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-zinc-900"}`}>
                <span>📊</span>
                Økonomisk overblik
              </h2>
              <button
                type="button"
                onClick={() => setIsSidebarVisible(false)}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                  isDarkMode ? "bg-slate-800 text-slate-100 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                aria-label="Luk økonomisk overblik"
                title="Luk økonomisk overblik"
              >
                X
              </button>
            </div>
            {hasOverviewData ? (
              <>
                <div className={`rounded-xl px-3 py-3 ${isDarkMode ? "bg-slate-800/80 text-slate-200" : "bg-sky-50/65 text-slate-700"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>Nøgletal</p>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <p className="flex items-center justify-between">
                      <span>Indtægter pr. måned</span>
                      <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(monthlyIncome)}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Udgifter pr. måned</span>
                      <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(monthlyExpenses)}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Indtægter pr. år</span>
                      <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(annualIncome)}</span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span>Udgifter pr. år</span>
                      <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(annualExpenses)}</span>
                    </p>
                    <p className={`mt-2 flex items-center justify-between pt-2 text-sm ${isDarkMode ? "border-t border-slate-700/70" : "border-t border-sky-100"}`}>
                      <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>Rådighedsbeløb</span>
                      <span className={isDarkMode ? "font-bold text-slate-100" : "font-bold text-zinc-900"}>{formatCurrency(monthlyDisposable)}</span>
                    </p>
                  </div>
                </div>

                <div className={`rounded-xl px-4 py-3 ${disposableToneClass}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide">Radighedsbelob</p>
                  <p className="mt-1 text-3xl font-bold">{formatCurrency(monthlyDisposable)}</p>
                  <p className="mt-1 text-xs font-medium">{disposableShare.toFixed(0)}% af nettoindkomst</p>
                </div>

                <div className={`rounded-xl px-4 py-3 ${healthToneClass}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide">Økonomisk sundhedsscore</p>
                  <p className="mt-1 text-3xl font-bold">{economicHealthScore}/100</p>
                  <p className="mt-1 text-xs font-medium">Status: {healthStatus}</p>
                </div>

                <div
                  className={`space-y-2 rounded-xl px-3 py-3 text-sm ${
                    isDarkMode ? "bg-slate-800/80 text-slate-200" : "bg-sky-50/55 text-slate-700"
                  }`}
                >
                  <p className="flex items-center justify-between">
                    <span>💰 Samlede indtægter</span>
                    <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(monthlyIncome)}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>💸 Samlede udgifter</span>
                    <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{formatCurrency(monthlyExpenses)}</span>
                  </p>
                </div>

                <div className={`rounded-xl px-3 py-3 ${isDarkMode ? "bg-slate-800/80" : "bg-white/80"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>Udgiftsfordeling (top 3)</p>
                  <div className={`mt-2 space-y-1.5 text-sm ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>
                    {topExpenseCategories.length > 0 ? (
                      topExpenseCategories.map((entry) => (
                        <p key={entry.label} className="flex items-center justify-between">
                          <span>
                            {entry.icon} {entry.label}
                          </span>
                          <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>{entry.share.toFixed(0)}%</span>
                        </p>
                      ))
                    ) : (
                      <p className={isDarkMode ? "text-slate-400" : "text-zinc-500"}>Ingen udgifter endnu.</p>
                    )}
                  </div>
                </div>

                <div className={`rounded-xl px-3 py-3 ${housingToneClass}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide">Boligprocent</p>
                  <p className="mt-1 text-lg font-bold">Bolig = {housingShare.toFixed(0)}% af indkomst</p>
                </div>

                <div
                  className={`rounded-xl px-3 py-3 text-sm ${
                    isDarkMode ? "bg-slate-800/80 text-slate-200" : "bg-white/80 text-slate-700"
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>Opsparingsrate</p>
                  <p className={isDarkMode ? "mt-1 font-semibold text-slate-100" : "mt-1 font-semibold text-zinc-900"}>Du sparer {savingsRate.toFixed(0)}%</p>
                  <p className="mt-1">Potentiel opsparing: {formatCurrency(monthlyDisposable)}/md</p>
                  {monthsToTarget !== null ? <p className="mt-1">{monthsToTarget} måneder til 250.000 kr</p> : null}
                </div>

                <div className={`rounded-xl px-3 py-3 ${isDarkMode ? "bg-slate-800/80" : "bg-white/80"}`}>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-slate-200" : "text-zinc-700"}`}>Advarsler / insights</p>
                  <div className="mt-2 space-y-1.5 text-sm">
                    {insightItems.map((entry, index) => (
                      <p key={`${entry.text}-${index}`} className={entry.className}>
                        {entry.icon} {entry.text}
                      </p>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-xl px-3 py-3 text-xs ${
                    isDarkMode ? "bg-slate-800/80 text-slate-300" : "bg-sky-50/55 text-slate-600"
                  }`}
                >
                  <p className="flex items-center justify-between">
                    <span>Nettoformue nu</span>
                    <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>
                      {formatCurrency(startingSavings + homeValue - mortgageDebt)}
                    </span>
                  </p>
                  <p className="mt-1 flex items-center justify-between">
                    <span>Gældsprocent</span>
                    <span className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>
                      {monthlyIncome > 0 ? ((mortgageDebt / (monthlyIncome * 12)) * 100).toFixed(0) : "0"}%
                    </span>
                  </p>
                </div>
              </>
            ) : (
              <div
                className={`rounded-xl px-4 py-5 text-sm ${
                  isDarkMode ? "bg-slate-800/80 text-slate-300" : "bg-sky-50/60 text-slate-600"
                }`}
              >
                <p className={isDarkMode ? "font-semibold text-slate-100" : "font-semibold text-zinc-900"}>Her er helt stille lige nu.</p>
                <p className="mt-1">Indtast nogle tal, så vækker vi økonomien til live.</p>
              </div>
            )}
          </div>
        </aside>
        ) : null}
    </div>
  );
}




