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

type StepConfig = {
  start: number;
  end: number;
  expectedMs: number;
  cap: number;
};

const STEP_CONFIG: Record<GenStep, StepConfig> = {
  remove_bg: {
    start: 0.04,
    end: 0.22,
    expectedMs: 1800,
    cap: 0.9,
  },
  generate_art: {
    start: 0.22,
    end: 0.78,
    expectedMs: 19000,
    cap: 0.9,
  },
  polish: {
    start: 0.78,
    end: 0.86,
    expectedMs: 2600,
    cap: 0.92,
  },
  prepare_preview: {
    start: 0.86,
    end: 0.94,
    expectedMs: 1800,
    cap: 0.94,
  },
  finalise: {
    start: 0.94,
    end: 0.985,
    expectedMs: 1400,
    cap: 0.96,
  },
};

function clamp(n: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, n));
}

function easeOutExpo(x: number) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function formatStyleLabel(styleLabel?: string) {
  if (!styleLabel) return styleLabel;
  if (styleLabel.toLowerCase() === "disney") return "Cartoon";
  return styleLabel;
}

function getDisplayStep(step: GenStep) {
  if (step === "remove_bg") {
    return {
      stepNumber: 1,
      totalSteps: 3,
      label: "Preparing your pet",
    };
  }

  if (step === "generate_art") {
    return {
      stepNumber: 2,
      totalSteps: 3,
      label: "Creating your design",
    };
  }

  return {
    stepNumber: 3,
    totalSteps: 3,
    label: "Finalising your preview",
  };
}

export function GenerationWheel({
  step,
  styleLabel,
  runId,
  isDone = false,
}: {
  step: GenStep;
  styleLabel?: string;
  runId?: string | number;
  isDone?: boolean;
}) {
  const displayStyleLabel = formatStyleLabel(styleLabel);

  const [progress, setProgress] = useState<number>(STEP_CONFIG.remove_bg.start);
  const [tipIndex, setTipIndex] = useState(
    Math.floor(Math.random() * FUN_TIPS.length)
  );
  const [isComplete, setIsComplete] = useState(false);

  const prevRunIdRef = useRef<string | number | undefined>(undefined);
  const prevStepRef = useRef<GenStep | null>(null);
  const stepStartedAtRef = useRef<number>(performance.now());
  const rafRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const completionSoundPlayedRef = useRef(false);

  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  const currentStepConfig = useMemo(() => STEP_CONFIG[step], [step]);
  const displayStep = getDisplayStep(step);
  const currentStatus = displayStep.label;

  const resetRun = () => {
    cancelAnimationFrame(rafRef.current);
    stepStartedAtRef.current = performance.now();
    prevStepRef.current = step;
    setProgress(STEP_CONFIG.remove_bg.start);
    setTipIndex(Math.floor(Math.random() * FUN_TIPS.length));
    setIsComplete(false);
    completionSoundPlayedRef.current = false;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const playCompleteSound = async () => {
    if (completionSoundPlayedRef.current) return;
    completionSoundPlayedRef.current = true;

    try {
      if (!audioRef.current) {
        audioRef.current = new Audio("/ping.mp3");
        audioRef.current.preload = "auto";
        audioRef.current.volume = 0.35;
      }

      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (err) {
      console.warn("[GenerationWheel] Completion sound blocked or failed:", err);
    }
  };

  useEffect(() => {
    const runChanged = runId !== undefined && prevRunIdRef.current !== runId;

    if (runChanged) {
      prevRunIdRef.current = runId;
      resetRun();
    }
  }, [runId, step]);

  useEffect(() => {
    const audio = new Audio("/ping.mp3");
    audio.preload = "auto";
    audio.volume = 0.35;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const prevStep = prevStepRef.current;

    if (prevStep !== step) {
      const prevConfig = prevStep ? STEP_CONFIG[prevStep] : null;
      const nextConfig = STEP_CONFIG[step];

      stepStartedAtRef.current = performance.now();

      setProgress((current) => {
        const snappedTo =
          prevConfig && current < prevConfig.end ? prevConfig.end : current;
        return Math.max(snappedTo, nextConfig.start);
      });

      prevStepRef.current = step;

      if (step === "finalise") {
        setIsComplete(false);
      }
    }
  }, [step]);

  useEffect(() => {
    if (!isDone) return;

    cancelAnimationFrame(rafRef.current);
    setProgress(1);
    setIsComplete(true);
    void playCompleteSound();
  }, [isDone]);

  useEffect(() => {
    if (isDone) return;

    cancelAnimationFrame(rafRef.current);

    const tick = () => {
      const now = performance.now();
      const elapsedInStep = now - stepStartedAtRef.current;
      const { start, end, expectedMs, cap } = currentStepConfig;

      const raw = clamp(elapsedInStep / expectedMs, 0, 1);
      const eased = easeOutExpo(raw);
      const targetWithinStep = start + (end - start) * cap * eased;

      setProgress((current) => {
        const next = Math.max(current, targetWithinStep);
        return clamp(next, 0, 0.985);
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [currentStepConfig, isDone]);

  useEffect(() => {
    const TIP_MS = 3800;
    const t = setInterval(() => {
      setTipIndex((i) => (i + 1) % FUN_TIPS.length);
    }, TIP_MS);

    return () => clearInterval(t);
  }, []);

  const dash = circumference * progress;

  return (
    <div className="flex w-full flex-col items-center justify-center gap-4 py-6">
      <div className="relative h-36 w-36">
        <div
          className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${
            isComplete ? "bg-emerald-200/35 scale-110" : "bg-amber-200/30"
          }`}
        />

        <svg viewBox="0 0 120 120" className="relative h-full w-full">
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
            className={`transition-[stroke-dasharray,stroke] duration-300 ${
              isComplete ? "text-emerald-500" : "text-amber-500"
            }`}
            strokeDasharray={`${dash} ${Math.max(0, circumference - dash)}`}
            transform="rotate(-90 60 60)"
          />
        </svg>

        <div className="absolute inset-0 grid place-items-center">
          <div
            className={`grid h-16 w-16 place-items-center rounded-2xl border shadow-sm backdrop-blur transition-all duration-500 ${
              isComplete
                ? "scale-105 border-emerald-200 bg-emerald-50/90"
                : "border-slate-200 bg-white/85"
            }`}
          >
            <PawSpinner
              size={44}
              className={`drop-shadow-sm transition-all duration-500 ${
                step === "generate_art" ? "scale-110" : "scale-100"
              } ${isComplete ? "opacity-90" : ""}`}
            />
          </div>
        </div>
      </div>

      <div className="max-w-sm px-6 text-center">
        <div className="text-sm font-semibold text-slate-900">
          {isComplete ? "Design ready" : currentStatus}
          {displayStyleLabel ? (
            <span className="text-amber-600"> · {displayStyleLabel}</span>
          ) : null}
        </div>

        <div className="mt-2 text-xs text-slate-500">
          {isComplete
            ? "Your preview is ready."
            : `Step ${displayStep.stepNumber} of ${displayStep.totalSteps}`}
        </div>

        <div className="mt-3 text-[11px] text-slate-700 transition-all duration-300">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 transition-colors duration-500 ${
              isComplete
                ? "border-emerald-200 bg-emerald-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <span className={isComplete ? "text-emerald-700" : "text-amber-700"}>
              ●
            </span>
            <span>{isComplete ? "All set." : FUN_TIPS[tipIndex]}</span>
          </span>
        </div>
      </div>
    </div>
  );
}