import { NextResponse } from "next/server";

const REMA_API_KEY = "00hok01y9tkb38say9mm4r452iigb061";
const REMA_API_BASE_URL = "https://squid-api.tjek.com";
const REMA_DEALER_ID = "11deC";
const OFFERS_PAGE_SIZE = 100;

type Catalog = {
  id: string;
  label: string;
  run_from: string;
  run_till: string;
  offer_count: number;
};

type Offer = {
  id: string;
  heading: string;
  description?: string;
  catalog_id: string;
  catalog_url?: string;
  pricing?: {
    price?: number;
    pre_price?: number | null;
    currency?: string;
  };
  images?: {
    thumb?: string;
    view?: string;
  };
};

type RankedOffer = {
  id: string;
  heading: string;
  description: string;
  score: number;
  price: number | null;
  prePrice: number | null;
  currency: string;
  image: string | null;
  url: string | null;
  categories: string[];
  unitPrice: string | null;
  savingsPercent: number | null;
};

type ScoredOffer = {
  offer: RankedOffer;
  score: number;
  hasHealthyMatch: boolean;
};

const HEALTH_GROUPS: Array<{ label: string; weight: number; terms: string[] }> = [
  {
    label: "Oko gront",
    weight: 34,
    terms: ["okolog", "grontsag", "gulerod", "broccoli", "spinat", "tomat", "kaal", "agurk", "salat", "peberfrugt"],
  },
  {
    label: "Frugt",
    weight: 22,
    terms: ["frugt", "aeble", "banan", "appel", "paere", "citron", "baer", "druer"],
  },
  {
    label: "Fuldkorn",
    weight: 26,
    terms: ["fuldkorn", "rugbrod", "grovbrod", "havregryn", "kernebrod"],
  },
  {
    label: "Fisk",
    weight: 28,
    terms: ["fisk", "laks", "torsk", "makrel", "tun", "sild", "rejer"],
  },
  {
    label: "Kylling",
    weight: 24,
    terms: ["kylling", "kalkun", "fjerkrae"],
  },
  {
    label: "Mejeri protein",
    weight: 20,
    terms: ["skyr", "hytteost", "ost", "yoghurt", "protein", "mozzarella"],
  },
  {
    label: "Baelgfrugt",
    weight: 20,
    terms: ["linser", "kikert", "boenne", "boenner"],
  },
];

const LESS_HEALTHY_TERMS = ["slik", "chips", "sodavand", "kage", "dessert", "chokolade", "energidrik", "is"];

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replaceAll("æ", "ae")
    .replaceAll("ø", "oe")
    .replaceAll("å", "aa")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getIsoWeek(inputDate: Date) {
  const date = new Date(Date.UTC(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate()));
  const dayNumber = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return { weekNumber, year: date.getUTCFullYear() };
}

function parseUnitPrice(description: string): string | null {
  const match = description.match(/([0-9]+(?:[.,][0-9]+)?)\s*pr\.\s*(kg|liter|l)/i);
  if (!match) {
    return null;
  }

  const rawValue = match[1].replace(",", ".");
  const unit = match[2].toLowerCase();
  const unitText = unit === "l" ? "liter" : unit;
  return `${rawValue} DKK pr. ${unitText}`;
}

function scoreOffer(offer: Offer): ScoredOffer {
  const heading = offer.heading ?? "";
  const description = offer.description ?? "";
  const sourceText = `${heading} ${description}`;
  const text = normalizeText(sourceText);

  const categories: string[] = [];
  let score = 0;

  for (const group of HEALTH_GROUPS) {
    const matchCount = group.terms.reduce((count, term) => (text.includes(term) ? count + 1 : count), 0);
    if (matchCount > 0) {
      categories.push(group.label);
      score += group.weight + Math.min(6, (matchCount - 1) * 2);
    }
  }

  for (const term of LESS_HEALTHY_TERMS) {
    if (text.includes(term)) {
      score -= 18;
    }
  }

  const price = typeof offer.pricing?.price === "number" ? offer.pricing.price : null;
  const prePrice = typeof offer.pricing?.pre_price === "number" ? offer.pricing.pre_price : null;
  const unitPrice = parseUnitPrice(description);

  if (price !== null) {
    if (price <= 15) {
      score += 12;
    } else if (price <= 25) {
      score += 7;
    } else if (price <= 40) {
      score += 3;
    }
  }

  let savingsPercent: number | null = null;
  if (price !== null && prePrice !== null && prePrice > price) {
    savingsPercent = Math.round(((prePrice - price) / prePrice) * 100);
    score += Math.min(20, Math.round(savingsPercent * 0.5));
  }

  const rankedOffer: RankedOffer = {
    id: offer.id,
    heading,
    description,
    score,
    price,
    prePrice,
    currency: offer.pricing?.currency ?? "DKK",
    image: offer.images?.view ?? offer.images?.thumb ?? null,
    url: offer.catalog_url ?? null,
    categories,
    unitPrice,
    savingsPercent,
  };

  return {
    offer: rankedOffer,
    score,
    hasHealthyMatch: categories.length > 0,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "X-Api-Key": REMA_API_KEY,
    },
    next: { revalidate: 60 * 60 * 2 },
  });

  if (!response.ok) {
    throw new Error(`REMA request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchCurrentCatalog(): Promise<Catalog> {
  const catalogs = await fetchJson<Catalog[]>(
    `${REMA_API_BASE_URL}/v2/catalogs?dealer_id=${REMA_DEALER_ID}&order_by=-publication_date&offset=0&limit=24&types=paged`,
  );

  if (!Array.isArray(catalogs) || catalogs.length === 0) {
    throw new Error("No catalogs found for REMA1000");
  }

  const now = Date.now();
  const activeCatalog = catalogs.find((catalog) => {
    const start = Date.parse(catalog.run_from);
    const end = Date.parse(catalog.run_till);
    return Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end;
  });

  return activeCatalog ?? catalogs[0];
}

async function fetchCatalogOffers(catalogId: string, expectedCount: number): Promise<Offer[]> {
  const offers: Offer[] = [];
  let offset = 0;

  while (offset < expectedCount + OFFERS_PAGE_SIZE) {
    const page = await fetchJson<Offer[]>(
      `${REMA_API_BASE_URL}/v2/offers?catalog_id=${catalogId}&offset=${offset}&limit=${OFFERS_PAGE_SIZE}`,
    );

    if (!Array.isArray(page) || page.length === 0) {
      break;
    }

    offers.push(...page);
    if (page.length < OFFERS_PAGE_SIZE) {
      break;
    }

    offset += OFFERS_PAGE_SIZE;
  }

  return offers;
}

export async function GET() {
  try {
    const catalog = await fetchCurrentCatalog();
    const offers = await fetchCatalogOffers(catalog.id, catalog.offer_count);

    const scored = offers.map(scoreOffer);
    const healthyFirst = scored.filter((entry) => entry.hasHealthyMatch);
    const candidates = healthyFirst.length > 0 ? healthyFirst : scored;

    const ranked = candidates
      .sort((left, right) => right.score - left.score)
      .slice(0, 36)
      .map((entry, index) => ({
        ...entry.offer,
        rank: index + 1,
      }));

    const { weekNumber, year } = getIsoWeek(new Date(catalog.run_from));

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      source: "REMA1000",
      publication: {
        id: catalog.id,
        label: catalog.label,
        runFrom: catalog.run_from,
        runTill: catalog.run_till,
        weekLabel: `Uge ${weekNumber} (${year})`,
        avisUrl: `https://rema1000.dk/avis/${catalog.id}`,
      },
      stats: {
        scannedOffers: offers.length,
        healthyCandidates: healthyFirst.length,
      },
      rankedOffers: ranked,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Kunne ikke hente tilbud", details: message }, { status: 500 });
  }
}

