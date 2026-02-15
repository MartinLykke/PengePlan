"use client";

type SidebarControlsProps = {
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
  darkMode?: boolean;
};

export function SidebarControls({ isSidebarVisible, onToggleSidebar, darkMode = false }: SidebarControlsProps) {
  return (
    <div className="fixed right-4 top-4 z-30">
      <button
        type="button"
        onClick={onToggleSidebar}
        className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-full shadow-sm transition ${
          darkMode
            ? "bg-slate-900/90 text-slate-100 hover:bg-slate-800"
            : "bg-white/90 text-slate-700 hover:bg-sky-50"
        }`}
        aria-label={isSidebarVisible ? "Skjul sidebar" : "Vis sidebar"}
        title={isSidebarVisible ? "Skjul sidebar" : "Vis sidebar"}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          {isSidebarVisible ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6l6 6-6 6" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 6l-6 6 6 6" />
          )}
        </svg>
        <span className="pointer-events-none absolute -bottom-8 right-0 rounded bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition group-hover:opacity-100">
          {isSidebarVisible ? "Skjul sidebar" : "Vis sidebar"}
        </span>
      </button>
    </div>
  );
}
