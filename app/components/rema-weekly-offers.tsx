"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppTheme } from "./use-app-theme";

type Offer = {
  id: string;
  heading: string;
  description: string;
  price: number | null;
  prePrice: number | null;
  currency: string;
  image: string | null;
  url: string | null;
  categories: string[];
  unitPrice: string | null;
  savingsPercent: number | null;
};

type OffersResponse = {
  generatedAt: string;
  source: string;
  publication: {
    id: string;
    label: string;
    runFrom: string;
    runTill: string;
    weekLabel: string;
    avisUrl: string;
  };
  stats: {
    scannedOffers: number;
    healthyCandidates: number;
  };
  rankedOffers: Offer[];
};

type ShoppingItem = {
  id: string;
  heading: string;
  price: number | null;
  currency: string;
  quantity: number;
};

function formatCurrency(value: number | null, currency: string): string {
  if (value === null) {
    return "Ukendt pris";
  }

  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("da-DK");
}

export function RemaWeeklyOffers() {
  const { isDarkMode } = useAppTheme();
  const [data, setData] = useState<OffersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);

  const loadOffers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rema1000/offers", { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const payload = (await response.json()) as OffersResponse;
      setData(payload);
    } catch {
      setError("Kunne ikke hente REMA1000 tilbud lige nu.");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOffers();
  }, [loadOffers]);

  const listText = useMemo(() => {
    if (shoppingList.length === 0) {
      return "Indkobsliste\n\nIngen varer valgt endnu.";
    }

    const lines = shoppingList.map((item, index) => {
      const price = item.price === null ? "ukendt pris" : formatCurrency(item.price, item.currency);
      return `${index + 1}. ${item.quantity} x ${item.heading} (${price})`;
    });
    return `Indkobsliste\n\n${lines.join("\n")}`;
  }, [shoppingList]);

  const addToShoppingList = useCallback((offer: Offer) => {
    setShoppingList((current) => {
      const index = current.findIndex((item) => item.id === offer.id);
      if (index === -1) {
        return [
          ...current,
          {
            id: offer.id,
            heading: offer.heading,
            price: offer.price,
            currency: offer.currency,
            quantity: 1,
          },
        ];
      }

      const next = [...current];
      next[index] = { ...next[index], quantity: next[index].quantity + 1 };
      return next;
    });
  }, []);

  const removeFromShoppingList = (id: string) => {
    setShoppingList((current) => current.filter((item) => item.id !== id));
  };

  const fillShoppingListAutomatically = () => {
    if (!data) {
      return;
    }

    const nextList = data.rankedOffers.map((offer) => ({
      id: offer.id,
      heading: offer.heading,
      price: offer.price,
      currency: offer.currency,
      quantity: 1,
    }));
    setShoppingList(nextList);
  };

  const copyShoppingList = async () => {
    try {
      await navigator.clipboard.writeText(listText);
    } catch {
      // Ignore clipboard errors.
    }
  };

  const downloadShoppingListPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    const lines = doc.splitTextToSize(listText, 500);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(lines, 40, 60);
    doc.save("indkobsliste.pdf");
  };

  if (isLoading) {
    return (
      <section
        className={`mt-4 rounded-2xl border p-6 text-sm shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${
          isDarkMode ? "border-slate-700/70 bg-slate-900/90 text-slate-200" : "border-cyan-100 bg-white/88 text-slate-700"
        }`}
      >
        Henter ugens REMA1000 tilbud...
      </section>
    );
  }

  if (error || !data) {
    return (
      <section
        className={`mt-4 rounded-2xl border p-6 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${
          isDarkMode ? "border-rose-500/40 bg-slate-900/90" : "border-rose-200 bg-white/92"
        }`}
      >
        <p className={`text-sm font-semibold ${isDarkMode ? "text-rose-300" : "text-rose-700"}`}>{error ?? "Der skete en fejl."}</p>
        <button
          type="button"
          onClick={() => void loadOffers()}
          className={`mt-3 rounded-full px-4 py-2 text-xs font-semibold transition ${
            isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Proev igen
        </button>
      </section>
    );
  }

  return (
    <section className="mt-4 space-y-4">
      <div
        className={`rounded-2xl border p-4 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] ${
          isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/88"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className={`text-xl font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>REMA1000 sunde tilbud</h1>
            <p className={`text-xs ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
              {data.publication.weekLabel} | {formatDate(data.publication.runFrom)} - {formatDate(data.publication.runTill)}
            </p>
            <p className={`mt-1 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
              Scannet: {data.stats.scannedOffers} tilbud, sundhedsmatches: {data.stats.healthyCandidates}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fillShoppingListAutomatically}
              className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Dan automatisk indkobsliste
            </button>
            <a
              href={data.publication.avisUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-cyan-500"
            >
              Aaben ugens avis
            </a>
            <button
              type="button"
              onClick={() => void loadOffers()}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Opdater
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
          {data.rankedOffers.map((offer) => (
            <article
              key={offer.id}
              className={`overflow-hidden rounded-2xl border p-3 shadow-[0_14px_30px_-22px_rgba(2,6,23,0.45)] transition hover:-translate-y-0.5 ${
                isDarkMode ? "border-slate-700/70 bg-slate-900/90" : "border-cyan-100 bg-white/92"
              }`}
            >
              <button type="button" onClick={() => addToShoppingList(offer)} className="w-full text-left">
                {offer.image ? (
                  <img src={offer.image} alt={offer.heading} className="h-36 w-full rounded-xl object-cover lg:h-32 xl:h-28" />
                ) : (
                  <div className={`h-36 w-full rounded-xl lg:h-32 xl:h-28 ${isDarkMode ? "bg-slate-800" : "bg-slate-100"}`} />
                )}
                <p className={`mt-3 line-clamp-2 text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{offer.heading}</p>
                <p className={`mt-1 text-sm font-bold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>{formatCurrency(offer.price, offer.currency)}</p>
                {offer.prePrice !== null ? <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Foer: {formatCurrency(offer.prePrice, offer.currency)}</p> : null}
                {offer.unitPrice ? <p className={`mt-1 text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>{offer.unitPrice}</p> : null}
              </button>
              <button
                type="button"
                onClick={() => addToShoppingList(offer)}
                className="mt-3 w-full rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-500"
              >
                Laeg i indkobsliste
              </button>
            </article>
          ))}
        </div>

        <aside
          className={`h-fit rounded-2xl border p-4 shadow-[0_18px_44px_-26px_rgba(2,6,23,0.45)] lg:sticky lg:top-20 ${
            isDarkMode ? "border-slate-700/70 bg-slate-900/95" : "border-cyan-100 bg-white/95"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <h2 className={`text-sm font-bold uppercase tracking-wide ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>Indkobsliste</h2>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                isDarkMode ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700"
              }`}
            >
              {shoppingList.length} varer
            </span>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={copyShoppingList}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Kopier liste
            </button>
            <button
              type="button"
              onClick={() => void downloadShoppingListPdf()}
              className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
            >
              Download PDF
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {shoppingList.length > 0 ? (
              shoppingList.map((item) => (
                <div key={item.id} className={`flex items-start justify-between gap-2 rounded-xl px-3 py-2 ${isDarkMode ? "bg-slate-800/90" : "bg-slate-50"}`}>
                  <div className="min-w-0">
                    <p className={`line-clamp-2 text-xs font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>
                      {item.quantity} x {item.heading}
                    </p>
                    <p className={`text-[11px] ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>{item.price === null ? "Ukendt pris" : formatCurrency(item.price, item.currency)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromShoppingList(item.id)}
                    className="rounded-full bg-rose-100 px-2 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-200"
                  >
                    Fjern
                  </button>
                </div>
              ))
            ) : (
              <p className={`text-xs ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Klik paa en vare for at laegge den i indkobslisten.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
