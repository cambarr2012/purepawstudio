"use client";

import { useState, ChangeEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import MugPreview from "./MugPreview";
import GymBottlePreview from "./GymBottlePreview";
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

  const stepLabelClass = (active: boolean) =>
    `text-[11px] ${active ? "text-amber-700" : "text-slate-400"}`;

  let overallStep = 1;
  if (previewUrl) overallStep = 1;
  if (qualityResult && qualityResult.status !== "bad") overallStep = 2;
  if (generatedArtUrl) overallStep = 3;
  const overallProgress = ((overallStep - 1) / 3) * 100;

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
    <main className="min-h-screen bg-[#f7f3ec] text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        <TopNav />

        <header className="mb-6 md:mb-8">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white px-5 py-6 shadow-[0_18px_45px_rgba(15,23,42,0.05)] md:px-8 md:py-8">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: "url('/backdrop.png')",
                  backgroundSize: "520px auto",
                  backgroundPosition: "center",
                  opacity: 0.08,
                }}
              />
              <div className="relative text-center">
                <div className="mb-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800 shadow-sm">
                  Free UK shipping
                </div>

                <h1 className="mx-auto max-w-3xl text-[2rem] font-semibold tracking-tight text-slate-900 leading-[1.05] md:text-5xl">
                  Turn your pet into a bottle worth showing off.
                </h1>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base md:leading-7">
                  Upload a clear portrait photo, choose a vibe, and preview your
                  personalised flask or gym bottle before you order.
                </p>

                <div className="mt-5">
                  <button
                    type="button"
                    onClick={scrollToStep1}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-slate-900 shadow-[0_12px_24px_rgba(251,191,36,0.28)] transition hover:bg-amber-300"
                  >
                    <span>Start your design</span>
                    <span className="text-[13px]">↓</span>
                  </button>
                </div>

                <p className="mt-2.5 text-[11px] text-slate-500">
                  Live preview before checkout
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
                  <span className="font-medium text-slate-900">From £19.99</span>
                  <span className="hidden opacity-30 sm:inline">•</span>
                  <span>Flask or gym bottle</span>
                  <span className="hidden opacity-30 sm:inline">•</span>
                  <span>Printed in the UK</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mb-5 md:mb-6">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] md:p-5">
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: "url('/backdrop.png')",
                backgroundSize: "500px auto",
                backgroundPosition: "center",
                opacity: 0.05,
              }}
            />

            <div className="relative">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600">
                    See example styles
                  </div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                    Same pet, different vibes
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                    Your pet stays recognisable — you just choose the style that
                    fits best.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowExamples((v) => !v)}
                  className="inline-flex self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 md:hidden"
                >
                  {showExamples ? "Hide examples" : "Show examples"}
                </button>
              </div>

              <div className="mt-4 hidden md:block">{showcaseGrid}</div>

              {showExamples && <div className="mt-4 md:hidden">{showcaseGrid}</div>}

              <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3">
                <p className="text-[12px] font-medium text-amber-900">
                  Clear, front-facing photos usually create the strongest result.
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-600">
                  Think visible face, visible eyes, and the pet looking towards
                  the camera rather than side-on.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section ref={step1Ref} className="mb-5">
          <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-b from-white to-[#fbfaf7] px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.05)] md:px-6">
            <div className="text-center">
              <div className="mb-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
                Start your design
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
                Create your own live preview
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Upload a clear, front-facing pet photo below to personalise your
                bottle or flask.
              </p>
            </div>
          </div>
        </section>

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
                Upload photo
              </span>
            </div>

            <div className="hidden h-px w-6 bg-slate-300 sm:block" />

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

            <div className="hidden h-px w-6 bg-slate-300 sm:block" />

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

          <p className="text-center text-[11px] text-slate-500 sm:hidden">
            Step{" "}
            <span className="font-semibold text-slate-800">{overallStep}</span>{" "}
            of 3
          </p>

          <div className="mx-auto h-1.5 w-full max-w-md overflow-hidden rounded-full border border-slate-200 bg-slate-200">
            <div
              className="h-full bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-300 transition-all duration-300"
              style={{ width: `${Math.max(4, Math.min(overallProgress, 100))}%` }}
            />
          </div>
        </div>

        <div className="grid items-start gap-8 md:grid-cols-[1.2fr,1fr]">
          <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-6">
            <div>
              <div className="mb-3 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800">
                Upload a portrait-style pet photo
              </div>

              <h2 className="mb-2 text-lg font-medium text-slate-900">
                Step 1 · Upload your pet photo
              </h2>

              <p className="mb-3 text-[11px] text-slate-500">
                Front-facing portraits work best. Choose a sharp photo with the
                face clearly visible and the pet looking towards the camera.
              </p>

              <div className="space-y-3">
                <h3 className="text-sm font-medium text-slate-900">
                  Pick your favourite photo
                </h3>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-amber-400 hover:bg-amber-50/60">
                  <span className="text-xs uppercase tracking-[0.16em] text-slate-500">
                    Tap to upload
                  </span>
                  <span className="max-w-xs text-[11px] text-slate-500">
                    Best results come from clear portrait-style photos — not
                    side profiles or distant shots.
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
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
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
                      <p className="text-[11px] text-slate-500">
                        Next: run the quick photo check below.
                      </p>
                    </div>
                  </div>
                )}

                <PhotoTipsAccordion />

                {renderQualityMessage()}
              </div>

              <div className="mt-5 border-t border-slate-200 pt-5">
                <h3 className="mb-2 text-sm font-medium text-slate-900">
                  Step 2 · Quick photo check
                </h3>

                <button
                  className="w-full rounded-xl bg-amber-400 px-4 py-3 text-sm font-medium text-slate-900 transition hover:bg-amber-300 disabled:opacity-60 disabled:hover:bg-amber-400"
                  onClick={handleCheckQuality}
                  disabled={!previewUrl || isChecking}
                >
                  {isChecking ? "Checking photo…" : "Check this photo"}
                </button>

                {isChecking && (
                  <div className="mt-2">
                    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200">
                      <div className="h-full w-1/2 animate-pulse bg-amber-300/90" />
                    </div>
                    <p className="mt-1 text-center text-[11px] text-slate-500">
                      Checking face, clarity, lighting and background…
                    </p>
                  </div>
                )}

                <p className="mt-2 text-center text-[11px] text-slate-500">
                  This helps you get a stronger result before you generate.
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h2 className="text-lg font-medium text-slate-900">
                Step 3 · Choose a style &amp; personalise your product
              </h2>

              {step1Active && (
                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                  <p className="text-[12px] font-medium text-amber-900">
                    Run the photo check above to unlock this step.
                  </p>
                  <p className="text-[11px] text-amber-800 opacity-90">
                    Once it passes, you’ll be able to preview your selected style.
                  </p>
                </div>
              )}

              {!step1Active && (
                <>
                  {qualityResult?.status === "bad" && (
                    <p className="mt-3 text-[11px] text-rose-600">
                      This photo is unlikely to produce a good result. Try a
                      clearer front-facing portrait.
                    </p>
                  )}

                  <div className="mt-4 space-y-3">
                    <h3 className="text-sm font-medium text-slate-900">
                      Choose a vibe
                    </h3>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => handleStyleClick("gangster")}
                        className={`rounded-lg border px-3 py-2 text-xs transition md:text-sm ${
                          styleId === "gangster"
                            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]"
                            : "border-slate-200 bg-white hover:border-slate-400"
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
                        className={`rounded-lg border px-3 py-2 text-xs transition md:text-sm ${
                          styleId === "disney"
                            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]"
                            : "border-slate-200 bg-white hover:border-slate-400"
                        }`}
                      >
                        <span className="block">Cartoon</span>
                        <span className="block text-[10px] text-slate-500">
                          Bright &amp; playful
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleStyleClick("girlboss")}
                        className={`rounded-lg border px-3 py-2 text-xs transition md:text-sm ${
                          styleId === "girlboss"
                            ? "border-amber-400 bg-amber-50 text-amber-800 shadow-[0_0_0_1px_rgba(251,191,36,0.4)]"
                            : "border-slate-200 bg-white hover:border-slate-400"
                        }`}
                      >
                        <span className="block">Girlboss</span>
                        <span className="block text-[10px] text-slate-500">
                          Lashes &amp; glam
                        </span>
                      </button>
                    </div>

                    <div className="space-y-2 pt-2">
                      <h3 className="text-sm font-medium text-slate-900">
                        Create your preview
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

                      <p className="text-[11px] text-slate-500">
                        Usually ready shortly — depending on your photo.
                      </p>

                      <p className="text-[11px] text-slate-500">
                        Designs created:{" "}
                        <span className="font-semibold">
                          {generationCount}/{MAX_GENERATIONS_PER_PHOTO}
                        </span>
                        .
                      </p>

                      {isGenerating && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                          <GenerationWheel
                            step={genStep}
                            styleLabel={styleId}
                            runId={genRunId}
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
                              Please keep this tab open — we’re preparing your
                              personalised preview.
                            </p>
                          </div>
                        </div>
                      )}

                      <p className="mt-1 text-[11px] text-slate-500">
                        We keep your pet’s unique face and markings and prepare
                        a print-ready design for your selected product.
                      </p>

                      {artError && (
                        <p className="text-[11px] text-rose-600">{artError}</p>
                      )}

                      {generatedArtUrl && !artError && (
                        <p className="text-[11px] text-emerald-700">
                          Preview ready ✓ — your bottle preview on the right is updated.
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

          <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-sm font-medium text-slate-900">
                Live PurePaw preview
              </h2>

              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
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

            <p className="mt-4 text-[11px] text-slate-500">
              Selected vibe:{" "}
              <span className="font-medium capitalize text-slate-900">
                {effectiveStyleForPreview === "disney"
                  ? "Cartoon"
                  : effectiveStyleForPreview}
              </span>
            </p>

            {generatedArtUrl ? (
              <>
                <p className="mt-1 text-[11px] text-amber-700">
                  This is the design that will be printed on your{" "}
                  {previewProduct === "gym" ? "gym bottle" : "flask"}.
                </p>

                <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-3">
                  <p className="text-[11px] font-medium text-amber-900">
                    Preview guidance
                  </p>
                  <p className="mt-1 text-[10px] leading-5 text-slate-600">
                    Your preview is a close guide to the final product. We may
                    slightly refine sizing or placement during print prep so it
                    looks its best on your bottle.
                  </p>
                  <ul className="mt-2 space-y-1 text-[10px] leading-5 text-slate-600">
                    <li>
                      • Clear front-facing photos usually give the strongest result
                    </li>
                    <li>
                      • If your photo is strong but the preview feels off,
                      trying another variation is encouraged
                    </li>
                    <li>
                      • You have a limited number of design tries per photo
                    </li>
                  </ul>
                  <p className="mt-2 text-[10px] leading-5 text-slate-500">
                    Small print-position refinements are handled for you before
                    production.
                  </p>
                </div>
              </>
            ) : (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-[11px] font-medium text-slate-900">
                  Create your design to see it live here.
                </p>
                <p className="mt-1 text-[10px] leading-5 text-slate-500">
                  You’ll be able to preview your final flask or gym bottle
                  before checkout.
                </p>
              </div>
            )}

            {designs.length > 1 && (
              <div className="mt-5 border-t border-slate-200 pt-4">
                <h3 className="mb-1 text-xs font-medium text-slate-900">
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
              <h3 className="mb-2 text-xs font-medium text-slate-900">
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

                <p className="text-[11px] text-slate-500">
                  We use your photo as the reference, keep the face and
                  markings, and apply the style you choose.
                </p>
              </div>
            </div>

            {sourcePreview && generatedArtUrl && (
              <div className="mt-6 border-t border-slate-200 pt-4">
                <h3 className="mb-2 text-xs font-medium text-slate-900">
                  Before / after (preview)
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
                        className="h-full w-full select-none bg-slate-900 object-contain pointer-events-none"
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
              <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3">
                <p className="text-[11px] font-medium text-emerald-900">
                  Free UK shipping included
                </p>
                <p className="mt-1 text-[10px] leading-5 text-emerald-800">
                  When you’re happy with your preview, continue to secure
                  checkout and we’ll handle the rest.
                </p>
              </div>

              <h3 className="mb-2 text-xs font-medium text-slate-900">
                Step 3 · Checkout
              </h3>

              <p className="mb-3 text-[11px] text-slate-500">
                When you’re happy with your preview, continue to secure checkout.
              </p>

              <button
                type="button"
                disabled={!canGoToCheckout}
                onClick={handleGoToCheckout}
                className="w-full rounded-lg bg-slate-900 py-2.5 text-xs font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {canGoToCheckout
                  ? "Continue to checkout"
                  : "Create a saved design first"}
              </button>

              <p className="mt-3 text-center text-[10px] text-slate-500">
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