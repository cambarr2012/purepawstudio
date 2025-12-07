export const dynamic = "force-dynamic";
export const dynamicParams = true;
export const runtime = "nodejs";
export const fetchCache = "force-no-store";

import Link from "next/link";

export default async function SuccessPage({ searchParams }: any) {
  console.log("[SUCCESS PAGE] RAW searchParams =", searchParams);

  const sessionId = searchParams?.session_id || searchParams?.sessionId || null;

  return (
    <main className="min-h-screen bg-black text-white p-10">
      <h1 className="text-2xl mb-4">DEBUG SUCCESS PAGE</h1>

      <div className="mb-6">
        <p><strong>searchParams JSON:</strong></p>
        <pre className="bg-gray-900 p-4 rounded">
{JSON.stringify(searchParams, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <p><strong>Detected sessionId:</strong> {String(sessionId)}</p>
      </div>

      <Link href="/" className="underline">Back to studio</Link>
    </main>
  );
}
