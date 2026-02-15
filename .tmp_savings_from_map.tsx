"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";

type PeriodOption = {
  label: string;
  months: number;
};

type FieldConfig = {
  key: string;
  label: string;
  placeholder: string;
};

type ImportTarget = {
  section: "income" | "housing" | "transport" | "fixed" | "meta";
  key: string;
};

const PERIODS: PeriodOption[] = [
  { label: "3 mdr", months: 3 },
  { label: "6 mdr", months: 6 },
  { label: "1 Ã¥r", months: 12 },
  { label: "2 Ã¥r", months: 24 },
  { label: "5 Ã¥r", months: 60 },
  { label: "10 Ã¥r", months: 120 },
  { label: "30 Ã¥r", months: 360 },
];

const CHART_WIDTH = 860;
const CHART_HEIGHT = 340;
const CHART_PADDING_TOP = 20;
const CHART_PADDING_RIGHT = 20;
const CHART_PADDING_BOTTOM = 42;
const CHART_PADDING_LEFT = 72;

const INCOME_FIELDS: FieldConfig[] = [
  { key: "person1Salary", label: "Person 1 lÃ¸n (netto)", placeholder: "30237" },
  { key: "person2Salary", label: "Person 2 lÃ¸n (netto)", placeholder: "1000" },
  { key: "benefits", label: "Dagpenge, kontanthjÃ¦lp, SU", placeholder: "5800" },
  { key: "childBenefits", label: "BÃ¸rnepenge", placeholder: "1708" },
  { key: "otherIncome", label: "Ã¸vrige indtÃ¦gter (netto)", placeholder: "1250" },
];

const HOUSING_FIELDS: FieldConfig[] = [
  { key: "housingPayment", label: "Husleje/ydelse pa boliglan", placeholder: "10081" },
  { key: "heat", label: "Varme", placeholder: "610" },
  { key: "water", label: "Vand", placeholder: "700" },
  { key: "electricity", label: "El", placeholder: "350" },
  { key: "gas", label: "Gas", placeholder: "275" },
  { key: "propertyTax", label: "Ejendomsskat/ejerudgift", placeholder: "3600" },
  { key: "maintenance", label: "Vedligehold og reparation", placeholder: "450" },
  { key: "otherHousing", label: "Andre udgifter", placeholder: "320" },
];

const TRANSPORT_FIELDS: FieldConfig[] = [
  { key: "leasing", label: "Leasingaftale/Billan", placeholder: "2800" },
  { key: "publicTransport", label: "Offentlig transport", placeholder: "4200" },
  { key: "fuel", label: "BrÃ¦ndstof", placeholder: "950" },
  { key: "ownershipTax", label: "Ejerafgift", placeholder: "210" },
  { key: "transportMaintenance", label: "Vedligehold og reparation", placeholder: "375" },
];

const FIXED_FIELDS: FieldConfig[] = [
  { key: "union", label: "Fagforening", placeholder: "293" },
  { key: "aKasse", label: "A-kasse", placeholder: "467" },
  { key: "insurance", label: "Forsikringer", placeholder: "328" },
  { key: "accidentInsurance", label: "Ulykkesforsikring", placeholder: "180" },
  { key: "travelInsurance", label: "Arsrejseforsikring", placeholder: "95" },
  { key: "homeInsurance", label: "Indbo", placeholder: "240" },
  { key: "healthInsurance", label: "Sygesikring", placeholder: "169" },
  { key: "daycare", label: "Daginstitution/SFO", placeholder: "1800" },
  { key: "tvSubscriptions", label: "TV/Licens/Abonnementer", placeholder: "30" },
  { key: "phoneInternet", label: "Telefon/internet", placeholder: "119" },
  { key: "medicine", label: "Medicin", placeholder: "50" },
  { key: "sport", label: "Sport og fritid", placeholder: "500" },
  { key: "glasses", label: "Briller og kontaktlinser", placeholder: "88" },
  { key: "dentist", label: "TandlÃ¦ge", placeholder: "86" },
  { key: "food", label: "Mad", placeholder: "4200" },
];

const IMPORT_MAPPINGS: { aliases: string[]; target: ImportTarget }[] = [
  { aliases: ["martins lon", "person 1", "person1"], target: { section: "income", key: "person1Salary" } },
  { aliases: ["rikkes lon", "person 2", "person2"], target: { section: "income", key: "person2Salary" } },
  { aliases: ["dagpenge", "kontanthjÃ¦lp", "su"], target: { section: "income", key: "benefits" } },
  { aliases: ["bÃ¸rnepenge"], target: { section: "income", key: "childBenefits" } },
  { aliases: ["Ã¸vrige indtÃ¦gter"], target: { section: "income", key: "otherIncome" } },
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
  { aliases: ["brÃ¦ndstof"], target: { section: "transport", key: "fuel" } },
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
  { aliases: ["tandlÃ¦ge"], target: { section: "fixed", key: "dentist" } },
  { aliases: ["mad"], target: { section: "fixed", key: "food" } },
  { aliases: ["startopsparing"], target: { section: "meta", key: "startingSavings" } },
  { aliases: ["boligvÃ¦rdi"], target: { section: "meta", key: "homeValue" } },
  { aliases: ["restgÃ¦ld"], target: { section: "meta", key: "mortgageDebt" } },
  { aliases: ["rente"], target: { section: "meta", key: "interestRate" } },
  { aliases: ["vÃ¦rdistigning", "vaerdistigning"], target: { section: "meta", key: "homeGrowthRate" } },
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
  return Math.round(parseAmount(value));
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

function sumValues(values: Record<string, string>): number {
  return Object.values(values).reduce((sum, value) => sum + parseCurrencyAmount(value), 0);
}

function formatPeriodLabel(months: number): string {
  if (months % 12 === 0) {
    return `${months / 12} ar`;
  }

  return `${months} mdr`;
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

type ChartGeometry = {
  seriesPaths: { label: string; color: string; path: string }[];
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
    const path = entry.values.map((value, month) => `${toX(month)},${toY(value)}`).join(" ");
    return { label: entry.label, color: entry.color, path };
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

type BudgetSectionProps = {
  title: string;
  fields: FieldConfig[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  totalLabel: string;
  totalValue: number;
  percentageOfIncome?: number;
};

function BudgetSection({
  title,
  fields,
  values,
  onChange,
  totalLabel,
  totalValue,
  percentageOfIncome,
}: BudgetSectionProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <h2 className="border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-zinc-900">
        {title}
      </h2>
      <div className="space-y-2 p-4">
        {fields.map((field) => (
          <label key={field.key} className="grid gap-1 text-sm text-zinc-700">
            <span className="font-medium">{field.label}</span>
            <input
              type="text"
              inputMode="decimal"
              value={values[field.key] ?? ""}
              onChange={(event) => onChange(field.key, formatAmountInput(event.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
              placeholder={`fx ${field.placeholder}`}
            />
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-900">
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
};

function ProjectionChart({ title, subtitle, months, series, ariaLabel }: ProjectionChartProps) {
  const chart = useMemo(() => buildChartGeometry(months, series), [months, series]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">{title}</h3>
      <p className="mt-1 text-xs text-zinc-600">{subtitle}</p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-100 bg-zinc-50 p-2">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          className="h-80 min-w-[620px] w-full"
          role="img"
          aria-label={ariaLabel}
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
            Belob (DKK)
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
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-zinc-700">
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

export function SavingsProjection() {
  const [incomeValues, setIncomeValues] = useState<Record<string, string>>({});
  const [housingValues, setHousingValues] = useState<Record<string, string>>({});
  const [transportValues, setTransportValues] = useState<Record<string, string>>({});
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({});
  const [startingSavingsInput, setStartingSavingsInput] = useState("0");
  const [homeValueInput, setHomeValueInput] = useState("");
  const [mortgageDebtInput, setMortgageDebtInput] = useState("");
  const [interestRateInput, setInterestRateInput] = useState("");
  const [homeGrowthRateInput, setHomeGrowthRateInput] = useState("7");
  const [pensionCurrentInput, setPensionCurrentInput] = useState("");
  const [pensionMonthlyInput, setPensionMonthlyInput] = useState("");
  const [pensionReturnInput, setPensionReturnInput] = useState("");
  const [expectedMonthlySavingsInput, setExpectedMonthlySavingsInput] = useState("0");
  const [includePensionInNetWorth, setIncludePensionInNetWorth] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState(12);
  const [pensionSelectedMonths, setPensionSelectedMonths] = useState(12);
  const [importStatus, setImportStatus] = useState("");

  const updateIncome = (key: string, value: string) => setIncomeValues((current) => ({ ...current, [key]: value }));
  const updateHousing = (key: string, value: string) => setHousingValues((current) => ({ ...current, [key]: value }));
  const updateTransport = (key: string, value: string) => setTransportValues((current) => ({ ...current, [key]: value }));
  const updateFixed = (key: string, value: string) => setFixedValues((current) => ({ ...current, [key]: value }));

  const handleExportData = () => {
    const rows: Array<[string, string]> = [
      ["__myfinance_export__", "v1"],
      ["selectedMonths", selectedMonths.toString()],
      ["pensionSelectedMonths", pensionSelectedMonths.toString()],
      ["startingSavings", startingSavingsInput],
      ["expectedMonthlySavings", expectedMonthlySavingsInput],
      ["includePensionInNetWorth", includePensionInNetWorth ? "1" : "0"],
      ["homeValue", homeValueInput],
      ["mortgageDebt", mortgageDebtInput],
      ["interestRate", interestRateInput],
      ["homeGrowthRate", homeGrowthRateInput],
      ["pensionCurrent", pensionCurrentInput],
      ["pensionMonthly", pensionMonthlyInput],
      ["pensionReturn", pensionReturnInput],
    ];

    for (const field of INCOME_FIELDS) {
      rows.push([`income.${field.key}`, incomeValues[field.key] ?? ""]);
    }
    for (const field of HOUSING_FIELDS) {
      rows.push([`housing.${field.key}`, housingValues[field.key] ?? ""]);
    }
    for (const field of TRANSPORT_FIELDS) {
      rows.push([`transport.${field.key}`, transportValues[field.key] ?? ""]);
    }
    for (const field of FIXED_FIELDS) {
      rows.push([`fixed.${field.key}`, fixedValues[field.key] ?? ""]);
    }

    const csvContent = ["key,value", ...rows.map(([key, value]) => `${csvEscape(key)},${csvEscape(value)}`)].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "myfinance-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setImportStatus("Data eksporteret til CSV.");
  };

  const handleExcelImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      setImportStatus("Importerer data fra Excel...");

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
      let nextPensionCurrent = pensionCurrentInput;
      let nextPensionMonthly = pensionMonthlyInput;
      let nextPensionReturn = pensionReturnInput;
      let nextExpectedMonthlySavings = expectedMonthlySavingsInput;
      let nextIncludePensionInNetWorth = includePensionInNetWorth;
      let nextSelectedMonths = selectedMonths;
      let nextPensionSelectedMonths = pensionSelectedMonths;

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
      setPensionCurrentInput(formatAmountInput(nextPensionCurrent));
      setPensionMonthlyInput(formatAmountInput(nextPensionMonthly));
      setPensionReturnInput(nextPensionReturn);
      setExpectedMonthlySavingsInput(formatAmountInput(nextExpectedMonthlySavings));
      setIncludePensionInNetWorth(nextIncludePensionInNetWorth);
      setSelectedMonths(nextSelectedMonths);
      setPensionSelectedMonths(nextPensionSelectedMonths);

      setImportStatus("Import gennemfort.");
    } catch {
      setImportStatus("Import fejlede. Kontroller at filen er .xlsx/.xls/.csv og at pakken xlsx er installeret.");
    }

    event.target.value = "";
  };

  const monthlyIncome = sumValues(incomeValues);
  const housingExpenses = sumValues(housingValues);
  const transportExpenses = sumValues(transportValues);
  const fixedExpenses = sumValues(fixedValues);
  const monthlyExpenses = housingExpenses + transportExpenses + fixedExpenses;
  const monthlyDisposable = monthlyIncome - monthlyExpenses;

  const startingSavings = Math.max(parseCurrencyAmount(startingSavingsInput), 0);
  const homeValue = Math.max(parseCurrencyAmount(homeValueInput), 0);
  const mortgageDebt = Math.max(parseCurrencyAmount(mortgageDebtInput), 0);
  const annualInterestRate = Math.max(parseAmount(interestRateInput), 0);
  const annualHomeGrowthRate = Math.max(parseAmount(homeGrowthRateInput), 0);
  const monthlyMortgagePayment = Math.max(parseCurrencyAmount(housingValues.housingPayment ?? ""), 0);
  const pensionCurrent = Math.max(parseCurrencyAmount(pensionCurrentInput), 0);
  const pensionMonthly = Math.max(parseCurrencyAmount(pensionMonthlyInput), 0);
  const pensionAnnualReturn = Math.max(parseAmount(pensionReturnInput), 0);
  const monthlySavings = Math.max(parseCurrencyAmount(expectedMonthlySavingsInput), 0);
  const hasCompletePensionInputs =
    pensionCurrentInput.trim() !== "" && pensionMonthlyInput.trim() !== "" && pensionReturnInput.trim() !== "";

  useEffect(() => {
    if (!hasCompletePensionInputs && includePensionInNetWorth) {
      setIncludePensionInNetWorth(false);
    }
  }, [hasCompletePensionInputs, includePensionInNetWorth]);

  const points = useMemo(() => {
    const monthlyInterestRate = annualInterestRate / 100 / 12;
    const monthlyHomeGrowthRate = Math.pow(1 + annualHomeGrowthRate / 100, 1 / 12) - 1;
    const entries: { month: number; netWorth: number; cash: number; debt: number; home: number }[] = [];

    let cash = startingSavings;
    let debt = mortgageDebt;
    let house = homeValue;

    for (let month = 0; month <= selectedMonths; month += 1) {
      const netWorth = cash + house - debt;
      entries.push({ month, netWorth, cash, debt, home: house });

      if (month === selectedMonths) {
        break;
      }

      const interestForMonth = debt * monthlyInterestRate;
      const actualPayment = Math.min(monthlyMortgagePayment, debt + interestForMonth);

      cash += monthlySavings;
      debt = Math.max(0, debt + interestForMonth - actualPayment);
      house *= 1 + monthlyHomeGrowthRate;
    }

    return entries;
  }, [
    annualHomeGrowthRate,
    annualInterestRate,
    homeValue,
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
  const disposableShare = monthlyIncome > 0 ? (monthlyDisposable / monthlyIncome) * 100 : 0;
  const topExpenseCategories = useMemo(
    () =>
      [
        { label: "Bolig", icon: "ðŸ ", value: housingExpenses },
        { label: "Transport", icon: "ðŸš—", value: transportExpenses },
        { label: "Ovrige faste", icon: "ðŸ“¦", value: fixedExpenses },
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
  const disposableToneClass =
    disposableShare > 20 ? "text-emerald-700 bg-emerald-50 border-emerald-200" : disposableShare >= 10 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-rose-700 bg-rose-50 border-rose-200";
  const housingToneClass =
    housingShare > 40 ? "text-rose-700 bg-rose-50 border-rose-200" : housingShare >= 35 || housingShare < 25 ? "text-amber-700 bg-amber-50 border-amber-200" : "text-emerald-700 bg-emerald-50 border-emerald-200";
  const savingsRate = disposableShare;
  const monthsToTarget = monthlyDisposable > 0 ? Math.ceil(250000 / monthlyDisposable) : null;
  const insightItems = useMemo(() => {
    const entries: { icon: string; text: string; className: string }[] = [];

    if (housingShare > 40) {
      entries.push({
        icon: "âš ï¸",
        text: "Boligudgift er hoj i forhold til indkomst.",
        className: "text-rose-700",
      });
    }

    if (transportExpenses > 0) {
      const potential = Math.round(transportExpenses * 0.15);
      entries.push({
        icon: "ðŸ’¡",
        text: `Mulig besparelse: ${formatCurrency(potential)} ved 15% lavere transport.`,
        className: "text-amber-700",
      });
    }

    if (disposableShare >= 20 && housingShare <= 35) {
      entries.push({
        icon: "ðŸŸ¢",
        text: "Okonomien ser sund ud.",
        className: "text-emerald-700",
      });
    }

    if (entries.length === 0) {
      entries.push({
        icon: "â„¹ï¸",
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
      { label: "BoligvÃ¦rdi", color: "#2563eb", values: points.map((point) => point.home) },
      { label: "RestgÃ¦ld", color: "#dc2626", values: points.map((point) => point.debt) },
    ],
    [includePensionInNetWorth, points, wealthPensionValues],
  );
  const savingsSeries = useMemo(
    () => [{ label: "Likvid opsparing", color: "#7c3aed", values: points.map((point) => point.cash) }],
    [points],
  );
  const pensionSeries = useMemo(
    () => [{ label: "Pensionsopsparing", color: "#0f766e", values: pensionPoints.map((point) => point.value) }],
    [pensionPoints],
  );

  return (
    <section className="ml-4 mr-[19rem] w-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow-sm md:ml-6 md:p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 md:text-3xl">Budget- og formueberegner</h1>

      <div className="mt-2 flex items-center justify-end gap-2">
        <label className="group relative inline-flex cursor-pointer items-center rounded-md border border-zinc-200 bg-zinc-50 p-2 text-zinc-500 opacity-70 transition hover:opacity-100">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
          </svg>
          <span className="sr-only">Importer Excel eller CSV</span>
          <span className="pointer-events-none absolute -top-8 right-0 rounded bg-zinc-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            Importer Excel/CSV
          </span>
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />
        </label>

        <button
          type="button"
          onClick={handleExportData}
          className="group relative inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 p-2 text-zinc-500 opacity-70 transition hover:opacity-100"
          aria-label="Eksporter data til CSV"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v12m0 0l4-4m-4 4l-4-4M4 10V6a2 2 0 012-2h12a2 2 0 012 2v4" />
          </svg>
          <span className="pointer-events-none absolute -top-8 right-0 rounded bg-zinc-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
            Eksporter CSV
          </span>
        </button>

        {importStatus ? <p className="ml-1 text-xs text-zinc-500">{importStatus}</p> : null}
      </div>

      <div className="mt-6">
        <div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <BudgetSection
          title="IndtÃ¦gter"
          fields={INCOME_FIELDS}
          values={incomeValues}
          onChange={updateIncome}
          totalLabel="IndtÃ¦gter pr. md."
          totalValue={monthlyIncome}
        />

        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-900">Nogletal</h2>
          <div className="space-y-2 text-sm text-zinc-700">
            <p className="flex items-center justify-between">
              <span>IndtÃ¦gter pr. maned</span>
              <span className="font-semibold text-zinc-900">{formatCurrency(monthlyIncome)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Udgifter pr. maned</span>
              <span className="font-semibold text-zinc-900">{formatCurrency(monthlyExpenses)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>IndtÃ¦gter pr. Ã¥r</span>
              <span className="font-semibold text-zinc-900">{formatCurrency(annualIncome)}</span>
            </p>
            <p className="flex items-center justify-between">
              <span>Udgifter pr. Ã¥r</span>
              <span className="font-semibold text-zinc-900">{formatCurrency(annualExpenses)}</span>
            </p>
            <p className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 text-base">
              <span className="font-semibold text-zinc-900">RÃ¥dighedsbelÃ¸b pr. maned</span>
              <span className="font-bold text-zinc-900">{formatCurrency(monthlyDisposable)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <BudgetSection
          title="Udgifter til bolig"
          fields={HOUSING_FIELDS}
          values={housingValues}
          onChange={updateHousing}
          totalLabel="Udgifter til bolig pr. md."
          totalValue={housingExpenses}
          percentageOfIncome={housingShare}
        />

        <BudgetSection
          title="Udgifter til transport"
          fields={TRANSPORT_FIELDS}
          values={transportValues}
          onChange={updateTransport}
          totalLabel="Udgifter til transport pr. md."
          totalValue={transportExpenses}
          percentageOfIncome={transportShare}
        />

        <BudgetSection
          title="Ovrige faste udgifter"
          fields={FIXED_FIELDS}
          values={fixedValues}
          onChange={updateFixed}
          totalLabel="Ovrige faste udgifter pr. md."
          totalValue={fixedExpenses}
          percentageOfIncome={fixedShare}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 md:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">FormueforudsÃ¦tninger</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            NuvÃ¦rende opsparing (DKK)
            <input
              type="text"
              inputMode="decimal"
              value={startingSavingsInput}
              onChange={(event) => setStartingSavingsInput(formatAmountInput(event.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
              placeholder="fx 10000"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Forventes opspares pr. md. (DKK)
            <input
              type="text"
              inputMode="decimal"
              value={expectedMonthlySavingsInput}
              onChange={(event) => setExpectedMonthlySavingsInput(formatAmountInput(event.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
              placeholder="fx 2800"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            BoligvÃ¦rdi (DKK)
            <input
              type="text"
              inputMode="decimal"
              value={homeValueInput}
              onChange={(event) => setHomeValueInput(formatAmountInput(event.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
              placeholder="fx 2500000"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            RestgÃ¦ld boliglan + arlig rente (%)
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={mortgageDebtInput}
                onChange={(event) => setMortgageDebtInput(formatAmountInput(event.target.value))}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
                placeholder="RestgÃ¦ld"
              />
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={interestRateInput}
                onChange={(event) => setInterestRateInput(event.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
                placeholder="Rente %"
              />
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Arlig vÃ¦rdistigning bolig (%)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={homeGrowthRateInput}
              onChange={(event) => setHomeGrowthRateInput(event.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
              placeholder="fx 7"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {PERIODS.map((period) => {
          const isActive = selectedMonths === period.months;

          return (
            <button
              key={period.months}
              type="button"
              onClick={() => setSelectedMonths(period.months)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-emerald-600 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
              }`}
            >
              {period.label}
            </button>
          );
        })}
      </div>

      {hasWealthContent && points.length > 0 ? (
        <div className="mt-6 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 md:p-6">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-700">
            <p>
              Manedligt radighedsbelob: <span className="font-semibold text-zinc-900">{formatCurrency(monthlyDisposable)}</span>
            </p>
            <p>
              Opsparing pr. md. i graf: <span className="font-semibold text-zinc-900">{formatCurrency(monthlySavings)}</span>
            </p>
            <p>
              Forventet formue efter {formatPeriodLabel(selectedMonths)}:{" "}
              <span className="font-semibold text-zinc-900">{formatCurrency(finalNetWorth)}</span>
            </p>
            <p>
              RestgÃ¦ld efter {formatPeriodLabel(selectedMonths)}:{" "}
              <span className="font-semibold text-zinc-900">{formatCurrency(finalDebt)}</span>
            </p>
            <p>
              BoligvÃ¦rdi efter {formatPeriodLabel(selectedMonths)}:{" "}
              <span className="font-semibold text-zinc-900">{formatCurrency(finalHomeValue)}</span>
            </p>
            <p>
              Opsparing efter {formatPeriodLabel(selectedMonths)}:{" "}
              <span className="font-semibold text-zinc-900">{formatCurrency(finalCash)}</span>
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
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                includePensionInNetWorth
                  ? "border-emerald-700 bg-emerald-600 text-white"
                  : hasCompletePensionInputs
                    ? "border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                    : "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
              }`}
            >
              Inkluder forventet pension
            </button>
          </div>

          <ProjectionChart
            title="Formueudvikling"
            subtitle="Grafen viser forventet formue, boligvÃ¦rdi og restgÃ¦ld over tid med valgte renter og vÃ¦rdistigning."
            months={selectedMonths}
            series={netWorthSeries}
            ariaLabel="Graf over forventet formue, boligvÃ¦rdi og restgÃ¦ld"
          />

          <ProjectionChart
            title="Opsparing over tid"
            subtitle="Udvikling i kontant opsparing baseret pa manedligt radighedsbelob."
            months={selectedMonths}
            series={savingsSeries}
            ariaLabel="Graf over opsparing over tid"
          />
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-sm text-zinc-600">
          Indtast dine tal for at se udvikling i formue.
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 md:p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">Pensionsopsparing</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            NuvÃ¦rende pension (DKK)
            <input
              type="text"
              inputMode="decimal"
              value={pensionCurrentInput}
              onChange={(event) => setPensionCurrentInput(formatAmountInput(event.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
              placeholder="fx 250000"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Manedlig indbetaling (DKK)
            <input
              type="text"
              inputMode="decimal"
              value={pensionMonthlyInput}
              onChange={(event) => setPensionMonthlyInput(formatAmountInput(event.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
              placeholder="fx 3500"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-700">
            Forventet arligt afkast (%)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={pensionReturnInput}
              onChange={(event) => setPensionReturnInput(event.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 outline-none ring-emerald-500 focus:ring"
              placeholder="fx 7"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-700">
          <p>
            NuvÃ¦rende pension: <span className="font-semibold text-zinc-900">{formatCurrency(pensionCurrent)}</span>
          </p>
          <p>
            Forventet pension efter {formatPeriodLabel(pensionSelectedMonths)}:{" "}
            <span className="font-semibold text-zinc-900">{formatCurrency(finalPension)}</span>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {PERIODS.map((period) => {
            const isActive = pensionSelectedMonths === period.months;

            return (
              <button
                key={`pension-${period.months}`}
                type="button"
                onClick={() => setPensionSelectedMonths(period.months)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isActive
                    ? "bg-emerald-600 text-white"
                    : "border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400"
                }`}
              >
                {period.label}
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <ProjectionChart
            title="Pensionsprognose"
            subtitle="Udvikling med renters rente og faste manedlige indbetalinger."
            months={pensionSelectedMonths}
            series={pensionSeries}
            ariaLabel="Graf over pensionsopsparing over tid"
          />
        </div>
      </div>
        </div>

        <aside className="fixed right-4 top-6 z-20 max-h-[calc(100vh-3rem)] w-72 overflow-y-auto">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-900">Okonomisk overblik</h2>

            <div className={`rounded-xl border px-4 py-3 ${disposableToneClass}`}>
              <p className="text-[11px] font-semibold uppercase tracking-wide">Radighedsbelob</p>
              <p className="mt-1 text-3xl font-bold">{formatCurrency(monthlyDisposable)}</p>
              <p className="mt-1 text-xs font-medium">{disposableShare.toFixed(0)}% af nettoindkomst</p>
            </div>

            <div className="space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-sm text-zinc-700">
              <p className="flex items-center justify-between">
                <span>ðŸ’° Samlede indtÃ¦gter</span>
                <span className="font-semibold text-zinc-900">{formatCurrency(monthlyIncome)}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>ðŸ’¸ Samlede udgifter</span>
                <span className="font-semibold text-zinc-900">{formatCurrency(monthlyExpenses)}</span>
              </p>
            </div>

            <div className="rounded-xl border border-zinc-200 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Udgiftsfordeling (top 3)</p>
              <div className="mt-2 space-y-1.5 text-sm text-zinc-700">
                {topExpenseCategories.length > 0 ? (
                  topExpenseCategories.map((entry) => (
                    <p key={entry.label} className="flex items-center justify-between">
                      <span>
                        {entry.icon} {entry.label}
                      </span>
                      <span className="font-semibold text-zinc-900">{entry.share.toFixed(0)}%</span>
                    </p>
                  ))
                ) : (
                  <p className="text-zinc-500">Ingen udgifter endnu.</p>
                )}
              </div>
            </div>

            <div className={`rounded-xl border px-3 py-3 ${housingToneClass}`}>
              <p className="text-xs font-semibold uppercase tracking-wide">Boligprocent</p>
              <p className="mt-1 text-lg font-bold">Bolig = {housingShare.toFixed(0)}% af indkomst</p>
            </div>

            <div className="rounded-xl border border-zinc-200 px-3 py-3 text-sm text-zinc-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Opsparingsrate</p>
              <p className="mt-1 font-semibold text-zinc-900">Du sparer {savingsRate.toFixed(0)}%</p>
              <p className="mt-1">Potentiel opsparing: {formatCurrency(monthlyDisposable)}/md</p>
              {monthsToTarget !== null ? <p className="mt-1">{monthsToTarget} maneder til 250.000 kr</p> : null}
            </div>

            <div className="rounded-xl border border-zinc-200 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Advarsler / insights</p>
              <div className="mt-2 space-y-1.5 text-sm">
                {insightItems.map((entry, index) => (
                  <p key={`${entry.text}-${index}`} className={entry.className}>
                    {entry.icon} {entry.text}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs text-zinc-600">
              <p className="flex items-center justify-between">
                <span>Nettoformue nu</span>
                <span className="font-semibold text-zinc-900">{formatCurrency(startingSavings + homeValue - mortgageDebt)}</span>
              </p>
              <p className="mt-1 flex items-center justify-between">
                <span>Galdsprocent</span>
                <span className="font-semibold text-zinc-900">{monthlyIncome > 0 ? ((mortgageDebt / (monthlyIncome * 12)) * 100).toFixed(0) : "0"}%</span>
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

