"use client";

import { useState, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

type StyleId = "gangster" | "cartoon" | "girlboss";

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

const MAX_GENERATIONS_PER_PHOTO = 5;

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

interface MugPreviewProps {
  imageUrl: string | null;
  hasGeneratedArt: boolean;
  styleId: StyleId;
}

function MugPreview({ imageUrl, hasGeneratedArt, styleId }: MugPreviewProps) {
  const mugBackgroundUrl = "/flasks/twofifteen-premium-bottle.png";

  const PRINT_AREA_WIDTH_PERCENT = 40;
  const PRINT_AREA_HEIGHT_PERCENT = 58;
  const PRINT_AREA_TOP_PERCENT = 20;
  const PRINT_AREA_LEFT_PERCENT = 29;

  const styleLabel = styleId;

  return (
    <div className="w-full flex-1 flex items-center justify-center">
      <div
        className="relative w-full max-w-xs sm:max-w-sm aspect-[4/5] mx-auto rounded-3xl border border-slate-800/80 bg-slate-950 shadow-[0_18px_60px_rgba(0,0,0,0.85)] overflow-hidden select-none"
        style={{
          backgroundImage: `url(${mugBackgroundUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Soft glow behind flask */}
        <div className="pointer-events-none absolute inset-y-6 left-1/2 w-[70%] -translate-x-1/2 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(15,23,42,0.4)_0,transparent_40%),radial-gradient(circle_at_80%_90%,rgba(15,23,42,0.7)_0,transparent_55%)] pointer-events-none" />

        {/* Print area */}
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            top: `${PRINT_AREA_TOP_PERCENT}%`,
            left: `${PRINT_AREA_LEFT_PERCENT}%`,
            width: `${PRINT_AREA_WIDTH_PERCENT}%`,
            height: `${PRINT_AREA_HEIGHT_PERCENT}%`,
          }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt="Pet flask artwork preview"
              className="w-full h-full object-contain select-none"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-[11px] px-3 text-center rounded-xl bg-slate-950/85 border border-slate-700/70 shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <span className="text-slate-50">
                Your final AI art will appear on the flask here.
              </span>
              <span className="mt-1 text-slate-300/90">
                Upload a photo, pass the quality check and generate your design.
              </span>
            </div>
          )}
        </div>

        {/* Label pill */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/90 text-[10px] font-medium text-slate-100 border border-slate-700/70 backdrop-blur flex items-center gap-1 pointer-events-none">
          <span>{hasGeneratedArt ? "Final AI art" : "No art yet"}</span>
          <span className="opacity-40">·</span>
          <span className="capitalize text-teal-300">{styleLabel}</span>
        </div>
      </div>
    </div>
  );
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
  const [generatedArtUrl, setGeneratedArtUrl] = useState<string | null>(null);
  const [artError, setArtError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);

  const [sliderValue, setSliderValue] = useState(50);

  const [artworkId, setArtworkId] = useState<string | null>(null);
  const [isSavingArtwork, setIsSavingArtwork] = useState(false);
  const [saveArtworkError, setSaveArtworkError] = useState<string | null>(null);

  async function saveArtwork(imageBase64: string) {
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
      setArtworkId(json.artworkId);
      console.log("Artwork saved:", json);
    } catch (err) {
      console.error("Error saving artwork:", err);
      setSaveArtworkError(
        "We generated your art, but couldn’t save it yet. You can try again."
      );
    } finally {
      setIsSavingArtwork(false);
    }
  }

  function handleGoToCheckout() {
    if (!artworkId) return;
    router.push(`/checkout?artworkId=${encodeURIComponent(artworkId)}`);
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
      setGeneratedArtUrl(null);
      setArtError(null);
      setGenerationCount(0);
      setSliderValue(50);
      setArtworkId(null);
      setSaveArtworkError(null);
      setCurrentStep(1);
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
      setGeneratedArtUrl(null);
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

          if (!resBg.ok || jsonBg.error || typeof jsonBg.imageBase64 !== "string") {
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
          "Something went wrong while generating the artwork. Please try again."
        );
        setGenerateProgress(0);
        return;
      }

      const json = await res.json();
      console.log("Generate art result:", json);

      if (json.error) {
        setArtError(
          json.error ||
            "Something went wrong while generating the artwork. Please try again."
        );
        setGenerateProgress(0);
        return;
      }

      if (typeof json.imageBase64 === "string") {
        setGenerateProgress(80);
        const standardized = await standardizeArtForFlask(json.imageBase64);
        setGeneratedArtUrl(standardized);
        setGenerationCount((count) => count + 1);
        setSliderValue(50);

        await saveArtwork(standardized);

        setGenerateProgress(100);
      } else {
        setArtError("Unexpected response from image generator.");
        setGenerateProgress(0);
      }
    } catch (error) {
      console.error("Error calling /api/generate-art:", error);
      setArtError("Something went wrong while generating the artwork.");
      setGenerateProgress(0);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerateProgress(0), 500);
    }
  }

  const styleButtonBase =
    "rounded-lg border px-3 py-2 text-xs md:text-sm transition";
  const activeStyleClasses = "border-teal-400 bg-teal-500/10 text-teal-100";
  const inactiveStyleClasses =
    "border-slate-700 bg-slate-900 hover:border-slate-500";

  function getStatusStyles(status: QualityStatus) {
    switch (status) {
      case "good":
        return {
          container: "bg-teal-900/40 border-teal-500/70 text-teal-100",
          label: "text-teal-200",
        };
      case "warn":
        return {
          container: "bg-amber-900/40 border-amber-500/60 text-amber-100",
          label: "text-amber-300",
        };
      case "bad":
        return {
          container: "bg-rose-900/40 border-rose-500/60 text-rose-100",
          label: "text-rose-300",
        };
    }
  }

  function renderQualityMessage() {
    if (qualityError) {
      return (
        <div className="mt-3 rounded-lg border border-rose-500/60 bg-rose-900/40 px-3 py-2 text-xs text-rose-100">
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
      headline = "Great photo! This should work really well for AI art.";
      hint =
        "You can continue with this image — the face is clear enough for accurate pet art.";
    } else if (status === "warn") {
      headline = "This photo is okay, but could be improved.";
      hint =
        "Try a brighter shot with the pet closer to the camera and less background clutter for even better results.";
    } else {
      headline = "This photo probably won’t produce good AI art.";
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

        <p className="text-[11px] text-slate-50/80">{hint}</p>
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
    ? "Generating your pet art…"
    : hasArt
    ? remainingGenerations > 0
      ? `Regenerate style (${remainingGenerations} left)`
      : "Regeneration limit reached"
    : "Generate AI artwork for your flask";

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
    stage === generationStage ? "text-teal-300" : "text-slate-500";

  const stepLabelClass = (active: boolean) =>
    `text-[11px] ${active ? "text-teal-200" : "text-slate-400"}`;

  // Overall flow progress (Upload → Quality → Generate → Checkout)
  let overallStep = 1;
  if (previewUrl) overallStep = 1;
  if (qualityResult && qualityResult.status !== "bad") overallStep = 2;
  if (generatedArtUrl) overallStep = 3;
  if (canGoToCheckout) overallStep = 4;
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.12)_0,transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,1)_0,rgba(15,23,42,1)_55%)]" />

      <div className="w-full max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Top nav with logo + links */}
        <div className="mb-5 flex items-center justify-center sm:justify-between gap-6 rounded-full border border-slate-800/80 bg-slate-950/80 px-6 md:px-8 py-3 md:py-3.5 backdrop-blur-sm shadow-[0_18px_40px_rgba(0,0,0,0.75)]">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <img
              src="/purepawstudio-logo.png"
              alt="PurePawStudio logo"
              className="h-14 md:h-20 w-auto object-contain select-none rounded-xl"
            />
          </div>

          <nav className="hidden sm:flex items-center gap-8 text-[11px] text-slate-400">
            <Link href="/shipping" className="hover:text-slate-100 transition">
              Shipping
            </Link>
            <Link
              href="/order-help"
              className="hover:text-slate-100 transition"
            >
              Order help
            </Link>
            <Link
              href="/orders"
              className="px-3 py-1.5 rounded-full bg-slate-800/80 text-slate-100 border border-slate-700/80 hover:bg-slate-700/80 transition"
            >
              My orders
            </Link>
          </nav>
        </div>

        <header className="mb-5 text-center">
          <p className="hidden sm:block text-[11px] uppercase tracking-[0.25em] text-teal-300/80 mb-2">
            AI PET FLASK STUDIO
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold mb-2 tracking-tight">
            Turn your pet into premium flask art.
          </h1>

          {/* Value / price chip */}
          <div className="mb-3 flex justify-center">
            <div className="inline-flex items-center rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-[11px] text-slate-200">
              <span className="font-medium">From £19.99</span>
              <span className="mx-1.5 text-slate-500">·</span>
              <span className="text-slate-300/90">Ships from the UK</span>
            </div>
          </div>

          {/* Desktop/Tablet subcopy */}
          <p className="hidden sm:block text-slate-300 max-w-2xl mx-auto text-sm md:text-base">
            Upload a photo, let our AI clean and stylise it, and preview your
            custom stainless steel flask before heading to secure checkout.
          </p>
          {/* Mobile subcopy (shorter) */}
          <p className="sm:hidden text-slate-300 max-w-md mx-auto text-sm">
            Upload your pet photo and get instant AI-powered flask art you can
            preview before checkout.
          </p>

          {/* Mobile: start here button */}
          <div className="mt-4 sm:hidden flex justify-center">
            <button
              type="button"
              onClick={scrollToStep1}
              className="inline-flex items-center gap-2 rounded-full bg-teal-400 text-slate-900 text-xs font-medium px-4 py-2 shadow-[0_10px_30px_rgba(45,212,191,0.4)]"
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
                    ? "border-teal-400 bg-teal-500/10 text-teal-200"
                    : "border-slate-600 bg-slate-900 text-slate-300"
                }`}
              >
                1
              </span>
              <span className={stepLabelClass(step1Active || step2Active)}>
                Upload &amp; quality check
              </span>
            </div>
            <div className="hidden sm:block h-px w-6 bg-slate-700" />
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  step2Active
                    ? "border-teal-400 bg-teal-500/10 text-teal-200"
                    : "border-slate-600 bg-slate-900 text-slate-300"
                }`}
              >
                2
              </span>
              <span className={stepLabelClass(step2Active)}>
                Style &amp; AI artwork
              </span>
            </div>
            <div className="hidden sm:block h-px w-6 bg-slate-700" />
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                  canGoToCheckout
                    ? "border-teal-400 bg-teal-500/10 text-teal-200"
                    : "border-slate-600 bg-slate-900 text-slate-300"
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
            <span className="font-semibold text-slate-200">{overallStep}</span>{" "}
            of 3
          </p>

          {/* Overall progress bar */}
          <div className="h-1.5 w-full max-w-md mx-auto rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-teal-300 via-teal-400 to-emerald-300 transition-all duration-300"
              style={{ width: `${Math.max(4, Math.min(overallProgress, 100))}%` }}
            />
          </div>
        </div>

        {/* Mobile link row (kept but lighter) */}
        <div className="mt-1 mb-5 flex sm:hidden justify-center gap-4 text-[11px] text-slate-500">
          <Link href="/shipping" className="hover:text-slate-100 transition">
            Shipping
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/order-help" className="hover:text-slate-100 transition">
            Order help
          </Link>
          <span className="opacity-40">·</span>
          <Link href="/orders" className="hover:text-slate-100 transition">
            My orders
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.2fr,1fr] items-start">
          {/* Left: controls */}
          <section
            ref={step1Ref}
            className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
          >
            {/* STEP 1 */}
            <div>
              <h2 className="text-lg font-medium mb-2">
                Step 1 · Upload your pet photo
              </h2>

              <p className="text-[11px] text-slate-400 mb-2">
                Works best with a sharp, front-facing photo of your pet&apos;s
                face. Phone photos are perfect.
              </p>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-100">
                  Choose a clear photo
                </h3>
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700/80 bg-slate-950/70 px-4 py-8 text-center cursor-pointer hover:border-teal-400 hover:bg-slate-900 transition">
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-400">
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
                  <p className="text-[11px] text-teal-300 mt-1">
                    Photo selected ✓ — next, run the quick quality check below.
                  </p>
                )}

                {renderQualityMessage()}

                {bgError && (
                  <p className="mt-2 text-[11px] text-rose-300">
                    {bgError} Try again in a moment or check your credits.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4">
                <h3 className="text-sm font-medium text-slate-100 mb-2">
                  Step 2 · Run a quick photo check
                </h3>
                <button
                  className="w-full rounded-xl bg-teal-400 px-4 py-3 text-sm font-medium text-slate-950 hover:bg-teal-300 transition disabled:opacity-60 disabled:hover:bg-teal-400"
                  onClick={handleCheckQuality}
                  disabled={!previewUrl || isChecking}
                >
                  {isChecking
                    ? "Checking photo quality…"
                    : "Run photo quality check"}
                </button>

                {isChecking && (
                  <div className="mt-2">
                    <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full w-1/2 bg-teal-400/90 animate-pulse" />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 text-center">
                      Looking at face, sharpness, lighting and background…
                    </p>
                  </div>
                )}

                <p className="mt-2 text-[11px] text-slate-500 text-center">
                  We run a high-precision quality check so your pet art looks
                  sharp, clear and print-ready.
                </p>
              </div>
            </div>

            {/* STEP 3 */}
            <div
              className={`pt-4 border-t border-slate-800 ${
                step1Active ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-medium">
                  Step 3 · Choose style &amp; generate AI art
                </h2>
                {step1Active && (
                  <span className="text-[10px] text-amber-300">
                    Run the quality check above to unlock this step.
                  </span>
                )}
              </div>

              {!qualityResult && previewUrl && (
                <p className="mb-3 text-[11px] text-amber-300">
                  Run the photo quality check first so we can correctly detect
                  your pet&apos;s face.
                </p>
              )}

              {qualityResult?.status === "bad" && (
                <p className="mb-3 text-[11px] text-rose-300">
                  This photo is unlikely to produce good art. We recommend
                  uploading a clearer, better-lit picture before generating.
                </p>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-slate-100">
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
                    Gangster
                    <span className="block text-[10px] text-slate-400">
                      Gold chain, cool vibe
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStyleClick("cartoon")}
                    className={`${styleButtonBase} ${
                      styleId === "cartoon"
                        ? activeStyleClasses
                        : inactiveStyleClasses
                    }`}
                  >
                    Cartoon
                    <span className="block text-[10px] text-slate-400">
                      Classic colourful
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
                    Girl boss
                    <span className="block text-[10px] text-slate-400">
                      Lashes &amp; glam
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-medium text-slate-100">
                  Generate AI art
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateArt}
                  disabled={disableGenerateButton}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-medium text-slate-950 transition disabled:opacity-60 ${
                    isGenerating
                      ? "bg-gradient-to-r from-teal-300 via-teal-400 to-teal-200 shadow-[0_0_25px_rgba(45,212,191,0.5)]"
                      : "bg-teal-400 hover:bg-teal-300"
                  }`}
                >
                  {generateButtonLabel}
                </button>

                <p className="text-[11px] text-teal-300 font-medium">
                  Typical time:{" "}
                  <span className="font-semibold">20–40 seconds</span> depending
                  on your photo and traffic.
                </p>

                {isGenerating && (
                  <div className="mt-2 space-y-3 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-3">
                    <p className="text-[11px] text-slate-200 font-medium">
                      Generating your pet art… please keep this tab open.
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-300 via-teal-400 to-teal-200 transition-all duration-300"
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

                    <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
                      {generationChecklist.map((item, idx) => {
                        const active = generationStage >= item.minStage;
                        return (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span
                              className={
                                active ? "text-teal-300 mt-[1px]" : "mt-[1px]"
                              }
                            >
                              {active ? "✓" : "•"}
                            </span>
                            <span
                              className={
                                active ? "text-slate-100" : "text-slate-400"
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
                  We analyse your photo, keep your pet&apos;s unique face and
                  markings, then apply the chosen style and prepare a
                  print-ready design for your flask.
                </p>
                <p className="text-[11px] text-slate-500">
                  You can generate up to{" "}
                  <span className="font-semibold">
                    {MAX_GENERATIONS_PER_PHOTO}
                  </span>{" "}
                  style variations per photo during preview.
                </p>
                {artError && (
                  <p className="text-[11px] text-rose-300">{artError}</p>
                )}
                {generatedArtUrl && !artError && (
                  <p className="text-[11px] text-teal-300">
                    AI artwork generated ✓ — the flask on the right now shows
                    your final design.
                  </p>
                )}
                {generatedArtUrl && artworkId && !saveArtworkError && (
                  <p className="text-[11px] text-teal-300">
                    Design saved ✓ (Artwork ID:{" "}
                    <span className="font-mono text-[10px]">{artworkId}</span>).
                    You&apos;ll use this for checkout on the next page.
                  </p>
                )}
                {isSavingArtwork && (
                  <p className="text-[11px] text-slate-400">
                    Saving your print-ready artwork…
                  </p>
                )}
                {saveArtworkError && (
                  <p className="text-[11px] text-rose-300">
                    {saveArtworkError}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Right: previews + CTA */}
          <section className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 md:p-6 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <h2 className="text-sm font-medium mb-4">
              Live flask preview &amp; studio previews
            </h2>

            <MugPreview
              imageUrl={flaskPreview}
              hasGeneratedArt={!!generatedArtUrl}
              styleId={styleId}
            />

            <p className="mt-4 text-[11px] text-slate-500">
              Selected style:{" "}
              <span className="text-slate-200 font-medium capitalize">
                {styleId}
              </span>
            </p>
            {generatedArtUrl && (
              <p className="mt-1 text-[11px] text-teal-300">
                This artwork is what will be printed on your flask.
              </p>
            )}
            {!generatedArtUrl && (
              <p className="mt-1 text-[11px] text-slate-500">
                Once you generate AI art, your final flask preview will appear
                here.
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-medium text-slate-200 mb-2">
                Source photo preview
              </h3>
              <div className="flex items-center gap-3">
                {sourcePreview ? (
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                    <img
                      src={sourcePreview}
                      alt="Original pet photo preview"
                      className="w-full h-full object-cover"
                    />
                    {processedUrl && (
                      <span className="absolute bottom-1 left-1 right-1 text-[9px] text-center rounded-full bg-teal-900/80 text-teal-200 border border-teal-500/70 px-1 py-[2px]">
                        Photo optimised for AI
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
                  the result on the flask.
                </p>
              </div>
            </div>

            {sourcePreview && generatedArtUrl && (
              <div className="mt-6 pt-4 border-t border-slate-800">
                <h3 className="text-xs font-medium text-slate-200 mb-2">
                  Style before / after (preview only)
                </h3>
                <div
                  className="max-w-sm select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
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
                        className="w-full h-full object-contain bg-slate-950 pointer-events-none select-none"
                      />
                    </div>
                    <div
                      className="absolute inset-y-0 flex items-center justify-center pointer-events-none"
                      style={{ left: `calc(${sliderValue}% - 1px)` }}
                    >
                      <div className="w-0.5 h-full bg-white/70 shadow-[0_0_6px_rgba(0,0,0,0.6)]" />
                    </div>

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] md:text-xs tracking-[0.18em] uppercase font-semibold text-white/70 bg-black/45 px-4 py-1.5 rounded-full backdrop-blur">
                        Preview only · Final art after checkout
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
                    className="mt-3 w-full cursor-pointer accent-teal-400"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Drag to compare your original photo with the AI-styled
                    artwork. The full, watermark-free file is unlocked after
                    checkout.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-medium text-slate-200 mb-2">
                Step 4 · Secure checkout
              </h3>
              <p className="text-[11px] text-slate-500 mb-3">
                Happy with your preview? Continue to our secure checkout page
                to confirm your details and pay.
              </p>
              <button
                type="button"
                disabled={!canGoToCheckout}
                onClick={handleGoToCheckout}
                className="w-full rounded-lg bg-amber-400 text-slate-900 text-xs font-medium py-2.5 disabled:opacity-60 hover:bg-amber-300 transition"
              >
                {canGoToCheckout
                  ? "Continue to checkout"
                  : "Generate and save a design first"}
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
                <span className="font-semibold text-slate-200">Stripe</span> ·
                Encrypted checkout
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
