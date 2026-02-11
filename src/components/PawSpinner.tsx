"use client";

export function PawSpinner({
  size = 46,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`animate-spin [animation-duration:2.4s] ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <img
        src="/spinningpaw.png"
        alt=""
        className="w-full h-full object-contain select-none pointer-events-none"
        draggable={false}
      />
    </div>
  );
}
