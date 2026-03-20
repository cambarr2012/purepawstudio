"use client";

import Link from "next/link";

export default function Footer() {
  const linkClass =
    "text-[13px] text-slate-600 transition hover:text-slate-900 hover:underline underline-offset-4";

  return (
    <footer className="relative z-10 mt-10">
      <div className="mx-auto w-full max-w-6xl px-4 pb-8 md:pb-10">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-[#f8f3e8]/88 px-5 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.05)] backdrop-blur-sm md:px-6 md:py-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Support</h2>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                <a
                  href="mailto:support@purepawstudio.com"
                  className="transition hover:text-slate-900 hover:underline underline-offset-4"
                >
                  support@purepawstudio.com
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-sm font-semibold text-slate-900">Legal</h2>
              <div className="mt-2 flex flex-col gap-2">
                <Link href="/privacy" className={linkClass}>
                  Privacy policy
                </Link>
                <Link href="/terms" className={linkClass}>
                  Terms
                </Link>
                <Link href="/cookies" className={linkClass}>
                  Cookie policy
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-[#eadfcd] pt-4">
            <p className="text-[12px] text-slate-500">
              © 2026 PurePaw Studio. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}