// src/app/page.tsx
"use client";

import { useState, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import MugPreview from "./MugPreview";
import PhotoTipsAccordion from "./PhotoTipsAccordion";
import TopNav from "./TopNav";
import { GenerationWheel } from "@/components/GenerationWheel";

// --- Image compression helper (keeps payload under Vercel limits) ---
async function compressImageToDataUrl(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputType?: "image/jpeg" | "image/png";
  }
): Promise<string> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.7,
    outputType = "image/jpeg",
  } = options || {};

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = () => {
      if (!reader.result || typeof reader.result !== "string") {
        reject(new Error("Failed to read file as data URL"));
        return;
      }

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas 2D context not available"));
            return;
          }

          const ratio = Math.min(
            maxWidth / img.width,
            maxHeight / img.height,
            1
          );

          const targetWidth = Math.round(img.width * ratio);
          const targetHeight = Math.round(img.height * ratio);

          canvas.width = targetWidth;
          canvas.height = targetHeight;

          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

          const dataUrl = canvas.toDataURL(outputType, quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = reject;
      img.src = reader.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Compress an existing base64 data URL (e.g. after background removal)
async function compressBase64Image(
  imageBase64: string,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputType?: "image/jpeg" | "image/png";
  }
): Promise<string> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.65,
    outputType = "image/jpeg",
  } = options || {};

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D context not available"));
          return;
        }

        const ratio = Math.min(
          maxWidth / img.width,
          maxHeight / img.height,
          1
        );

        const targetWidth = Math.round(img.width * ratio);
        const targetHeight = Math.round(img.height * ratio);

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const dataUrl = canvas.toDataURL(outputType, quality);
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = reject;
    img.src = imageBase64;
  });
}
// --- end helper ---

type StyleId = "gangster" | "disney" | "girlboss";
type QualityStatus = "good" | "warn" | "bad";

type QualityResult = {
  face: number;
  sharpness: number;
  lighting: number;
  background: number;
  score: number;
  status: QualityStatus;
};

type SaveArtworkResponse = {
  artworkId: string;
  imageUrl: string;
  petName: string | null;
  petType: string | null;
  styleId: StyleId;
  qualityResult: QualityResult | null;
  storageMode: string;
  localPath: string | null;
  createdAt: string;
};

type GeneratedDesign = {
  id: string;
  imageUrl: string;
  artworkId: string | null;
  styleId: StyleId;
  createdAt: number;
};

const MAX_GENERATIONS_PER_PHOTO = 3;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function standardizeArtForFlask(imageBase64: string): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(imageBase64);

    const img = new Image();
    img.onload = () => {
      const CANVAS_SIZE = 2000;
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) return resolve(imageBase64);

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const MAX_RATIO = 0.8;
      const maxDrawSize = CANVAS_SIZE * MAX_RATIO;

      const scale = Math.min(
        maxDrawSize / img.width,
        maxDrawSize / img.height
      );

      const drawWidth = img.width * scale;
      const drawHeight = img.height * scale;

      const dx = (CANVAS_SIZE - drawWidth) / 2;
      const dy = (CANVAS_SIZE - drawHeight) / 2;

      ctx.drawImage(img, dx, dy, drawWidth, drawHeight);

      const standardized = canvas.toDataURL("image/png");
      resolve(standardized);
    };

    img.onerror = () => resolve(imageBase64);
    img.src = imageBase64 as string;
  });
}

type GenStep =
  | "remove_bg"
  | "generate_art"
  | "polish"
  | "finalise"
  | "prepare_preview";

export default function HomePage() {
  const router = useRouter();
  const step1Ref = useRef<HTMLDivElement | null>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [styleId, setStyleId] = useState<StyleId>("gangster");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [compressedImageBase64, setCompressedImageBase64] =
    useState<string | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState<GenStep>("remove_bg");
  const [genRunId, setGenRunId] = useState<number>(0);
  const [generateProgress, setGenerateProgress] = useState<number>(0);

  const [sliderValue, setSliderValue] = useState(50);

  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [isSavingArtwork, setIsSavingArtwork] = useState(false);
  const [saveArtworkError, setSaveArtworkError] = useState<string | null>(null);

  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  const [activeDesignIndex, setActiveDesignIndex] = useState<number>(0);

  const [artError, setArtError] = useState<string | null>(null);

  const generationCount = designs.length;
  const activeDesign = designs[activeDesignIndex] ?? null;
  const generatedArtUrl = activeDesign?.imageUrl ?? null;

  async function saveArtwork(
    imageBase64: string
  ): Promise<SaveArtworkResponse | null> {
    try {
      setIsSavingArtwork(true);
      setSaveArtworkError(null);
      setArtworkId(null);

      const res = await fetch("/api/artworks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          styleId,
          qualityResult: qualityResult ?? undefined,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Failed to save artwork:", text);
        throw new Error("Failed to save artwork");
      }

      const json = (await res.json()) as SaveArtworkResponse;
      return json;
    } catch (err) {
      console.error("Error saving artwork:", err);
      setSaveArtworkError(
        "We created your design, but couldn’t save it yet. Please try again."
      );
      return null;
    } finally {
      setIsSavingArtwork(false);
    }
  }

  function handleGoToCheckout() {
    if (!artworkId) return;

    const styleForCheckout = activeDesign?.styleId ?? styleId;
    const query = new URLSearchParams({
      artworkId,
      styleId: styleForCheckout,
    });

    router.push(`/checkout?${query.toString()}`);
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    try {
      const compressedDataUrl = await compressImageToDataUrl(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.7,
        outputType: "image/jpeg",
      });

      setCompressedImageBase64(compressedDataUrl);

      setPreviewUrl(compressedDataUrl);
      setProcessedUrl(null);

      setQualityResult(null);
      setQualityError(null);
      setSaveArtworkError(null);
      setArtError(null);

      setSliderValue(50);
      setArtworkId(null);
      setCurrentStep(1);

      setDesigns([]);
      setActiveDesignIndex(0);

      setGenStep("remove_bg");
      setGenerateProgress(0);
    } catch (err) {
      console.error("Failed to compress uploaded image:", err);
      const fallbackUrl = URL.createObjectURL(file);
      setPreviewUrl(fallbackUrl);
    }
  }

  function handleStyleClick(id: StyleId) {
    setStyleId(id);
  }

  async function handleCheckQuality() {
    if (!selectedFile) return;

    try {
      setIsChecking(true);
      setQualityResult(null);
      setQualityError(null);

      const base64 =
        processedUrl && processedUrl.startsWith("data:image")
          ? processedUrl
          : compressedImageBase64 ?? (await fileToBase64(selectedFile));

      const res = await fetch("/api/photo-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const json = await res.json();

      if (json.error) {
        setQualityError(json.error as string);
        return;
      }

      const result = json as QualityResult;
      setQualityResult(result);

      if (result.status !== "bad") {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
    } catch (error) {
      console.error("Error calling /api/photo-quality:", error);
      setQualityError("Something went wrong while checking the photo.");
    } finally {
      setIsChecking(false);
    }
  }

  async function handleGenerateArt() {
    if (!selectedFile) return;

    if (generationCount >= MAX_GENERATIONS_PER_PHOTO) {
      setArtError(
        "You’ve reached the maximum number of style variations for this photo."
      );
      return;
    }

    try {
      setIsGenerating(true);
      setGenRunId(Date.now());
      setArtError(null);
      setGenerateProgress(6);
      setArtworkId(null);
      setSaveArtworkError(null);

      setGenStep("remove_bg");

      let imageBase64: string;

      // Prefer already processed image if available
      if (processedUrl && processedUrl.startsWith("data:image")) {
        imageBase64 = processedUrl;
      } else {
        const base64Source =
          compressedImageBase64 ??
          (await compressImageToDataUrl(selectedFile, {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.7,
            outputType: "image/jpeg",
          }));

        if (!compressedImageBase64) setCompressedImageBase64(base64Source);

        imageBase64 = base64Source;
      }

      // Safety compress before generate
      try {
        setGenStep("polish");
        imageBase64 = await compressBase64Image(imageBase64, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.65,
          outputType: "image/jpeg",
        });
      } catch (err) {
        console.warn("Failed to compress before generate:", err);
      }

      setGenerateProgress(55);
      setGenStep("generate_art");

      const res = await fetch("/api/generate-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, styleId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Generate-art error:", res.status, text);
        setArtError("Something went wrong while creating the design. Try again.");
        setGenerateProgress(0);
        return;
      }

      const json = await res.json();

      if (json.error) {
        setArtError(json.error || "Something went wrong while creating the design.");
        setGenerateProgress(0);
        return;
      }

      if (typeof json.imageBase64 === "string") {
        setGenerateProgress(80);
        setGenStep("polish");

        const standardized = await standardizeArtForFlask(json.imageBase64);

        setGenStep("finalise");
        setGenerateProgress(90);

        const saved = await saveArtwork(standardized);

        const newDesign: GeneratedDesign = {
          id: `design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          imageUrl: saved?.imageUrl ?? standardized,
          artworkId: saved?.artworkId ?? null,
          styleId,
          createdAt: Date.now(),
        };

        setGenStep("prepare_preview");
        setGenerateProgress(96);

        setDesigns((prev) => [...prev, newDesign].slice(0, MAX_GENERATIONS_PER_PHOTO));
        setActiveDesignIndex(() => generationCount);

        if (saved?.artworkId) setArtworkId(saved.artworkId);

        setSliderValue(50);
        setGenerateProgress(100);
      } else {
        setArtError("Unexpected response from design generator.");
        setGenerateProgress(0);
        return;
      }
    } catch (error) {
      console.error("Error calling /api/generate-art:", error);
      setArtError("Something went wrong while creating the design.");
      setGenerateProgress(0);
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
        setGenerateProgress(0);
      }, 450);
    }
  }

  function getStatusStyles(status: QualityStatus) {
    switch (status) {
      case "good":
        return {
          container: "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm",
          label: "text-emerald-800",
        };
      case "warn":
        return {
          container: "bg-amber-50 border-amber-200 text-amber-800 shadow-sm",
          label: "text-amber-800",
        };
      case "bad":
        return {
          container: "bg-rose-50 border-rose-200 text-rose-800 shadow-sm",
          label: "text-rose-800",
        };
    }
  }

  function renderQualityMessage() {
    if (qualityError) {
      return (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
          <p className="font-medium mb-1">Couldn&apos;t check this photo</p>
          <p className="text-[11px] opacity-90">{qualityError}</p>
        </div>
      );
    }

    if (!qualityResult) return null;

    const { score, status, face, sharpness, lighting, background } = qualityResult;
    const styles = getStatusStyles(status);

    let headline: string;
    let hint: string;

    if (status === "good") {
      headline = "Great photo — perfect for a detailed portrait.";
      hint = "You’re good to go. Next, choose a style and create your design.";
    } else if (status === "warn") {
      headline = "This photo will work, but the result may be softer.";
      hint = "For best results: brighter light, closer face, and a simpler background.";
    } else {
      headline = "This photo is unlikely to produce a great result.";
      hint = "Try a new photo: front-facing, sharp, well-lit, with minimal background clutter.";
    }

    return (
      <div className={`mt-3 rounded-lg border px-3 py-3 text-xs space-y-2 ${styles.container}`}>
        <div>
          <p className={`font-medium text-[13px] ${styles.label}`}>
            Photo quality: {status.toUpperCase()} (score {score.toFixed(1)}/10)
          </p>
          <p className="text-[11px] opacity-90">{headline}</p>
        </div>

        <div className="grid grid-cols-2 gap-1 text-[11px] opacity-90">
          <p>
            <span className="font-semibold">Face:</span> {face}/10
          </p>
          <p>
            <span className="font-semibold">Sharpness:</span> {sharpness}/10
          </p>
          <p>
            <span className="font-semibold">Lighting:</span> {lighting}/10
          </p>
          <p>
            <span className="font-semibold">Background:</span> {background}/10
          </p>
        </div>

        <p className="text-[11px] text-slate-700">{hint}</p>
      </div>
    );
  }

  const canGenerate = !!selectedFile && !!qualityResult && qualityResult.status !== "bad";

  const sourcePreview = processedUrl ?? previewUrl;
  const flaskPreview = generatedArtUrl;

  const remainingGenerations = Math.max(0, MAX_GENERATIONS_PER_PHOTO - generationCount);
  const hasArt = !!generatedArtUrl;

  const generateButtonLabel = isGenerating
    ? "Creating your design…"
    : hasArt
    ? remainingGenerations > 0
      ? `Try another style (${remainingGenerations} left)`
      : "Preview limit reached"
    : "Create my design";

  const disableGenerateButton = !canGenerate || isGenerating || generationCount >= MAX_GENERATIONS_PER_PHOTO;

  const canGoToCheckout =
    !!artworkId && !!generatedArtUrl && !isSavingArtwork && !saveArtworkError && !artError;

  const step1Active = currentStep === 1;
  const step2Active = currentStep === 2;

  const stepLabelClass = (active: boolean) =>
    `text-[11px] ${active ? "text-amber-700" : "text-slate-400"}`;

  // Overall flow progress (Upload → Quality → Design → Checkout)
  let overallStep = 1;
  if (previewUrl) overallStep = 1;
  if (qualityResult && qualityResult.status !== "bad") overallStep = 2;
  if (generatedArtUrl) overallStep = 3;
  const overallProgress = ((overallStep - 1) / 3) * 100;

  function scrollToStep1() {
    step1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const effectiveStyleForPreview = activeDesign?.styleId ?? styleId;

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-900">
      <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Top nav */}
        <TopNav />

        <header className="mb-6 text-center">
          <p className="hidden sm:block text-[11px] uppercase tracking-[0.25em] text-amber-600 mb-2">
            PERSONALISED PET FLASKS
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mb-2 tracking-tight text-slate-900">
            Design your personalised PurePaw Flask.
          </h1>

          {/* Price chip */}
          <div className="mb-3 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm">
              <span className="font-medium text-slate-900">From £19.99</span>
              <span className="mx-1.5 text-slate-300">·</span>
              <span className="text-slate-500">Stainless steel · UK fulfilment</span>
            </div>
          </div>

          {/* Copy */}
          <p className="hidden sm:block text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
            Upload a photo, choose your pet’s vibe and preview your flask before you order.
          </p>
          <p className="sm:hidden text-slate-600 max-w-md mx-auto text-sm">
            Upload a photo, choose a vibe, preview your flask.
          </p>

          {/* Mobile: start */}
          <div className="mt-4 sm:hidden flex justify-center">
            <button
              type="button"
              onClick={scrollToStep1}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 text-slate-900 text-xs font-medium px-4 py-2 shadow-[0_10px_25px_rgba(251,191,36,0.35)]"
            >
              <span>Start your flask</span>
              <span className="text-[13px]">↓</span>
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-4 flex justify-center">
            <div className="text-[11px] text-slate-500 flex items-center gap-2">
              <span>UK printing</span>
              <span className="opacity-30">•</span>
              <span>Secure checkout</span>
              <span className="opacity-30">•</span>
              <span>Tracked delivery</span>
            </div>
          </div>
        </header>

        {/* Steps + progress */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  step1Active || step2Active
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                1
              </span>
              <span className={stepLabelClass(step1Active || step2Active)}>Upload photo</span>
            </div>

            <div className="hidden sm:block h-px w-6 bg-slate-300" />

            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  step2Active
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                2
              </span>
              <span className={stepLabelClass(step2Active)}>Choose style</span>
            </div>

            <div className="hidden sm:block h-px w-6 bg-slate-300" />

            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  canGoToCheckout
                    ? "border-amber-400 bg-amber-50 text-amber-700"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                3
              </span>
              <span className={stepLabelClass(canGoToCheckout)}>Checkout</span>
            </div>
          </div>

          <p className="sm:hidden text-[11px] text-slate-500 text-center">
            Step <span className="font-semibold text-slate-800">{overallStep}</span> of 3
          </p>

          <div className="h-1.5 w-full max-w-md mx-auto rounded-full bg-slate-200 border border-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-300 transition-all duration-300"
              style={{ width: `${Math.max(4, Math.min(overallProgress, 100))}%` }}
            />
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.2fr,1fr] items-start">
          {/* Left */}
          <section
            ref={step1Ref}
            className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
          >
            {/* Step 1 */}
            <div>
              <h2 className="text-lg font-medium mb-2 text-slate-900">
                Step 1 · Upload your pet photo
              </h2>

              <p className="text-[11px] text-slate-500 mb-3">
                Pick a sharp photo where your pet’s face is clear. Phone photos are perfect.
              </p>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-900">Pick your favourite photo</h3>

                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/60 transition">
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Tap to upload
                  </span>
                  <span className="text-[11px] text-slate-500 max-w-xs">
                    Make sure the face is visible and in focus.
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {previewUrl && (
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                      <img
                        src={previewUrl}
                        alt="Selected photo preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-slate-900">
                        Photo selected ✓
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Next: run the quick photo check below.
                      </p>
                    </div>
                  </div>
                )}

                <PhotoTipsAccordion />

                {renderQualityMessage()}
              </div>

              {/* Step 2 */}
              <div className="pt-5 border-t border-slate-200 mt-5">
                <h3 className="text-sm font-medium text-slate-900 mb-2">
                  Step 2 · Quick photo check
                </h3>

                <button
                  className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-amber-300 transition disabled:opacity-60 disabled:hover:bg-amber-400"
                  onClick={handleCheckQuality}
                  disabled={!previewUrl || isChecking}
                >
                  {isChecking ? "Checking photo…" : "Check this photo"}
                </button>

                {isChecking && (
                  <div className="mt-2">
                    <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full w-1/2 bg-amber-300/90 animate-pulse" />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 text-center">
                      Checking face, clarity, lighting and background…
                    </p>
                  </div>
                )}

                <p className="mt-2 text-[11px] text-slate-500 text-center">
                  This helps ensure your pet looks sharp and print-ready.
                </p>
              </div>
            </div>

            {/* Step 3 (clean locked state) */}
            <div className="pt-5 border-t border-slate-200">
              <h2 className="text-lg font-medium text-slate-900">
                Step 3 · Choose a style &amp; create your design
              </h2>

              {/* Lock callout (no overlap / no inline note) */}
              {step1Active && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                  <p className="text-[12px] font-medium text-amber-900">
                    Run the photo check above to unlock this step.
                  </p>
                  <p className="text-[11px] text-amber-800 opacity-90">
                    Once it passes, you’ll be able to create your flask design.
                  </p>
                </div>
              )}

              {/* Content: collapse when locked for cleanliness */}
              {!step1Active && (
                <>
                  {qualityResult?.status === "bad" && (
                    <p className="mt-3 text-[11px] text-rose-600">
                      This photo is unlikely to produce a good result. Try a clearer, better-lit photo.
                    </p>
                  )}

                  <div className="space-y-3 mt-4">
                    <h3 className="text-sm font-medium text-slate-900">Choose a vibe</h3>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handleStyleClick("gangster")}
                        className={`rounded-lg border px-3 py-2 text-xs md:text-sm transition ${
                          styleId === "gangster"
                            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]"
                            : "border-slate-200 bg-white hover:border-slate-400"
                        }`}
                      >
                        <span className="block">Gangster</span>
                        <span className="block text-[10px] text-slate-500">Gold chain, cool vibe</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStyleClick("disney")}
                        className={`rounded-lg border px-3 py-2 text-xs md:text-sm transition ${
                          styleId === "disney"
                            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]"
                            : "border-slate-200 bg-white hover:border-slate-400"
                        }`}
                      >
                        <span className="block">Disney</span>
                        <span className="block text-[10px] text-slate-500">Movie-style magic</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStyleClick("girlboss")}
                        className={`rounded-lg border px-3 py-2 text-xs md:text-sm transition ${
                          styleId === "girlboss"
                            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]"
                            : "border-slate-200 bg-white hover:border-slate-400"
                        }`}
                      >
                        <span className="block">Girlboss</span>
                        <span className="block text-[10px] text-slate-500">Lashes &amp; glam</span>
                      </button>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h3 className="text-sm font-medium text-slate-900">Create your design</h3>

                      <button
                        type="button"
                        onClick={handleGenerateArt}
                        disabled={disableGenerateButton}
                        className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition disabled:opacity-60 ${
                          isGenerating
                            ? "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.4)]"
                            : "bg-amber-400 hover:bg-amber-300"
                        }`}
                      >
                        {generateButtonLabel}
                      </button>

                      <p className="text-[11px] text-slate-500">
                        Usually ready shortly — depends on your photo.
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Designs created:{" "}
                        <span className="font-semibold">{generationCount}/{MAX_GENERATIONS_PER_PHOTO}</span>.
                      </p>

                      {isGenerating && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                          <GenerationWheel step={genStep} styleLabel={styleId} runId={genRunId} />

                          <div className="px-4 pb-4">
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 transition-all duration-300"
                                style={{
                                  width: `${Math.max(10, Math.min(generateProgress, 100))}%`,
                                }}
                              />
                            </div>
                            <p className="mt-2 text-[11px] text-slate-500 text-center">
                              Please keep this tab open — we’re creating a custom design for your pet.
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="mt-1 text-[11px] text-slate-500">
                        We keep your pet’s unique face and markings and prepare a print-ready design for your flask.
                      </p>

                      {artError && <p className="text-[11px] text-rose-600">{artError}</p>}

                      {generatedArtUrl && !artError && (
                        <p className="text-[11px] text-emerald-700">
                          Design created ✓ — your flask preview on the right is updated.
                        </p>
                      )}

                      {isSavingArtwork && (
                        <p className="text-[11px] text-slate-500">
                          Saving your design…
                        </p>
                      )}

                      {saveArtworkError && (
                        <p className="text-[11px] text-rose-600">
                          {saveArtworkError}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Right */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 flex flex-col shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
            <h2 className="text-sm font-medium mb-4 text-slate-900">
              Live PurePaw Flask preview
            </h2>

            <MugPreview
              imageUrl={flaskPreview}
              hasGeneratedArt={!!generatedArtUrl}
              styleId={effectiveStyleForPreview}
            />

            <p className="mt-4 text-[11px] text-slate-500">
              Selected vibe:{" "}
              <span className="text-slate-900 font-medium capitalize">
                {effectiveStyleForPreview === "disney" ? "Disney" : effectiveStyleForPreview}
              </span>
            </p>

            {generatedArtUrl ? (
              <p className="mt-1 text-[11px] text-amber-700">
                This is the design that will be printed on your flask.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">
                Create your design to see the final flask preview here.
              </p>
            )}

            {/* Design selector */}
            {designs.length > 1 && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-medium text-slate-900 mb-1">
                  Your created designs
                </h3>
                <p className="text-[11px] text-slate-500 mb-2">
                  Tap a design to preview it and use it for checkout.
                </p>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {designs.map((design, index) => {
                    const isActive = index === activeDesignIndex;
                    return (
                      <button
                        key={design.id}
                        type="button"
                        onClick={() => {
                          setActiveDesignIndex(index);
                          setSliderValue(50);
                          setArtworkId(design.artworkId ?? null);
                        }}
                        className={`relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border ${
                          isActive
                            ? "border-amber-400 ring-2 ring-amber-400/50"
                            : "border-slate-200 hover:border-slate-400"
                        } bg-white`}
                      >
                        <img
                          src={design.imageUrl}
                          alt={`Generated design ${index + 1}`}
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute bottom-0 inset-x-0 px-1 py-[2px] bg-black/40 flex items-center justify-between">
                          <span className="text-[9px] text-slate-50">#{index + 1}</span>
                          {isActive && <span className="text-[9px] text-amber-200">Selected</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Source preview */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-medium text-slate-900 mb-2">
                Your photo
              </h3>

              <div className="flex items-start gap-3">
                {sourcePreview ? (
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex-shrink-0">
                    <img
                      src={sourcePreview}
                      alt="Original pet photo preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Upload a photo to see it here.
                  </p>
                )}

                <p className="text-[11px] text-slate-500">
                  We use your photo as the reference, keep the face and markings, and apply the style you choose.
                </p>
              </div>
            </div>

            {/* Before/after slider */}
            {sourcePreview && generatedArtUrl && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-medium text-slate-900 mb-2">
                  Before / after (preview)
                </h3>

                <div
                  className="max-w-sm select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={sourcePreview}
                      alt="Before"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                    />

                    <div
                      className="absolute inset-0 overflow-hidden pointer-events-none"
                      style={{ width: `${sliderValue}%` }}
                    >
                      <img
                        src={generatedArtUrl}
                        alt="After"
                        className="w-full h-full object-contain bg-slate-900 pointer-events-none select-none"
                      />
                    </div>

                    <div
                      className="absolute inset-y-0 flex items-center justify-center pointer-events-none"
                      style={{ left: `calc(${sliderValue}% - 1px)` }}
                    >
                      <div className="w-0.5 h-full bg-white/90 shadow-[0_0_6px_rgba(15,23,42,0.45)]" />
                    </div>

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] md:text-xs tracking-[0.18em] uppercase font-semibold text-white/90 bg-black/55 px-4 py-1.5 rounded-full backdrop-blur">
                        Preview only
                      </span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value) || 0)}
                    className="mt-3 w-full cursor-pointer accent-amber-400"
                  />

                  <p className="mt-1 text-[11px] text-slate-500">
                    Drag to compare your photo with the styled portrait.
                  </p>
                </div>
              </div>
            )}

            {/* Checkout */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-medium text-slate-900 mb-2">
                Step 3 · Checkout
              </h3>

              <p className="text-[11px] text-slate-500 mb-3">
                When you’re happy with your preview, continue to secure checkout.
              </p>

              <button
                type="button"
                disabled={!canGoToCheckout}
                onClick={handleGoToCheckout}
                className="w-full rounded-lg bg-slate-900 text-white text-xs font-medium py-2.5 disabled:opacity-60 hover:bg-slate-900 transition"
              >
                {canGoToCheckout ? "Continue to checkout" : "Create a saved design first"}
              </button>

              <p className="mt-3 text-[10px] text-slate-500 text-center">
                Powered by <span className="font-semibold text-slate-800">Stripe</span> · Encrypted checkout
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
