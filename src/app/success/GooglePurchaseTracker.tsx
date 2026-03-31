"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type GooglePurchaseTrackerProps = {
  transactionId?: string;
  value?: number;
  currency?: string;
};

export default function GooglePurchaseTracker({
  transactionId,
  value = 19.99,
  currency = "GBP",
}: GooglePurchaseTrackerProps) {
  useEffect(() => {
    if (!window.gtag) return;

    window.gtag("event", "purchase", {
      transaction_id: transactionId || `purepaw-${Date.now()}`,
      value,
      currency,
    });
  }, [transactionId, value, currency]);

  return null;
}