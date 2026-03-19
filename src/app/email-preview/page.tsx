// src/app/email-preview/page.tsx
import { buildOrderConfirmationEmail } from "@/lib/email";

export default function EmailPreviewPage() {
  const { html, subject, text } = buildOrderConfirmationEmail({
    firstName: "Cameron",
    orderId: "ord_379404a6-b94c-4189-ba0c-ad5dbd4f8246",
    productType: "flask",
    styleId: "gangster",
    animationUrl:
      "https://purepawstudio.com/p?img=https%3A%2F%2Fxavsuewzbmfwoefeoxkc.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Fartworks%2Fartworks%2Fart_bf6cbbf3cf4ab7b8.png&s=gangster",
  });

  return (
    <main className="min-h-screen bg-stone-200 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 rounded-2xl border border-stone-300 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Email preview
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{subject}</h1>
          <pre className="mt-4 whitespace-pre-wrap overflow-x-auto rounded-xl bg-stone-50 p-4 text-sm text-slate-700">
{text}
          </pre>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-stone-300 bg-white shadow-xl">
          <iframe
            title="Order confirmation email preview"
            srcDoc={html}
            className="h-[1400px] w-full bg-white"
          />
        </div>
      </div>
    </main>
  );
}