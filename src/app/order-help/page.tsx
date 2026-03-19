import type { Metadata } from "next";
import OrderHelpClient from "./OrderHelpClient";

export const metadata: Metadata = {
  title: "Order help and support | PurePaw Studio",
  description:
    "Get help with order updates, delivery questions, damaged items, and support requests for PurePaw Studio orders.",
};

export default function OrderHelpPage() {
  return <OrderHelpClient />;
}