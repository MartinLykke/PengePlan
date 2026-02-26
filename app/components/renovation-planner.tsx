"use client";

import { FormEvent, useMemo, useState } from "react";
import { useAppTheme } from "./use-app-theme";

type StoreName = "Bauhaus" | "Silvan" | "XL-Byg" | "Harald Nyborg" | "jem & fix" | "Davidsen";

type ProductCandidate = {
  id: string;
  title: string;
  store: StoreName;
  price: number;
  unit: string;
  category: string;
  keywords: string[];
};

type ShoppingRow = {
  id: string;
  query: string;
  quantity: number;
  options: ProductCandidate[];
  selectedIndex: number;
};

const PRODUCT_CATALOG: ProductCandidate[] = [
  { id: "paint-a", title: "Vag- og loftmaling 10L (hvid)", store: "Harald Nyborg", price: 299, unit: "10L", category: "maling", keywords: ["maling", "vag", "loft", "hvid"] },
  { id: "paint-b", title: "Vag- og loftmaling 10L (mat)", store: "jem & fix", price: 329, unit: "10L", category: "maling", keywords: ["maling", "vag", "loft", "mat"] },
  { id: "paint-c", title: "Vag- og loftmaling premium 10L", store: "Bauhaus", price: 399, unit: "10L", category: "maling", keywords: ["maling", "vag", "loft", "premium"] },

  { id: "floor-a", title: "Klikgulv eg natur", store: "XL-Byg", price: 179, unit: "pr. m2", category: "gulv", keywords: ["gulv", "klikgulv", "laminat", "eg"] },
  { id: "floor-b", title: "Laminatgulv classic eg", store: "Silvan", price: 169, unit: "pr. m2", category: "gulv", keywords: ["gulv", "laminat", "klikgulv", "eg"] },
  { id: "floor-c", title: "Laminatgulv lys eg", store: "Davidsen", price: 159, unit: "pr. m2", category: "gulv", keywords: ["gulv", "laminat", "klikgulv", "eg"] },

  { id: "tiles-a", title: "Fliser 30x60 grå", store: "Bauhaus", price: 249, unit: "pr. m2", category: "fliser", keywords: ["fliser", "klinker", "badevarelse", "gra"] },
  { id: "tiles-b", title: "Gulvfliser 30x60 betonlook", store: "jem & fix", price: 199, unit: "pr. m2", category: "fliser", keywords: ["fliser", "klinker", "gulvfliser", "beton"] },
  { id: "tiles-c", title: "Keramiske fliser 30x60", store: "Silvan", price: 219, unit: "pr. m2", category: "fliser", keywords: ["fliser", "klinker", "keramisk"] },

  { id: "insulation-a", title: "Isolering 95mm", store: "XL-Byg", price: 55, unit: "pr. m2", category: "isolering", keywords: ["isolering", "uld", "rockwool"] },
  { id: "insulation-b", title: "Isolering 95mm standard", store: "Davidsen", price: 49, unit: "pr. m2", category: "isolering", keywords: ["isolering", "uld", "glasuld"] },
  { id: "insulation-c", title: "Isoleringsbatts 95mm", store: "Bauhaus", price: 59, unit: "pr. m2", category: "isolering", keywords: ["isolering", "batts"] },

  { id: "plaster-a", title: "Gipsplader 13mm", store: "Harald Nyborg", price: 59, unit: "pr. plade", category: "gips", keywords: ["gips", "gipsplade", "vaeg"] },
  { id: "plaster-b", title: "Standard gipsplade 13mm", store: "Silvan", price: 64, unit: "pr. plade", category: "gips", keywords: ["gips", "gipsplade"] },
  { id: "plaster-c", title: "Gipsplade robust 13mm", store: "Bauhaus", price: 72, unit: "pr. plade", category: "gips", keywords: ["gips", "gipsplade", "robust"] },

  { id: "cover-a", title: "Afdækningspap 1 x 25 m", store: "Harald Nyborg", price: 89, unit: "pr. rulle", category: "afdaekning", keywords: ["afdækningspap", "afdaekningspap", "afdaekning", "pap", "gulvpap"] },
  { id: "cover-b", title: "Afdækningspap kraftig 25 m", store: "jem & fix", price: 99, unit: "pr. rulle", category: "afdaekning", keywords: ["afdækningspap", "afdaekningspap", "afdaekning", "pap", "gulvpap"] },
  { id: "cover-c", title: "Gulvdækpap 1 x 25 m", store: "Bauhaus", price: 109, unit: "pr. rulle", category: "afdaekning", keywords: ["gulvdaekpap", "afdækningspap", "afdaekningspap", "daekpap", "pap"] },
];

function formatDkk(value: number): string {
  return new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(value);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "oe")
    .replace(/å/g, "aa")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreCandidate(query: string, candidate: ProductCandidate): number {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return 0;
  }

  const words = normalizedQuery.split(" ").filter(Boolean);
  const keywordHits = words.filter((word) => candidate.keywords.some((key) => normalize(key).includes(word))).length;
  const titleHit = normalize(candidate.title).includes(normalizedQuery) ? 2 : 0;
  const categoryHit = words.some((word) => candidate.category.includes(word)) ? 1 : 0;
  return keywordHits + titleHit + categoryHit;
}

function findBestOptions(query: string): ProductCandidate[] {
  const ranked = PRODUCT_CATALOG.map((candidate) => ({
    candidate,
    score: scoreCandidate(query, candidate),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (a.candidate.price !== b.candidate.price) {
        return a.candidate.price - b.candidate.price;
      }
      return b.score - a.score;
    })
    .map((entry) => entry.candidate);

  return ranked;
}

export function RenovationPlanner() {
  const { isDarkMode } = useAppTheme();
  const [query, setQuery] = useState("");
  const [quantityInput, setQuantityInput] = useState("1");
  const [rows, setRows] = useState<ShoppingRow[]>([]);

  const total = useMemo(
    () =>
      rows.reduce((sum, row) => {
        const selected = row.options[row.selectedIndex];
        return selected ? sum + selected.price * row.quantity : sum;
      }, 0),
    [rows],
  );

  const addProduct = (event: FormEvent) => {
    event.preventDefault();

    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const quantity = Math.max(1, Number.parseInt(quantityInput, 10) || 1);
    const options = findBestOptions(trimmed);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setRows((current) => [...current, { id, query: trimmed, quantity, options, selectedIndex: 0 }]);
    setQuery("");
    setQuantityInput("1");
  };

  const chooseNextAlternative = (id: string) => {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) {
          return row;
        }
        if (row.selectedIndex >= row.options.length - 1) {
          return row;
        }
        return { ...row, selectedIndex: row.selectedIndex + 1 };
      }),
    );
  };

  const removeRow = (id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  };

  return (
    <section className="mt-4 space-y-4">
      <div
        className={`rounded-2xl border p-4 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${
          isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"
        }`}
      >
        <h1 className={`text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Renovering</h1>
        <p className={`mt-1 text-sm ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
          Lav en indkobsliste til renoveringen. Vi foreslar billigste match og giver naestbedste alternativ pa knap.
        </p>

        <form onSubmit={addProduct} className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_120px_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Fx maling 10L, gipsplader, klikgulv"
            className={`rounded-lg border px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring ${
              isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-400" : "border-sky-200 bg-white text-slate-900"
            }`}
            aria-label="Produkt du vil koebe"
          />
          <input
            value={quantityInput}
            onChange={(event) => setQuantityInput(event.target.value)}
            inputMode="numeric"
            className={`rounded-lg border px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring ${
              isDarkMode ? "border-slate-700 bg-slate-950 text-slate-100" : "border-sky-200 bg-white text-slate-900"
            }`}
            aria-label="Antal"
          />
          <button type="submit" className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
            Tilfoej
          </button>
        </form>
      </div>

      <div
        className={`rounded-2xl border p-4 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${
          isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Indkobsliste</h2>
          <p className={`text-sm font-semibold ${isDarkMode ? "text-slate-200" : "text-slate-700"}`}>Total: {formatDkk(total)}</p>
        </div>

        <div className="mt-3 space-y-2">
          {rows.length === 0 ? (
            <p className={`text-sm ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Ingen varer endnu.</p>
          ) : (
            rows.map((row) => {
              const selected = row.options[row.selectedIndex];
              const hasAlternative = row.selectedIndex < row.options.length - 1;

              return (
                <article key={row.id} className={`rounded-xl border p-3 ${isDarkMode ? "border-slate-700 bg-slate-950/60" : "border-sky-100 bg-slate-50/80"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                        {row.quantity} x {row.query}
                      </p>
                      {selected ? (
                        <p className={`mt-1 text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
                          Billigste fund: {selected.title} hos {selected.store} for {formatDkk(selected.price)} ({selected.unit})
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-rose-600">Ingen match fundet endnu for dette produktnavn.</p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => chooseNextAlternative(row.id)}
                        disabled={!hasAlternative}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          hasAlternative
                            ? "bg-amber-500 text-white hover:bg-amber-400"
                            : isDarkMode
                              ? "cursor-not-allowed bg-slate-800 text-slate-500"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                        }`}
                      >
                        Naestbedste alternativ
                      </button>
                      <button type="button" onClick={() => removeRow(row.id)} className="rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500">
                        Fjern
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
