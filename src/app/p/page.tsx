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
          inner: "#1e293b",
          outer: "#020617",
        };
      case "girlboss":
        return {
          inner: "#3b1f3f",
          outer: "#05010a",
        };
      case "gangster":
      default:
        return {
          inner: "#1b1b22",
          outer: "#0e0e11",
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
            URL should look like: <code>/p?img=&lt;encodedArtworkUrl&gt;&s=gangster</code>
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

      {/* Local styles for animation + responsive sizing */}
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
          50% { opacity: 0.75; transform: scale(1.08); }
          100% { opacity: 0.35; transform: scale(1); }
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
          inset: -18px;
          border-radius: 32px;
          background: radial-gradient(circle at 50% 20%, #f5b14a 0%, transparent 60%);
          filter: blur(12px);
          opacity: 0.5;
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
          filter: drop-shadow(0 12px 35px rgba(0, 0, 0, 0.7));
        }

        @media (min-width: 768px) {
          .qr-art {
            width: clamp(360px, 32vw, 620px);
          }
        }

        .qr-footer {
          color: #bfbfc7;
          font-size: 14px;
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
          background: #22c55e;
        }
        .qr-audio-dot.paused {
          background: #f97316;
        }
      `}</style>

      {/* Radial background themed per style */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at center, ${theme.inner} 0%, ${theme.outer} 80%)`,
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          maxWidth: "640px",
        }}
      >
        <div className="qr-art-wrapper">
          <img src={imgUrl} alt="Pet Artwork" className="qr-art" />
        </div>

        <button
          type="button"
          className="qr-audio-button"
          onClick={handleToggleAudio}
        >
          <span className={`qr-audio-dot ${isPlaying ? "" : "paused"}`} />
          {isPlaying ? "Tap to mute" : "Tap for sound"}
        </button>

        <p className="qr-footer">Made with ❤️ by PurePaw Studio</p>
      </div>
    </div>
  );
}
