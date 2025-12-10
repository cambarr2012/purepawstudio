// src/app/p/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StyleKey = "gangster" | "disney" | "girlboss";

export default function QRPage() {
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [styleKey, setStyleKey] = useState<StyleKey>("gangster");

  // AUDIO STATE
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasTriedPlay, setHasTriedPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Read ?img= and ?s= from URL
  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    const imgParam = url.searchParams.get("img");
    const styleParam = url.searchParams.get("s");

    if (!imgParam) {
      setImgUrl(null);
    } else {
      try {
        setImgUrl(decodeURIComponent(imgParam));
      } catch {
        setImgUrl(imgParam);
      }
    }

    if (styleParam) {
      const s = styleParam.toLowerCase();
      if (s === "disney" || s === "girlboss" || s === "gangster") {
        setStyleKey(s as StyleKey);
      }
    }
  }, []);

  // Try to autoplay once when we have img & style
  useEffect(() => {
    if (!imgUrl) return;
    const audio = audioRef.current;
    if (!audio || hasTriedPlay) return;

    setHasTriedPlay(true);

    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [imgUrl, hasTriedPlay]);

  const handleToggleAudio = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.error("Failed to play audio on user gesture", err);
      }
    }
  };

  // Theme per style
  const theme = (() => {
    switch (styleKey) {
      case "disney":
        return {
          inner: "#1f2937",
          outer: "#020617",
          glow: "#60a5fa",
          accent: "#f9a8d4",
          labelBg: "rgba(15,23,42,0.9)",
          labelBorder: "rgba(248,250,252,0.25)",
          labelText: "#e5e7eb",
          title: "Enchanted Portrait",
          subtitle: "A little bit of movie magic, bottled up.",
          emoji: "✨",
        };
      case "girlboss":
        return {
          inner: "#3b1f3f",
          outer: "#05010a",
          glow: "#f973c8",
          accent: "#facc15",
          labelBg: "rgba(24,12,32,0.9)",
          labelBorder: "rgba(252,231,243,0.32)",
          labelText: "#ffe4f5",
          title: "Girlboss Energy",
          subtitle: "Main character era, even at the water bowl.",
          emoji: "💅",
        };
      case "gangster":
      default:
        return {
          inner: "#111827",
          outer: "#020617",
          glow: "#f97316",
          accent: "#22c55e",
          labelBg: "rgba(15,23,42,0.92)",
          labelBorder: "rgba(148,163,184,0.4)",
          labelText: "#e5e7eb",
          title: "Gangster Mode",
          subtitle: "Your pet, fully dripped out on tap.",
          emoji: "😎",
        };
    }
  })();

  // If no img param / still loading
  if (!imgUrl) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0e0e11",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>
            Invalid or missing QR data
          </h1>
          <p style={{ fontSize: "14px", opacity: 0.8, marginBottom: "8px" }}>
            URL should look like:{" "}
            <code>/p?img=&lt;encodedArtworkUrl&gt;&s=gangster</code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        background: "#0e0e11",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Hidden audio element – one file per style */}
      <audio
        ref={audioRef}
        src={`/audio/${styleKey}.mp3`} // gangster.mp3, disney.mp3, girlboss.mp3
        loop
        playsInline
      />

      {/* Local styles – now styleKey-aware via template literal */}
      <style>{`
        @keyframes qr-dance {
          0% { transform: translateY(0) rotate(0deg) scale(1); }
          25% { transform: translateY(-8px) rotate(-1.2deg) scale(1.06); }
          50% { transform: translateY(0) rotate(0deg) scale(1); }
          75% { transform: translateY(-8px) rotate(1.2deg) scale(1.06); }
          100% { transform: translateY(0) rotate(0deg) scale(1); }
        }

        @keyframes qr-glow {
          0% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.08); }
          100% { opacity: 0.35; transform: scale(1); }
        }

        @keyframes bg-orbit-soft {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(12px, -16px, 0) rotate(3deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }

        @keyframes bg-orbit-loud {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(-16px, 18px, 0) rotate(-4deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }

        .qr-art-wrapper {
          position: relative;
          display: inline-block;
          animation: qr-dance 2.4s infinite ease-in-out;
          transform-origin: center bottom;
        }

        .qr-art-wrapper::before {
          content: "";
          position: absolute;
          inset: -20px;
          border-radius: 36px;
          background: radial-gradient(
            circle at 50% 18%,
            ${theme.glow} 0%,
            transparent 60%
          );
          filter: blur(14px);
          opacity: 0.55;
          z-index: 0;
          animation: qr-glow 3.2s infinite ease-in-out;
        }

        .qr-art {
          position: relative;
          z-index: 1;
          width: clamp(320px, 80vw, 540px);
          height: auto;
          display: block;
          margin: 0 auto;
          border-radius: 28px;
          background: radial-gradient(circle at 0% 0%, rgba(15,23,42,0.5), transparent 60%);
          border: 1px solid rgba(248,250,252,0.06);
          box-shadow:
            0 22px 55px rgba(0, 0, 0, 0.75),
            0 0 0 1px rgba(15,23,42,0.8);
        }

        @media (min-width: 768px) {
          .qr-art {
            width: clamp(360px, 32vw, 620px);
          }
        }

        .qr-footer {
          color: #bfbfc7;
          font-size: 13px;
          opacity: 0.8;
        }

        .qr-audio-button {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.18);
          padding: 6px 14px;
          font-size: 12px;
          background: rgba(0,0,0,0.45);
          color: #f9fafb;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: background 0.2s ease, transform 0.1s ease, border-color 0.2s ease;
        }
        .qr-audio-button:hover {
          background: rgba(15,23,42,0.9);
          border-color: rgba(255,255,255,0.28);
          transform: translateY(-1px);
        }
        .qr-audio-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: ${theme.accent};
        }
        .qr-audio-dot.paused {
          background: #f97316;
        }

        .qr-fg-orbit {
          position: absolute;
          inset: -20%;
          pointer-events: none;
          opacity: 0.26;
          mix-blend-mode: screen;
          background:
            radial-gradient(circle at 10% 0%, rgba(255,255,255,0.09), transparent 55%),
            radial-gradient(circle at 85% 90%, rgba(255,255,255,0.07), transparent 55%);
          animation: bg-orbit-soft 18s infinite alternate ease-in-out;
        }

        .qr-fg-orbit-loud {
          position: absolute;
          inset: -25%;
          pointer-events: none;
          opacity: 0.18;
          mix-blend-mode: screen;
          background:
            radial-gradient(circle at 15% 75%, ${theme.glow}22, transparent 60%),
            radial-gradient(circle at 80% 20%, ${theme.accent}22, transparent 60%);
          animation: bg-orbit-loud 26s infinite alternate ease-in-out;
        }

        .qr-style-pill {
          border-radius: 999px;
          padding: 4px 10px;
          font-size: 11px;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          justify-content: center;
        }

        .qr-title {
          font-size: 22px;
          font-weight: 600;
        }

        @media (min-width: 640px) {
          .qr-title {
            font-size: 26px;
          }
        }

        .qr-subtitle {
          font-size: 13px;
          opacity: 0.85;
          max-width: 360px;
          margin: 0 auto;
        }
      `}</style>

      {/* Radial background themed per style */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at top, ${theme.inner} 0%, ${theme.outer} 65%, #000 100%)`,
          zIndex: 0,
        }}
      />
      {/* Subtle moving light fields */}
      <div className="qr-fg-orbit" />
      <div className="qr-fg-orbit-loud" />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: "720px",
        }}
      >
        {/* Style label + title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div
            className="qr-style-pill"
            style={{
              background: theme.labelBg,
              border: `1px solid ${theme.labelBorder}`,
              color: theme.labelText,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
              }}
            >
              {theme.emoji}
            </span>
            <span>PurePaw {styleKey === "girlboss" ? "Girlboss" : styleKey === "disney" ? "Magic" : "Edition"}</span>
          </div>
          <div>
            <h1 className="qr-title" style={{ color: "#f9fafb", marginBottom: 4 }}>
              {theme.title}
            </h1>
            <p className="qr-subtitle" style={{ color: "#cbd5f5" }}>
              {theme.subtitle}
            </p>
          </div>
        </div>

        {/* Artwork */}
        <div className="qr-art-wrapper">
          <img src={imgUrl} alt="Pet Artwork" className="qr-art" />
        </div>

        {/* Audio control */}
        <button
          type="button"
          className="qr-audio-button"
          onClick={handleToggleAudio}
        >
          <span className={`qr-audio-dot ${isPlaying ? "" : "paused"}`} />
          {isPlaying ? "Tap to mute soundtrack" : "Tap for soundtrack"}
        </button>

        <p className="qr-footer">Made with ❤️ by PurePaw Studio</p>
      </div>
    </div>
  );
}
