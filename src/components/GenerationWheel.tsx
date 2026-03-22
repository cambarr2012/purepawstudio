"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PawSpinner } from "./PawSpinner";

export type GenStep =
  | "remove_bg"
  | "generate_art"
  | "polish"
  | "prepare_preview"
  | "finalise";

// Fun facts + dry humour only
const FUN_TIPS: string[] = [
  "No pets were bribed with treats during this process. Probably.",
  "Still faster than teaching a dog to sit.",
  "If your cat is watching this happen, they’re unimpressed.",
  "Your pet did not approve this. They will tolerate it.",
  "Somewhere, a dog is extremely proud right now.",
  "Cats believe this was their idea.",
  "This is taking longer because your pet is iconic.",
  "We asked your pet to sit still. They ignored us.",
  "Dogs can see blues and yellows best — reds appear muted to them.",
  "A dog’s nose print is unique, like a human fingerprint.",
  "Cats sleep for around 70% of their lives.",
  "Dogs dream — their paws often twitch when they do.",
  "Cats have more bones than humans (230 vs 206).",
  "Dogs can hear sounds up to four times farther away than humans.",
  "Cats can rotate their ears up to 180 degrees.",
  "Cats can’t taste sweetness.",
  "Cats can jump up to six times their body length.",
  "Dogs’ sense of smell is tens of thousands of times stronger than ours.",
];

function clamp(n: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, n));
}

/**
 * Domino’s-like feel:
 * - move quickly early
 * - slow down near the end
 */
function easeOutExpo(x: number) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function formatStyleLabel(styleLabel?: string) {
  if (!styleLabel) return styleLabel;
  if (styleLabel.toLowerCase() === "disney") return "Cartoon";
  return styleLabel;
}

export function GenerationWheel({
  step,
  styleLabel,
  /**
   * pass a changing value (e.g. Date.now()) at the start of each generation
   * so the wheel resets properly every time.
   */
  runId,
}: {
  step: GenStep;
  styleLabel?: string;
  runId?: string | number;
}) {
  /**
   * Make it FEEL like a real pipeline:
   * - remove_bg is usually quick
   * - generate_art is the long part
   * - polish/finalise/preview are short but should visibly move the ring
   *
   * This is "perceived time" (UX), not exact measurement.
   */
  const EXPECTED_TOTAL_MS = 38_000; // tweak if you want: 32–45s feels good
  const HOVER_CAP = 0.97;

  /**
   * Step floors (minimum ring fill per step).
   * This prevents the ring looking stuck when steps advance.
   */
  const STEP_FLOOR: Record<GenStep, number> = useMemo(
    () => ({
      remove_bg: 0.14,
      generate_art: 0.28,
      polish: 0.72,
      finalise: 0.86,
      prepare_preview: 0.93,
    }),
    []
  );

  const [progress, setProgress] = useState<number>(STEP_FLOOR.remove_bg);

  // tips
  const [tipIndex, setTipIndex] = useState(
    Math.floor(Math.random() * FUN_TIPS.length)
  );

  // timing refs
  const startRef = useRef<number>(0);
  const prevRunIdRef = useRef<string | number | undefined>(undefined);
  const prevStepRef = useRef<GenStep | null>(null);
  const rafRef = useRef<number>(0);

  const displayStyleLabel = formatStyleLabel(styleLabel);

  const resetRun = () => {
    startRef.current = performance.now();
    setProgress(STEP_FLOOR.remove_bg);
    setTipIndex(Math.floor(Math.random() * FUN_TIPS.length));
  };

  // Reset on runId change (primary)
  useEffect(() => {
    const runChanged = runId !== undefined && prevRunIdRef.current !== runId;

    if (runChanged) {
      prevRunIdRef.current = runId;
      resetRun();
    }
  }, [runId]);

  // When step changes, jump progress forward to that step's floor
  useEffect(() => {
    if (prevStepRef.current !== step) {
      prevStepRef.current = step;
      const floor = STEP_FLOOR[step] ?? 0.12;
      setProgress((p) => (p < floor ? floor : p));
    }
  }, [step, STEP_FLOOR]);

  // Domino’s style progress loop (fast early, slows into hover cap)
  useEffect(() => {
    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const raw = clamp(elapsed / EXPECTED_TOTAL_MS, 0, 1);
      const eased = easeOutExpo(raw);

      const floor = STEP_FLOOR[step] ?? 0.12;

      // Fill from floor → hover cap (never reaches 100% here)
      const next = clamp(floor + eased * (HOVER_CAP - floor), floor, HOVER_CAP);

      setProgress((cur) => (next > cur ? next : cur));

      rafRef.current = requestAnimationFrame(tick);
    };

    // ensure startRef is initialised for first mount too
    if (startRef.current === 0) startRef.current = performance.now();

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [step, STEP_FLOOR]);

  // rotate tips
  useEffect(() => {
    const TIP_MS = 3800;
    const t = setInterval(() => {
      setTipIndex((i) => (i + 1) % FUN_TIPS.length);
    }, TIP_MS);
    return () => clearInterval(t);
  }, []);

  // ring SVG math
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * progress;

  return (
    <div className="w-full flex flex-col items-center justify-center gap-4 py-6">
      <div className="relative w-36 h-36">
        {/* Glow */}
        <div className="absolute inset-0 rounded-full bg-amber-200/30 blur-2xl" />

        {/* Ring */}
        <svg viewBox="0 0 120 120" className="relative w-full h-full">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            className="text-slate-200"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            className="text-amber-500 transition-[stroke-dasharray] duration-300"
            strokeDasharray={`${dash} ${Math.max(0, circumference - dash)}`}
            transform="rotate(-90 60 60)"
          />
        </svg>

        {/* Centre spinner */}
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid place-items-center w-16 h-16 rounded-2xl bg-white/85 border border-slate-200 shadow-sm backdrop-blur">
            <PawSpinner size={44} className="drop-shadow-sm" />
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="text-center px-6 max-w-sm">
        <div className="text-sm font-semibold text-slate-900">
          Creating your design
          {displayStyleLabel ? (
            <span className="text-amber-600"> · {displayStyleLabel}</span>
          ) : null}
        </div>

        <div className="mt-3 text-[11px] text-slate-700 transition-all duration-300">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1">
            <span className="text-amber-700">●</span>
            <span>{FUN_TIPS[tipIndex]}</span>
          </span>
        </div>
      </div>
    </div>
  );
}