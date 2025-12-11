// src/app/page.tsx
"use client";

import { useState, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MugPreview from "./MugPreview";
import PhotoTipsAccordion from "./PhotoTipsAccordion";

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
    maxWidth = 1024, // more aggressive to avoid 413
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
    if (typeof window === "undefined") {
      return resolve(imageBase64);
    }

    const img = new Image();
    img.onload = () => {
      const CANVAS_SIZE = 2000;
      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(imageBase64);
        return;
      }

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

    img.onerror = () => {
      resolve(imageBase64);
    };

    img.src = imageBase64 as string;
  });
}

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
  const [qualityResult, setQualityResult] = useState<QualityResult | null>(
    null
  );
  const [qualityError, setQualityError] = useState<string | null>(null);

  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState<number>(0);

  const [sliderValue, setSliderValue] = useState(50);

  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [isSavingArtwork, setIsSavingArtwork] = useState(false);
  const [saveArtworkError, setSaveArtworkError] = useState<string | null>(null);

  // Multi-design support
  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  const [activeDesignIndex, setActiveDesignIndex] = useState<number>(0);

  const [artError, setArtError] = useState<string | null>(null);

  const generationCount = designs.length;
  const activeDesign = designs[activeDesignIndex] ?? null;
  const generatedArtUrl = activeDesign?.imageUrl ?? null;

  // DEBUG: log the current flask artwork data URL
  if (generatedArtUrl) {
    console.log("ARTWORK_DATA_URL", generatedArtUrl);
  }

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
      console.log("Artwork saved:", json);
      return json;
    } catch (err) {
      console.error("Error saving artwork:", err);
      setSaveArtworkError(
        "We created your design, but couldn’t save it yet. You can try again."
      );
      return null;
    } finally {
      setIsSavingArtwork(false);
    }
  }

  function handleGoToCheckout() {
    if (!artworkId) return;

    // Prefer the style of the active design; fall back to current selector
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
      // Compress the image before we do anything else
      const compressedDataUrl = await compressImageToDataUrl(file, {
        maxWidth: 1024,
        maxHeight: 1024,
        quality: 0.7,
        outputType: "image/jpeg",
      });

      // Store compressed version as our source-of-truth base64
      setCompressedImageBase64(compressedDataUrl);

      // Use compressed for preview
      setPreviewUrl(compressedDataUrl);
      setProcessedUrl(null);

      // Reset everything else as before
      setQualityResult(null);
      setQualityError(null);
      setBgError(null);
      setSaveArtworkError(null);

      setSliderValue(50);
      setArtworkId(null);
      setCurrentStep(1);

      // Reset designs
      setDesigns([]);
      setActiveDesignIndex(0);
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
    if (!selectedFile) {
      console.warn("No file selected");
      return;
    }

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
      console.log("Quality result:", json);

      if (json.error) {
        setQualityError(json.error as string);
        return;
      }

      const result = json as QualityResult;
      setQualityResult(result);

      if (result.status !== "bad") {
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Error calling /api/photo-quality:", error);
      setQualityError("Something went wrong while checking the photo.");
    } finally {
      setIsChecking(false);
    }
  }

  async function handleRemoveBackground() {
    if (!selectedFile) {
      console.warn("No file selected");
      return;
    }

    try {
      setIsRemovingBg(true);
      setBgError(null);

      const base64Source =
        compressedImageBase64 ?? (await fileToBase64(selectedFile));

      const res = await fetch("/api/remove-background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Source }),
      });

      const json = await res.json();
      console.log("Background optimisation result:", json);

      if (json.error) {
        setBgError(json.error as string);
        return;
      }

      if (typeof json.imageBase64 === "string") {
        setProcessedUrl(json.imageBase64);
      } else {
        setBgError("Unexpected response while optimising your photo.");
      }
    } catch (error) {
      console.error("Error calling /api/remove-background:", error);
      setBgError("Something went wrong while preparing the photo.");
    } finally {
      setIsRemovingBg(false);
    }
  }

  async function handleGenerateArt() {
    if (!selectedFile) {
      console.warn("No file selected");
      return;
    }

    if (generationCount >= MAX_GENERATIONS_PER_PHOTO) {
      setArtError(
        "You’ve reached the maximum number of style variations for this photo."
      );
      return;
    }

    try {
      setIsGenerating(true);
      setArtError(null);
      setGenerateProgress(5);
      setArtworkId(null);
      setSaveArtworkError(null);

      let imageBase64: string;

      // 1) Prefer already processed (bg-removed) image if available
      if (processedUrl && processedUrl.startsWith("data:image")) {
        imageBase64 = processedUrl;
      } else {
        // 2) Otherwise use compressed upload (or compress on the fly as fallback)
        const base64Source =
          compressedImageBase64 ??
          (await compressImageToDataUrl(selectedFile, {
            maxWidth: 1024,
            maxHeight: 1024,
            quality: 0.7,
            outputType: "image/jpeg",
          }));

        if (!compressedImageBase64) {
          setCompressedImageBase64(base64Source);
        }

        try {
          setGenerateProgress(20);

          // Use compressed source for background removal inside generate
          const resBg = await fetch("/api/remove-background", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64Source }),
          });

          const jsonBg = await resBg.json();
          console.log("Auto photo optimisation in generate:", jsonBg);

          if (
            !resBg.ok ||
            jsonBg.error ||
            typeof jsonBg.imageBase64 !== "string"
          ) {
            console.warn(
              "Photo optimisation failed in generate, falling back to compressed source."
            );
            imageBase64 = base64Source;
          } else {
            imageBase64 = jsonBg.imageBase64;
            setProcessedUrl(jsonBg.imageBase64);
          }
        } catch (err) {
          console.error(
            "Error auto-preparing photo in generate, falling back to compressed source:",
            err
          );
          imageBase64 = base64Source;
        }
      }

      // 🔽 FINAL SAFETY NET: compress whatever we ended up with before /api/generate-art
      try {
        const compressedForGenerate = await compressBase64Image(imageBase64, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.65,
          outputType: "image/jpeg",
        });
        console.log(
          "Final imageBase64 length for /api/generate-art:",
          compressedForGenerate.length
        );
        imageBase64 = compressedForGenerate;
      } catch (err) {
        console.warn(
          "Failed to compress base64 before /api/generate-art, using original:",
          err
        );
      }

      setGenerateProgress(55);

      const res = await fetch("/api/generate-art", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          styleId,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Generate-art error:", res.status, text);
        setArtError(
          "Something went wrong while creating the design. Please try again."
        );
        setGenerateProgress(0);
        return;
      }

      const json = await res.json();
      console.log("Generate art result:", json);

      if (json.error) {
        setArtError(
          json.error ||
            "Something went wrong while creating the design. Please try again."
        );
        setGenerateProgress(0);
        return;
      }

      if (typeof json.imageBase64 === "string") {
        setGenerateProgress(80);
        const standardized = await standardizeArtForFlask(json.imageBase64);

        // Save artwork and attach to this design
        const saved = await saveArtwork(standardized);

        const newDesign: GeneratedDesign = {
          id: `design-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          // Prefer the Supabase URL if we have it; fall back to the local data URL as a backup
          imageUrl: saved?.imageUrl ?? standardized,
          artworkId: saved?.artworkId ?? null,
          styleId,
          createdAt: Date.now(),
        };

        setDesigns((prev) => {
          const next = [...prev, newDesign];
          return next.slice(0, MAX_GENERATIONS_PER_PHOTO); // safety, though count is capped
        });

        // Auto-select the newest design
        setActiveDesignIndex((prevIndex) => {
          const nextIndex = generationCount; // previous count is index of new design
          return nextIndex;
        });

        // Sync artworkId for checkout if we successfully saved
        if (saved?.artworkId) {
          setArtworkId(saved.artworkId);
        } else {
          setArtworkId(null);
        }

        setSliderValue(50);
        setGenerateProgress(100);
      } else {
        setArtError("Unexpected response from design generator.");
        setGenerateProgress(0);
      }
    } catch (error) {
      console.error("Error calling /api/generate-art:", error);
      setArtError("Something went wrong while creating the design.");
      setGenerateProgress(0);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerateProgress(0), 500);
    }
  }

  const styleButtonBase =
    "rounded-lg border px-3 py-2 text-xs md:text-sm transition";
  const activeStyleClasses =
    "border-amber-400 bg-amber-50 text-amber-800 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]";
  const inactiveStyleClasses =
    "border-slate-200 bg-white hover:border-slate-400";

  function getStatusStyles(status: QualityStatus) {
    switch (status) {
      case "good":
        return {
          container:
            "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm",
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
          <p className="text-[11px] opacity-90">
            {qualityError} — try again or upload a different image.
          </p>
        </div>
      );
    }

    if (!qualityResult) return null;

    const { score, status, face, sharpness, lighting, background } =
      qualityResult;
    const styles = getStatusStyles(status);

    let headline: string;
    let hint: string;

    if (status === "good") {
      headline = "Great photo! This should work really well for your flask.";
      hint =
        "You can continue with this image — the face is clear enough for a detailed portrait.";
    } else if (status === "warn") {
      headline = "This photo is okay, but could be improved.";
      hint =
        "Try a brighter shot with the pet closer to the camera and less background clutter for even better results.";
    } else {
      headline = "This photo probably won’t produce a great result.";
      hint =
        "Please upload a new picture: ideally front-facing, sharp, and well-lit with a simple background.";
    }

    return (
      <div
        className={`mt-3 rounded-lg border px-3 py-3 text-xs space-y-2 ${styles.container}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className={`font-medium text-[13px] ${styles.label}`}>
              Photo quality: {status.toUpperCase()} (score {score.toFixed(1)}/10)
            </p>
            <p className="text-[11px] opacity-90">{headline}</p>
          </div>
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

  const canGenerate =
    !!selectedFile && !!qualityResult && qualityResult.status !== "bad";

  const sourcePreview = processedUrl ?? previewUrl;
  const flaskPreview = generatedArtUrl;

  const remainingGenerations =
    MAX_GENERATIONS_PER_PHOTO - generationCount >= 0
      ? MAX_GENERATIONS_PER_PHOTO - generationCount
      : 0;

  const hasArt = !!generatedArtUrl;

  const generateButtonLabel = isGenerating
    ? "Creating your pet design…"
    : hasArt
    ? remainingGenerations > 0
      ? `Try another style (${remainingGenerations} left)`
      : "Preview limit reached"
    : "Create design for your flask";

  const disableGenerateButton =
    !canGenerate || isGenerating || generationCount >= MAX_GENERATIONS_PER_PHOTO;

  const canGoToCheckout =
    !!artworkId &&
    !!generatedArtUrl &&
    !isSavingArtwork &&
    !saveArtworkError &&
    !artError;

  const step1Active = currentStep === 1;
  const step2Active = currentStep === 2;

  // For the 3-step generate loading labels
  const generationStage =
    generateProgress <= 0
      ? 0
      : generateProgress < 30
      ? 1
      : generateProgress < 75
      ? 2
      : 3;

  const getStageLabelClass = (stage: number) =>
    stage === generationStage ? "text-amber-600" : "text-slate-400";

  const stepLabelClass = (active: boolean) =>
    `text-[11px] ${active ? "text-amber-700" : "text-slate-400"}`;

  // Overall flow progress (Upload → Quality → Design → Checkout)
  let overallStep = 1;
  if (previewUrl) overallStep = 1;
  if (qualityResult && qualityResult.status !== "bad") overallStep = 2;
  if (generatedArtUrl) overallStep = 3;
  if (canGoToCheckout) overallStep = 3; // still 3 main steps visually
  const overallProgress = ((overallStep - 1) / 3) * 100;

  const generationChecklist = [
    {
      label: "Preparing your photo & cleaning the background",
      minStage: 1,
    },
    { label: "Applying your chosen style", minStage: 2 },
    { label: "Finalising print-ready file & preview", minStage: 3 },
  ];

  function scrollToStep1() {
    if (step1Ref.current) {
      step1Ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const effectiveStyleForPreview = activeDesign?.styleId ?? styleId;

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-900">
      <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Top nav with logo + links */}
        <div className="mb-6 flex items-center justify-center sm:justify-between gap-6 rounded-full border border-slate-200 bg-white/80 px-6 md:px-8 py-2.5 md:py-3.5 backdrop-blur-sm shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-center sm:justify-start gap-3 w-full sm:w-auto">
            <img
              src="/purepawstudio-logo.png"
              alt="PurePawStudio logo"
              className="h-14 w-auto sm:h-16 object-contain select-none rounded-xl"
            />
          </div>

          <nav className="hidden sm:flex items-center gap-8 text-[11px] text-slate-500">
            <Link href="/shipping" className="hover:text-slate-900 transition">
              Shipping
            </Link>
            <Link
              href="/order-help"
              className="hover:text-slate-900 transition"
            >
              Order help
            </Link>
            <Link
              href="/orders"
              className="px-3 py-1.5 rounded-full bg-slate-900 text-slate-50 border border-slate-900 hover:bg-slate-700 transition"
            >
              My orders
            </Link>
          </nav>
        </div>

        <header className="mb-6 text-center">
          <p className="hidden sm:block text-[11px] uppercase tracking-[0.25em] text-amber-600 mb-2">
            PERSONALISED PET FLASKS
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mb-2 tracking-tight text-slate-900">
            Design your personalised PurePaw Flask.
          </h1>

          {/* Value / price chip */}
          <div className="mb-3 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-700 shadow-sm">
              <span className="font-medium text-slate-900">From £19.99</span>
              <span className="mx-1.5 text-slate-300">·</span>
              <span className="text-slate-500">
                Stainless steel · UK fulfilment
              </span>
            </div>
          </div>

          {/* Desktop/Tablet subcopy */}
          <p className="hidden sm:block text-slate-600 max-w-2xl mx-auto text-sm md:text-base">
            Turn your pet into a premium portrait on a stainless steel bottle,
            with a scannable memory page tucked inside the QR. Upload a photo,
            choose their personality and see your PurePaw Flask preview before
            you order.
          </p>
          {/* Mobile subcopy (shorter) */}
          <p className="sm:hidden text-slate-600 max-w-md mx-auto text-sm">
            Upload a photo, choose your pet’s vibe and see your PurePaw Flask
            preview before you order.
          </p>

          {/* Mobile: start here button */}
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
        </header>

        {/* Step indicator + overall progress */}
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
              <span className={stepLabelClass(step1Active || step2Active)}>
                Upload photo &amp; quick check
              </span>
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
              <span className={stepLabelClass(step2Active)}>
                Choose style &amp; create design
              </span>
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
              <span className={stepLabelClass(canGoToCheckout)}>
                Secure checkout
              </span>
            </div>
          </div>

          {/* Mobile condensed text */}
          <p className="sm:hidden text-[11px] text-slate-500 text-center">
            Step{" "}
            <span className="font-semibold text-slate-800">{overallStep}</span>{" "}
            of 3
          </p>

          {/* Overall progress bar */}
          <div className="h-1.5 w-full max-w-md mx-auto rounded-full bg-slate-200 border border-slate-200 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-300 transition-all duration-300"
              style={{ width: `${Math.max(4, Math.min(overallProgress, 100))}%` }}
            />
          </div>
        </div>

        {/* Mobile link row */}
        <div className="mt-1 mb-5 flex sm:hidden justify-center gap-4 text-[11px] text-slate-500">
          <Link href="/shipping" className="hover:text-slate-900 transition">
            Shipping
          </Link>
          <span className="opacity-40">·</span>
          <Link
            href="/order-help"
            className="hover:text-slate-900 transition"
          >
            Order help
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/orders" className="hover:text-slate-900 transition">
            My orders
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.2fr,1fr] items-start">
          {/* Left: controls */}
          <section
            ref={step1Ref}
            className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 space-y-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
          >
            {/* STEP 1 */}
            <div>
              <h2 className="text-lg font-medium mb-2 text-slate-900">
                Step 1 · Upload your pet photo
              </h2>

              <p className="text-[11px] text-slate-500 mb-2">
                Works best with a sharp, front-facing photo of your pet&apos;s
                face. Phone photos are perfect.
              </p>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-900">
                  Choose a clear photo
                </h3>
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center cursor-pointer hover:border-amber-400 hover:bg-amber-50/60 transition">
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Click to upload
                  </span>
                  <span className="text-[11px] text-slate-500 max-w-xs">
                    Make sure your pet&apos;s face is visible and in focus.
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
                {previewUrl && (
                  <p className="text-[11px] text-amber-700 mt-1">
                    Photo selected ✓ — next, run the quick quality check below.
                  </p>
                )}

                {/* Example / tips accordion */}
                <PhotoTipsAccordion />

                {renderQualityMessage()}

                {bgError && (
                  <p className="mt-2 text-[11px] text-rose-600">
                    {bgError} Try again in a moment or check your credits.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 mt-4">
                <h3 className="text-sm font-medium text-slate-900 mb-2">
                  Step 2 · Run a quick photo check
                </h3>
                <button
                  className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-amber-300 transition disabled:opacity-60 disabled:hover:bg-amber-400"
                  onClick={handleCheckQuality}
                  disabled={!previewUrl || isChecking}
                >
                  {isChecking
                    ? "Checking photo quality…"
                    : "Run photo quality check"}
                </button>

                {isChecking && (
                  <div className="mt-2">
                    <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div className="h-full w-1/2 bg-amber-300/90 animate-pulse" />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500 text-center">
                      Looking at face, sharpness, lighting and background…
                    </p>
                  </div>
                )}

                <p className="mt-2 text-[11px] text-slate-500 text-center">
                  We do a quick quality check so your pet looks sharp, clear and
                  print-ready on the flask.
                </p>
              </div>
            </div>

            {/* STEP 3 */}
            <div
              className={`pt-4 border-t border-slate-200 ${
                step1Active ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium text-slate-900">
                  Step 3 · Choose their personality &amp; create your design
                </h2>
                {step1Active && (
                  <span className="text-[10px] text-amber-600">
                    Run the quality check above to unlock this step.
                  </span>
                )}
              </div>

              {!qualityResult && previewUrl && (
                <p className="mb-3 text-[11px] text-amber-600">
                  Run the photo quality check first so we can correctly detect
                  your pet&apos;s face.
                </p>
              )}

              {qualityResult?.status === "bad" && (
                <p className="mb-3 text-[11px] text-rose-600">
                  This photo is unlikely to produce a good result. We recommend
                  uploading a clearer, better-lit picture before creating your
                  design.
                </p>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-900">
                  Choose a style
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleStyleClick("gangster")}
                    className={`${styleButtonBase} ${
                      styleId === "gangster"
                        ? activeStyleClasses
                        : inactiveStyleClasses
                    }`}
                  >
                    <span className="block">Gangster</span>
                    <span className="block text-[10px] text-slate-500">
                      Gold chain, cool vibe
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStyleClick("disney")}
                    className={`${styleButtonBase} ${
                      styleId === "disney"
                        ? activeStyleClasses
                        : inactiveStyleClasses
                    }`}
                  >
                    <span className="block">Disney</span>
                    <span className="block text-[10px] text-slate-500">
                      Movie-style magic
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStyleClick("girlboss")}
                    className={`${styleButtonBase} ${
                      styleId === "girlboss"
                        ? activeStyleClasses
                        : inactiveStyleClasses
                    }`}
                  >
                    <span className="block">Girlboss</span>
                    <span className="block text-[10px] text-slate-500">
                      Lashes &amp; glam
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-medium text-slate-900">
                  Create your flask design
                </h3>
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

                <p className="text-[11px] text-amber-700 font-medium">
                  Usually ready in{" "}
                  <span className="font-semibold">under a minute</span>,
                  depending on your photo.
                </p>

                <p className="text-[11px] text-slate-500">
                  Designs created:{" "}
                  <span className="font-semibold">
                    {generationCount}/{MAX_GENERATIONS_PER_PHOTO}
                  </span>
                  .
                </p>

                {isGenerating && (
                  <div className="mt-2 space-y-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                    <p className="text-[11px] text-slate-800 font-medium">
                      Creating your pet design… please keep this tab open.
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 transition-all duration-300"
                        style={{
                          width: `${Math.max(
                            10,
                            Math.min(generateProgress, 100)
                          )}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className={getStageLabelClass(1)}>
                        1 · Preparing your photo
                      </span>
                      <span className={getStageLabelClass(2)}>
                        2 · Applying style
                      </span>
                      <span className={getStageLabelClass(3)}>
                        3 · Saving print file
                      </span>
                    </div>

                    <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
                      {generationChecklist.map((item, idx) => {
                        const active = generationStage >= item.minStage;
                        return (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span
                              className={
                                active ? "text-amber-600 mt-[1px]" : "mt-[1px]"
                              }
                            >
                              {active ? "✓" : "•"}
                            </span>
                            <span
                              className={
                                active ? "text-slate-800" : "text-slate-500"
                              }
                            >
                              {item.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <p className="mt-1 text-[11px] text-slate-500">
                  We keep your pet&apos;s unique face and markings, apply the
                  style you chose and prepare a print-ready design for your
                  PurePaw Flask.
                </p>
                <p className="text-[11px] text-slate-500">
                  You can create up to{" "}
                  <span className="font-semibold">
                    {MAX_GENERATIONS_PER_PHOTO}
                  </span>{" "}
                  style variations per photo during preview.
                </p>
                {artError && (
                  <p className="text-[11px] text-rose-600">{artError}</p>
                )}
                {generatedArtUrl && !artError && (
                  <p className="text-[11px] text-amber-700">
                    Design created ✓ — the flask on the right now shows your
                    current selected design.
                  </p>
                )}
                {generatedArtUrl && artworkId && !saveArtworkError && (
                  <p className="text-[11px] text-amber-700">
                    Design saved ✓ (Artwork ID:{" "}
                    <span className="font-mono text-[10px]">{artworkId}</span>).
                    We&apos;ll use this design for checkout.
                  </p>
                )}
                {isSavingArtwork && (
                  <p className="text-[11px] text-slate-500">
                    Saving your print-ready design…
                  </p>
                )}
                {saveArtworkError && (
                  <p className="text-[11px] text-rose-600">
                    {saveArtworkError}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Right: previews + CTA */}
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
              Selected style:{" "}
              <span className="text-slate-900 font-medium capitalize">
                {effectiveStyleForPreview === "disney"
                  ? "Disney"
                  : effectiveStyleForPreview}
              </span>
            </p>
            {generatedArtUrl && (
              <p className="mt-1 text-[11px] text-amber-700">
                This design is what will be printed on your flask when you
                continue to checkout.
              </p>
            )}
            {!generatedArtUrl && (
              <p className="mt-1 text-[11px] text-slate-500">
                Once you create your design, your final flask preview will
                appear here.
              </p>
            )}

            {/* Design gallery / selector */}
            {designs.length > 1 && (
              <div className="mt-5 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-medium text-slate-900 mb-1">
                  Your created designs
                </h3>
                <p className="text-[11px] text-slate-500 mb-2">
                  Tap a design to preview it on the flask and use it for
                  checkout.
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
                          if (design.artworkId) {
                            setArtworkId(design.artworkId);
                          } else {
                            setArtworkId(null);
                          }
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
                          <span className="text-[9px] text-slate-50">
                            #{index + 1}
                          </span>
                          {isActive && (
                            <span className="text-[9px] text-amber-200">
                              Selected
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-medium text-slate-900 mb-2">
                Source photo preview
              </h3>
              <div className="flex items-center gap-3">
                {sourcePreview ? (
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={sourcePreview}
                      alt="Original pet photo preview"
                      className="w-full h-full object-cover"
                    />
                    {processedUrl && (
                      <span className="absolute bottom-1 left-1 right-1 text-[9px] text-center rounded-full bg-emerald-100/90 text-emerald-700 border border-emerald-200 px-1 py-[2px]">
                        Photo optimised for best results
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Upload a photo on the left to see your reference image here.
                  </p>
                )}
                <p className="text-[11px] text-slate-500">
                  This is the photo we use as the reference for your pet. We
                  keep the face and markings, apply your chosen style and place
                  the portrait on the flask — with a hidden QR that opens their
                  own memory page.
                </p>
              </div>
            </div>

            {sourcePreview && generatedArtUrl && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h3 className="text-xs font-medium text-slate-900 mb-2">
                  Style before / after (preview only)
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
                        Preview only · Final portrait after checkout
                      </span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sliderValue}
                    onChange={(e) =>
                      setSliderValue(Number(e.target.value) || 0)
                    }
                    className="mt-3 w-full cursor-pointer accent-amber-400"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Drag to compare your original photo with the styled
                    portrait. The full, print-ready file is prepared after
                    checkout.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-200">
              <h3 className="text-xs font-medium text-slate-900 mb-2">
                Step 3 · Secure checkout
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Happy with your preview? Continue to our secure checkout page
                to confirm your details and pay.
              </p>
              <button
                type="button"
                disabled={!canGoToCheckout}
                onClick={handleGoToCheckout}
                className="w-full rounded-lg bg-slate-900 text-white text-xs font-medium py-2.5 disabled:opacity-60 hover:bg-slate-900 transition"
              >
                {canGoToCheckout
                  ? "Continue to checkout"
                  : "Create and select a saved design first"}
              </button>
              {artworkId &&
                !canGoToCheckout &&
                !artError &&
                !saveArtworkError && (
                  <p className="mt-2 text-[11px] text-slate-500">
                    We&apos;re just finishing up your design. Once it&apos;s
                    fully ready, you&apos;ll be able to head to checkout.
                  </p>
                )}

              <p className="mt-3 text-[10px] text-slate-500 text-center">
                Powered by{" "}
                <span className="font-semibold text-slate-800">Stripe</span> ·
                Encrypted checkout
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
