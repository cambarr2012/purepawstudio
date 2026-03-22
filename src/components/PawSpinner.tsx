"use client";

export function PawSpinner({
  size = 46,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <>
      <style jsx>{`
        @keyframes pawspinner-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div
        className={className}
        style={{
          width: size,
          height: size,
          animation: "pawspinner-spin 2.4s linear infinite",
          willChange: "transform",
        }}
        aria-hidden="true"
      >
        <img
          src="/spinningpaw.png"
          alt=""
          className="w-full h-full object-contain select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </>
  );
}