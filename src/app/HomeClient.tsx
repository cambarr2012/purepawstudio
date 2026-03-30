"use client";

import { useState, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import MugPreview from "./MugPreview";
import GymBottlePreview from "./GymBottlePreview";
import PhotoTipsAccordion from "./PhotoTipsAccordion";
import TopNav from "./TopNav";
import { GenerationWheel } from "@/components/GenerationWheel";
import Footer from "./Footer";

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

      const MAX_RATIO = 0.92;
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

export default function HomeClient() {
  const router = useRouter();
  const step1Ref = useRef<HTMLDivElement | null>(null);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [showExamples, setShowExamples] = useState(false);

  const [styleId, setStyleId] = useState<StyleId>("gangster");
  const [previewProduct, setPreviewProduct] = useState<"flask" | "gym">("flask");

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
  const [showCompletedWheel, setShowCompletedWheel] = useState(false);

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
    const productType = previewProduct === "gym" ? "gym_bottle" : "flask";

    const query = new URLSearchParams({
      artworkId,
      styleId: styleForCheckout,
      productType,
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
      setShowCompletedWheel(false);
    } catch (err) {
      console.error("Failed to compress uploaded image:", err);
      const fallbackUrl = URL.createObjectURL(file);
      setPreviewUrl(fallbackUrl);
      setShowCompletedWheel(false);
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

    let generationSucceeded = false;

    try {
      setIsGenerating(true);
      setShowCompletedWheel(false);
      setGenRunId(Date.now());
      setArtError(null);
      setGenerateProgress(6);
      setArtworkId(null);
      setSaveArtworkError(null);

      setGenStep("remove_bg");

      let imageBase64: string;

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

      try {
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
        setArtError(
          json.error || "Something went wrong while creating the design."
        );
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

        setDesigns((prev) =>
          [...prev, newDesign].slice(0, MAX_GENERATIONS_PER_PHOTO)
        );
        setActiveDesignIndex(() => generationCount);

        if (saved?.artworkId) setArtworkId(saved.artworkId);

        setSliderValue(50);
        setGenerateProgress(100);
        generationSucceeded = true;
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
      if (generationSucceeded) {
        setShowCompletedWheel(true);

        setTimeout(() => {
          setIsGenerating(false);
          setGenerateProgress(0);

          setTimeout(() => {
            setShowCompletedWheel(false);
          }, 700);
        }, 250);
      } else {
        setTimeout(() => {
          setIsGenerating(false);
          setGenerateProgress(0);
          setShowCompletedWheel(false);
        }, 250);
      }
    }
  }

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
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-xs text-rose-800">
          <p className="mb-1 font-medium">Couldn&apos;t check this photo</p>
          <p className="text-[11px] opacity-90">{qualityError}</p>
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
      headline = "Great photo — ideal for a strong personalised result.";
      hint =
        "You’re good to go. Clear front-facing photos usually create the best bottle designs.";
    } else if (status === "warn") {
      headline = "This photo can work, but the result may be a little softer.";
      hint =
        "For best results, use a clearer front-facing portrait with bright light and a visible face.";
    } else {
      headline = "This photo is unlikely to produce a strong result.";
      hint =
        "Try a new photo: front-facing, sharp, well-lit, and portrait-style rather than side-on.";
    }

    return (
      <div
        className={`mt-3 rounded-xl border px-3 py-3 text-xs space-y-2 ${styles.container}`}
      >
        <div>
          <p className={`text-[13px] font-medium ${styles.label}`}>
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

  const canGenerate =
    !!selectedFile && !!qualityResult && qualityResult.status !== "bad";

  const sourcePreview = processedUrl ?? previewUrl;
  const flaskPreview = generatedArtUrl;

  const remainingGenerations = Math.max(
    0,
    MAX_GENERATIONS_PER_PHOTO - generationCount
  );
  const hasArt = !!generatedArtUrl;
  const showGenerationWheel = isGenerating || showCompletedWheel;
  const wheelIsDone = showCompletedWheel && !isGenerating;

  const generateButtonLabel = isGenerating
    ? "Creating your design…"
    : hasArt
    ? remainingGenerations > 0
      ? `Try another style (${remainingGenerations} left)`
      : "Preview limit reached"
    : "Create my design";

  const disableGenerateButton =
    !canGenerate ||
    isGenerating ||
    generationCount >= MAX_GENERATIONS_PER_PHOTO;

  const canGoToCheckout =
    !!artworkId &&
    !!generatedArtUrl &&
    !isSavingArtwork &&
    !saveArtworkError &&
    !artError;

  const step1Active = currentStep === 1;
  const step2Active = currentStep === 2;
  const step3Active =
    (!!qualityResult && qualityResult.status !== "bad") ||
    !!generatedArtUrl ||
    isGenerating ||
    showCompletedWheel;
  const step4Active = canGoToCheckout;

  let overallStep = 1;
  if (previewUrl) overallStep = 1;
  if (qualityResult && qualityResult.status !== "bad") overallStep = 2;
  if (generatedArtUrl || isGenerating || showCompletedWheel) overallStep = 3;
  if (canGoToCheckout) overallStep = 4;
  const overallProgress = ((overallStep - 1) / 4) * 100;

  function scrollToStep1() {
    step1Ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const effectiveStyleForPreview = activeDesign?.styleId ?? styleId;

  const showcaseCards = [
    {
      title: "Your photo",
      subtitle: "Clear portrait-style shot",
      image: "/a%20big%20guard%20dog.avif",
      isPhoto: true,
    },
    {
      title: "Gangster",
      subtitle: "Bold and cheeky",
      image: "/gangster.png",
      isPhoto: false,
    },
    {
      title: "Cartoon",
      subtitle: "Bright and playful",
      image: "/cartoon.png",
      isPhoto: false,
    },
    {
      title: "Girlboss",
      subtitle: "Cute and glam",
      image: "/girlboss.png",
      isPhoto: false,
    },
  ] as const;

  const showcaseGrid = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {showcaseCards.map((card) => (
        <div
          key={card.title}
          className="rounded-2xl border border-slate-200 bg-[#fbfaf7] p-3 shadow-sm"
        >
          <div
            className={`overflow-hidden rounded-xl border ${
              card.isPhoto
                ? "border-slate-200 bg-white"
                : "border-slate-100 bg-[#f7f3ec]"
            }`}
          >
            <div className="aspect-square w-full">
              <img
                src={card.image}
                alt={card.title}
                className={`h-full w-full ${
                  card.isPhoto ? "object-cover" : "object-contain p-2"
                }`}
                loading="lazy"
              />
            </div>
          </div>

          <div className="mt-2.5">
            <p className="text-sm font-medium text-slate-900">{card.title}</p>
            <p className="mt-0.5 text-[12px] text-slate-500">{card.subtitle}</p>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f3ec] text-slate-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.28]"
        style={{
          backgroundImage: 'url("/backdrop1.png")',
          backgroundRepeat: "repeat",
          backgroundSize: "760px",
          backgroundPosition: "center top",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[#f7f3ec]/68"
      />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        <TopNav />

        <header className="mb-6 md:mb-8">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-visible rounded-[2rem] border border-white/70 bg-[#f8f3e8]/88 px-5 pb-7 pt-28 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-sm md:px-8 md:pb-10 md:pt-32">
              <img
                src="/peekingdog.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-0 z-20 w-[180px] -translate-x-1/2 translate-y-[12px] drop-shadow-[0_10px_18px_rgba(15,23,42,0.14)] md:w-[240px] md:translate-y-[16px]"
              />

              <div className="relative z-10 text-center">
                <h1 className="mx-auto max-w-3xl text-[2.25rem] font-semibold leading-[0.98] tracking-tight text-slate-950 md:text-6xl">
                  Turn your pet into a bottle worth showing off.
                </h1>

                <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-7 text-slate-600 md:text-lg">
                  Upload your pet photo, choose a style, and preview your
                  personalised bottle before checkout.
                </p>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={scrollToStep1}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 shadow-[0_12px_24px_rgba(251,191,36,0.28)] transition hover:bg-amber-300"
                  >
                    <span>Start your design</span>
                    <span className="text-[13px]">↓</span>
                  </button>
                </div>

                <div className="mt-5">
                  <p className="text-base font-semibold text-slate-900 md:text-lg">
                    £19.99
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600 md:text-sm">
                    Available as a flask or gym bottle
                  </p>
                  <p className="mt-1 text-[12px] text-slate-500 md:text-[13px]">
                    Printed in the UK · Free UK shipping
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

       <section className="mb-5 md:mb-6">
  <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[#f8f3e8]/88 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-sm md:p-6">
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
          Example product
        </p>

        <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-slate-950 md:text-[2rem]">
          From real pet photo to finished bottle
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-[15px]">
          Here’s a real example showing the original pet photo alongside the
          finished personalised bottle. We keep the face, markings and
          personality, then turn it into a clean design that looks great on the
          product.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex rounded-full border border-amber-200/80 bg-[#fbf4e8] px-3 py-1 text-[11px] font-medium text-amber-900">
            Real product example
          </span>
          <span className="inline-flex rounded-full border border-amber-200/80 bg-[#fbf4e8] px-3 py-1 text-[11px] font-medium text-amber-900">
            Printed in the UK
          </span>
          <span className="inline-flex rounded-full border border-amber-200/80 bg-[#fbf4e8] px-3 py-1 text-[11px] font-medium text-amber-900">
            Free UK shipping
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <a
            href="https://www.instagram.com/purepaw.studio/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            <img
              src="/instagram.svg"
              alt="Instagram"
              className="h-4 w-4 object-contain"
            />
            <span>Instagram</span>
          </a>

          <a
            href="https://www.tiktok.com/@purepawstudio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            <img
              src="/tiktok.svg"
              alt="TikTok"
              className="h-4 w-4 object-contain"
            />
            <span>TikTok</span>
          </a>

          <a
            href="https://www.facebook.com/people/PurePaw-Studio/61576452217191/?mibextid=wwXIfr&rdid=OcEVJriDWUkMpoO1&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1AyE5P5g9M%2F%3Fmibextid%3DwwXIfr"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
          >
            <img
              src="/facebook.svg"
              alt="Facebook"
              className="h-4 w-4 object-contain"
            />
            <span>Facebook</span>
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="aspect-[4/5] overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-50">
            <img
              src="/example-dog.jpg"
              alt="Original dog photo in red jumper"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="mt-3">
            <p className="text-sm font-semibold text-slate-900">
              Original photo
            </p>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">
              A clear portrait-style photo gives the strongest final result.
            </p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="aspect-[4/5] overflow-hidden rounded-[1rem] border border-slate-200 bg-white">
            <img
              src="/example-bottle.jpg"
              alt="Finished PurePaw bottle example"
              className="block h-full w-full object-cover"
            />
          </div>
          <div className="mt-3">
            <p className="text-sm font-semibold text-slate-900">
              Finished bottle
            </p>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">
              Designed to look clean, clear and premium on the finished bottle.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

        <section className="mb-5 md:mb-6">
          <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-[#f8f3e8]/88 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-sm md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-800">
                  Style preview
                </p>

                <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-slate-950 md:text-[2rem]">
                  Same pet, different vibes
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">
                  Preview how your pet can look in each of our signature styles.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {["Gangster", "Cartoon", "Girlboss"].map((label) => (
                    <span
                      key={label}
                      className="inline-flex rounded-full border border-amber-200/80 bg-[#fbf4e8] px-3 py-1 text-[11px] font-medium text-amber-900"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowExamples((v) => !v)}
                className="inline-flex self-start items-center gap-2 rounded-full border border-amber-200/90 bg-[#fbf4e8] px-4 py-2.5 text-[13px] font-semibold text-amber-900 transition hover:border-amber-300 hover:bg-amber-50 md:hidden"
              >
                <span>
                  {showExamples ? "Hide style previews" : "Preview our styles"}
                </span>
                <span className="text-[12px]">{showExamples ? "−" : "+"}</span>
              </button>
            </div>

            <div className="mt-4 hidden md:block">{showcaseGrid}</div>
            {showExamples && <div className="mt-4 md:hidden">{showcaseGrid}</div>}

            {!showExamples && (
              <p className="mt-4 text-[12px] text-slate-500 md:hidden">
                Tap above to preview the original photo and all three style
                options.
              </p>
            )}
          </div>
        </section>

        <section ref={step1Ref} className="mb-5">
          <div className="rounded-[1.8rem] border border-white/70 bg-[#f8f3e8]/88 px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-sm md:px-6 md:py-6">
            <div className="text-center">
              <h2 className="text-[1.55rem] font-semibold tracking-tight text-slate-950 md:text-[2rem]">
                Create your live bottle preview
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600 md:text-[15px]">
                Upload your pet photo, choose a style, and preview your bottle
                before checkout.
              </p>
            </div>
          </div>
        </section>

        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {[
              {
                number: 1,
                label: "Upload photo",
                active: step1Active || step2Active || step3Active || step4Active,
              },
              {
                number: 2,
                label: "Check photo",
                active: step2Active || step3Active || step4Active,
              },
              {
                number: 3,
                label: "Create preview",
                active: step3Active || step4Active,
              },
              { number: 4, label: "Checkout", active: step4Active },
            ].map((item) => (
              <div
                key={item.number}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium transition ${
                  item.active
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-slate-200 bg-white/90 text-slate-500"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                    item.active
                      ? "border-amber-300 bg-amber-400 text-slate-900"
                      : "border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {item.number}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-slate-500 sm:hidden">
            Step <span className="font-semibold text-slate-800">{overallStep}</span>{" "}
            of 4
          </p>

          <div className="mx-auto h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[#e8dfcf]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 transition-all duration-300"
              style={{ width: `${Math.max(4, Math.min(overallProgress, 100))}%` }}
            />
          </div>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-[1.08fr,0.92fr] md:gap-8">
          <section className="space-y-6 rounded-[2rem] border border-white/70 bg-[#fcfbf8]/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-6">
            <div>
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                  Step 1
                </p>
                <h2 className="mt-2 text-[1.7rem] font-semibold tracking-tight text-slate-950">
                  Upload your pet photo
                </h2>
                <p className="mt-2 max-w-xl text-[13px] leading-6 text-slate-600">
                  Choose a clear, sharp photo where your pet’s face is easy to
                  see.
                </p>
              </div>

              <div className="space-y-4">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[1.4rem] border border-dashed border-slate-300 bg-[#f6f7f8] px-4 py-10 text-center transition hover:border-amber-400 hover:bg-amber-50/40">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5 text-slate-500"
                      aria-hidden="true"
                    >
                      <path d="M12 16V8" />
                      <path d="m8.5 11.5 3.5-3.5 3.5 3.5" />
                      <path d="M20 16.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.5" />
                    </svg>
                  </div>

                  <span className="text-sm font-medium text-slate-700">
                    Tap to upload
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {previewUrl && (
                  <div className="flex items-start gap-3 rounded-[1.25rem] border border-slate-200 bg-[#f8f8f8] p-3">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <img
                        src={previewUrl}
                        alt="Selected photo preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium text-slate-900">
                        Photo selected ✓
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Next up: run the quick photo check below.
                      </p>
                    </div>
                  </div>
                )}

                <PhotoTipsAccordion />

                {renderQualityMessage()}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f8f8] p-4 md:p-5">
              <div className="mb-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                  Step 2
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">
                  Quick photo check
                </h3>
                <p className="mt-1 text-[12px] leading-5 text-slate-500">
                  We quickly check face visibility, clarity, lighting and framing
                  so you get a stronger result before generating.
                </p>
              </div>

              <button
                className="w-full rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-60 disabled:hover:bg-amber-400"
                onClick={handleCheckQuality}
                disabled={!previewUrl || isChecking}
              >
                {isChecking ? "Checking photo…" : "Check this photo"}
              </button>

              {isChecking && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-1/2 animate-pulse rounded-full bg-amber-300/90" />
                  </div>
                  <p className="mt-2 text-center text-[11px] text-slate-500">
                    Checking face, clarity, lighting and background…
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8f8f8] p-4 md:p-5">
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800">
                  Step 3
                </p>
                <h2 className="mt-2 text-[1.5rem] font-semibold tracking-tight text-slate-950">
                  Choose your style
                </h2>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">
                  Pick the vibe that suits your pet best, then create your live
                  bottle preview.
                </p>
              </div>

              {step1Active && (
                <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-[12px] font-medium text-amber-900">
                    Run the photo check above to unlock this step.
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-amber-800/90">
                    Once it passes, you’ll be able to generate and preview your
                    selected style.
                  </p>
                </div>
              )}

              {!step1Active && (
                <>
                  {qualityResult?.status === "bad" && (
                    <p className="mb-3 text-[11px] text-rose-600">
                      This photo is unlikely to produce a good result. Try a
                      clearer one.
                    </p>
                  )}

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      {
                        id: "gangster" as const,
                        title: "Gangster",
                        subtitle: "Bold and cheeky",
                      },
                      {
                        id: "disney" as const,
                        title: "Cartoon",
                        subtitle: "Bright and playful",
                      },
                      {
                        id: "girlboss" as const,
                        title: "Girlboss",
                        subtitle: "Cute and glam",
                      },
                    ].map((option) => {
                      const active = styleId === option.id;
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => handleStyleClick(option.id)}
                          className={`rounded-[1.3rem] border px-4 py-4 text-left transition ${
                            active
                              ? "border-amber-300 bg-amber-50 shadow-[0_0_0_1px_rgba(251,191,36,0.22)]"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p
                                className={`text-sm font-semibold ${
                                  active ? "text-amber-900" : "text-slate-900"
                                }`}
                              >
                                {option.title}
                              </p>
                              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                                {option.subtitle}
                              </p>
                            </div>

                            <span
                              className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                                active
                                  ? "border-amber-300 bg-amber-400 text-slate-900"
                                  : "border-slate-300 bg-white text-transparent"
                              }`}
                            >
                              •
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-[1.25rem] border border-[#eadfcd] bg-[#fbf8f3] p-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Create your preview
                      </h3>

                      <button
                        type="button"
                        onClick={handleGenerateArt}
                        disabled={disableGenerateButton}
                        className={`w-full rounded-full px-4 py-3 text-sm font-semibold text-slate-900 transition disabled:opacity-60 ${
                          isGenerating
                            ? "bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 shadow-[0_0_25px_rgba(251,191,36,0.4)]"
                            : "bg-amber-400 hover:bg-amber-300"
                        }`}
                      >
                        {generateButtonLabel}
                      </button>

                      <p className="text-[11px] text-slate-500">
                        Usually ready shortly, depending on your photo.
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Designs created:{" "}
                        <span className="font-semibold text-slate-800">
                          {generationCount}/{MAX_GENERATIONS_PER_PHOTO}
                        </span>
                      </p>

                      {showGenerationWheel && (
                        <div className="mt-3 overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm">
                          <GenerationWheel
                            step={genStep}
                            styleLabel={styleId}
                            runId={genRunId}
                            isDone={wheelIsDone}
                          />

                          <div className="px-4 pb-4">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
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
                            <p className="mt-2 text-center text-[11px] text-slate-500">
                              {wheelIsDone
                                ? "Your personalised preview is ready."
                                : "Please keep this tab open — we’re preparing your personalised preview."}
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] leading-5 text-slate-500">
                        We keep your pet’s unique face and markings and prepare a
                        print-ready design for your selected product.
                      </p>

                      {artError && (
                        <p className="text-[11px] text-rose-600">{artError}</p>
                      )}

                      {generatedArtUrl && !artError && (
                        <p className="text-[11px] text-emerald-700">
                          Preview ready ✓ — your bottle preview has been updated.
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

          <section className="flex flex-col rounded-[2rem] border border-white/70 bg-[#fcfbf8]/92 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-sm md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Live PurePaw preview
                </h2>
                <p className="mt-1 text-[11px] text-slate-500">
                  Preview your selected bottle before checkout.
                </p>
              </div>

              <div className="inline-flex rounded-full border border-slate-200 bg-[#f3f4f5] p-1">
                <button
                  type="button"
                  onClick={() => setPreviewProduct("flask")}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    previewProduct === "flask"
                      ? "border border-slate-200 bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Flask
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewProduct("gym")}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    previewProduct === "gym"
                      ? "border border-slate-200 bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Gym bottle
                </button>
              </div>
            </div>

            {previewProduct === "flask" ? (
              <MugPreview
                imageUrl={flaskPreview}
                hasGeneratedArt={!!generatedArtUrl}
                styleId={effectiveStyleForPreview}
              />
            ) : (
              <GymBottlePreview
                imageUrl={flaskPreview}
                hasGeneratedArt={!!generatedArtUrl}
                styleId={effectiveStyleForPreview}
              />
            )}

            <div className="mt-4 rounded-[1.25rem] border border-slate-200 bg-[#f8f8f8] px-4 py-3">
              <p className="text-[12px] text-slate-600">
                Selected vibe:{" "}
                <span className="font-semibold capitalize text-slate-900">
                  {effectiveStyleForPreview === "disney"
                    ? "Cartoon"
                    : effectiveStyleForPreview}
                </span>
              </p>

              {generatedArtUrl ? (
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  This is the design that will be printed on your{" "}
                  {previewProduct === "gym" ? "gym bottle" : "flask"}.
                </p>
              ) : (
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Create your design to see it update live here.
                </p>
              )}
            </div>

            {generatedArtUrl ? (
              <div className="mt-4 rounded-[1.25rem] border border-amber-100 bg-[#fbf4e6]/92 px-4 py-4">
                <p className="text-[12px] font-medium text-amber-900">
                  Preview guidance
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                  Your preview is a close guide to the final product. We may
                  slightly refine sizing or placement during print prep so it
                  looks its best.
                </p>
                <ul className="mt-2 space-y-1 text-[11px] leading-5 text-slate-600">
                  <li>• Clear photos usually give the strongest result</li>
                  <li>• If it feels off, trying another variation is encouraged</li>
                  <li>• You have a limited number of design tries per photo</li>
                </ul>
              </div>
            ) : null}

            {designs.length > 1 && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <h3 className="mb-1 text-xs font-semibold text-slate-900">
                  Your created designs
                </h3>
                <p className="mb-2 text-[11px] text-slate-500">
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
                        className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border bg-white ${
                          isActive
                            ? "border-amber-400 ring-2 ring-amber-400/50"
                            : "border-slate-200 hover:border-slate-400"
                        }`}
                      >
                        <img
                          src={design.imageUrl}
                          alt={`Generated design ${index + 1}`}
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/40 px-1 py-[2px]">
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

            <div className="mt-6 border-t border-slate-200 pt-4">
              <h3 className="mb-2 text-xs font-semibold text-slate-900">
                Your photo
              </h3>

              <div className="flex items-start gap-3">
                {sourcePreview ? (
                  <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={sourcePreview}
                      alt="Original pet photo preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Upload a photo to see it here.
                  </p>
                )}

                <p className="text-[11px] leading-5 text-slate-500">
                  We use your photo as the reference, keep the face and
                  markings, and apply the style you choose.
                </p>
              </div>
            </div>

            {sourcePreview && generatedArtUrl && (
              <div className="mt-6 border-t border-slate-200 pt-4">
                <h3 className="mb-2 text-xs font-semibold text-slate-900">
                  Before / after
                </h3>

                <div
                  className="max-w-sm select-none"
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <img
                      src={sourcePreview}
                      alt="Before"
                      className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                    />

                    <div
                      className="pointer-events-none absolute inset-0 overflow-hidden"
                      style={{ width: `${sliderValue}%` }}
                    >
                      <img
                        src={generatedArtUrl}
                        alt="After"
                        className="pointer-events-none h-full w-full select-none bg-slate-900 object-contain"
                      />
                    </div>

                    <div
                      className="pointer-events-none absolute inset-y-0 flex items-center justify-center"
                      style={{ left: `calc(${sliderValue}% - 1px)` }}
                    >
                      <div className="h-full w-0.5 bg-white/90 shadow-[0_0_6px_rgba(15,23,42,0.45)]" />
                    </div>

                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-black/55 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur md:text-xs">
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

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm">
                  Step 4
                </span>
                <h3 className="text-xs font-semibold text-slate-900">Checkout</h3>
              </div>

              <p className="mb-3 text-[11px] leading-5 text-slate-500">
                When you’re happy with your preview, continue to secure checkout.
              </p>

              <button
                type="button"
                disabled={!canGoToCheckout}
                onClick={handleGoToCheckout}
                className="w-full rounded-full bg-amber-400 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-60 disabled:hover:bg-amber-400"
              >
                {canGoToCheckout
                  ? "Continue to checkout"
                  : "Create a saved design first"}
              </button>

              <p className="mt-3 text-center text-[10px] text-slate-500">
                Powered by <span className="font-semibold text-slate-800">Stripe</span>{" "}
                · Encrypted checkout
              </p>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </main>
  );
}