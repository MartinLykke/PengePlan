"use client";

import { useEffect, useMemo, useState } from "react";

const INTRO_SEEN_STORAGE_KEY = "myfinance.mascotTourSeen";
const GUIDE_HIDDEN_STORAGE_KEY = "myfinance.mascotGuideHidden";
const AUTO_ADVANCE_MS = 2200;

export type MascotTourStep = {
  targetId: string;
  text: string;
  title: string;
};

type SiteMascotProps = {
  steps: MascotTourStep[];
};

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

function MascotIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mascot-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#mascot-bg)" />
      <circle cx="32" cy="24" r="10" fill="#f8fafc" />
      <path d="M16 52c2-10 9-14 16-14s14 4 16 14" fill="#f8fafc" />
      <circle cx="28.5" cy="23" r="1.5" fill="#0f172a" />
      <circle cx="35.5" cy="23" r="1.5" fill="#0f172a" />
      <path d="M28 28c1.2 1.2 2.6 1.8 4 1.8s2.8-.6 4-1.8" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GuideIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 3 19.5 7.2v9.6L12 21l-7.5-4.2V7.2L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m9.5 12 1.7 1.7L14.7 10.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function SiteMascot({ steps }: SiteMascotProps) {
  const [isGuideHidden, setIsGuideHidden] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const activeStep = steps[stepIndex] ?? null;

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const isHidden = window.localStorage.getItem(GUIDE_HIDDEN_STORAGE_KEY) === "true";
        if (isHidden) {
          setIsGuideHidden(true);
          return;
        }

        const hasSeenTour = window.localStorage.getItem(INTRO_SEEN_STORAGE_KEY) === "true";
        if (!hasSeenTour) {
          setIsTourOpen(true);
        }
      } catch {
        setIsTourOpen(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isTourOpen || !activeStep) {
      return;
    }

    const updateRect = () => {
      const target = document.getElementById(activeStep.targetId);
      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [activeStep, isTourOpen]);

  useEffect(() => {
    if (!isTourOpen || steps.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (stepIndex < steps.length - 1) {
        setStepIndex((current) => current + 1);
        return;
      }

      setIsTourOpen(false);
      setTargetRect(null);
      try {
        window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, "true");
      } catch {
        // Ignore storage errors.
      }
    }, AUTO_ADVANCE_MS);

    return () => window.clearTimeout(timer);
  }, [isTourOpen, stepIndex, steps.length]);

  useEffect(() => {
    if (!isTourOpen || !activeStep) {
      return;
    }

    const target = document.getElementById(activeStep.targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }
  }, [activeStep, isTourOpen]);

  const openTour = () => {
    if (isGuideHidden) {
      return;
    }

    setStepIndex(0);
    setTargetRect(null);
    setIsTourOpen(true);
  };

  const dismissGuide = () => {
    setIsGuideHidden(true);
    setIsTourOpen(false);
    setTargetRect(null);
    try {
      window.localStorage.setItem(GUIDE_HIDDEN_STORAGE_KEY, "true");
      window.localStorage.setItem(INTRO_SEEN_STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors.
    }
  };

  const bubblePosition = useMemo(() => {
    if (!targetRect) {
      return { top: 88, left: 24 };
    }

    const viewportWidth = window.innerWidth;
    const bubbleWidth = 320;
    const rightCandidate = targetRect.left + targetRect.width + 16;
    const leftCandidate = targetRect.left - bubbleWidth - 16;
    const useRight = rightCandidate + bubbleWidth < viewportWidth - 16 || leftCandidate < 16;
    const left = clamp(useRight ? rightCandidate : leftCandidate, 12, viewportWidth - bubbleWidth - 12);
    const top = clamp(targetRect.top + targetRect.height / 2 - 120, 12, window.innerHeight - 240);
    return { top, left };
  }, [targetRect]);

  if (isGuideHidden) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={openTour}
        className="fixed right-4 bottom-4 z-40 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/95 py-2 pr-2 pl-3 text-sm font-semibold text-slate-900 shadow-[0_18px_40px_-22px_rgba(2,6,23,0.5)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
        aria-label="Aabn guide"
        title="Guide"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full">
          <GuideIcon className="h-5 w-5 text-cyan-700" />
        </span>
        Guide
        <span
          role="button"
          tabIndex={0}
          onClick={(event) => {
            event.stopPropagation();
            dismissGuide();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              event.stopPropagation();
              dismissGuide();
            }
          }}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
          aria-label="Fjern guide"
          title="Fjern guide"
        >
          X
        </span>
      </button>

      {isTourOpen ? (
        <div className="pointer-events-none fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/28" />

          {targetRect ? (
            <div
              className="absolute rounded-2xl border-2 border-cyan-400 bg-cyan-100/20 shadow-[0_0_0_6px_rgba(34,211,238,0.18)] transition-all"
              style={{
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
              }}
            />
          ) : null}

          <div
            className="pointer-events-auto absolute w-[320px] rounded-2xl border border-cyan-100 bg-white p-4 text-slate-900 shadow-[0_24px_60px_-26px_rgba(2,6,23,0.58)]"
            style={{ top: bubblePosition.top, left: bubblePosition.left }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mascot-tour-title"
          >
            <button
              type="button"
              onClick={dismissGuide}
              className="absolute top-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
              aria-label="Fjern guide"
              title="Fjern guide"
            >
              X
            </button>

            <div className="flex items-start gap-3">
              <div className="inline-flex h-12 w-12 shrink-0 animate-bounce items-center justify-center overflow-hidden rounded-full [animation-duration:0.9s]">
                <MascotIcon className="h-12 w-12" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                  Trin {stepIndex + 1} af {steps.length}
                </p>
                <h2 id="mascot-tour-title" className="text-base font-bold">
                  {activeStep?.title ?? "Guide"}
                </h2>
                <p className="mt-1 text-sm text-slate-700">{activeStep?.text ?? ""}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

