"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

type GooglePurchaseTrackerProps = {
  transactionId: string;
  value: number;
  currency?: string;
  isTest?: boolean;
};

export default function GooglePurchaseTracker({
  transactionId,
  value,
  currency = "GBP",
  isTest = false,
}: GooglePurchaseTrackerProps) {
  useEffect(() => {
    if (!window.gtag) return;

    window.gtag("event", "purchase", {
      transaction_id: transactionId,
      value,
      currency,
      ...(isTest ? { debug_mode: true } : {}),
    });
  }, [transactionId, value, currency, isTest]);

  return null;
}