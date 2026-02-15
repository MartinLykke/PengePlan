"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppTheme } from "./use-app-theme";

type NavItem = {
  href: string;
  label: string;
  icon: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Budget", icon: "M3 6h18M3 12h18M3 18h18" },
  { href: "/overblik", label: "Overblik", icon: "M4 16l5-5 4 4 7-8" },
  { href: "/historik", label: "Historik", icon: "M12 8v5l3 3M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z" },
  { href: "/tilbud", label: "Tilbud", icon: "M3 6h18M6 12h12M9 18h6" },
  { href: "/maal", label: "Maal", icon: "M12 3v18M3 12h18" },
  { href: "/rapporter", label: "Rapporter", icon: "M6 3h9l3 3v15H6z M15 3v3h3" },
];

export function TopNavbar() {
  const pathname = usePathname();
  const { isDarkMode, toggleDarkMode } = useAppTheme();

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur ${isDarkMode ? "border-slate-700/70 bg-slate-950/88" : "border-cyan-100/70 bg-white/88"}`}>
      <nav className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-3 py-2.5 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white text-sm font-bold">
            MF
          </span>
          <p className={`text-sm font-semibold ${isDarkMode ? "text-slate-100" : "text-slate-900"}`}>MyFinance</p>
        </Link>

        <div className="flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-cyan-600 text-white"
                    : isDarkMode
                      ? "bg-slate-800 text-slate-200 hover:bg-slate-700"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={toggleDarkMode}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            aria-label={isDarkMode ? "Skift til light mode" : "Skift til dark mode"}
            title={isDarkMode ? "Skift til light mode" : "Skift til dark mode"}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              {isDarkMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m9-9h-2M5 12H3m14.95 6.95-1.41-1.41M7.46 7.46 6.05 6.05m11.9 0-1.41 1.41M7.46 16.54l-1.41 1.41M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
              )}
            </svg>
            {isDarkMode ? "Light" : "Dark"}
          </button>
        </div>
      </nav>
    </header>
  );
}
